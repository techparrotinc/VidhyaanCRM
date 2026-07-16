import { Tabs } from 'expo-router'
import { useAuthStore } from '@/lib/auth-store'
import { sharedTabScreenOptions, tabBarIcon } from '@/components/tab-bar'
import type { FeatureKey } from '@/lib/icons'

/** Tabs visible per role — matches each screen's own backend role gate, so a
 *  role never sees a tab that just 403s (mobile-app-plan §3.2 "each role
 *  sees only its tabs"). ORG_ADMIN/BRANCH_ADMIN see everything. */
const ROLE_TABS: Record<string, string[]> = {
  ORG_ADMIN: ['home', 'leads', 'attendance', 'fees', 'students', 'more'],
  BRANCH_ADMIN: ['home', 'leads', 'attendance', 'fees', 'students', 'more'],
  COUNSELLOR: ['home', 'leads', 'students', 'more'],
  RECEPTIONIST: ['home', 'leads', 'students', 'more'],
  ACCOUNTANT: ['home', 'fees', 'students'],
  TEACHER: ['home', 'attendance', 'students']
}

export default function OrgLayout() {
  const role = useAuthStore((s) => s.user?.role ?? '')
  const allowed = ROLE_TABS[role] ?? ['home', 'students'] // unknown role: safest common ground

  const tab = (name: string, title: string, feature: FeatureKey) => (
    <Tabs.Screen
      name={name}
      options={{
        title,
        tabBarIcon: tabBarIcon(feature),
        href: allowed.includes(name) ? undefined : null
      }}
    />
  )

  return (
    <Tabs screenOptions={sharedTabScreenOptions}>
      {tab('home', 'Home', 'home')}
      {tab('leads', 'Leads', 'leads')}
      {tab('attendance', 'Attendance', 'attendance')}
      {tab('fees', 'Fees', 'fees')}
      {tab('students', 'Students', 'students')}
      {tab('more', 'More', 'more')}
      {/* Pushed from More, not tabs themselves. */}
      <Tabs.Screen name="admissions" options={{ href: null }} />
      <Tabs.Screen name="whatsapp-inbox" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="event-create" options={{ href: null }} />
      <Tabs.Screen name="forms-review" options={{ href: null }} />
      <Tabs.Screen name="broadcast" options={{ href: null }} />
      <Tabs.Screen name="ai-chat" options={{ href: null }} />
    </Tabs>
  )
}
