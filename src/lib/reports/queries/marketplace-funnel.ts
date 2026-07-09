import { prisma } from '@/lib/db/client'
import { ReportQuery, ReportCtx, Filters, rangeFilter, listFilter } from './types'

// Marketplace acquisition funnel: profile views → enquiries → CRM leads →
// converted. Marketplace tables (School, SchoolView, ParentEnquiry) live in
// the marketplace schema and are NOT tenant-scoped by forOrg, so every query
// is scoped explicitly by the org's claimed school ids.

async function orgSchoolIds(orgId: string): Promise<string[]> {
  const schools = await prisma.school.findMany({
    where: { orgId, deletedAt: null },
    select: { id: true }
  })
  return schools.map(s => s.id)
}

async function funnelData(ctx: ReportCtx, filters: Filters) {
  const schoolIds = await orgSchoolIds(ctx.orgId)
  if (schoolIds.length === 0) {
    return { views: 0, enquiries: 0, toLead: 0, converted: 0, byStatus: [], hasProfile: false }
  }
  const range = rangeFilter(filters)
  const grades = listFilter(filters.grade)
  const enquiryWhere = {
    schoolId: { in: schoolIds },
    deletedAt: null,
    ...(range ? { createdAt: range } : {}),
    ...(grades ? { gradeSought: { in: grades } } : {})
  }

  const [views, enquiries, toLead, byStatus, convertedEnquiries] = await Promise.all([
    prisma.schoolView.count({
      where: { schoolId: { in: schoolIds }, ...(range ? { createdAt: range } : {}) }
    }),
    prisma.parentEnquiry.count({ where: enquiryWhere }),
    prisma.parentEnquiry.count({ where: { ...enquiryWhere, leadId: { not: null } } }),
    prisma.parentEnquiry.groupBy({
      by: ['status'], where: enquiryWhere, _count: { _all: true }
    }),
    // "Converted" = the enquiry's linked lead reached CONVERTED. Match by
    // leadId against the tenant lead set (ctx.db is org-scoped).
    prisma.parentEnquiry.findMany({
      where: { ...enquiryWhere, leadId: { not: null } },
      select: { leadId: true }
    })
  ])

  const leadIds = convertedEnquiries.map(e => e.leadId).filter(Boolean) as string[]
  const converted = leadIds.length
    ? await ctx.db.lead.count({ where: { id: { in: leadIds }, status: 'CONVERTED' } })
    : 0

  return {
    views, enquiries, toLead, converted,
    byStatus: byStatus.map(s => ({ status: s.status as string, count: s._count._all })),
    hasProfile: true
  }
}

export const marketplaceFunnel: ReportQuery = {
  async summary(ctx, filters) {
    const d = await funnelData(ctx, filters)

    if (!d.hasProfile) {
      return {
        kpis: [
          { key: 'views', label: 'Profile Views', value: 0, format: 'int' },
          { key: 'enquiries', label: 'Enquiries', value: 0, format: 'int' },
          { key: 'toLead', label: 'Became Leads', value: 0, format: 'int' },
          { key: 'converted', label: 'Converted', value: 0, format: 'int' }
        ],
        insight: 'No claimed marketplace profile yet — claim your school on the Vidhyaan marketplace to track this funnel.',
        charts: { funnel: [], byStatus: [] }
      }
    }

    const enquiryRate = d.views > 0 ? d.enquiries / d.views : null
    const leadRate = d.enquiries > 0 ? d.toLead / d.enquiries : null
    const convRate = d.toLead > 0 ? d.converted / d.toLead : null

    let insight: string | null = null
    if (d.views >= 20 && enquiryRate !== null) {
      insight = `${Math.round(enquiryRate * 1000) / 10}% of profile visitors enquired`
      if (d.converted > 0) {
        insight += `, and ${d.converted} of those became admissions — Vidhyaan is sourcing real students.`
      } else if (d.toLead > 0) {
        insight += `; none have converted to admission yet — check follow-up on marketplace leads.`
      } else {
        insight += '.'
      }
    }

    return {
      kpis: [
        { key: 'views', label: 'Profile Views', value: d.views, format: 'int' },
        { key: 'enquiries', label: 'Enquiries', value: d.enquiries, format: 'int', caption: enquiryRate !== null ? `${Math.round(enquiryRate * 1000) / 10}% of views` : undefined },
        { key: 'toLead', label: 'Became Leads', value: d.toLead, format: 'int', caption: leadRate !== null ? `${Math.round(leadRate * 100)}% of enquiries` : undefined },
        { key: 'converted', label: 'Converted', value: d.converted, format: 'int', caption: convRate !== null ? `${Math.round(convRate * 100)}% of leads` : undefined }
      ],
      insight,
      charts: {
        funnel: [
          { stage: 'Views', count: d.views },
          { stage: 'Enquiries', count: d.enquiries },
          { stage: 'Leads', count: d.toLead },
          { stage: 'Converted', count: d.converted }
        ],
        byStatus: d.byStatus
      }
    }
  },

  async rows(ctx, filters) {
    const d = await funnelData(ctx, filters)
    const total = d.enquiries || 1
    const statusRows = ['NEW', 'RESPONDED', 'CONVERTED', 'CLOSED'].map(status => {
      const count = d.byStatus.find(s => s.status === status)?.count ?? 0
      return { status, count, pct: count / total }
    })
    return {
      columns: [
        { key: 'status', label: 'Enquiry Status' },
        { key: 'count', label: 'Enquiries', format: 'int' },
        { key: 'pct', label: '% of Enquiries', format: 'pct' }
      ],
      rows: statusRows,
      nextCursor: null
    }
  }
}
