import { prisma } from '@/lib/db/client'
import type { FormSchema } from './types'
import type { UploadedFile } from './answers'
import { applyToTarget } from './submit'

// Called after an application fee is confirmed paid (P3). Runs the deferred
// hybrid-apply for the pending submission, then marks everything complete.
// Idempotent: a no-op if the instance is already SUBMITTED.
export async function finalizeFeePaidSubmission(instanceId: string): Promise<void> {
  const instance = await prisma.formInstance.findUnique({ where: { id: instanceId } })
  if (!instance || instance.status === 'SUBMITTED') return

  const form = await prisma.form.findUnique({ where: { id: instance.formId } })
  if (!form) return

  const submission = await prisma.formSubmission.findFirst({
    where: { instanceId, paymentStatus: 'PENDING' },
    orderBy: { submittedAt: 'desc' },
  })
  if (!submission) return

  const schema = form.schema as unknown as FormSchema
  const files = (submission.files ?? []) as unknown as UploadedFile[]

  const { targetId, applied, pending } = await applyToTarget(
    { id: instance.id, orgId: instance.orgId, formId: instance.formId, targetType: instance.targetType, targetId: instance.targetId, campaignId: instance.campaignId },
    schema,
    submission.data as Record<string, unknown>,
    files,
  )

  await prisma.formSubmission.update({
    where: { id: submission.id },
    data: {
      targetId,
      paymentStatus: 'PAID',
      reviewStatus: pending.length ? 'PENDING' : 'ACCEPTED',
      fieldStates: { applied, pending } as any,
    },
  })

  await prisma.formInstance.update({
    where: { id: instance.id },
    data: { status: 'SUBMITTED', submittedAt: new Date(), paymentStatus: 'PAID', targetId },
  })
}
