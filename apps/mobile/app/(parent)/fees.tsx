import { useMemo, useState } from 'react'
import { Text, View, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Chip, EmptyState } from '@/components/ui'
import { useParentInvoices, OPEN_STATUSES, type ParentInvoice } from '@/lib/parent-fees'

function formatDate(d: Date | string | null): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dueChip(invoice: ParentInvoice) {
  if (invoice.status === 'OVERDUE') {
    const days = invoice.dueDate
      ? Math.max(1, Math.round((Date.now() - new Date(invoice.dueDate).getTime()) / 86_400_000))
      : null
    return <Chip label={days ? `Overdue ${days}d` : 'Overdue'} tone="bad" />
  }
  if (invoice.dueDate) return <Chip label={`Due ${formatDate(invoice.dueDate)}`} tone="warn" />
  return null
}

function InvoiceCard({ invoice }: { invoice: ParentInvoice }) {
  const paid = invoice.status === 'PAID'
  return (
    <Pressable
      onPress={() => router.push(`/(parent)/fees/${invoice.id}`)}
      className="active:opacity-80"
    >
      <Card className="mt-3">
        <View className="flex-row items-start justify-between">
          <Text className="flex-1 text-sm font-semibold text-ink">
            {invoice.termName ?? invoice.courseName ?? invoice.invoiceType} · {invoice.invoiceNumber}
          </Text>
          {paid ? <Chip label="Paid" tone="good" /> : dueChip(invoice)}
        </View>
        <View className="mt-1.5 flex-row items-center justify-between">
          <Text className="text-xs text-ink-faint">Amount</Text>
          <Text className="text-sm font-medium text-ink">
            ₹{(paid ? invoice.paidAmount : invoice.balance).toLocaleString('en-IN')}
          </Text>
        </View>
      </Card>
    </Pressable>
  )
}

export default function Fees() {
  const { data: invoices, isLoading, isError, refetch, isRefetching } = useParentInvoices()
  const [kidFilter, setKidFilter] = useState<string | null>(null)

  const kidNames = useMemo(
    () => [...new Set((invoices ?? []).map((i) => i.studentName))],
    [invoices]
  )

  const filtered = useMemo(
    () => (invoices ?? []).filter((i) => !kidFilter || i.studentName === kidFilter),
    [invoices, kidFilter]
  )
  const open = filtered.filter((i) => (OPEN_STATUSES as readonly string[]).includes(i.status))
  const paid = filtered.filter((i) => i.status === 'PAID')
  const totalDue = open.reduce((sum, i) => sum + i.balance, 0)

  return (
    <Screen
      header={
        <GradientHeader
          title="Fees"
          subtitle={totalDue > 0 ? `₹${totalDue.toLocaleString('en-IN')} due across ${open.length} invoice${open.length > 1 ? 's' : ''}` : 'All caught up'}
          accent="fees"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        {kidNames.length > 1 ? (
          <View className="flex-row flex-wrap gap-2">
            <Pressable onPress={() => setKidFilter(null)}>
              <Chip label="All" selected={kidFilter === null} />
            </Pressable>
            {kidNames.map((name) => (
              <Pressable key={name} onPress={() => setKidFilter(name)}>
                <Chip label={name} selected={kidFilter === name} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#1565D8" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load fees. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">
                {isRefetching ? 'Retrying…' : 'Retry'}
              </Text>
            </Pressable>
          </Card>
        ) : (
          <>
            <Text className="mt-4 text-[11px] font-bold uppercase tracking-widest text-ink-faint">
              Open
            </Text>
            {open.length > 0 ? (
              open.map((inv) => <InvoiceCard key={inv.id} invoice={inv} />)
            ) : (
              <EmptyState icon="checkmark-circle-outline" title="No open invoices" />
            )}

            <Text className="mt-6 text-[11px] font-bold uppercase tracking-widest text-ink-faint">
              Paid
            </Text>
            {paid.length > 0 ? (
              paid.map((inv) => <InvoiceCard key={inv.id} invoice={inv} />)
            ) : (
              <EmptyState icon="receipt-outline" title="No paid invoices yet" />
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}
