import type { FormPurpose } from '@prisma/client'
import { admissionNoun } from '@/lib/institution'
import type { TargetAdapter, AdapterContext } from './types'
import { leadAdapter } from './lead.adapter'
import { admissionAdapter } from './admission.adapter'

// STANDALONE has no pre-existing record; it always mints a Lead. This is the
// universal entry point for campaigns and for orgs (e.g. learning centres)
// that don't license the admission module.
const standaloneAdapter: TargetAdapter = {
  purpose: 'STANDALONE',
  moduleSlug: 'lead_management',
  identityKeys: [],
  licensed: (ctx) => ctx.enabledModules.has('lead_management'),
  labelNoun: (institutionType) => `Public ${admissionNoun(institutionType).toLowerCase()} form`,
  prefill: async () => ({}),
  apply: async () => ({ applied: [], pending: [] }),
  forceApply: async () => {},
  createFrom: (db, args) => leadAdapter.createFrom(db, args),
}

// The registry. Add one entry to support a new vertical — the engine, the
// builder, and the public route all read from here.
const ADAPTERS: Record<FormPurpose, TargetAdapter> = {
  LEAD: leadAdapter,
  ADMISSION: admissionAdapter,
  STANDALONE: standaloneAdapter,
  // ENQUIRY: marketplace ParentEnquiry — added in a later phase.
  ENQUIRY: standaloneAdapter,
}

export function getAdapter(purpose: FormPurpose): TargetAdapter {
  return ADAPTERS[purpose]
}

/** Purposes a form builder may offer this org, gated by module license. */
export function availablePurposes(ctx: AdapterContext): FormPurpose[] {
  const order: FormPurpose[] = ['ADMISSION', 'LEAD', 'ENQUIRY', 'STANDALONE']
  const seen = new Set<FormPurpose>()
  return order.filter((p) => {
    const a = ADAPTERS[p]
    if (!a.licensed(ctx)) return false
    // ENQUIRY currently aliases STANDALONE; don't list it twice.
    if (seen.has(a.purpose) && p !== a.purpose) return false
    seen.add(a.purpose)
    return true
  })
}

export type { TargetAdapter, AdapterContext } from './types'
