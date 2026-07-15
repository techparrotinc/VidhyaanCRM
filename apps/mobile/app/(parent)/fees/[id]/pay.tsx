import { useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import RazorpayCheckout from 'react-native-razorpay'
import { useLocalSearchParams, router } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { Screen, PageTitle, Card, Button } from '@/components/ui'
import { useParentInvoices } from '@/lib/parent-fees'
import { createInvoiceCheckout, confirmInvoiceCheckout } from '@/lib/parent-payments'

type Phase = 'starting' | 'failed' | 'pending'

export default function Pay() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: invoices } = useParentInvoices()
  const invoice = invoices?.find((i) => i.id === id)
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>('starting')
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!invoice || started.current) return
    started.current = true
    void startCheckout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice])

  async function startCheckout() {
    if (!invoice) return
    setPhase('starting')
    setError(null)
    try {
      const order = await createInvoiceCheckout(invoice.id, invoice.balance)
      const result = await RazorpayCheckout.open({
        key: order.keyId,
        amount: order.amountMinor,
        currency: order.currency,
        order_id: order.providerOrderId,
        name: 'Vidhyaan',
        description: invoice.termName ?? invoice.courseName ?? invoice.invoiceNumber,
        prefill: order.prefill
      })

      const confirmed = await confirmInvoiceCheckout(order.gatewayOrderId, {
        providerOrderId: result.razorpay_order_id,
        providerPaymentId: result.razorpay_payment_id,
        signature: result.razorpay_signature
      })

      await queryClient.invalidateQueries({ queryKey: ['parent-invoices'] })
      await queryClient.invalidateQueries({ queryKey: ['parent-home'] })

      router.replace({
        pathname: '/(parent)/fees/[id]/receipt',
        params: {
          id: invoice.id,
          receiptNumber: confirmed.receiptNumber,
          amount: String(invoice.balance)
        }
      })
    } catch (err: any) {
      // RazorpayCheckout rejects with { code, description } on user cancel/failure.
      if (err?.code === 2 || /cancel/i.test(err?.description ?? '')) {
        setPhase('failed')
        setError('Payment cancelled.')
        return
      }
      setPhase('pending')
      setError(
        err?.description ?? err?.message ?? 'If money left your account, it will auto-verify within 30 min.'
      )
    }
  }

  if (!invoice) {
    return (
      <Screen>
        <PageTitle>Pay</PageTitle>
        <Card className="mt-4">
          <Text className="text-sm text-ink-secondary">Invoice not found.</Text>
        </Card>
      </Screen>
    )
  }

  if (phase === 'starting') {
    return (
      <Screen>
        <View className="mt-16 items-center gap-3">
          <Text className="text-sm text-ink-secondary">Opening Razorpay…</Text>
        </View>
      </Screen>
    )
  }

  const isPending = phase === 'pending'

  return (
    <Screen>
      <View className="mt-16 items-center gap-3 px-4">
        <View
          className={`h-16 w-16 items-center justify-center rounded-full border-2 ${isPending ? 'border-warn' : 'border-bad'}`}
        >
          <Text className={`text-2xl ${isPending ? 'text-warn' : 'text-bad'}`}>
            {isPending ? '!' : '×'}
          </Text>
        </View>
        <Text className="text-lg font-bold text-ink">
          {isPending ? 'Payment not confirmed yet' : 'Payment not completed'}
        </Text>
        <Text className="text-center text-sm text-ink-secondary">
          ₹{invoice.balance.toLocaleString('en-IN')} · {invoice.termName ?? invoice.invoiceNumber}
          {'\n'}
          {error}
        </Text>
        <View className="mt-4 w-full">
          <Button label="Retry payment" onPress={() => void startCheckout()} />
        </View>
      </View>
    </Screen>
  )
}
