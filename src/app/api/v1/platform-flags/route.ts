import { NextRequest, NextResponse } from 'next/server'
import { getFeatureFlags } from '@/lib/platform-config'

// Public (org-authenticated) read of the platform feature flags, so CRM pages
// can reflect platform-wide switches. Non-sensitive booleans only. Auth is
// enforced by middleware for /api/v1/*.
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const flags = await getFeatureFlags()
  return NextResponse.json({
    enableWhatsapp: flags.enableWhatsapp,
    enableCampaignModule: flags.enableCampaignModule,
    enableAiFeatures: flags.enableAiFeatures,
    enablePublicApiAccess: flags.enablePublicApiAccess,
  })
}
