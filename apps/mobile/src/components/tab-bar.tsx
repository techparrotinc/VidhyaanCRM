import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ACCENT_HEX } from '@/components/ui'
import { FEATURE_ICONS, type FeatureKey } from '@/lib/icons'

/** Shared across (org)/(parent)/(admin) tab layouts — role-gating logic stays in each layout file. */
export const sharedTabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: '#1565D8',
  tabBarInactiveTintColor: '#94A3B8',
  tabBarStyle: {
    borderTopColor: '#E2E8F0',
    height: 60,
    paddingTop: 6,
    paddingBottom: 8
  },
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '600' as const
  }
}

export function tabBarIcon(feature: FeatureKey) {
  return ({ focused }: { focused: boolean }) => {
    const { icon, activeIcon, accent } = FEATURE_ICONS[feature]
    const color = focused ? ACCENT_HEX[accent] : '#94A3B8'
    return (
      <View className="items-center">
        <View
          className="h-0.5 w-5 rounded-full"
          style={{ backgroundColor: focused ? color : 'transparent', marginBottom: 4 }}
        />
        <Ionicons name={focused ? activeIcon : icon} size={22} color={color} />
      </View>
    )
  }
}
