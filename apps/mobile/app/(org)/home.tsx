import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
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
import { FEATURE_ICONS, type IconName } from '@/lib/icons'

/** Attention items link to an existing tab (no per-item mobile detail
 *  screens yet) — never a route that doesn't exist. */
function tabFor(type: string): string {
  if (type === 'unmarked_attendance') return '/(org)/attendance'
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
    <Pressable onPress={() => router.push(tabFor(item.type) as any)} className="active:opacity-80">
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
          right={<Avatar name={user?.name} size={40} accent="brand" />}
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
            <Button label="Search" variant="outline" onPress={() => router.push('/(org)/leads')} />
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
                <View key={tile.key} style={{ minWidth: '46%', flexGrow: 1 }}>
                  <PastelStat label={tile.label} value={tile.value} accent={tileAccent(tile.key)} />
                </View>
              ))}
            </View>

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
