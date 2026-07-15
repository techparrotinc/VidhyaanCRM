import { Text, View, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Chip, IconCircle } from '@/components/ui'
import { useAuthStore } from '@/lib/auth-store'
import { useParentHome, type ParentHomeKid } from '@/lib/parent-home'
import { useUnreadNotificationCount } from '@/lib/parent-notifications'

function NotificationBell() {
  const unread = useUnreadNotificationCount()
  return (
    <Pressable
      onPress={() => router.push('/(parent)/notifications')}
      className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70"
    >
      <View className="h-4 w-4 rounded-full border-2 border-white" />
      {unread > 0 ? (
        <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border border-white bg-events" />
      ) : null}
    </Pressable>
  )
}

function formatDate(d: Date | string | null): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function attendanceChip(status: ParentHomeKid['attendanceToday']) {
  if (status === 'PRESENT') return <Chip label="Present today" tone="good" />
  if (status === 'ABSENT') return <Chip label="Absent today" tone="bad" />
  if (status === 'HALF_DAY') return <Chip label="Half day" tone="warn" />
  if (status === 'LEAVE') return <Chip label="On leave" tone="neutral" />
  if (status === 'HOLIDAY') return <Chip label="Holiday" tone="neutral" />
  return <Chip label="Not marked" tone="neutral" />
}

function KidCard({ kid }: { kid: ParentHomeKid }) {
  const classLabel = [kid.gradeLabel, kid.section].filter(Boolean).join('-')
  return (
    <Pressable onPress={() => router.push('/(parent)/fees')} className="active:opacity-80">
      <Card className="mt-3">
        <View className="flex-row items-center gap-3">
          <IconCircle accent="brand" />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-ink">{kid.name}</Text>
            <Text className="text-xs text-ink-secondary">
              {[classLabel, kid.orgName].filter(Boolean).join(' · ')}
            </Text>
          </View>
          {attendanceChip(kid.attendanceToday)}
        </View>
        <View className="mt-3 border-t border-line pt-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-ink-faint">Fee due</Text>
            <Text className="text-sm font-medium text-ink">
              {kid.nextFeeDue
                ? `₹${kid.nextFeeDue.balance.toLocaleString('en-IN')} · ${formatDate(kid.nextFeeDue.dueDate)}`
                : 'Nothing pending'}
            </Text>
          </View>
          {kid.nextEvent ? (
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-xs text-ink-faint">Next event</Text>
              <Text className="text-sm font-medium text-ink">
                {kid.nextEvent.title} · {formatDate(kid.nextEvent.date)}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  )
}

export default function ParentHome() {
  const user = useAuthStore((s) => s.user)
  const { data: kids, isLoading, isError, refetch, isRefetching } = useParentHome()

  return (
    <Screen
      header={
        <GradientHeader
          title={`Good morning, ${user?.name?.split(' ')[0] ?? 'there'}`}
          subtitle={kids && kids.length > 0 ? `${kids.length} kid${kids.length > 1 ? 's' : ''} linked` : undefined}
          accent="brand"
          right={<NotificationBell />}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#1565D8" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load your kids. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">
                {isRefetching ? 'Retrying…' : 'Retry'}
              </Text>
            </Pressable>
          </Card>
        ) : kids && kids.length > 0 ? (
          kids.map((kid) => <KidCard key={kid.studentId} kid={kid} />)
        ) : (
          <Card className="mt-4">
            <Text className="text-sm text-ink-secondary">No linked kids on this account yet.</Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  )
}
