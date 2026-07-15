import { useState } from 'react'
import { Text, Platform } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { apiPublic } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { Button, Screen } from '@/components/ui'
import { OtpInput } from '@/components/OtpInput'
import type { TokensResponse } from '@vidhyaan/shared'

export default function TwoFactor() {
  const { challengeToken } = useLocalSearchParams<{ challengeToken: string }>()
  const signIn = useAuthStore((s) => s.signIn)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await apiPublic<TokensResponse>('/api/mobile/v1/auth/2fa', {
        challengeToken,
        code,
        platform: Platform.OS === 'ios' ? 'ios' : 'android'
      })
      await signIn(res)
      router.replace('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen className="justify-center gap-5">
      <Text className="text-center text-2xl font-bold tracking-tight text-ink">
        Two-step verification
      </Text>
      <Text className="text-center text-sm text-ink-secondary">
        Enter the code from your authenticator app
      </Text>
      <OtpInput value={code} onChange={setCode} />
      {error ? <Text className="text-center text-sm text-bad">{error}</Text> : null}
      <Button label="Verify" onPress={submit} loading={loading} disabled={code.length < 6} />
    </Screen>
  )
}
