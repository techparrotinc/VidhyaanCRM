import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { api, apiPublic } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { Button, Screen, DetailHeader } from '@/components/ui'
import { OtpInput } from '@/components/OtpInput'

/** Set / change the login PIN — reachable from More + the avatar menu. */
export default function SetPin() {
  const phone = useAuthStore((s) => s.user?.phone ?? null)
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState<'enter' | 'confirm'>('enter')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [hasPin, setHasPin] = useState<boolean | null>(null)

  // Changing vs first-time setup changes the copy, not the flow — the
  // session (not the old PIN) authorizes the change, same as web Settings.
  useEffect(() => {
    if (!phone) return setHasPin(false)
    apiPublic<{ hasPin: boolean }>('/api/mobile/v1/auth/check', { phone })
      .then((r) => setHasPin(r.hasPin))
      .catch(() => setHasPin(false))
  }, [phone])

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      await api('/api/mobile/v1/auth/pin/set', {
        method: 'POST',
        body: JSON.stringify({ pin, confirmPin: confirm })
      })
      setDone(true)
      setTimeout(() => router.back(), 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setPin('')
      setConfirm('')
      setStep('enter')
    } finally {
      setLoading(false)
    }
  }

  const onEnterComplete = (v: string) => {
    setPin(v)
    if (v.length === 4) setStep('confirm')
  }

  return (
    <Screen header={<DetailHeader title={hasPin ? 'Change login PIN' : 'Set login PIN'} onBack={() => router.back()} />}>
      <View className="gap-5 pt-6">
        {done ? (
          <Text className="text-center text-base font-semibold text-good">
            {hasPin ? 'PIN changed. Use the new PIN at your next login.' : 'PIN set. Use it at your next login.'}
          </Text>
        ) : step === 'enter' ? (
          <>
            {hasPin ? (
              <Text className="text-center text-xs text-ink-faint">
                You already have a PIN — entering a new one below replaces it.
              </Text>
            ) : null}
            <Text className="text-center text-sm text-ink-secondary">
              {hasPin ? 'Choose your new 4-digit PIN' : 'Choose a 4-digit PIN for faster login'}
            </Text>
            <OtpInput value={pin} onChange={onEnterComplete} length={4} secure />
          </>
        ) : (
          <>
            <Text className="text-center text-sm text-ink-secondary">Re-enter the same PIN</Text>
            <OtpInput value={confirm} onChange={setConfirm} length={4} secure />
            {confirm.length === 4 && confirm !== pin ? (
              <Text className="text-center text-sm text-bad">PINs do not match</Text>
            ) : null}
            <Button
              label="Save PIN"
              onPress={submit}
              loading={loading}
              disabled={confirm.length !== 4 || confirm !== pin}
            />
          </>
        )}
        {error ? <Text className="text-center text-sm text-bad">{error}</Text> : null}
      </View>
    </Screen>
  )
}
