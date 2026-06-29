import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

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

    const emailBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Fee Invoice Generated</h2>
        <p>Dear Parent/Guardian,</p>
        <p>A new fee invoice has been generated for your child, <strong>${invoice.student.name}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 150px;">Invoice Number:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Amount:</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #1565D8;">₹${Number(invoice.totalAmount).toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Due Date:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
          </tr>
        </table>
        <p>Please make the payment by the due date. You can log in to the parent portal or visit the school office to clear the balance.</p>
        <p>Warm regards,<br/><strong>School Accountant</strong></p>
      </div>
    `

    await sendTransactionalEmail({
      to: invoice.student.guardianEmail,
      subject: `Fee Invoice ${invoice.invoiceNumber} - Vidhyaan`,
      htmlBody: emailBody,
      textBody: `Dear Parent/Guardian, fee invoice ${invoice.invoiceNumber} has been generated for ${invoice.student.name}. Total amount: ₹${Number(invoice.totalAmount).toLocaleString('en-IN')}.`
    })

    return ok({ success: true, message: 'Email sent successfully' })
  }
})
