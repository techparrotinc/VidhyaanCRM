import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { renderEmailHtml } from '@/lib/mail/org-templates'
import { sendMeteredSms, sendMeteredWhatsApp } from '@/lib/credits/metered-send'

const schema = z.object({
  ids: z.array(z.string()).min(1),
  channel: z.enum(['email', 'sms', 'whatsapp']),
  subject: z.string().max(200).optional(),
  // required for email / sms
  message: z.string().max(2000).optional(),
  // required for whatsapp — an approved template + positional {{1}}..{{n}} params
  templateId: z.string().optional(),
  parameters: z.array(z.string().max(400)).max(10).optional(),
}).refine(
  (v) => (v.channel === 'whatsapp' ? !!v.templateId : !!v.message && v.message.trim().length > 0),
  { message: 'message is required for email/sms; templateId is required for whatsapp' }
)

/**
 * Bulk-send a one-off communication (email or SMS) to the contacts on the
 * selected admission records. Email uses the org transactional pipeline;
 * SMS routes through metered-send (BYO creds first, else 1 credit/msg).
 * Best-effort per recipient — one bad address never fails the batch.
 */
export const POST = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST,
  ],
  handler: async ({ req, db, user }) => {
    const body = schema.parse(await req.json())

    const admissions = await db.admission.findMany({
      where: { id: { in: body.ids }, deletedAt: null },
      select: {
        id: true,
        applicantName: true,
        parentName: true,
        phone: true,
        email: true,
      },
    })
    if (admissions.length === 0) throw Errors.notFound('Admission')

    // WhatsApp needs an approved template resolved up-front
    let waTemplate: {
      msg91TemplateId: string
      language: string
      metaCategory: string | null
    } | null = null
    if (body.channel === 'whatsapp') {
      const t = await db.whatsappTemplate.findFirst({
        where: { id: body.templateId, orgId: user.orgId, deletedAt: null },
        select: { msg91TemplateId: true, language: true, metaCategory: true, status: true },
      })
      if (!t) throw Errors.notFound('WhatsApp template')
      if (t.status === 'DRAFT') throw Errors.businessRule('Template is not approved yet')
      waTemplate = t
    }

    let sent = 0
    let skipped = 0
    let failed = 0

    for (const adm of admissions) {
      const name = adm.parentName || adm.applicantName || ''
      const text = (body.message ?? '').replace(/\{name\}/gi, name)
      try {
        if (body.channel === 'whatsapp') {
          if (!adm.phone) { skipped++; continue }
          const params = (body.parameters ?? []).map(p => p.replace(/\{name\}/gi, name))
          await sendMeteredWhatsApp(
            user.orgId, adm.phone, waTemplate!.msg91TemplateId, '', `admission:${adm.id}`,
            {
              language: waTemplate!.language,
              parameters: params.length ? params : undefined,
              credits: waTemplate!.metaCategory === 'MARKETING' ? 2 : 1,
            }
          )
          sent++
        } else if (body.channel === 'email') {
          if (!adm.email || !adm.email.includes('@')) {
            skipped++
            continue
          }
          const res = await sendTransactionalEmail({
            to: adm.email,
            toName: name || undefined,
            subject: body.subject || 'A message from your school',
            htmlBody: renderEmailHtml(text),
            textBody: text,
          })
          if (res.success) sent++
          else skipped++
        } else {
          if (!adm.phone) {
            skipped++
            continue
          }
          await sendMeteredSms(user.orgId, adm.phone, text, `admission:${adm.id}`)
          sent++
        }

        await db.admissionActivity.create({
          data: {
            orgId: user.orgId,
            admissionId: adm.id,
            type: 'SYSTEM',
            summary: `${body.channel === 'email' ? 'Email' : body.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} sent to contact`,
            performedById: user.id,
          },
        }).catch(() => {})
      } catch (err) {
        console.error(`communicate: send failed (${adm.id})`, err)
        failed++
      }
    }

    return ok({ sent, skipped, failed, total: admissions.length })
  },
})
