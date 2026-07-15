import { Text } from 'react-native'
import { Screen, PageTitle, Card } from '@/components/ui'

export default function Attendance() {
  return (
    <Screen>
      <PageTitle>Attendance</PageTitle>
      <Card className="mt-4">
        <Text className="text-sm text-ink-secondary">Phase 1 screen — wireframe approved (v7).</Text>
      </Card>
    </Screen>
  )
}
