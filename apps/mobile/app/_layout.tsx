import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/auth-store'
import { registerForPushNotifications } from '@/lib/push'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 }
  }
})

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate)
  const status = useAuthStore((s) => s.status)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Fires on fresh login (status flips signedOut -> signedIn) and on every
  // relaunch of an already-signed-in session (status settles to signedIn
  // post-hydrate) — covers token refreshes after reinstalls too.
  useEffect(() => {
    if (status === 'signedIn') void registerForPushNotifications()
  }, [status])

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  )
}
