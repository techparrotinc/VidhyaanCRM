import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, DetailHeader, Card } from '@/components/ui'
import { useCollections, type CollectionsPeriod } from '@/lib/staff-extras'

/** Collections M/Q/Y with previous-period comparison (wireframe s-collections). */

function inr(n: number): string {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(n >= 1_000_000 ? 0 : 1)}L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4
  return (
    <View className="mt-1 h-2 overflow-hidden rounded-full bg-line-soft">
      <View className="h-full rounded-full bg-fees" style={{ width: `${pct}%` }} />
    </View>
  )
}

function PeriodCard({ title, p }: { title: string; p: CollectionsPeriod }) {
  const max = Math.max(p.amount, p.prevAmount)
  return (
    <Card className="mt-3">
      <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">{title}</Text>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-sm text-ink-secondary">{p.label}</Text>
        <Text className="text-base font-bold text-ink">{inr(p.amount)}</Text>
      </View>
      <Bar value={p.amount} max={max} />
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-sm text-ink-secondary">{p.prevLabel}</Text>
        <Text className="text-sm font-semibold text-ink-secondary">{inr(p.prevAmount)}</Text>
      </View>
      <Bar value={p.prevAmount} max={max} />
      {p.deltaPct !== null ? (
        <Text className={`mt-2 text-xs font-semibold ${p.deltaPct >= 0 ? 'text-good' : 'text-bad'}`}>
          {p.deltaPct >= 0 ? '▲' : '▼'} {Math.abs(p.deltaPct)}% vs {p.prevLabel}
        </Text>
      ) : null}
    </Card>
  )
}

export default function Collections() {
  const { data, isLoading } = useCollections()

  return (
    <Screen header={<DetailHeader title="Collections" onBack={() => router.back()} accent="fees" />}>
      {isLoading || !data ? (
        <View className="mt-10 items-center">
          <ActivityIndicator color="#7C3AED" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <PeriodCard title="This month" p={data.month} />
          <PeriodCard title="Quarter" p={data.quarter} />
          <PeriodCard title="Financial year" p={data.year} />
          <Text className="mt-3 text-xs text-ink-faint">
            Successful payments only · FY = Apr–Mar
          </Text>
          <View className="h-6" />
        </ScrollView>
      )}
    </Screen>
  )
}
