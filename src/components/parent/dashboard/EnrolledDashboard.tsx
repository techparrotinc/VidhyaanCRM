'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Clock,
  GraduationCap,
  Info,
  Receipt,
  Sparkles
} from 'lucide-react'

export interface Ward {
  id: string
  name: string
  gradeLabel: string | null
  section: string | null
  orgId: string
  orgName: string
  batchName: string | null
}

export interface ScheduleItem {
  type: 'CLASS' | 'BATCH' | 'EVENT' | 'FEE_DUE'
  date: string
  startTime: string | null
  endTime: string | null
  title: string
  subtitle: string | null
  studentId: string | null
  studentName: string | null
  orgName: string | null
  href: string | null
}

export interface Reminder {
  type: string
  severity: 'INFO' | 'WARN' | 'URGENT'
  title: string
  detail: string | null
  href: string
}

export interface EnrolledData {
  wards: Ward[]
  organizations: { orgId: string; name: string; wardCount: number }[]
  scheduleToday: ScheduleItem[]
  scheduleWeek: ScheduleItem[]
  currentClasses: { studentId: string; slot: ScheduleItem | null }[]
  attendance: {
    studentId: string
    studentName: string
    workingDays: number
    present: number
    absent: number
    percentage: number | null
  }[]
  fees: {
    dueCount: number
    totalBalance: number
    nextDue: { invoiceNumber: string; dueDate: string | null; studentName: string; balance: number } | null
  }
  reminders: Reminder[]
  notifications: {
    unreadCount: number
    items: { id: string; title: string; body: string | null; readAt: string | null; createdAt: string }[]
  }
}

const WARD_GRADIENTS = [
  'from-[#1565D8] via-[#1E88E5] to-[#5E35B1]',
  'from-violet-500 via-purple-500 to-fuchsia-600',
  'from-teal-500 via-emerald-500 to-green-600',
  'from-orange-500 via-amber-500 to-rose-500'
]

const SEVERITY_DOT: Record<Reminder['severity'], string> = {
  URGENT: 'bg-red-500',
  WARN: 'bg-amber-400',
  INFO: 'bg-blue-400'
}

const SEVERITY_ICON: Record<Reminder['severity'], React.ElementType> = {
  URGENT: AlertTriangle,
  WARN: Clock,
  INFO: Info
}

const TIMELINE_STYLE: Record<ScheduleItem['type'], { bg: string; text: string; icon: React.ElementType }> = {
  CLASS: { bg: 'bg-blue-50 border-blue-100', text: 'text-[#1565D8]', icon: GraduationCap },
  BATCH: { bg: 'bg-violet-50 border-violet-100', text: 'text-violet-600', icon: GraduationCap },
  EVENT: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600', icon: CalendarDays },
  FEE_DUE: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-600', icon: Receipt }
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m`
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h`
  return `${Math.floor(mins / (24 * 60))}d`
}

