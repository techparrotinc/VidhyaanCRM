import { Text, View, Image, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Screen, DetailHeader, Button, EmptyState } from '@/components/ui'
import { useParentEvents, useRsvp } from '@/lib/parent-events'

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: events, isLoading } = useParentEvents()
  const rsvp = useRsvp()
  const event = events?.find((e) => e.id === id)

  if (isLoading) {
    return (
      <Screen header={<DetailHeader title="Event" onBack={() => router.back()} accent="events" />}>
        <View className="mt-8 items-center">
          <ActivityIndicator color="#1565D8" />
        </View>
      </Screen>
    )
  }

  if (!event) {
    return (
      <Screen header={<DetailHeader title="Event" onBack={() => router.back()} accent="events" />}>
        <EmptyState icon="sparkles-outline" title="Event not found" />
      </Screen>
    )
  }

  const dateRange = [
    event.startsAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    event.startsAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
    event.endsAt ? `– ${event.endsAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : '',
    event.location
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Screen header={<DetailHeader title={event.title} onBack={() => router.back()} accent="events" />}>
      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} className="h-40 w-full rounded-lg" resizeMode="cover" />
        ) : null}
        <Text className="mt-3 text-xs text-ink-secondary">{dateRange}</Text>
        {event.description ? (
          <Text className="mt-3 text-sm text-ink-secondary">{event.description}</Text>
        ) : null}

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Going"
              variant={event.myRsvp?.status === 'GOING' ? 'primary' : 'outline'}
              loading={rsvp.isPending}
              onPress={() => rsvp.mutate({ eventId: event.id, status: 'GOING' })}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Not going"
              variant={event.myRsvp?.status === 'NOT_GOING' ? 'danger' : 'quiet'}
              loading={rsvp.isPending}
              onPress={() => rsvp.mutate({ eventId: event.id, status: 'NOT_GOING' })}
            />
          </View>
        </View>
        {rsvp.isError ? (
          <Text className="mt-2 text-sm text-bad">Couldn't save your RSVP. Try again.</Text>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
