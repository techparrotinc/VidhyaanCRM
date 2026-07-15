import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, StatTile } from '@/components/ui'
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
                <StatTile label="Active orgs" value={String(data.organizations.active)} hint={`${data.organizations.total} total`} />
              </View>
              <View style={{ minWidth: '46%', flexGrow: 1 }}>
                <StatTile label="Signups this month" value={String(data.organizations.newThisMonth)} hint={`${data.organizations.newLastMonth} last month`} />
              </View>
              <View style={{ minWidth: '46%', flexGrow: 1 }}>
                <StatTile label="MRR" value={inr(data.revenue.mrr)} hint={`${data.revenue.growthPct >= 0 ? '+' : ''}${data.revenue.growthPct}% MoM`} />
              </View>
              <View style={{ minWidth: '46%', flexGrow: 1 }}>
                <StatTile label="Uptime (7d)" value={data.ops.uptimePct !== null ? `${data.ops.uptimePct}%` : '—'} />
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

        <Pressable onPress={() => router.push('/(admin)/billing-alerts')} className="active:opacity-70">
          <Card className="mt-4 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-ink">Billing alerts</Text>
            <Text className="text-xs text-brand">View →</Text>
          </Card>
        </Pressable>

        <Text className="mt-5 text-[11px] font-bold uppercase tracking-widest text-ink-faint">Moderation</Text>
        <Pressable onPress={() => router.push('/(admin)/review-flags')} className="active:opacity-70">
          <Card className="mt-3 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-ink">Flagged reviews</Text>
            <Text className="text-xs text-brand">View →</Text>
          </Card>
        </Pressable>
        <Pressable onPress={() => router.push('/(admin)/templates')} className="active:opacity-70">
          <Card className="mt-3 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-ink">WhatsApp templates</Text>
            <Text className="text-xs text-brand">View →</Text>
          </Card>
        </Pressable>
        <Pressable onPress={() => router.push('/(admin)/announce')} className="active:opacity-70">
          <Card className="mt-3 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-ink">Publish announcement</Text>
            <Text className="text-xs text-brand">Compose →</Text>
          </Card>
        </Pressable>
      </ScrollView>
    </Screen>
  )
}
