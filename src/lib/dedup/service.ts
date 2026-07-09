import {
  DedupAction,
  DedupConfig,
  DedupRuleKey,
  resolveDedupConfig,
  normPhone,
  normEmail,
  normName,
} from './config'

export type DedupRecordType = 'lead' | 'admission' | 'student'

export interface DedupMatch {
  type: DedupRecordType
  id: string
  code: string
  name: string
  grade: string | null
  phone: string | null
  email: string | null
  status: string
  householdId: string | null
  rule: DedupRuleKey
  action: DedupAction
  createdAt: Date
}

export interface DedupResult {
  /** Strongest action across all matches; 'off' means nothing worth surfacing. */
  action: DedupAction
  hardBlock: boolean
  matches: DedupMatch[]
  phoneNormalized: string | null
}

export interface DedupInput {
  orgId: string
  phone?: string | null
  email?: string | null
  childName?: string | null
  grade?: string | null
  academicYearId?: string | null
}

// A prisma-ish client — works for both the base client and the tenant $extends
// client. Callers pass whichever they already hold in scope.
type DbClient = any

const SEVERITY: Record<DedupAction, number> = { off: 0, soft: 1, hard: 2 }
const stronger = (a: DedupAction, b: DedupAction) => (SEVERITY[a] >= SEVERITY[b] ? a : b)

interface Cand {
  type: DedupRecordType
  id: string
  code: string
  name: string
  grade: string | null
  phone: string | null
  email: string | null
  status: string
  householdId: string | null
  createdAt: Date
  // normalized
  pn: string | null
  en: string | null
  cn: string | null
  gn: string | null
  year: string | null
}

/**
 * Decide which (if any) block rule this candidate trips, strongest first.
 * Returns null when no *block-capable* rule matches (sibling / next-year /
 * no-match all fall here — those are handled by the household layer, never a block).
 */
function ruleFor(input: {
  pn: string | null; en: string | null; cn: string | null; gn: string | null; year: string | null
}, c: Cand): DedupRuleKey | null {
  const samePhone = !!input.pn && input.pn === c.pn
  const sameEmail = !!input.en && input.en === c.en
  const sameChild = !!input.cn && input.cn === c.cn
  const sameGrade = !!input.gn && input.gn === c.gn
  const sameYear = !!input.year && input.year === c.year

  if (samePhone && sameChild && sameGrade && sameYear) return 'exactApplication'
  if (samePhone && sameChild && sameYear) return 'sameChildSameYear'
  if (samePhone && sameEmail && sameChild) return 'contactAndChild'
  if (sameEmail && sameChild && !samePhone) return 'emailAndChild'
  if (sameEmail && !samePhone && !sameChild) return 'sharedEmail'
  if (sameChild && sameGrade && !samePhone && !sameEmail) return 'nameOnly'
  return null
}

/**
 * Core dedup scan. Pulls candidate leads/admissions/students that share the
 * normalized phone OR the email, evaluates each against the org's configured
 * rules, and returns the strongest action plus every relevant match.
 */
