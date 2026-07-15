import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, Button } from '@/components/ui'
import { API_URL } from '@/lib/api'
import { useWalletBalances } from '@/lib/wallet'

const CHANNEL_LABEL: Record<string, string> = { WHATSAPP: 'WhatsApp credits', SMS: 'SMS credits' }

export default function Wallet() {
  const { data, isLoading, isError, refetch } = useWalletBalances()
  const anyLow = data?.some((b) => b.lowBalance) ?? false

  return (
    <Screen
      header={
        <GradientHeader
          title="Credits"
          subtitle={anyLow ? 'Balance running low' : undefined}
          accent="fees"
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
            <ActivityIndicator color="#7C3AED" />
          </View>
        ) : isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-bad">Couldn't load wallet balance.</Text>
            <Pressable onPress={() => refetch()} className="mt-2">
              <Text className="text-sm font-semibold text-brand">Retry</Text>
            </Pressable>
          </Card>
        ) : data && data.length > 0 ? (
          data.map((b) => (
            <Card key={b.channel} className={`mt-3 ${b.lowBalance ? 'border-warn/40 bg-warn-bg' : ''}`}>
              <Text className="text-xs font-normal text-ink-faint">{CHANNEL_LABEL[b.channel] ?? b.channel}</Text>
              <Text className="mt-1 text-2xl font-bold tracking-tight text-ink">{b.remaining.toLocaleString('en-IN')}</Text>
              {b.lowBalance ? <Text className="mt-1 text-xs font-semibold text-warn">Running low — top up soon</Text> : null}
            </Card>
          ))
        ) : (
          <Card className="mt-4">
            <Text className="text-sm text-ink-secondary">No message wallets configured for this org.</Text>
          </Card>
        )}

        <View className="mt-4">
          <Button label="Buy more credits" onPress={() => Linking.openURL(`${API_URL}/settings/addons`)} />
        </View>
        <Text className="mt-2 text-center text-[11px] text-ink-faint">Opens the web app — purchases aren't available in-app.</Text>
      </ScrollView>
    </Screen>
  )
}
