import { NextRequest, NextResponse } from 'next/server'
import { getUsageOverview } from '@/lib/usage/overview'
import { getAlertChannels } from '@/lib/platform-config'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { postSlackAlert } from '@/lib/alerts/slack'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

// Weekly platform usage & health digest for customer success. Emails the ops
// alert address (and Slack) a summary of engagement + the top at-risk orgs.
// ?days= to change the window; requires CRON_SECRET.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const days = parseInt(new URL(req.url).searchParams.get('days') || '7', 10)
  const { opsAlertEmail } = await getAlertChannels()
  const o = await getUsageOverview(days)

  const atRisk = o.rows.filter((r) => r.atRisk && (r.actions > 0 || r.activeHours > 0 || r.totalUsers > 0)).slice(0, 10)
  const top = [...o.rows].sort((a, b) => b.healthScore - a.healthScore).slice(0, 5)

  const rowHtml = (r: { name: string; healthScore: number; adoptionPct: number; activeHours: number; signals: string[] }) =>
    `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${r.name}</td>
     <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${r.healthScore}%</td>
     <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${r.adoptionPct}%</td>
     <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${r.activeHours}h</td>
     <td style="padding:6px 10px;border-bottom:1px solid #eee;color:#c00;font-size:12px">${r.signals.join(', ')}</td></tr>`

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
      <h2 style="color:#1a365d">Vidhyaan — Usage &amp; Health Digest (last ${o.days} days)</h2>
      <p style="color:#4a5568">
        <strong>${o.totals.trackedOrgs}</strong>/${o.totals.orgs} orgs active ·
        avg health <strong>${o.totals.avgHealth}%</strong> ·
        <strong>${o.totals.atRisk}</strong> at risk ·
        ${o.totals.totalActiveHours}h in-app · value delivered <strong>${inr(o.totals.totalCostSavings)}</strong>
      </p>
      <h3 style="color:#c00;margin-top:20px">At-risk organizations</h3>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <tr style="text-align:left;color:#718096"><th style="padding:6px 10px">Org</th><th style="padding:6px 10px;text-align:right">Health</th><th style="padding:6px 10px;text-align:right">Adoption</th><th style="padding:6px 10px;text-align:right">Hours</th><th style="padding:6px 10px">Signals</th></tr>
        ${atRisk.length ? atRisk.map(rowHtml).join('') : '<tr><td colspan="5" style="padding:10px;color:#718096">None 🎉</td></tr>'}
      </table>
      <h3 style="color:#2f855a;margin-top:20px">Top engaged</h3>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        ${top.map(rowHtml).join('')}
      </table>
      <p style="font-size:12px;color:#718096;margin-top:20px">Automated from Vidhyaan Platform · /admin/usage</p>
    </div>`

  let emailed = false
  if (opsAlertEmail) {
    try {
      await sendTransactionalEmail({ to: opsAlertEmail, subject: `Vidhyaan usage digest — ${o.totals.atRisk} orgs at risk`, htmlBody: html })
      emailed = true
    } catch (e) {
      console.error('[usage-digest] email failed:', e)
    }
  }
  postSlackAlert(`📊 Usage digest: ${o.totals.trackedOrgs}/${o.totals.orgs} active, avg health ${o.totals.avgHealth}%, ${o.totals.atRisk} at risk, value ${inr(o.totals.totalCostSavings)}.`)

  return NextResponse.json({ ok: true, emailed, opsAlertEmail: !!opsAlertEmail, atRisk: atRisk.length })
}
