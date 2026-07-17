import { cleanPhoneNumber } from '@/lib/utils'
import { nextAdmissionCode } from '@/lib/admission-code'
import { admissionNoun } from '@/lib/institution'
import { normName } from '@/lib/dedup/config'
import type { CanonicalKey } from '../types'
import type { TargetAdapter, AdapterContext } from './types'

const IDENTITY: CanonicalKey[] = ['applicant.name', 'contact.phone', 'parent.name', 'grade']

function admissionToCanonical(a: any): Partial<Record<CanonicalKey, unknown>> {
  return {
    'applicant.name': a.applicantName ?? undefined,
    'parent.name': a.parentName ?? undefined,
    'contact.phone': a.phone ?? undefined,
    'contact.email': a.email ?? undefined,
    grade: a.gradeSought ?? undefined,
  }
}

function canonicalToAdmission(values: Partial<Record<CanonicalKey, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (values['applicant.name'] != null) out.applicantName = String(values['applicant.name'])
  if (values['parent.name'] != null) out.parentName = String(values['parent.name'])
  if (values['contact.phone'] != null) {
    out.phone = String(values['contact.phone'])
    out.phoneNormalized = cleanPhoneNumber(values['contact.phone'])
  }
  if (values['contact.email'] != null) out.email = String(values['contact.email'])
  if (values['grade'] != null) out.gradeSought = String(values['grade'])
  return out
}

export const admissionAdapter: TargetAdapter = {
  purpose: 'ADMISSION',
  moduleSlug: 'admission_management',
  identityKeys: IDENTITY,

  licensed(ctx: AdapterContext) {
    return ctx.enabledModules.has('admission_management')
  },

  labelNoun(institutionType) {
    return admissionNoun(institutionType) // "Admission" | "Enrolment"
  },

  async prefill(db, targetId) {
    const a = await db.admission.findUnique({ where: { id: targetId } })
    return a ? admissionToCanonical(a) : {}
  },

  async apply(db, { targetId, values }) {
    const applied: CanonicalKey[] = []
    const pending: CanonicalKey[] = []
    const writable: Partial<Record<CanonicalKey, unknown>> = {}
    for (const k of Object.keys(values) as CanonicalKey[]) {
      if (values[k] == null) continue
      if (IDENTITY.includes(k)) pending.push(k)
      else {
        writable[k] = values[k]
        applied.push(k)
      }
    }
    const data = canonicalToAdmission(writable)
    if (Object.keys(data).length) {
      await db.admission.update({ where: { id: targetId }, data })
    }
    return { applied, pending }
  },

  async forceApply(db, { targetId, values }) {
    const data = canonicalToAdmission(values)
    if (Object.keys(data).length) await db.admission.update({ where: { id: targetId }, data })
  },

  async createFrom(db, { orgId, values, branchId, academicYearId }) {
    const base = canonicalToAdmission(values)

    // Dedup on phone: update the existing active admission rather than
    // creating a duplicate — but only when the applicant name also matches.
    // Two siblings can share a household phone; matching on phone alone
    // silently overwrote the first child's name/grade/everything with the
    // second child's submission. Different child on the same phone now
    // creates a separate admission instead.
    const phoneNorm = base.phoneNormalized as string | undefined
    if (phoneNorm) {
      const candidates = await db.admission.findMany({
        where: { orgId, phoneNormalized: phoneNorm, deletedAt: null, archivedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true, applicantName: true },
      })
      // No applicant name on this submission → can't disambiguate siblings,
      // fall back to phone-only (most recent) as before.
      const submittedChild = normName(base.applicantName as string | undefined)
      const existing = submittedChild
        ? candidates.find((c: any) => normName(c.applicantName) === submittedChild)
        : candidates[0]
      if (existing) {
        await db.admission.update({ where: { id: existing.id }, data: base })
        return { id: existing.id }
      }
    }

    const prefix = `AT-${new Date().getFullYear()}-`
    const admissionCode = await nextAdmissionCode(orgId, prefix)
    // Land it on the first pipeline stage so it shows correctly in kanban.
    const firstStage = await db.admissionStage.findFirst({
      where: { orgId, deletedAt: null, isLost: false },
      orderBy: { sortOrder: 'asc' },
      select: { id: true },
    })
    const a = await db.admission.create({
      data: {
        orgId,
        branchId: branchId ?? undefined,
        academicYearId: academicYearId ?? undefined,
        admissionCode,
        stageId: firstStage?.id ?? null,
        applicantName: (base.applicantName as string) ?? 'Unknown',
        parentName: base.parentName as string | undefined,
        phone: base.phone as string | undefined,
        phoneNormalized: base.phoneNormalized as string | undefined,
        email: base.email as string | undefined,
        gradeSought: base.gradeSought as string | undefined,
        status: 'IN_PROGRESS',
      },
    })
    return { id: a.id }
  },
}
