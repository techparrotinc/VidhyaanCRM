import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { prisma } from '@/lib/db/client'

export const GET = route({
  handler: async ({ user }) => {
    const org = await prisma.organization.findUnique({
      where: { id: user.orgId },
      select: { institutionType: true }
    })
    
    const addon = await prisma.organizationModule.findFirst({
      where: {
        orgId: user.orgId,
        module: {
          slug: 'whatsapp_addon'
        },
        enabled: true
      }
    })

    return ok({
      institutionType: org?.institutionType || 'SCHOOL',
      isWhatsappActive: !!addon
    })
  }
})
