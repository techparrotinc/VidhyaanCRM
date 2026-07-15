import { Tabs } from 'expo-router'
import { View } from 'react-native'

const icon = (focused: boolean) => (
  <View
    className={`h-6 w-6 rounded-md border-[1.5px] ${
      focused ? 'border-brand bg-brand-soft' : 'border-ink-faint'
    }`}
  />
)

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1565D8',
        tabBarInactiveTintColor: '#94A3B8'
      }}
    >
      <Tabs.Screen name="pulse" options={{ title: 'Pulse', tabBarIcon: ({ focused }) => icon(focused) }} />
      <Tabs.Screen name="approvals" options={{ title: 'Approvals', tabBarIcon: ({ focused }) => icon(focused) }} />
      {/* Pushed from Pulse, not tabs themselves. */}
      <Tabs.Screen name="billing-alerts" options={{ href: null }} />
      <Tabs.Screen name="templates" options={{ href: null }} />
      <Tabs.Screen name="review-flags" options={{ href: null }} />
      <Tabs.Screen name="announce" options={{ href: null }} />
    </Tabs>
  )
}
