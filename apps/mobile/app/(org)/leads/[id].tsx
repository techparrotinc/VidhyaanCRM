import { useState } from 'react'
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Screen,
  DetailHeader,
  Card,
  Button,
  Chip,
  IconCircle,
  FormScrollView
} from '@/components/ui'
import { useLead, useLogLeadActivity, useLogFollowUp } from '@/lib/leads'
import { FEATURE_ICONS } from '@/lib/icons'

/** Lead detail + follow-up logging (wireframe s-lead): call/WhatsApp
 *  intents, outcome chips → status, quick next-follow-up, timeline. */

const OUTCOMES: Array<{ label: string; status: string }> = [
  { label: 'Interested', status: 'INTERESTED' },
  { label: 'Call back', status: 'FOLLOW_UP_PENDING' },
  { label: 'Contacted', status: 'CONTACTED' },
  { label: 'Not interested', status: 'NOT_INTERESTED' }
]

const NEXT_OPTIONS: Array<{ label: string; days: number | null }> = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
  { label: 'None', days: null }
]

function statusTone(status: string): 'neutral' | 'good' | 'bad' | 'warn' {
  if (status === 'CONVERTED') return 'good'
  if (status === 'NOT_INTERESTED') return 'bad'
  if (status === 'FOLLOW_UP_PENDING') return 'warn'
  return 'neutral'
}

function timeAgo(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function LeadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: lead, isLoading } = useLead(id)
  const logActivity = useLogLeadActivity()
  const followUp = useLogFollowUp()

  const [outcome, setOutcome] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [nextDays, setNextDays] = useState<number | null>(1)
  const [saved, setSaved] = useState(false)

  const call = () => {
    if (!lead) return
    Linking.openURL(`tel:${lead.phone}`)
    logActivity.mutate({ leadId: lead.id, type: 'CALL', summary: 'Called from mobile app' })
  }
  const whatsapp = () => {
    if (!lead) return
    Linking.openURL(`https://wa.me/91${lead.phone}`)
    logActivity.mutate({ leadId: lead.id, type: 'WHATSAPP', summary: 'Messaged from mobile app' })
  }

  const save = async () => {
    if (!lead) return
    const next =
      nextDays === null ? null : new Date(Date.now() + nextDays * 86_400_000).toISOString()
    await followUp.mutateAsync({
      leadId: lead.id,
      status: outcome ?? undefined,
      nextFollowUpAt: next,
      note: note || undefined
    })
    setSaved(true)
    setNote('')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Screen header={<DetailHeader title={lead?.parentName ?? 'Lead'} onBack={() => router.back()} />}>
      {isLoading || !lead ? (
        <View className="mt-10 items-center">
          <ActivityIndicator color="#1565D8" />
        </View>
      ) : (
        <FormScrollView>
          <Card className="mt-2 flex-row items-center gap-3">
            <IconCircle accent="brand" icon={FEATURE_ICONS.leads.icon} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-ink">{lead.parentName}</Text>
              <Text className="text-xs text-ink-secondary">
                {[lead.kidName, lead.gradeSought, lead.leadCode].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Chip label={lead.status.replace(/_/g, ' ')} tone={statusTone(lead.status)} />
          </Card>

          <View className="mt-3 flex-row gap-2">
            <Pressable onPress={call} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 active:opacity-80">
              <Ionicons name="call" size={14} color="#fff" />
              <Text className="text-sm font-semibold text-white">Call</Text>
            </Pressable>
            <Pressable onPress={whatsapp} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-line bg-white py-2.5 active:opacity-70">
              <Ionicons name="logo-whatsapp" size={15} color="#0D9488" />
              <Text className="text-sm font-semibold text-attend">WhatsApp</Text>
            </Pressable>
          </View>

          <Text className="mt-5 text-[11px] font-bold uppercase tracking-widest text-ink-faint">
            Log follow-up
          </Text>
          <Card className="mt-2 gap-3">
            <View className="flex-row flex-wrap gap-1.5">
              {OUTCOMES.map((o) => (
                <Pressable
                  key={o.status}
                  onPress={() => setOutcome(outcome === o.status ? null : o.status)}
                  className={`rounded-full px-3 py-1.5 ${outcome === o.status ? 'bg-brand' : 'border border-line'}`}
                >
                  <Text className={`text-xs font-semibold ${outcome === o.status ? 'text-white' : 'text-ink-secondary'}`}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Note (optional)"
              multiline
              className="min-h-[44px] rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
            />
            <View className="flex-row items-center gap-1.5">
              <Text className="text-xs text-ink-faint">Next:</Text>
              {NEXT_OPTIONS.map((n) => (
                <Pressable
                  key={n.label}
                  onPress={() => setNextDays(n.days)}
                  className={`rounded-full px-2.5 py-1 ${nextDays === n.days ? 'bg-brand-soft' : ''}`}
                >
                  <Text className={`text-[11px] font-semibold ${nextDays === n.days ? 'text-brand' : 'text-ink-secondary'}`}>
                    {n.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button
              label={saved ? 'Saved ✓' : 'Save follow-up'}
              onPress={save}
              loading={followUp.isPending}
              disabled={!outcome && !note}
            />
          </Card>

          <Text className="mt-5 text-[11px] font-bold uppercase tracking-widest text-ink-faint">
            Timeline
          </Text>
          {lead.activities.length === 0 ? (
            <Text className="mt-2 text-sm text-ink-faint">No activity yet.</Text>
          ) : (
            lead.activities.map((a) => (
              <Card key={a.id} className="mt-2">
                <Text className="text-sm text-ink">{a.summary}</Text>
                <Text className="mt-0.5 text-xs text-ink-faint">
                  {a.type} · {timeAgo(a.createdAt)}
                </Text>
              </Card>
            ))
          )}
          <View className="h-6" />
        </FormScrollView>
      )}
    </Screen>
  )
}
