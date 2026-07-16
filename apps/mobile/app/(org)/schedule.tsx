import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Chip, EmptyState } from '@/components/ui'
import { useDaySchedule, type ScheduleSession } from '@/lib/schedule'

/** Day schedule (wireframe s-schedule): yesterday/today/tomorrow chips,
 *  session rows with live/done/cancelled state. */

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function durationLabel(min: number): string {
  if (min % 60 === 0) return `${min / 60} hr`
  return `${min} min`
}

function SessionRow({ s }: { s: ScheduleSession }) {
  const now = Date.now()
  const start = s.startsAt.getTime()
  const end = start + s.durationMin * 60_000
  const ongoing = s.status !== 'CANCELLED' && now >= start && now < end
  const done = s.status === 'COMPLETED' || (s.status !== 'CANCELLED' && now >= end)
  const cancelled = s.status === 'CANCELLED'

  const title = `${fmtTime(s.startsAt)} · ${s.course?.name ?? s.batch?.name ?? 'Session'}`
  const sub = [
    s.batch?.name,
    s.teacher?.name,
    s.batch ? `${s.batch.enrolledCount} students` : null,
    cancelled ? `Cancelled${s.cancelReason ? ` · ${s.cancelReason}` : ''}` : null,
    done && s.markedCount !== null && s.batch
      ? `${s.markedCount}/${s.batch.enrolledCount} present`
      : null
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/(org)/session' as never, params: { session: JSON.stringify(s) } as never })
      }
      disabled={cancelled}
      className="active:opacity-70"
    >
      <Card className={`mt-2.5 flex-row items-center gap-2 ${ongoing ? 'border-good' : ''} ${cancelled ? 'opacity-60' : ''}`}>
        <View className="flex-1">
          <Text className={`text-sm font-semibold text-ink ${cancelled ? 'line-through' : ''}`}>{title}</Text>
          <Text className="text-xs text-ink-secondary">{sub}</Text>
        </View>
        {cancelled ? (
          <Chip label="cancelled" tone="bad" />
        ) : done ? (
          <Chip label="done" tone="good" />
        ) : ongoing ? (
          <Chip label="ongoing" tone="good" />
        ) : (
          <Chip label={durationLabel(s.durationMin)} tone="neutral" />
        )}
      </Card>
    </Pressable>
  )
}

export default function Schedule() {
  const [offset, setOffset] = useState(0) // days from today
  const date = new Date(Date.now() + offset * 86_400_000)
  const { data, isLoading } = useDaySchedule(date)

  const dayLabel =
    offset === 0
      ? `Today · ${date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`
      : date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <Screen header={<GradientHeader title="Schedule" accent="attend" />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mt-3 flex-row items-center gap-1.5">
          <Pressable onPress={() => setOffset((o) => o - 1)} className="rounded-full border border-line bg-white px-3 py-1.5 active:opacity-70">
            <Text className="text-xs font-semibold text-ink-secondary">‹ Prev</Text>
          </Pressable>
          <Pressable onPress={() => setOffset(0)} className={`rounded-full px-3 py-1.5 ${offset === 0 ? 'bg-attend' : 'border border-line bg-white'}`}>
            <Text className={`text-xs font-semibold ${offset === 0 ? 'text-white' : 'text-ink-secondary'}`}>{dayLabel}</Text>
          </Pressable>
          <Pressable onPress={() => setOffset((o) => o + 1)} className="rounded-full border border-line bg-white px-3 py-1.5 active:opacity-70">
            <Text className="text-xs font-semibold text-ink-secondary">Next ›</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.push('/(org)/schedule-week' as never)} className="mt-2 self-start rounded-full border border-line bg-white px-3 py-1.5 active:opacity-70">
          <Text className="text-xs font-semibold text-attend">Week view</Text>
        </Pressable>

        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#0D9488" />
          </View>
        ) : !data || data.length === 0 ? (
          <EmptyState icon="calendar-outline" title="No sessions" subtitle="Nothing scheduled for this day." />
        ) : (
          data.map((s) => <SessionRow key={s.id} s={s} />)
        )}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  )
}
