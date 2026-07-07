import { route } from '@/lib/api/compose'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { ok } from '@/lib/api/respond'
import { redis } from '@/lib/redis'
import { Errors, AppError } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { createNotification } from '@/lib/services/notifications'
import { createLeadWithUniqueCode } from '@/lib/lead-code'

// Whitelist of updatable Admission scalars + body-only fields handled separately below
// (unknown keys are stripped — previously anything not destructured out hit prisma directly)
const updateAdmissionSchema = z.object({
  applicantName: z.string().trim().min(1).max(150).optional(),
  parentName: z.string().max(150).optional().nullable(),
  gradeSought: z.string().max(50).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  stageId: z.string().max(50).optional().nullable(),
  assignedToId: z.string().max(50).optional().nullable(),
  academicYearId: z.string().max(50).optional().nullable(),
  branchId: z.string().max(50).optional().nullable(),
  status: z.enum(['IN_PROGRESS', 'ADMITTED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN']).optional(),
  rejectionReason: z.string().max(1000).optional().nullable(),
  // Lead/activity fields — never written to Admission
  notes: z.string().max(5000).optional().nullable(),
  expectedJoinDate: z.string().max(40).optional().nullable(),
  currentSchool: z.string().max(200).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().nullable()
})

export const GET = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ db, params }) => {
    const { id } = (await params) as any
    const admission = await db.admission.findFirst({
      where: { id },
      include: {
        stage: true,
        assignedTo: {
          select: { id: true, name: true }
        },
        academicYear: {
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
    const { id } = (await params) as any
    const body = updateAdmissionSchema.parse(await req.json())

    const existing = await db.admission.findFirst({
      where: { id },
      include: { stage: true }
    })

    if (!existing) {
      throw Errors.notFound('Admission')
    }

    const currentAdmission = await db.admission.findFirst({
      where: {
        id,
        orgId: user.orgId
      },
      include: {
        stage: {
          select: { name: true }
        }
      }
    })

    // Lead/activity-only fields split off; the rest are whitelisted Admission scalars
    const { notes, expectedJoinDate, currentSchool, priority, ...updateData } = body

    const { stageId, assignedToId, academicYearId, branchId, ...restUpdateData } = updateData
    const finalUpdateData: any = { ...restUpdateData }

    if (stageId !== undefined) {
      finalUpdateData.stage = stageId ? { connect: { id: stageId } } : { disconnect: true }
    }
    if (assignedToId !== undefined) {
      finalUpdateData.assignedTo = assignedToId ? { connect: { id: assignedToId } } : { disconnect: true }
    }
    if (academicYearId !== undefined) {
      finalUpdateData.academicYear = academicYearId ? { connect: { id: academicYearId } } : { disconnect: true }
    }
    if (branchId !== undefined) {
      finalUpdateData.branch = branchId ? { connect: { id: branchId } } : { disconnect: true }
    }

    const updated = await db.admission.update({
      where: { id },
      data: finalUpdateData,
      include: { stage: true }
    })

    let leadId = existing.leadId
    if (!leadId) {
      const newLead = await createLeadWithUniqueCode(user.orgId, (leadCode) =>
        db.lead.create({
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
      )
      leadId = newLead.id

      // Update the admission record with the new leadId
      await db.admission.update({
        where: { id },
        data: {
          lead: { connect: { id: leadId } }
        }
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
          gradeSought: body.gradeSought !== undefined ? body.gradeSought : undefined,
          ...(body.academicYearId !== undefined ? {
            academicYear: body.academicYearId
              ? { connect: { id: body.academicYearId } }
              : { disconnect: true }
          } : {})
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
          admissionId: id,
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
          where: { id },
          data: { status: 'ADMITTED' }
        })
        updated.status = 'ADMITTED'
      }

      // Check if new stage is lost
      if (updated.stage?.isLost) {
        await db.admission.update({
          where: { id },
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

    // Invalidate pipeline cache
    try {
      const ayId = existing.academicYearId
      await redis.del(`pipeline:${user.orgId}`)
      await redis.del(`admissions_pipeline:${user.orgId}:all`)
      if (ayId) {
        await redis.del(`admissions_pipeline:${user.orgId}:${ayId}`)
      }
    } catch (err) {
      console.error('Failed to invalidate pipeline cache:', err)
    }

    const updatedAdmission = await db.admission.findFirst({
      where: {
        id,
        orgId: user.orgId
      },
      select: {
        id: true,
        admissionCode: true,
        applicantName: true,
        parentName: true,
        phone: true,
        email: true,
        gradeSought: true,
        status: true,
        stageId: true,
        createdAt: true,
        lead: {
          select: {
            priority: true
          }
        },
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
            isWon: true,
            isLost: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const responseAdmission = updatedAdmission
      ? {
          ...updatedAdmission,
          priority: updatedAdmission.lead?.priority || 'MEDIUM'
        }
      : null

    return NextResponse.json({
      success: true,
      admission: responseAdmission
    })
  }
})

export const DELETE = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ db, params, user }) => {
    const { id } = (await params) as any
    const admission = await db.admission.findFirst({
      where: { id, orgId: user.orgId, deletedAt: null },
      include: { student: true }
    })

    if (!admission) {
      throw Errors.notFound('Admission')
    }

    if (admission.status === 'ADMITTED') {
      throw new AppError(
        'BUSINESS_RULE',
        'Admitted applicants cannot be deleted — they anchor student records and reports. Use Archive to hide them from active views.',
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
      where: { id },
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

    // Invalidate pipeline cache
    try {
      const ayId = admission.academicYearId
      await redis.del(`pipeline:${user.orgId}`)
      await redis.del(`admissions_pipeline:${user.orgId}:all`)
      if (ayId) {
        await redis.del(`admissions_pipeline:${user.orgId}:${ayId}`)
      }
    } catch (err) {
      console.error('Failed to invalidate pipeline cache:', err)
    }

    return ok({ success: true })
  }
})
