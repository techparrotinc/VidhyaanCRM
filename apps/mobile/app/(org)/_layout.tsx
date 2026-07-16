import { Tabs } from 'expo-router'
import { useAuthStore } from '@/lib/auth-store'
import { useStaffHome } from '@/lib/staff-home'
import { useSharedTabScreenOptions, tabBarIcon } from '@/components/tab-bar'
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

/** Module licence per tab — a tab whose backend would 403 must not show.
 *  Until home loads (modules unknown) tabs stay visible to avoid a flash. */
const TAB_MODULE: Record<string, string> = {
  leads: 'lead_management',
  attendance: 'attendance',
  fees: 'fee_management',
  students: 'student_management'
}

export default function OrgLayout() {
  const role = useAuthStore((s) => s.user?.role ?? '')
  const { data: home } = useStaffHome()
  const roleAllowed = ROLE_TABS[role] ?? ['home', 'students'] // unknown role: safest common ground
  const allowed = roleAllowed.filter((name) => {
    const mod = TAB_MODULE[name]
    if (!mod || !home) return true
    return home.modules.includes(mod)
  })
  const screenOptions = useSharedTabScreenOptions()

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
    <Tabs screenOptions={screenOptions}>
      {tab('home', 'Home', 'home')}
      {tab('leads', 'Leads', 'leads')}
      {tab('attendance', 'Attendance', 'attendance')}
      {tab('fees', 'Fees', 'fees')}
      {tab('students', 'Students', 'students')}
      {tab('more', 'More', 'more')}
      {/* Pushed from More/home/rows, not tabs themselves. */}
      <Tabs.Screen name="admissions" options={{ href: null }} />
      <Tabs.Screen name="whatsapp-inbox" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="event-create" options={{ href: null }} />
      <Tabs.Screen name="forms-review" options={{ href: null }} />
      <Tabs.Screen name="broadcast" options={{ href: null }} />
      <Tabs.Screen name="ai-chat" options={{ href: null }} />
      <Tabs.Screen name="leads/[id]" options={{ href: null }} />
      <Tabs.Screen name="students/[id]" options={{ href: null }} />
      <Tabs.Screen name="collections" options={{ href: null }} />
      <Tabs.Screen name="enroll" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="scan" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="schedule-week" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="session" options={{ href: null }} />
    </Tabs>
  )
}
