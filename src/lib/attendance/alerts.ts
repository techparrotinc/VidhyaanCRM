// Guardian absence alerts — fired fire-and-forget after a register save or
// biometric ingest. Once-only per record via alertSentAt; only today's marks
// alert (editing history must not message parents days later).

import { prisma } from '@/lib/db/client'
import { createNotification } from '@/lib/services/notifications'
import { sendPush } from '@/lib/push/send'
import { sendMeteredSms, sendMeteredWhatsApp } from '@/lib/credits/metered-send'
import { buildTemplateParameters } from '@/lib/campaign/templateParams'
import { istDateString } from '@/lib/reports/rollup'
import { cleanPhoneNumber } from '@/lib/utils'
import { resolveAttendanceSettings } from './settings'

export async function sendAbsenceAlerts(
  orgId: string,
  dateStr: string,
  recordIds: string[]
): Promise<void> {
  if (recordIds.length === 0) return
  if (dateStr !== istDateString()) return

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, settings: true }
  })
  if (!org) return
  const settings = resolveAttendanceSettings(org.settings)
  if (!settings.absenceAlerts.enabled) return

  const records = await prisma.attendanceRecord.findMany({
    where: { id: { in: recordIds }, orgId, status: 'ABSENT', alertSentAt: null },
    include: {
      student: { select: { id: true, name: true, guardianPhone: true, phoneNormalized: true } }
    }
  })
  if (records.length === 0) return

  const template = settings.absenceAlerts.whatsapp
    ? await prisma.whatsappTemplate.findFirst({
        where: { orgId, category: 'ATTENDANCE', status: { in: ['VERIFIED', 'SYNCED'] }, deletedAt: null },
        orderBy: { createdAt: 'desc' }
      })
    : null

  const displayDate = new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  })
  const sentIds: string[] = []

  for (const rec of records) {
    const { student } = rec
    try {
      if (settings.absenceAlerts.portal) {
        const parent = await prisma.parent.findFirst({
          where: {
            deletedAt: null,
            OR: [
              { guardianLinks: { some: { studentId: student.id, status: 'ACTIVE' } } },
              ...(student.guardianPhone ? [{ phone: student.guardianPhone }] : [])
            ]
          },
          select: { id: true, userId: true }
        })
        if (parent) {
          await createNotification({
            orgId,
            recipientType: 'PARENT',
            recipientId: parent.id,
            type: 'STUDENT_ABSENT',
            title: `${student.name} was marked absent`,
            body: `${student.name} was marked absent at ${org.name} on ${displayDate}. If this is unexpected, please contact the office.`,
            data: { href: '/parent/attendance', studentId: student.id, date: dateStr }
          })
          if (parent.userId) {
            void sendPush([parent.userId], {
              title: `${student.name} was marked absent`,
              body: `Absent at ${org.name} on ${displayDate}.`,
              data: { url: '/(parent)/attendance', studentId: student.id }
            })
          }
        }
      }

      const phone = cleanPhoneNumber(student.guardianPhone ?? '') as string
      if (phone && phone.length >= 10) {
        if (template) {
          const parameters = buildTemplateParameters(template.variables, {
            kidName: student.name,
            schoolName: org.name,
            date: displayDate
          })
          await sendMeteredWhatsApp(
            orgId, phone, template.msg91TemplateId, '', `attendance:${rec.id}`,
            {
              language: template.language,
              parameters: parameters ?? undefined,
              credits: template.metaCategory === 'MARKETING' ? 2 : 1
            }
          ).catch(err => console.error('attendance WA alert failed:', err?.message ?? err))
        }
        if (settings.absenceAlerts.sms) {
          await sendMeteredSms(
            orgId, phone,
            `${student.name} was marked absent at ${org.name} on ${displayDate}. - ${org.name}`,
            `attendance:${rec.id}`
          ).catch(err => console.error('attendance SMS alert failed:', err?.message ?? err))
        }
      }
      sentIds.push(rec.id)
    } catch (err) {
      console.error(`absence alert failed for record ${rec.id}:`, err)
    }
  }

  if (sentIds.length > 0) {
    await prisma.attendanceRecord.updateMany({
      where: { id: { in: sentIds }, alertSentAt: null },
      data: { alertSentAt: new Date() }
    })
  }
}
