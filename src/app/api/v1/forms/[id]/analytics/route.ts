import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'

// Sent → Opened → Submitted → Paid funnel for one form, overall and per
// campaign. Drives the form analytics view and campaign reporting.
export const GET = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ db, user, params }) => {
    const form = await db.form.findFirst({
      where: { id: params!.id, orgId: user.orgId },
      select: { id: true, name: true, feeRequired: true },
    })
    if (!form) throw Errors.notFound('Form')

    const instances = await db.formInstance.findMany({
      where: { formId: form.id, orgId: user.orgId },
      select: { status: true, paymentStatus: true, campaignId: true },
    })

    const sent = instances.length
    const opened = instances.filter((i) => i.status === 'OPENED' || i.status === 'SUBMITTED').length
    const submitted = instances.filter((i) => i.status === 'SUBMITTED').length
    const paid = instances.filter((i) => i.paymentStatus === 'PAID').length

    // Per-campaign breakdown (only instances that came from a campaign).
    const byCampaign = new Map<string, { sent: number; opened: number; submitted: number; paid: number }>()
    for (const i of instances) {
      if (!i.campaignId) continue
      const row = byCampaign.get(i.campaignId) ?? { sent: 0, opened: 0, submitted: 0, paid: 0 }
      row.sent++
      if (i.status === 'OPENED' || i.status === 'SUBMITTED') row.opened++
      if (i.status === 'SUBMITTED') row.submitted++
      if (i.paymentStatus === 'PAID') row.paid++
      byCampaign.set(i.campaignId, row)
    }

    const pendingReview = await db.formSubmission.count({
      where: { formId: form.id, orgId: user.orgId, reviewStatus: 'PENDING' },
    })

    return ok({
      form,
      funnel: { sent, opened, submitted, paid, pendingReview },
      byCampaign: [...byCampaign.entries()].map(([campaignId, stats]) => ({ campaignId, ...stats })),
    })
  },
})
