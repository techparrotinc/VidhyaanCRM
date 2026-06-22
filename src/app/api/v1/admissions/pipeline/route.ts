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
  handler: async ({ db, user }) => {
    const stages = await db.admissionStage.findMany({
      orderBy: { sortOrder: 'asc' }
    })

    const counts = await Promise.all(
      stages.map(stage =>
        db.admission.count({
          where: {
            stageId: stage.id,
            deletedAt: null
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

    return ok({
      pipeline,
      total,
      conversionRate
    })
  }
})
