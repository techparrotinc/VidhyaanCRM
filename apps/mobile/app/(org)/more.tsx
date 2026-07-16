import { ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Button, ListRow, Avatar } from '@/components/ui'
import { useAuthStore } from '@/lib/auth-store'
import { api } from '@/lib/api'
import { FEATURE_ICONS } from '@/lib/icons'

const ADMISSIONS_ROLES = new Set(['ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST'])
const INBOX_ROLES = new Set(['ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR'])
const REPORTS_ROLES = new Set(['ORG_ADMIN', 'BRANCH_ADMIN'])
const WALLET_ROLES = new Set(['ORG_ADMIN'])
const EVENTS_ROLES = new Set(['ORG_ADMIN', 'BRANCH_ADMIN'])
const FORMS_ROLES = new Set(['ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR'])
const BROADCAST_ROLES = new Set(['ORG_ADMIN', 'BRANCH_ADMIN'])
const AI_ROLES = new Set(['ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST'])

export default function More() {
  const { user, signOut } = useAuthStore()
  const role = user?.role ?? ''

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

        <View className="mt-3 gap-2.5">
          {ADMISSIONS_ROLES.has(role) ? (
            <ListRow
              title="Admissions"
              subtitle="Pipeline, move stage"
              onPress={() => router.push('/(org)/admissions')}
              icon={FEATURE_ICONS.admissions.icon}
              accent={FEATURE_ICONS.admissions.accent}
            />
          ) : null}
          {INBOX_ROLES.has(role) ? (
            <ListRow
              title="WhatsApp Inbox"
              subtitle="Read inbound messages"
              onPress={() => router.push('/(org)/whatsapp-inbox')}
              icon={FEATURE_ICONS.whatsapp.icon}
              accent={FEATURE_ICONS.whatsapp.accent}
            />
          ) : null}
          {REPORTS_ROLES.has(role) ? (
            <ListRow
              title="Reports"
              subtitle="Collection, funnel, ageing, attendance"
              onPress={() => router.push('/(org)/reports')}
              icon={FEATURE_ICONS.reports.icon}
              accent={FEATURE_ICONS.reports.accent}
            />
          ) : null}
          {WALLET_ROLES.has(role) ? (
            <ListRow
              title="Credits"
              subtitle="WhatsApp / SMS balance"
              onPress={() => router.push('/(org)/wallet')}
              icon={FEATURE_ICONS.wallet.icon}
              accent={FEATURE_ICONS.wallet.accent}
            />
          ) : null}
          {EVENTS_ROLES.has(role) ? (
            <ListRow
              title="New Event"
              subtitle="Create, publish, announce"
              onPress={() => router.push('/(org)/event-create')}
              icon={FEATURE_ICONS.events.icon}
              accent={FEATURE_ICONS.events.accent}
            />
          ) : null}
          {FORMS_ROLES.has(role) ? (
            <ListRow
              title="Digital Forms"
              subtitle="Review submissions"
              onPress={() => router.push('/(org)/forms-review')}
              icon={FEATURE_ICONS.forms.icon}
              accent={FEATURE_ICONS.forms.accent}
            />
          ) : null}
          {BROADCAST_ROLES.has(role) ? (
            <ListRow
              title="Broadcast"
              subtitle="WhatsApp announcement"
              onPress={() => router.push('/(org)/broadcast')}
              icon={FEATURE_ICONS.broadcast.icon}
              accent={FEATURE_ICONS.broadcast.accent}
            />
          ) : null}
          {AI_ROLES.has(role) ? (
            <ListRow
              title="Ask AI"
              subtitle="Chat with citations + actions"
              onPress={() => router.push('/(org)/ai-chat')}
              icon={FEATURE_ICONS.aiChat.icon}
              accent={FEATURE_ICONS.aiChat.accent}
            />
          ) : null}
          <ListRow
            title="Login PIN"
            subtitle="Set or change your 4-digit PIN"
            icon="keypad-outline"
            onPress={() => router.push('/set-pin')}
          />
        </View>
      </ScrollView>
    </Screen>
  )
}
