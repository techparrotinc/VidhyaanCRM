import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from './api'

/** Wire contract for GET /api/v1/reports/r/[reportKey]/summary (composer-
 *  routed, mobile Bearer already works). Every report's summary() returns
 *  the same {kpis, insight} shape (src/lib/reports/queries/*.ts) — one
 *  generic card renders any of them, no per-report UI needed. */

export const reportKpiSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number().nullable(),
  format: z.enum(['inr', 'int', 'pct', 'date']),
  caption: z.string().optional()
})
export type ReportKpi = z.infer<typeof reportKpiSchema>

const summaryResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    kpis: z.array(reportKpiSchema),
    insight: z.string().nullable().optional()
  })
})

export function useReportSummary(reportKey: string) {
  return useQuery({
    queryKey: ['report-summary', reportKey],
    queryFn: async () => {
      const json = await api<unknown>(`/api/v1/reports/r/${reportKey}/summary`)
      return summaryResponseSchema.parse(json).data
    }
  })
}

export function formatKpiValue(kpi: ReportKpi): string {
  if (kpi.value === null) return '—'
  switch (kpi.format) {
    case 'inr':
      return `₹${Math.round(kpi.value).toLocaleString('en-IN')}`
    case 'pct':
      return `${Math.round(kpi.value * 100)}%`
    case 'date':
      return new Date(kpi.value).toLocaleDateString('en-IN')
    default:
      return Math.round(kpi.value).toLocaleString('en-IN')
  }
}

export const MOBILE_REPORT_CARDS: Array<{ key: string; title: string }> = [
  { key: 'fee-collection-summary', title: 'Collection this month' },
  { key: 'lead-funnel', title: 'Lead funnel' },
  { key: 'defaulter-ageing', title: 'Ageing summary' },
  { key: 'attendance-summary', title: 'Attendance trend' }
]
