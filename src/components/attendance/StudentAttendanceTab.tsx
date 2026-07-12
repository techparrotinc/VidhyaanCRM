"use client"

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { AttendanceCalendar, type CalendarRecord, type CalendarStats } from './AttendanceCalendar'

const currentMonth = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()).slice(0, 7)

/** Monthly attendance calendar + stats for one student (CRM student record). */
export function StudentAttendanceTab({ studentId }: { studentId: string }) {
  const [month, setMonth] = useState(currentMonth())
  const [records, setRecords] = useState<CalendarRecord[]>([])
  const [stats, setStats] = useState<CalendarStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/v1/attendance/students/${studentId}?month=${month}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.error || 'Failed to load attendance')
        setRecords(json.data.records)
        setStats(json.data.stats)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [studentId, month])

  if (error) {
    return <p className="text-sm font-medium text-red-600">{error}</p>
  }
  if (loading && records.length === 0 && !stats) {
    return <Skeleton className="h-72 w-full" />
  }

  return (
    <AttendanceCalendar
      month={month}
      records={records}
      stats={stats}
      onMonthChange={setMonth}
      loading={loading}
    />
  )
}