export default function EnrolledDashboard({ data, parentName }: { data: EnrolledData; parentName: string }) {
  const [activeWardId, setActiveWardId] = useState<string | 'ALL'>('ALL')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = parentName.split(' ')[0]

  const urgentReminder = data.reminders.find((r) => r.severity === 'URGENT') ?? null
  const otherReminders = data.reminders.filter((r) => r !== urgentReminder)

  const todayItems = useMemo(
    () =>
      data.scheduleToday.filter(
        (i) => activeWardId === 'ALL' || i.studentId === null || i.studentId === activeWardId
      ),
    [data.scheduleToday, activeWardId]
  )

  const currentClassFor = (wardId: string) =>
    data.currentClasses.find((c) => c.studentId === wardId)?.slot ?? null
  const attendanceFor = (wardId: string) => data.attendance.find((a) => a.studentId === wardId)

  const avgAttendance = useMemo(() => {
    const vals = data.attendance.map((a) => a.percentage).filter((p): p is number => p !== null)
    if (vals.length === 0) return null
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
  }, [data.attendance])

  const eventsThisWeek = data.scheduleWeek.filter((i) => i.type === 'EVENT')

  return (
    <div className="space-y-7 -mt-2">
      {/* ===== GREETING ===== */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-[26px] font-black tracking-tight text-slate-900 mt-0.5">
            {greeting}, {firstName} <span className="align-middle">👋</span>
          </h1>
        </div>
        <Link
          href="/parent/notifications"
          className="relative w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#1565D8] hover:border-blue-200 transition shadow-sm md:hidden"
        >
          <Bell className="w-5 h-5" />
          {data.notifications.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-slate-50">
              {data.notifications.unreadCount > 9 ? '9+' : data.notifications.unreadCount}
            </span>
          )}
        </Link>
      </div>

      {/* ===== URGENT ALERT ===== */}
      {urgentReminder && (
        <Link
          href={urgentReminder.href}
          className="flex items-center gap-3.5 rounded-3xl bg-gradient-to-r from-red-500 to-rose-500 text-white p-4 pl-5 shadow-lg shadow-red-200/60 hover:shadow-red-300/60 transition active:scale-[0.99]"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight">{urgentReminder.title}</p>
            {urgentReminder.detail && (
              <p className="text-xs text-white/80 font-medium mt-0.5 truncate">{urgentReminder.detail}</p>
            )}
          </div>
          <span className="shrink-0 bg-white text-red-600 text-xs font-black rounded-xl px-4 py-2">
            Pay now
          </span>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* ================= LEFT (main) ================= */}
        <div className="lg:col-span-2 space-y-7">
          {/* ===== WARD CARDS (horizontal scroll) ===== */}
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none snap-x">
            {data.wards.map((w, idx) => {
              const current = currentClassFor(w.id)
              const att = attendanceFor(w.id)
              return (
                <div
                  key={w.id}
                  className={`relative w-[260px] shrink-0 snap-start rounded-3xl bg-gradient-to-br ${
                    WARD_GRADIENTS[idx % WARD_GRADIENTS.length]
                  } text-white p-5 shadow-lg shadow-blue-200/40 overflow-hidden`}
                >
                  <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
                  <div className="absolute -bottom-10 -right-2 w-24 h-24 rounded-full bg-white/5" />

                  <div className="flex items-center gap-3 relative">
                    <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-black text-sm border border-white/20">
                      {w.name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-black leading-tight truncate">{w.name}</p>
                      <p className="text-[11px] font-semibold text-white/75 truncate">
                        {[w.gradeLabel, w.section ? `Sec ${w.section}` : null, w.batchName]
                          .filter(Boolean)
                          .join(' · ') || 'Student'}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mt-4 truncate relative">
                    {w.orgName}
                  </p>

                  <div className="mt-2 rounded-2xl bg-white/15 backdrop-blur border border-white/15 px-3.5 py-2.5 relative">
                    {current ? (
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300" />
                        </span>
                        <p className="text-xs font-bold truncate">
                          In class: {current.title}
                          {current.endTime && <span className="text-white/70 font-semibold"> · till {current.endTime}</span>}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-full h-2 w-2 bg-white/40 shrink-0" />
                        <p className="text-xs font-semibold text-white/80">No class right now</p>
                      </div>
                    )}
                  </div>

                  {att && att.percentage !== null && (
                    <div className="flex items-center justify-between mt-3 relative">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                        Attendance
                      </span>
                      <span className="text-xs font-black">{att.percentage}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ===== QUICK ACTION TILES ===== */}
          <div className="grid grid-cols-4 gap-3">
            <Link
              href="/parent/fees"
              className="group flex flex-col items-center gap-2 rounded-3xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="relative w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-105 transition">
                <Receipt className="w-5.5 h-5.5" />
                {data.fees.dueCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {data.fees.dueCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-600">Fees</span>
            </Link>
            <Link
              href="/parent/timetable"
              className="group flex flex-col items-center gap-2 rounded-3xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1565D8] flex items-center justify-center group-hover:scale-105 transition">
                <CalendarClock className="w-5.5 h-5.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-600">Schedule</span>
            </Link>
            <Link
              href="/parent/attendance"
              className="group flex flex-col items-center gap-2 rounded-3xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition">
                <CalendarCheck className="w-5.5 h-5.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-600">
                {avgAttendance !== null ? `${avgAttendance}%` : 'Attendance'}
              </span>
            </Link>
            <Link
              href="/parent/events"
              className="group flex flex-col items-center gap-2 rounded-3xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="relative w-12 h-12 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center group-hover:scale-105 transition">
                <CalendarDays className="w-5.5 h-5.5" />
                {eventsThisWeek.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {eventsThisWeek.length}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-600">Events</span>
            </Link>
          </div>

          {/* ===== TODAY TIMELINE ===== */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-slate-900">Today</h3>
              <div className="flex items-center gap-2">
                {data.wards.length > 1 && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setActiveWardId('ALL')}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                        activeWardId === 'ALL'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      All
                    </button>
                    {data.wards.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => setActiveWardId(w.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                          activeWardId === w.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-500 border border-slate-200'
                        }`}
                      >
                        {w.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                )}
                <Link
                  href="/parent/timetable"
                  className="text-[11px] font-bold text-[#1565D8] hover:underline flex items-center gap-0.5"
                >
                  Week <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {todayItems.length > 0 ? (
              <div className="relative space-y-3 before:absolute before:left-[27px] before:top-3 before:bottom-3 before:w-px before:bg-slate-200">
                {todayItems.map((item, idx) => {
                  const s = TIMELINE_STYLE[item.type]
                  const Icon = s.icon
                  return (
                    <Link
                      key={idx}
                      href={item.href ?? '#'}
                      className="relative flex items-center gap-3.5 group"
                    >
                      <div
                        className={`relative z-10 w-[54px] h-[54px] rounded-2xl border ${s.bg} ${s.text} flex flex-col items-center justify-center shrink-0`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[9px] font-black mt-0.5">{item.startTime ?? 'DAY'}</span>
                      </div>
                      <div className="flex-1 min-w-0 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm group-hover:border-blue-100 group-hover:shadow transition">
                        <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
                          {[
                            item.startTime && item.endTime ? `${item.startTime}–${item.endTime}` : null,
                            item.studentName,
                            item.subtitle ?? item.orgName
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-3xl bg-white border border-dashed border-slate-200 p-10 text-center">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">Free day — nothing scheduled</p>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Classes, events and due dates show up here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT RAIL ================= */}
        <div className="space-y-7">
          {/* ===== FEES CARD ===== */}
          {data.fees.dueCount > 0 && data.fees.nextDue ? (
            !urgentReminder && (
              <div className="rounded-3xl bg-slate-900 text-white p-5 shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fees due</p>
                <p className="text-3xl font-black tracking-tight mt-1">
                  ₹{data.fees.totalBalance.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-400 font-semibold mt-1 truncate">
                  {data.fees.nextDue.invoiceNumber} · {data.fees.nextDue.studentName}
                  {data.fees.nextDue.dueDate &&
                    ` · due ${new Date(data.fees.nextDue.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                </p>
                <Link
                  href="/parent/fees"
                  className="mt-4 flex items-center justify-center gap-1.5 bg-white text-slate-900 text-sm font-black rounded-2xl py-3 hover:bg-slate-100 transition"
                >
                  Pay now <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )
          ) : (
            <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CircleCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-800">Fees all clear</p>
                <p className="text-[11px] text-emerald-600 font-semibold">No pending payments</p>
              </div>
            </div>
          )}

          {/* ===== REMINDERS ===== */}
          {otherReminders.length > 0 && (
            <div>
              <h3 className="text-base font-black text-slate-900 mb-3">Reminders</h3>
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
                {otherReminders.slice(0, 4).map((r, idx) => {
                  const Icon = SEVERITY_ICON[r.severity]
                  return (
                    <Link
                      key={idx}
                      href={r.href}
                      className="flex items-start gap-3 p-4 hover:bg-slate-50/70 transition"
                    >
                      <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[r.severity]}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-slate-800 leading-snug">{r.title}</p>
                        {r.detail && (
                          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{r.detail}</p>
                        )}
                      </div>
                      <Icon className="w-3.5 h-3.5 text-slate-300 mt-1 shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== UPCOMING EVENTS ===== */}
          {eventsThisWeek.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-black text-slate-900">Events</h3>
                <Link
                  href="/parent/events"
                  className="text-[11px] font-bold text-[#1565D8] hover:underline flex items-center gap-0.5"
                >
                  All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {eventsThisWeek.slice(0, 3).map((e, idx) => {
                  const d = new Date(`${e.date}T00:00:00`)
                  return (
                    <Link
                      key={idx}
                      href="/parent/events"
                      className="flex items-center gap-3.5 rounded-3xl bg-white border border-slate-100 p-3.5 shadow-sm hover:border-violet-100 hover:shadow transition"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex flex-col items-center justify-center shrink-0">
                        <span className="text-sm font-black leading-none">{d.getDate()}</span>
                        <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">
                          {d.toLocaleDateString('en-IN', { month: 'short' })}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-800 truncate">{e.title}</p>
                        <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
                          {[e.startTime, e.orgName].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-slate-900">
                Updates
                {data.notifications.unreadCount > 0 && (
                  <span className="ml-2 align-middle text-[9px] font-black text-white bg-red-500 rounded-full px-1.5 py-0.5">
                    {data.notifications.unreadCount} new
                  </span>
                )}
              </h3>
              <Link
                href="/parent/notifications"
                className="text-[11px] font-bold text-[#1565D8] hover:underline flex items-center gap-0.5"
              >
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
              {data.notifications.items.length > 0 ? (
                data.notifications.items.slice(0, 4).map((n) => (
                  <div key={n.id} className="flex gap-3 p-4">
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.readAt ? 'bg-slate-200' : 'bg-[#1565D8]'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[13px] leading-snug truncate ${
                          n.readAt ? 'font-semibold text-slate-500' : 'font-bold text-slate-800'
                        }`}
                      >
                        {n.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{timeAgo(n.createdAt)} ago</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-bold">No updates yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
