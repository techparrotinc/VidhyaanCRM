import { Prisma } from '@prisma/client'
import { prisma } from './client'

const TENANT_MODELS = [
  'Lead', 'Admission', 'AdmissionStage', 'AdmissionDocument', 'AdmissionCapacity',
  'Student', 'StudentBatch', 'SiblingLink', 'FeePlanTemplate', 'FeePlan', 'Invoice',
  'Payment', 'Concession', 'Event', 'EventRsvp', 'Campaign', 'CampaignRecipient',
  'Notification', 'NotificationPreference', 'CommunicationLog', 'NotificationQueue',
  'AcademicYear', 'CounsellorTarget', 'LeadActivity', 'AdmissionActivity',
  'LeadCustomField', 'StudentCustomField', 'ApiKey', 'OrgDomain'
]

const SOFT_DELETE_MODELS = [
  'Lead', 'Admission', 'Student', 'Invoice', 'Campaign', 'Event'
]

const tenantModelSet = new Set(TENANT_MODELS.map(m => m.toLowerCase()))
const softDeleteModelSet = new Set(SOFT_DELETE_MODELS.map(m => m.toLowerCase()))

const isTenantModel = (model: string) => tenantModelSet.has(model.toLowerCase())
const isSoftDeleteModel = (model: string) => softDeleteModelSet.has(model.toLowerCase())

export function forOrg(orgId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async create(this: any, { model, args, query }: any) {
          if (isTenantModel(model)) {
            args.data = args.data ?? {}
            args.data.orgId = orgId
          }
          return query(args)
        },
        async createMany(this: any, { model, args, query }: any) {
          if (isTenantModel(model)) {
            if (args.data) {
              if (Array.isArray(args.data)) {
                args.data.forEach((item: any) => {
                  item.orgId = orgId
                })
              } else {
                args.data.orgId = orgId
              }
            }
          }
          return query(args)
        },
        async findFirst(this: any, { model, args, query }: any) {
          if (isTenantModel(model)) {
            args.where = args.where ?? {}
            args.where.orgId = orgId
          }
          if (isSoftDeleteModel(model)) {
            args.where = args.where ?? {}
            args.where.deletedAt = null
          }
          return query(args)
        },
        async findMany(this: any, { model, args, query }: any) {
          if (isTenantModel(model)) {
            args.where = args.where ?? {}
            args.where.orgId = orgId
          }
          if (isSoftDeleteModel(model)) {
            args.where = args.where ?? {}
            args.where.deletedAt = null
          }
          return query(args)
        },
        async findUnique(this: any, { model, args, query }: any) {
          if (isTenantModel(model)) {
            const camelModel = model.charAt(0).toLowerCase() + model.slice(1)
            return this[camelModel].findFirst(args)
          }
          return query(args)
        },
        async update(this: any, { model, args, query }: any) {
          if (isTenantModel(model)) {
            args.where = args.where ?? {}
            args.where.orgId = orgId
          }
          return query(args)
        },
        async updateMany(this: any, { model, args, query }: any) {
          if (isTenantModel(model)) {
            args.where = args.where ?? {}
            args.where.orgId = orgId
          }
          return query(args)
        },
        async delete(this: any, { model, args, query }: any) {
          if (isSoftDeleteModel(model)) {
            const camelModel = model.charAt(0).toLowerCase() + model.slice(1)
            const updateArgs = {
              where: args.where,
              data: { deletedAt: new Date() }
            }
            return this[camelModel].update(updateArgs)
          } else if (isTenantModel(model)) {
            args.where = args.where ?? {}
            args.where.orgId = orgId
          }
          return query(args)
        },
        async deleteMany(this: any, { model, args, query }: any) {
          if (isSoftDeleteModel(model)) {
            const camelModel = model.charAt(0).toLowerCase() + model.slice(1)
            const updateManyArgs = {
              where: args.where,
              data: { deletedAt: new Date() }
            }
            return this[camelModel].updateMany(updateManyArgs)
          } else if (isTenantModel(model)) {
            args.where = args.where ?? {}
            args.where.orgId = orgId
          }
          return query(args)
        }
      }
    }
  })
}

export type OrgScopedClient = ReturnType<typeof forOrg>
