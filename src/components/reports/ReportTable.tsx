'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatINRFull, formatPct } from './format'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil } from 'lucide-react'

export type Column = {
  key: string
  label: string
  format?: 'text' | 'int' | 'inr' | 'pct' | 'hours' | 'date' | 'badge'
  editable?: 'cost'
}

// Inline-editable numeric cell (currently campaign spend). Commits on blur /
// Enter; empty clears the value.
function EditableCell({
  value, onSave
}: {
  value: unknown
  onSave: (v: number | null) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const commit = async () => {
    setEditing(false)
    const trimmed = draft.trim()
    const next = trimmed === '' ? null : Number(trimmed)
    if (next !== null && (isNaN(next) || next < 0)) return
    const current = typeof value === 'number' ? value : null
    if (next === current) return
    setSaving(true)
    try { await onSave(next) } finally { setSaving(false) }
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        defaultValue={typeof value === 'number' ? value : ''}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        className="w-24 h-7 rounded border border-[#1565D8] px-1.5 text-sm"
        placeholder="₹"
      />
    )
  }
  return (
    <button
      onClick={() => { setDraft(''); setEditing(true) }}
      disabled={saving}
      className="inline-flex items-center gap-1 text-sm text-slate-700 hover:text-[#1565D8] disabled:opacity-50 group/edit"
    >
      {typeof value === 'number' ? formatINRFull(value) : <span className="text-slate-300">Add spend</span>}
      <Pencil className="h-3 w-3 opacity-0 group-hover/edit:opacity-60" />
    </button>
  )
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
  loadingMore,
  onEdit
}: {
  columns: Column[]
  rows: Record<string, unknown>[]
  loading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  /** Commit an inline edit; rowId comes from row.__rowId. */
  onEdit?: (rowId: string, action: 'cost', value: number | null) => Promise<void>
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
              <tr key={i} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                {columns.map(c => (
                  <td
                    key={c.key}
                    className="text-sm font-normal leading-relaxed text-slate-700 px-4 py-3 whitespace-nowrap first:sticky first:left-0 first:bg-white group-hover:first:bg-slate-50"
                  >
                    {c.editable && onEdit && typeof row.__rowId === 'string' ? (
                      <EditableCell
                        value={row[c.key]}
                        onSave={v => onEdit(row.__rowId as string, c.editable!, v)}
                      />
                    ) : c === columns[0] && typeof row.__href === 'string' ? (
                      // Drill-down: queries may attach __href (never exported —
                      // serialisers emit declared columns only)
                      <Link href={row.__href} className="font-medium text-[#1565D8] hover:underline">
                        {renderCell(row[c.key], c.format)}
                      </Link>
                    ) : (
                      renderCell(row[c.key], c.format)
                    )}
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
