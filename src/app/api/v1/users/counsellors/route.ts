import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export const GET = route({
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ user }) => {
    const cacheKey = `counsellors:${user.orgId}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      return NextResponse.json({
        success: true,
        counsellors: parsed,
        data: parsed
      })
    }

    const counsellors = await prisma.user.findMany({
      where: {
        orgId: user.orgId,
        role: {
          in: [
            'COUNSELLOR',
            'BRANCH_ADMIN',
            'ORG_ADMIN'
          ]
        },
        status: 'ACTIVE',
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        phone: true
      },
      orderBy: { name: 'asc' }
    })

    await redis.set(cacheKey, JSON.stringify(counsellors), 'EX', 120)

    return NextResponse.json({
      success: true,
      counsellors,
      data: counsellors
    })
  }
})
