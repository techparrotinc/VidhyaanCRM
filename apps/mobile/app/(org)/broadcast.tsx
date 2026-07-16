import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Button } from '@/components/ui'
import { useAdoptedTemplates, useAudienceCount, useSendBroadcast, audiencePool, type AudiencePool } from '@/lib/broadcast'

const POOL_LABEL: Record<AudiencePool, string> = { LEADS: 'Leads', STUDENTS: 'Students', BOTH: 'Leads + Students' }

export default function Broadcast() {
  const templates = useAdoptedTemplates()
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [pool, setPool] = useState<AudiencePool>('BOTH')
  const audience = useAudienceCount(pool)
  const send = useSendBroadcast()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedTemplate = templates.data?.find((t) => t.id === templateId)

  const submit = async () => {
    if (!selectedTemplate) return
    setError(null)
    try {
      await send.mutateAsync({ name: `${selectedTemplate.name} — ${new Date().toLocaleDateString('en-IN')}`, pool, whatsappTemplateId: selectedTemplate.id })
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send')
    }
  }

  return (
    <Screen
      header={
        <GradientHeader
          title="Broadcast"
          subtitle="WhatsApp announcement"
          accent="events"
          right={
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
              <Text className="text-lg font-bold text-white">×</Text>
            </Pressable>
          }
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {sent ? (
          <Card className="mt-4 items-center gap-2 border-good/40 bg-good-bg">
            <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
            <Text className="text-sm font-semibold text-good">Broadcast sent</Text>
          </Card>
        ) : (
          <>
            <Card className="mt-3">
              <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Template</Text>
              {templates.isLoading ? (
                <View className="mt-3 items-center">
                  <ActivityIndicator color="#EA580C" />
                </View>
              ) : templates.data && templates.data.length > 0 ? (
                <View className="mt-2 gap-2">
                  {templates.data.map((t) => (
                    <Pressable
                      key={t.id}
                      onPress={() => setTemplateId(t.id)}
                      className={`rounded-xl border px-3 py-2.5 ${templateId === t.id ? 'border-events bg-events-soft' : 'border-line'}`}
                    >
                      <Text className={`text-sm font-semibold ${templateId === t.id ? 'text-events' : 'text-ink'}`}>{t.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text className="mt-2 text-xs text-ink-secondary">No approved WhatsApp templates yet — set one up on the web app first.</Text>
              )}
            </Card>

            <Card className="mt-3">
              <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Audience</Text>
              <View className="mt-2 flex-row gap-2">
                {audiencePool.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPool(p)}
                    className={`rounded-full px-3 py-1.5 ${pool === p ? 'bg-events' : 'border border-line'}`}
                  >
                    <Text className={`text-xs font-semibold ${pool === p ? 'text-white' : 'text-ink-secondary'}`}>{POOL_LABEL[p]}</Text>
                  </Pressable>
                ))}
              </View>
              <Text className="mt-2 text-xs text-ink-secondary">
                {audience.isLoading ? 'Counting…' : `~${audience.data ?? 0} recipients`}
              </Text>
            </Card>

            {error ? <Text className="mt-3 text-xs text-bad">{error}</Text> : null}

            <View className="mt-4">
              <Button
                label={send.isPending ? 'Sending…' : 'Send broadcast'}
                onPress={submit}
                disabled={!selectedTemplate || (audience.data ?? 0) === 0}
                loading={send.isPending}
              />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  )
}
