import { useEffect, useState } from 'react'
import { Platform, Text, View } from 'react-native'
import { Screen, Button } from '@/components/ui'
import { OtpInput } from '@/components/OtpInput'
import { apiPublic, ApiError } from '@/lib/api'
import { useAuthStore, getDeviceId } from '@/lib/auth-store'

/**
 * App-PIN lock gate, shown over a signed-in session until unlocked — same
 * credential as PIN login (one PIN everywhere, replaces the old biometric
 * prompt). Verified server-side via /auth/pin (argon2 + lockout). Accounts
 * without a PIN auto-unlock: /auth/check says hasPin=false.
 */
export function LockScreen() {
  const unlock = useAuthStore((s) => s.unlock)
  const signOut = useAuthStore((s) => s.signOut)
  const phone = useAuthStore((s) => s.user?.phone ?? null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  // No PIN on the account (or no phone stored) = nothing to gate with.
  useEffect(() => {
    let live = true
    ;(async () => {
      if (!phone) return unlock()
      try {
        const res = await apiPublic<{ hasPin: boolean }>('/api/mobile/v1/auth/check', { phone })
        if (live && !res.hasPin) unlock()
      } catch {
        // Offline / server hiccup: keep the gate but let PIN entry decide.
      }
    })()
    return () => {
      live = false
    }
  }, [phone, unlock])

  const submit = async (value: string) => {
    if (!phone || value.length !== 4) return
    setChecking(true)
    setError(null)
    try {
      const deviceId = await getDeviceId()
      await apiPublic('/api/mobile/v1/auth/pin', {
        phone,
        pin: value,
        deviceId,
        platform: Platform.OS === 'ios' ? 'ios' : 'android'
      })
      unlock()
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
        setError('Could not verify — check your connection.')
      }
    } finally {
      setChecking(false)
    }
  }

  const onChange = (v: string) => {
    setPin(v)
    if (v.length === 4 && !checking) void submit(v)
  }

  return (
    <Screen className="gap-5 pt-16">
      <View className="items-center gap-2">
        <View className="mb-2 h-16 w-16 rounded-2xl bg-brand-soft" />
        <Text className="text-2xl font-bold tracking-tight text-ink">Vidhyaan is locked</Text>
        <Text className="text-center text-sm text-ink-secondary">
          {checking ? 'Verifying…' : 'Enter your Vidhyaan PIN'}
        </Text>
      </View>
      <OtpInput value={pin} onChange={onChange} length={4} secure />
      {error ? <Text className="text-center text-sm text-bad">{error}</Text> : null}
      <Button label="Sign out & use OTP" variant="quiet" onPress={() => void signOut()} />
    </Screen>
  )
}
