import { useState } from 'react'
import { Pressable, Text, Platform } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { apiPublic } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { ListRow, Screen, PageTitle } from '@/components/ui'
import type { Workspace, TokensResponse } from '@/shared-contract'

export default function Picker() {
  const params = useLocalSearchParams<{ selectionToken: string; workspaces: string }>()
  const signIn = useAuthStore((s) => s.signIn)
  const [error, setError] = useState<string | null>(null)
  const workspaces: Workspace[] = JSON.parse(params.workspaces ?? '[]')

  const choose = async (assignmentId: string) => {
    setError(null)
    try {
      const res = await apiPublic<TokensResponse>('/api/mobile/v1/auth/select', {
        selectionToken: params.selectionToken,
        assignmentId,
        platform: Platform.OS === 'ios' ? 'ios' : 'android'
      })
      await signIn(res)
      router.replace('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  return (
    <Screen className="justify-center gap-3">
      <PageTitle>Choose workspace</PageTitle>
      <Text className="text-sm text-ink-secondary">
        This number is linked to more than one workspace.
      </Text>
      {workspaces.map((w) => (
        <ListRow
          key={w.assignmentId}
          title={w.orgName ?? (w.role === 'PARENT' ? 'Parent' : 'Vidhyaan Platform')}
          subtitle={w.role.replace(/_/g, ' ').toLowerCase()}
          onPress={() => choose(w.assignmentId)}
        />
      ))}
      {error ? <Text className="text-sm text-bad">{error}</Text> : null}

      {/* This is the tail end of login (before signIn() ever fires), so
          there's no session yet to "log out" of — just a way back to try a
          different number instead of being stuck here. */}
      <Pressable onPress={() => router.replace('/(auth)/login')} className="mt-4 items-center">
        <Text className="text-sm font-semibold text-brand">Use a different number</Text>
      </Pressable>
    </Screen>
  )
}
