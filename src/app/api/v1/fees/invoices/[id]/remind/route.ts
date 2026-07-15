import { format } from 'date-fns'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { sumSuccessfulPayments, remainingBalance } from '@/lib/fees'
import { sendTemplateNotification, orgDisplayName } from '@/lib/whatsapp/notify'
import { formatInr, invoiceItemsLabel } from '@/lib/whatsapp/emitters'

/**
 * Manual "send payment link" (mobile-app-plan §3.2, fees defaulter action).
 * The automatic version fires once at invoice creation (onInvoiceCreated in
 * emitters.ts) — this reuses the same template + link shape for an
 * on-demand resend, reporting whether it actually went out (template
 * adopted, guardian phone on file) rather than firing blind.
 */
export const POST = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.ACCOUNTANT],
  handler: async ({ db, user, params }) => {
    const invoice = await db.invoice.findFirst({
      where: { id: params?.id },
      include: { payments: true, items: true, student: true }
    })
    if (!invoice) throw Errors.notFound('Invoice')
    if (!invoice.student.guardianPhone) {
      throw Errors.businessRule('Guardian phone not configured for this student')
    }

    const remaining = remainingBalance(invoice.totalAmount, sumSuccessfulPayments(invoice.payments))
    if (remaining <= 0) throw Errors.businessRule('Invoice is already fully paid')

    const schoolName = await orgDisplayName(user.orgId)
    const baseUrl = process.env.NEXTAUTH_URL || 'https://vidhyaan.com'

    const sent = await sendTemplateNotification({
      orgId: user.orgId,
      template: 'fee_invoice_with_payment_link',
      phone: invoice.student.guardianPhone,
      values: {
        parentName: invoice.student.guardianName || 'Parent',
        plan: invoiceItemsLabel(invoice.items),
        amount: formatInr(remaining),
        date: invoice.dueDate ? format(invoice.dueDate, 'd MMM yyyy') : '-',
        schoolName,
        link: `${baseUrl}/parent/fees?invoice=${invoice.id}`
      },
      ref: `fee_remind_manual:${invoice.id}:${Date.now()}`
    }).catch(() => false)

    return ok({ sent })
  }
})
