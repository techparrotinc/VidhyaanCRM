import type { FormPurpose } from '@prisma/client'
import type { CanonicalKey } from '../types'

// A target adapter decouples the form engine from any concrete entity. To
// support a new vertical (junior-college stream, hostel seat, coaching batch)
// you add ONE adapter file and register it — no schema or engine change.

export interface AdapterContext {
  institutionType?: string | null
  /** module slugs the org is licensed for (e.g. admission_management) */
  enabledModules: Set<string>
}

/** Split produced by hybrid-apply: identity fields queue for counsellor
 *  accept; everything else applies immediately. */
export interface ApplyResult {
  applied: CanonicalKey[]
  pending: CanonicalKey[]
}

export interface ApplyArgs {
  targetId: string
  /** canonical answers extracted from a submission */
  values: Partial<Record<CanonicalKey, unknown>>
}

export interface CreateArgs {
  orgId: string
  values: Partial<Record<CanonicalKey, unknown>>
  campaignId?: string | null
  branchId?: string | null
  academicYearId?: string | null
}

// `db` is intentionally typed loose — callers pass either the tenant-scoped
// client (authenticated) or the base client with explicit orgId (public
// route). Adapters must never assume a session.
export interface TargetAdapter {
  purpose: FormPurpose
  /** license required to use this target; null = core (always available) */
  moduleSlug: string | null
  /** identity fields that must NOT auto-overwrite on an existing record */
  identityKeys: CanonicalKey[]
  licensed(ctx: AdapterContext): boolean
  labelNoun(institutionType?: string | null): string
  /** whitelisted prefill for the public form, keyed by canonical key */
  prefill(db: any, targetId: string): Promise<Partial<Record<CanonicalKey, unknown>>>
  /** update an existing record (hybrid split applied by caller in P2) */
  apply(db: any, args: ApplyArgs): Promise<ApplyResult>
  /** write ALL given canonical values, incl. identity — used when a
   *  counsellor accepts pending fields from a submission review. */
  forceApply(db: any, args: ApplyArgs): Promise<void>
  /** mint a fresh record from a submission (STANDALONE / campaign) */
  createFrom(db: any, args: CreateArgs): Promise<{ id: string }>
}
