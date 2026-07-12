'use client'

import React, { useEffect, useState } from 'react'
import {
  Megaphone, Loader2, CheckCircle2, Mail, MessageSquare, Globe,
  Search, X, AlertTriangle, Check
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Audience = 'PARENTS' | 'LEADS' | 'ALL' | 'CUSTOM'

type Preview = {
  parents: number
  leads: number
  both: number
  grades: { label: string; count: number }[]
}

type Pick = { type: 'STUDENT' | 'LEAD'; id: string; name: string; hint: string }

export default function AnnounceModal({
  eventId,
  eventTitle,
  capacity,
  open,
  onClose
}: {
  eventId: string
  eventTitle: string
  capacity?: number | null
  open: boolean
  onClose: () => void
}) {
  const [audience, setAudience] = useState<Audience>('PARENTS')
  const [gradeLabel, setGradeLabel] = useState('')
  const [email, setEmail] = useState(true)
  const [sms, setSms] = useState(false)
  const [whatsapp, setWhatsapp] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ recipients: number; sent: number; failed: number } | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)

  const [picks, setPicks] = useState<Pick[]>([])
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Pick[]>([])

  useEffect(() => {
    if (!open) return
    fetch(`/api/v1/events/${eventId}/announce`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setPreview(j.data) })
      .catch(() => {})
  }, [open, eventId])

  useEffect(() => {
    if (audience !== 'CUSTOM' || query.trim().length < 2) {
      setSearchResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const [sRes, lRes] = await Promise.all([
          fetch(`/api/v1/students?search=${encodeURIComponent(query)}&limit=5`).then((r) => r.json()),
          fetch(`/api/v1/leads?search=${encodeURIComponent(query)}&limit=5`).then((r) => r.json())
        ])
        const students: Pick[] = (sRes.data ?? []).map((s: any) => ({
          type: 'STUDENT' as const,
          id: s.id,
          name: s.guardianName || s.name,
          hint: `Parent of ${s.name}${s.gradeLabel ? ` · ${s.gradeLabel}` : ''}`
        }))
        const leads: Pick[] = (lRes.leads ?? lRes.data ?? []).map((l: any) => ({
          type: 'LEAD' as const,
          id: l.id,
          name: l.parentName,
          hint: `Lead · ${l.leadCode}`
        }))
        setSearchResults([...students, ...leads])
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query, audience])

  const gradeCount = gradeLabel
    ? preview?.grades.find((g) => g.label === gradeLabel)?.count ?? 0
    : preview?.parents ?? 0

  const recipientCount =
    audience === 'PARENTS' ? gradeCount
    : audience === 'LEADS' ? preview?.leads ?? 0
    : audience === 'ALL' ? preview?.both ?? 0
    : picks.length

  const showCapacityWarning = !!capacity && recipientCount > capacity

  const send = async () => {
    const channels = ['PORTAL', ...(email ? ['EMAIL'] : []), ...(sms ? ['SMS'] : []), ...(whatsapp ? ['WHATSAPP'] : [])]
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/events/${eventId}/announce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience,
          channels,
          gradeLabel: audience === 'PARENTS' && gradeLabel ? gradeLabel : undefined,
          recipients: audience === 'CUSTOM' ? picks.map((p) => ({ type: p.type, id: p.id })) : undefined
        })
      })
      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message || json.error || 'Failed to announce')
      }
      setResult(json.data)
    } catch (e: any) {
      setError(e.message || 'Failed to announce')
    } finally {
      setSending(false)
    }
  }

  const close = () => {
    setResult(null)
    setError(null)
    setPicks([])
    setQuery('')
    onClose()
  }

  const AUDIENCE_ROWS: { value: Audience; label: string; count: number | null }[] = [
    { value: 'PARENTS', label: 'Parents of students', count: audience === 'PARENTS' && gradeLabel ? gradeCount : preview?.parents ?? null },
    { value: 'LEADS', label: 'Open leads', count: preview?.leads ?? null },
    { value: 'ALL', label: 'Parents + leads', count: preview?.both ?? null },
    { value: 'CUSTOM', label: 'Specific people', count: picks.length || null }
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close() }}>
      <DialogContent className="w-[calc(100vw-2rem)] !max-w-[30rem] rounded-2xl p-0 bg-white text-left overflow-hidden">
        <div className="flex flex-col max-h-[85vh]">
          <DialogHeader className="px-6 pt-5 pb-3 shrink-0 border-b border-slate-100">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <Megaphone className="h-5 w-5 shrink-0 text-[#1565D8]" /> <span className="truncate">Announce “{eventTitle}”</span>
            </DialogTitle>
          </DialogHeader>

          {result ? (
            <div className="p-6 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">Announcement sent</p>
              <p className="text-sm text-slate-500">
                {result.recipients} recipient{result.recipients !== 1 ? 's' : ''} · {result.sent} delivered
                {result.failed > 0 && ` · ${result.failed} failed`}
              </p>
              <button onClick={close} className="mt-2 px-5 py-2 rounded-lg bg-[#1565D8] text-white text-sm font-semibold cursor-pointer">
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-4">
                {/* WHO — compact one-line rows */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Send to</p>
                  <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    {AUDIENCE_ROWS.map((row) => (
                      <label
                        key={row.value}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer transition-colors ${
                          audience === row.value ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={audience === row.value}
                          onChange={() => setAudience(row.value)}
                          className="accent-[#1565D8] shrink-0"
                        />
                        <span className="flex-1 text-sm font-medium text-slate-700 whitespace-nowrap truncate">{row.label}</span>
                        {row.count != null && (
                          <span className="text-xs font-bold text-[#1565D8] bg-blue-100/60 rounded-full px-2 py-0.5 shrink-0">
                            {row.count}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>

                  {audience === 'PARENTS' && (preview?.grades.length ?? 0) > 0 && (
                    <select
                      value={gradeLabel}
                      onChange={(e) => setGradeLabel(e.target.value)}
                      className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-600 focus:outline-none focus:border-[#1565D8] cursor-pointer"
                    >
                      <option value="">All classes · {preview?.parents ?? 0} parents</option>
                      {preview?.grades.map((g) => (
                        <option key={g.label} value={g.label}>{g.label} · {g.count} parent{g.count !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  )}

                  {audience === 'CUSTOM' && (
                    <div className="mt-2 space-y-2">
                      {picks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {picks.map((p) => (
                            <span key={`${p.type}-${p.id}`} className="inline-flex items-center gap-1 bg-blue-50 text-[#1565D8] text-xs font-semibold rounded-full pl-2.5 pr-1 py-1">
                              {p.name}
                              <button onClick={() => setPicks((prev) => prev.filter((x) => !(x.id === p.id && x.type === p.type)))}
                                className="p-0.5 rounded-full hover:bg-blue-100 cursor-pointer">
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search students or leads…"
                          className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-[#1565D8]"
                        />
                      </div>
                      {searching && <p className="text-xs text-slate-400 pl-1">Searching…</p>}
                      {searchResults.length > 0 && (
                        <div className="border border-slate-100 rounded-lg divide-y divide-slate-50 max-h-36 overflow-y-auto">
                          {searchResults.map((r) => {
                            const already = picks.some((p) => p.id === r.id && p.type === r.type)
                            return (
                              <button
                                key={`${r.type}-${r.id}`}
                                disabled={already}
                                onClick={() => {
                                  setPicks((prev) => [...prev, r])
                                  setQuery('')
                                  setSearchResults([])
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-blue-50 disabled:opacity-40 cursor-pointer"
                              >
                                <span className="text-sm font-medium text-slate-700">{r.name}</span>
                                <span className="text-xs text-slate-400 ml-2">{r.hint}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CHANNELS — compact toggle chips */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Channels</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700">
                      <Globe size={13} /> Parent portal
                      <Check size={12} className="text-green-600" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setEmail((v) => !v)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        email
                          ? 'bg-[#1565D8] border-[#1565D8] text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-[#1565D8] hover:text-[#1565D8]'
                      }`}
                    >
                      <Mail size={13} /> Email {email && <Check size={12} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSms((v) => !v)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        sms
                          ? 'bg-[#1565D8] border-[#1565D8] text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-[#1565D8] hover:text-[#1565D8]'
                      }`}
                    >
                      <MessageSquare size={13} /> SMS {sms && <Check size={12} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWhatsapp((v) => !v)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                        whatsapp
                          ? 'bg-[#1565D8] border-[#1565D8] text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-[#1565D8] hover:text-[#1565D8]'
                      }`}
                    >
                      <MessageSquare size={13} /> WhatsApp {whatsapp && <Check size={12} />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Portal &amp; email are free · SMS &amp; WhatsApp use 1 credit per message{(sms || whatsapp) && recipientCount > 0 ? ` (~${recipientCount * ((sms ? 1 : 0) + (whatsapp ? 1 : 0))} credits)` : ''} · WhatsApp needs the &quot;event announcement&quot; template added from the catalog
                  </p>
                </div>

                {showCapacityWarning && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>
                      {capacity} seat{capacity !== 1 ? 's' : ''}, {recipientCount} invited — everyone gets the invite; RSVPs close when seats fill.
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-white">
                {error && <p className="text-sm font-medium text-red-600 mb-2">{error}</p>}
                <div className="flex justify-end gap-3">
                  <button onClick={close} disabled={sending}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 cursor-pointer whitespace-nowrap">
                    Not now
                  </button>
                  <button onClick={send} disabled={sending || recipientCount === 0}
                    className="px-5 py-2 rounded-lg bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center gap-2 whitespace-nowrap">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                    {sending ? 'Sending…' : `Send to ${recipientCount} recipient${recipientCount !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
