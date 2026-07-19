import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { prisma } from '@/lib/db/client'

export const GET = route({
  handler: async ({ user }) => {
    const org = await prisma.organization.findUnique({
      where: { id: user.orgId },
      select: {
        institutionType: true,
        status: true,
        plan: { select: { slug: true, monthlyPrice: true } }
      }
    })
    // Same definition as the dashboard summary meta — drives the header
    // Upgrade button for non-paying orgs.
    const isPaid =
      (org?.status as string) === 'ACTIVE' &&
      org?.plan?.slug !== 'free' &&
      Number(org?.plan?.monthlyPrice ?? 0) > 0
    
    // One query feeds both the WhatsApp add-on flag and the module locks the
    // settings nav renders (premium settings grey out on the free plan).
    const orgModules = await prisma.organizationModule.findMany({
      where: { orgId: user.orgId, enabled: true },
      select: { module: { select: { slug: true } } }
    })
    const enabledModules = orgModules.map((m) => m.module.slug)

    return ok({
      institutionType: org?.institutionType || 'SCHOOL',
      isWhatsappActive: enabledModules.includes('whatsapp_addon'),
      enabledModules,
      isPaid
    })
  }
})
