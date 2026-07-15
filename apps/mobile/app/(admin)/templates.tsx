import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Chip } from '@/components/ui'
import { useSharedTemplates, useToggleTemplate, type SharedTemplate } from '@/lib/admin'

function TemplateRow({ tpl }: { tpl: SharedTemplate }) {
  const toggle = useToggleTemplate()

  return (
    <Card className="mt-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-ink">{tpl.name}</Text>
          <Text className="mt-0.5 text-xs text-ink-secondary" numberOfLines={2}>
            {tpl.body}
          </Text>
        </View>
        <Chip label={tpl.category} tone="neutral" />
      </View>
      <View className="mt-3 flex-row items-center justify-between border-t border-line pt-3">
        <Text className="text-xs font-semibold text-ink-secondary">{tpl.isActive ? 'Active' : 'Disabled'}</Text>
        <Switch
          value={tpl.isActive}
          disabled={toggle.isPending}
          onValueChange={(next) => toggle.mutate({ id: tpl.id, isActive: next })}
          trackColor={{ true: '#1565D8' }}
        />
      </View>
    </Card>
  )
}

export default function Templates() {
  const { data, isLoading, isError, refetch } = useSharedTemplates()

  return (
    <Screen
      header={
        <GradientHeader
          title="WhatsApp Templates"
          subtitle="Shared catalog"
          accent="attend"
          right={
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
              <Text className="text-lg font-bold text-white">×</Text>
            </Pressable>
          }
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="mt-8 items-center">
            <ActivityIndicator color="#0D9488" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load templates. Pull to retry.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data && data.length > 0 ? (
          data.map((t) => <TemplateRow key={t.id} tpl={t} />)
        ) : (
          <Card className="mt-4">
            <Text className="text-sm text-ink-secondary">No shared templates yet.</Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  )
}
