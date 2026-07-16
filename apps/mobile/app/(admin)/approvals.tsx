import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Screen, GradientHeader, Card, Button, EmptyState } from '@/components/ui'
import { useAdminOrgs, useOrgApprovalAction, type AdminOrg } from '@/lib/admin'

/** RN has no in-app confirm-dialog component here (that's a web-only piece
 *  of the UI kit) — Alert.alert is this app's established pattern, same as
 *  (parent)/more.tsx's delete-account confirm. */
function confirmAsync(title: string, message: string, confirmLabel: string, destructive: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) }
    ])
  })
}

function OrgRow({ org }: { org: AdminOrg }) {
  const action = useOrgApprovalAction()
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const approve = async () => {
    const ok = await confirmAsync('Approve org?', `${org.name} will get full access immediately.`, 'Approve', false)
    if (!ok) return
    await action.mutateAsync({ orgId: org.id, status: 'ACTIVE', notes: 'Approved via mobile' })
  }

  const reject = async () => {
    if (!reason.trim()) return setError('A reason is required')
    setError(null)
    const ok = await confirmAsync('Reject org?', `${org.name} will be suspended pending review.\n\nReason: "${reason}"`, 'Reject', true)
    if (!ok) return
    await action.mutateAsync({ orgId: org.id, status: 'SUSPENDED', notes: reason.trim() })
    setShowReject(false)
  }

  return (
    <Card className="mt-3">
      <Text className="text-sm font-semibold text-ink">{org.name}</Text>
      <Text className="text-xs text-ink-faint">
        {[org.email, org.phone].filter(Boolean).join(' · ')} · applied {org.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </Text>

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={() => setShowReject((v) => !v)}
          className="flex-1 items-center rounded-xl border border-bad/40 py-2 active:opacity-70"
        >
          <Text className="text-xs font-semibold text-bad">{showReject ? 'Cancel' : 'Reject'}</Text>
        </Pressable>
        <Pressable onPress={approve} disabled={action.isPending} className="flex-1 items-center rounded-xl bg-good py-2 active:opacity-70">
          <Text className="text-xs font-semibold text-white">{action.isPending ? 'Working…' : 'Approve'}</Text>
        </Pressable>
      </View>

      {showReject ? (
        <View className="mt-3 gap-2 border-t border-line pt-3">
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Reason for rejection"
            className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
          />
          {error ? <Text className="text-xs text-bad">{error}</Text> : null}
          <Button label="Confirm reject" variant="danger" onPress={reject} loading={action.isPending} />
        </View>
      ) : null}
    </Card>
  )
}

export default function Approvals() {
  const { data, isLoading, isError, refetch } = useAdminOrgs('PENDING_VERIFICATION')

  return (
    <Screen header={<GradientHeader title="Approvals" subtitle={data ? `${data.pagination.total} pending` : undefined} accent="brand" />}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#1565D8" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load approvals. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data && data.data.length > 0 ? (
          data.data.map((org) => <OrgRow key={org.id} org={org} />)
        ) : (
          <EmptyState icon="checkmark-circle-outline" title="All caught up" subtitle="Nothing pending." />
        )}
      </ScrollView>
    </Screen>
  )
}
