import { useEffect, useMemo, useState } from 'react'
import { Text, View, Pressable, ActivityIndicator } from 'react-native'
import { Screen, GradientHeader, Card, Chip } from '@/components/ui'
import { useAttendanceStudents, useAttendanceMonth, type AttendanceRecord } from '@/lib/parent-attendance'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

/** Days in month, Monday-first leading blanks to match the wireframe grid. */
function buildDays(month: string): (number | null)[] {
  const [y, m] = month.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const firstDow = new Date(y, m - 1, 1).getDay() // 0=Sun
  const leading = firstDow === 0 ? 6 : firstDow - 1 // Monday-first offset
  return [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
}

const STATUS_STYLE: Record<AttendanceRecord['status'], string> = {
  PRESENT: 'bg-good-bg text-good',
  ABSENT: 'bg-bad-bg text-bad',
  HALF_DAY: 'bg-warn-bg text-warn',
  LEAVE: 'bg-brand-soft text-brand',
  HOLIDAY: 'bg-line/40 text-ink-faint'
}

export default function Attendance() {
  const { data: students, isLoading: studentsLoading } = useAttendanceStudents()
  const [studentId, setStudentId] = useState<string | null>(null)
  const [month, setMonth] = useState(currentMonth())

  useEffect(() => {
    if (!studentId && students && students.length > 0) setStudentId(students[0].id)
  }, [students, studentId])

  const { data, isLoading } = useAttendanceMonth(studentId, month)

  const recordByDay = useMemo(() => {
    const map = new Map<number, AttendanceRecord>()
    for (const r of data?.records ?? []) map.set(Number(r.date.slice(8, 10)), r)
    return map
  }, [data])

  const days = buildDays(month)

  return (
    <Screen
      header={
        <GradientHeader
          title="Attendance"
          subtitle={data?.stats.percentage != null ? `${data.stats.percentage}% present this month` : monthLabel(month)}
          accent="attend"
        />
      }
    >
      {studentsLoading ? (
        <View className="mt-8 items-center">
          <ActivityIndicator color="#1565D8" />
        </View>
      ) : (
        <>
          {students && students.length > 1 ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {students.map((s) => (
                <Pressable key={s.id} onPress={() => setStudentId(s.id)}>
                  <Chip label={s.name.split(' ')[0]} selected={studentId === s.id} />
                </Pressable>
              ))}
            </View>
          ) : null}

          <Card className="mt-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-ink">{monthLabel(month)}</Text>
              <View className="flex-row gap-4">
                <Pressable onPress={() => setMonth((m) => shiftMonth(m, -1))}>
                  <Text className="text-base text-ink-secondary">‹</Text>
                </Pressable>
                <Pressable onPress={() => setMonth((m) => shiftMonth(m, 1))}>
                  <Text className="text-base text-ink-secondary">›</Text>
                </Pressable>
              </View>
            </View>

            {isLoading ? (
              <View className="mt-6 items-center">
                <ActivityIndicator color="#1565D8" />
              </View>
            ) : (
              <>
                <View className="mt-3 flex-row flex-wrap">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <Text key={i} className="w-[14.28%] text-center text-[11px] text-ink-faint">
                      {d}
                    </Text>
                  ))}
                  {days.map((day, i) => {
                    const record = day ? recordByDay.get(day) : undefined
                    return (
                      <View key={i} className="w-[14.28%] items-center py-1">
                        {day ? (
                          <View
                            className={`h-7 w-7 items-center justify-center rounded-full ${record ? STATUS_STYLE[record.status] : ''}`}
                          >
                            <Text className="text-xs text-ink">{day}</Text>
                          </View>
                        ) : null}
                      </View>
                    )
                  })}
                </View>

                {data?.stats.percentage != null ? (
                  <Text className="mt-3 text-xs text-ink-faint">
                    {data.stats.percentage}% present · {data.stats.present} present ·{' '}
                    {data.stats.absent} absent
                  </Text>
                ) : null}

                <View className="mt-3 flex-row gap-4">
                  <Text className="text-xs text-ink-faint">▩ present</Text>
                  <Text className="text-xs text-bad">□ absent</Text>
                  <Text className="text-xs text-ink-faint">┄ holiday</Text>
                </View>
              </>
            )}
          </Card>
        </>
      )}
    </Screen>
  )
}
