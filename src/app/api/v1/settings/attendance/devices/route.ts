import { z } from 'zod'
import { createHash, randomBytes } from 'crypto'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { MODULES } from '@/constants/modules'

const deviceSelect = {
  id: true, name: true, vendor: true, serialNumber: true,
  apiKeyPrefix: true, isActive: true, lastSeenAt: true, createdAt: true,
  _count: { select: { identities: true } }
} as const

export const GET = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ db }) => {
    const devices = await db.biometricDevice.findMany({
      select: deviceSelect,
      orderBy: { createdAt: 'desc' }
    })
    return ok({ devices })
  }
})

const postSchema = z.object({
  name: z.string().trim().min(1).max(200),
  vendor: z.string().trim().max(100).optional(),
  serialNumber: z.string().trim().max(200).optional()
})

export const POST = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user }) => {
    const body = postSchema.parse(await req.json())

    // Token shown exactly once; only its hash is stored.
    const token = `vbd_${randomBytes(24).toString('hex')}`
    const device = await db.biometricDevice.create({
      data: {
        orgId: user.orgId,
        name: body.name,
        vendor: body.vendor,
        serialNumber: body.serialNumber,
        apiKeyPrefix: token.slice(0, 12),
        apiKeyHash: createHash('sha256').update(token).digest('hex')
      },
      select: deviceSelect
    })
    return created({ device, deviceKey: token })
  }
})
