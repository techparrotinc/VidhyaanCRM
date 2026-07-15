import { useState } from 'react'
import { Text, Platform } from 'react-native'
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
    </Screen>
  )
}
