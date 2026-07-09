'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Save, Users } from 'lucide-react'
import Link from 'next/link'

type Action = 'off' | 'soft' | 'hard'
interface RuleMeta { key: string; label: string; signals: string; description: string }

const ACTIONS: { value: Action; label: string; help: string }[] = [
  { value: 'off', label: 'Off', help: 'Ignore this match' },
  { value: 'soft', label: 'Warn', help: 'Allow, but warn and require confirmation' },
  { value: 'hard', label: 'Block', help: 'Block the duplicate entirely' },
]

const ACTION_STYLE: Record<Action, string> = {
  off: 'bg-slate-800 text-white',
  soft: 'bg-amber-500 text-white',
  hard: 'bg-red-600 text-white',
}

export default function DeduplicationSettingsPage() {
  const [rules, setRules] = useState<RuleMeta[]>([])
  const [config, setConfig] = useState<Record<string, Action>>({})
  const [initial, setInitial] = useState<Record<string, Action>>({})
  const [instType, setInstType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/v1/settings/deduplication')
      .then(r => r.json())
      .then(res => {
        const d = res.data
        setRules(d.rules ?? [])
        setConfig(d.config ?? {})
        setInitial(d.config ?? {})
        setInstType(d.institutionType ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const dirty = JSON.stringify(config) !== JSON.stringify(initial)

  const setAction = (key: string, action: Action) => {
    setConfig(c => ({ ...c, [key]: action }))
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/settings/deduplication', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: config }),
      })
      if (res.ok) {
        setInitial(config)
        setSaved(true)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#1565D8]" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Duplicate detection</h1>
            <p className="text-sm text-slate-500 leading-relaxed mt-1 max-w-xl">
              Control what happens when a new lead, admission or student matches someone already on file.
              Matches on the same phone but a different child (siblings) or a new academic year are always allowed.
            </p>
          </div>
        </div>
        <Link href="/families" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#1565D8] hover:underline shrink-0">
          <Users size={15} /> View families
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {instType && (
            <p className="text-xs text-slate-400">
              Defaults tuned for your institution type ({instType.replace(/_/g, ' ').toLowerCase()}).
            </p>
          )}

          <div className="space-y-3">
            {rules.map(rule => {
              const current = (config[rule.key] ?? 'off') as Action
              return (
                <div key={rule.key} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-800">{rule.label}</h3>
                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {rule.signals}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rule.description}</p>
                  </div>
                  {/* Segmented control */}
                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 shrink-0 self-start sm:self-auto">
                    {ACTIONS.map(a => (
                      <button
                        key={a.value}
                        onClick={() => setAction(rule.key, a.value)}
                        title={a.help}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                          current === a.value ? ACTION_STYLE[a.value] : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Save bar */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-400">
              {saved ? 'Saved.' : dirty ? 'Unsaved changes' : 'Block = stop the duplicate · Warn = allow with confirmation · Off = ignore'}
            </span>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 bg-[#1565D8] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
            >
              <Save size={15} strokeWidth={2} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
