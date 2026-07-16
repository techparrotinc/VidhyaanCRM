import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { Screen, DetailHeader, Card, Avatar, Chip } from '@/components/ui'
import { useStudent } from '@/lib/students'

/** Student profile (wireframe s-student): identity + guardian contact +
 *  recent invoices; full record stays on web. */

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export default function StudentProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: s, isLoading, isError, refetch } = useStudent(id)

  const call = () => s?.guardianPhone && Linking.openURL(`tel:${s.guardianPhone}`)
  const whatsapp = () => s?.guardianPhone && Linking.openURL(`https://wa.me/91${s.guardianPhone}`)

  const openInvoices = (s?.invoices ?? []).filter((i) => i.status !== 'PAID' && i.status !== 'WAIVED')

  return (
    <Screen header={<DetailHeader title={s?.name ?? 'Student'} onBack={() => router.back()} />}>
      {isError ? (
        <Card className="mt-4">
          <Text className="text-sm text-bad">Couldn't load this student.</Text>
          <Pressable onPress={() => refetch()} className="mt-2">
            <Text className="text-sm font-semibold text-brand">Retry</Text>
          </Pressable>
        </Card>
      ) : isLoading || !s ? (
        <View className="mt-10 items-center">
          <ActivityIndicator color="#1565D8" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card className="mt-2 flex-row items-center gap-3">
            <Avatar name={s.name} size={48} accent="brand" />
            <View className="flex-1">
              <Text className="text-base font-bold text-ink">{s.name}</Text>
              <Text className="text-xs text-ink-secondary">
                {[
                  [s.gradeLabel, s.section].filter(Boolean).join('-'),
                  s.rollNumber ? `Roll ${s.rollNumber}` : null,
                  s.studentCode
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          </Card>

          {s.guardianPhone ? (
            <View className="mt-3 flex-row gap-2">
              <Pressable onPress={call} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 active:opacity-80">
                <Ionicons name="call" size={14} color="#fff" />
                <Text className="text-sm font-semibold text-white">Call guardian</Text>
              </Pressable>
              <Pressable onPress={whatsapp} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-line bg-white py-2.5 active:opacity-70">
                <Ionicons name="logo-whatsapp" size={15} color="#0D9488" />
                <Text className="text-sm font-semibold text-attend">WhatsApp</Text>
              </Pressable>
            </View>
          ) : null}

          <Card className="mt-3">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Guardian</Text>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm text-ink-secondary">{s.guardianName ?? '—'}</Text>
              <Text className="text-sm font-semibold text-ink">{s.guardianPhone ?? ''}</Text>
            </View>
            {s.guardianEmail ? <Text className="mt-1 text-xs text-ink-faint">{s.guardianEmail}</Text> : null}
          </Card>

          <Card className="mt-3">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Fees</Text>
            {s.invoices.length === 0 ? (
              <Text className="mt-2 text-sm text-ink-faint">No invoices yet.</Text>
            ) : (
              s.invoices.map((inv) => (
                <View key={inv.id} className="mt-2 flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm text-ink">{inv.invoiceNumber}</Text>
                    {inv.dueDate ? (
                      <Text className="text-xs text-ink-faint">
                        due {inv.dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="mr-2 text-sm font-semibold text-ink">{inr(inv.totalAmount)}</Text>
                  <Chip
                    label={inv.status.replace(/_/g, ' ').toLowerCase()}
                    tone={inv.status === 'PAID' ? 'good' : inv.status === 'OVERDUE' ? 'bad' : 'warn'}
                  />
                </View>
              ))
            )}
            {openInvoices.length > 0 ? (
              <Pressable onPress={() => router.push('/(org)/fees' as never)} className="mt-3 active:opacity-70">
                <Text className="text-sm font-semibold text-fees">Collect in Fees tab ›</Text>
              </Pressable>
            ) : null}
          </Card>
          <View className="h-6" />
        </ScrollView>
      )}
    </Screen>
  )
}
