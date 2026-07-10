import { prisma } from '@/lib/db/client'
import type { FormSchema } from './types'
import { extractCanonical, type UploadedFile } from './answers'
import { getAdapter } from './targets'

interface InstanceRef {
  id: string
  orgId: string
  formId: string
  targetType: any
  targetId: string | null
  campaignId: string | null
}

interface SubmitArgs {
  instance: InstanceRef
  form: { schema: unknown; version: number; feeRequired: boolean }
  data: Record<string, unknown>
  files: UploadedFile[]
  submitterIp?: string | null
}

// Routes canonical answers to the target entity via its adapter (hybrid-apply)
// and attaches files. Shared by the immediate submit path and the fee-paid
// finalize path (P3). Returns the resolved target + the applied/pending split.
export async function applyToTarget(
  instance: InstanceRef,
  schema: FormSchema,
  data: Record<string, unknown>,
  files: UploadedFile[],
): Promise<{ targetId: string | null; applied: string[]; pending: string[] }> {
  const values = extractCanonical(schema, data)
  const adapter = getAdapter(instance.targetType)

  let targetId = instance.targetId
  let applied: string[] = []
  let pending: string[] = []

  if (targetId) {
    const res = await adapter.apply(prisma, { targetId, values })
    applied = res.applied
    pending = res.pending
  } else {
    // Stamp the org's active academic year so minted records don't land as
    // year-less rows (those show under every year in the AY switcher).
    const activeYear = await prisma.academicYear.findFirst({
      where: { orgId: instance.orgId, status: 'ACTIVE' },
      select: { id: true },
    })
    const created = await adapter.createFrom(prisma, {
      orgId: instance.orgId,
      values,
      campaignId: instance.campaignId,
      academicYearId: activeYear?.id ?? null,
    })
    targetId = created.id
    applied = Object.keys(values)
  }

  if (targetId && files.length) {
    if (instance.targetType === 'ADMISSION') {
      await prisma.admissionDocument.createMany({
        data: files.map((f) => ({
          orgId: instance.orgId,
          admissionId: targetId!,
          name: f.name,
          type: (f.name.split('.').pop() || 'FILE').toUpperCase(),
          url: f.url,
          sizeBytes: f.size ?? null,
          scanStatus: 'PENDING' as const,
        })),
      })
    } else if (instance.targetType === 'LEAD') {
      // Leads have no document model — surface the uploads on the timeline
      // (also visible in the submission drawer).
      await prisma.leadActivity.create({
        data: {
          orgId: instance.orgId,
          leadId: targetId,
          type: 'SYSTEM',
          summary: `${files.length} file(s) attached via application form`,
          metadata: { files: files.map((f) => ({ name: f.name, url: f.url })) } as any,
        },
      })
    }
  }

  await logActivity(instance.orgId, instance.targetType, targetId, pending.length)
  return { targetId, applied, pending }
}

// Runs on the PUBLIC submit path via the base client (no session). Creates the
// submission and — unless an application fee is pending (P3 pays first) —
// routes answers to the target entity through its adapter (hybrid-apply:
// identity fields queue PENDING, the rest apply immediately).
export async function submitForm({ instance, form, data, files, submitterIp }: SubmitArgs) {
  const schema = form.schema as FormSchema
  const deferPay = form.feeRequired // apply after payment (P3)

  let targetId = instance.targetId
  let applied: string[] = []
  let pending: string[] = []

  if (!deferPay) {
    const res = await applyToTarget(instance, schema, data, files)
    targetId = res.targetId
    applied = res.applied
    pending = res.pending
  }

  // Re-submitting a fee form before paying replaces the prior unpaid draft
  // rather than stacking duplicates.
  if (deferPay) {
    await prisma.formSubmission.deleteMany({ where: { instanceId: instance.id, paymentStatus: 'PENDING' } })
  }

  const submission = await prisma.formSubmission.create({
    data: {
      orgId: instance.orgId,
      instanceId: instance.id,
      formId: instance.formId,
      targetType: instance.targetType,
      targetId,
      campaignId: instance.campaignId,
      schemaVersion: form.version,
      data: data as any,
      files: files as any,
      fieldStates: { applied, pending } as any,
      reviewStatus: pending.length ? 'PENDING' : 'ACCEPTED',
      paymentStatus: deferPay ? 'PENDING' : 'NONE',
      submitterIp: submitterIp ?? null,
    },
  })

  // Fee-gated forms complete on payment (P3); others complete now.
  await prisma.formInstance.update({
    where: { id: instance.id },
    data: deferPay
      ? { targetId, paymentStatus: 'PENDING' }
      : { status: 'SUBMITTED', submittedAt: new Date(), targetId },
  })

  return { submissionId: submission.id, targetId, pending, deferPay }
}

async function logActivity(orgId: string, targetType: string, targetId: string | null, pendingCount: number) {
  if (!targetId) return
  const summary =
    pendingCount > 0
      ? `Application form submitted — ${pendingCount} field(s) awaiting review`
      : 'Application form submitted'
  try {
    if (targetType === 'ADMISSION') {
      await prisma.admissionActivity.create({ data: { orgId, admissionId: targetId, type: 'SYSTEM', summary } })
    } else if (targetType === 'LEAD') {
      await prisma.leadActivity.create({ data: { orgId, leadId: targetId, type: 'SYSTEM', summary } })
    }
  } catch (err) {
    console.error('Form submit activity log failed:', err)
  }
}
