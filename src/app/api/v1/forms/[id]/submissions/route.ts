import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'

// All submissions for a form, newest first — full answers + files so the
// review drawer can show everything (mapped AND custom fields).
export const GET = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ db, user, params }) => {
    const form = await db.form.findFirst({
      where: { id: params!.id, orgId: user.orgId },
      select: { id: true, name: true, schema: true },
    })
    if (!form) throw Errors.notFound('Form')

    const submissions = await db.formSubmission.findMany({
      where: { formId: form.id, orgId: user.orgId },
      orderBy: { submittedAt: 'desc' },
      take: 200,
    })

    // Resolve a display label per target (lead/admission name).
    // STANDALONE submissions mint a Lead (see targets/index.ts), so their
    // targetId resolves through the lead table too.
    const isLeadTarget = (t: string) => t === 'LEAD' || t === 'STANDALONE' || t === 'ENQUIRY'
    const leadIds = submissions.filter((s) => isLeadTarget(s.targetType) && s.targetId).map((s) => s.targetId!)
    const admIds = submissions.filter((s) => s.targetType === 'ADMISSION' && s.targetId).map((s) => s.targetId!)
    const [leads, adms] = await Promise.all([
      leadIds.length ? db.lead.findMany({ where: { id: { in: leadIds } }, select: { id: true, parentName: true, kidName: true } }) : [],
      admIds.length ? db.admission.findMany({ where: { id: { in: admIds } }, select: { id: true, applicantName: true } }) : [],
    ])
    const leadName = new Map(leads.map((l) => [l.id, l.kidName || l.parentName]))
    const admName = new Map(adms.map((a) => [a.id, a.applicantName]))

    return ok({
      form: { id: form.id, name: form.name, schema: form.schema },
      submissions: submissions.map((s) => ({
        id: s.id,
        targetType: s.targetType,
        targetId: s.targetId,
        targetLabel: isLeadTarget(s.targetType) ? leadName.get(s.targetId ?? '') : s.targetType === 'ADMISSION' ? admName.get(s.targetId ?? '') : null,
        data: s.data,
        files: s.files,
        fieldStates: s.fieldStates,
        reviewStatus: s.reviewStatus,
        paymentStatus: s.paymentStatus,
        submittedAt: s.submittedAt,
      })),
    })
  },
})
