import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUsageOverview } from '@/lib/usage/overview'

// Platform-wide usage & health overview across all organizations.
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10)
    const data = await getUsageOverview(days)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Usage overview API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
