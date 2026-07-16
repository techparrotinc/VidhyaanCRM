import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Chip, EmptyState } from '@/components/ui'
import { useAdminOrgs, type AdminOrg } from '@/lib/admin'

function OrgAlertRow({ org, tone }: { org: AdminOrg; tone: 'bad' | 'warn' }) {
  return (
    <Card className="mt-3 flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-sm font-semibold text-ink">{org.name}</Text>
        <Text className="text-xs text-ink-faint">{org.plan?.name ?? 'No plan'}</Text>
      </View>
      <Chip label={org.status.replace(/_/g, ' ')} tone={tone} />
    </Card>
  )
}

function AlertSection({ title, status, tone }: { title: string; status: string; tone: 'bad' | 'warn' }) {
  const { data, isLoading, isError } = useAdminOrgs(status)

  return (
    <View className="mt-4">
      <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
        {title}
        {data ? ` (${data.pagination.total})` : ''}
      </Text>
      {isLoading ? (
        <View className="mt-3 items-center">
          <ActivityIndicator color="#1565D8" />
        </View>
      ) : isError ? (
        <Text className="mt-2 text-xs text-bad">Couldn't load.</Text>
      ) : data && data.data.length > 0 ? (
        data.data.map((org) => <OrgAlertRow key={org.id} org={org} tone={tone} />)
      ) : (
        <EmptyState icon="checkmark-circle-outline" title="None right now" />
      )}
    </View>
  )
}

export default function BillingAlerts() {
  return (
    <Screen
      header={
        <GradientHeader
          title="Billing Alerts"
          accent="fees"
          right={
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
              <Text className="text-lg font-bold text-white">×</Text>
            </Pressable>
          }
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <AlertSection title="Failed renewals (past due)" status="PAST_DUE" tone="bad" />
        <AlertSection title="Grace period (expiring soon)" status="GRACE_PERIOD" tone="warn" />
      </ScrollView>
    </Screen>
  )
}
