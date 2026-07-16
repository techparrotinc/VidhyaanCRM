import { useState } from 'react'
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
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
      <Screen className="justify-center gap-5">
        <View className="items-center gap-2">
          <View className="mb-1 h-20 w-20 overflow-hidden rounded-[28px]">
            <LinearGradient
              colors={['#1565D8', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-full w-full items-center justify-center"
            >
              <Ionicons name="school" size={38} color="#fff" />
            </LinearGradient>
          </View>
          <Text className="text-2xl font-extrabold tracking-tight text-brand">Vidhyaan</Text>
          <Text className="text-lg font-bold tracking-tight text-ink">Sign in</Text>
          <Text className="text-center text-sm text-ink-secondary">
            One account — parent, school &amp; admin
          </Text>
        </View>
        <View className="flex-row items-center gap-2 rounded-2xl border border-line bg-white px-3.5">
          <Ionicons name="call-outline" size={18} color="#94A3B8" />
          <Text className="text-sm font-semibold text-ink-secondary">+91</Text>
          <TextInput
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
            keyboardType="phone-pad"
            placeholder="Phone number"
            placeholderTextColor="#94A3B8"
            className="flex-1 py-3.5 text-base text-ink"
            autoFocus
          />
        </View>
        {error ? (
          <View className="flex-row items-start gap-2 rounded-2xl bg-bad-bg px-3.5 py-2.5">
            <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-sm text-bad">{error}</Text>
          </View>
        ) : null}
        <Button label="Continue" onPress={submit} loading={loading} disabled={phone.length !== 10} />
        <View className="flex-row items-center justify-center gap-1.5">
          <Ionicons name="chatbubble-ellipses-outline" size={14} color="#94A3B8" />
          <Text className="text-center text-xs text-ink-faint">
            OTP will be sent by SMS / WhatsApp
          </Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  )
}
