import type { OrgScopedClient } from '@/lib/db/tenant'
import { ayScope, branchScope } from './scope'

// Contract every report query module implements. The generic
// /api/v1/reports/r/[reportKey]/{summary,rows,export} routes dispatch here;
// the frontend renders entirely from these payloads (no per-report clients).

export type ReportCtx = {
  db: OrgScopedClient
  orgId: string
  userId: string
  role: string
  branchIds: string[] | null
  academicYearId?: string
}

export type Filters = Record<string, string | undefined>

export type ValueFormat = 'int' | 'inr' | 'pct' | 'hours' | 'text' | 'date' | 'badge'

export type Kpi = {
  key: string
  label: string
  value: number | string | null
  format: ValueFormat
  caption?: string
}

export type Column = {
  key: string
  label: string
  format?: ValueFormat
  /** Marks the cell inline-editable; the value is the edit action key the
   *  frontend routes to (currently only 'cost' → campaign spend). */
  editable?: 'cost'
}

export type SummaryResult = {
  kpis: Kpi[]
  /** One-sentence computed insight shown under the report title. */
  insight: string | null
  charts: Record<string, unknown>
}

export type RowsResult = {
  columns: Column[]
  rows: Record<string, unknown>[]
  /** Opaque continuation token; reports with small fixed row sets return null. */
  nextCursor: string | null
}

export type ReportQuery = {
  summary: (ctx: ReportCtx, filters: Filters) => Promise<SummaryResult>
  rows: (
    ctx: ReportCtx,
    filters: Filters,
    cursor: string | undefined,
    limit: number
  ) => Promise<RowsResult>
}

// ---- shared filter helpers -------------------------------------------------

/** createdAt-style window from `from`/`to` (YYYY-MM-DD, inclusive). */
export function rangeFilter(filters: Filters): { gte?: Date; lt?: Date } | undefined {
  const gte = filters.from ? new Date(`${filters.from}T00:00:00`) : undefined
  const lt = filters.to
    ? new Date(new Date(`${filters.to}T00:00:00`).getTime() + 864e5)
    : undefined
  if (!gte && !lt) return undefined
  return {
    ...(gte && !isNaN(gte.getTime()) ? { gte } : {}),
    ...(lt && !isNaN(lt.getTime()) ? { lt } : {})
  }
}

/** Comma-separated multi-value filter → `in` list. */
export function listFilter(value: string | undefined): string[] | undefined {
  if (!value) return undefined
  const items = value.split(',').map(v => v.trim()).filter(Boolean)
  return items.length > 0 ? items : undefined
}

/** Base tenant scoping shared by lead/admission-shaped queries. COUNSELLOR
 *  sees own rows only — applied here so no report can forget it. */
export function leadBaseWhere(ctx: ReportCtx) {
  return {
    ...ayScope(ctx.academicYearId),
    ...branchScope(ctx.branchIds),
    ...(ctx.role === 'COUNSELLOR' ? { assignedToId: ctx.userId } : {})
  }
}

/** Offset-based cursor (reports paginate small, filtered sets). */
export function offsetCursor(cursor: string | undefined): number {
  const n = Number(cursor)
  return Number.isInteger(n) && n > 0 ? n : 0
}

export function nextOffsetCursor(
  offset: number,
  pageSize: number,
  received: number
): string | null {
  return received === pageSize ? String(offset + pageSize) : null
}
