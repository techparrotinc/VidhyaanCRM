import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Button } from '@/components/ui'
import {
  useParentNotifications,
  useMarkNotificationsRead,
  type NotificationItem
} from '@/lib/parent-notifications'
import { resolveNotificationRoute } from '@/lib/notification-routes'

function timeAgo(d: Date): string {
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60_000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function NotificationRow({ item, onOpen }: { item: NotificationItem; onOpen: (item: NotificationItem) => void }) {
  const unread = !item.readAt
  return (
    <Pressable onPress={() => onOpen(item)} className="active:opacity-70">
      <Card className={`mt-3 ${unread ? 'border-brand/30 bg-brand-soft/40' : ''}`}>
        <View className="flex-row items-start justify-between gap-2">
          <Text className={`flex-1 text-sm ${unread ? 'font-bold text-ink' : 'font-semibold text-ink-secondary'}`}>
            {item.title}
          </Text>
          {unread ? <View className="mt-1 h-2 w-2 rounded-full bg-brand" /> : null}
        </View>
        {item.body ? <Text className="mt-1 text-xs text-ink-secondary">{item.body}</Text> : null}
        <Text className="mt-2 text-[11px] text-ink-faint">{timeAgo(item.createdAt)}</Text>
      </Card>
    </Pressable>
  )
}

export default function Notifications() {
  const { data, isLoading, isError, refetch } = useParentNotifications()
  const markRead = useMarkNotificationsRead()

  const onOpen = (item: NotificationItem) => {
    if (!item.readAt) markRead.mutate({ ids: [item.id] })
    const route = resolveNotificationRoute(item.data)
    if (route) router.push(route as any)
  }

  return (
    <Screen
      header={
        <GradientHeader
          title="Notifications"
          subtitle={data && data.unreadCount > 0 ? `${data.unreadCount} unread` : 'All caught up'}
          accent="brand"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {data && data.unreadCount > 0 ? (
          <Button
            label="Mark all as read"
            variant="quiet"
            onPress={() => markRead.mutate({ all: true })}
            loading={markRead.isPending}
          />
        ) : null}
        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#1565D8" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load notifications. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data && data.items.length > 0 ? (
          data.items.map((item) => <NotificationRow key={item.id} item={item} onOpen={onOpen} />)
        ) : (
          <Card className="mt-4">
            <Text className="text-sm text-ink-secondary">No notifications yet.</Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  )
}
