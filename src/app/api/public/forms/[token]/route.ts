import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import type { FormSchema, CanonicalKey } from '@/lib/forms/types'
import { schemaFields } from '@/lib/forms/types'
import { validateAnswers, prefillToFieldValues, type UploadedFile } from '@/lib/forms/answers'
import { submitForm } from '@/lib/forms/submit'
import { windowLimiter } from '@/lib/ratelimit'

// Loads an instance + its form by token. The token is the entire security
// boundary — no session here. Prefill/options are whitelisted.
async function loadByToken(token: string) {
  const instance = await prisma.formInstance.findUnique({ where: { token } })
  if (!instance) return null
  // Load even if the form was soft-deleted — already-sent links stay valid
  // (the list-delete dialog promises this).
  const form = await prisma.form.findUnique({ where: { id: instance.formId } })
  if (!form) return null
  return { instance, form }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  const loaded = await loadByToken(token)
  if (!loaded) return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  const { instance, form } = loaded

  const expired = instance.expiresAt && instance.expiresAt < new Date()
  const completed = instance.status === 'SUBMITTED'
  const schema = form.schema as unknown as FormSchema

  // Mark opened (first view only).
  if (instance.status === 'SENT' && !expired) {
    await prisma.formInstance.update({ where: { id: instance.id }, data: { status: 'OPENED', openedAt: new Date() } })
  }

  // Related options — only for the related types actually used, and only
  // course/academic year (never expose staff on a public page).
  const relatedTypes = new Set(schemaFields(schema).filter((f) => f.type === 'related').map((f) => f.relatedTo))
  const relatedOptions: Record<string, { id: string; label: string }[]> = {}
  if (relatedTypes.has('course')) {
    const courses = await prisma.course.findMany({ where: { orgId: form.orgId, isActive: true, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
    relatedOptions.course = courses.map((c) => ({ id: c.id, label: c.name }))
  }
  if (relatedTypes.has('academicYear')) {
    const years = await prisma.academicYear.findMany({ where: { orgId: form.orgId }, select: { id: true, name: true }, orderBy: { startDate: 'desc' } })
    relatedOptions.academicYear = years.map((y) => ({ id: y.id, label: y.name }))
  }

  const org = await prisma.organization.findUnique({ where: { id: form.orgId }, select: { name: true } })

  return NextResponse.json({
    status: expired ? 'EXPIRED' : completed ? 'SUBMITTED' : 'OPEN',
    orgName: org?.name ?? '',
    form: {
      name: form.name,
      description: form.description,
      schema,
      settings: form.settings,
      feeRequired: form.feeRequired,
      applicationFeeAmount: form.applicationFeeAmount != null ? String(form.applicationFeeAmount) : null,
      feeCurrency: form.feeCurrency,
    },
    prefill: prefillToFieldValues(schema, (instance.prefill ?? {}) as Partial<Record<CanonicalKey, unknown>>),
    relatedOptions,
  })
}

const submitSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  files: z
    .array(z.object({ fieldKey: z.string(), url: z.string().url(), name: z.string(), size: z.number().optional() }))
    .optional(),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params

  const ipForLimit = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
  const limit = await windowLimiter(`form-submit:${token}:${ipForLimit}`, 10, 60)
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many attempts, please wait a moment' }, { status: 429 })
  }

  const loaded = await loadByToken(token)
  if (!loaded) return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  const { instance, form } = loaded

  if (instance.expiresAt && instance.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This form link has expired' }, { status: 410 })
  }
  if (instance.status === 'SUBMITTED') {
    return NextResponse.json({ error: 'This form was already submitted' }, { status: 409 })
  }

  // Atomically claim the single-use link before doing any submission work.
  // The status check above alone is read-then-write: two concurrent submits
  // on the same token could both pass it and both fully process (double
  // Lead/Admission creation, one request then crashing later on an
  // assumption the other request already violated). Fee-gated forms stay
  // resubmittable while unpaid by design (submitForm deletes the prior
  // PENDING draft) so they're not claimed here — submitForm's own
  // paymentStatus bookkeeping is the guard for those.
  if (!form.feeRequired) {
    const claimed = await prisma.formInstance.updateMany({
      where: { id: instance.id, status: { not: 'SUBMITTED' } },
      data: { status: 'SUBMITTED', submittedAt: new Date() }
    })
    if (claimed.count === 0) {
      return NextResponse.json({ error: 'This form was already submitted' }, { status: 409 })
    }
  }

  const body = submitSchema.parse(await req.json())
  const files = (body.files ?? []) as UploadedFile[]
  const schema = form.schema as unknown as FormSchema

  const issues = validateAnswers(schema, body.data, files)
  if (issues.length) {
    if (!form.feeRequired) {
      await prisma.formInstance.update({ where: { id: instance.id }, data: { status: instance.status, submittedAt: null } })
    }
    return NextResponse.json({ error: 'Please fix the highlighted fields', issues }, { status: 422 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  let result
  try {
    result = await submitForm({
      instance: {
        id: instance.id,
        orgId: instance.orgId,
        formId: instance.formId,
        targetType: instance.targetType,
        targetId: instance.targetId,
        campaignId: instance.campaignId,
      },
      form: { schema, version: form.version, feeRequired: form.feeRequired },
      data: body.data,
      files,
      submitterIp: ip,
    })
  } catch (err) {
    // Release the claim so a genuinely failed submission doesn't burn the
    // link — only a successful submitForm should leave it SUBMITTED.
    if (!form.feeRequired) {
      await prisma.formInstance.update({
        where: { id: instance.id },
        data: { status: instance.status, submittedAt: null }
      }).catch(() => {})
    }
    throw err
  }

  return NextResponse.json({
    ok: true,
    paymentRequired: result.deferPay,
    successMessage: (form.settings as any)?.successMessage ?? null,
  })
}
