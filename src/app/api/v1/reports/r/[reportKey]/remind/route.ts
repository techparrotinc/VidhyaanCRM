import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db/client'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { resolveOrgEmail } from '@/lib/mail/org-templates'
import { REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { reportRequest } from '@/lib/reports/route-helpers'
import { branchScope, OPEN_INVOICE_STATUSES } from '@/lib/reports/queries/scope'
import { listFilter } from '@/lib/reports/queries/types'

const REMINDER_CAP = 200

// Bulk fee-reminder from the Defaulter Ageing report: emails the FEE_INVOICE
// (reminder) template to the guardian of every student matching the report's
// current filters. One email per student (their most-overdue invoice). Capped
// and audit-logged; guardian data leaves the system.
export const POST = route({
  module: REPORTS_MODULE_SLUG,
  roles: ['ORG_ADMIN', 'ACCOUNTANT'],
  handler: async ({ req, user, db, params }) => {
    if (params?.reportKey !== 'defaulter-ageing') {
      throw Errors.notFound('Reminder action')
    }
    // Reuse the report's filter/scope resolution (branch, grade, minAmount…).
    const { ctx, filters } = await reportRequest({
      reportKey: params?.reportKey, url: req.url, db, user
    })
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
    const grades = listFilter(filters.grade)
    const minAmount = filters.minAmount ? Number(filters.minAmount) : 0

    // Overdue invoices with a positive balance, oldest first, with guardian email.
    const invoices = await db.invoice.findMany({
      where: {
        ...branchScope(ctx.branchIds),
        status: { in: [...OPEN_INVOICE_STATUSES] },
        dueDate: { lt: startOfToday },
        ...(grades ? { student: { gradeLabel: { in: grades } } } : {})
      },
      select: {
        invoiceNumber: true, totalAmount: true, paidAmount: true, dueDate: true,
        student: { select: { id: true, name: true, guardianName: true, guardianEmail: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 3000
    })

    const org = await prisma.organization.findUnique({
      where: { id: user.orgId }, select: { name: true }
    })
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vidhyaan.com'

    // One reminder per student — first (most overdue) invoice with a balance.
    const seen = new Set<string>()
    let sent = 0
    let skipped = 0
    let capped = false

    for (const inv of invoices) {
      const due = Number(inv.totalAmount) - Number(inv.paidAmount)
      if (due <= 0 || due < minAmount) continue
      if (seen.has(inv.student.id)) continue
      seen.add(inv.student.id)
      if (!inv.student.guardianEmail) { skipped++; continue }
      if (sent >= REMINDER_CAP) { capped = true; break }

      try {
        const { subject, bodyText, html } = await resolveOrgEmail(user.orgId, 'FEE_INVOICE', {
          parentName: inv.student.guardianName ?? 'Parent/Guardian',
          studentName: inv.student.name,
          invoiceNumber: inv.invoiceNumber,
          amount: `₹${Math.round(due).toLocaleString('en-IN')}`,
          dueDate: inv.dueDate
            ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—',
          schoolName: org?.name ?? 'Your school',
          paymentLink: `${baseUrl}/parent/fees`
        })
        await sendTransactionalEmail({
          to: inv.student.guardianEmail, subject, htmlBody: html, textBody: bodyText
        })
        sent++
      } catch {
        skipped++
      }
    }

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId, userId: user.id, action: 'EXPORT',
        entityType: 'fee_reminder_bulk', entityId: params?.reportKey,
        after: { sent, skipped, capped, filters: filters as object }
      }
    }).catch(() => {})

    return ok({ sent, skipped, capped })
  }
})
