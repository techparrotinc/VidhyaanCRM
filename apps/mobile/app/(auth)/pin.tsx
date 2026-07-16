import { useState } from 'react'
import { ActivityIndicator, Text, View, Platform, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { apiPublic, ApiError } from '@/lib/api'
import { useAuthStore, getDeviceId } from '@/lib/auth-store'
import { Screen } from '@/components/ui'
import { OtpInput } from '@/components/OtpInput'
import type { VerifyResponse } from '@/shared-contract'

/**
 * PIN login — shown when /auth/check says the account has a PIN set (on the
 * web, Settings → Security). Forgot PIN falls back to the normal OTP flow.
 */
export default function Pin() {
  const { phone, name } = useLocalSearchParams<{ phone: string; name?: string }>()
  const signIn = useAuthStore((s) => s.signIn)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)

  const submit = async (value = pin) => {
    if (value.length !== 4 || loading) return
    setError(null)
    setLoading(true)
    try {
      const deviceId = await getDeviceId()
      const res = await apiPublic<VerifyResponse>('/api/mobile/v1/auth/pin', {
        phone: `+91${phone}`,
        pin: value,
        deviceId,
        platform: Platform.OS === 'ios' ? 'ios' : 'android'
      })
      if ('selectionRequired' in res) {
        router.push({
          pathname: '/(auth)/picker',
          params: { selectionToken: res.selectionToken, workspaces: JSON.stringify(res.workspaces) }
        })
      } else if ('twoFactorRequired' in res) {
        router.push({
          pathname: '/(auth)/twofa',
          params: {
            challengeToken: res.challengeToken,
            ...(res.method ? { method: res.method } : {}),
            ...(res.maskedPhone ? { maskedPhone: res.maskedPhone } : {})
          }
        })
      } else {
        await signIn(res)
        router.replace('/')
      }
    } catch (e) {
      setPin('')
      if (e instanceof ApiError) {
        const attemptsLeft = e.data?.attemptsLeft
        setError(
          typeof attemptsLeft === 'number'
            ? `${e.message} — ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left`
            : e.message
        )
      } else {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const useOtpInstead = async () => {
    setError(null)
    setOtpLoading(true)
    try {
      await apiPublic('/api/mobile/v1/auth/otp', { phone: `+91${phone}` })
      router.push({ pathname: '/(auth)/otp', params: { phone } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setOtpLoading(false)
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
              <Ionicons name="lock-closed" size={26} color="#fff" />
            </LinearGradient>
          </View>
          <Text className="text-center text-2xl font-bold tracking-tight text-ink">
            {name ? `Hi, ${name}` : 'Welcome back'}
          </Text>
          <Text className="text-center text-sm text-ink-secondary">Enter your Vidhyaan PIN</Text>
        </View>
        <OtpInput
          value={pin}
          onChange={(v) => {
            setPin(v)
            if (v.length === 4) void submit(v)
          }}
          length={4}
          secure
        />
        {loading ? <ActivityIndicator color="#1565D8" /> : null}
        {error ? <Text className="text-center text-sm text-bad">{error}</Text> : null}
        <Pressable onPress={useOtpInstead} disabled={otpLoading} className="active:opacity-70">
          <Text className="text-center text-sm font-semibold text-brand">
            {otpLoading ? 'Sending OTP…' : 'Forgot PIN? Login with OTP'}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="active:opacity-70">
          <Text className="text-center text-sm text-ink-secondary">Use a different number</Text>
        </Pressable>
      </View>
    </Screen>
  )
}
// PIN auto-submits on the 4th digit — no separate button (fewer taps, and
// the "Unlock" label read like a second unrelated action).
