import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, DetailHeader, Card, Chip, EmptyState } from '@/components/ui'
import { useWeekSchedule, isoWeekOf, type ScheduleSession } from '@/lib/schedule'

/** Week view (wireframe s-schedule-week): day rows with load + outcomes. */

function startOfWeek(anchor: Date): Date {
  const d = new Date(anchor)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - (day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

export default function ScheduleWeek() {
  const [weekOffset, setWeekOffset] = useState(0)
  const anchor = new Date(Date.now() + weekOffset * 7 * 86_400_000)
  const week = isoWeekOf(anchor)
  const { data, isLoading } = useWeekSchedule(week)

  const monday = startOfWeek(anchor)
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * 86_400_000))
  const todayKey = new Date().toDateString()

  const byDay = new Map<string, ScheduleSession[]>()
  for (const s of data ?? []) {
    const k = s.startsAt.toDateString()
    byDay.set(k, [...(byDay.get(k) ?? []), s])
  }

  const label = `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(
    monday.getTime() + 6 * 86_400_000
  ).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`

  return (
    <Screen header={<DetailHeader title="This week" onBack={() => router.back()} accent="attend" />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mt-2 flex-row items-center gap-1.5">
          <Pressable onPress={() => setWeekOffset((o) => o - 1)} className="rounded-full border border-line bg-white px-3 py-1.5 active:opacity-70">
            <Text className="text-xs font-semibold text-ink-secondary">‹ last week</Text>
          </Pressable>
          <View className="rounded-full bg-attend px-3 py-1.5">
            <Text className="text-xs font-semibold text-white">{label}</Text>
          </View>
          <Pressable onPress={() => setWeekOffset((o) => o + 1)} className="rounded-full border border-line bg-white px-3 py-1.5 active:opacity-70">
            <Text className="text-xs font-semibold text-ink-secondary">next ›</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#0D9488" />
          </View>
        ) : (
          days.map((d) => {
            const sessions = byDay.get(d.toDateString()) ?? []
            const isToday = d.toDateString() === todayKey
            const done = sessions.filter((s) => s.status === 'COMPLETED' || s.startsAt.getTime() + s.durationMin * 60_000 < Date.now()).length
            const cancelled = sessions.filter((s) => s.status === 'CANCELLED').length
            const active = sessions.length - cancelled
            const left = Math.max(0, active - done)
            const sub =
              sessions.length === 0
                ? 'No sessions'
                : [`${active} session${active === 1 ? '' : 's'}`, done ? `${done} done` : null, cancelled ? `${cancelled} cancelled` : null]
                    .filter(Boolean)
                    .join(' · ')
            return (
              <Card key={d.toISOString()} className={`mt-2.5 flex-row items-center gap-2 ${isToday ? 'border-attend' : ''}`}>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-ink">
                    {d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                    {isToday ? ' · today' : ''}
                  </Text>
                  <Text className="text-xs text-ink-secondary">{sub}</Text>
                </View>
                {isToday && left > 0 ? <Chip label={`${left} left`} tone="attend" /> : null}
              </Card>
            )
          })
        )}
        {!isLoading && (data?.length ?? 0) === 0 ? (
          <EmptyState icon="calendar-outline" title="Quiet week" subtitle="No sessions scheduled." />
        ) : null}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  )
}
