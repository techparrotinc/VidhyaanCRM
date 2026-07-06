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
  'PaymentGatewayConfig', 'GatewayOrder', 'Refund', 'LedgerEntry'
]

const SOFT_DELETE_MODELS = [
  'Lead', 'Admission', 'Student', 'Invoice', 'Campaign', 'Event',
  'PaymentGatewayConfig'
]

const tenantModelSet = new Set(TENANT_MODELS.map(m => m.toLowerCase()))
const softDeleteModelSet = new Set(SOFT_DELETE_MODELS.map(m => m.toLowerCase()))

const isTenantModel = (model: string) => tenantModelSet.has(model.toLowerCase())
const isSoftDeleteModel = (model: string) => softDeleteModelSet.has(model.toLowerCase())

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

const camelCase = (model: string) => model.charAt(0).toLowerCase() + model.slice(1)

export function forOrg(orgId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          if (!isTenantModel(model)) {
            return query(args)
          }

          const softDelete = isSoftDeleteModel(model)

          if (operation === 'create') {
            args.data = args.data ?? {}
            args.data.orgId = orgId
            return query(args)
          }

          if (operation === 'createMany' || operation === 'createManyAndReturn') {
            if (args.data) {
              if (Array.isArray(args.data)) {
                args.data.forEach((item: any) => { item.orgId = orgId })
              } else {
                args.data.orgId = orgId
              }
            }
            return query(args)
          }

          if (operation === 'upsert') {
            args.where = args.where ?? {}
            args.where.orgId = orgId
            args.create = args.create ?? {}
            args.create.orgId = orgId
            return query(args)
          }

          if (WHERE_SCOPED_READS.has(operation)) {
            scopeWhere(args, orgId, softDelete)
            return query(args)
          }

          if (WHERE_SCOPED_WRITES.has(operation)) {
            scopeWhere(args, orgId, /* softDelete */ false)
            return query(args)
          }

          if (operation === 'delete' || operation === 'deleteMany') {
            const where = { ...(args.where ?? {}), orgId }
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
