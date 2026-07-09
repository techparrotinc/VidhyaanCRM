// Canonical modules for the org usage dashboard. Both the API-composer usage
// events (feature = route module or /api/v1 path segment) and the client page
// heartbeats (feature = CRM page path) are normalised to these slugs so the
// two signals line up.

export interface UsageModule {
  slug: string
  label: string
}

export const USAGE_MODULES: UsageModule[] = [
  { slug: 'lead_management', label: 'Lead Management' },
  { slug: 'admission_management', label: 'Admissions' },
  { slug: 'student_management', label: 'Student Management' },
  { slug: 'fee_management', label: 'Fee Management' },
  { slug: 'campaign_management', label: 'Campaigns' },
  { slug: 'events', label: 'Events' },
  { slug: 'reports', label: 'Reports' },
  { slug: 'users', label: 'Team & Users' },
  { slug: 'forms', label: 'Digital Forms' },
  { slug: 'dashboard', label: 'Dashboard' },
  { slug: 'settings', label: 'Settings' },
  { slug: 'other', label: 'Other' },
]

export const MODULE_LABEL: Record<string, string> = Object.fromEntries(
  USAGE_MODULES.map((m) => [m.slug, m.label])
)

export function moduleLabel(slug: string): string {
  return MODULE_LABEL[slug] || slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Modules that map to a licensable org module slug (organizationModules.module.slug),
// used for adoption (used / enabled). dashboard/settings/other are always-on.
export const LICENSABLE_MODULE_SLUGS = new Set([
  'lead_management',
  'admission_management',
  'student_management',
  'fee_management',
  'campaign_management',
  'events',
  'reports',
  'forms',
])

// API-event feature (config.module or /api/v1 path segment) → canonical slug.
const FEATURE_ALIASES: Record<string, string> = {
  leads: 'lead_management',
  lead_management: 'lead_management',
  admissions: 'admission_management',
  admission_management: 'admission_management',
  students: 'student_management',
  student_management: 'student_management',
  fees: 'fee_management',
  invoices: 'fee_management',
  payments: 'fee_management',
  fee_management: 'fee_management',
  campaigns: 'campaign_management',
  campaign_management: 'campaign_management',
  events: 'events',
  event_management: 'events',
  reports: 'reports',
  advanced_reports: 'reports',
  users: 'users',
  roles: 'users',
  forms: 'forms',
  dashboard: 'dashboard',
  settings: 'settings',
}

export function normalizeFeature(raw: string | null | undefined): string {
  if (!raw) return 'other'
  const key = raw.toLowerCase()
  return FEATURE_ALIASES[key] || 'other'
}

// CRM page path (e.g. /lead-management/123) → canonical slug.
export function moduleFromPagePath(path: string | null | undefined): string {
  if (!path) return 'other'
  const seg = path.split('/').filter(Boolean)[0] || ''
  const map: Record<string, string> = {
    'dashboard': 'dashboard',
    'lead-management': 'lead_management',
    'admission-management': 'admission_management',
    'student-management': 'student_management',
    'fee-management': 'fee_management',
    'campaign-management': 'campaign_management',
    'event-management': 'events',
    'reports': 'reports',
    'users': 'users',
    'roles': 'users',
    'settings': 'settings',
  }
  return map[seg] || 'other'
}

// Default minutes-saved-per-action model (admin-overridable in settings).
export const DEFAULT_MINUTES_PER_ACTION: Record<string, number> = {
  lead_management: 3,
  admission_management: 5,
  student_management: 4,
  fee_management: 6,
  campaign_management: 8,
  events: 4,
  reports: 10,
  forms: 5,
  users: 2,
  dashboard: 1,
  settings: 1,
  other: 2,
}

export const DEFAULT_HOURLY_RATE = 300 // ₹/hour blended staff cost
