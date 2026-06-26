import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

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

    const stages = await db.admissionStage.findMany({
      where: { orgId: user.orgId },
      orderBy: { sortOrder: 'asc' }
    })

    const counts = await Promise.all(
      stages.map(stage =>
        db.admission.count({
          where: {
            orgId: user.orgId,
            stageId: stage.id,
            deletedAt: null,
            ...(academicYearId && {
              OR: [
                { academicYearId: academicYearId },
                { academicYearId: null }
              ]
            })
          }
        })
      )
    )

    const pipeline = stages.map((stage, i) => ({
      id: stage.id,
      label: stage.name,
      color: stage.color,
      order: stage.sortOrder,
      isTerminal: stage.isWon || stage.isLost,
      isWon: stage.isWon,
      isLost: stage.isLost,
      requiresDocs: stage.requiresDocs,
      requiresPayment: stage.requiresPayment,
      count: counts[i]
    }))

    const total = counts.reduce((a, b) => a + b, 0)

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

    return ok({
      pipeline,
      total,
      conversionRate,
      avgDaysToAdmit: avgDays
    })
  }
})
