import { AuditAction } from '@prisma/client'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { windowLimiter } from '@/lib/ratelimit'
import { getParentAccess, enableParentAccess, revokeParentAccess, ParentAccessError } from '@/lib/parent-access'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'

const WRITE_ROLES = [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN]

/**
 * GET /api/v1/students/:id/parent-access — link status for the drawer card.
 */
export const GET = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [...WRITE_ROLES, ROLES.RECEPTIONIST, ROLES.COUNSELLOR, ROLES.ACCOUNTANT],
  handler: async ({ db, params }) => {
    const student = await db.student.findFirst({ where: { id: params?.id } })
    if (!student) throw Errors.notFound('Student')
    return ok(await getParentAccess(student))
  }
})

/**
 * POST /api/v1/students/:id/parent-access — enable portal access and invite
 * the guardian. Idempotent; POST on an INVITED link resends the invite.
 */
export const POST = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: WRITE_ROLES,
  handler: async ({ req, db, user, params }) => {
    const student = await db.student.findFirst({ where: { id: params?.id } })
    if (!student) throw Errors.notFound('Student')

    const rate = await windowLimiter(`parent-invite:${user.orgId}:${student.id}`, 3, 60 * 60)
    if (!rate.success) throw Errors.rateLimited()

    let result
    try {
      result = await enableParentAccess({ student, orgId: user.orgId, invitedById: user.id })
    } catch (error) {
      if (error instanceof ParentAccessError) throw Errors.businessRule(error.message)
      throw error
    }

    // Invite delivery: email when the school captured a guardian email;
    // the returned loginUrl lets front-desk staff share via WhatsApp either way.
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.vidhyaan.com'}/login`
    let emailSent = false
    if (student.guardianEmail && result.link.status === 'INVITED') {
      const org = await prisma.organization.findFirst({ where: { id: user.orgId }, select: { name: true } })
      await sendTransactionalEmail({
        to: student.guardianEmail,
        toName: student.guardianName ?? undefined,
        subject: `${org?.name ?? 'Your school'} has enabled parent portal access`,
        htmlBody: `
          <p>Hello ${student.guardianName ?? ''},</p>
          <p><strong>${org?.name ?? 'Your school'}</strong> has enabled online access for
          <strong>${student.name}</strong> on Vidhyaan. Track fee invoices and pay online.</p>
          <p>Login with your mobile number <strong>${result.parent.phone}</strong> — a one-time
          password is sent to your phone, no password needed.</p>
          <p><a href="${loginUrl}">Login to the parent portal</a></p>`,
        textBody: `${org?.name ?? 'Your school'} enabled parent portal access for ${student.name}. Login with OTP at ${loginUrl} using ${result.parent.phone}.`
      }).then(() => { emailSent = true })
        .catch(err => console.error('[parent-access] invite email failed:', err))
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        orgId: user.orgId,
        action: AuditAction.UPDATE,
        entityType: 'STUDENT_GUARDIAN_LINK',
        entityId: result.link.id,
        after: { event: 'parent_access_enabled', studentId: student.id, status: result.link.status, emailSent }
      }
    }).catch(err => console.error('[parent-access] audit failed:', err))

    return ok({
      status: result.link.status,
      parentPhone: result.parent.phone,
      emailSent,
      loginUrl,
      shareMessage: `${student.name}'s school fees can now be viewed and paid online. Login with OTP at ${loginUrl} using mobile ${result.parent.phone}.`
    })
  }
})

/**
 * DELETE /api/v1/students/:id/parent-access — revoke this student's portal
 * visibility. The parent account itself is untouched (may serve other kids).
 */
export const DELETE = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: WRITE_ROLES,
  handler: async ({ db, user, params }) => {
    const student = await db.student.findFirst({ where: { id: params?.id } })
    if (!student) throw Errors.notFound('Student')

    const revoked = await revokeParentAccess(student.id)
    if (!revoked) throw Errors.businessRule('No parent access to revoke')

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        orgId: user.orgId,
        action: AuditAction.UPDATE,
        entityType: 'STUDENT_GUARDIAN_LINK',
        entityId: student.id,
        after: { event: 'parent_access_revoked', studentId: student.id }
      }
    }).catch(err => console.error('[parent-access] audit failed:', err))

    return ok({ revoked: true })
  }
})
