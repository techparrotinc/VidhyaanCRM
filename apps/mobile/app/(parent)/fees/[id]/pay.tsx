import { Text } from 'react-native'
import { Screen, PageTitle, Card } from '@/components/ui'

export default function Pay() {
  return (
    <Screen>
      <PageTitle>Pay</PageTitle>
      <Card className="mt-4">
        <Text className="text-sm text-ink-secondary">
          Razorpay checkout lands here in Phase 1 step 4 (native SDK, requires a dev-client
          build — GET /api/v1/parent/fees/invoices/[id]/checkout creates the order).
        </Text>
      </Card>
    </Screen>
  )
}
