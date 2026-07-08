'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, Search, Clock, LayoutDashboard } from 'lucide-react'

type ReportMeta = {
  key: string
  title: string
  decision: string
  category: string
  exports: string[]
}

const CATEGORY_LABELS: Record<string, string> = {
  admissions: 'Admissions',
  finance: 'Fees & Finance',
  team: 'Team',
  students: 'Students',
  courses: 'Courses & Batches',
  campaigns: 'Campaigns'
}
const CATEGORY_ORDER = ['admissions', 'finance', 'team', 'students', 'courses', 'campaigns']

export default function ReportLibrary() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const { data: metaData, isLoading } = useSWR<{ data: ReportMeta[] }>(
    '/api/v1/reports/meta', fetcher, { revalidateOnFocus: false }
  )
  const { data: usageData, mutate: mutateUsage } = useSWR<{
    data: { favourites: string[]; recent: { reportKey: string; lastViewedAt: string }[] }
  }>('/api/v1/reports/usage', fetcher, { revalidateOnFocus: false })

  const reports = useMemo(() => metaData?.data ?? [], [metaData])
  const favourites = new Set(usageData?.data.favourites ?? [])
  const recent = usageData?.data.recent ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return reports
    return reports.filter(
      r => r.title.toLowerCase().includes(q) || r.decision.toLowerCase().includes(q)
    )
  }, [reports, search])

  const byCategory = useMemo(() => {
    const m = new Map<string, ReportMeta[]>()
    for (const r of filtered) {
      m.set(r.category, [...(m.get(r.category) ?? []), r])
    }
    return m
  }, [filtered])

  const visibleCategories = CATEGORY_ORDER.filter(
    c => byCategory.has(c) && (tab === 'all' || tab === c)
  )

  const toggleFavourite = async (key: string, current: boolean) => {
    await fetch(`/api/v1/reports/usage/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favourite: !current })
    }).catch(() => {})
    mutateUsage()
  }

  const card = (r: ReportMeta) => (
    <div
      key={r.key}
      className="relative bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-slate-300 transition-colors"
    >
      <button
        onClick={() => toggleFavourite(r.key, favourites.has(r.key))}
        className={`absolute top-4 right-4 p-1 ${favourites.has(r.key) ? 'text-amber-500' : 'text-slate-200 hover:text-slate-400'}`}
        aria-label={favourites.has(r.key) ? 'Unfavourite' : 'Favourite'}
      >
        <Star className="h-4 w-4" fill={favourites.has(r.key) ? 'currentColor' : 'none'} />
      </button>
      <Link href={`/reports/r/${r.key}`} className="block">
        <h3 className="text-sm font-semibold text-slate-900 pr-8">{r.title}</h3>
        <p className="mt-1.5 text-sm font-normal leading-relaxed text-slate-500">{r.decision}</p>
        <p className="mt-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {r.exports.map(e => e.toUpperCase()).join(' · ')}
        </p>
      </Link>
    </div>
  )

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Report Library</h1>
          <p className="text-sm font-normal leading-relaxed text-slate-500">
            Every report answers one business question
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-slate-300"
          >
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboards
          </Link>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search reports…"
              className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200 -mb-4">
        {['all', ...CATEGORY_ORDER.filter(c => byCategory.has(c))].map(c => (
          <button
            key={c}
            onClick={() => setTab(c)}
            className={`px-3.5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === c
                ? 'border-[#1565D8] text-[#1565D8]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {c === 'all' ? 'All Reports' : CATEGORY_LABELS[c] ?? c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {recent.length > 0 && !search && tab === 'all' && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                Recently Viewed
              </h2>
              <div className="flex flex-wrap gap-2">
                {recent.map(r => {
                  const report = reports.find(x => x.key === r.reportKey)
                  if (!report) return null
                  return (
                    <Link
                      key={r.reportKey}
                      href={`/reports/r/${r.reportKey}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300"
                    >
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {report.title}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {favourites.size > 0 && !search && tab === 'all' && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                Favourites
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.filter(r => favourites.has(r.key)).map(card)}
              </div>
            </div>
          )}

          {visibleCategories.map(category => (
            <div key={category}>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {byCategory.get(category)!.map(card)}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <p className="text-sm text-slate-500">No reports match “{search}”</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
