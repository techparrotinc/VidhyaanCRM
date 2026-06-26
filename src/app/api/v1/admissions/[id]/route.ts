import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors, AppError } from '@/lib/api/errors'
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
        documents: true,
        lead: {
          select: { parentName: true }
        },
        student: {
          select: { id: true, studentCode: true }
        }
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
    const {
      id,
      orgId,
      branchId,
      createdAt,
      updatedAt,
      stage,
      assignedTo,
      activities,
      documents,
      student,
      lead,
      notes,
      expectedJoinDate,
      currentSchool,
      priority,
      counsellor,
      counsellorAvatar,
      counsellorName,
      ...updateData
    } = body

    const updated = await db.admission.update({
      where: { id: params?.id },
      data: updateData,
      include: { stage: true }
    })

    // Log stage change
    if (updateData.stageId && updateData.stageId !== existing.stageId) {
      const currentAdmission = await db.admission.findFirst({
        where: { id: params?.id },
        include: {
          stage: { select: { name: true } }
        }
      })
      const oldStageName = currentAdmission?.stage?.name || 'Unknown'

      const newStage = await db.admissionStage.findUnique({
        where: { id: updateData.stageId },
        select: { name: true }
      })
      const newStageName = newStage?.name || 'Unknown'

      await db.admissionActivity.create({
        data: {
          admissionId: params?.id ?? '',
          orgId: user.orgId,
          type: 'STAGE_CHANGE',
          summary: `Stage changed from ${oldStageName} to ${newStageName}`,
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

    // Log note if provided
    if (body.notes) {
      await db.admissionActivity.create({
        data: {
          orgId: user.orgId,
          admissionId: existing.id,
          type: 'NOTE',
          summary: body.notes,
          performedById: user.id
        }
      })
    }

    return ok(updated)
  }
})

export const DELETE = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ db, params, user }) => {
    const admission = await db.admission.findFirst({
      where: { id: params?.id, orgId: user.orgId, deletedAt: null },
      include: { student: true }
    })

    if (!admission) {
      throw Errors.notFound('Admission')
    }

    if (admission.status === 'ADMITTED') {
      throw new AppError(
        'BUSINESS_RULE',
        'Cannot delete an admitted applicant. Archive instead.',
        400
      )
    }

    if (admission.student) {
      throw new AppError(
        'BUSINESS_RULE',
        'Cannot delete admission with linked student record.',
        400
      )
    }

    // Soft delete
    await db.admission.update({
      where: { id: params?.id },
      data: { deletedAt: new Date() }
    })

    // Log activity
    await db.admissionActivity.create({
      data: {
        orgId: user.orgId,
        admissionId: admission.id,
        type: 'SYSTEM',
        summary: 'Admission record deleted',
        performedById: user.id
      }
    })

    return ok({ success: true })
  }
})
