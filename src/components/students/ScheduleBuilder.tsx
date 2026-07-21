'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Users, Sparkles } from 'lucide-react'
import { AppSelect } from '@/components/ui/app-select'
import { proposeSlots, sessionsPerWeekFromHours, type ProposedSlot } from '@/lib/schedule/layout'

// LC schedule picker for the student-enrol flow. A student either JOINS A BATCH
// (inherits the cohort's shared sessions) or gets a CUSTOM per-student weekly
// schedule (own individual sessions) — never both. Emits the resolved choice via
// onChange; the proposed custom slots are computed with the shared layout lib so
// the preview here matches exactly what the API will materialize.

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] // index+1 = ISO day
const DURATION_PRESETS = [30, 45, 60, 90]

export type ScheduleMode = 'none' | 'batch' | 'custom'

export type ScheduleValue = {
  mode: ScheduleMode
  batchId: string
  slots: ProposedSlot[]
}

type BatchOption = { id: string; name: string; course?: { name: string } | null }
type CourseLite = { hoursPerWeek?: number | null; totalHours?: number | null } | null

// Existing schedule to open the builder on (edit path). Custom slots reconstruct
// the cadence controls; a batchId opens in group-class mode. The builder only
// represents a single start-time + duration across days, so heterogeneous slot
// times collapse to the first slot's time — matching what save can persist.
export type ScheduleSeed = {
  mode: ScheduleMode
  batchId?: string
  slots?: ProposedSlot[]
}

function deriveInitial(seed?: ScheduleSeed) {
  const slots = seed?.slots ?? []
  if (seed?.mode === 'custom' && slots.length > 0) {
    const days = [...new Set(slots.map(s => s.dayOfWeek))].sort((a, b) => a - b)
    return {
      mode: 'custom' as ScheduleMode,
      batchId: '',
      durationMin: slots[0].durationMin || 30,
      startTime: slots[0].startTime || '18:30',
      days,
      perWeek: slots.length,
      hasSlots: true
    }
  }
  return {
    mode: seed?.mode ?? 'custom',
    batchId: seed?.batchId ?? '',
    durationMin: 30,
    startTime: '18:30',
    days: [1, 3], // Mon, Wed
    perWeek: 2,
    hasSlots: false
  }
}

export function ScheduleBuilder({
  course,
  batches,
  disabled,
  initial,
  onChange
}: {
  course: CourseLite
  batches: BatchOption[]
  disabled?: boolean
  initial?: ScheduleSeed
  onChange: (value: ScheduleValue) => void
}) {
  // Seed from an existing schedule when editing; else default to the individual
  // per-student path (the primary LC flow). Component is keyed by course upstream
  // so this evaluates once per open.
  const seed = deriveInitial(initial)
  const [mode, setMode] = useState<ScheduleMode>(seed.mode)
  const [batchId, setBatchId] = useState(seed.batchId)

  const [durationMin, setDurationMin] = useState(seed.durationMin)
  const [startTime, setStartTime] = useState(seed.startTime)
  const [days, setDays] = useState<number[]>(seed.days)
  // Sessions/week defaults from the course weekly hours when known
  // ("30 min twice a week" = 1h/week ÷ 30m = 2), else 2.
  const derivedPerWeek = course?.hoursPerWeek
    ? sessionsPerWeekFromHours(course.hoursPerWeek, durationMin)
    : 0
  const [perWeek, setPerWeek] = useState(seed.perWeek)
  useEffect(() => {
    // Never override a schedule we opened for editing — respect its slot count.
    if (!seed.hasSlots && derivedPerWeek > 0) setPerWeek(derivedPerWeek)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedPerWeek])

  const slots = useMemo<ProposedSlot[]>(() => {
    if (mode !== 'custom') return []
    return proposeSlots({ sessionsPerWeek: perWeek, durationMin, startTime, preferredDays: days })
  }, [mode, perWeek, durationMin, startTime, days])

  useEffect(() => {
    onChange({ mode, batchId: mode === 'batch' ? batchId : '', slots })
    // onChange identity is caller-stable in practice; slots covers custom deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, batchId, slots])

  const toggleDay = (iso: number) =>
    setDays(prev => (prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso].sort((a, b) => a - b)))

  const totalWeeklyMin = slots.reduce((s, x) => s + x.durationMin, 0)
  const capHours = course?.totalHours ?? null

  return (
    <div className="sm:col-span-2 space-y-3">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block">
        Schedule
      </label>

      {/* Mode toggle — individual schedule is the default LC path */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { key: 'custom', label: 'Individual', icon: CalendarClock },
          { key: 'batch', label: 'Group class', icon: Users },
          { key: 'none', label: 'Set later', icon: null }
        ] as const).map(opt => {
          const Icon = opt.icon
          const active = mode === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              disabled={disabled}
              onClick={() => setMode(opt.key)}
              className={`flex items-center justify-center gap-1.5 h-10 rounded-lg border text-sm font-medium transition ${
                active
                  ? 'border-[#1565D8] bg-blue-50 text-[#1565D8]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Batch pick */}
      {mode === 'batch' && (
        <AppSelect
          value={batchId}
          onChange={e => setBatchId(e.target.value)}
          className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] transition"
        >
          <option value="">Select a group class…</option>
          {batches.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.course ? ` (${b.course.name})` : ''}
            </option>
          ))}
        </AppSelect>
      )}

      {/* Custom builder */}
      {mode === 'custom' && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Session length
              </label>
              <AppSelect
                value={String(durationMin)}
                onChange={e => setDurationMin(Number(e.target.value))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
              >
                {DURATION_PRESETS.map(d => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </AppSelect>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Sessions / week
              </label>
              <input
                type="number"
                min={1}
                max={7}
                value={perWeek}
                onChange={e => setPerWeek(Math.max(1, Math.min(7, Number(e.target.value) || 1)))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Start time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1.5">
              Preferred days
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DAY_LABELS.map((label, i) => {
                const iso = i + 1
                const on = days.includes(iso)
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => toggleDay(iso)}
                    className={`px-3 h-9 rounded-md text-sm font-medium border transition ${
                      on
                        ? 'border-[#1565D8] bg-[#1565D8] text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Live preview */}
          {slots.length > 0 && (
            <div className="rounded-md border border-blue-100 bg-blue-50/70 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#1565D8] mb-1.5">
                <Sparkles className="w-3.5 h-3.5" /> {slots.length} sessions / week
              </p>
              <div className="flex flex-wrap gap-1.5">
                {slots.map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-md bg-white border border-blue-100 px-2 py-1 text-xs font-medium text-slate-700"
                  >
                    {DAY_LABELS[s.dayOfWeek - 1]} {s.startTime}–{s.endTime}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {(totalWeeklyMin / 60).toFixed(totalWeeklyMin % 60 === 0 ? 0 : 1)} hrs/week.
                {capHours
                  ? ` Sessions generate until the ${capHours}-hour package is complete.`
                  : ' Sessions generate two weeks ahead and roll forward daily.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
