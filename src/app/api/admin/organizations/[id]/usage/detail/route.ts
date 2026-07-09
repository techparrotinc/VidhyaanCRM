import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getOrgUsageDetail } from '@/lib/usage/aggregate'

// Detailed per-org usage metrics: per-module + per-user breakdown, composite
// health score, active time (heartbeats), and a cost-savings / ROI model.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10)
    const detail = await getOrgUsageDetail(id, days)
    if (!detail) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    return NextResponse.json(detail)
  } catch (error: any) {
    console.error('Org usage detail API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
