import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Button } from '@/components/ui'
import { useAiChat, type AiMessage } from '@/lib/ai-chat'

function ActionCard({ msg, onConfirm, onCancel }: { msg: AiMessage; onConfirm: () => void; onCancel: () => void }) {
  const action = msg.action!
  return (
    <Card className="mt-2 border-brand/30 bg-brand-soft/40">
      <Text className="text-xs font-semibold text-ink">{action.humanSummary}</Text>
      {action.fields.map((f) => (
        <View key={f.label} className="mt-1.5 flex-row justify-between">
          <Text className="text-xs text-ink-faint">{f.label}</Text>
          <Text className="text-xs font-medium text-ink">{f.value}</Text>
        </View>
      ))}
      {action.status === 'pending' || action.status === 'confirming' ? (
        <View className="mt-3 flex-row gap-2">
          <Pressable onPress={onCancel} className="flex-1 items-center rounded-xl border border-line py-2 active:opacity-70">
            <Text className="text-xs font-semibold text-ink-secondary">Cancel</Text>
          </Pressable>
          <Pressable onPress={onConfirm} disabled={action.status === 'confirming'} className="flex-1 items-center rounded-xl bg-brand py-2 active:opacity-70">
            <Text className="text-xs font-semibold text-white">{action.status === 'confirming' ? 'Working…' : 'Confirm'}</Text>
          </Pressable>
        </View>
      ) : action.status === 'done' ? (
        <Text className="mt-2 text-xs font-semibold text-good">{action.resultText ?? 'Done ✓'}</Text>
      ) : action.status === 'cancelled' ? (
        <Text className="mt-2 text-xs text-ink-faint">Cancelled</Text>
      ) : (
        <Text className="mt-2 text-xs font-semibold text-bad">{action.resultText ?? 'Failed'}</Text>
      )}
    </Card>
  )
}

function MessageBubble({ msg, onConfirm, onCancel }: { msg: AiMessage; onConfirm: () => void; onCancel: () => void }) {
  const isUser = msg.role === 'user'
  return (
    <View className={`mt-3 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View className={`rounded-2xl px-3.5 py-2.5 ${isUser ? 'bg-brand' : 'bg-white border border-line/60'}`}>
        <Text className={`text-sm ${isUser ? 'text-white' : 'text-ink'}`}>
          {msg.text || (msg.streaming ? '…' : '')}
        </Text>
      </View>
      {msg.citations && msg.citations.length > 0 ? (
        <View className="mt-1.5 flex-row flex-wrap gap-1.5">
          {msg.citations.map((c) => (
            <View key={c.docId} className="rounded-full border border-line bg-white px-2 py-0.5">
              <Text className="text-[10px] font-medium text-ink-secondary">{c.title}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {msg.action ? <ActionCard msg={msg} onConfirm={onConfirm} onCancel={onCancel} /> : null}
    </View>
  )
}

export default function AiChat() {
  const chat = useAiChat()
  const [input, setInput] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    void chat.checkEntitlement()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = () => {
    if (!input.trim()) return
    void chat.send(input)
    setInput('')
  }

  return (
    <Screen
      header={
        <GradientHeader
          title="Ask AI"
          subtitle={chat.creditsLeft !== null ? `${chat.creditsLeft} credits left` : undefined}
          accent="brand"
          right={
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
              <Text className="text-lg font-bold text-white">×</Text>
            </Pressable>
          }
        />
      }
    >
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })} showsVerticalScrollIndicator={false}>
          {chat.entitled === false ? (
            <Card className="mt-4">
              <Text className="text-sm text-ink-secondary">AI Copilot isn't enabled for your school yet.</Text>
            </Card>
          ) : chat.messages.length === 0 ? (
            <Card className="mt-4">
              <Text className="text-sm text-ink-secondary">
                Ask about leads, admissions, fees, or attendance — e.g. "How many leads came in this week?"
              </Text>
            </Card>
          ) : (
            chat.messages.map((m) => (
              <MessageBubble key={m.id} msg={m} onConfirm={() => chat.confirmAction(m)} onCancel={() => chat.cancelAction(m)} />
            ))
          )}
          {chat.error ? <Text className="mt-2 text-xs text-bad">{chat.error}</Text> : null}
        </ScrollView>

        <View className="flex-row items-center gap-2 border-t border-line bg-white px-4 py-3">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask something…"
            className="flex-1 rounded-full border border-line px-4 py-2.5 text-sm text-ink"
            editable={chat.status !== 'streaming'}
            onSubmitEditing={submit}
            returnKeyType="send"
          />
          {chat.status === 'streaming' ? (
            <Pressable onPress={chat.stop} className="h-10 w-10 items-center justify-center rounded-full bg-bad">
              <ActivityIndicator color="#fff" size="small" />
            </Pressable>
          ) : (
            <Pressable onPress={submit} disabled={!input.trim()} className="h-10 w-10 items-center justify-center rounded-full bg-brand disabled:opacity-40">
              <Text className="text-base font-bold text-white">→</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