export async function findMatches(
  client: DbClient,
  input: DedupInput,
  config: DedupConfig
): Promise<DedupResult> {
  const pn = normPhone(input.phone)
  const en = normEmail(input.email)
  const cn = normName(input.childName)
  const gn = normName(input.grade)
  const year = input.academicYearId || null

  // Nothing to match on → nothing to dedup.
  if (!pn && !en) {
    return { action: 'off', hardBlock: false, matches: [], phoneNormalized: pn }
  }

  const orgId = input.orgId
  const emailFilter = en ? [{ email: { equals: en, mode: 'insensitive' as const } }] : []
  const phoneFilter = pn ? [{ phoneNormalized: pn }] : []
  const take = 25

  const [leads, admissions, students] = await Promise.all([
    client.lead.findMany({
      where: { orgId, deletedAt: null, OR: [...phoneFilter, ...emailFilter] },
      select: {
        id: true, leadCode: true, kidName: true, gradeSought: true, phone: true,
        email: true, status: true, householdId: true, academicYearId: true,
        phoneNormalized: true, createdAt: true,
      },
      take,
      orderBy: { createdAt: 'desc' },
    }),
    client.admission.findMany({
      where: { orgId, deletedAt: null, OR: [...phoneFilter, ...emailFilter] },
      select: {
        id: true, admissionCode: true, applicantName: true, gradeSought: true, phone: true,
        email: true, status: true, householdId: true, academicYearId: true,
        phoneNormalized: true, createdAt: true,
      },
      take,
      orderBy: { createdAt: 'desc' },
    }),
    client.student.findMany({
      where: {
        orgId, deletedAt: null,
        OR: [...phoneFilter, ...(en ? [{ guardianEmail: { equals: en, mode: 'insensitive' as const } }] : [])],
      },
      select: {
        id: true, studentCode: true, name: true, gradeLabel: true, guardianPhone: true,
        guardianEmail: true, status: true, householdId: true, academicYearId: true,
        phoneNormalized: true, createdAt: true,
      },
      take,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const cands: Cand[] = [
    ...leads.map((r: any): Cand => ({
      type: 'lead', id: r.id, code: r.leadCode, name: r.kidName ?? '', grade: r.gradeSought ?? null,
      phone: r.phone ?? null, email: r.email ?? null, status: r.status, householdId: r.householdId ?? null,
      createdAt: r.createdAt, pn: r.phoneNormalized ?? normPhone(r.phone), en: normEmail(r.email),
      cn: normName(r.kidName), gn: normName(r.gradeSought), year: r.academicYearId ?? null,
    })),
    ...admissions.map((r: any): Cand => ({
      type: 'admission', id: r.id, code: r.admissionCode, name: r.applicantName ?? '', grade: r.gradeSought ?? null,
      phone: r.phone ?? null, email: r.email ?? null, status: r.status, householdId: r.householdId ?? null,
      createdAt: r.createdAt, pn: r.phoneNormalized ?? normPhone(r.phone), en: normEmail(r.email),
      cn: normName(r.applicantName), gn: normName(r.gradeSought), year: r.academicYearId ?? null,
    })),
    ...students.map((r: any): Cand => ({
      type: 'student', id: r.id, code: r.studentCode, name: r.name ?? '', grade: r.gradeLabel ?? null,
      phone: r.guardianPhone ?? null, email: r.guardianEmail ?? null, status: r.status, householdId: r.householdId ?? null,
      createdAt: r.createdAt, pn: r.phoneNormalized ?? normPhone(r.guardianPhone), en: normEmail(r.guardianEmail),
      cn: normName(r.name), gn: normName(r.gradeLabel), year: r.academicYearId ?? null,
    })),
  ]

  const evalInput = { pn, en, cn, gn, year }
  const matches: DedupMatch[] = []
  let action: DedupAction = 'off'

  for (const c of cands) {
    const rule = ruleFor(evalInput, c)
    if (!rule) continue
    const ruleAction = config[rule]
    if (ruleAction === 'off') continue
    matches.push({
      type: c.type, id: c.id, code: c.code, name: c.name, grade: c.grade, phone: c.phone,
      email: c.email, status: c.status, householdId: c.householdId, rule, action: ruleAction,
      createdAt: c.createdAt,
    })
    action = stronger(action, ruleAction)
  }

  // Surface the strongest matches first.
  matches.sort((a, b) => SEVERITY[b.action] - SEVERITY[a.action])

  return { action, hardBlock: action === 'hard', matches, phoneNormalized: pn }
}

/** Load the resolved (defaults + org overrides) dedup config for an org. */
export async function loadDedupConfig(client: DbClient, orgId: string): Promise<DedupConfig> {
  const org = await client.organization.findUnique({
    where: { id: orgId },
    select: { settings: true, institutionType: true },
  })
  return resolveDedupConfig(org?.settings, org?.institutionType)
}
