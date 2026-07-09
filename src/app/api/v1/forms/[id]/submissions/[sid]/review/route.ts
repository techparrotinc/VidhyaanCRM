import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import type { FormSchema, CanonicalKey } from '@/lib/forms/types'
import { extractCanonical } from '@/lib/forms/answers'
import { getAdapter } from '@/lib/forms/targets'

const bodySchema = z.object({
  action: z.enum(['accept', 'reject']),
  // canonical keys to accept; omitted = all pending
  keys: z.array(z.string()).optional(),
})

// Counsellor resolves the identity fields a submission held for review.
// Accept writes them onto the target record via the adapter; reject drops them.
export const POST = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ req, db, user, params }) => {
    const body = bodySchema.parse(await req.json())

    const submission = await db.formSubmission.findFirst({
      where: { id: params!.sid, formId: params!.id, orgId: user.orgId },
    })
    if (!submission) throw Errors.notFound('Submission')

    const states = (submission.fieldStates ?? {}) as { applied?: string[]; pending?: string[] }
    const pending = states.pending ?? []

    if (body.action === 'reject') {
      await db.formSubmission.update({
        where: { id: submission.id },
        data: { reviewStatus: 'REJECTED', reviewedById: user.id, reviewedAt: new Date() },
      })
      return ok({ reviewStatus: 'REJECTED' })
    }

    // Accept — apply the chosen pending canonical values onto the target.
    const accept = (body.keys ?? pending).filter((k) => pending.includes(k))
    if (!submission.targetId || accept.length === 0) {
      await db.formSubmission.update({
        where: { id: submission.id },
        data: { reviewStatus: 'ACCEPTED', reviewedById: user.id, reviewedAt: new Date() },
      })
      return ok({ reviewStatus: 'ACCEPTED' })
    }

    const form = await db.form.findFirst({ where: { id: submission.formId, orgId: user.orgId }, select: { schema: true } })
    const schema = (form?.schema ?? { sections: [] }) as unknown as FormSchema
    const allValues = extractCanonical(schema, submission.data as Record<string, unknown>)
    const values: Partial<Record<CanonicalKey, unknown>> = {}
    for (const k of accept) if (allValues[k as CanonicalKey] != null) values[k as CanonicalKey] = allValues[k as CanonicalKey]

    await getAdapter(submission.targetType).forceApply(db, { targetId: submission.targetId, values })

    const remaining = pending.filter((k) => !accept.includes(k))
    await db.formSubmission.update({
      where: { id: submission.id },
      data: {
        fieldStates: { applied: [...(states.applied ?? []), ...accept], pending: remaining } as any,
        reviewStatus: remaining.length ? 'PENDING' : 'ACCEPTED',
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    })

    // Timeline entry.
    const summary = `Application review: applied ${accept.length} field(s) — ${accept.join(', ')}`
    try {
      if (submission.targetType === 'ADMISSION') {
        await db.admissionActivity.create({ data: { orgId: user.orgId, admissionId: submission.targetId, type: 'SYSTEM', summary, performedById: user.id } })
      } else if (submission.targetType === 'LEAD') {
        await db.leadActivity.create({ data: { orgId: user.orgId, leadId: submission.targetId, type: 'SYSTEM', summary, performedById: user.id } })
      }
    } catch (err) {
      console.error('Review activity log failed:', err)
    }

    return ok({ reviewStatus: remaining.length ? 'PENDING' : 'ACCEPTED', applied: accept })
  },
})
