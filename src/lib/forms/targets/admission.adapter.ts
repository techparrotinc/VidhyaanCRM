import { cleanPhoneNumber } from '@/lib/utils'
import { nextAdmissionCode } from '@/lib/admission-code'
import { admissionNoun } from '@/lib/institution'
import { findMatches, loadDedupConfig } from '@/lib/dedup'
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

    // Dedup via the same fuzzy engine every other create path in the CRM
    // uses (findMatches/hard-vs-soft rules, org-configurable) — a public
    // form previously only checked exact phone+name equality, missing the
    // engine's other hard-match combinations (e.g. phone+email) entirely.
    // A public submission can't be interactively resolved the way a staff
    // create can (no user to show a "possible duplicate" dialog to, no
    // force:true), so only a HARD match updates the existing record — same
    // person, safe to treat as a resubmission. A SOFT match or no match
    // creates a new record; ambiguous cases are left for staff to merge
    // manually via the CRM's own dedup tools rather than guessed here.
    const dedupConfig = await loadDedupConfig(db, orgId)
    const dedup = await findMatches(db, {
      orgId,
      phone: base.phone as string | undefined,
      email: base.email as string | undefined,
      childName: base.applicantName as string | undefined,
      grade: base.gradeSought as string | undefined,
      academicYearId: academicYearId ?? null,
    }, dedupConfig)
    const hardAdmissionMatch = dedup.hardBlock
      ? dedup.matches.find(m => m.type === 'admission' && m.action === 'hard')
      : undefined
    if (hardAdmissionMatch) {
      // findMatches doesn't filter archived admissions — don't silently
      // resurrect/overwrite one via a public resubmission, create fresh.
      const matched = await db.admission.findFirst({
        where: { id: hardAdmissionMatch.id, archivedAt: null },
        select: { id: true },
      })
      if (matched) {
        await db.admission.update({ where: { id: matched.id }, data: base })
        return { id: matched.id }
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
