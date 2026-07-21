'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, CalendarClock } from 'lucide-react'
import { AppSelect } from '@/components/ui/app-select'
import { ScheduleBuilder, type ScheduleValue, type ScheduleSeed } from './ScheduleBuilder'
import type { ProposedSlot } from '@/lib/schedule/layout'

// Quick "set schedule" for an already-enrolled student, opened from the student
// list. Reuses ScheduleBuilder; posts to /students/[id]/schedule which switches
// the student between a group class and an individual schedule.

type CourseLite = { id: string; name: string; hoursPerWeek?: number | null; totalHours?: number | null }
type SlotLite = { dayOfWeek: number; startTime: string; endTime: string; durationMin?: number | null }
type EnrollmentLite = { courseId: string; course?: CourseLite | null; scheduleSlots?: SlotLite[] }
type BatchLite = { id: string; name: string; course?: { name: string } | null }

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Concrete stored slots → the ProposedSlot shape the builder seeds from.
function toProposedSlots(slots: SlotLite[]): ProposedSlot[] {
  return slots.map(s => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    durationMin: s.durationMin ?? Math.max(1, toMin(s.endTime) - toMin(s.startTime))
  }))
}

export function StudentScheduleModal({
  studentId,
  studentName,
  onClose,
  onSaved
}: {
  studentId: string
  studentName: string
  onClose: () => void
  onSaved?: () => void
}) {
  const [enrollments, setEnrollments] = useState<EnrollmentLite[] | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [batches, setBatches] = useState<BatchLite[]>([])
  const [courseId, setCourseId] = useState('')
  const [schedule, setSchedule] = useState<ScheduleValue>({ mode: 'custom', batchId: '', slots: [] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Course_schedule-gated feed (NOT the fee-gated enrolments endpoint) so LC
    // orgs without billing still see the student's enrolled courses.
    fetch(`/api/v1/students/${studentId}/schedule`)
      .then(r => r.json())
      .then(j => {
        setEnrollments(j?.data?.enrollments ?? [])
        setBatchId(j?.data?.batchId ?? null)
      })
      .catch(() => setEnrollments([]))
    fetch('/api/v1/options/batches')
      .then(r => r.json())
      .then(j => setBatches(j?.data?.batches ?? []))
      .catch(() => {})
  }, [studentId])

  useEffect(() => {
    if (!courseId && enrollments && enrollments.length > 0) setCourseId(enrollments[0].courseId)
  }, [enrollments, courseId])

  const enrolledCourses: CourseLite[] = (enrollments ?? [])
    .map(e => e.course)
    .filter((c): c is CourseLite => !!c)
  const selectedCourse = enrolledCourses.find(c => c.id === courseId) ?? null

  // Open the builder on the selected course's existing schedule: its own custom
  // slots if any, else the student's group class, else the builder's defaults.
  const selectedEnrollment = (enrollments ?? []).find(e => e.courseId === courseId)
  const existingSlots = selectedEnrollment?.scheduleSlots ?? []
  const initialSchedule: ScheduleSeed | undefined = existingSlots.length > 0
    ? { mode: 'custom', slots: toProposedSlots(existingSlots) }
    : batchId
      ? { mode: 'batch', batchId }
      : undefined

  const save = async () => {
    setError(null)
    if (!courseId) return setError('Pick a course')
    let payload: Record<string, unknown>
    if (schedule.mode === 'batch') {
      if (!schedule.batchId) return setError('Pick a group class')
      payload = { mode: 'batch', courseId, batchId: schedule.batchId }
    } else if (schedule.mode === 'custom') {
      if (schedule.slots.length === 0) return setError('Add at least one weekly slot')
      payload = { mode: 'custom', courseId, slots: schedule.slots, startDate: new Date().toISOString().slice(0, 10) }
    } else {
      return setError('Choose Individual or Group class')
    }
    setSaving(true)
    const res = await fetch(`/api/v1/students/${studentId}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) return setError(json?.error || json?.message || 'Failed to save schedule')
    onSaved?.()
    onClose()
  }

  const loading = enrollments === null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#1565D8]" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Set schedule</h2>
              <p className="text-xs text-slate-500">{studentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This student isn&apos;t enrolled in any course yet. Enrol them first (Edit student →
              Course Enrolment), then set a schedule here.
            </div>
          ) : (
            <>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                  Course
                </label>
                <AppSelect
                  value={courseId}
                  onChange={e => setCourseId(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  {enrolledCourses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </AppSelect>
              </div>

              {/* Rebuild the builder per course so hours/defaults refresh */}
              <div className="grid grid-cols-1 gap-4">
                <ScheduleBuilder
                  key={courseId}
                  course={selectedCourse}
                  batches={batches}
                  initial={initialSchedule}
                  onChange={setSchedule}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 h-10 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || loading || enrolledCourses.length === 0}
            className="px-4 h-10 rounded-lg bg-[#1565D8] text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save schedule
          </button>
        </div>
      </div>
    </div>
  )
}
