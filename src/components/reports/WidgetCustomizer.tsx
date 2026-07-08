'use client'

import { useEffect, useState } from 'react'
import { SlidersHorizontal, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'

// Per-user dashboard widget preferences (order + visibility), persisted in
// localStorage — cheap, per-device, no schema. Server-side prefs if users
// ask for cross-device sync.

export type WidgetDef = { key: string; label: string }

export function useWidgetPrefs(storageKey: string, defs: WidgetDef[]) {
  const defaultOrder = defs.map(d => d.key)
  const [order, setOrder] = useState<string[]>(defaultOrder)
  const [hidden, setHidden] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const saved = JSON.parse(raw) as { order?: string[]; hidden?: string[] }
        // Keep unknown keys out, append widgets added since the pref was saved.
        const valid = (saved.order ?? []).filter(k => defaultOrder.includes(k))
        setOrder([...valid, ...defaultOrder.filter(k => !valid.includes(k))])
        setHidden((saved.hidden ?? []).filter(k => defaultOrder.includes(k)))
      }
    } catch { /* corrupted pref — fall back to defaults */ }
    setLoaded(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const persist = (nextOrder: string[], nextHidden: string[]) => {
    setOrder(nextOrder)
    setHidden(nextHidden)
    try {
      localStorage.setItem(storageKey, JSON.stringify({ order: nextOrder, hidden: nextHidden }))
    } catch { /* storage full/blocked — prefs just won't stick */ }
  }

  return { order, hidden, persist, loaded }
}

export function WidgetCustomizer({
  defs, order, hidden, onChange
}: {
  defs: WidgetDef[]
  order: string[]
  hidden: string[]
  onChange: (order: string[], hidden: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const labelFor = (key: string) => defs.find(d => d.key === key)?.label ?? key

  const move = (key: string, dir: -1 | 1) => {
    const i = order.indexOf(key)
    const j = i + dir
    if (j < 0 || j >= order.length) return
    const next = [...order]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next, hidden)
  }

  const toggle = (key: string) => {
    onChange(
      order,
      hidden.includes(key) ? hidden.filter(k => k !== key) : [...hidden, key]
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-slate-300"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Customize
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-20 w-72 rounded-xl border border-slate-200 bg-white shadow-lg p-2">
          <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Widgets
          </p>
          {order.map(key => (
            <div key={key} className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-slate-50">
              <button
                onClick={() => toggle(key)}
                className={`p-1 ${hidden.includes(key) ? 'text-slate-300' : 'text-[#1565D8]'}`}
                aria-label={hidden.includes(key) ? `Show ${labelFor(key)}` : `Hide ${labelFor(key)}`}
              >
                {hidden.includes(key) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <span className={`flex-1 text-sm font-medium truncate ${hidden.includes(key) ? 'text-slate-400' : 'text-slate-700'}`}>
                {labelFor(key)}
              </span>
              <button onClick={() => move(key, -1)} className="p-1 text-slate-400 hover:text-slate-700" aria-label="Move up">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button onClick={() => move(key, 1)} className="p-1 text-slate-400 hover:text-slate-700" aria-label="Move down">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
