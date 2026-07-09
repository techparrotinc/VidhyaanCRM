import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { moduleFromPagePath } from '@/lib/usage/modules'

/**
 * Active-time heartbeat. The CRM client posts every ~60s while a tab is
 * visible/focused; each row represents ~1 active minute in the current module.
 *
 * Deliberately NOT wrapped in route(): it must be ultra-cheap and must not
 * itself emit a feature-usage event. Identity comes from the headers the
 * middleware sets after session verification (never trusted from the client).
 */
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    const orgId = req.headers.get('x-org-id')
    if (!userId || !orgId) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    let path = ''
    try {
      const body = await req.json()
      path = typeof body?.path === 'string' ? body.path : ''
    } catch {
      /* empty body tolerated */
    }
    const feature = moduleFromPagePath(path)

    await prisma.usageHeartbeat.create({
      data: { orgId, userId, feature },
    }).catch(() => { /* best-effort */ })

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
