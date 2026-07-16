import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, PastelStat, ListRow } from '@/components/ui'
import { useAdminStats } from '@/lib/admin'

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export default function Pulse() {
  const { data, isLoading, isError, refetch } = useAdminStats()

  return (
    <Screen header={<GradientHeader title="Platform Pulse" accent="brand" />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#1565D8" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load platform stats. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data ? (
          <>
            <View className="mt-3 flex-row flex-wrap gap-3">
              <View style={{ minWidth: '46%', flexGrow: 1 }}>
                <PastelStat label="Active orgs" value={data.organizations.active} accent="brand" />
              </View>
              <View style={{ minWidth: '46%', flexGrow: 1 }}>
                <PastelStat label="Signups this month" value={data.organizations.newThisMonth} accent="events" />
              </View>
              <View style={{ minWidth: '46%', flexGrow: 1 }}>
                <PastelStat label="MRR" value={inr(data.revenue.mrr)} accent="fees" />
              </View>
              <View style={{ minWidth: '46%', flexGrow: 1 }}>
                <PastelStat
                  label="Uptime (7d)"
                  value={data.ops.uptimePct !== null ? `${data.ops.uptimePct}%` : '—'}
                  accent="attend"
                />
              </View>
            </View>

            {data.ops.failedPaymentsThisWeek > 0 ? (
              <Card className="mt-3 border-warn/40 bg-warn-bg">
                <Text className="text-xs font-semibold text-warn">
                  {data.ops.failedPaymentsThisWeek} failed payment{data.ops.failedPaymentsThisWeek === 1 ? '' : 's'} this week
                </Text>
              </Card>
            ) : null}
          </>
        ) : null}

        <View className="mt-4">
          <ListRow
            title="Billing alerts"
            icon="alert-circle-outline"
            accent="events"
            onPress={() => router.push('/(admin)/billing-alerts')}
          />
        </View>

        <Text className="mt-5 text-[11px] font-bold uppercase tracking-widest text-ink-faint">Moderation</Text>
        <View className="mt-3 gap-2.5">
          <ListRow
            title="Flagged reviews"
            icon="flag-outline"
            accent="brand"
            onPress={() => router.push('/(admin)/review-flags')}
          />
          <ListRow
            title="WhatsApp templates"
            icon="logo-whatsapp"
            accent="attend"
            onPress={() => router.push('/(admin)/templates')}
          />
          <ListRow
            title="Publish announcement"
            icon="megaphone-outline"
            accent="events"
            onPress={() => router.push('/(admin)/announce')}
          />
        </View>
      </ScrollView>
    </Screen>
  )
}
