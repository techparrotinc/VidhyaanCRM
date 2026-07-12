// Turns raw BiometricEvent rows into AttendanceRecord upserts. Runs on the
// base client — callers are the public device-ingest route (device key is
// the security boundary) and the identity-mapping admin route (retro-match);
// both pass an orgId they have already verified.

import { prisma } from '@/lib/db/client'
import { istDateString } from '@/lib/reports/rollup'
import { toDbDate, dbDateToString } from './dates'
import { sendAbsenceAlerts } from './alerts'

/**
 * Processes PENDING events that already carry a studentId. First punch of a
 * (student, IST day) sets PRESENT + checkInAt; later punches only advance
 * checkOutAt. A manually marked status is never overwritten.
 */
export async function processBiometricEvents(orgId: string, eventIds: string[]): Promise<number> {
  if (eventIds.length === 0) return 0
  const events = await prisma.biometricEvent.findMany({
    where: { id: { in: eventIds }, orgId, status: 'PENDING', studentId: { not: null } },
    orderBy: { eventAt: 'asc' }
  })
  let processed = 0

  for (const event of events) {
    const dateStr = istDateString(event.eventAt)
    const date = toDbDate(dateStr)
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        orgId_studentId_date_sessionKey: {
          orgId, studentId: event.studentId!, date, sessionKey: 'DAY'
        }
      }
    })

    if (!existing) {
      await prisma.attendanceRecord.create({
        data: {
          orgId,
          studentId: event.studentId!,
          date,
          sessionKey: 'DAY',
          status: 'PRESENT',
          source: 'BIOMETRIC',
          checkInAt: event.eventAt,
          checkOutAt: event.direction === 'out' ? event.eventAt : null
        }
      })
    } else if (existing.source === 'BIOMETRIC') {
      await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          checkInAt:
            existing.checkInAt && existing.checkInAt <= event.eventAt
              ? existing.checkInAt
              : event.eventAt,
          checkOutAt:
            existing.checkOutAt && existing.checkOutAt >= event.eventAt
              ? existing.checkOutAt
              : event.eventAt
        }
      })
    }
    // MANUAL/API record exists → punch only marks the event consumed.

    await prisma.biometricEvent.update({
      where: { id: event.id },
      data: { status: 'PROCESSED' }
    })
    processed++
  }
  return processed
}
