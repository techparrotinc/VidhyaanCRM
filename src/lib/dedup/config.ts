import { cleanPhoneNumber } from '@/lib/utils'

// Institution types that use the "enquiry / learner" language and where a child
// legitimately enrols in multiple courses within the same year.
const LC_TYPES = ['LEARNING_CENTER', 'COACHING_CENTER', 'SKILL_DEVELOPMENT', 'SPORTS_ACADEMY']

export type DedupAction = 'off' | 'soft' | 'hard'

// Only the *block-capable* rules are configurable. "Same child, next year"
// (re-admission) and "same phone, different child" (sibling) are always allowed
// and handled by the household layer — they are never blocks.
export type DedupRuleKey =
  | 'exactApplication'  // R1: phone + child + grade + year
  | 'sameChildSameYear' // R2: phone + child + year (grade may differ)
  | 'contactAndChild'   // R3: phone + email + child (year-agnostic)
  | 'emailAndChild'     // R4: email + child, phone differs
  | 'sharedEmail'       // R7: email only, phone + child differ
  | 'nameOnly'          // R8: child + grade, no phone/email match

export type DedupConfig = Record<DedupRuleKey, DedupAction>

export interface DedupRuleMeta {
  key: DedupRuleKey
  label: string
  signals: string
  description: string
}

// Ordered strongest → weakest. Drives both evaluation precedence and the
// Settings UI ordering.
export const RULE_META: DedupRuleMeta[] = [
  {
    key: 'exactApplication',
    label: 'Exact duplicate application',
    signals: 'Phone + Child + Grade + Year',
    description: 'The same child, grade and year for the same phone — a true resubmit.',
  },
  {
    key: 'sameChildSameYear',
    label: 'Same child, same year',
    signals: 'Phone + Child + Year',
    description: 'Same child and year for the same phone, even if the grade/course differs.',
  },
  {
    key: 'contactAndChild',
    label: 'Same contact & child',
    signals: 'Phone + Email + Child',
    description: 'Same phone, email and child across any year — likely the same person.',
  },
  {
    key: 'emailAndChild',
    label: 'Same email & child',
    signals: 'Email + Child (different phone)',
    description: 'Same email and child but a different phone number — possible duplicate.',
  },
  {
    key: 'sharedEmail',
    label: 'Shared email',
    signals: 'Email only',
    description: 'Same email with a different phone and child — often a mistyped record.',
  },
  {
    key: 'nameOnly',
    label: 'Name-only match',
    signals: 'Child + Grade (no phone/email)',
    description: 'Same child name and grade with no contact match — a weak, noisy signal.',
  },
]

export function isLearningCentre(institutionType?: string | null): boolean {
  return !!institutionType && LC_TYPES.includes(institutionType)
}

/** Sensible, institution-aware defaults. */
export function defaultDedupConfig(institutionType?: string | null): DedupConfig {
  const lc = isLearningCentre(institutionType)
  return {
    exactApplication: 'hard',
    // A learner can join multiple courses in one year, so a same-year match is
    // only advisory for LC-type orgs; for schools it's a hard duplicate.
    sameChildSameYear: lc ? 'soft' : 'hard',
    contactAndChild: 'soft',
    emailAndChild: 'soft',
    sharedEmail: 'soft',
    nameOnly: 'off',
  }
}

const VALID_ACTIONS: DedupAction[] = ['off', 'soft', 'hard']

/** Merge an org's stored partial config over the institution-aware defaults. */
export function resolveDedupConfig(
  settings: unknown,
  institutionType?: string | null
): DedupConfig {
  const base = defaultDedupConfig(institutionType)
  const stored = (settings as any)?.dedup?.rules
  if (stored && typeof stored === 'object') {
    for (const key of Object.keys(base) as DedupRuleKey[]) {
      const v = stored[key]
      if (VALID_ACTIONS.includes(v)) base[key] = v
    }
  }
  return base
}

// ---- normalization helpers (single source; used on read AND write) ----
export const normPhone = (v?: string | null): string | null => {
  if (!v) return null
  const c = cleanPhoneNumber(v)
  return typeof c === 'string' && c.length > 0 ? c : null
}
export const normEmail = (v?: string | null): string | null => {
  if (!v) return null
  const c = v.trim().toLowerCase()
  return c.length > 0 ? c : null
}
export const normName = (v?: string | null): string | null => {
  if (!v) return null
  const c = v.trim().replace(/\s+/g, ' ').toLowerCase()
  return c.length > 0 ? c : null
}
