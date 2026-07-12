import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { prisma } from '@/lib/db/client'
import { MODULES } from '@/constants/modules'

/**
 * GET — parent replies received on the shared WhatsApp number, attributed
 * to this org (attribution = the org that last messaged that phone).
 * Each row carries a best-effort lead/admission match by phone for context.
 */
export const GET = route({
  module: MODULES.WHATSAPP_ADDON,
  handler: async ({ user }) => {
    const inbound = await prisma.whatsappInboundMessage.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: 'desc' },
      take: 200
    })

    const phones = Array.from(new Set(inbound.map(m => m.phone)))
    const [leads, admissions] = await Promise.all([
      prisma.lead.findMany({
        where: { orgId: user.orgId, phoneNormalized: { in: phones }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true, parentName: true, kidName: true, phoneNormalized: true }
      }),
      prisma.admission.findMany({
        where: { orgId: user.orgId, phoneNormalized: { in: phones }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { id: true, parentName: true, applicantName: true, phoneNormalized: true }
      })
    ])
    const leadByPhone = new Map(leads.reverse().map(l => [l.phoneNormalized, l]))
    const admissionByPhone = new Map(admissions.reverse().map(a => [a.phoneNormalized, a]))

    return ok(
      inbound.map(m => {
        const lead = leadByPhone.get(m.phone)
        const admission = admissionByPhone.get(m.phone)
        return {
          id: m.id,
          phone: m.phone,
          body: m.body,
          createdAt: m.createdAt,
          contactName: admission?.parentName || lead?.parentName || null,
          leadId: lead?.id ?? null,
          admissionId: admission?.id ?? null
        }
      })
    )
  }
})
