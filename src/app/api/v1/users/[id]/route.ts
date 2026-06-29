import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { UserRole, UserStatus } from '@prisma/client'
import { redis } from '@/lib/redis'

export const GET = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ params, user }) => {
    const targetUser = await prisma.user.findFirst({
      where: {
        id: params?.id,
        orgId: user.orgId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    if (!targetUser) {
      throw Errors.notFound('User')
    }

    return ok(targetUser)
  }
})

export const PUT = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, params, user }) => {
    const body = z.object({
      role: z.enum([
        'BRANCH_ADMIN',
        'COUNSELLOR',
        'RECEPTIONIST',
        'ACCOUNTANT',
        'TEACHER'
      ]).optional(),
      status: z.enum([
        'ACTIVE', 'INACTIVE'
      ]).optional()
    }).parse(await req.json())

    const target = await prisma.user.findFirst({
      where: {
        id: params?.id,
        orgId: user.orgId,
        deletedAt: null
      }
    })

    if (!target) {
      throw Errors.notFound('User')
    }

    if (target.id === user.id) {
      throw Errors.businessRule('You cannot modify your own account')
    }

    const updated = await prisma.user.update({
      where: { id: params?.id },
      data: {
        role: body.role ? (body.role as UserRole) : undefined,
        status: body.status === 'INACTIVE' 
          ? ('DEACTIVATED' as UserStatus)
          : body.status ? (body.status as UserStatus) : undefined
      },
      select: {
        id: true,
        name: true,
        role: true,
        status: true
      }
    })

    // Invalidate counsellors cache
    await redis.del(`counsellors:${user.orgId}`)

    return ok(updated)
  }
})

export const DELETE = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ params, user }) => {
    const target = await prisma.user.findFirst({
      where: {
        id: params?.id,
        orgId: user.orgId,
        deletedAt: null
      }
    })

    if (!target) {
      throw Errors.notFound('User')
    }

    if (target.id === user.id) {
      throw Errors.businessRule('You cannot deactivate yourself')
    }

    if (target.role === 'ORG_ADMIN') {
      throw Errors.businessRule('Cannot deactivate an Org Admin')
    }

    await prisma.user.update({
      where: { id: params?.id },
      data: {
        status: 'DEACTIVATED' as UserStatus,
        deletedAt: new Date()
      }
    })

    // Invalidate counsellors cache
    await redis.del(`counsellors:${user.orgId}`)

    return ok({
      deactivated: true,
      message: target.name + ' has been deactivated'
    })
  }
})
