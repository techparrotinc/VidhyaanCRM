import type { Kpi, Column } from './queries/types'

// Scheduled report delivery. Cadence is a validated token, not raw cron —
// all sends fire in the daily 08:00 IST delivery window (cron at 02:30 UTC).

export const CADENCE_TOKENS = [
  'daily',
  'weekly_mon', 'weekly_tue', 'weekly_wed', 'weekly_thu',
  'weekly_fri', 'weekly_sat', 'weekly_sun',
  'monthly_1', 'monthly_15'
] as const

export type CadenceToken = (typeof CADENCE_TOKENS)[number]

export const CADENCE_LABELS: Record<CadenceToken, string> = {
  daily: 'Every day',
  weekly_mon: 'Weekly · Monday',
  weekly_tue: 'Weekly · Tuesday',
  weekly_wed: 'Weekly · Wednesday',
  weekly_thu: 'Weekly · Thursday',
  weekly_fri: 'Weekly · Friday',
  weekly_sat: 'Weekly · Saturday',
  weekly_sun: 'Weekly · Sunday',
  monthly_1: 'Monthly · 1st',
  monthly_15: 'Monthly · 15th'
}

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

/** Is this cadence due on the given IST calendar date? */
export function cadenceDueToday(cadence: string, istNow: Date): boolean {
  if (cadence === 'daily') return true
  if (cadence.startsWith('weekly_')) {
    return cadence === `weekly_${WEEKDAYS[istNow.getUTCDay()]}`
  }
  if (cadence.startsWith('monthly_')) {
    return cadence === `monthly_${istNow.getUTCDate()}`
  }
  return false
}

/** Current instant shifted to IST, for UTC-safe day/date reads. */
export function nowInIst(): Date {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000)
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fmt(value: unknown, format?: string): string {
  if (value === null || value === undefined || value === '') return '—'
  if (value instanceof Date) return value.toLocaleDateString('en-IN')
  if (format === 'date') return new Date(String(value)).toLocaleDateString('en-IN')
  if (format === 'pct' && typeof value === 'number') return `${(value * 100).toFixed(1)}%`
  if (format === 'inr' && typeof value === 'number') return `₹${Math.round(value).toLocaleString('en-IN')}`
  if (format === 'hours' && typeof value === 'number') return `${value}h`
  if (typeof value === 'number') return value.toLocaleString('en-IN')
  return String(value)
}

/** Inline-styled HTML email: title, insight, KPI row, top rows, deep link. */
export function renderScheduleEmail(input: {
  orgName: string
  reportTitle: string
  cadenceLabel: string
  insight: string | null
  kpis: Kpi[]
  columns: Column[]
  rows: Record<string, unknown>[]
  reportUrl: string
}): { subject: string; html: string; text: string } {
  const { orgName, reportTitle, cadenceLabel, insight, kpis, columns, rows, reportUrl } = input

  const kpiCells = kpis.slice(0, 5).map(k => `
    <td style="border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;">
      <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${esc(k.label)}</div>
      <div style="font-size:20px;font-weight:700;color:#0f172a;margin-top:2px;">${esc(fmt(k.value, k.format))}</div>
    </td>`).join('<td style="width:8px;"></td>')

  const headerCells = columns.map(c =>
    `<th style="text-align:left;font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:0.5px;padding:6px 8px;border-bottom:2px solid #cbd5e1;">${esc(c.label)}</th>`
  ).join('')
  const bodyRows = rows.slice(0, 15).map(r => `
    <tr>${columns.map(c =>
      `<td style="font-size:12px;color:#334155;padding:6px 8px;border-bottom:1px solid #e2e8f0;">${esc(fmt(r[c.key], c.format))}</td>`
    ).join('')}</tr>`).join('')

  const html = `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;">
  <div style="font-size:11px;color:#64748b;">${esc(orgName)} · ${esc(cadenceLabel)}</div>
  <h1 style="font-size:20px;color:#0f172a;margin:4px 0 2px;">${esc(reportTitle)}</h1>
  ${insight ? `<p style="font-size:13px;color:#475569;background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:8px 12px;margin:12px 0;">💡 ${esc(insight)}</p>` : ''}
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;"><tr>${kpiCells}</tr></table>
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  ${rows.length > 15 ? `<p style="font-size:11px;color:#94a3b8;">Showing 15 of ${rows.length}+ rows.</p>` : ''}
  <a href="${esc(reportUrl)}" style="display:inline-block;background:#1565D8;color:#ffffff;font-size:13px;font-weight:600;padding:10px 18px;border-radius:8px;text-decoration:none;">Open full report</a>
  <p style="font-size:10px;color:#94a3b8;margin-top:24px;">Scheduled report from Vidhyaan. Manage schedules on the report page.</p>
</div>`

  const text = [
    `${reportTitle} — ${orgName} (${cadenceLabel})`,
    insight ?? '',
    ...kpis.slice(0, 5).map(k => `${k.label}: ${fmt(k.value, k.format)}`),
    `Full report: ${reportUrl}`
  ].filter(Boolean).join('\n')

  return {
    subject: `${reportTitle} — ${orgName}`,
    html,
    text
  }
}
