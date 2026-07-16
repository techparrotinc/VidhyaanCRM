import { useState } from 'react'
import { Text, View, Platform, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { apiPublic } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { Button, Screen } from '@/components/ui'
import { OtpInput } from '@/components/OtpInput'
import type { TokensResponse } from '@/shared-contract'

export default function TwoFactor() {
  const { challengeToken, method, maskedPhone } = useLocalSearchParams<{
    challengeToken: string
    method?: string
    maskedPhone?: string
  }>()
  const signIn = useAuthStore((s) => s.signIn)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [smsState, setSmsState] = useState<'idle' | 'sending' | 'sent'>(
    method === 'SMS' ? 'sent' : 'idle'
  )
  const [smsPhone, setSmsPhone] = useState<string | null>(maskedPhone ?? null)

  const requestSms = async () => {
    setError(null)
    setSmsState('sending')
    try {
      const res = await apiPublic<{ maskedPhone: string }>('/api/mobile/v1/auth/2fa/sms', {
        challengeToken
      })
      setSmsPhone(res.maskedPhone)
      setSmsState('sent')
    } catch (e) {
      setSmsState('idle')
      setError(e instanceof Error ? e.message : 'Could not send the SMS code')
    }
  }

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
    <Screen>
      <View className="gap-5 pt-4">
        <View className="items-center gap-3">
          <View className="h-16 w-16 overflow-hidden rounded-3xl">
            <LinearGradient
              colors={['#1565D8', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-full w-full items-center justify-center"
            >
              <Ionicons name="keypad" size={26} color="#fff" />
            </LinearGradient>
          </View>
          <Text className="text-center text-2xl font-bold tracking-tight text-ink">
            Two-step verification
          </Text>
          <Text className="text-center text-sm text-ink-secondary">
            {smsState === 'sent' && smsPhone
              ? `Enter the code sent by SMS to ${smsPhone}`
              : 'Enter the code from your authenticator app'}
          </Text>
        </View>
        <OtpInput value={code} onChange={setCode} />
        {error ? <Text className="text-center text-sm text-bad">{error}</Text> : null}
        <Button label="Verify" onPress={submit} loading={loading} disabled={code.length < 6} />
        {smsState !== 'sent' ? (
          <Pressable onPress={requestSms} disabled={smsState === 'sending'} className="active:opacity-70">
            <Text className="text-center text-sm font-semibold text-brand">
              {smsState === 'sending' ? 'Sending SMS…' : 'Use SMS code instead'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  )
}
