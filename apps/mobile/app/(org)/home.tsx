import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import {
  Screen,
  GradientHeader,
  Card,
  Chip,
  PastelStat,
  IconCircle,
  IconPill,
  Avatar,
  Button,
  EmptyState,
  type Accent
} from '@/components/ui'
import { useAuthStore } from '@/lib/auth-store'
import { useStaffHome, type StaffAttentionItem } from '@/lib/staff-home'
import { useCollections } from '@/lib/staff-extras'
import { FEATURE_ICONS, type IconName } from '@/lib/icons'

function inrShort(n: number): string {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

/** LC home collections preview card — month vs same month last year. */
function CollectionsPreview() {
  const { data } = useCollections()
  if (!data) return null
  const { month } = data
  const max = Math.max(month.amount, month.prevAmount, 1)
  return (
    <Pressable onPress={() => router.push('/(org)/collections' as any)} className="mt-3 active:opacity-80">
      <Card>
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-bold uppercase tracking-widest text-ink-faint">Collections</Text>
          <Text className="text-xs text-ink-faint">details ›</Text>
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-sm text-ink-secondary">{month.label}</Text>
          <Text className="text-base font-bold text-ink">{inrShort(month.amount)}</Text>
        </View>
        <View className="mt-1 h-2 overflow-hidden rounded-full bg-line-soft">
          <View className="h-full rounded-full bg-fees" style={{ width: `${Math.max(4, (month.amount / max) * 100)}%` }} />
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-sm text-ink-secondary">{month.prevLabel}</Text>
          <Text className="text-sm font-semibold text-ink-secondary">{inrShort(month.prevAmount)}</Text>
        </View>
        <View className="mt-1 h-2 overflow-hidden rounded-full bg-line-soft">
          <View className="h-full rounded-full bg-fees/50" style={{ width: `${Math.max(4, (month.prevAmount / max) * 100)}%` }} />
        </View>
        {month.deltaPct !== null ? (
          <Text className={`mt-2 text-xs font-semibold ${month.deltaPct >= 0 ? 'text-good' : 'text-bad'}`}>
            {month.deltaPct >= 0 ? '▲' : '▼'} {Math.abs(month.deltaPct)}% vs same month last year
          </Text>
        ) : null}
      </Card>
    </Pressable>
  )
}

/** Follow-up items deep-link to the lead detail; others to their tab. */
function routeFor(item: StaffAttentionItem): string {
  if (item.type === 'unmarked_attendance') return '/(org)/attendance'
  if (item.type === 'follow_up_due') return `/(org)/leads/${item.id}`
  return '/(org)/leads'
}

function attentionAccent(type: string): Accent {
  return type === 'unmarked_attendance' ? 'attend' : 'brand'
}

function attentionIcon(type: string): IconName {
  return type === 'unmarked_attendance' ? FEATURE_ICONS.attendance.icon : FEATURE_ICONS.leads.icon
}

/** No "days late" number comes from the backend yet — approximate the
 *  wireframe's urgency pill from the item type until that's added. */
function attentionStatus(type: string): { label: string; tone: 'bad' | 'warn' } {
  return type === 'unmarked_attendance' ? { label: 'pending', tone: 'warn' } : { label: 'overdue', tone: 'bad' }
}

function AttentionRow({ item }: { item: StaffAttentionItem }) {
  const status = attentionStatus(item.type)
  return (
    <Pressable onPress={() => router.push(routeFor(item) as any)} className="active:opacity-80">
      <Card className="mt-2.5 flex-row items-center gap-3">
        <IconCircle accent={attentionAccent(item.type)} icon={attentionIcon(item.type)} />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{item.title}</Text>
          <Text className="text-xs text-ink-secondary">{item.subtitle}</Text>
        </View>
        <Chip label={status.label} tone={status.tone} />
      </Card>
    </Pressable>
  )
}

/** Backend only sends key/label/value — infer a stat card accent from the key so
 *  it doesn't take a backend change to color-code stat tiles by area. */
function tileAccent(key: string): Accent {
  const k = key.toLowerCase()
  if (k.includes('fee') || k.includes('due') || k.includes('collect')) return 'fees'
  if (k.includes('attend')) return 'attend'
  if (k.includes('event')) return 'events'
  return 'brand'
}

const QUICK_ACTIONS: Array<{ key: string; label: string; route: string; feature: keyof typeof FEATURE_ICONS }> = [
  { key: 'leads', label: 'Leads', route: '/(org)/leads', feature: 'leads' },
  { key: 'attendance', label: 'Attendance', route: '/(org)/attendance', feature: 'attendance' },
  { key: 'fees', label: 'Fees', route: '/(org)/fees', feature: 'fees' },
  { key: 'students', label: 'Students', route: '/(org)/students', feature: 'students' }
]

export default function StaffHome() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, isError, refetch } = useStaffHome()

  return (
    <Screen
      header={
        <GradientHeader
          title={`Good morning, ${user?.name?.split(' ')[0] ?? 'there'}`}
          subtitle={data ? `${data.attention.length} need${data.attention.length === 1 ? 's' : ''} attention` : undefined}
          accent="brand"
          right={
            <View className="flex-row items-center gap-2.5">
              <Pressable
                onPress={() => router.push('/(org)/notifications' as any)}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70"
              >
                <Ionicons name="notifications-outline" size={19} color="#fff" />
                {data && data.unread > 0 ? (
                  <View className="absolute -right-0.5 -top-0.5 h-4 min-w-4 items-center justify-center rounded-full bg-bad px-1">
                    <Text className="text-[9px] font-bold text-white">{data.unread > 9 ? '9+' : data.unread}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Avatar name={user?.name} size={40} accent="brand" />
            </View>
          }
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mt-4 flex-row justify-between">
          {QUICK_ACTIONS.map((action) => (
            <IconPill
              key={action.key}
              icon={FEATURE_ICONS[action.feature].icon}
              label={action.label}
              accent={FEATURE_ICONS[action.feature].accent}
              onPress={() => router.push(action.route as any)}
            />
          ))}
        </View>

        <View className="mt-4 flex-row gap-2.5">
          <View className="flex-1">
            <Button label="✦ Ask AI" variant="outline" onPress={() => router.push('/(org)/ai-chat')} />
          </View>
          <View className="flex-1">
            <Button label="Search" variant="outline" onPress={() => router.push('/(org)/search' as any)} />
          </View>
        </View>

        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#1565D8" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load your dashboard. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data && data.tiles.length > 0 ? (
          <>
            <View className="mt-5 flex-row flex-wrap gap-3">
              {data.tiles.map((tile) => (
                <Pressable
                  key={tile.key}
                  style={{ minWidth: '46%', flexGrow: 1 }}
                  disabled={!tile.route}
                  onPress={() => tile.route && router.push(`/(org)${tile.route}` as any)}
                  className="active:opacity-70"
                >
                  <PastelStat label={tile.label} value={tile.value} accent={tileAccent(tile.key)} />
                </Pressable>
              ))}
            </View>

            {data.institutionType === 'LEARNING_CENTER' ? (
              <>
                <CollectionsPreview />
                <View className="mt-3">
                  <Button label="＋ Enrol student — course & plan" onPress={() => router.push('/(org)/enroll' as any)} />
                </View>
              </>
            ) : null}

            {data.attention.length > 0 ? (
              <View className="mt-2">
                <Text className="mt-4 text-[11px] font-bold uppercase tracking-widest text-ink-faint">
                  Needs attention
                </Text>
                {data.attention.map((item) => (
                  <AttentionRow key={`${item.type}-${item.id}`} item={item} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="checkmark-circle-outline"
                title="All caught up"
                subtitle="Nothing needs your attention right now."
              />
            )}
          </>
        ) : (
          <EmptyState
            icon="grid-outline"
            title="No dashboard tiles yet"
            subtitle="Nothing configured for your role yet."
          />
        )}
      </ScrollView>
    </Screen>
  )
}
