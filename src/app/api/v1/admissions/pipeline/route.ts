import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { redis } from '@/lib/redis'

export const GET = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ req, db, user }) => {
    const { searchParams } = new URL(req.url)
    const academicYearId = searchParams.get('academicYearId')

    const cacheKey = `admissions_pipeline:${user.orgId}:${academicYearId || 'all'}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      return ok(JSON.parse(cached))
    }

    const stages = await db.admissionStage.findMany({
      where: { orgId: user.orgId },
      orderBy: { sortOrder: 'asc' }
    })

    const groupedCounts = await db.admission.groupBy({
      by: ['stageId'],
      where: {
        orgId: user.orgId,
        deletedAt: null,
        ...(academicYearId && {
          OR: [
            { academicYearId: academicYearId },
            { academicYearId: null }
          ]
        })
      },
      _count: {
        _all: true
      }
    })

    const countMap: Record<string, number> = {}
    groupedCounts.forEach(g => {
      if (g.stageId) {
        countMap[g.stageId] = g._count._all
      }
    })

    const pipeline = stages.map(stage => ({
      id: stage.id,
      label: stage.name,
      color: stage.color,
      order: stage.sortOrder,
      isTerminal: stage.isWon || stage.isLost,
      isWon: stage.isWon,
      isLost: stage.isLost,
      requiresDocs: stage.requiresDocs,
      requiresPayment: stage.requiresPayment,
      count: countMap[stage.id] || 0
    }))

    const total = pipeline.reduce((sum, s) => sum + s.count, 0)

    const admittedCount = pipeline
      .filter(s => s.isWon)
      .reduce((a, s) => a + s.count, 0)

    const conversionRate =
      total > 0 ? Math.round((admittedCount / total) * 100) : 0

    // Find all ADMITTED admissions for this org
    const admitted = await db.admission.findMany({
      where: {
        orgId: user.orgId,
        status: 'ADMITTED',
        decidedAt: { not: null },
        deletedAt: null,
        ...(academicYearId && {
          OR: [
            { academicYearId: academicYearId },
            { academicYearId: null }
          ]
        })
      },
      select: {
        createdAt: true,
        decidedAt: true,
      }
    })

    // Calculate average days
    const avgDays = admitted.length > 0
      ? Math.round(
          admitted.reduce((sum, a) => {
            const days = Math.floor(
              (new Date(a.decidedAt!).getTime() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            )
            return sum + days
          }, 0) / admitted.length
        )
      : 0

    const result = {
      pipeline,
      total,
      conversionRate,
      avgDaysToAdmit: avgDays
    }

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 60)

    return ok(result)
  }
})
