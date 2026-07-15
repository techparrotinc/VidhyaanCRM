import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireParentFromRequest, linkedStudentsWhere } from '@/lib/parent-portal'
import { renderInvoicePdf } from '@/lib/pdf/invoice-pdf'

/**
 * GET /api/v1/parent/fees/invoices/:id/pdf
 * Same invoice PDF the school generates, gated on the parent's link to the
 * student (ACTIVE guardian link or contact match; revoked links block).
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const parent = await requireParentFromRequest(req)
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Parent role required.' }, { status: 401 })
    }
    const { id } = await context.params

    const invoice = await prisma.invoice.findFirst({
      where: { id, deletedAt: null, student: linkedStudentsWhere(parent) },
      include: { student: true, items: true }
    })
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
    }

    const org = await prisma.organization.findFirst({ where: { id: invoice.orgId } })
    if (!org) {
      return NextResponse.json({ success: false, error: 'School not found' }, { status: 404 })
    }

    const pdfBuffer = await renderInvoicePdf(invoice, org)

    return new NextResponse(pdfBuffer as never, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`
      }
    })
  } catch (error) {
    console.error('[parent/fees/invoice-pdf] error:', error)
    return NextResponse.json({ success: false, error: 'Could not generate the PDF' }, { status: 500 })
  }
}
