import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { AuditAction, Prisma } from '@prisma/client'
import { logAudit } from '@/lib/audit/log'
import {
  resolveRetentionDays,
  normaliseRetentionDays,
  RETENTION_PRESETS,
} from '@/lib/audit/retention'

/**
 * GET /api/v1/settings/activity-log — org-scoped activity feed for the org
 * admin. Reads the platform `audit_logs` table filtered to the caller's org;
 * never returns cross-org rows. Actor names resolved via soft-reference lookup.
 *
 * Filters: userId, action, entityType, dateFrom, dateTo, q (entityId/type
 * substring), page, limit.
 */
export const GET = route({
  // Audit rows carry no branch column, so scoping is org-wide — kept to
  // ORG_ADMIN to avoid exposing cross-branch activity to a branch admin.
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, user }) => {
    const sp = req.nextUrl.searchParams
    const userId = sp.get('userId')
    const action = sp.get('action')
    const entityType = sp.get('entityType')
    const dateFrom = sp.get('dateFrom')
    const dateTo = sp.get('dateTo')
    const q = sp.get('q')?.trim()
    const page = Math.max(1, parseInt(sp.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '25') || 25))

    const where: Prisma.AuditLogWhereInput = { orgId: user.orgId }
    if (userId) where.userId = userId
    if (action && action in AuditAction) where.action = action as AuditAction
    if (entityType) where.entityType = entityType
    if (q) {
      where.OR = [
        { entityType: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const [total, logs, distinctTypes, org] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      // Entity-type filter options for this org (bounded).
      prisma.auditLog.findMany({
        where: { orgId: user.orgId },
        distinct: ['entityType'],
        select: { entityType: true },
        take: 100,
      }),
      prisma.organization.findUnique({
        where: { id: user.orgId },
        select: { settings: true },
      }),
    ])

    const userIds = Array.from(new Set(logs.map((l) => l.userId).filter(Boolean))) as string[]
    const [users, roleRows] = userIds.length
      ? await Promise.all([
          prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true },
          }),
          // Role lives on the org-scoped assignment, not the User row.
          prisma.userRoleAssignment.findMany({
            where: { userId: { in: userIds }, orgId: user.orgId, status: 'ACTIVE' },
            select: { userId: true, role: true, isDefault: true },
            orderBy: { isDefault: 'desc' },
          }),
        ])
      : [[], []]
    const nameMap = new Map(users.map((u) => [u.id, u.name]))
    const roleMap = new Map<string, string>()
    for (const r of roleRows) if (!roleMap.has(r.userId)) roleMap.set(r.userId, r.role)

    return ok({
      rows: logs.map((log) => {
        return {
          id: log.id,
          userId: log.userId,
          userName: log.userId ? nameMap.get(log.userId) ?? null : null,
          userRole: log.userId ? roleMap.get(log.userId) ?? null : null,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          before: log.before,
          after: log.after,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt,
        }
      }),
      entityTypes: distinctTypes.map((t) => t.entityType).sort(),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      retentionDays: resolveRetentionDays(org?.settings),
      retentionPresets: RETENTION_PRESETS,
    })
  },
})

/**
 * PUT /api/v1/settings/activity-log — update the log retention policy.
 * Body: { retentionDays: number } (0 = keep forever). Auto-pruning runs nightly.
 */
export const PUT = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, user }) => {
    const body = z
      .object({ retentionDays: z.number().int().min(0).max(3650) })
      .parse(await req.json())

    const retentionDays = normaliseRetentionDays(body.retentionDays)

    const org = await prisma.organization.findUnique({
      where: { id: user.orgId },
      select: { settings: true },
    })
    const settings = (org?.settings as Record<string, any>) || {}

    await prisma.organization.update({
      where: { id: user.orgId },
      data: {
        settings: {
          ...settings,
          activityLog: { ...(settings.activityLog || {}), retentionDays },
        },
      },
    })

    logAudit({
      orgId: user.orgId,
      userId: user.id,
      action: AuditAction.PERMISSION_CHANGE,
      entityType: 'ACTIVITY_LOG_SETTINGS',
      after: { retentionDays },
      req,
    })

    return ok({ retentionDays })
  },
})
