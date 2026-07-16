import { ScrollView, Text, Alert } from 'react-native'
import { Screen, GradientHeader, Card, Button, ListRow, Avatar } from '@/components/ui'
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
    <Screen header={<GradientHeader title="More" accent="brand" />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card className="mt-4 flex-row items-center gap-3">
          <Avatar name={user?.name} size={44} accent="brand" />
          <Text className="flex-1 text-sm font-semibold text-ink">
            {user?.name}
            {'\n'}
            <Text className="text-xs font-normal text-ink-secondary">{user?.phone}</Text>
          </Text>
        </Card>
        <Card className="mt-3">
          <Button label="Log out" variant="quiet" onPress={logout} />
        </Card>
        <ListRow
          title="Delete account"
          subtitle="Permanent · 30-day window"
          icon="trash-outline"
          onPress={() => Alert.alert('Delete account', 'Phase 1: full flow per wireframe (Apple 5.1.1v).')}
        />
      </ScrollView>
    </Screen>
  )
}
