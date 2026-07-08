import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { redis } from '@/lib/redis'
import { UserRole } from '@prisma/client'
import { resolveTargetUserRole } from '@/lib/auth/resolveTargetUserRole'

// Branch assignment / transfer (multi-branch-architecture.md Phase 2).
// Replaces the target user's UserBranchAccess grants. Takes effect without
// re-login: compose.ts re-reads grants per request (Redis cache busted here).

export const GET = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ params, user }) => {
    const grants = await prisma.userBranchAccess.findMany({
      where: {
        userId: params?.id,
        user: { orgId: user.orgId },
        branch: { deletedAt: null }
      },
      select: { branchId: true, branch: { select: { name: true } } }
    })
    return ok(grants.map(g => ({ id: g.branchId, name: g.branch.name })))
  }
})

export const PUT = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, params, user }) => {
    const { branchIds } = z.object({
      branchIds: z.array(z.string().min(1)).max(50)
    }).parse(await req.json())

    const target = await prisma.user.findFirst({
      where: { id: params?.id, orgId: user.orgId, deletedAt: null }
    })
    if (!target) throw Errors.notFound('User')

    const targetRole = await resolveTargetUserRole(target.id, user.orgId)
    if (targetRole === 'ORG_ADMIN') {
      throw Errors.businessRule('Group admins always have access to every branch')
    }
    if (targetRole === 'BRANCH_ADMIN' && branchIds.length === 0) {
      throw Errors.businessRule('A branch admin must be assigned to at least one branch')
    }

    // Every requested branch must be a live branch of this org
    const valid = await prisma.branch.findMany({
      where: { id: { in: branchIds }, orgId: user.orgId, deletedAt: null },
      select: { id: true, name: true }
    })
    if (valid.length !== branchIds.length) {
      throw Errors.businessRule('One or more branches were not found')
    }

    const before = await prisma.userBranchAccess.findMany({
      where: { userId: target.id },
      select: { branchId: true }
    })

    await prisma.$transaction(async (tx) => {
      await tx.userBranchAccess.deleteMany({ where: { userId: target.id } })
      if (branchIds.length > 0) {
        await tx.userBranchAccess.createMany({
          data: branchIds.map(branchId => ({
            userId: target.id,
            branchId,
            role: (targetRole ?? 'COUNSELLOR') as UserRole
          }))
        })
      }
      await tx.auditLog.create({
        data: {
          orgId: user.orgId,
          userId: user.id,
          action: 'PERMISSION_CHANGE',
          entityType: 'UserBranchAccess',
          entityId: target.id,
          before: { branchIds: before.map(b => b.branchId) },
          after: { branchIds }
        }
      })
    })

    // New scope applies on the target's next request
    try {
      await redis.del(`user:${target.id}:branch-ids`)
    } catch (err) {
      console.error('User branch cache bust:', err)
    }

    return ok({
      userId: target.id,
      branches: valid.filter(b => branchIds.includes(b.id))
    })
  }
})
