import { useState } from 'react'
import { Text, Platform } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { apiPublic } from '@/lib/api'
import { useAuthStore, getDeviceId } from '@/lib/auth-store'
import { Button, Screen } from '@/components/ui'
import { OtpInput } from '@/components/OtpInput'
import type { VerifyResponse } from '@/shared-contract'

export default function Otp() {
  const { phone } = useLocalSearchParams<{ phone: string }>()
  const signIn = useAuthStore((s) => s.signIn)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      const deviceId = await getDeviceId()
      const res = await apiPublic<VerifyResponse>('/api/mobile/v1/auth/verify', {
        phone: `+91${phone}`,
        code,
        deviceId,
        platform: Platform.OS === 'ios' ? 'ios' : 'android'
      })
      if ('selectionRequired' in res) {
        router.push({
          pathname: '/(auth)/picker',
          params: { selectionToken: res.selectionToken, workspaces: JSON.stringify(res.workspaces) }
        })
      } else if ('twoFactorRequired' in res) {
        router.push({ pathname: '/(auth)/twofa', params: { challengeToken: res.challengeToken } })
      } else {
        await signIn(res)
        router.replace('/')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen className="justify-center gap-5">
      <Text className="text-center text-2xl font-bold tracking-tight text-ink">Verify phone</Text>
      <Text className="text-center text-sm text-ink-secondary">
        Enter the 6-digit code sent to +91 {phone}
      </Text>
      <OtpInput value={code} onChange={setCode} />
      {error ? <Text className="text-center text-sm text-bad">{error}</Text> : null}
      <Button label="Verify" onPress={submit} loading={loading} disabled={code.length !== 6} />
    </Screen>
  )
}
