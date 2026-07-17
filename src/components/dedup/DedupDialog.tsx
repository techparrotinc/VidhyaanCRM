'use client'

import Link from 'next/link'
import { AlertTriangle, ShieldAlert, X, ArrowUpRight, Loader2 } from 'lucide-react'

export interface DedupMatch {
  type: 'lead' | 'admission' | 'student' | 'enquiry'
  id: string
  code: string
  name: string
  grade: string | null
  status: string
  rule?: string
}

export interface DedupPayload {
  severity: 'hard' | 'soft'
  matches: DedupMatch[]
}

// 'enquiry' (marketplace ParentEnquiry) has no org-facing CRM detail page to
// open — those matches render as info-only, no link, in the list below.
const HREF: Partial<Record<DedupMatch['type'], string>> = {
  lead: '/lead-management',
  admission: '/admission-management',
  student: '/student-management',
}
const TYPE_LABEL: Record<DedupMatch['type'], string> = {
  lead: 'Lead',
  admission: 'Admission',
  student: 'Student',
  enquiry: 'Public Enquiry',
}

/**
 * Rendered when a create returns 409 with `details.dedup`.
 * - hard: block — only "Open existing" (no override)
 * - soft: warn — "Open existing" or "Create anyway" (force)
 */
export function DedupDialog({
  payload, onClose, onForce, busy = false,
}: {
  payload: DedupPayload | null
  onClose: () => void
  onForce?: () => void
  busy?: boolean
}) {
  if (!payload) return null
  const hard = payload.severity === 'hard'
  const first = payload.matches[0]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-slate-100">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hard ? 'bg-red-50' : 'bg-amber-50'}`}>
            {hard
              ? <ShieldAlert className="w-5 h-5 text-red-600" strokeWidth={1.75} />
              : <AlertTriangle className="w-5 h-5 text-amber-600" strokeWidth={1.75} />}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900">
              {hard ? 'Duplicate record' : 'Possible duplicate'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {hard
                ? 'This person already exists. Open the existing record instead of creating a duplicate.'
                : 'We found a likely match. Open it, or create a new record anyway.'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 shrink-0">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Matches */}
        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {payload.matches.map(m => {
            const href = HREF[m.type]
            const row = (
              <>
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">
                  {TYPE_LABEL[m.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{m.name || '—'}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {m.code}{m.grade ? ` · ${m.grade}` : ''} · {m.status.replace(/_/g, ' ').toLowerCase()}
                  </p>
                </div>
                {href && <ArrowUpRight size={15} className="text-slate-300 group-hover:text-[#1565D8] shrink-0" strokeWidth={1.75} />}
              </>
            )
            return href ? (
              <Link
                key={`${m.type}-${m.id}`}
                href={`${href}/${m.id}`}
                className="flex items-center gap-3 border border-slate-200 rounded-lg px-3 py-2.5 hover:border-blue-200 hover:bg-blue-50/40 transition group"
              >
                {row}
              </Link>
            ) : (
              <div
                key={`${m.type}-${m.id}`}
                className="flex items-center gap-3 border border-slate-200 rounded-lg px-3 py-2.5"
              >
                {row}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4 border-t border-slate-100">
          {first && HREF[first.type] && (
            <Link
              href={`${HREF[first.type]}/${first.id}`}
              className="flex-1 text-center text-sm font-semibold bg-[#1565D8] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition"
            >
              Open existing
            </Link>
          )}
          {hard ? (
            <button onClick={onClose} className="text-sm font-semibold text-slate-600 hover:text-slate-800 px-4 py-2.5">
              Cancel
            </button>
          ) : (
            <button
              onClick={onForce}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-lg disabled:opacity-50"
            >
              {busy && <Loader2 size={14} className="animate-spin" />} Create anyway
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
