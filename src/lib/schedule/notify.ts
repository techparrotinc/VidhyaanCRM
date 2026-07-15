// Guardian-facing WhatsApp notifications for the schedule module. Same rule
// as every other workflow emitter: fire-and-forget, org template adoption is
// the on/off switch, a notification failure must never fail the caller.

import { format } from 'date-fns'
import type { OrgScopedClient } from '@/lib/db/tenant'
import { notifyWhatsApp, orgDisplayName } from '@/lib/whatsapp/notify'

type SessionForNotify = {
  id: string
  batchId: string
  courseId: string | null
  startsAt: Date
  meetingLink: string | null
}

async function enrolledGuardians(db: OrgScopedClient, batchId: string) {
  return db.student.findMany({
    where: { batchId, deletedAt: null, guardianPhone: { not: null } },
    select: { name: true, guardianName: true, guardianPhone: true }
  })
}

async function batchOrCourseLabel(
  db: OrgScopedClient,
  session: Pick<SessionForNotify, 'batchId' | 'courseId'>
): Promise<string> {
  const batch = await db.studentBatch.findUnique({ where: { id: session.batchId }, select: { name: true } })
  return batch?.name ?? 'your class'
}

export async function notifyClassReminder(
  db: OrgScopedClient,
  orgId: string,
  session: SessionForNotify
): Promise<number> {
  const [guardians, schoolName, label] = await Promise.all([
    enrolledGuardians(db, session.batchId),
    orgDisplayName(orgId),
    batchOrCourseLabel(db, session)
  ])
  let sent = 0
  for (const g of guardians) {
    notifyWhatsApp({
      orgId,
      template: 'class_reminder',
      phone: g.guardianPhone,
      values: {
        parentName: g.guardianName || 'Parent',
        kidName: g.name,
        batch: label,
        date: format(session.startsAt, 'd MMM yyyy'),
        time: format(session.startsAt, 'h:mm a'),
        link: session.meetingLink || '-',
        schoolName
      },
      ref: `class_reminder:${session.id}`
    })
    sent++
  }
  return sent
}

export async function notifyClassCancelled(
  db: OrgScopedClient,
  orgId: string,
  session: SessionForNotify,
  reason: string
): Promise<number> {
  const [guardians, schoolName, label] = await Promise.all([
    enrolledGuardians(db, session.batchId),
    orgDisplayName(orgId),
    batchOrCourseLabel(db, session)
  ])
  let sent = 0
  for (const g of guardians) {
    notifyWhatsApp({
      orgId,
      template: 'class_cancelled',
      phone: g.guardianPhone,
      values: {
        parentName: g.guardianName || 'Parent',
        kidName: g.name,
        batch: label,
        date: format(session.startsAt, 'd MMM yyyy'),
        time: format(session.startsAt, 'h:mm a'),
        reason,
        schoolName
      },
      ref: `class_cancelled:${session.id}`
    })
    sent++
  }
  return sent
}

export async function notifyClassRescheduled(
  db: OrgScopedClient,
  orgId: string,
  session: SessionForNotify,
  previousStartsAt: Date
): Promise<number> {
  const [guardians, schoolName, label] = await Promise.all([
    enrolledGuardians(db, session.batchId),
    orgDisplayName(orgId),
    batchOrCourseLabel(db, session)
  ])
  let sent = 0
  for (const g of guardians) {
    notifyWhatsApp({
      orgId,
      template: 'class_rescheduled',
      phone: g.guardianPhone,
      values: {
        parentName: g.guardianName || 'Parent',
        kidName: g.name,
        batch: label,
        oldDate: format(previousStartsAt, 'd MMM yyyy, h:mm a'),
        date: format(session.startsAt, 'd MMM yyyy'),
        time: format(session.startsAt, 'h:mm a'),
        schoolName
      },
      ref: `class_rescheduled:${session.id}`
    })
    sent++
  }
  return sent
}
