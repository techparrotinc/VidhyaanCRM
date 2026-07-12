import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ok, errorResponse } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'

const READ_ROLES = ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN']

/** GET — platform WhatsApp ops snapshot (last 24h sends, failures, opt-outs). */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) throw Errors.unauthenticated()
    if (!READ_ROLES.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin access required')
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [sends24h, failed24h, optOuts, inbound24h, recentFailures] = await Promise.all([
      prisma.whatsappMessage.count({ where: { createdAt: { gte: since } } }),
      prisma.whatsappMessage.count({ where: { createdAt: { gte: since }, status: 'FAILED' } }),
      prisma.whatsappOptOut.count(),
      prisma.whatsappInboundMessage.count({ where: { createdAt: { gte: since } } }),
      prisma.whatsappMessage.findMany({
        where: { status: 'FAILED', createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { templateName: true, error: true, orgId: true, createdAt: true }
      })
    ])

    return ok({
      sends24h,
      failed24h,
      failureRate: sends24h > 0 ? Math.round((failed24h / sends24h) * 1000) / 10 : 0,
      optOuts,
      inbound24h,
      recentFailures
    })
  } catch (error) {
    return errorResponse(error)
  }
}
