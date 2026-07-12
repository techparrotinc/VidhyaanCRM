import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { MODULES } from '@/constants/modules'

export const PATCH = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, params }) => {
    const id = (await params)?.id
    const body = z
      .object({
        name: z.string().trim().min(1).max(200).optional(),
        isActive: z.boolean().optional()
      })
      .parse(await req.json())
    const existing = await db.biometricDevice.findUnique({ where: { id } })
    if (!existing) throw Errors.notFound('Device')
    const device = await db.biometricDevice.update({ where: { id }, data: body })
    return ok({ device: { id: device.id, name: device.name, isActive: device.isActive } })
  }
})

export const DELETE = route({
  module: MODULES.ATTENDANCE,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ db, params }) => {
    const id = (await params)?.id
    const existing = await db.biometricDevice.findUnique({ where: { id } })
    if (!existing) throw Errors.notFound('Device')
    await db.biometricDevice.delete({ where: { id } })
    return ok({ deleted: true })
  }
})
