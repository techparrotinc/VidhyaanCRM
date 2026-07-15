import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Screen, GradientHeader, Card, Button } from '@/components/ui'
import {
  useCreateEvent,
  useUploadEventCover,
  usePublishEvent,
  useAnnounceAudience,
  useAnnounceEvent,
  type StaffEvent
} from '@/lib/events-staff'

function CreateForm({ onCreated }: { onCreated: (event: StaffEvent) => void }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [coverUri, setCoverUri] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const create = useCreateEvent()
  const uploadCover = useUploadEventCover()

  const pickCover = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) return
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, aspect: [16, 9] })
    if (!result.canceled && result.assets.length > 0) setCoverUri(result.assets[0].uri)
  }

  const submit = async () => {
    setError(null)
    if (title.trim().length < 2) return setError('Title is required')
    const startsAt = new Date(`${date}T${time || '00:00'}:00`)
    if (isNaN(startsAt.getTime())) return setError('Enter a valid date (YYYY-MM-DD) and time (HH:MM)')
    if (startsAt < new Date()) return setError('Event must be in the future')

    try {
      let imageUrl: string | undefined
      if (coverUri) {
        const uploaded = await uploadCover.mutateAsync({ uri: coverUri, fileName: 'cover.jpg', mimeType: 'image/jpeg' })
        imageUrl = uploaded.url
      }
      const event = await create.mutateAsync({
        title: title.trim(),
        startsAt: startsAt.toISOString(),
        location: location.trim() || undefined,
        imageUrl
      })
      onCreated(event)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create event')
    }
  }

  const busy = create.isPending || uploadCover.isPending

  return (
    <Card className="mt-3 gap-2.5">
      <TextInput value={title} onChangeText={setTitle} placeholder="Event title" className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink" />
      <View className="flex-row gap-2">
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          className="flex-1 rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
        />
        <TextInput
          value={time}
          onChangeText={setTime}
          placeholder="HH:MM"
          className="w-24 rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
        />
      </View>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="Location (optional)"
        className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
      />
      <Pressable onPress={pickCover} className="items-center rounded-xl border border-dashed border-line py-3 active:opacity-70">
        <Text className="text-xs font-semibold text-ink-secondary">{coverUri ? 'Cover photo added ✓ — tap to retake' : 'Add cover photo (optional)'}</Text>
      </Pressable>
      {error ? <Text className="text-xs text-bad">{error}</Text> : null}
      <Button label={busy ? 'Creating…' : 'Create draft'} onPress={submit} loading={busy} />
    </Card>
  )
}

function PublishStep({ event, onPublished }: { event: StaffEvent; onPublished: (event: StaffEvent) => void }) {
  const publish = usePublishEvent()
  const [error, setError] = useState<string | null>(null)

  const doPublish = async () => {
    setError(null)
    try {
      const published = await publish.mutateAsync(event.id)
      onPublished(published)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to publish')
    }
  }

  return (
    <Card className="mt-3">
      <Text className="text-sm font-semibold text-ink">{event.title}</Text>
      <Text className="mt-1 text-xs text-ink-secondary">
        {event.startsAt.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
      </Text>
      <Text className="mt-2 text-xs font-semibold text-warn">Draft — not visible to parents yet.</Text>
      {error ? <Text className="mt-2 text-xs text-bad">{error}</Text> : null}
      <View className="mt-3">
        <Button label={publish.isPending ? 'Publishing…' : 'Publish'} onPress={doPublish} loading={publish.isPending} />
      </View>
    </Card>
  )
}

function AnnounceStep({ event }: { event: StaffEvent }) {
  const audience = useAnnounceAudience(event.id, true)
  const announce = useAnnounceEvent()
  const [channels, setChannels] = useState<Array<'PORTAL' | 'WHATSAPP'>>(['PORTAL'])
  const [sent, setSent] = useState(false)

  const toggle = (c: 'PORTAL' | 'WHATSAPP') =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const send = async () => {
    await announce.mutateAsync({ eventId: event.id, channels })
    setSent(true)
  }

  return (
    <Card className="mt-3">
      <Text className="text-sm font-semibold text-good">Published ✓</Text>
      <Text className="mt-2 text-xs text-ink-secondary">
        Audience: everyone (parents + open leads){audience.data ? ` — ~${audience.data.both} contacts` : ''}
      </Text>
      <View className="mt-3 flex-row gap-2">
        {(['PORTAL', 'WHATSAPP'] as const).map((c) => (
          <Pressable
            key={c}
            onPress={() => toggle(c)}
            className={`rounded-full px-3 py-1.5 ${channels.includes(c) ? 'bg-events' : 'border border-line'}`}
          >
            <Text className={`text-xs font-semibold ${channels.includes(c) ? 'text-white' : 'text-ink-secondary'}`}>
              {c === 'PORTAL' ? 'Parent Portal' : 'WhatsApp'}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="mt-3">
        {sent ? (
          <Text className="text-center text-xs font-semibold text-good">Announced ✓</Text>
        ) : (
          <Button
            label={announce.isPending ? 'Sending…' : 'Announce'}
            onPress={send}
            disabled={channels.length === 0}
            loading={announce.isPending}
          />
        )}
      </View>
    </Card>
  )
}

export default function EventCreate() {
  const [event, setEvent] = useState<StaffEvent | null>(null)

  return (
    <Screen
      header={
        <GradientHeader
          title="New Event"
          accent="events"
          right={
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
              <Text className="text-lg font-bold text-white">×</Text>
            </Pressable>
          }
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!event ? (
          <CreateForm onCreated={setEvent} />
        ) : event.status === 'DRAFT' ? (
          <PublishStep event={event} onPublished={setEvent} />
        ) : (
          <AnnounceStep event={event} />
        )}
      </ScrollView>
    </Screen>
  )
}
