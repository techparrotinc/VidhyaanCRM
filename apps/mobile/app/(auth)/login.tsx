import { useState } from 'react'
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { apiPublic, ApiError } from '@/lib/api'
import { Button, Screen } from '@/components/ui'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      await apiPublic('/api/mobile/v1/auth/otp', { phone: `+91${phone}` })
      router.push({ pathname: '/(auth)/otp', params: { phone } })
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setError('This number is not registered. Parents: ask your school to add you as a guardian. Staff: ask your admin to invite you.')
      } else {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen className="justify-center gap-4">
        <View className="items-center gap-1">
          <View className="mb-2 h-16 w-16 rounded-2xl bg-brand-soft" />
          <Text className="text-xl font-extrabold tracking-tight text-brand">Vidhyaan</Text>
          <Text className="text-2xl font-bold tracking-tight text-ink">Sign in</Text>
          <Text className="text-sm text-ink-secondary">
            One account — parent, school &amp; admin
          </Text>
        </View>
        <View className="flex-row items-center gap-2 rounded-xl border border-line bg-white px-3">
          <Text className="text-sm font-semibold text-ink-secondary">+91</Text>
          <TextInput
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
            keyboardType="phone-pad"
            placeholder="Phone number"
            className="flex-1 py-3 text-base text-ink"
            autoFocus
          />
        </View>
        {error ? <Text className="text-sm text-bad">{error}</Text> : null}
        <Button label="Continue" onPress={submit} loading={loading} disabled={phone.length !== 10} />
        <Text className="text-center text-xs text-ink-faint">
          OTP will be sent by SMS / WhatsApp
        </Text>
      </Screen>
    </KeyboardAvoidingView>
  )
}
