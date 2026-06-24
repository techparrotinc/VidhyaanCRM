import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { createNotification } from '@/lib/services/notifications'

export const GET = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ db, params }) => {
    const admission = await db.admission.findFirst({
      where: { id: params?.id },
      include: {
        stage: true,
        assignedTo: {
          select: { id: true, name: true }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        documents: true
      }
    })

    if (!admission) {
      throw Errors.notFound('Admission')
    }

    const admissionWithIsTerminal = {
      ...admission,
      stage: admission.stage
        ? {
            ...admission.stage,
            isTerminal: admission.stage.isWon || admission.stage.isLost
          }
        : null
    }

    return ok(admissionWithIsTerminal)
  }
})

export const PUT = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR
  ],
  handler: async ({ req, db, user, params }) => {
    const body = await req.json()

    const existing = await db.admission.findFirst({
      where: { id: params?.id },
      include: { stage: true }
    })

    if (!existing) {
      throw Errors.notFound('Admission')
    }

    // Filter out relation and read-only fields to prevent Prisma errors
    const { id, orgId, branchId, createdAt, updatedAt, stage, assignedTo, activities, documents, ...updateData } = body

    const updated = await db.admission.update({
      where: { id: params?.id },
      data: updateData,
      include: { stage: true }
    })

    // Log stage change
    if (updateData.stageId && updateData.stageId !== existing.stageId) {
      await db.admissionActivity.create({
        data: {
          orgId: user.orgId,
          admissionId: existing.id,
          type: 'STAGE_CHANGE',
          summary:
            'Stage changed from ' +
            (existing.stage?.name ?? 'Unknown') +
            ' to new stage',
          performedById: user.id
        }
      })

      // Create in-app notification for counsellor
      if (updated.assignedToId) {
        try {
          await createNotification({
            orgId: user.orgId,
            recipientType: 'USER',
            recipientId: updated.assignedToId,
            type: 'ADMISSION_STAGE_CHANGED',
            title: 'Application Stage Updated',
            body: `${updated.applicantName} moved to ${updated.stage?.name || 'New Stage'}`,
            data: {
              admissionId: updated.id,
              href: '/admission-management'
            }
          })
        } catch (e) {
          console.error('Failed to trigger admission notification:', e)
        }
      }

      // Check if new stage is won
      if (updated.stage?.isWon) {
        await db.admission.update({
          where: { id: params?.id },
          data: { status: 'ADMITTED' }
        })
        updated.status = 'ADMITTED'
      }

      // Check if new stage is lost
      if (updated.stage?.isLost) {
        await db.admission.update({
          where: { id: params?.id },
          data: { status: 'REJECTED' }
        })
        updated.status = 'REJECTED'
      }
    }

    return ok(updated)
  }
})
