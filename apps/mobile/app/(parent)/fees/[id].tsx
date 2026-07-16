import { Text, View, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Screen, DetailHeader, Card, Button, EmptyState } from '@/components/ui'
import { useParentInvoices } from '@/lib/parent-fees'

function formatDate(d: Date | string | null): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function InvoiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: invoices, isLoading } = useParentInvoices()
  const invoice = invoices?.find((i) => i.id === id)

  if (isLoading) {
    return (
      <Screen header={<DetailHeader title="Invoice" onBack={() => router.back()} accent="fees" />}>
        <View className="mt-8 items-center">
          <ActivityIndicator color="#1565D8" />
        </View>
      </Screen>
    )
  }

  if (!invoice) {
    return (
      <Screen header={<DetailHeader title="Invoice" onBack={() => router.back()} accent="fees" />}>
        <EmptyState icon="receipt-outline" title="Invoice not found" />
      </Screen>
    )
  }

  const paid = invoice.status === 'PAID'

  return (
    <Screen
      header={
        <DetailHeader
          title={invoice.termName ?? invoice.courseName ?? invoice.invoiceType}
          onBack={() => router.back()}
          accent="fees"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
        <Card>
          <Text className="text-xs text-ink-faint">
            {invoice.invoiceNumber} · {invoice.studentName}
            {invoice.gradeLabel ? ` · ${invoice.gradeLabel}` : ''}
          </Text>
          <View className="mt-3 border-t border-line pt-3">
            {invoice.items.map((item, i) => (
              <View key={i} className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm text-ink-secondary">{item.head}</Text>
                <Text className="text-sm text-ink">₹{item.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
          <View className="mt-2 flex-row items-center justify-between border-t border-line pt-3">
            <Text className="text-sm font-semibold text-ink">
              {paid ? 'Total paid' : 'Total due'}
            </Text>
            <Text className={`text-lg font-bold ${paid ? 'text-good' : 'text-fees'}`}>
              ₹{(paid ? invoice.paidAmount : invoice.balance).toLocaleString('en-IN')}
            </Text>
          </View>
        </Card>
        {invoice.dueDate ? (
          <Text className="mt-3 text-xs text-ink-faint">Due {formatDate(invoice.dueDate)}</Text>
        ) : null}
      </ScrollView>

      {!paid && invoice.balance > 0 ? (
        <View className="pb-2 pt-3">
          <Button
            label={`Pay ₹${invoice.balance.toLocaleString('en-IN')}`}
            variant="success"
            disabled={!invoice.payable}
            onPress={() => router.push(`/(parent)/fees/${invoice.id}/pay`)}
          />
        </View>
      ) : null}
    </Screen>
  )
}
