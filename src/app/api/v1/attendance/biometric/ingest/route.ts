// Public push endpoint for biometric attendance devices. No session — the
// per-device key (sha256-matched against BiometricDevice.apiKeyHash) is the
// security boundary, same trust model as payment webhooks. Body is a
// normalized JSON batch; vendor-native formats (ESSL/Realtime) get adapter
// layers later.
//
//   POST /api/v1/attendance/biometric/ingest
//   headers: x-device-key: vbd_...
//   body: { records: [{ deviceUserId, timestamp, direction? }] }

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'crypto'
import { prisma } from '@/lib/db/client'
import { processBiometricEvents } from '@/lib/attendance/biometric'

const bodySchema = z.object({
  records: z
    .array(
      z.object({
        deviceUserId: z.string().trim().min(1).max(100),
        timestamp: z.coerce.date(),
        direction: z.enum(['in', 'out']).optional()
      })
    )
    .min(1)
    .max(1000)
})

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-device-key')
  if (!key) {
    return NextResponse.json({ success: false, error: 'Missing device key' }, { status: 401 })
  }
  const device = await prisma.biometricDevice.findUnique({
    where: { apiKeyHash: createHash('sha256').update(key).digest('hex') }
  })
  if (!device || !device.isActive) {
    return NextResponse.json({ success: false, error: 'Invalid device key' }, { status: 401 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: err.flatten() },
        { status: 422 }
      )
    }
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  await prisma.biometricDevice.update({
    where: { id: device.id },
    data: { lastSeenAt: new Date() }
  })

  // Map device user ids → students (device-specific mapping wins, org-wide fallback).
  const deviceUserIds = [...new Set(body.records.map(r => r.deviceUserId))]
  const identities = await prisma.biometricIdentity.findMany({
    where: { orgId: device.orgId, deviceUserId: { in: deviceUserIds } }
  })
  const studentByDeviceUser = new Map(identities.map(i => [i.deviceUserId, i.studentId]))

  // Idempotent raw log: unique (deviceId, deviceUserId, eventAt) absorbs re-pushes.
  await prisma.biometricEvent.createMany({
    data: body.records.map(r => ({
      orgId: device.orgId,
      deviceId: device.id,
      deviceUserId: r.deviceUserId,
      eventAt: r.timestamp,
      direction: r.direction,
      status: studentByDeviceUser.has(r.deviceUserId) ? 'PENDING' : 'UNMATCHED',
      studentId: studentByDeviceUser.get(r.deviceUserId) ?? null
    })),
    skipDuplicates: true
  })

  const pending = await prisma.biometricEvent.findMany({
    where: { deviceId: device.id, status: 'PENDING' },
    select: { id: true }
  })
  const processed = await processBiometricEvents(device.orgId, pending.map(e => e.id))
  const unmatched = deviceUserIds.filter(id => !studentByDeviceUser.has(id))

  return NextResponse.json({
    success: true,
    data: { received: body.records.length, processed, unmatched }
  })
}
