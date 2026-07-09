import { prisma } from '@/lib/db/client'
import { ReportQuery, ReportCtx, Filters, rangeFilter } from './types'

// Attribution rule (Phase 1, honest and simple): leads with source CAMPAIGN
// or EVENT created within 14 days of a campaign's send are attributed to the
// nearest preceding campaign. Documented in the UI; per-recipient UTM
// attribution is Phase 2.
const ATTRIBUTION_DAYS = 14

async function campaignTable(ctx: ReportCtx, filters: Filters) {
  const range = rangeFilter(filters)

  const campaigns = await ctx.db.campaign.findMany({
    where: {
      status: { in: ['COMPLETED', 'SENDING', 'FAILED'] as never[] },
      ...(filters.channel ? { channel: filters.channel as never } : {}),
      ...(range ? { sentAt: range } : {})
    },
    select: {
      id: true, name: true, channel: true, status: true, sentAt: true,
      stats: true, costAmount: true
    },
    orderBy: { sentAt: 'desc' },
    take: 100
  })
  if (campaigns.length === 0) return []

  const ids = campaigns.map(c => c.id)
  const sentTimes = campaigns
    .filter(c => c.sentAt)
    .map(c => c.sentAt!.getTime())
  const attributionWindow = sentTimes.length
    ? {
        gte: new Date(Math.min(...sentTimes)),
        lt: new Date(Math.max(...sentTimes) + ATTRIBUTION_DAYS * 864e5)
      }
    : null

  const [recipientStats, ledger, attributedLeads] = await Promise.all([
    ctx.db.campaignRecipient.groupBy({
      by: ['campaignId', 'status'],
      where: { campaignId: { in: ids } },
      _count: { _all: true }
    }),
    // Credit spend: ledger rows keyed ref = campaign id (metered-send + refunds).
    prisma.messageCreditLedger.groupBy({
      by: ['ref'],
      where: { orgId: ctx.orgId, ref: { in: ids } },
      _sum: { delta: true }
    }),
    attributionWindow
      ? ctx.db.lead.findMany({
          where: {
            source: { in: ['CAMPAIGN', 'EVENT'] },
            createdAt: attributionWindow
          },
          select: { createdAt: true, status: true },
          take: 5000
        })
      : []
  ])

  const recipients = new Map<string, { total: number; delivered: number }>()
  for (const r of recipientStats) {
    const e = recipients.get(r.campaignId) ?? { total: 0, delivered: 0 }
    e.total += r._count._all
    if (r.status === 'DELIVERED' || r.status === 'SENT') e.delivered += r._count._all
    recipients.set(r.campaignId, e)
  }

  const creditMap = new Map(
    ledger.filter(l => l.ref).map(l => [l.ref!, Math.max(0, -Number(l._sum.delta ?? 0))])
  )

  // Nearest preceding send wins the attribution.
  const sentCampaigns = campaigns
    .filter(c => c.sentAt)
    .sort((a, b) => a.sentAt!.getTime() - b.sentAt!.getTime())
  const attribution = new Map<string, { leads: number; conversions: number }>()
  for (const lead of attributedLeads) {
    let match: (typeof sentCampaigns)[number] | null = null
    for (const c of sentCampaigns) {
      const sent = c.sentAt!.getTime()
      if (sent <= lead.createdAt.getTime() &&
          lead.createdAt.getTime() < sent + ATTRIBUTION_DAYS * 864e5) {
        match = c
      }
    }
    if (!match) continue
    const e = attribution.get(match.id) ?? { leads: 0, conversions: 0 }
    e.leads++
    if (lead.status === 'CONVERTED') e.conversions++
    attribution.set(match.id, e)
  }

  return campaigns.map(c => {
    const rec = recipients.get(c.id) ?? { total: 0, delivered: 0 }
    const attr = attribution.get(c.id) ?? { leads: 0, conversions: 0 }
    const credits = creditMap.get(c.id) ?? 0
    const cost = c.costAmount !== null ? Number(c.costAmount) : null
    return {
      campaignId: c.id,
      campaign: c.name,
      channel: c.channel as string,
      status: c.status as string,
      sentAt: c.sentAt,
      recipients: rec.total,
      deliveredPct: rec.total > 0 ? rec.delivered / rec.total : null,
      creditsSpent: credits,
      cost,
      leadsAttributed: attr.leads,
      conversions: attr.conversions,
      creditsPerLead: attr.leads > 0 && credits > 0 ? Math.round((credits / attr.leads) * 10) / 10 : null,
      // Rupee ROI once a spend is entered on the campaign.
      costPerLead: cost !== null && attr.leads > 0 ? Math.round(cost / attr.leads) : null,
      costPerAdmission: cost !== null && attr.conversions > 0 ? Math.round(cost / attr.conversions) : null
    }
  })
}

