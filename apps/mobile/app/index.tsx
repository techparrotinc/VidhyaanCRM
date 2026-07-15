import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuthStore } from '@/lib/auth-store'

/** Entry: route by auth state, then by journey (parent / org / admin). */
export default function Index() {
  const { status, user } = useAuthStore()

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-brand-bg">
        <ActivityIndicator color="#1565D8" size="large" />
      </View>
    )
  }

  if (status === 'signedOut') return <Redirect href="/(auth)/login" />

  const role = user?.role ?? ''
  if (role === 'PARENT') return <Redirect href="/(parent)/home" />
  if (['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role)) {
    return <Redirect href="/(admin)/pulse" />
  }
  return <Redirect href="/(org)/home" />
}
