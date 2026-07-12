import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { prisma } from '@/lib/db/client'
import { MODULES } from '@/constants/modules'

/** GET — outbound WhatsApp message log for this org (delivery statuses). */
export const GET = route({
  module: MODULES.WHATSAPP_ADDON,
  handler: async ({ user }) => {
    const messages = await prisma.whatsappMessage.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        phone: true,
        templateName: true,
        ref: true,
        status: true,
        error: true,
        createdAt: true,
        updatedAt: true
      }
    })
    return ok(messages)
  }
})