export const campaignEffectiveness: ReportQuery = {
  async summary(ctx, filters) {
    const table = await campaignTable(ctx, filters)
    const totalCredits = table.reduce((s, r) => s + r.creditsSpent, 0)
    const totalLeads = table.reduce((s, r) => s + r.leadsAttributed, 0)
    const totalConversions = table.reduce((s, r) => s + r.conversions, 0)
    const totalCost = table.reduce((s, r) => s + (r.cost ?? 0), 0)
    const withCost = table.filter(r => r.cost !== null)

    const byChannel = new Map<string, { credits: number; leads: number; campaigns: number }>()
    for (const r of table) {
      const e = byChannel.get(r.channel) ?? { credits: 0, leads: 0, campaigns: 0 }
      e.credits += r.creditsSpent
      e.leads += r.leadsAttributed
      e.campaigns++
      byChannel.set(r.channel, e)
    }

    const best = [...table]
      .filter(r => r.leadsAttributed > 0)
      .sort((a, b) => b.leadsAttributed - a.leadsAttributed)[0]

    return {
      kpis: [
        { key: 'campaigns', label: 'Campaigns', value: table.length, format: 'int' },
        { key: 'leads', label: 'Leads Attributed', value: totalLeads, format: 'int', caption: `${ATTRIBUTION_DAYS}-day window` },
        { key: 'conversions', label: 'Conversions', value: totalConversions, format: 'int' },
        { key: 'spend', label: 'Spend', value: withCost.length > 0 ? totalCost : null, format: 'inr', caption: withCost.length > 0 ? `${withCost.length} campaign(s) with cost` : 'add cost per row for ROI' },
        { key: 'cpa', label: 'Cost / Admission', value: totalCost > 0 && totalConversions > 0 ? Math.round(totalCost / totalConversions) : null, format: 'inr' }
      ],
      insight: totalCost > 0 && totalConversions > 0
        ? `You spent ${'₹' + Math.round(totalCost).toLocaleString('en-IN')} for ${totalConversions} admission${totalConversions === 1 ? '' : 's'} — ₹${Math.round(totalCost / totalConversions).toLocaleString('en-IN')} per admission.`
        : best
          ? `"${best.campaign}" generated the most leads (${best.leadsAttributed}) — add its spend to see cost per admission.`
          : totalCredits > 0
            ? 'Credits spent but no leads attributed yet — check whether campaign leads are being tagged with the CAMPAIGN source.'
            : null,
      charts: {
        channels: [...byChannel.entries()].map(([channel, v]) => ({ channel, ...v }))
      }
    }
  },

  async rows(ctx, filters) {
    const table = await campaignTable(ctx, filters)
    return {
      columns: [
        { key: 'campaign', label: 'Campaign' },
        { key: 'channel', label: 'Channel', format: 'badge' },
        { key: 'sentAt', label: 'Sent', format: 'date' },
        { key: 'recipients', label: 'Recipients', format: 'int' },
        { key: 'deliveredPct', label: 'Delivered %', format: 'pct' },
        { key: 'leadsAttributed', label: 'Leads', format: 'int' },
        { key: 'conversions', label: 'Conversions', format: 'int' },
        { key: 'cost', label: 'Spend', format: 'inr', editable: 'cost' },
        { key: 'costPerLead', label: 'Cost / Lead', format: 'inr' },
        { key: 'costPerAdmission', label: 'Cost / Admission', format: 'inr' }
      ],
      // rowId lets the report table target the inline cost editor at a campaign.
      rows: table.map(r => ({ ...r, __rowId: r.campaignId })),
      nextCursor: null
    }
  }
}
