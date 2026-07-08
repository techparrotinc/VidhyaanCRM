import {
  ReportQuery, ReportCtx, Filters,
  rangeFilter, listFilter, leadBaseWhere
} from './types'

const LOW_SAMPLE = 10

function whereFor(ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)
  const grades = listFilter(filters.grade)
  return {
    ...leadBaseWhere(ctx),
    ...(range ? { createdAt: range } : {}),
    ...(grades ? { gradeSought: { in: grades } } : {})
  }
}

async function sourceTable(ctx: ReportCtx, filters: Filters) {
  const where = whereFor(ctx, filters)
  const [all, contacted, converted] = await Promise.all([
    ctx.db.lead.groupBy({ by: ['source'], where, _count: { _all: true } }),
    ctx.db.lead.groupBy({
      by: ['source'],
      where: { ...where, firstContactedAt: { not: null } },
      _count: { _all: true }
    }),
    ctx.db.lead.groupBy({
      by: ['source'],
      where: { ...where, status: 'CONVERTED' },
      _count: { _all: true }
    })
  ])
  const contactedMap = new Map(contacted.map(r => [r.source, r._count._all]))
  const convertedMap = new Map(converted.map(r => [r.source, r._count._all]))
  return all
    .map(r => {
      const leads = r._count._all
      const conv = convertedMap.get(r.source) ?? 0
      return {
        source: r.source as string,
        leads,
        contactedPct: leads > 0 ? (contactedMap.get(r.source) ?? 0) / leads : 0,
        converted: conv,
        conversionPct: leads > 0 ? conv / leads : 0,
        lowSample: leads < LOW_SAMPLE
      }
    })
    .sort((a, b) => b.leads - a.leads)
}

export const leadSourceEffectiveness: ReportQuery = {
  async summary(ctx, filters) {
    const table = await sourceTable(ctx, filters)
    const totalLeads = table.reduce((s, r) => s + r.leads, 0)
    const totalConverted = table.reduce((s, r) => s + r.converted, 0)

    const reliable = table.filter(r => !r.lowSample && r.converted > 0)
    const best = [...reliable].sort((a, b) => b.conversionPct - a.conversionPct)[0]
    const worst = [...reliable].sort((a, b) => a.conversionPct - b.conversionPct)[0]

    let insight: string | null = null
    if (best && worst && best.source !== worst.source && worst.conversionPct > 0) {
      const ratio = best.conversionPct / worst.conversionPct
      if (ratio >= 1.5) {
        insight = `${best.source.replace(/_/g, ' ')} converts ${ratio.toFixed(1)}× better than ${worst.source.replace(/_/g, ' ')} in this period.`
      }
    } else if (best) {
      insight = `${best.source.replace(/_/g, ' ')} is the strongest source at ${Math.round(best.conversionPct * 100)}% conversion.`
    }

    return {
      kpis: [
        { key: 'sources', label: 'Active Sources', value: table.length, format: 'int' },
        { key: 'leads', label: 'Total Leads', value: totalLeads, format: 'int' },
        { key: 'conversionPct', label: 'Overall Conversion', value: totalLeads > 0 ? totalConverted / totalLeads : null, format: 'pct' },
        {
          key: 'best', label: 'Best Source',
          value: best ? best.source.replace(/_/g, ' ') : '—', format: 'text',
          caption: best ? `${Math.round(best.conversionPct * 100)}% conversion` : 'needs 10+ leads per source'
        }
      ],
      insight,
      charts: { sources: table.map(({ lowSample: _l, contactedPct: _c, ...r }) => r) }
    }
  },

  async rows(ctx, filters) {
    const table = await sourceTable(ctx, filters)
    return {
      columns: [
        { key: 'source', label: 'Source' },
        { key: 'leads', label: 'Leads', format: 'int' },
        { key: 'contactedPct', label: 'Contacted %', format: 'pct' },
        { key: 'converted', label: 'Converted', format: 'int' },
        { key: 'conversionPct', label: 'Conversion %', format: 'pct' },
        { key: 'lowSample', label: 'Low Sample', format: 'badge' }
      ],
      rows: table.map(r => ({ ...r, source: r.source.replace(/_/g, ' '), lowSample: r.lowSample ? '< 10 leads' : '' })),
      nextCursor: null
    }
  }
}
