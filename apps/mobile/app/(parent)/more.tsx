import { ScrollView, Text, Alert, View } from 'react-native'
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

  const deleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'Your parent account and personal data are removed. School records (fees, attendance) stay with the school. This cannot be undone — full purge within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: async () => {
            try {
              await api('/api/mobile/v1/parent/account-delete', { method: 'POST' })
              await signOut()
              router.replace('/(auth)/login')
            } catch (e) {
              Alert.alert('Could not delete', e instanceof Error ? e.message : 'Try again or contact support.')
            }
          }
        }
      ]
    )
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
        <View className="mt-3 gap-2">
          <ListRow
            title="Login PIN"
            subtitle="Set or change your 4-digit PIN"
            icon="keypad-outline"
            onPress={() => router.push('/set-pin')}
          />
          <ListRow
            title="Help & support"
            subtitle="WhatsApp, email, FAQs"
            icon="help-buoy-outline"
            onPress={() => router.push('/support')}
          />
        </View>
        <Card className="mt-3">
          <Button label="Log out" variant="quiet" onPress={logout} />
        </Card>
        <ListRow
          title="Delete account"
          subtitle="Permanent · full purge within 30 days"
          icon="trash-outline"
          onPress={deleteAccount}
        />
      </ScrollView>
    </Screen>
  )
}
