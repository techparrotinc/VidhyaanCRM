import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireStaffClaims } from '@/lib/mobile-auth/guard'

/**
 * Staff in-app notification feed (wireframe s-notifs) — rows from
 * crm.notifications addressed to this user (recipientType USER). The web
 * emitters already write these; mobile only needs list + mark-read.
 * GET  ?category=leads|fees|attendance (optional) — newest first, 50 max
 * PATCH — marks everything read (single bulk action; per-row read state
 *         isn't worth the taps on a phone)
 */

export async function GET(req: NextRequest) {
  const auth = await requireStaffClaims(req)
  if ('error' in auth) return auth.error
  const { orgId, userId } = auth.claims

  const category = new URL(req.url).searchParams.get('category')

  const rows = await prisma.notification.findMany({
    where: {
      orgId,
      recipientType: 'USER',
      recipientId: userId,
      deletedAt: null,
      ...(category ? { data: { path: ['category'], equals: category } } : {})
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, title: true, body: true, data: true, readAt: true, createdAt: true }
  })

  const unread = await prisma.notification.count({
    where: { orgId, recipientType: 'USER', recipientId: userId, deletedAt: null, readAt: null }
  })

  return NextResponse.json({ success: true, unread, notifications: rows })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireStaffClaims(req)
  if ('error' in auth) return auth.error
  const { orgId, userId } = auth.claims

  await prisma.notification.updateMany({
    where: { orgId, recipientType: 'USER', recipientId: userId, deletedAt: null, readAt: null },
    data: { readAt: new Date() }
  })
  return NextResponse.json({ success: true })
}
