import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { signAiServiceToken } from '@/lib/ai/service-token'

const PLATFORM_ROLES = ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN']
const GATEWAY = process.env.NEXT_PUBLIC_AI_GATEWAY_URL ?? 'https://ai.vidhyaan.com'

/**
 * GET /api/admin/ai-metrics — rolling AI health & quality (last 7 days) from
 * the gateway, with org ids resolved to names for the traces table.
 */
export async function GET() {
  try {
    const session = await auth()
    const role = session?.user?.role ?? ''
    if (!session?.user || !PLATFORM_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const res = await fetch(`${GATEWAY}/v1/ai/admin/metrics`, {
      headers: { 'x-ai-service-token': signAiServiceToken(session.user.id, 'platform', role) },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000)
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Gateway metrics unavailable' }, { status: 502 })
    }
    const metrics = await res.json()

    // resolve org names for the recent-traces table
    const orgIds: string[] = [
      ...new Set(((metrics.recentTraces ?? []) as any[]).map((t) => String(t.orgId)))
    ]
    const orgs = orgIds.length
      ? await prisma.organization.findMany({ where: { id: { in: orgIds } }, select: { id: true, name: true } })
      : []
    const nameById = new Map(orgs.map(o => [o.id, o.name]))
    metrics.recentTraces = (metrics.recentTraces ?? []).map((t: any) => ({
      ...t,
      orgName: nameById.get(t.orgId) ?? t.orgId
    }))

    return NextResponse.json(metrics)
  } catch (err) {
    console.error('ai-metrics admin route', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
