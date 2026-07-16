import { Tabs } from 'expo-router'
import { useSharedTabScreenOptions, tabBarIcon } from '@/components/tab-bar'

export default function ParentLayout() {
  const screenOptions = useSharedTabScreenOptions()
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: tabBarIcon('home') }} />
      <Tabs.Screen name="fees" options={{ title: 'Fees', tabBarIcon: tabBarIcon('fees') }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: tabBarIcon('attendance') }} />
      <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: tabBarIcon('events') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: tabBarIcon('more') }} />
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
