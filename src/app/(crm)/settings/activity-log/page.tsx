'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { ScrollText, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'

interface Row {
  id: string
  userId: string | null
  userName: string | null
  userRole: string | null
  action: string
  entityType: string
  entityId: string | null
  before: unknown
  after: unknown
  ipAddress: string | null
  createdAt: string
}

interface Pagination { total: number; page: number; limit: number; totalPages: number }

const ACTION_STYLE: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  ARCHIVE: 'bg-amber-100 text-amber-700',
  RESTORE: 'bg-teal-100 text-teal-700',
  VOID: 'bg-rose-100 text-rose-700',
  EXPORT: 'bg-violet-100 text-violet-700',
}

const ROLE_LABEL: Record<string, string> = {
  ORG_ADMIN: 'Org Admin',
  BRANCH_ADMIN: 'Branch Admin',
  COUNSELLOR: 'Counsellor',
  RECEPTIONIST: 'Receptionist',
  ACCOUNTANT: 'Accountant',
  TEACHER: 'Teacher',
}

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE', 'VOID', 'EXPORT']

const RETENTION_LABEL: Record<number, string> = {
  0: 'Keep forever',
  30: '30 days',
  60: '60 days',
  90: '90 days',
  180: '6 months',
  365: '1 year',
  730: '2 years',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function entityLabel(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ActivityLogPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [entityTypes, setEntityTypes] = useState<string[]>([])
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 25, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Retention policy
  const [retentionDays, setRetentionDays] = useState<number>(365)
  const [retentionPresets, setRetentionPresets] = useState<number[]>([30, 60, 90, 180, 365, 730, 0])
  const [savingRetention, setSavingRetention] = useState(false)
  const [retentionSaved, setRetentionSaved] = useState(false)

  // Filters
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [q, setQ] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (action) p.set('action', action)
      if (entityType) p.set('entityType', entityType)
      if (q) p.set('q', q)
      if (dateFrom) p.set('dateFrom', dateFrom)
      if (dateTo) p.set('dateTo', new Date(dateTo + 'T23:59:59').toISOString())
      p.set('page', String(page))
      const res = await fetch(`/api/v1/settings/activity-log?${p.toString()}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setRows(json.data.rows)
        setEntityTypes(json.data.entityTypes)
        setPagination(json.data.pagination)
        if (typeof json.data.retentionDays === 'number') setRetentionDays(json.data.retentionDays)
        if (Array.isArray(json.data.retentionPresets)) setRetentionPresets(json.data.retentionPresets)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [action, entityType, q, dateFrom, dateTo, page])

  useEffect(() => { load() }, [load])

  // Reset to page 1 whenever a filter changes.
  useEffect(() => { setPage(1) }, [action, entityType, q, dateFrom, dateTo])

  const saveRetention = async (days: number) => {
    setSavingRetention(true)
    setRetentionSaved(false)
    const prev = retentionDays
    setRetentionDays(days)
    try {
      const res = await fetch('/api/v1/settings/activity-log', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionDays: days }),
      })
      if (res.ok) {
        setRetentionSaved(true)
        setTimeout(() => setRetentionSaved(false), 2500)
      } else {
        setRetentionDays(prev)
      }
    } catch {
      setRetentionDays(prev)
    } finally {
      setSavingRetention(false)
    }
  }

  const hasFilters = action || entityType || q || dateFrom || dateTo
  const clearFilters = () => {
    setAction(''); setEntityType(''); setQ(''); setDateFrom(''); setDateTo('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1565D8]/10">
          <ScrollText className="h-5 w-5 text-[#1565D8]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activity Log</h1>
          <p className="text-sm font-normal leading-relaxed text-slate-500">
            Every critical create, update, delete, archive and void across your workspace — who did it and when.
          </p>
        </div>
      </div>

      {/* Retention policy */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Log retention</div>
          <p className="text-xs text-slate-500">
            Automatically delete activity older than this. Pruning runs nightly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {retentionSaved && <span className="text-xs font-semibold text-emerald-600">Saved</span>}
          <select
            value={retentionDays}
            disabled={savingRetention}
            onChange={(e) => saveRetention(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#1565D8] disabled:opacity-50"
          >
            {retentionPresets.map((d) => (
              <option key={d} value={d}>{RETENTION_LABEL[d] ?? `${d} days`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Record type or ID"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1565D8]"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Action</label>
          <select value={action} onChange={(e) => setAction(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1565D8]">
            <option value="">All actions</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{a.charAt(0) + a.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Record</label>
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1565D8]">
            <option value="">All records</option>
            {entityTypes.map((t) => <option key={t} value={t}>{entityLabel(t)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1565D8]" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1565D8]" />
        </div>
        {hasFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">When</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Who</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Action</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Record</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">No activity found.</td></tr>
            ) : (
              rows.map((r) => {
                const detail = (r.before ?? r.after) as Record<string, unknown> | null
                const isOpen = expanded === r.id
                return (
                  <Fragment key={r.id}>
                    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{fmtDate(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900">{r.userName ?? 'System'}</div>
                        {r.userRole && <div className="text-xs text-slate-400">{ROLE_LABEL[r.userRole] ?? r.userRole}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ACTION_STYLE[r.action] ?? 'bg-slate-100 text-slate-600'}`}>
                          {r.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-900">{entityLabel(r.entityType)}</div>
                        {r.entityId && <div className="font-mono text-xs text-slate-400">{r.entityId.slice(0, 12)}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {detail ? (
                          <button onClick={() => setExpanded(isOpen ? null : r.id)}
                            className="text-sm font-semibold text-[#1565D8] hover:underline">
                            {isOpen ? 'Hide' : 'View'}
                          </button>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </td>
                    </tr>
                    {isOpen && detail && (
                      <tr className="bg-slate-50">
                        <td colSpan={5} className="px-4 py-3">
                          <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                            {JSON.stringify({ before: r.before, after: r.after }, null, 2)}
                          </pre>
                          {r.ipAddress && <div className="mt-2 text-xs text-slate-400">IP: {r.ipAddress}</div>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {pagination.total} record{pagination.total === 1 ? '' : 's'} · page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-40 enabled:hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-40 enabled:hover:bg-slate-50">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
