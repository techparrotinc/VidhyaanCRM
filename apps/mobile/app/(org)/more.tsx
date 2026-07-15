import { Text } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Button, ListRow, IconCircle } from '@/components/ui'
import { useAuthStore } from '@/lib/auth-store'
import { api } from '@/lib/api'

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
      <Card className="mt-4 flex-row items-center gap-3">
        <IconCircle accent="brand" size={44} />
        <Text className="flex-1 text-sm font-semibold text-ink">
          {user?.name}
          {'\n'}
          <Text className="text-xs font-normal text-ink-secondary">{user?.phone}</Text>
        </Text>
      </Card>

      {ADMISSIONS_ROLES.has(role) ? (
        <ListRow title="Admissions" subtitle="Pipeline, move stage" onPress={() => router.push('/(org)/admissions')} accent="brand" />
      ) : null}
      {INBOX_ROLES.has(role) ? (
        <ListRow title="WhatsApp Inbox" subtitle="Read inbound messages" onPress={() => router.push('/(org)/whatsapp-inbox')} accent="attend" />
      ) : null}
      {REPORTS_ROLES.has(role) ? (
        <ListRow title="Reports" subtitle="Collection, funnel, ageing, attendance" onPress={() => router.push('/(org)/reports')} accent="fees" />
      ) : null}
      {WALLET_ROLES.has(role) ? (
        <ListRow title="Credits" subtitle="WhatsApp / SMS balance" onPress={() => router.push('/(org)/wallet')} accent="fees" />
      ) : null}
      {EVENTS_ROLES.has(role) ? (
        <ListRow title="New Event" subtitle="Create, publish, announce" onPress={() => router.push('/(org)/event-create')} accent="events" />
      ) : null}
      {FORMS_ROLES.has(role) ? (
        <ListRow title="Digital Forms" subtitle="Review submissions" onPress={() => router.push('/(org)/forms-review')} accent="brand" />
      ) : null}
      {BROADCAST_ROLES.has(role) ? (
        <ListRow title="Broadcast" subtitle="WhatsApp announcement" onPress={() => router.push('/(org)/broadcast')} accent="events" />
      ) : null}
      {AI_ROLES.has(role) ? (
        <ListRow title="Ask AI" subtitle="Chat with citations + actions" onPress={() => router.push('/(org)/ai-chat')} accent="brand" />
      ) : null}

      <Card className="mt-3">
        <Button label="Log out" variant="quiet" onPress={logout} />
      </Card>
    </Screen>
  )
}
