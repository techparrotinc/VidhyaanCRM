import { useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Screen, GradientHeader, Card, Button, Chip } from '@/components/ui'
import {
  useOverdueInvoices,
  useRecordPayment,
  useSendPaymentLink,
  type OverdueInvoice,
  type PaymentMethod
} from '@/lib/fees-staff'

const METHODS: PaymentMethod[] = ['CASH', 'UPI', 'CHEQUE', 'DD', 'NEFT', 'BANK_TRANSFER', 'OTHER']
const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  DD: 'DD',
  NEFT: 'NEFT',
  BANK_TRANSFER: 'Bank transfer',
  OTHER: 'Other'
}

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function daysOverdue(dueDate: Date | null): number {
  if (!dueDate) return 0
  return Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / 86_400_000))
}

function RecordPaymentForm({ invoice, remaining, onClose }: { invoice: OverdueInvoice; remaining: number; onClose: () => void }) {
  const [amount, setAmount] = useState(String(remaining))
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [error, setError] = useState<string | null>(null)
  const record = useRecordPayment()

  const submit = async () => {
    setError(null)
    const value = Number(amount)
    if (!value || value <= 0) return setError('Enter a valid amount')
    if (value > remaining) return setError(`Cannot exceed ${inr(remaining)}`)
    try {
      await record.mutateAsync({ invoiceId: invoice.id, amount: value, method })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record payment')
    }
  }

  return (
    <View className="mt-3 gap-2.5 border-t border-line pt-3">
      <TextInput
        value={amount}
        onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        placeholder="Amount"
        className="rounded-xl border border-line px-3 py-2.5 text-sm text-ink"
      />
      <View className="flex-row flex-wrap gap-1.5">
        {METHODS.map((m) => (
          <Pressable
            key={m}
            onPress={() => setMethod(m)}
            className={`rounded-full px-2.5 py-1 ${method === m ? 'bg-fees' : 'border border-line'}`}
          >
            <Text className={`text-[11px] font-semibold ${method === m ? 'text-white' : 'text-ink-secondary'}`}>
              {METHOD_LABEL[m]}
            </Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text className="text-xs text-bad">{error}</Text> : null}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button label="Cancel" variant="quiet" onPress={onClose} />
        </View>
        <View className="flex-1">
          <Button label="Record" onPress={submit} loading={record.isPending} />
        </View>
      </View>
    </View>
  )
}

function InvoiceRow({ invoice }: { invoice: OverdueInvoice }) {
  const [showForm, setShowForm] = useState(false)
  const [linkStatus, setLinkStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const sendLink = useSendPaymentLink()
  const remaining = invoice.totalAmount - invoice.paidAmount
  const overdue = daysOverdue(invoice.dueDate)

  const call = () => {
    if (invoice.student.guardianPhone) Linking.openURL(`tel:${invoice.student.guardianPhone}`)
  }
  const shareLink = async () => {
    setLinkStatus('sending')
    try {
      const res = await sendLink.mutateAsync(invoice.id)
      setLinkStatus(res.data.sent ? 'sent' : 'failed')
    } catch {
      setLinkStatus('failed')
    }
  }

  return (
    <Card className="mt-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{invoice.student.name}</Text>
          <Text className="text-xs text-ink-secondary">
            {[invoice.student.gradeLabel, invoice.invoiceNumber].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Chip label={`${overdue}d overdue`} tone="bad" />
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-ink-faint">Due</Text>
        <Text className="text-sm font-bold text-fees">{inr(remaining)}</Text>
      </View>

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={call}
          disabled={!invoice.student.guardianPhone}
          className="flex-1 items-center rounded-xl border border-line py-2 active:opacity-70 disabled:opacity-40"
        >
          <Text className="text-xs font-semibold text-brand">Call</Text>
        </Pressable>
        <Pressable onPress={shareLink} disabled={linkStatus === 'sending'} className="flex-1 items-center rounded-xl border border-line py-2 active:opacity-70">
          <Text className="text-xs font-semibold text-attend">
            {linkStatus === 'sending' ? 'Sending…' : linkStatus === 'sent' ? 'Link sent' : linkStatus === 'failed' ? 'Failed — retry' : 'Send link'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setShowForm((v) => !v)}
          className="flex-1 items-center rounded-xl bg-fees py-2 active:opacity-70"
        >
          <Text className="text-xs font-semibold text-white">{showForm ? 'Close' : 'Record'}</Text>
        </Pressable>
      </View>

      {showForm ? <RecordPaymentForm invoice={invoice} remaining={remaining} onClose={() => setShowForm(false)} /> : null}
    </Card>
  )
}

export default function Fees() {
  const { data, isLoading, isError, refetch } = useOverdueInvoices()

  return (
    <Screen
      header={
        <GradientHeader
          title="Fees"
          subtitle={data ? `${inr(data.totalOverdue)} overdue · ${data.count} invoice${data.count === 1 ? '' : 's'}` : undefined}
          accent="fees"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#7C3AED" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load overdue invoices. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data && data.invoices.length > 0 ? (
          data.invoices.map((inv) => <InvoiceRow key={inv.id} invoice={inv} />)
        ) : (
          <Card className="mt-4">
            <Text className="text-sm text-ink-secondary">No overdue invoices. Nice.</Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  )
}
