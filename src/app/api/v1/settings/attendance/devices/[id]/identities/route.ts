import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { MODULES } from '@/constants/modules'
import { processBiometricEvents } from '@/lib/attendance/biometric'

/** Identity mappings for a device + its still-unmatched punch events. */
export const GET = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ db, user, params }) => {
    const deviceId = (await params)?.id
    const device = await db.biometricDevice.findUnique({ where: { id: deviceId } })
    if (!device) throw Errors.notFound('Device')

    const [identities, unmatched] = await Promise.all([
      db.biometricIdentity.findMany({
        where: { OR: [{ deviceId }, { deviceId: null }] },
        include: { student: { select: { id: true, name: true, studentCode: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      // BiometricEvent is written by the public ingest via the base client;
      // scope reads explicitly.
      prisma.biometricEvent.groupBy({
        by: ['deviceUserId'],
        where: { orgId: user.orgId, deviceId, status: 'UNMATCHED' },
        _count: { _all: true },
        _max: { eventAt: true }
      })
    ])
    return ok({
      identities,
      unmatched: unmatched.map(u => ({
        deviceUserId: u.deviceUserId,
        events: u._count._all,
        lastEventAt: u._max.eventAt
      }))
    })
  }
})

const postSchema = z.object({
  deviceUserId: z.string().trim().min(1).max(100),
  studentId: z.string().min(1)
})

export const POST = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user, params }) => {
    const deviceId = (await params)?.id
    const body = postSchema.parse(await req.json())

    const [device, student] = await Promise.all([
      db.biometricDevice.findUnique({ where: { id: deviceId } }),
      db.student.findUnique({ where: { id: body.studentId }, select: { id: true } })
    ])
    if (!device) throw Errors.notFound('Device')
    if (!student) throw Errors.notFound('Student')

    const identity = await db.biometricIdentity.upsert({
      where: { orgId_deviceUserId: { orgId: user.orgId, deviceUserId: body.deviceUserId } },
      create: { orgId: user.orgId, deviceId, deviceUserId: body.deviceUserId, studentId: body.studentId },
      update: { studentId: body.studentId, deviceId },
      include: { student: { select: { id: true, name: true, studentCode: true } } }
    })

    // Retro-match unmatched events for this device user id, then convert
    // them into attendance records.
    await prisma.biometricEvent.updateMany({
      where: { orgId: user.orgId, deviceUserId: body.deviceUserId, status: 'UNMATCHED' },
      data: { status: 'PENDING', studentId: body.studentId }
    })
    const pending = await prisma.biometricEvent.findMany({
      where: { orgId: user.orgId, deviceUserId: body.deviceUserId, status: 'PENDING' },
      select: { id: true }
    })
    await processBiometricEvents(user.orgId, pending.map(e => e.id))

    return created({ identity })
  }
})

export const DELETE = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db }) => {
    const body = z.object({ identityId: z.string().min(1) }).parse(await req.json())
    const identity = await db.biometricIdentity.findUnique({ where: { id: body.identityId } })
    if (!identity) throw Errors.notFound('Identity')
    await db.biometricIdentity.delete({ where: { id: body.identityId } })
    return ok({ deleted: true })
  }
})
