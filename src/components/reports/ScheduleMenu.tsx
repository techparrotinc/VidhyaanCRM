'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, ChevronDown, Trash2, Send, CheckCircle2, AlertCircle } from 'lucide-react'

// Email-schedule popover on report pages. Personal schedules only; sends
// fire in the daily 08:00 IST window with the creator's role scoping.

const CADENCES = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekly_mon', label: 'Weekly · Monday' },
  { value: 'weekly_fri', label: 'Weekly · Friday' },
  { value: 'monthly_1', label: 'Monthly · 1st' },
  { value: 'monthly_15', label: 'Monthly · 15th' }
]

type Schedule = {
  id: string
  cadence: string
  recipients: string[]
  enabled: boolean
  savedViewId?: string | null
  lastRunAt?: string | null
  lastStatus?: string | null
  lastError?: string | null
}

type SavedView = { id: string; name: string }

export function ScheduleMenu({ reportKey }: { reportKey: string }) {
  const [open, setOpen] = useState(false)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [cadence, setCadence] = useState('weekly_mon')
  const [recipients, setRecipients] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [views, setViews] = useState<SavedView[]>([])
  const [savedViewId, setSavedViewId] = useState('')

  useEffect(() => {
    if (!open) return
    fetch(`/api/v1/reports/schedules?reportKey=${reportKey}`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => json && setSchedules(json.data))
      .catch(() => {})
    fetch(`/api/v1/reports/views?reportKey=${reportKey}`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => json && setViews(json.data))
      .catch(() => {})
  }, [open, reportKey])

  const createSchedule = async () => {
    const emails = recipients.split(',').map(e => e.trim()).filter(Boolean)
    if (emails.length === 0) {
      setError('Add at least one email')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/reports/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportKey, cadence, recipients: emails, ...(savedViewId ? { savedViewId } : {}) })
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Could not create schedule')
        return
      }
      setSchedules(s => [json.data, ...s])
      setRecipients('')
    } finally {
      setSaving(false)
    }
  }

  const deleteSchedule = async (id: string) => {
    await fetch(`/api/v1/reports/schedules/${id}`, { method: 'DELETE' }).catch(() => {})
    setSchedules(s => s.filter(x => x.id !== id))
  }

  const toggleSchedule = async (s: Schedule) => {
    setSchedules(list => list.map(x => (x.id === s.id ? { ...x, enabled: !s.enabled } : x)))
    await fetch(`/api/v1/reports/schedules/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !s.enabled })
    }).catch(() => {})
  }

  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null)

  const sendTest = async (id: string) => {
    setTesting(id)
    setTestResult(null)
    try {
      const res = await fetch(`/api/v1/reports/schedules/${id}/test`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      setTestResult(
        res.ok
          ? { id, ok: true, msg: `Sent to ${json.data?.sent ?? 0} recipient(s)` }
          : { id, ok: false, msg: json.error ?? 'Test send failed' }
      )
    } finally {
      setTesting(null)
    }
  }

  const lastRunLabel = (s: Schedule) => {
    if (!s.lastRunAt) return null
    const when = new Date(s.lastRunAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    if (s.lastStatus === 'error') return { ok: false, text: `Failed ${when}` }
    if (s.lastStatus === 'skipped') return { ok: false, text: `Skipped ${when}` }
    return { ok: true, text: `Sent ${when}` }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-semibold ${
          schedules.some(s => s.enabled)
            ? 'border-blue-200 bg-blue-50 text-[#1565D8]'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
        }`}
      >
        <CalendarClock className="h-4 w-4" />
        Schedule
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-20 w-80 rounded-xl border border-slate-200 bg-white shadow-lg p-3 space-y-3">
          {schedules.length > 0 && (
            <div className="space-y-1.5">
              {schedules.map(s => {
                const last = lastRunLabel(s)
                return (
                <div key={s.id} className="rounded-lg bg-slate-50 px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleSchedule(s)}
                      className="text-left flex-1 min-w-0"
                      title={s.enabled ? 'Click to pause' : 'Click to resume'}
                    >
                      <p className={`text-sm font-medium truncate ${s.enabled ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                        {CADENCES.find(c => c.value === s.cadence)?.label ?? s.cadence}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{s.recipients.join(', ')}</p>
                    </button>
                    <button
                      onClick={() => sendTest(s.id)}
                      disabled={testing === s.id}
                      className="p-1 text-slate-400 hover:text-[#1565D8] shrink-0 disabled:opacity-40"
                      title="Send a test email now"
                      aria-label="Send test"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteSchedule(s.id)}
                      className="p-1 text-slate-300 hover:text-red-500 shrink-0"
                      aria-label="Delete schedule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {(last || (testResult && testResult.id === s.id)) && (
                    <div className="mt-1 flex items-center gap-1 text-[11px]">
                      {testResult && testResult.id === s.id ? (
                        <span className={`flex items-center gap-1 ${testResult.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                          {testResult.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          {testResult.msg}
                        </span>
                      ) : last ? (
                        <span className={`flex items-center gap-1 ${last.ok ? 'text-slate-400' : 'text-red-500'}`}>
                          {last.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          {last.text}
                          {!last.ok && s.lastError ? ` · ${s.lastError.slice(0, 40)}` : ''}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          )}

          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Email this report
            </p>
            <select
              value={cadence}
              onChange={e => setCadence(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-sm"
            >
              {CADENCES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {views.length > 0 && (
              <select
                value={savedViewId}
                onChange={e => setSavedViewId(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-sm"
              >
                <option value="">All data (no saved view)</option>
                {views.map(v => (
                  <option key={v.id} value={v.id}>View: {v.name}</option>
                ))}
              </select>
            )}
            <input
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
              placeholder="email@school.com, email2@…"
              className="w-full h-9 rounded-lg border border-slate-200 px-2.5 text-sm"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={createSchedule}
              disabled={saving}
              className="w-full h-9 rounded-lg bg-[#1565D8] text-white text-sm font-semibold hover:bg-[#1257bd] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Create schedule'}
            </button>
            <p className="text-[11px] text-slate-400">
              Sends at 8:00 AM IST with your data visibility. To schedule filtered data,
              save the filters as a view first, then pick it above.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
