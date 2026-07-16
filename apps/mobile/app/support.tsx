import Constants from 'expo-constants'
import { Linking, Platform, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, DetailHeader, ListRow } from '@/components/ui'

/** Help & support (wireframe s-support) — shared by parent + staff journeys. */

const SUPPORT_WHATSAPP = '918304841903'
const SUPPORT_EMAIL = 'support@vidhyaan.com'

export default function Support() {
  const version = Constants.expoConfig?.version ?? '0.0.0'

  return (
    <Screen header={<DetailHeader title="Help & support" onBack={() => router.back()} />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mt-2 gap-2.5">
          <ListRow
            title="WhatsApp Vidhyaan support"
            subtitle="Typical reply within 2 hours"
            icon="logo-whatsapp"
            accent="attend"
            onPress={() => Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}`)}
          />
          <ListRow
            title="Email support"
            subtitle={SUPPORT_EMAIL}
            icon="mail-outline"
            onPress={() =>
              Linking.openURL(
                `mailto:${SUPPORT_EMAIL}?subject=Vidhyaan app support&body=%0A%0A—%0AApp ${version} · ${Platform.OS} ${Platform.Version}`
              )
            }
          />
          <ListRow
            title="FAQs & guides"
            subtitle="Fees, attendance, login issues"
            icon="help-circle-outline"
            onPress={() => Linking.openURL('https://vidhyaan.com/help')}
          />
        </View>
        <Text className="mt-6 text-center text-xs text-ink-faint">
          App {version} · {Platform.OS === 'ios' ? 'iOS' : 'Android'} {String(Platform.Version)}
        </Text>
      </ScrollView>
    </Screen>
  )
}
