import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { Screen, Button } from '@/components/ui'
import { authenticateBiometric } from '@/lib/biometric'
import { useAuthStore } from '@/lib/auth-store'

/** Biometric app-lock gate, shown over a signed-in session until unlocked. */
export function LockScreen() {
  const unlock = useAuthStore((s) => s.unlock)
  const signOut = useAuthStore((s) => s.signOut)
  const [failed, setFailed] = useState(false)
  const [checking, setChecking] = useState(false)

  const attempt = async () => {
    setChecking(true)
    setFailed(false)
    const ok = await authenticateBiometric()
    setChecking(false)
    if (ok) unlock()
    else setFailed(true)
  }

  // Prompt immediately on mount so the user isn't stuck tapping a button
  // every single time — they can still retry manually if it's dismissed.
  useEffect(() => {
    void attempt()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Screen className="justify-center gap-4">
      <View className="items-center gap-2">
        <View className="mb-2 h-16 w-16 rounded-2xl bg-brand-soft" />
        <Text className="text-2xl font-bold tracking-tight text-ink">Vidhyaan is locked</Text>
        <Text className="text-center text-sm text-ink-secondary">
          {failed ? "Couldn't verify — try again." : 'Verify your identity to continue.'}
        </Text>
      </View>
      <Button label={checking ? 'Verifying…' : 'Unlock'} onPress={attempt} loading={checking} />
      <Button label="Sign out" variant="quiet" onPress={() => void signOut()} />
    </Screen>
  )
}
