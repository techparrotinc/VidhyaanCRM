import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, IconCircle, EmptyState } from '@/components/ui'
import { useWhatsAppInbox, type InboundMessage } from '@/lib/wa-inbox'

function timeAgo(d: Date): string {
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60_000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function MessageRow({ msg }: { msg: InboundMessage }) {
  return (
    <Card className="mt-3 flex-row items-start gap-3">
      <IconCircle accent="attend" icon="logo-whatsapp" />
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-ink">{msg.contactName ?? msg.phone}</Text>
          <Text className="text-[11px] text-ink-faint">{timeAgo(msg.createdAt)}</Text>
        </View>
        <Text className="mt-0.5 text-xs text-ink-secondary">{msg.body}</Text>
        {msg.contactName ? <Text className="mt-1 text-[11px] text-ink-faint">{msg.phone}</Text> : null}
      </View>
    </Card>
  )
}

export default function WhatsAppInbox() {
  const { data, isLoading, isError, refetch } = useWhatsAppInbox()

  return (
    <Screen
      header={
        <GradientHeader
          title="WhatsApp Inbox"
          subtitle={data ? `${data.length} messages` : undefined}
          accent="attend"
          right={
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
              <Text className="text-lg font-bold text-white">×</Text>
            </Pressable>
          }
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card className="border-warn/40 bg-warn-bg">
          <Text className="text-xs font-medium text-warn">
            Read-only for now — replying from the app isn't available yet. Use WhatsApp Web or the desk app to reply.
          </Text>
        </Card>

        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#0D9488" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load messages. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data && data.length > 0 ? (
          data.map((m) => <MessageRow key={m.id} msg={m} />)
        ) : (
          <EmptyState icon="logo-whatsapp" title="No messages yet" />
        )}
      </ScrollView>
    </Screen>
  )
}
