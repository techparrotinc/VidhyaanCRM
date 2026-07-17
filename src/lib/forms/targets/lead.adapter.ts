import { cleanPhoneNumber } from '@/lib/utils'
import { nextLeadCode } from '@/lib/lead-code'
import { admissionNoun } from '@/lib/institution'
import { normName } from '@/lib/dedup/config'
import type { CanonicalKey } from '../types'
import type { TargetAdapter, AdapterContext } from './types'

const IDENTITY: CanonicalKey[] = ['applicant.name', 'contact.phone', 'parent.name']

// Maps a Lead row into whitelisted canonical prefill values.
function leadToCanonical(lead: any): Partial<Record<CanonicalKey, unknown>> {
  return {
    'applicant.name': lead.kidName ?? undefined,
    'parent.name': lead.parentName ?? undefined,
    'contact.phone': lead.phone ?? undefined,
    'contact.email': lead.email ?? undefined,
    grade: lead.gradeSought ?? undefined,
    course: lead.course ?? undefined,
  }
}

// Maps canonical answers onto Lead columns.
function canonicalToLead(values: Partial<Record<CanonicalKey, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (values['applicant.name'] != null) out.kidName = String(values['applicant.name'])
  if (values['parent.name'] != null) out.parentName = String(values['parent.name'])
  if (values['contact.phone'] != null) {
    out.phone = String(values['contact.phone'])
    out.phoneNormalized = cleanPhoneNumber(values['contact.phone'])
  }
  if (values['contact.email'] != null) out.email = String(values['contact.email'])
  if (values['grade'] != null) out.gradeSought = String(values['grade'])
  if (values['course'] != null) out.course = String(values['course'])
  return out
}

export const leadAdapter: TargetAdapter = {
  purpose: 'LEAD',
  moduleSlug: 'lead_management',
  identityKeys: IDENTITY,

  licensed(ctx: AdapterContext) {
    return ctx.enabledModules.has('lead_management')
  },

  labelNoun(institutionType) {
    return `${admissionNoun(institutionType)} enquiry`
  },

  async prefill(db, targetId) {
    const lead = await db.lead.findUnique({ where: { id: targetId } })
    return lead ? leadToCanonical(lead) : {}
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
    const data = canonicalToLead(writable)
    if (Object.keys(data).length) {
      await db.lead.update({ where: { id: targetId }, data })
    }
    return { applied, pending }
  },

  async forceApply(db, { targetId, values }) {
    const data = canonicalToLead(values)
    if (Object.keys(data).length) await db.lead.update({ where: { id: targetId }, data })
  },

  async createFrom(db, { orgId, values, branchId, academicYearId }) {
    const base = canonicalToLead(values)

    // Dedup: a public submission from a known phone updates that lead rather
    // than minting a duplicate — but only when the child name also matches.
    // Two siblings can share a household phone; matching on phone alone
    // silently overwrote the first child's name/grade/everything with the
    // second child's submission. Different child on the same phone now
    // creates a separate lead instead.
    const phoneNorm = base.phoneNormalized as string | undefined
    if (phoneNorm) {
      const candidates = await db.lead.findMany({
        where: { orgId, phoneNormalized: phoneNorm, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true, kidName: true },
      })
      // No child name on this submission → can't disambiguate siblings,
      // fall back to phone-only (most recent) as before.
      const submittedChild = normName(base.kidName as string | undefined)
      const existing = submittedChild
        ? candidates.find((c: any) => normName(c.kidName) === submittedChild)
        : candidates[0]
      if (existing) {
        await db.lead.update({ where: { id: existing.id }, data: base })
        return { id: existing.id }
      }
    }

    const leadCode = await nextLeadCode(orgId)
    const lead = await db.lead.create({
      data: {
        orgId,
        branchId: branchId ?? undefined,
        academicYearId: academicYearId ?? undefined,
        leadCode,
        parentName: (base.parentName as string) ?? 'Unknown',
        phone: (base.phone as string) ?? '',
        phoneNormalized: base.phoneNormalized as string | undefined,
        email: base.email as string | undefined,
        kidName: base.kidName as string | undefined,
        gradeSought: base.gradeSought as string | undefined,
        course: base.course as string | undefined,
        source: 'WEBSITE',
      },
    })
    return { id: lead.id }
  },
}
