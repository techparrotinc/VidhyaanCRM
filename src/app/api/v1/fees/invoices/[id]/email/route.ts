import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { resolveOrgEmail } from '@/lib/mail/org-templates'

export const POST = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ db, user, params }) => {
    const invoice = await db.invoice.findFirst({
      where: { id: params?.id, orgId: user.orgId },
      include: { student: true }
    })

    if (!invoice) throw Errors.notFound('Invoice')
    if (!invoice.student.guardianEmail) {
      throw Errors.businessRule('Guardian email not configured for this student')
    }

    const orgName = await prisma.organization
      .findUnique({ where: { id: user.orgId }, select: { name: true } })
      .then((o) => o?.name ?? 'Your school')

    const baseUrl = process.env.NEXTAUTH_URL || 'https://vidhyaan.com'
    const { subject, bodyText, html } = await resolveOrgEmail(user.orgId, 'FEE_INVOICE', {
      parentName: invoice.student.guardianName ?? 'Parent/Guardian',
      studentName: invoice.student.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: `₹${Number(invoice.totalAmount).toLocaleString('en-IN')}`,
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
      schoolName: orgName,
      paymentLink: `${baseUrl}/parent/fees`
    })

    await sendTransactionalEmail({
      to: invoice.student.guardianEmail,
      subject,
      htmlBody: html,
      textBody: bodyText
    })

    return ok({ success: true, message: 'Email sent successfully' })
  }
})
