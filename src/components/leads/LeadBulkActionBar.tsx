"use client"

import React, { useEffect, useRef, useState } from 'react'
import { CheckSquare, UserPlus, ClipboardList, Download, Trash2, X, Loader2 } from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-dialog'

type Counsellor = { id: string; name: string }

type LeadBulkActionBarProps = {
  selectedIds: string[]
  selectedLeads: any[]
  counsellors: Counsellor[]
  onClear: () => void
  onDone: (message: string) => void
  onError: (message: string) => void
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'FOLLOW_UP_PENDING', label: 'Follow-up Pending' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' }
]

const csvEscape = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function LeadBulkActionBar({
  selectedIds,
  selectedLeads,
  counsellors,
  onClear,
  onDone,
  onError
}: LeadBulkActionBarProps) {
  const confirm = useConfirm()
  const [menu, setMenu] = useState<'assign' | 'status' | null>(null)
  const [busy, setBusy] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setMenu(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  if (selectedIds.length === 0) return null

  const runBulk = async (payload: Record<string, unknown>, successMsg: string | ((data: any) => string)) => {
    setBusy(true)
    setMenu(null)
    try {
      const res = await fetch('/api/v1/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, ...payload })
      })
      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message || json.error || 'Bulk action failed')
      }
      onDone(typeof successMsg === 'function' ? successMsg(json.data) : successMsg)
    } catch (e: any) {
      onError(e.message || 'Bulk action failed')
    } finally {
      setBusy(false)
    }
  }

  const exportCsv = () => {
    const header = ['Lead Code', 'Parent Name', 'Child Name', 'Phone', 'Email', 'Status', 'Priority', 'Source', 'Grade Sought', 'Assigned To', 'Created At']
    const rows = selectedLeads.map((l) => [
      l.leadCode, l.parentName, l.kidName, l.phone, l.email, l.status, l.priority,
      l.source, l.gradeSought, l.assignedTo?.name ?? '', l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : ''
    ].map(csvEscape).join(','))
    const csv = [header.join(','), ...rows].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    // Export is client-side only (no server round-trip for the file itself)
    // — this just leaves an audit trail of who exported PII and how much.
    fetch('/api/v1/leads/export-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: selectedLeads.length, scope: 'selected' })
    }).catch(() => {})
    onDone(`Exported ${selectedLeads.length} leads to CSV`)
  }

  const confirmDelete = async () => {
    const okToDelete = await confirm({
      title: `Delete ${selectedIds.length} selected lead(s)?`,
      message: 'They will be removed from all views.',
      confirmLabel: 'Delete',
      variant: 'danger'
    })
    if (!okToDelete) return
    runBulk({ action: 'delete' }, `${selectedIds.length} lead(s) deleted`)
  }

  const menuCls = 'absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white text-slate-700 rounded-xl shadow-2xl border border-slate-200 py-1.5 w-52 max-h-64 overflow-y-auto'
  const menuItemCls = 'w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-[#1565D8] transition'

  return (
    <div ref={barRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 shadow-2xl flex items-center gap-3 sm:gap-4 z-50 animate-fade-in max-w-[95%] sm:max-w-none">
      <div className="flex items-center gap-2">
        <CheckSquare className="size-4 text-blue-400" />
        <span className="text-sm font-semibold">{selectedIds.length} selected</span>
      </div>
      <div className="w-px h-5 bg-slate-600" />

      <div className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
        <div className="relative">
          <button
            onClick={() => setMenu(m => m === 'assign' ? null : 'assign')}
            disabled={busy}
            className="hover:text-blue-300 cursor-pointer transition flex items-center disabled:opacity-50"
            title="Assign Counsellor"
          >
            <UserPlus size={16} className="sm:hidden" />
            <span className="hidden sm:inline">Assign Counsellor</span>
          </button>
          {menu === 'assign' && (
            <div className={menuCls}>
              {counsellors.length === 0 ? (
                <p className="px-4 py-2 text-sm text-slate-400">No counsellors</p>
              ) : (
                counsellors.map((c) => (
                  <button key={c.id} className={menuItemCls}
                    onClick={() => runBulk({ action: 'assign', assignedToId: c.id }, `${selectedIds.length} lead(s) assigned to ${c.name}`)}>
                    {c.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenu(m => m === 'status' ? null : 'status')}
            disabled={busy}
            className="hover:text-blue-300 cursor-pointer transition flex items-center disabled:opacity-50"
            title="Change Status"
          >
            <ClipboardList size={16} className="sm:hidden" />
            <span className="hidden sm:inline">Change Status</span>
          </button>
          {menu === 'status' && (
            <div className={menuCls}>
              {STATUS_OPTIONS.map((s) => (
                <button key={s.value} className={menuItemCls}
                  onClick={() => runBulk({ action: 'status', status: s.value }, (data) =>
                    data?.skippedQueued
                      ? `${data.updated} lead(s) moved to ${s.label}; ${data.skippedQueued} skipped (queued past your plan's lead limit — upgrade to convert)`
                      : `${selectedIds.length} lead(s) moved to ${s.label}`
                  )}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={exportCsv} disabled={busy}
          className="hover:text-blue-300 cursor-pointer transition flex items-center disabled:opacity-50" title="Export Selected">
          <Download size={16} className="sm:hidden" />
          <span className="hidden sm:inline">Export Selected</span>
        </button>
      </div>
      <div className="w-px h-5 bg-slate-600" />

      <button onClick={confirmDelete} disabled={busy}
        className="flex items-center gap-1 text-red-400 hover:text-red-300 transition cursor-pointer text-sm font-medium disabled:opacity-50" title="Delete">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        <span className="hidden sm:inline">Delete</span>
      </button>

      <button onClick={onClear} className="ml-1 sm:ml-2 text-slate-400 hover:text-slate-200 cursor-pointer">
        <X className="size-4" />
      </button>
    </div>
  )
}
