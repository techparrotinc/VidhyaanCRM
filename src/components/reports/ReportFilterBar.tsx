'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { X, Bookmark, ChevronDown, Trash2 } from 'lucide-react'
import { DatePicker } from '@/components/ui/datetime-picker'
import { AppSelect } from '@/components/ui/app-select'

// Filter bar rendered from a report's registry config (via /reports/meta).
// State lives in URL query params — links are shareable by construction.

export type FilterConfig = {
  key: string
  label: string
  type: 'date-range' | 'enum' | 'entity' | 'number'
  options?: { value: string; label: string }[]
  optionsSource?: string
  multi?: boolean
}

export type SavedView = {
  id: string
  name: string
  filters: Record<string, string>
  isDefault: boolean
}

type Props = {
  reportKey: string
  configs: FilterConfig[]
  values: Record<string, string>
  onChange: (next: Record<string, string>) => void
}

function EntitySelect({
  config, value, onSelect
}: {
  config: FilterConfig
  value: string
  onSelect: (v: string) => void
}) {
  const { data } = useSWR<{ data: { value: string; label: string }[] }>(
    `/api/v1/reports/options?source=${config.optionsSource}`,
    fetcher,
    { revalidateOnFocus: false }
  )
  const options = data?.data ?? []
  // A selector with 0–1 choices is noise (e.g. branch filter on a
  // single-branch org). Hide it once loaded — but never hide a filter the
  // user has already applied.
  if (data && options.length <= 1 && !value) return null
  return (
    <AppSelect
      value={value}
      onChange={e => onSelect(e.target.value)}
      className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700"
    >
      <option value="">{config.label}: All</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </AppSelect>
  )
}

export function ReportFilterBar({ reportKey, configs, values, onChange }: Props) {
  const [views, setViews] = useState<SavedView[]>([])
  const [viewsOpen, setViewsOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/v1/reports/views?reportKey=${reportKey}`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => json && setViews(json.data))
      .catch(() => {})
  }, [reportKey])

  const set = (key: string, value: string) => {
    const next = { ...values }
    if (value === '') delete next[key]
    else next[key] = value
    onChange(next)
  }

  const activeCount = Object.keys(values).length

  const [newName, setNewName] = useState('')

  const saveView = async () => {
    const name = newName.trim()
    if (!name) return
    const res = await fetch('/api/v1/reports/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportKey, name, filters: values })
    })
    if (res.ok) {
      const json = await res.json()
      setViews(v => [json.data, ...v])
      setNewName('')
    }
  }

  const deleteView = async (id: string) => {
    await fetch(`/api/v1/reports/views/${id}`, { method: 'DELETE' })
    setViews(v => v.filter(x => x.id !== id))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {configs.map(config => {
        if (config.type === 'date-range') {
          return (
            <div key={config.key} className="flex items-center gap-1.5">
              <div className="w-40">
                <DatePicker value={values.from ?? ''} onChange={(ymd) => set('from', ymd)} placeholder="From" />
              </div>
              <span className="text-xs text-slate-400">to</span>
              <div className="w-40">
                <DatePicker value={values.to ?? ''} onChange={(ymd) => set('to', ymd)} placeholder="To" />
              </div>
            </div>
          )
        }
        if (config.type === 'enum') {
          return (
            <AppSelect
              key={config.key}
              value={values[config.key] ?? ''}
              onChange={e => set(config.key, e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700"
            >
              <option value="">{config.label}: All</option>
              {(config.options ?? []).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </AppSelect>
          )
        }
        if (config.type === 'entity') {
          return (
            <EntitySelect
              key={config.key}
              config={config}
              value={values[config.key] ?? ''}
              onSelect={v => set(config.key, v)}
            />
          )
        }
        return (
          <input
            key={config.key}
            type="number"
            placeholder={config.label}
            value={values[config.key] ?? ''}
            onChange={e => set(config.key, e.target.value)}
            className="h-9 w-36 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700"
          />
        )
      })}

      {activeCount > 0 && (
        <button
          onClick={() => onChange({})}
          className="inline-flex items-center gap-1 h-9 px-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          <X className="h-3.5 w-3.5" /> Reset
        </button>
      )}

      <div className="relative ml-auto">
        <button
          onClick={() => setViewsOpen(o => !o)}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-slate-300"
        >
          <Bookmark className="h-3.5 w-3.5" />
          Saved views
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {viewsOpen && (
          <div className="absolute right-0 top-10 z-20 w-64 rounded-xl border border-slate-200 bg-white shadow-lg p-2">
            {views.length === 0 && (
              <p className="px-2 py-3 text-xs text-slate-400">No saved views yet</p>
            )}
            {views.map(v => (
              <div key={v.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50">
                <button
                  onClick={() => { onChange(v.filters); setViewsOpen(false) }}
                  className="text-sm font-medium text-slate-700 truncate text-left flex-1"
                >
                  {v.name}
                </button>
                <button
                  onClick={() => deleteView(v.id)}
                  className="p-1 text-slate-300 hover:text-red-500"
                  aria-label={`Delete view ${v.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-2 px-1 flex items-center gap-1.5">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveView()}
                placeholder="Name current filters…"
                className="flex-1 h-8 rounded-lg border border-slate-200 px-2 text-sm"
              />
              <button
                onClick={saveView}
                disabled={!newName.trim()}
                className="h-8 px-2.5 rounded-lg text-sm font-semibold text-[#1565D8] hover:bg-blue-50 disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
