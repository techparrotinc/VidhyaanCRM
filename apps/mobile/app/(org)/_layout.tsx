import { Tabs } from 'expo-router'
import { View } from 'react-native'
import { useAuthStore } from '@/lib/auth-store'

const icon = (focused: boolean) => (
  <View
    className={`h-6 w-6 rounded-md border-[1.5px] ${
      focused ? 'border-brand bg-brand-soft' : 'border-ink-faint'
    }`}
  />
)

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

  const tab = (name: string, title: string) => (
    <Tabs.Screen
      name={name}
      options={{
        title,
        tabBarIcon: ({ focused }) => icon(focused),
        href: allowed.includes(name) ? undefined : null
      }}
    />
  )

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1565D8',
        tabBarInactiveTintColor: '#94A3B8'
      }}
    >
      {tab('home', 'Home')}
      {tab('leads', 'Leads')}
      {tab('attendance', 'Attendance')}
      {tab('fees', 'Fees')}
      {tab('students', 'Students')}
      {tab('more', 'More')}
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
