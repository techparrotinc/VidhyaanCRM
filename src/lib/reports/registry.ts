// Report registry — single source of truth for the Reports module.
// Drives /api/v1/reports/meta, the Library page, and per-report filter bars.
// Adding a report = adding an entry here + a query module in ./queries/.
// See docs/reports-analytics-phase1-prd.md (Part 3).

export const REPORTS_MODULE_SLUG = 'advanced_reports'

export type ReportCategory =
  | 'admissions'
  | 'finance'
  | 'team'
  | 'students'
  | 'courses'
  | 'campaigns'

export type ReportFilterType =
  | 'date-range'
  | 'enum'
  | 'entity' // async-loaded options (counsellors, grades, stages)
  | 'number'

export type ReportFilterConfig = {
  key: string
  label: string
  type: ReportFilterType
  /** Static options for type 'enum'. */
  options?: { value: string; label: string }[]
  /** Options endpoint hint for type 'entity' (frontend resolves). */
  optionsSource?: 'counsellors' | 'grades' | 'stages' | 'branches' | 'campaigns'
  multi?: boolean
}

export type ReportDefinition = {
  key: string
  title: string
  /** One-line decision statement shown on the Library card. */
  decision: string
  category: ReportCategory
  allowedRoles: string[]
  filters: ReportFilterConfig[]
  exports: ('csv' | 'xlsx' | 'pdf')[]
}

const ADMIN_ROLES = ['ORG_ADMIN', 'BRANCH_ADMIN']

const dateRange: ReportFilterConfig = {
  key: 'range',
  label: 'Date range',
  type: 'date-range'
}

const LEAD_SOURCES = [
  'VIDHYAAN', 'WALK_IN', 'PHONE', 'EMAIL', 'WHATSAPP', 'WEBSITE',
  'REFERRAL', 'SOCIAL_MEDIA', 'GOOGLE_ADS', 'META_ADS', 'JUSTDIAL',
  'CAMPAIGN', 'EVENT', 'NEWSPAPER', 'HOARDING', 'IMPORT', 'OTHER'
]

const sourceFilter: ReportFilterConfig = {
  key: 'source',
  label: 'Source',
  type: 'enum',
  options: LEAD_SOURCES.map(s => ({ value: s, label: s.replace(/_/g, ' ') })),
  multi: true
}

const gradeFilter: ReportFilterConfig = {
  key: 'grade',
  label: 'Grade',
  type: 'entity',
  optionsSource: 'grades',
  multi: true
}

const counsellorFilter: ReportFilterConfig = {
  key: 'counsellorId',
  label: 'Counsellor',
  type: 'entity',
  optionsSource: 'counsellors'
}

// Branch scope selector. Folded into ctx.branchIds in reportRequest (not a
// row filter). The filter bar hides it when the org has a single branch.
const branchFilter: ReportFilterConfig = {
  key: 'branch',
  label: 'Branch',
  type: 'entity',
  optionsSource: 'branches'
}

