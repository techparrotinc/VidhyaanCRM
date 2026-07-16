import { Text, View, Image, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Chip, IconCircle, EmptyState } from '@/components/ui'
import { useParentEvents, type ParentEvent } from '@/lib/parent-events'

function formatWhen(e: ParentEvent): string {
  const date = e.startsAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = e.startsAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  return [date, time, e.location].filter(Boolean).join(' · ')
}

function rsvpChip(event: ParentEvent) {
  if (!event.myRsvp) return <Chip label="RSVP pending" tone="neutral" />
  if (event.myRsvp.status === 'GOING') return <Chip label="Going" tone="good" />
  if (event.myRsvp.status === 'NOT_GOING') return <Chip label="Not going" tone="neutral" />
  return <Chip label="RSVP pending" tone="neutral" />
}

function EventCard({ event }: { event: ParentEvent }) {
  return (
    <Pressable onPress={() => router.push(`/(parent)/events/${event.id}`)} className="active:opacity-80">
      <Card className="mt-3">
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} className="mb-3 h-28 w-full rounded-lg" resizeMode="cover" />
        ) : (
          <View className="mb-3 flex-row">
            <IconCircle accent="events" size={48} icon="sparkles" />
          </View>
        )}
        <Text className="text-sm font-semibold text-ink">{event.title}</Text>
        <Text className="mt-0.5 text-xs text-ink-secondary">{formatWhen(event)}</Text>
        <View className="mt-2 flex-row items-center gap-2">{rsvpChip(event)}</View>
      </Card>
    </Pressable>
  )
}

export default function Events() {
  const { data: events, isLoading, isError, refetch, isRefetching } = useParentEvents()

  return (
    <Screen
      header={
        <GradientHeader
          title="Events"
          subtitle={events && events.length > 0 ? `${events.length} upcoming` : undefined}
          accent="events"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#1565D8" />
          </View>
        ) : isError ? (
          <Card>
            <Text className="text-sm text-bad">Couldn't load events. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">
                {isRefetching ? 'Retrying…' : 'Retry'}
              </Text>
            </Pressable>
          </Card>
        ) : events && events.length > 0 ? (
          events.map((e) => <EventCard key={e.id} event={e} />)
        ) : (
          <EmptyState icon="sparkles-outline" title="No upcoming events" />
        )}
      </ScrollView>
    </Screen>
  )
}
