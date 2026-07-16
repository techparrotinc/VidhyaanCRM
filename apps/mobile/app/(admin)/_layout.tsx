import { Tabs } from 'expo-router'
import { useSharedTabScreenOptions, tabBarIcon } from '@/components/tab-bar'

export default function AdminLayout() {
  const screenOptions = useSharedTabScreenOptions()
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="pulse" options={{ title: 'Pulse', tabBarIcon: tabBarIcon('pulse') }} />
      <Tabs.Screen name="approvals" options={{ title: 'Approvals', tabBarIcon: tabBarIcon('approvals') }} />
      {/* Pushed from Pulse, not tabs themselves. */}
      <Tabs.Screen name="billing-alerts" options={{ href: null }} />
      <Tabs.Screen name="templates" options={{ href: null }} />
      <Tabs.Screen name="review-flags" options={{ href: null }} />
      <Tabs.Screen name="announce" options={{ href: null }} />
    </Tabs>
  )
}
