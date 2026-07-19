import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, EmptyState } from '@/components/ui'
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

/**
 * Minimal markdown for assistant bubbles: **bold**, [label](route) links
 * (rendered as highlighted labels — CRM web routes don't exist in this app),
 * and bullet/numbered lists. Anything else stays plain text.
 */
function renderInline(s: string, keyPrefix: string) {
  const parts = s.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean)
  return parts.map((part, i) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part)
    if (bold) return <Text key={`${keyPrefix}-${i}`} className="font-semibold text-ink">{bold[1]}</Text>
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    if (link) return <Text key={`${keyPrefix}-${i}`} className="font-medium text-brand">{link[1]}</Text>
    return <Text key={`${keyPrefix}-${i}`}>{part}</Text>
  })
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <View>
      {lines.map((line, i) => {
        if (!line.trim()) return <View key={i} className="h-1.5" />
        const num = /^\s*(\d+[.)])\s+/.exec(line)
        const bullet = /^\s*[-*]\s+/.test(line)
        const content = line.replace(/^\s*[-*]\s+/, '').replace(/^\s*\d+[.)]\s+/, '').replace(/^#+\s+/, '')
        const prefix = bullet ? '•  ' : num ? `${num[1]}  ` : ''
        return (
          <Text key={i} className="text-sm leading-5 text-ink">
            {prefix}
            {renderInline(content, String(i))}
          </Text>
        )
      })}
    </View>
  )
}

function MessageBubble({ msg, onConfirm, onCancel }: { msg: AiMessage; onConfirm: () => void; onCancel: () => void }) {
  const isUser = msg.role === 'user'
  return (
    <View className={`mt-3 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View className={`rounded-2xl px-3.5 py-2.5 ${isUser ? 'bg-brand' : 'bg-white border border-line/60'}`}>
        {isUser ? (
          <Text className="text-sm text-white">{msg.text}</Text>
        ) : msg.text ? (
          <MarkdownText text={msg.text} />
        ) : (
          <Text className="text-sm text-ink">{msg.streaming ? '…' : ''}</Text>
        )}
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

type HistoryItem = { id: string; title: string | null; messageCount: number; lastMessageAt: string | null }

export default function AiChat() {
  const chat = useAiChat()
  const [input, setInput] = useState('')
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
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

  const openHistory = async () => {
    setView('history')
    setHistoryLoading(true)
    setHistory(await chat.loadHistory())
    setHistoryLoading(false)
  }

  const resume = async (id: string) => {
    if (await chat.loadConversation(id)) setView('chat')
  }

  const remove = async (id: string) => {
    await chat.deleteConversation(id)
    setHistory((items) => items.filter((i) => i.id !== id))
  }

  return (
    <Screen
      header={
        <GradientHeader
          title="Ask AI"
          subtitle={chat.creditsLeft !== null ? `${chat.creditsLeft} credits left` : undefined}
          accent="brand"
          right={
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => (view === 'history' ? setView('chat') : void openHistory())}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70"
              >
                <Ionicons name={view === 'history' ? 'chatbubble-outline' : 'time-outline'} size={18} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() => { chat.newConversation(); setView('chat') }}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70"
              >
                <Ionicons name="add" size={20} color="#fff" />
              </Pressable>
              <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
                <Text className="text-lg font-bold text-white">×</Text>
              </Pressable>
            </View>
          }
        />
      }
    >
      {/* Android edge-to-edge ignores adjustResize — 'height' keeps the
          composer + latest messages above the keyboard. */}
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {view === 'history' ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {historyLoading ? (
              <ActivityIndicator className="mt-8" />
            ) : history.length === 0 ? (
              <EmptyState icon="time-outline" title="No conversations yet" subtitle="Your past chats will appear here." />
            ) : (
              history.map((h) => (
                <Pressable
                  key={h.id}
                  onPress={() => void resume(h.id)}
                  className="mt-2 flex-row items-center justify-between rounded-2xl border border-line/60 bg-white px-4 py-3 active:opacity-70"
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-medium text-ink" numberOfLines={1}>
                      {h.title ?? 'Conversation'}
                    </Text>
                    <Text className="mt-0.5 text-xs text-ink-faint">
                      {h.messageCount} messages{h.lastMessageAt ? ` · ${new Date(h.lastMessageAt).toLocaleDateString()}` : ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => void remove(h.id)} hitSlop={8} className="h-8 w-8 items-center justify-center">
                    <Ionicons name="trash-outline" size={16} color="#94a3b8" />
                  </Pressable>
                </Pressable>
              ))
            )}
          </ScrollView>
        ) : (
        <ScrollView ref={scrollRef} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })} showsVerticalScrollIndicator={false}>
          {chat.entitled === false ? (
            <EmptyState icon="chatbubble-ellipses-outline" title="AI Copilot isn't enabled" subtitle="Not available for your school yet." />
          ) : chat.messages.length === 0 ? (
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Ask me anything"
              subtitle='e.g. "How many leads came in this week?"'
            />
          ) : (
            chat.messages.map((m) => (
              <MessageBubble key={m.id} msg={m} onConfirm={() => chat.confirmAction(m)} onCancel={() => chat.cancelAction(m)} />
            ))
          )}
          {chat.error ? <Text className="mt-2 text-xs text-bad">{chat.error}</Text> : null}
        </ScrollView>
        )}

        {view === 'chat' && (
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
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  )
}
