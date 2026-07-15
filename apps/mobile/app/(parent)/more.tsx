import { Text, Alert } from 'react-native'
import { Screen, PageTitle, Card, Button, ListRow } from '@/components/ui'
import { useAuthStore } from '@/lib/auth-store'
import { api } from '@/lib/api'
import { router } from 'expo-router'

export default function More() {
  const { user, signOut } = useAuthStore()

  const logout = async () => {
    try {
      await api('/api/mobile/v1/auth/logout', { method: 'POST' })
    } catch {
      // Local sign-out proceeds regardless — server session dies at expiry.
    }
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <Screen>
      <PageTitle>More</PageTitle>
      <Card className="mt-4">
        <Text className="text-sm font-semibold text-ink">{user?.name}</Text>
        <Text className="text-xs text-ink-secondary">{user?.phone}</Text>
      </Card>
      <ListRow
        title="Delete account"
        subtitle="Permanent · 30-day window"
        onPress={() => Alert.alert('Delete account', 'Phase 1: full flow per wireframe (Apple 5.1.1v).')}
      />
      <Card className="mt-3">
        <Button label="Log out" variant="quiet" onPress={logout} />
      </Card>
    </Screen>
  )
}
