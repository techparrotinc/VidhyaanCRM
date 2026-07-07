import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { prisma } from '@/lib/db/client'
import { ROLES } from '@/constants/roles'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'

/**
 * POST — org requests WhatsApp add-on activation. Enablement itself stays
 * a platform-admin action (existing admin modules toggle); this notifies
 * ops and leaves an audit trail.
 */
export const POST = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ user, org }) => {
    const organization = await prisma.organization.findUnique({
      where: { id: org.id },
      select: { name: true, email: true, phone: true }
    })

    await prisma.auditLog.create({
      data: {
        orgId: org.id,
        userId: user.id,
        action: 'CREATE',
        entityType: 'OrganizationModule',
        entityId: 'whatsapp_addon',
        after: { addon: 'whatsapp_addon', requestedBy: user.name }
      }
    })

    const opsEmail = process.env.OPS_ALERT_EMAIL || process.env.ZEPTO_FROM_EMAIL
    if (opsEmail) {
      await sendTransactionalEmail({
        to: opsEmail,
        toName: 'Vidhyaan Ops',
        subject: `WhatsApp add-on activation request — ${organization?.name ?? org.id}`,
        htmlBody: `<p><strong>${organization?.name ?? org.id}</strong> requested WhatsApp add-on activation.</p>
<p>Org ID: ${org.id}<br/>Contact: ${organization?.email ?? '—'} · ${organization?.phone ?? '—'}<br/>Requested by: ${user.name} (${user.id})</p>
<p>Enable it from Admin → Organizations → Modules.</p>`
      }).catch(err => console.error('WhatsApp addon request email failed:', err))
    }

    return ok({ requested: true })
  }
})
