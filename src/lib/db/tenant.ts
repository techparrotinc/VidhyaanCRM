import { prisma } from './client'

const TENANT_MODELS = [
  'Lead', 'Admission', 'AdmissionDocument', 'AdmissionCapacity',
  'Student', 'StudentBatch', 'SiblingLink', 'FeePlanTemplate', 'FeePlan', 'Invoice',
  'Payment', 'Concession', 'Event', 'EventRsvp', 'Campaign', 'CampaignRecipient',
  'Notification', 'NotificationPreference', 'CommunicationLog', 'NotificationQueue',
  'AcademicYear', 'CounsellorTarget', 'LeadActivity', 'AdmissionActivity',
  'LeadCustomField', 'StudentCustomField', 'ApiKey', 'OrgDomain',
  'BatchSchedule', 'Instructor', 'TrialClassBooking',
  // Payment gateway. WebhookEvent is deliberately absent: it is written by
  // the public webhook route (no tenant session) via the base client.
  'PaymentGatewayConfig', 'GatewayOrder', 'Refund', 'LedgerEntry',
  'StudentGuardianLink',
  // Reporting. DailyRollup is written by the rollup cron via the base client
  // (explicit orgId, no session); listed here so API reads stay org-scoped.
  'DailyRollup', 'ReportSavedView', 'ReportUsage', 'ReportSchedule',
  // Learning-centre course catalog (settings routes already scope manually;
  // this makes it fail-closed for report queries too).
  'Course', 'CourseEnrollment',
  // Digital form engine. FormInstance/FormSubmission are ALSO written by the
  // public /apply/[token] route via the base client (no session, token is the
  // security boundary); listed here so authenticated builder/counsellor reads
  // stay org-scoped.
  'Form', 'FormInstance', 'FormSubmission'
]

const SOFT_DELETE_MODELS = [
  'Lead', 'Admission', 'Student', 'Invoice', 'Campaign', 'Event',
  'PaymentGatewayConfig', 'Form'
]

// Models carrying a nullable branchId column. When a branch context is
// passed to forOrg, reads/updates on these get a null-inclusive branch
// filter (legacy/org-wide rows with branchId=null stay visible) and creates
// are stamped with the active branch. See multi-branch-architecture.md §3.2.
const BRANCH_MODELS = [
  'Lead', 'LeadActivity', 'Admission', 'AdmissionActivity',
  'AdmissionCapacity', 'Student', 'StudentBatch', 'FeePlan', 'Invoice',
  'Payment', 'Event', 'Campaign', 'CounsellorTarget', 'DailyRollup', 'Form'
]

const tenantModelSet = new Set(TENANT_MODELS.map(m => m.toLowerCase()))
const softDeleteModelSet = new Set(SOFT_DELETE_MODELS.map(m => m.toLowerCase()))
const branchModelSet = new Set(BRANCH_MODELS.map(m => m.toLowerCase()))

const isTenantModel = (model: string) => tenantModelSet.has(model.toLowerCase())
const isSoftDeleteModel = (model: string) => softDeleteModelSet.has(model.toLowerCase())
const isBranchModel = (model: string) => branchModelSet.has(model.toLowerCase())

// Every operation that filters by `where` gets orgId injected. Relies on
// Prisma's extendedWhereUnique (GA since 5.0) for the *Unique/update/delete
// variants, which accept non-unique fields alongside the unique selector.
const WHERE_SCOPED_READS = new Set([
  'findFirst', 'findFirstOrThrow', 'findMany',
  'findUnique', 'findUniqueOrThrow',
  'count', 'aggregate', 'groupBy'
])

const WHERE_SCOPED_WRITES = new Set(['update', 'updateMany'])

function scopeWhere(args: any, orgId: string, softDelete: boolean) {
  args.where = args.where ?? {}
  args.where.orgId = orgId
  if (softDelete) {
    // ??= so callers can still query deleted rows explicitly (trash views)
    args.where.deletedAt ??= null
  }
}

// Null-inclusive: rows with branchId=null (legacy data, org-wide config)
// remain visible under every branch. Merged via AND so it can't clash with a
// caller's own OR (e.g. list-search filters).
function scopeBranch(args: any, branchIds: string[]) {
  args.where = args.where ?? {}
  const filter = { OR: [{ branchId: { in: branchIds } }, { branchId: null }] }
  if (args.where.AND) {
    args.where.AND = Array.isArray(args.where.AND)
      ? [...args.where.AND, filter]
      : [args.where.AND, filter]
  } else {
    args.where.AND = [filter]
  }
}

/**
 * Branch scoping context, resolved per-request in compose.ts.
 * - branchIds: rows this request may touch (null = unrestricted org-wide)
 * - activeBranchId: single branch to stamp onto creates (null = don't stamp)
 */
export type BranchContext = {
  branchIds: string[] | null
  activeBranchId: string | null
}

const camelCase = (model: string) => model.charAt(0).toLowerCase() + model.slice(1)

export function forOrg(orgId: string, branch?: BranchContext) {
  const branchIds = branch?.branchIds ?? null
  const activeBranchId = branch?.activeBranchId ?? null
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          if (!isTenantModel(model)) {
            return query(args)
          }

          const softDelete = isSoftDeleteModel(model)
          const branchScoped = branchIds !== null && isBranchModel(model)
          // ??= so explicit caller branchIds always win over the stamp
          const stampBranch = (data: any) => {
            if (activeBranchId && isBranchModel(model) && data) {
              data.branchId ??= activeBranchId
            }
          }

          if (operation === 'create') {
            args.data = args.data ?? {}
            args.data.orgId = orgId
            stampBranch(args.data)
            return query(args)
          }

          if (operation === 'createMany' || operation === 'createManyAndReturn') {
            if (args.data) {
              if (Array.isArray(args.data)) {
                args.data.forEach((item: any) => {
                  item.orgId = orgId
                  stampBranch(item)
                })
              } else {
                args.data.orgId = orgId
                stampBranch(args.data)
              }
            }
            return query(args)
          }

          if (operation === 'upsert') {
            args.where = args.where ?? {}
            args.where.orgId = orgId
            args.create = args.create ?? {}
            args.create.orgId = orgId
            stampBranch(args.create)
            if (branchScoped) scopeBranch(args, branchIds)
            return query(args)
          }

          if (WHERE_SCOPED_READS.has(operation)) {
            scopeWhere(args, orgId, softDelete)
            if (branchScoped) scopeBranch(args, branchIds)
            return query(args)
          }

          if (WHERE_SCOPED_WRITES.has(operation)) {
            scopeWhere(args, orgId, /* softDelete */ false)
            if (branchScoped) scopeBranch(args, branchIds)
            return query(args)
          }

          if (operation === 'delete' || operation === 'deleteMany') {
            const where: any = { ...(args.where ?? {}), orgId }
            if (branchScoped) scopeBranch({ where }, branchIds)
            if (softDelete) {
              // Rewrite to soft delete on the base client; orgId in where
              // keeps it tenant-scoped even though this bypasses the extension.
              const delegate = (prisma as any)[camelCase(model)]
              const data = { deletedAt: new Date() }
              return operation === 'delete'
                ? delegate.update({ where, data })
                : delegate.updateMany({ where, data })
            }
            args.where = where
            return query(args)
          }

          // Fail closed: an operation this extension doesn't know how to
          // scope must not silently run cross-tenant.
          throw new Error(
            `Tenant-scoped client does not support operation "${operation}" on model "${model}"`
          )
        }
      }
    }
  })
}

export type OrgScopedClient = ReturnType<typeof forOrg>
