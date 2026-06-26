import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { redis } from '@/lib/redis'

export const PUT = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user }) => {
    const body = z.object({
      stages: z.array(z.object({
        id: z.string(),
        order: z.number()
      }))
    }).parse(await req.json())

    await Promise.all(
      body.stages.map(s =>
        db.admissionStage.update({
          where: { id: s.id, orgId: user.orgId },
          data: { sortOrder: s.order }
        })
      )
    )

    const updated = await db.admissionStage.findMany({
      where: { orgId: user.orgId },
      orderBy: { sortOrder: 'asc' }
    })

    // Invalidate settings cache
    await redis.del(`pipeline:${user.orgId}`)

    return ok(updated)
  }
})
