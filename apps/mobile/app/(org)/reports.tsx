import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen, GradientHeader, Card, StatTile } from '@/components/ui'
import { useReportSummary, formatKpiValue, MOBILE_REPORT_CARDS } from '@/lib/reports'

function ReportCard({ reportKey, title }: { reportKey: string; title: string }) {
  const { data, isLoading, isError } = useReportSummary(reportKey)

  return (
    <Card className="mt-3">
      <Text className="text-sm font-bold text-ink">{title}</Text>
      {isLoading ? (
        <View className="mt-4 items-center">
          <ActivityIndicator color="#1565D8" />
        </View>
      ) : isError ? (
        <Text className="mt-2 text-xs text-bad">Couldn't load this report.</Text>
      ) : data ? (
        <>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {data.kpis.map((kpi) => (
              <View key={kpi.key} style={{ minWidth: '46%', flexGrow: 1 }}>
                <StatTile label={kpi.label} value={formatKpiValue(kpi)} hint={kpi.caption} />
              </View>
            ))}
          </View>
          {data.insight ? <Text className="mt-3 text-xs italic text-ink-secondary">{data.insight}</Text> : null}
        </>
      ) : null}
    </Card>
  )
}

export default function Reports() {
  return (
    <Screen
      header={
        <GradientHeader
          title="Reports"
          subtitle="This month at a glance"
          accent="brand"
          right={
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:opacity-70">
              <Text className="text-lg font-bold text-white">×</Text>
            </Pressable>
          }
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {MOBILE_REPORT_CARDS.map((c) => (
          <ReportCard key={c.key} reportKey={c.key} title={c.title} />
        ))}
        <Text className="mt-4 text-center text-[11px] text-ink-faint">Full reports with filters and exports are on the web app.</Text>
      </ScrollView>
    </Screen>
  )
}
