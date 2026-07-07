import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const GET = route({
  // Counsellors/receptionists need stages to convert leads to admissions
  // (the modal's required Initial Stage field); writes stay admin-only below.
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ db, user }) => {
    const cacheKey = `pipeline:${user.orgId}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      return NextResponse.json({
        success: true,
        stages: parsed,
        data: parsed
      })
    }

    const stages = await db.admissionStage.findMany({
      where: { orgId: user.orgId },
      orderBy: { sortOrder: 'asc' }
    })

    await redis.set(cacheKey, JSON.stringify(stages), 'EX', 300)

    return NextResponse.json({
      success: true,
      stages,
      data: stages
    })
  }
})

export const POST = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user }) => {
    const body = z.object({
      name: z.string().min(1),
      color: z.string().default('blue'),
      requiresDocs: z.boolean().default(false),
      requiresPayment: z.boolean().default(false)
    }).parse(await req.json())

    const lastStage = await db.admissionStage.findFirst({
      where: { orgId: user.orgId },
      orderBy: { sortOrder: 'desc' }
    })

    const stage = await db.admissionStage.create({
      data: {
        orgId: user.orgId,
        name: body.name,
        color: body.color,
        requiresDocs: body.requiresDocs,
        requiresPayment: body.requiresPayment,
        sortOrder: (lastStage?.sortOrder ?? 0) + 1,
        isWon: false,
        isLost: false
      }
    })

    // Invalidate settings cache
    await redis.del(`pipeline:${user.orgId}`)

    return created(stage)
  }
})
