// Guardian-facing WhatsApp notifications for the schedule module. Same rule
// as every other workflow emitter: fire-and-forget, org template adoption is
// the on/off switch, a notification failure must never fail the caller.

import { format } from 'date-fns'
import type { OrgScopedClient } from '@/lib/db/tenant'
import { notifyWhatsApp, orgDisplayName } from '@/lib/whatsapp/notify'

type SessionForNotify = {
  id: string
  // Exactly one of batchId (cohort session) / studentId (per-student custom
  // schedule session) is set — recipients resolve accordingly.
  batchId: string | null
  studentId: string | null
  courseId: string | null
  startsAt: Date
  meetingLink: string | null
}

// Recipients: a cohort (batch) session notifies every enrolled guardian; a
// per-student custom-schedule session notifies just that student's guardian.
async function enrolledGuardians(
  db: OrgScopedClient,
  session: Pick<SessionForNotify, 'batchId' | 'studentId'>
) {
  const where = session.batchId
    ? { batchId: session.batchId, deletedAt: null, guardianPhone: { not: null } }
    : { id: session.studentId ?? '__none__', deletedAt: null, guardianPhone: { not: null } }
  return db.student.findMany({
    where,
    select: { name: true, guardianName: true, guardianPhone: true }
  })
}

async function batchOrCourseLabel(
  db: OrgScopedClient,
  session: Pick<SessionForNotify, 'batchId' | 'courseId'>
): Promise<string> {
  if (session.batchId) {
    const batch = await db.studentBatch.findUnique({ where: { id: session.batchId }, select: { name: true } })
    if (batch?.name) return batch.name
  }
  if (session.courseId) {
    const course = await db.course.findUnique({ where: { id: session.courseId }, select: { name: true } })
    if (course?.name) return course.name
  }
  return 'your class'
}

export async function notifyClassReminder(
  db: OrgScopedClient,
  orgId: string,
  session: SessionForNotify
): Promise<number> {
  const [guardians, schoolName, label] = await Promise.all([
    enrolledGuardians(db, session),
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
    enrolledGuardians(db, session),
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
    enrolledGuardians(db, session),
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
