import EditCampaignDashboard from './EditCampaignDashboard'

export default async function CampaignEditPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  return <EditCampaignDashboard id={resolvedParams.id} />
}
