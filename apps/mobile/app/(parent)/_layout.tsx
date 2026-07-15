import { Tabs } from 'expo-router'
import { View } from 'react-native'

const icon = (focused: boolean) => (
  <View
    className={`h-6 w-6 rounded-md border-[1.5px] ${
      focused ? 'border-brand bg-brand-soft' : 'border-ink-faint'
    }`}
  />
)

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1565D8',
        tabBarInactiveTintColor: '#94A3B8'
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ focused }) => icon(focused) }} />
      <Tabs.Screen name="fees" options={{ title: 'Fees', tabBarIcon: ({ focused }) => icon(focused) }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: ({ focused }) => icon(focused) }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: ({ focused }) => icon(focused) }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ focused }) => icon(focused) }} />
      {/* Detail routes nested under this tab group — Expo Router auto-adds
          every file here as a tab unless explicitly hidden via href:null. */}
      <Tabs.Screen name="events/[id]" options={{ href: null }} />
      <Tabs.Screen name="fees/[id]" options={{ href: null }} />
      <Tabs.Screen name="fees/[id]/pay" options={{ href: null }} />
      <Tabs.Screen name="fees/[id]/receipt" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  )
}
