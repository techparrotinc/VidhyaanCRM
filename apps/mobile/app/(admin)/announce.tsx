import { useState } from 'react'
import { Alert, Pressable, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Button, FormScrollView } from '@/components/ui'
import { useSendAnnouncement } from '@/lib/admin'

const CHANNELS = ['IN_APP', 'EMAIL', 'BOTH'] as const
type Channel = (typeof CHANNELS)[number]
const CHANNEL_LABEL: Record<Channel, string> = { IN_APP: 'In-app', EMAIL: 'Email', BOTH: 'Both' }

export default function Announce() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [channel, setChannel] = useState<Channel>('IN_APP')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const send = useSendAnnouncement()

  const submit = () => {
    if (title.trim().length < 2) return setError('Title is required')
    if (message.trim().length < 2) return setError('Message is required')
    setError(null)
    Alert.alert('Publish to every org?', 'This sends to every organization on the platform. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Publish',
        style: 'destructive',
        onPress: async () => {
          await send.mutateAsync({ title: title.trim(), message: message.trim(), channel })
          setSent(true)
        }
      }
    ])
  }

  return (
    <Screen
      header={
        <GradientHeader
          title="Announcement"
          subtitle="Publish to all orgs"
          accent="brand"
          right={
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
              <Text className="text-lg font-bold text-white">×</Text>
            </Pressable>
          }
        />
      }
    >
      <FormScrollView>
        {sent ? (
          <Card className="mt-4 items-center gap-2 border-good/40 bg-good-bg">
            <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
            <Text className="text-sm font-semibold text-good">Announcement published</Text>
          </Card>
        ) : (
          <Card className="mt-3 gap-2.5">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
            />
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Message"
              multiline
              numberOfLines={5}
              className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
            <View className="flex-row gap-2">
              {CHANNELS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setChannel(c)}
                  className={`rounded-full px-3 py-1.5 ${channel === c ? 'bg-brand' : 'border border-line'}`}
                >
                  <Text className={`text-xs font-semibold ${channel === c ? 'text-white' : 'text-ink-secondary'}`}>
                    {CHANNEL_LABEL[c]}
                  </Text>
                </Pressable>
              ))}
            </View>
            {error ? <Text className="text-xs text-bad">{error}</Text> : null}
            <Button label={send.isPending ? 'Publishing…' : 'Publish'} onPress={submit} loading={send.isPending} />
          </Card>
        )}
      </FormScrollView>
    </Screen>
  )
}
