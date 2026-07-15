import { useState } from 'react'
import { Text, View } from 'react-native'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { useLocalSearchParams, router } from 'expo-router'
import { Screen, Card, Button } from '@/components/ui'
import { useParentInvoices } from '@/lib/parent-fees'
import { API_URL, ensureAccessToken } from '@/lib/api'

export default function Receipt() {
  const { id, receiptNumber, amount } = useLocalSearchParams<{
    id: string
    receiptNumber: string
    amount: string
  }>()
  const { data: invoices } = useParentInvoices()
  const invoice = invoices?.find((i) => i.id === id)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function shareReceipt() {
    if (!id) return
    setSharing(true)
    setError(null)
    try {
      const token = await ensureAccessToken()
      const file = new File(Paths.cache, `${receiptNumber || id}.pdf`)
      await File.downloadFileAsync(`${API_URL}/api/v1/parent/fees/invoices/${id}/pdf`, file, {
        headers: { authorization: `Bearer ${token}` }
      })
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf' })
      }
    } catch {
      setError("Couldn't prepare the receipt. Try again.")
    } finally {
      setSharing(false)
    }
  }

  return (
    <Screen>
      <View className="mt-16 items-center gap-2 px-4">
        <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-good">
          <Text className="text-2xl text-good">✓</Text>
        </View>
        <Text className="text-2xl font-bold tracking-tight text-ink">
          ₹{Number(amount ?? 0).toLocaleString('en-IN')}
        </Text>
        <Text className="text-center text-sm text-ink-secondary">
          {invoice?.termName ?? invoice?.courseName ?? invoice?.invoiceNumber}
          {invoice ? ` · ${invoice.studentName}` : ''}
          {'\n'}Receipt {receiptNumber}
        </Text>

        {error ? <Text className="text-sm text-bad">{error}</Text> : null}

        <Card className="mt-6 w-full">
          <Button
            label={sharing ? 'Preparing…' : 'Share receipt (PDF)'}
            loading={sharing}
            onPress={shareReceipt}
          />
        </Card>
        <View className="mt-2 w-full">
          <Button label="Done" variant="quiet" onPress={() => router.replace('/(parent)/fees')} />
        </View>
      </View>
    </Screen>
  )
}
