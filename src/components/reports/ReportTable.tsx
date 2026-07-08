'use client'

import { formatINRFull, formatPct } from './format'
import { Skeleton } from '@/components/ui/skeleton'

export type Column = {
  key: string
  label: string
  format?: 'text' | 'int' | 'inr' | 'pct' | 'hours' | 'date' | 'badge'
}

function renderCell(value: unknown, format?: Column['format']) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-300">—</span>
  }
  switch (format) {
    case 'int':
      return typeof value === 'number' ? value.toLocaleString('en-IN') : String(value)
    case 'inr':
      return typeof value === 'number' ? formatINRFull(value) : String(value)
    case 'pct':
      return typeof value === 'number' ? formatPct(value) : String(value)
    case 'hours':
      return typeof value === 'number' ? `${value.toFixed(1)}h` : String(value)
    case 'date':
      return new Date(String(value)).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    case 'badge':
      return (
        <span className="inline-block text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">
          {String(value).replace(/_/g, ' ')}
        </span>
      )
    default:
      return String(value)
  }
}

export function ReportTable({
  columns,
  rows,
  loading,
  onLoadMore,
  hasMore,
  loadingMore
}: {
  columns: Column[]
  rows: Record<string, unknown>[]
  loading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  loadingMore?: boolean
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              {columns.map(c => (
                <th
                  key={c.key}
                  className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 px-4 py-3 whitespace-nowrap first:sticky first:left-0 first:bg-white"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-500">
                  No rows match these filters
                </td>
              </tr>
            )}
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                {columns.map(c => (
                  <td
                    key={c.key}
                    className="text-sm font-normal leading-relaxed text-slate-700 px-4 py-3 whitespace-nowrap first:sticky first:left-0 first:bg-white"
                  >
                    {renderCell(row[c.key], c.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && onLoadMore && (
        <div className="border-t border-slate-100 p-3 text-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="text-sm font-semibold text-[#1565D8] hover:underline disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
