import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, StatTile, IconCircle } from '@/components/ui'
import { useAuthStore } from '@/lib/auth-store'
import { useStaffHome, type StaffAttentionItem } from '@/lib/staff-home'

/** Attention items link to an existing tab (no per-item mobile detail
 *  screens yet) — never a route that doesn't exist. */
function tabFor(type: string): string {
  if (type === 'unmarked_attendance') return '/(org)/attendance'
  return '/(org)/leads'
}

function AttentionRow({ item }: { item: StaffAttentionItem }) {
  return (
    <Pressable onPress={() => router.push(tabFor(item.type) as any)} className="active:opacity-70">
      <Card className="mt-3 flex-row items-center gap-3">
        <IconCircle accent={item.type === 'unmarked_attendance' ? 'attend' : 'brand'} />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{item.title}</Text>
          <Text className="text-xs text-ink-secondary">{item.subtitle}</Text>
        </View>
      </Card>
    </Pressable>
  )
}

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
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
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
            <View className="mt-3 flex-row flex-wrap gap-3">
              {data.tiles.map((tile) => (
                <View key={tile.key} style={{ minWidth: '46%', flexGrow: 1 }}>
                  <StatTile label={tile.label} value={tile.value} hint={tile.hint} />
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
              <Card className="mt-4">
                <Text className="text-sm text-ink-secondary">Nothing needs your attention right now.</Text>
              </Card>
            )}
          </>
        ) : (
          <Card className="mt-4">
            <Text className="text-sm text-ink-secondary">No dashboard tiles for your role yet.</Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  )
}
