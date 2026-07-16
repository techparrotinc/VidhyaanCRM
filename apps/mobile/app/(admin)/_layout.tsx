import { Tabs } from 'expo-router'
import { sharedTabScreenOptions, tabBarIcon } from '@/components/tab-bar'

export default function AdminLayout() {
  return (
    <Tabs screenOptions={sharedTabScreenOptions}>
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
