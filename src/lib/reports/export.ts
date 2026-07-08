import ExcelJS from 'exceljs'
import type { Column, RowsResult } from './queries/types'

// CSV/XLSX serialisers for report exports. Same columns/rows the table
// endpoint returns — exports are the same query with a different serialiser,
// so role scoping can't diverge (PRD §7.4).

function cellValue(value: unknown, format?: Column['format']): string | number {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (format === 'date' && typeof value === 'string') return value.slice(0, 10)
  if (format === 'pct' && typeof value === 'number') {
    return Math.round(value * 1000) / 10 // 0.184 → 18.4
  }
  if (typeof value === 'number') return value
  return String(value)
}

function csvEscape(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(columns: Column[], rows: Record<string, unknown>[]): string {
  const header = columns
    .map(c => csvEscape(c.format === 'pct' ? `${c.label} (%)` : c.label))
    .join(',')
  const lines = rows.map(row =>
    columns.map(c => csvEscape(cellValue(row[c.key], c.format))).join(',')
  )
  return [header, ...lines].join('\n')
}

export async function toXlsx(
  title: string,
  filtersEcho: string,
  columns: Column[],
  rows: Record<string, unknown>[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(title.slice(0, 31))

  ws.addRow([title]).font = { bold: true, size: 14 }
  ws.addRow([`Exported ${new Date().toLocaleString('en-IN')} · ${filtersEcho}`]).font = {
    size: 9, color: { argb: 'FF64748B' }
  }
  ws.addRow([])

  const headerRow = ws.addRow(
    columns.map(c => (c.format === 'pct' ? `${c.label} (%)` : c.label))
  )
  headerRow.font = { bold: true }
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
  })

  for (const row of rows) {
    ws.addRow(columns.map(c => cellValue(row[c.key], c.format)))
  }

  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = Math.max(12, c.label.length + 4)
  })

  return Buffer.from(await wb.xlsx.writeBuffer())
}

/** Rows for export: drain the paginated rows() up to a hard cap. */
export const EXPORT_ROW_CAP = 10000

export async function drainRows(
  fetchPage: (cursor: string | undefined) => Promise<RowsResult>
): Promise<{ columns: Column[]; rows: Record<string, unknown>[]; truncated: boolean }> {
  const first = await fetchPage(undefined)
  const rows = [...first.rows]
  let cursor = first.nextCursor
  while (cursor && rows.length < EXPORT_ROW_CAP) {
    const page = await fetchPage(cursor)
    rows.push(...page.rows)
    if (page.nextCursor === cursor) break // defensive: no forward progress
    cursor = page.nextCursor
  }
  return {
    columns: first.columns,
    rows: rows.slice(0, EXPORT_ROW_CAP),
    truncated: rows.length >= EXPORT_ROW_CAP && cursor !== null
  }
}
