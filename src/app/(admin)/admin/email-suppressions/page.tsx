'use client'

import { useState, useEffect, useCallback } from 'react'
import { MailX, Search, Loader2, Trash2 } from 'lucide-react'

type Row = {
  id: string
  email: string
  reason: string
  source: string | null
  detail: string | null
  createdAt: string
}

export default function EmailSuppressionsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [busyEmail, setBusyEmail] = useState<string | null>(null)

  const fetchRows = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/email-suppressions?${params}`)
      const json = await res.json()
      setRows(json.data ?? [])
      setTotal(json.total ?? 0)
      setTotalPages(json.totalPages ?? 1)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const handleUnsuppress = async (email: string) => {
    if (!confirm(`Remove ${email} from the suppression list? Future sends to this address will be attempted again.`)) return
    setBusyEmail(email)
    try {
      const res = await fetch('/api/admin/email-suppressions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (!res.ok) throw new Error('Failed to unsuppress')
      await fetchRows()
    } catch (err) {
      console.error(err)
      alert('Could not remove this address. Try again.')
    } finally {
      setBusyEmail(null)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <MailX className="w-6 h-6 text-slate-400" />
          Email Suppressions
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Platform-wide — an address here can't receive mail from any org, including OTP/verification emails.
          {total > 0 && <span className="font-semibold text-slate-700"> {total} suppressed.</span>}
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search email..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Email</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Reason</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Detail</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Suppressed</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">No suppressed addresses{search ? ' matching your search' : ''}.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-800">{r.email}</td>
                <td className="px-4 py-3">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">{r.reason}</span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{r.detail ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleUnsuppress(r.email)}
                    disabled={busyEmail === r.email}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {busyEmail === r.email ? 'Removing...' : 'Unsuppress'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
