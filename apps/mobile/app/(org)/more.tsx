import { Alert, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Button, ListRow, Avatar } from '@/components/ui'
import { useAuthStore } from '@/lib/auth-store'
import { HeaderAvatar, AvatarMenuOverlay, useAvatarMenu } from '@/components/HeaderAvatarMenu'
import { useStaffHome } from '@/lib/staff-home'
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
const MONEY_ROLES = new Set(['ORG_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'])

export default function More() {
  const { user, signOut } = useAuthStore()
  const role = user?.role ?? ''
  const { data: home } = useStaffHome()
  const { open: menuOpen, setOpen: setMenuOpen } = useAvatarMenu()

  // Same gate the server applies (org module licences) — a row the backend
  // would 403 must not render. Until home loads, hide licence-gated rows.
  const has = (moduleSlug: string) => (home?.modules ?? []).includes(moduleSlug)

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
    <Screen
      header={
        <GradientHeader
          title="More"
          accent="brand"
          right={<HeaderAvatar onPress={() => setMenuOpen(!menuOpen)} />}
        />
      }
    >
      <AvatarMenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Card className="mt-4 flex-row items-center gap-3">
          <Avatar name={user?.name} size={44} accent="brand" />
          <Text className="flex-1 text-sm font-semibold text-ink">
            {user?.name}
            {'\n'}
            <Text className="text-xs font-normal text-ink-secondary">
              {[home?.orgName, user?.phone].filter(Boolean).join(' · ')}
            </Text>
          </Text>
        </Card>

        <View className="mt-3 gap-2.5">
          {has('course_schedule') ? (
            <ListRow
              title="Schedule"
              subtitle="Sessions today, week view"
              onPress={() => router.push('/(org)/schedule' as never)}
              icon="calendar-outline"
              accent="attend"
            />
          ) : null}
          {MONEY_ROLES.has(role) && has('fee_management') ? (
            <ListRow
              title="Collections"
              subtitle="Month / quarter / year"
              onPress={() => router.push('/(org)/collections' as never)}
              icon="trending-up-outline"
              accent="fees"
            />
          ) : null}
          {ADMISSIONS_ROLES.has(role) && has('admission_management') ? (
            <ListRow
              title="Admissions"
              subtitle="Pipeline, move stage"
              onPress={() => router.push('/(org)/admissions')}
              icon={FEATURE_ICONS.admissions.icon}
              accent={FEATURE_ICONS.admissions.accent}
            />
          ) : null}
          {INBOX_ROLES.has(role) && has('whatsapp_sms_notifications') ? (
            <ListRow
              title="WhatsApp Inbox"
              subtitle="Read inbound messages"
              onPress={() => router.push('/(org)/whatsapp-inbox')}
              icon={FEATURE_ICONS.whatsapp.icon}
              accent={FEATURE_ICONS.whatsapp.accent}
            />
          ) : null}
          {REPORTS_ROLES.has(role) && has('advanced_reports') ? (
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
          {EVENTS_ROLES.has(role) && has('event_management') ? (
            <ListRow
              title="New Event"
              subtitle="Create, publish, announce"
              onPress={() => router.push('/(org)/event-create')}
              icon={FEATURE_ICONS.events.icon}
              accent={FEATURE_ICONS.events.accent}
            />
          ) : null}
          {FORMS_ROLES.has(role) && has('forms_requests') ? (
            <ListRow
              title="Digital Forms"
              subtitle="Review submissions"
              onPress={() => router.push('/(org)/forms-review')}
              icon={FEATURE_ICONS.forms.icon}
              accent={FEATURE_ICONS.forms.accent}
            />
          ) : null}
          {BROADCAST_ROLES.has(role) && has('campaign_management') ? (
            <ListRow
              title="Broadcast"
              subtitle="WhatsApp announcement"
              onPress={() => router.push('/(org)/broadcast')}
              icon={FEATURE_ICONS.broadcast.icon}
              accent={FEATURE_ICONS.broadcast.accent}
            />
          ) : null}
          {AI_ROLES.has(role) && has('ai_copilot') ? (
            <ListRow
              title="Ask AI"
              subtitle="Chat with citations + actions"
              onPress={() => router.push('/(org)/ai-chat')}
              icon={FEATURE_ICONS.aiChat.icon}
              accent={FEATURE_ICONS.aiChat.accent}
            />
          ) : null}
        </View>

        {/* Account actions (PIN / support / logout) live in the avatar menu
            on Home — More stays feature navigation only. Logout kept here
            too as the conventional fallback location. */}
        <Card className="mt-3">
          <Button label="Log out" variant="quiet" onPress={logout} />
        </Card>
        <View className="h-6" />
      </ScrollView>
    </Screen>
  )
}
