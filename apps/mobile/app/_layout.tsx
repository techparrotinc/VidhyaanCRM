import '../global.css'
import { useEffect, useRef } from 'react'
import { AppState, View, type AppStateStatus } from 'react-native'
import * as Notifications from 'expo-notifications'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold
} from '@expo-google-fonts/poppins'
import { useAuthStore } from '@/lib/auth-store'
import { registerForPushNotifications } from '@/lib/push'
import { biometricAvailable } from '@/lib/biometric'
import { resolveNotificationRoute } from '@/lib/notification-routes'
import { initCrashReporting, setCrashUser } from '@/lib/crash-reporting'
import { syncAttendanceQueue } from '@/lib/attendance-queue'
import { LockScreen } from '@/components/LockScreen'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 }
  }
})

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    ...Ionicons.font
  })
  const hydrate = useAuthStore((s) => s.hydrate)
  const status = useAuthStore((s) => s.status)
  const locked = useAuthStore((s) => s.locked)
  const lock = useAuthStore((s) => s.lock)
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    initCrashReporting()
  }, [])

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Tag crash reports with the signed-in user (id only) so a report can be
  // traced back to an account for support — cleared on sign-out.
  useEffect(() => {
    setCrashUser(userId)
  }, [userId])

  // Fires on fresh login (status flips signedOut -> signedIn) and on every
  // relaunch of an already-signed-in session (status settles to signedIn
  // post-hydrate) — covers token refreshes after reinstalls too.
  useEffect(() => {
    if (status === 'signedIn') void registerForPushNotifications()
  }, [status])

  // Push-tap navigation: a tapped notification's `data.url`/`href` routes
  // straight to the relevant screen. Covers both "app was backgrounded" (the
  // listener) and "app was killed, tap launched it" (the last-response
  // check) — Expo fires the listener for the latter too on some platforms,
  // but the explicit check is the documented reliable path.
  useEffect(() => {
    const openFromResponse = (response: Notifications.NotificationResponse | null) => {
      const route = resolveNotificationRoute(response?.notification.request.content.data ?? null)
      if (route) router.push(route as any)
    }
    void Notifications.getLastNotificationResponseAsync().then(openFromResponse)
    const sub = Notifications.addNotificationResponseReceivedListener(openFromResponse)
    return () => sub.remove()
  }, [])

  // Re-lock on every background -> foreground transition, not just cold
  // launch — the whole point of a biometric app-lock is guarding against
  // someone picking up an unlocked phone. Same transition also opportunistically
  // flushes the offline attendance queue — coming back to foreground is the
  // best available signal that connectivity may have returned (no NetInfo
  // dependency needed: a queued row that fails again just stays queued).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const cameToForeground = appState.current.match(/inactive|background/) && next === 'active'
      appState.current = next
      if (cameToForeground && useAuthStore.getState().status === 'signedIn') {
        void biometricAvailable().then((available) => {
          if (available) lock()
        })
        void syncAttendanceQueue().catch(() => {})
      }
    })
    return () => sub.remove()
  }, [lock])

  // Also try once at cold launch (app opened straight into connectivity).
  useEffect(() => {
    if (status === 'signedIn') void syncAttendanceQueue().catch(() => {})
  }, [status])

  const showLock = status === 'signedIn' && locked

  if (!fontsLoaded) return <View className="flex-1 bg-brand-bg" />

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        {showLock ? <LockScreen /> : <Stack screenOptions={{ headerShown: false }} />}
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
