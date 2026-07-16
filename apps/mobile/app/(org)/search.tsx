import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, DetailHeader, Card, Chip, SearchBar, EmptyState } from '@/components/ui'
import { useGlobalSearch } from '@/lib/staff-extras'

/** Global search (wireframe s-search): students / leads / invoices, one box. */

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mt-4 text-[11px] font-bold uppercase tracking-widest text-ink-faint">{children}</Text>
  )
}

export default function GlobalSearch() {
  const [q, setQ] = useState('')
  const { data, isLoading } = useGlobalSearch(q)
  const hasResults = data && (data.students.length || data.leads.length || data.invoices.length)

  return (
    <Screen header={<DetailHeader title="Search" onBack={() => router.back()} />}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="mt-2">
          <SearchBar value={q} onChangeText={setQ} placeholder="Students, leads, guardians, invoices…" />
        </View>

        {q.trim().length < 2 ? (
          <EmptyState icon="search-outline" title="Search everything" subtitle="Names, phones, codes, invoice numbers — one box." />
        ) : isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#1565D8" />
          </View>
        ) : !hasResults ? (
          <EmptyState icon="search-outline" title="No matches" subtitle="Try fewer characters or a phone number." />
        ) : (
          <>
            {data.students.length > 0 ? (
              <>
                <SectionLabel>Students</SectionLabel>
                {data.students.map((s) => (
                  <Pressable key={s.id} onPress={() => router.push(`/(org)/students/${s.id}` as never)} className="active:opacity-70">
                    <Card className="mt-2">
                      <Text className="text-sm font-semibold text-ink">{s.name}</Text>
                      <Text className="text-xs text-ink-secondary">
                        {[[s.gradeLabel, s.section].filter(Boolean).join('-'), s.guardianName, s.studentCode]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </Card>
                  </Pressable>
                ))}
              </>
            ) : null}

            {data.leads.length > 0 ? (
              <>
                <SectionLabel>Leads / enquiries</SectionLabel>
                {data.leads.map((l) => (
                  <Pressable key={l.id} onPress={() => router.push(`/(org)/leads/${l.id}` as never)} className="active:opacity-70">
                    <Card className="mt-2 flex-row items-center justify-between gap-2">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-ink">{l.parentName}</Text>
                        <Text className="text-xs text-ink-secondary">
                          {[l.kidName, l.gradeSought].filter(Boolean).join(' · ') || '—'}
                        </Text>
                      </View>
                      <Chip label={l.status.replace(/_/g, ' ').toLowerCase()} tone="warn" />
                    </Card>
                  </Pressable>
                ))}
              </>
            ) : null}

            {data.invoices.length > 0 ? (
              <>
                <SectionLabel>Invoices</SectionLabel>
                {data.invoices.map((i) => (
                  <Pressable key={i.id} onPress={() => router.push('/(org)/fees' as never)} className="active:opacity-70">
                    <Card className="mt-2 flex-row items-center justify-between gap-2">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-ink">
                          {i.invoiceNumber} · {i.studentName}
                        </Text>
                        <Text className="text-xs text-ink-secondary">{inr(i.balance)} balance</Text>
                      </View>
                      <Chip
                        label={i.status.replace(/_/g, ' ').toLowerCase()}
                        tone={i.status === 'PAID' ? 'good' : 'warn'}
                      />
                    </Card>
                  </Pressable>
                ))}
              </>
            ) : null}
          </>
        )}
        <View className="h-6" />
      </ScrollView>
    </Screen>
  )
}
