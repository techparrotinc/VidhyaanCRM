import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { UserRole, UserStatus, Prisma } from '@prisma/client'
import { cleanPhoneNumber } from '@/lib/utils'
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
      name: z.string().min(1).optional(),
      email: z.string().email('A valid email is required').optional(),
      phone: z.preprocess(
        cleanPhoneNumber,
        z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number')
      ).optional(),
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

    const runUpdate = () => prisma.$transaction(async (tx) => {
      if (body.role) {
        // Keep branch grants in step with the role: grant rows carry the
        // role, and a freshly-minted BRANCH_ADMIN needs at least the main
        // branch or fail-closed scoping strands them.
        await tx.userBranchAccess.updateMany({
          where: { userId: target.id },
          data: { role: body.role as UserRole }
        })
        if (body.role === 'BRANCH_ADMIN') {
          const hasGrant = await tx.userBranchAccess.count({
            where: { userId: target.id }
          })
          if (hasGrant === 0) {
            const main = await tx.branch.findFirst({
              where: { orgId: user.orgId, isDefault: true, deletedAt: null },
              select: { id: true }
            })
            if (main) {
              await tx.userBranchAccess.create({
                data: { userId: target.id, branchId: main.id, role: 'BRANCH_ADMIN' }
              })
            }
          }
        }
      }
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
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.email !== undefined ? { email: body.email } : {}),
          ...(body.phone !== undefined ? { phone: body.phone as string } : {}),
          status: body.status === 'INACTIVE'
            ? ('DEACTIVATED' as UserStatus)
            : body.status ? (body.status as UserStatus) : undefined
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true
        }
      })
    })

    let updated
    try {
      updated = await runUpdate()
    } catch (err) {
      // email/phone are unique across users — surface a clean conflict.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const field = (err.meta?.target as string[] | undefined)?.includes('email') ? 'email address' : 'phone number'
        throw Errors.conflict(`That ${field} is already used by another user.`)
      }
      throw err
    }

    if (assignmentIdToRevoke) {
      await revokeAssignment(target.id, assignmentIdToRevoke)
    }

    if (body.status === 'INACTIVE') {
      await revokeUser(params!.id as string)
    } else if (body.status === 'ACTIVE') {
      await clearUserRevocation(params!.id as string)
    }

    // Invalidate counsellors + branch-scope caches
    await redis.del(`counsellors:${user.orgId}`)
    try {
      await redis.del(`user:${target.id}:branch-ids`)
    } catch (err) {
      console.error('User branch cache bust:', err)
    }

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
