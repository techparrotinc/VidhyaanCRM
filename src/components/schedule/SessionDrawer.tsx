'use client'

import { useEffect, useState } from 'react'
import { X, Link2, Send, CalendarClock, Ban, ClipboardCheck, AlertTriangle } from 'lucide-react'
import { DateTimePicker } from '@/components/ui/datetime-picker'
import { useConfirm } from '@/components/ui/confirm-dialog'
import type { ScheduleSession } from './types'

const DURATION_PRESETS = [30, 45, 60]

type TeacherOption = { id: string; name: string }

export function SessionDrawer({
  session,
  onClose,
  onChanged,
  classNoun
}: {
  session: ScheduleSession
  onClose: () => void
  onChanged: () => void
  classNoun: string
}) {
  const confirm = useConfirm()
  const [meetingLink, setMeetingLink] = useState(session.meetingLink ?? '')
  const [savingLink, setSavingLink] = useState(false)

  const [rescheduling, setRescheduling] = useState(false)
  const [newStartsAt, setNewStartsAt] = useState(session.startsAt)
  const [newDuration, setNewDuration] = useState(session.durationMin)
  const [newTeacherId, setNewTeacherId] = useState(session.teacher?.id ?? '')
  const [notifyGuardians, setNotifyGuardians] = useState(true)
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [clash, setClash] = useState<{ label: string | null; startsAt: string } | null>(null)
  const [rescheduleBusy, setRescheduleBusy] = useState(false)

  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelBusy, setCancelBusy] = useState(false)

  const [reminding, setReminding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session.canManage || !rescheduling) return
    fetch('/api/v1/users')
      .then(r => r.json())
      .then(json => setTeachers((json?.data ?? []).filter((u: any) => u.role === 'TEACHER')))
      .catch(() => setTeachers([]))
  }, [rescheduling, session.canManage])

  const saveMeetingLink = async () => {
    setSavingLink(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/schedule/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingLink: meetingLink.trim() || null })
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save meeting link')
      onChanged()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingLink(false)
    }
  }

  const submitReschedule = async () => {
    setRescheduleBusy(true)
    setError(null)
    setClash(null)
    try {
      const res = await fetch(`/api/v1/schedule/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startsAt: newStartsAt,
          durationMin: newDuration,
          teacherId: newTeacherId || null,
          notifyGuardians
        })
      })
      const json = await res.json()
      if (res.status === 409) {
        const conflicting = json?.details?.conflictingSession
        setClash({
          label: conflicting?.label ?? 'another session',
          startsAt: conflicting?.startsAt ?? ''
        })
        return
      }
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to reschedule')
      setRescheduling(false)
      onChanged()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRescheduleBusy(false)
    }
  }

  const submitCancel = async () => {
    if (!cancelReason.trim()) return
    const proceed = await confirm({
      title: 'Cancel session?',
      message: notifyGuardiansCancelMessage(cancelReason),
      confirmLabel: 'Cancel session',
      variant: 'danger'
    })
    if (!proceed) return
    setCancelBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/schedule/sessions/${session.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim(), notifyGuardians: true })
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to cancel session')
      onChanged()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCancelBusy(false)
    }
  }

  const sendReminder = async () => {
    setReminding(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/schedule/sessions/${session.id}/remind`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to send reminder')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setReminding(false)
    }
  }

  const canAct = session.status !== 'CANCELLED'

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 truncate">
              {session.course?.name || session.batch?.name || classNoun}
            </h2>
            <p className="text-sm font-normal leading-relaxed text-slate-500 mt-0.5">
              {new Date(session.startsAt).toLocaleString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
              })}{' '}
              · {session.durationMin} min
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Batch" value={session.batch?.name ?? '-'} />
            <Info label="Teacher" value={session.teacher?.name ?? 'Unassigned'} />
            <Info label="Enrolled" value={String(session.batch?.enrolledCount ?? 0)} />
            <Info
              label="Attendance"
              value={
                session.status === 'COMPLETED' && session.batch
                  ? `${session.markedCount ?? 0}/${session.batch.enrolledCount} marked`
                  : '-'
              }
            />
          </div>

          {session.status === 'CANCELLED' && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">Cancelled{session.cancelReason ? `: ${session.cancelReason}` : ''}</p>
            </div>
          )}

          {/* Meeting link */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Meeting Link</h3>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={meetingLink}
                  onChange={e => setMeetingLink(e.target.value)}
                  placeholder="https://meet..."
                  disabled={!canAct}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1565D8]/30 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
              <button
                onClick={saveMeetingLink}
                disabled={!canAct || savingLink || meetingLink === (session.meetingLink ?? '')}
                className="px-3 py-2 text-sm font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            </div>
          </section>

          {/* Actions */}
          {canAct && session.canManage && (
            <section className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Actions</h3>

              <button
                onClick={() => setRescheduling(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <CalendarClock className="h-4 w-4" />
                Reschedule
              </button>

              {rescheduling && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <DateTimePicker value={newStartsAt} onChange={setNewStartsAt} />
                  <div className="flex gap-2">
                    {DURATION_PRESETS.map(d => (
                      <button
                        key={d}
                        onClick={() => setNewDuration(d)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                          newDuration === d ? 'bg-[#1565D8] text-white border-[#1565D8]' : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {d} min
                      </button>
                    ))}
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={newDuration}
                      onChange={e => setNewDuration(Number(e.target.value))}
                      className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                  <select
                    value={newTeacherId}
                    onChange={e => setNewTeacherId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Unassigned</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={notifyGuardians}
                      onChange={e => setNotifyGuardians(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Notify guardians
                  </label>
                  {clash && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-amber-700">
                        Teacher is already booked for {clash.label}
                        {clash.startsAt ? ` at ${new Date(clash.startsAt).toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={submitReschedule}
                    disabled={rescheduleBusy}
                    className="w-full px-3 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {rescheduleBusy ? 'Saving…' : 'Confirm reschedule'}
                  </button>
                </div>
              )}

              <button
                onClick={() => setCancelling(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Ban className="h-4 w-4" />
                Cancel session
              </button>

              {cancelling && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                  <textarea
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder="Reason (shown to guardians)"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <button
                    onClick={submitCancel}
                    disabled={cancelBusy || !cancelReason.trim()}
                    className="w-full px-3 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {cancelBusy ? 'Cancelling…' : 'Confirm cancellation'}
                  </button>
                </div>
              )}
            </section>
          )}

          {canAct && (
            <section className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Guardians</h3>
              <button
                onClick={sendReminder}
                disabled={reminding}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
                {reminding ? 'Sending…' : 'Send reminder'}
              </button>

              {session.attendanceSessionId && (
                <a
                  href={`/attendance?sessionId=${session.attendanceSessionId}`}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-[#1565D8] border border-[#1565D8]/30 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Mark attendance
                </a>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function notifyGuardiansCancelMessage(reason: string): string {
  return `Guardians of enrolled students will be notified via WhatsApp.\n\nReason: "${reason}"`
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-normal text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
    </div>
  )
}
