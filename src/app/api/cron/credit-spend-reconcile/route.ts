import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { refundSpendIntent } from '@/lib/credits/engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Sweeps the crash-window gap in metered-send.ts / campaigns/[id]/send:
// a credit debit and the external send it pays for can't share a DB
// transaction, so a process crash/timeout between the two leaves a
// MessageSpendIntent stuck PENDING with no confirm/refund ever called.
// Anything still PENDING past STALE_MINUTES almost certainly means that —
// a healthy request confirms or refunds within seconds — so it's refunded
// automatically here rather than lost silently.
const STALE_MINUTES = 15

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const staleCutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000)
  const stale = await prisma.messageSpendIntent.findMany({
    where: { status: 'PENDING', createdAt: { lt: staleCutoff } },
    select: { id: true, orgId: true, channel: true, qty: true, ref: true },
    take: 500
  })

  let refunded = 0
  const errors: string[] = []
  for (const intent of stale) {
    try {
      await refundSpendIntent(intent.id)
      refunded++
    } catch (err: any) {
      errors.push(`${intent.id} (org ${intent.orgId}, ${intent.qty} ${intent.channel}, ref ${intent.ref ?? '—'}): ${err.message}`)
    }
  }

  if (errors.length > 0) {
    console.error('credit-spend-reconcile: refund failures needing manual follow-up:', errors)
  }

  return NextResponse.json({
    success: true,
    found: stale.length,
    refunded,
    failed: errors.length,
    errors
  })
}
