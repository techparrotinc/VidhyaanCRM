import { useMemo, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native'
import { Screen, GradientHeader, Card, Button, Chip, EmptyState, PastelStat, FormScrollView } from '@/components/ui'
import { HeaderAvatar, AvatarMenuOverlay, useAvatarMenu } from '@/components/HeaderAvatarMenu'
import {
  useStaffFees,
  useRecordPayment,
  useSendPaymentLink,
  type OpenInvoice,
  type PaymentMethod
} from '@/lib/fees-staff'

/** Fees tab (wireframe s-defaulters): KPI tiles, filter chips, open dues —
 *  overdue first, then upcoming (so a fresh enrolment invoice shows). */

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

type Filter = 'all' | 'overdue30' | 'big'
const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'overdue30', label: '30d+' },
  { value: 'big', label: '₹10k+' }
]

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function RecordPaymentForm({ invoice, onClose }: { invoice: OpenInvoice; onClose: () => void }) {
  const [amount, setAmount] = useState(String(invoice.balance))
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [error, setError] = useState<string | null>(null)
  const record = useRecordPayment()

  const submit = async () => {
    setError(null)
    const value = Number(amount)
    if (!value || value <= 0) return setError('Enter a valid amount')
    if (value > invoice.balance) return setError(`Cannot exceed ${inr(invoice.balance)}`)
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

function InvoiceRow({ invoice }: { invoice: OpenInvoice }) {
  const [showForm, setShowForm] = useState(false)
  const [linkStatus, setLinkStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const sendLink = useSendPaymentLink()

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

  const dueChip =
    invoice.daysOverdue > 0 ? (
      <Chip label={`${invoice.daysOverdue}d overdue`} tone="bad" />
    ) : (
      <Chip
        label={invoice.daysOverdue === 0 ? 'due today' : `due in ${-invoice.daysOverdue}d`}
        tone="warn"
      />
    )

  return (
    <Card className="mt-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">
            {invoice.student.name}
            {invoice.student.gradeLabel
              ? ` · ${[invoice.student.gradeLabel, invoice.student.section].filter(Boolean).join('-')}`
              : ''}
          </Text>
          <Text className="text-xs text-ink-secondary">{invoice.invoiceNumber}</Text>
        </View>
        {dueChip}
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs text-ink-faint">Balance</Text>
        <Text className="text-sm font-bold text-fees">{inr(invoice.balance)}</Text>
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

      {showForm ? <RecordPaymentForm invoice={invoice} onClose={() => setShowForm(false)} /> : null}
    </Card>
  )
}

export default function Fees() {
  const { data, isLoading, isError, refetch } = useStaffFees()
  const [filter, setFilter] = useState<Filter>('all')
  const { open: menuOpen, setOpen: setMenuOpen } = useAvatarMenu()

  const filtered = useMemo(() => {
    const rows = data?.invoices ?? []
    if (filter === 'overdue30') return rows.filter((i) => i.daysOverdue >= 30)
    if (filter === 'big') return rows.filter((i) => i.balance >= 10_000)
    return rows
  }, [data, filter])

  return (
    <Screen
      header={
        <GradientHeader
          title="Fees"
          subtitle={data ? `${data.invoices.length} open invoice${data.invoices.length === 1 ? '' : 's'}` : undefined}
          accent="fees"
          right={<HeaderAvatar onPress={() => setMenuOpen(!menuOpen)} />}
        />
      }
    >
      <AvatarMenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
      <FormScrollView>
        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#7C3AED" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load fees. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data ? (
          <>
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <PastelStat label="Collected today" value={inr(data.kpis.collectedToday)} />
              </View>
              <View className="flex-1">
                <PastelStat label="Open dues" value={inr(data.kpis.openDues)} />
              </View>
            </View>

            <Text className="mt-5 text-[11px] font-bold uppercase tracking-widest text-ink-faint">
              Open invoices
            </Text>
            <View className="mt-2 flex-row gap-1.5">
              {FILTERS.map((f) => (
                <Pressable
                  key={f.value}
                  onPress={() => setFilter(f.value)}
                  className={`rounded-full px-3 py-1.5 ${filter === f.value ? 'bg-fees' : 'border border-line bg-white'}`}
                >
                  <Text className={`text-xs font-semibold ${filter === f.value ? 'text-white' : 'text-ink-secondary'}`}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {filtered.length > 0 ? (
              filtered.map((inv) => <InvoiceRow key={inv.id} invoice={inv} />)
            ) : (
              <EmptyState icon="checkmark-circle-outline" title="Nothing here" subtitle="No open invoices match this filter." />
            )}
          </>
        ) : null}
        <View className="h-6" />
      </FormScrollView>
    </Screen>
  )
}
