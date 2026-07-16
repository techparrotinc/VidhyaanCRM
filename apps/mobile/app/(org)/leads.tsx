import { useState } from 'react'
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, GradientHeader, Card, Button, Chip, IconCircle, SearchBar, EmptyState, FormScrollView } from '@/components/ui'
import { useAuthStore } from '@/lib/auth-store'
import { useLeads, useCreateLead, useLogLeadActivity, useSnoozeLead, type Lead } from '@/lib/leads'
import { FEATURE_ICONS } from '@/lib/icons'

const SNOOZE_ROLES = new Set(['ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR'])

function statusTone(status: string): 'neutral' | 'good' | 'bad' | 'warn' {
  if (status === 'CONVERTED') return 'good'
  if (status === 'NOT_INTERESTED') return 'bad'
  if (status === 'FOLLOW_UP_PENDING') return 'warn'
  return 'neutral'
}

function QuickAddForm({ onClose }: { onClose: () => void }) {
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [gradeSought, setGradeSought] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createLead = useCreateLead()

  const submit = async () => {
    setError(null)
    if (parentName.trim().length < 2) return setError('Name is required')
    if (phone.trim().length !== 10) return setError('Phone must be 10 digits')
    try {
      await createLead.mutateAsync({ parentName: parentName.trim(), phone: phone.trim(), gradeSought: gradeSought.trim() || undefined })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add lead')
    }
  }

  return (
    <Card className="mt-3 gap-3">
      <TextInput
        value={parentName}
        onChangeText={setParentName}
        placeholder="Parent name"
        className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
      />
      <TextInput
        value={phone}
        onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, '').slice(0, 10))}
        placeholder="Phone (10 digits)"
        keyboardType="phone-pad"
        className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
      />
      <TextInput
        value={gradeSought}
        onChangeText={setGradeSought}
        placeholder="Class / grade (optional)"
        className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
      />
      {error ? <Text className="text-xs text-bad">{error}</Text> : null}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button label="Cancel" variant="quiet" onPress={onClose} />
        </View>
        <View className="flex-1">
          <Button label="Add lead" onPress={submit} loading={createLead.isPending} />
        </View>
      </View>
    </Card>
  )
}

function LeadRow({ lead, canSnooze }: { lead: Lead; canSnooze: boolean }) {
  const logActivity = useLogLeadActivity()
  const snooze = useSnoozeLead()

  const call = () => {
    Linking.openURL(`tel:${lead.phone}`)
    logActivity.mutate({ leadId: lead.id, type: 'CALL', summary: 'Called from mobile app' })
  }
  const whatsapp = () => {
    Linking.openURL(`https://wa.me/91${lead.phone}`)
    logActivity.mutate({ leadId: lead.id, type: 'WHATSAPP', summary: 'Messaged from mobile app' })
  }
  const snooze3Days = () => {
    const next = new Date()
    next.setDate(next.getDate() + 3)
    snooze.mutate({ leadId: lead.id, nextFollowUpAt: next.toISOString() })
  }

  return (
    <Card className="mt-3">
      <View className="flex-row items-start gap-3">
        <IconCircle accent="brand" icon={FEATURE_ICONS.leads.icon} />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{lead.parentName}</Text>
          <Text className="text-xs text-ink-secondary">
            {[lead.kidName, lead.gradeSought].filter(Boolean).join(' · ') || lead.leadCode}
          </Text>
        </View>
        <Chip label={lead.status.replace(/_/g, ' ')} tone={statusTone(lead.status)} />
      </View>

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={call}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-line py-2 active:opacity-70"
        >
          <Ionicons name="call-outline" size={14} color="#1565D8" />
          <Text className="text-xs font-semibold text-brand">Call</Text>
        </Pressable>
        <Pressable
          onPress={whatsapp}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-line py-2 active:opacity-70"
        >
          <Ionicons name="logo-whatsapp" size={14} color="#0D9488" />
          <Text className="text-xs font-semibold text-attend">WhatsApp</Text>
        </Pressable>
        {canSnooze ? (
          <Pressable
            onPress={snooze3Days}
            disabled={snooze.isPending}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-line py-2 active:opacity-70"
          >
            <Ionicons name="time-outline" size={14} color="#475569" />
            <Text className="text-xs font-semibold text-ink-secondary">
              {snooze.isPending ? '…' : 'Snooze 3d'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  )
}

export default function Leads() {
  const user = useAuthStore((s) => s.user)
  const canSnooze = SNOOZE_ROLES.has(user?.role ?? '')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const { data, isLoading, isError, refetch } = useLeads(search)

  return (
    <Screen
      header={
        <GradientHeader
          title="Leads"
          subtitle={data ? `${data.total} total` : undefined}
          accent="brand"
          right={
            <Pressable
              onPress={() => setShowAdd((v) => !v)}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70"
            >
              <Text className="text-2xl leading-none text-white">{showAdd ? '×' : '+'}</Text>
            </Pressable>
          }
        />
      }
    >
      <FormScrollView>
        {showAdd ? <QuickAddForm onClose={() => setShowAdd(false)} /> : null}

        <View className="mt-3">
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, phone, code…" />
        </View>

        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#1565D8" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load leads. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data && data.leads.length > 0 ? (
          data.leads.map((lead) => <LeadRow key={lead.id} lead={lead} canSnooze={canSnooze} />)
        ) : (
          <EmptyState icon="people-outline" title="No leads found" subtitle="Try a different search or add one." />
        )}
      </FormScrollView>
    </Screen>
  )
}
