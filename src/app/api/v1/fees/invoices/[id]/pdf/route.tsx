import { NextResponse } from 'next/server'
import { route } from '@/lib/api/compose'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { renderInvoicePdf } from '@/lib/pdf/invoice-pdf'

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.ACCOUNTANT
  ],
  handler: async ({ db, user, params }) => {
    const invoice = await db.invoice.findFirst({
      where: {
        id: params?.id,
        orgId: user.orgId
      },
      include: {
        student: true,
        items: true
      }
    })

    if (!invoice) {
      throw Errors.notFound('Invoice')
    }

    const org = await db.organization.findFirst({
      where: { id: user.orgId }
    })

    if (!org) {
      throw Errors.notFound('Organization')
    }

    const pdfBuffer = await renderInvoicePdf(invoice, org)

    return new NextResponse(pdfBuffer as never, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`
      }
    })
  }
})
