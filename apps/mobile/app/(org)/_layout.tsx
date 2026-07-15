import { Tabs } from 'expo-router'
import { View } from 'react-native'

const icon = (focused: boolean) => (
  <View
    className={`h-6 w-6 rounded-md border-[1.5px] ${
      focused ? 'border-brand bg-brand-soft' : 'border-ink-faint'
    }`}
  />
)

export default function OrgLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1565D8',
        tabBarInactiveTintColor: '#94A3B8'
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ focused }) => icon(focused) }} />
      <Tabs.Screen name="leads" options={{ title: 'Leads', tabBarIcon: ({ focused }) => icon(focused) }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: ({ focused }) => icon(focused) }} />
      <Tabs.Screen name="fees" options={{ title: 'Fees', tabBarIcon: ({ focused }) => icon(focused) }} />
      <Tabs.Screen name="students" options={{ title: 'Students', tabBarIcon: ({ focused }) => icon(focused) }} />
    </Tabs>
  )
}
