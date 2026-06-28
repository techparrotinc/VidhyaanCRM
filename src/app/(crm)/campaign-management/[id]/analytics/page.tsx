import AnalyticsDashboard from './AnalyticsDashboard'

export default async function CampaignAnalyticsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  return <AnalyticsDashboard id={resolvedParams.id} />
}
