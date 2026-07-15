import { Text, ScrollView } from 'react-native'
import { Screen, PageTitle, Card } from '@/components/ui'
import { useAuthStore } from '@/lib/auth-store'

export default function ParentHome() {
  const user = useAuthStore((s) => s.user)
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageTitle>Good morning, {user?.name?.split(' ')[0] ?? 'there'}</PageTitle>
        <Card className="mt-4">
          <Text className="text-sm text-ink-secondary">
            Kid cards land here in Phase 1 — attendance today, next fee due, next event
            (GET /api/mobile/v1/parent/home).
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  )
}
