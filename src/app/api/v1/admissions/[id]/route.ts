import { route } from '@/lib/api/compose'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { ok } from '@/lib/api/respond'
import { redis } from '@/lib/redis'
import { Errors, AppError } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { rolesFor } from '@/constants/permissions'
import { logAudit, auditSnapshot } from '@/lib/audit/log'
import { AuditAction } from '@prisma/client'
import { createNotification } from '@/lib/services/notifications'
import { createLeadWithUniqueCode } from '@/lib/lead-code'
import { prisma } from '@/lib/db/client'
import { sendOrgTemplateEmail } from '@/lib/mail/org-templates'
import { sendReviewRequestForAdmission } from '@/lib/reviews/request'
import { onAdmissionStageChange, onAdmissionAssigned } from '@/lib/whatsapp/emitters'
import { cleanPhoneNumber } from '@/lib/utils'
import { dedupFields } from '@/lib/dedup'

// Whitelist of updatable Admission scalars + body-only fields handled separately below
// (unknown keys are stripped — previously anything not destructured out hit prisma directly)
const updateAdmissionSchema = z.object({
  applicantName: z.string().trim().min(1).max(150).optional(),
  parentName: z.string().max(150).optional().nullable(),
  gradeSought: z.string().max(50).optional().nullable(),
  // Cleaned (strips spaces/dashes/+91/leading 0) but not regex-locked to
  // 10-digit-mobile — landlines/alt formats stay valid; only non-numeric
  // junk ("abc") becomes an empty string and gets rejected below.
  phone: z.string().max(30).optional().nullable()
    .transform((v): string | null | undefined => (v == null ? v : (cleanPhoneNumber(v) as string)))
    .refine(v => v == null || v.length > 0, {
      message: 'Enter a valid phone number'
    }),
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
  roles: rolesFor('ADMISSION', 'update'),
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

    // Moving into a stage that requires documents first needs at least one
    // uploaded document on record — checked before the stage is actually
    // changed below, not just at stage-config-display time.
    if (body.stageId && currentAdmission && body.stageId !== currentAdmission.stageId) {
      const targetStage = await db.admissionStage.findFirst({
        where: { id: body.stageId },
        select: { name: true, requiresDocs: true }
      })
      if (targetStage?.requiresDocs) {
        const docCount = await db.admissionDocument.count({
          where: { admissionId: id, deletedAt: null }
        })
        if (docCount === 0) {
          throw Errors.businessRule(`"${targetStage.name}" requires at least one document to be uploaded first`)
        }
      }
    }

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

    // Keep the dedup join key + household in sync when the phone changes —
    // otherwise phoneNormalized/householdId go stale and this record quietly
    // drops out of future dedup matching on its new number.
    if (body.phone !== undefined) {
      const identity = await dedupFields(db, {
        orgId: user.orgId,
        phone: body.phone,
        name: body.parentName ?? existing.parentName,
        email: body.email ?? existing.email,
      })
      finalUpdateData.phoneNormalized = identity.phoneNormalized
      finalUpdateData.household = identity.householdId
        ? { connect: { id: identity.householdId } }
        : { disconnect: true }
    }

    const updated = await db.admission.update({
      where: { id },
      data: finalUpdateData,
      include: { stage: true }
    })

    logAudit({
      orgId: user.orgId,
      userId: user.id,
      action: AuditAction.UPDATE,
      entityType: 'ADMISSION',
      entityId: updated.id,
      before: auditSnapshot(existing, ['applicantName', 'parentName', 'phone', 'email', 'stageId', 'status', 'assignedToId']),
      after: auditSnapshot(updated, ['applicantName', 'parentName', 'phone', 'email', 'stageId', 'status', 'assignedToId']),
      req,
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

      // Interview-type stage → remind the assigned counsellor (respects the
      // INTERVIEW_REMINDER preference; the generic stage-change note above
      // covers other stages)
      if (newStage?.name?.toLowerCase().includes('interview') && updated.assignedToId) {
        try {
          await createNotification({
            orgId: user.orgId,
            recipientType: 'USER',
            recipientId: updated.assignedToId,
            type: 'INTERVIEW_REMINDER',
            title: 'Interview Scheduled',
            body: `${updated.applicantName} is now in "${newStage.name}" — schedule and conduct the interview`,
            data: {
              admissionId: updated.id,
              href: `/admission-management/${updated.id}`
            }
          })
        } catch (e) {
          console.error('Failed to trigger interview reminder:', e)
        }
      }

      // Interview-type stage → notify the parent (fire-and-forget)
      if (newStage?.name?.toLowerCase().includes('interview') && updated.email) {
        prisma.organization.findUnique({ where: { id: user.orgId }, select: { name: true } }).then((org) =>
          sendOrgTemplateEmail(user.orgId, 'INTERVIEW_SCHEDULED', updated.email, {
            parentName: updated.parentName ?? 'Parent',
            applicantName: updated.applicantName,
            stageName: newStage.name,
            schoolName: org?.name ?? 'Your school'
          })
        ).catch(() => {})
      }

      // Stage-driven status: won/lost stages set it; moving off one of them
      // means that status (and any rejection note) is now stale, so it's
      // reverted rather than left pointing at a stage the record left.
      // Manually-set WAITLISTED/WITHDRAWN are left alone — those aren't
      // stage-driven.
      if (updated.stage?.isWon) {
        await db.admission.update({
          where: { id },
          data: { status: 'ADMITTED', rejectionReason: null }
        })
        updated.status = 'ADMITTED'
        updated.rejectionReason = null
      } else if (updated.stage?.isLost) {
        await db.admission.update({
          where: { id },
          data: { status: 'REJECTED' }
        })
        updated.status = 'REJECTED'
      } else if (existing.status === 'ADMITTED' || existing.status === 'REJECTED') {
        await db.admission.update({
          where: { id },
          data: { status: 'IN_PROGRESS', rejectionReason: null }
        })
        updated.status = 'IN_PROGRESS'
        updated.rejectionReason = null
      }

      // WhatsApp stage notification to the parent (fire-and-forget;
      // template adoption per org is the switch)
      if (updated.stage) {
        const stage = updated.stage
        ;(updated.assignedToId
          ? prisma.user.findUnique({ where: { id: updated.assignedToId }, select: { name: true } })
          : Promise.resolve(null)
        )
          .then(c => onAdmissionStageChange(user.orgId, updated, stage, c?.name))
          .catch(() => {})
      }
    }

    // Reassigned → WhatsApp work alert to the new counsellor
    if (
      body.assignedToId &&
      updated.assignedToId &&
      updated.assignedToId !== existing.assignedToId
    ) {
      prisma.user
        .findUnique({ where: { id: updated.assignedToId }, select: { id: true, name: true, phone: true } })
        .then(c => c && onAdmissionAssigned(user.orgId, updated, c))
        .catch(() => {})
    }

    // Admission confirmed → congratulate the parent (covers both the
    // won-stage path above and a direct status change; fire-and-forget)
    if (updated.status === 'ADMITTED' && existing.status !== 'ADMITTED' && updated.email) {
      prisma.organization.findUnique({ where: { id: user.orgId }, select: { name: true } }).then((org) =>
        sendOrgTemplateEmail(user.orgId, 'ADMISSION_CONFIRMED', updated.email, {
          parentName: updated.parentName ?? 'Parent',
          applicantName: updated.applicantName,
          gradeSought: updated.gradeSought ?? 'the applied class',
          schoolName: org?.name ?? 'Your school'
        })
      ).catch(() => {})
    }

    // Admission confirmed → nudge the parent to review the school on the
    // marketplace (PRD incentive; idempotent per admission, fire-and-forget)
    if (updated.status === 'ADMITTED' && existing.status !== 'ADMITTED') {
      sendReviewRequestForAdmission(user.orgId, {
        id: updated.id,
        applicantName: updated.applicantName,
        parentName: updated.parentName,
        phone: updated.phone,
        email: updated.email
      }).catch((e) => console.error('Review request failed:', e))
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
  roles: rolesFor('ADMISSION', 'delete'),
  handler: async ({ req, db, params, user }) => {
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

    logAudit({
      orgId: user.orgId,
      userId: user.id,
      action: AuditAction.DELETE,
      entityType: 'ADMISSION',
      entityId: admission.id,
      before: auditSnapshot(admission, ['admissionCode', 'applicantName', 'parentName', 'phone', 'status', 'stageId']),
      req,
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