export const REPORTS: ReportDefinition[] = [
  {
    key: 'lead-funnel',
    title: 'Lead Funnel & Conversion',
    decision: 'Find where the funnel leaks and whether it is worse than last year',
    category: 'admissions',
    // COUNSELLOR sees the funnel scoped to their own leads (leadBaseWhere).
    allowedRoles: [...ADMIN_ROLES, 'COUNSELLOR'],
    filters: [branchFilter, dateRange, sourceFilter, gradeFilter, counsellorFilter,
      {
        key: 'priority', label: 'Priority', type: 'enum',
        options: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(v => ({ value: v, label: v }))
      }],
    exports: ['csv', 'xlsx']
  },
  {
    key: 'lead-source-effectiveness',
    title: 'Lead Source Effectiveness',
    decision: 'Decide which channel deserves next term’s marketing budget',
    category: 'admissions',
    allowedRoles: ['ORG_ADMIN'],
    filters: [branchFilter, dateRange, gradeFilter],
    exports: ['csv', 'xlsx']
  },
  {
    key: 'counsellor-performance',
    title: 'Counsellor Performance',
    decision: 'See who needs coaching, who earns the bonus, and whether targets are realistic',
    category: 'team',
    allowedRoles: ADMIN_ROLES,
    filters: [branchFilter, dateRange],
    exports: ['csv', 'xlsx']
  },
  {
    key: 'follow-up-discipline',
    title: 'Follow-up Discipline',
    decision: 'Rescue promised follow-ups that were missed',
    category: 'team',
    allowedRoles: [...ADMIN_ROLES, 'COUNSELLOR', 'RECEPTIONIST'],
    filters: [branchFilter, counsellorFilter, gradeFilter,
      {
        key: 'overdue', label: 'Overdue only', type: 'enum',
        options: [{ value: 'true', label: 'Overdue only' }]
      }],
    exports: ['csv']
  },
  {
    key: 'admission-pipeline',
    title: 'Admission Pipeline & Stage Ageing',
    decision: 'Unstick stuck applications and fill seats before the season closes',
    category: 'admissions',
    allowedRoles: ADMIN_ROLES,
    filters: [branchFilter, dateRange, gradeFilter, counsellorFilter,
      { key: 'stageId', label: 'Stage', type: 'entity', optionsSource: 'stages' }],
    exports: ['csv', 'xlsx']
  },
  {
    key: 'fee-collection-summary',
    title: 'Fee Collection Summary',
    decision: 'Check cash-flow health this month vs plan and vs last year',
    category: 'finance',
    allowedRoles: ['ORG_ADMIN', 'ACCOUNTANT'],
    filters: [branchFilter, dateRange, gradeFilter,
      {
        key: 'invoiceType', label: 'Invoice type', type: 'enum',
        options: ['TERM', 'ADHOC', 'COURSE'].map(v => ({ value: v, label: v }))
      }],
    exports: ['csv', 'xlsx', 'pdf']
  },
  {
    key: 'defaulter-ageing',
    title: 'Outstanding Fees & Defaulter Ageing',
    decision: 'Get today’s collection chase list, oldest and largest first',
    category: 'finance',
    allowedRoles: ['ORG_ADMIN', 'ACCOUNTANT'],
    filters: [branchFilter, gradeFilter,
      {
        key: 'bucket', label: 'Ageing bucket', type: 'enum',
        options: [
          { value: '0-30', label: '0–30 days' },
          { value: '31-60', label: '31–60 days' },
          { value: '61-90', label: '61–90 days' },
          { value: '90+', label: '90+ days' }
        ]
      },
      { key: 'minAmount', label: 'Min amount due', type: 'number' }],
    exports: ['csv', 'xlsx', 'pdf']
  },
  {
    key: 'concession-audit',
    title: 'Concession & Discount Audit',
    decision: 'Keep discounting under control and see who grants it',
    category: 'finance',
    allowedRoles: ['ORG_ADMIN', 'ACCOUNTANT'],
    filters: [dateRange,
      {
        key: 'type', label: 'Type', type: 'enum',
        options: [
          { value: 'PERCENTAGE', label: 'Percentage' },
          { value: 'FIXED_AMOUNT', label: 'Fixed amount' }
        ]
      }],
    exports: ['csv', 'xlsx']
  },
  {
    key: 'campaign-effectiveness',
    title: 'Campaign Effectiveness',
    decision: 'Learn whether a campaign paid for itself before running the next one',
    category: 'campaigns',
    allowedRoles: ['ORG_ADMIN'],
    filters: [dateRange,
      {
        key: 'channel', label: 'Channel', type: 'enum',
        options: ['SMS', 'WHATSAPP', 'EMAIL'].map(v => ({ value: v, label: v }))
      }],
    exports: ['csv', 'xlsx']
  },
  {
    key: 'enrollment-strength',
    title: 'Enrollment Strength & Movement',
    decision: 'Plan staffing, sections and next year from student-base movement',
    category: 'students',
    allowedRoles: ADMIN_ROLES,
    filters: [branchFilter, gradeFilter,
      {
        key: 'status', label: 'Status', type: 'enum',
        options: ['ACTIVE', 'ALUMNI', 'TRANSFERRED', 'SUSPENDED', 'DROPPED_OUT']
          .map(v => ({ value: v, label: v.replace(/_/g, ' ') }))
      },
      {
        key: 'gender', label: 'Gender', type: 'enum',
        options: ['MALE', 'FEMALE', 'OTHER'].map(v => ({ value: v, label: v }))
      }],
    exports: ['csv', 'xlsx', 'pdf']
  },
  {
    key: 'course-performance',
    title: 'Course & Batch Performance',
    decision: 'See which courses fill, earn and retain — and which batches run empty',
    category: 'courses',
    allowedRoles: ADMIN_ROLES,
    filters: [
      {
        key: 'status', label: 'Enrollment status', type: 'enum',
        options: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'].map(v => ({ value: v, label: v }))
      }],
    exports: ['csv', 'xlsx']
  },
  {
    key: 'trial-class-conversion',
    title: 'Trial Class Conversion',
    decision: 'Learn which trial classes turn into paying enrolments',
    category: 'courses',
    allowedRoles: ADMIN_ROLES,
    filters: [dateRange,
      {
        key: 'status', label: 'Booking status', type: 'enum',
        options: ['PENDING', 'CONFIRMED', 'CANCELLED'].map(v => ({ value: v, label: v }))
      }],
    exports: ['csv', 'xlsx']
  },
  {
    key: 'daily-activity',
    title: 'Daily Activity Log',
    decision: 'Know what the front desk and counsellors actually did today',
    category: 'team',
    allowedRoles: [...ADMIN_ROLES, 'COUNSELLOR', 'RECEPTIONIST'],
    filters: [dateRange,
      {
        key: 'type', label: 'Activity type', type: 'enum',
        options: ['NOTE', 'CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'MEETING', 'STATUS_CHANGE', 'ASSIGNMENT']
          .map(v => ({ value: v, label: v.replace(/_/g, ' ') }))
      }],
    exports: ['csv']
  },
  {
    key: 'payment-register',
    title: 'Payment Collections Register',
    decision: 'Reconcile every rupee received — by day, method and collector',
    category: 'finance',
    allowedRoles: ['ORG_ADMIN', 'ACCOUNTANT'],
    filters: [branchFilter, dateRange,
      {
        key: 'method', label: 'Method', type: 'enum',
        options: ['RAZORPAY', 'CASH', 'CHEQUE', 'DD', 'NEFT', 'BANK_TRANSFER', 'UPI', 'CARD', 'OTHER']
          .map(v => ({ value: v, label: v.replace(/_/g, ' ') }))
      },
      {
        key: 'status', label: 'Status', type: 'enum',
        options: ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'].map(v => ({ value: v, label: v }))
      }],
    exports: ['csv', 'xlsx', 'pdf']
  }
]

const byKey = new Map(REPORTS.map(r => [r.key, r]))

export function getReport(key: string): ReportDefinition | undefined {
  return byKey.get(key)
}

export function reportsForRole(role: string): ReportDefinition[] {
  return REPORTS.filter(r => r.allowedRoles.includes(role))
}

export function isValidReportKey(key: string): boolean {
  return byKey.has(key)
}
