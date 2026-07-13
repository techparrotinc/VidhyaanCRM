'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { CalendarPlus, Clock, Loader2, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AttendanceCalendar, type CalendarRecord, type CalendarStats } from '@/components/attendance/AttendanceCalendar'

type LeaveRequest = {
  id: string
  fromDate: string
  toDate: string
  reason: string
  status: string
  reviewNote: string | null
  createdAt: string
  student: { id: string; name: string }
}

const LEAVE_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  REJECTED: 'bg-red-50 text-red-600 border-red-100',
  CANCELLED: 'bg-slate-50 text-slate-400 border-slate-200'
}

const fmtD = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

type Kid = {
  id: string
  name: string
  gradeLabel: string | null
  section: string | null
  organization: { name: string }
}

const currentMonth = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()).slice(0, 7)

export default function ParentAttendancePage() {
  const { data: kidsData, isLoading: kidsLoading } = useSWR('/api/v1/parent/attendance', fetcher)
  const kids: Kid[] = useMemo(() => kidsData?.data?.students ?? [], [kidsData])

  const [studentId, setStudentId] = useState('')
  const [month, setMonth] = useState(currentMonth())

  useEffect(() => {
    if (!studentId && kids.length > 0) setStudentId(kids[0].id)
  }, [kids, studentId])

  const { data: monthData, isLoading: monthLoading } = useSWR(
    studentId ? `/api/v1/parent/attendance?studentId=${studentId}&month=${month}` : null,
    fetcher
  )
  const records: CalendarRecord[] = monthData?.data?.records ?? []
  const stats: CalendarStats | null = monthData?.data?.stats ?? null

  // Leave requests
  const leaveRes = useSWR<{ data: { requests: LeaveRequest[] } }>('/api/v1/parent/leave-requests', fetcher)
  const leaveRequests = leaveRes.data?.data?.requests ?? []
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ studentId: '', fromDate: '', toDate: '', reason: '' })
  const [leaveSaving, setLeaveSaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)

  const openLeave = () => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
    setLeaveForm({ studentId: studentId || kids[0]?.id || '', fromDate: today, toDate: today, reason: '' })
    setLeaveError(null)
    setLeaveOpen(true)
  }

  const submitLeave = async () => {
    if (leaveForm.reason.trim().length < 3) {
      setLeaveError('Please give a short reason')
      return
    }
    setLeaveSaving(true)
    setLeaveError(null)
    try {
      const res = await fetch('/api/v1/parent/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveForm)
      })
      const json = await res.json()
      if (!res.ok) {
        setLeaveError(json.error || 'Failed to submit')
        return
      }
      setLeaveOpen(false)
      leaveRes.mutate()
    } finally {
      setLeaveSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-slate-900">Attendance</h1>
          <p className="text-sm font-semibold text-slate-400 mt-0.5">
            Your child&apos;s attendance as recorded by the school
          </p>
        </div>
        {kids.length > 0 && (
          <button
            onClick={openLeave}
            className="shrink-0 flex items-center gap-1.5 bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-black rounded-2xl px-4 py-2.5 transition shadow-md shadow-blue-200/60 cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" /> Request leave
          </button>
        )}
      </div>

      {kidsLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : kids.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm font-normal leading-relaxed text-slate-500">
          No linked students yet. Once your school links your child to your account, their attendance appears here.
        </div>
      ) : (
        <>
          {kids.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {kids.map(kid => (
                <button
                  key={kid.id}
                  type="button"
                  onClick={() => setStudentId(kid.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    studentId === kid.id
                      ? 'bg-[#1565D8] text-white border-transparent'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {kid.name}
                </button>
              ))}
            </div>
          )}

          {studentId && (
            <>
              <p className="text-xs font-normal text-slate-400">
                {(() => {
                  const kid = kids.find(k => k.id === studentId)
                  if (!kid) return null
                  return `${kid.organization.name}${kid.gradeLabel ? ` · ${kid.gradeLabel}` : ''}${kid.section ? ` · ${kid.section}` : ''}`
                })()}
              </p>
              {monthLoading && records.length === 0 ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <AttendanceCalendar
                  month={month}
                  records={records}
                  stats={stats}
                  onMonthChange={setMonth}
                  loading={monthLoading}
                />
              )}
            </>
          )}

          {/* Leave requests */}
          {leaveRequests.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-black text-slate-900">Leave requests</h2>
              <div className="bg-white border border-slate-100 rounded-3xl divide-y divide-slate-50 shadow-sm overflow-hidden">
                {leaveRequests.map((lr) => (
                  <div key={lr.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                        <Clock className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800">
                          {fmtD(lr.fromDate)}{lr.fromDate !== lr.toDate ? ` – ${fmtD(lr.toDate)}` : ''}
                          <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-slate-400">{lr.student.name}</span>
                        </p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{lr.reason}</p>
                        {lr.reviewNote && (
                          <p className="text-[11px] font-semibold text-slate-500 mt-1 bg-slate-50 rounded-lg px-2 py-1 inline-block">
                            School: {lr.reviewNote}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider rounded-full border px-2.5 py-1 ${LEAVE_BADGE[lr.status] ?? LEAVE_BADGE.PENDING}`}>
                      {lr.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Leave request dialog */}
      {leaveOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-fade-in border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-base font-black text-slate-900">Request leave</h3>
              <button onClick={() => setLeaveOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {kids.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Child</label>
                  <select
                    value={leaveForm.studentId}
                    onChange={(e) => setLeaveForm({ ...leaveForm, studentId: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-medium"
                  >
                    {kids.map((k) => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">From</label>
                  <input
                    type="date"
                    value={leaveForm.fromDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value, toDate: e.target.value > leaveForm.toDate ? e.target.value : leaveForm.toDate })}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">To</label>
                  <input
                    type="date"
                    value={leaveForm.toDate}
                    min={leaveForm.fromDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Reason</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="e.g. Fever — doctor advised rest"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none"
                />
              </div>
              {leaveError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{leaveError}</p>
              )}
              <button
                onClick={submitLeave}
                disabled={leaveSaving}
                className="w-full flex items-center justify-center gap-2 bg-[#1565D8] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-black rounded-2xl py-3 transition cursor-pointer"
              >
                {leaveSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit request
              </button>
              <p className="text-[10px] text-slate-400 font-medium text-center">
                The school will review and approve or decline your request.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
