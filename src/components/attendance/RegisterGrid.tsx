"use client"

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { CheckCheck, Loader2, Search, Undo2 } from 'lucide-react'
import { STATUS_META, type AttendanceStatusValue } from './StatusBadge'

export type RosterStudent = {
  id: string
  name: string
  studentCode: string
  rollNumber: string | null
  section: string | null
}

export type ExistingMark = {
  studentId: string
  status: AttendanceStatusValue
  note: string | null
  source: string
  updatedAt: string
  markedBy: { name: string } | null
}

const PICKABLE: AttendanceStatusValue[] = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE']

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

export function RegisterGrid({
  roster,
  marks,
  disabled,
  isPastDay,
  onSave,
  saving
}: {
  roster: RosterStudent[]
  marks: ExistingMark[]
  disabled?: boolean
  /** Editing history: confirm before overwriting an already-marked past day. */
  isPastDay?: boolean
  onSave: (entries: { studentId: string; status: AttendanceStatusValue; note?: string }[]) => Promise<void>
  saving: boolean
}) {
  const confirm = useConfirm()
  const markByStudent = useMemo(() => new Map(marks.map(m => [m.studentId, m])), [marks])
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatusValue>>({})
  const [search, setSearch] = useState('')

  const savedStatuses = useMemo(() => {
    const initial: Record<string, AttendanceStatusValue> = {}
    for (const m of marks) initial[m.studentId] = m.status
    return initial
  }, [marks])

  useEffect(() => {
    setStatuses(savedStatuses)
    setSearch('')
  }, [savedStatuses, roster])

  const changedCount = roster.filter(s => statuses[s.id] && statuses[s.id] !== savedStatuses[s.id]).length
  const dirty = changedCount > 0

  const setStatus = (studentId: string, status: AttendanceStatusValue) => {
    setStatuses(prev => {
      // Tapping the active pill again clears an unsaved pick
      if (prev[studentId] === status && !savedStatuses[studentId]) {
        const next = { ...prev }
        delete next[studentId]
        return next
      }
      return { ...prev, [studentId]: status }
    })
  }

  const markAllPresent = () => {
    const next: Record<string, AttendanceStatusValue> = {}
    for (const s of roster) next[s.id] = statuses[s.id] ?? 'PRESENT'
    setStatuses(next)
  }

  const resetChanges = () => setStatuses(savedStatuses)

  const tally = useMemo(() => {
    const t = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, LEAVE: 0, unmarked: 0 }
    for (const s of roster) {
      const st = statuses[s.id]
      if (st && st !== 'HOLIDAY') t[st as keyof typeof t]++
      else if (!st) t.unmarked++
    }
    return t
  }, [roster, statuses])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roster
    return roster.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        (s.rollNumber ?? '').toLowerCase().includes(q)
    )
  }, [roster, search])

  const handleSave = async () => {
    if (isPastDay && marks.length > 0) {
      const okToOverwrite = await confirm({
        title: 'Overwrite past attendance?',
        message: 'This day already has marks. Saving will overwrite them and record you as the editor.',
        confirmLabel: 'Overwrite'
      })
      if (!okToOverwrite) return
    }
    await onSave(
      roster.filter(s => statuses[s.id]).map(s => ({ studentId: s.id, status: statuses[s.id] }))
    )
  }

  if (roster.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-normal leading-relaxed text-slate-500">
          No active students found for this selection.
        </p>
      </div>
    )
  }

  const markedCount = roster.length - tally.unmarked

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Toolbar: tallies + search + bulk action */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {PICKABLE.map(s => (
            <span
              key={s}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_META[s].badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s].cell}`} />
              {STATUS_META[s].label} {tally[s as keyof typeof tally]}
            </span>
          ))}
          {tally.unmarked > 0 && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              Unmarked {tally.unmarked}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {roster.length > 8 && (
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, roll no…"
                className="h-9 w-44 sm:w-56 rounded-lg border border-slate-200 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30"
              />
            </div>
          )}
          <Button variant="outline" size="sm" onClick={markAllPresent} disabled={disabled || saving}>
            <CheckCheck className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Mark all present</span>
            <span className="sm:hidden">All present</span>
          </Button>
        </div>
      </div>

      {/* Column header (desktop) */}
      <div className="hidden md:grid grid-cols-[3rem_1fr_15rem] items-center px-6 py-2 bg-slate-50/80 border-b border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Roll</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Student</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Status</span>
      </div>

      {/* Roster */}
      <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-6 py-8 text-sm text-slate-500 text-center">No students match “{search}”.</p>
        )}
        {filtered.map((student, idx) => {
          const current = statuses[student.id]
          const existing = markByStudent.get(student.id)
          const changed = current && current !== savedStatuses[student.id]
          return (
            <div
              key={student.id}
              className={`px-4 sm:px-6 py-2.5 grid grid-cols-1 md:grid-cols-[3rem_1fr_15rem] items-center gap-2 md:gap-4 transition-colors ${
                changed ? 'bg-blue-50/40' : idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
              }`}
            >
              <span className="hidden md:block text-sm font-medium text-slate-400 tabular-nums">
                {student.rollNumber ?? '—'}
              </span>

              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    current ? `${STATUS_META[current].cell} text-white` : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {initials(student.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    <span className="md:hidden text-slate-400 mr-1.5">{student.rollNumber ? `${student.rollNumber}.` : ''}</span>
                    {student.name}
                  </p>
                  <p className="text-xs font-normal text-slate-400 truncate">
                    {student.studentCode}
                    {existing && (
                      <>
                        {' · '}
                        {existing.markedBy?.name ?? existing.source.toLowerCase()},{' '}
                        {new Date(existing.updatedAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
                        })}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex md:justify-center">
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white">
                  {PICKABLE.map(status => {
                    const meta = STATUS_META[status]
                    const active = current === status
                    return (
                      <button
                        key={status}
                        type="button"
                        title={meta.label}
                        disabled={disabled || saving}
                        onClick={() => setStatus(student.id, status)}
                        className={`h-8 w-11 sm:w-12 rounded-md text-xs font-bold transition-colors disabled:opacity-50 ${
                          active
                            ? `${meta.cell} text-white shadow-sm`
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {meta.short}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 px-4 sm:px-6 py-3 bg-white/95 backdrop-blur border-t border-slate-200 flex items-center justify-between gap-3">
        <p className="text-sm font-normal text-slate-500">
          <span className="font-semibold text-slate-900">{markedCount}</span>/{roster.length} marked
          {dirty && (
            <span className="ml-2 text-[#1565D8] font-medium">
              {changedCount} unsaved change{changedCount === 1 ? '' : 's'}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button variant="ghost" size="sm" onClick={resetChanges} disabled={saving}>
              <Undo2 className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={disabled || saving || !dirty || markedCount === 0}
            className="bg-[#1565D8] hover:bg-[#0f56be] text-sm font-semibold"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save attendance
          </Button>
        </div>
      </div>
    </div>
  )
}
