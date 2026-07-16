import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, DetailHeader, Card } from '@/components/ui'
import { useCollections, type CollectionsPeriod } from '@/lib/staff-extras'

/** Collections (wireframe s-collections): granularity chips + hero card for
 *  the selected period, comparison bars for the other two. */

type Granularity = 'month' | 'quarter' | 'year'
const CHIPS: Array<{ value: Granularity; label: string }> = [
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' }
]

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4
  return (
    <View className="mt-1 h-2 overflow-hidden rounded-full bg-line-soft">
      <View className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
    </View>
  )
}

function HeroCard({ title, p }: { title: string; p: CollectionsPeriod }) {
  return (
    <Card className="mt-3">
      <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
        {title} · {p.label}
      </Text>
      <Text className="mt-3 text-[32px] font-bold leading-none tracking-tight text-ink">
        {inr(p.amount)}
      </Text>
      {p.deltaPct !== null ? (
        <Text className={`mt-3 text-sm font-semibold ${p.deltaPct >= 0 ? 'text-good' : 'text-bad'}`}>
          {p.deltaPct >= 0 ? '▲' : '▼'} {Math.abs(p.deltaPct)}% vs {p.prevLabel} ({inr(p.prevAmount)})
        </Text>
      ) : (
        <Text className="mt-3 text-sm text-ink-faint">
          {p.prevLabel}: {inr(p.prevAmount)}
        </Text>
      )}
    </Card>
  )
}

function CompareCard({ title, p }: { title: string; p: CollectionsPeriod }) {
  const max = Math.max(p.amount, p.prevAmount)
  return (
    <Card className="mt-3">
      <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">
        {title} · {p.label}
      </Text>
      <View className="mt-2.5 flex-row items-center justify-between">
        <Text className="text-sm text-ink-secondary">{p.label}</Text>
        <Text className="text-sm font-bold text-ink">{inr(p.amount)}</Text>
      </View>
      <Bar value={p.amount} max={max} />
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-sm text-ink-secondary">{p.prevLabel}</Text>
        <Text className="text-sm font-semibold text-ink-secondary">{inr(p.prevAmount)}</Text>
      </View>
      <Bar value={p.prevAmount} max={max} />
    </Card>
  )
}

export default function Collections() {
  const { data, isLoading } = useCollections()
  const [granularity, setGranularity] = useState<Granularity>('month')

  const titles: Record<Granularity, string> = { month: 'This month', quarter: 'Quarter', year: 'Year' }

  return (
    <Screen header={<DetailHeader title="Collections" onBack={() => router.back()} />}>
      {isLoading || !data ? (
        <View className="mt-10 items-center">
          <ActivityIndicator color="#1565D8" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mt-2 flex-row gap-1.5">
            {CHIPS.map((c) => (
              <Pressable
                key={c.value}
                onPress={() => setGranularity(c.value)}
                className={`rounded-full px-4 py-2 ${granularity === c.value ? 'bg-brand' : 'border border-line bg-white'}`}
              >
                <Text className={`text-sm font-semibold ${granularity === c.value ? 'text-white' : 'text-ink-secondary'}`}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <HeroCard title={titles[granularity]} p={data[granularity]} />
          {(['month', 'quarter', 'year'] as Granularity[])
            .filter((g) => g !== granularity)
            .map((g) => (
              <CompareCard key={g} title={titles[g]} p={data[g]} />
            ))}

          <Text className="mt-3 text-xs text-ink-faint">
            Successful payments only · FY = Apr–Mar
          </Text>
          <View className="h-6" />
        </ScrollView>
      )}
    </Screen>
  )
}
