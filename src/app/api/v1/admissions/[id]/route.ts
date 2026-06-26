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
    const id = params?.id
    const admission = await db.admission.findFirst({
      where: { id },
      include: {
        stage: true,
        assignedTo: {
          select: { id: true, name: true }
        },
        lead: {
          select: {
            parentName: true,
            expectedJoinDate: true,
            currentSchool: true,
            priority: true
          }
        },
        student: {
          select: { id: true, studentCode: true }
        }
      }
    })

    if (!admission) {
      throw Errors.notFound('Admission')
    }

    const [activities, documents] = await Promise.all([
      db.admissionActivity.findMany({
        where: { admissionId: id },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      db.admissionDocument.findMany({
        where: { admissionId: id }
      })
    ])

    const performerIds = Array.from(new Set(activities.map(a => a.performedById).filter(Boolean))) as string[]
    const performers = performerIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: performerIds } },
          select: { id: true, name: true }
        })
      : []

    const performerMap = new Map(performers.map(p => [p.id, p.name]))

    const activitiesWithPerformer = activities.map(act => ({
      ...act,
      performedBy: act.performedById ? { name: performerMap.get(act.performedById) || 'System' } : { name: 'System' }
    }))

    const admissionWithIsTerminal = {
      ...admission,
      expectedJoinDate: admission.lead?.expectedJoinDate || null,
      currentSchool: admission.lead?.currentSchool || null,
      priority: admission.lead?.priority || 'MEDIUM',
      activities: activitiesWithPerformer,
      documents,
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

    const currentAdmission = await db.admission.findFirst({
      where: {
        id: params?.id,
        orgId: user.orgId
      },
      include: {
        stage: {
          select: { name: true }
        }
      }
    })

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

    let leadId = existing.leadId
    if (!leadId) {
      const year = new Date().getFullYear()
      const count = await db.lead.count({
        where: { orgId: user.orgId }
      })
      const leadCode = 'LD-' + year + '-' + String(count + 1).padStart(5, '0')

      const newLead = await db.lead.create({
        data: {
          orgId: user.orgId,
          branchId: existing.branchId,
          academicYearId: existing.academicYearId || body.academicYearId || null,
          leadCode,
          kidName: body.applicantName || existing.applicantName,
          parentName: body.parentName || existing.parentName || '',
          phone: body.phone || existing.phone || '',
          email: body.email || existing.email,
          status: 'CONVERTED',
          expectedJoinDate: body.expectedJoinDate ? new Date(body.expectedJoinDate) : null,
          currentSchool: body.currentSchool || null,
          priority: body.priority || 'MEDIUM',
          gradeSought: existing.gradeSought
        }
      })
      leadId = newLead.id

      // Update the admission record with the new leadId
      await db.admission.update({
        where: { id: params?.id },
        data: { leadId }
      })
    } else {
      // Update the existing Lead record
      await db.lead.update({
        where: { id: leadId },
        data: {
          expectedJoinDate: body.expectedJoinDate ? new Date(body.expectedJoinDate) : null,
          currentSchool: body.currentSchool || null,
          priority: body.priority || 'MEDIUM',
          kidName: body.applicantName !== undefined ? body.applicantName : undefined,
          parentName: body.parentName !== undefined ? (body.parentName || '') : undefined,
          phone: body.phone !== undefined ? (body.phone || '') : undefined,
          email: body.email !== undefined ? body.email : undefined,
          academicYearId: body.academicYearId !== undefined ? body.academicYearId : undefined,
          gradeSought: body.gradeSought !== undefined ? body.gradeSought : undefined
        }
      })
    }

    // Log stage change
    if (body.stageId && currentAdmission && body.stageId !== currentAdmission.stageId) {
      const newStage = await db.admissionStage.findFirst({
        where: { id: body.stageId },
        select: { name: true }
      })

      await db.admissionActivity.create({
        data: {
          admissionId: params?.id ?? '',
          orgId: user.orgId,
          type: 'STAGE_CHANGE',
          summary: `Stage changed from ${currentAdmission.stage?.name || 'Unknown'} to ${newStage?.name || 'Unknown'}`,
          performedById: user.id || null,
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
