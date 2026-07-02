import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { UserRole, UserStatus } from '@prisma/client'
import { redis } from '@/lib/redis'
import { revokeUser, clearUserRevocation, revokeAssignment } from '@/lib/auth/roleRevocation'
import { resolveTargetUserRole } from '@/lib/auth/resolveTargetUserRole'

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
        status: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    if (!targetUser) {
      throw Errors.notFound('User')
    }

    const resolvedRole = await resolveTargetUserRole(targetUser.id, user.orgId)
    return ok({ ...targetUser, role: resolvedRole })
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

    let assignmentIdToRevoke: string | null = null

    const updated = await prisma.$transaction(async (tx) => {
      if (body.role) {
        const currentAssignment = await tx.userRoleAssignment.findFirst({
          where: { userId: target.id, orgId: user.orgId, status: 'ACTIVE' }
        })

        if (currentAssignment) {
          if (currentAssignment.role !== body.role) {
            await tx.userRoleAssignment.update({
              where: { id: currentAssignment.id },
              data: { status: 'REVOKED' }
            })

            await tx.userRoleAssignment.create({
              data: {
                userId: target.id,
                role: body.role,
                orgId: user.orgId,
                status: 'ACTIVE',
                isDefault: true
              }
            })

            assignmentIdToRevoke = currentAssignment.id
          }
        } else {
          await tx.userRoleAssignment.create({
            data: {
              userId: target.id,
              role: body.role,
              orgId: user.orgId,
              status: 'ACTIVE',
              isDefault: true
            }
          })
        }
      }

      return await tx.user.update({
        where: { id: params?.id },
        data: {
          status: body.status === 'INACTIVE' 
            ? ('DEACTIVATED' as UserStatus)
            : body.status ? (body.status as UserStatus) : undefined
        },
        select: {
          id: true,
          name: true,
          status: true
        }
      })
    })

    if (assignmentIdToRevoke) {
      await revokeAssignment(target.id, assignmentIdToRevoke)
    }

    if (body.status === 'INACTIVE') {
      await revokeUser(params!.id as string)
    } else if (body.status === 'ACTIVE') {
      await clearUserRevocation(params!.id as string)
    }

    // Invalidate counsellors cache
    await redis.del(`counsellors:${user.orgId}`)

    const resolvedRole = await resolveTargetUserRole(target.id, user.orgId)
    return ok({ ...updated, role: resolvedRole })
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

    const targetResolvedRole = await resolveTargetUserRole(target.id, user.orgId)
    if (targetResolvedRole === 'ORG_ADMIN') {
      throw Errors.businessRule('Cannot deactivate an Org Admin')
    }

    await prisma.user.update({
      where: { id: params?.id },
      data: {
        status: 'DEACTIVATED' as UserStatus,
        deletedAt: new Date()
      }
    })

    await revokeUser(params!.id as string)

    // Invalidate counsellors cache
    await redis.del(`counsellors:${user.orgId}`)

    return ok({
      deactivated: true,
      message: target.name + ' has been deactivated'
    })
  }
})
