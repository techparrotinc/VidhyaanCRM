import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, DetailHeader, Card, EmptyState } from '@/components/ui'
import { useStaffNotifications, useMarkNotificationsRead } from '@/lib/staff-extras'

/** Staff alert centre (wireframe s-notifs) — bell on home opens this. */

const CATEGORIES: Array<{ label: string; value?: string }> = [
  { label: 'All' },
  { label: 'Leads', value: 'leads' },
  { label: 'Fees', value: 'fees' },
  { label: 'Attendance', value: 'attendance' }
]

function timeAgo(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (mins < 60) return `${Math.max(mins, 1)}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function StaffNotifications() {
  const [category, setCategory] = useState<string | undefined>(undefined)
  const { data, isLoading } = useStaffNotifications(category)
  const markRead = useMarkNotificationsRead()

  // Opening the list marks everything read (single-shot).
  useEffect(() => {
    if (data && data.unread > 0) markRead.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.unread])

  const openTarget = (n: { data: Record<string, unknown> | null }) => {
    const route = typeof n.data?.route === 'string' ? n.data.route : null
    if (route) router.push(`/(org)${route}` as never)
  }

  return (
    <Screen header={<DetailHeader title="Notifications" onBack={() => router.back()} />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mt-2 flex-row gap-1.5">
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.label}
              onPress={() => setCategory(c.value)}
              className={`rounded-full px-3 py-1.5 ${category === c.value ? 'bg-brand' : 'border border-line bg-white'}`}
            >
              <Text className={`text-xs font-semibold ${category === c.value ? 'text-white' : 'text-ink-secondary'}`}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#1565D8" />
          </View>
        ) : !data || data.notifications.length === 0 ? (
          <EmptyState icon="notifications-off-outline" title="No notifications" subtitle="You're all caught up." />
        ) : (
          data.notifications.map((n) => (
            <Pressable key={n.id} onPress={() => openTarget(n)} className="active:opacity-70">
              <Card className={`mt-2.5 ${n.readAt ? '' : 'border-brand/40'}`}>
                <View className="flex-row items-start justify-between gap-2">
                  <Text className={`flex-1 text-sm ${n.readAt ? 'text-ink-secondary' : 'font-semibold text-ink'}`}>
                    {n.title}
                  </Text>
                  <Text className="text-xs text-ink-faint">{timeAgo(n.createdAt)}</Text>
                </View>
                {n.body ? <Text className="mt-0.5 text-xs text-ink-secondary">{n.body}</Text> : null}
              </Card>
            </Pressable>
          ))
        )}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  )
}
