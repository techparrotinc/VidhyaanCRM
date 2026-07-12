'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { CalendarCheck } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AttendanceCalendar, type CalendarRecord, type CalendarStats } from '@/components/attendance/AttendanceCalendar'

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-[#1565D8]" />
          Attendance
        </h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
          Your child&apos;s attendance as recorded by the school.
        </p>
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
        </>
      )}
    </div>
  )
}
