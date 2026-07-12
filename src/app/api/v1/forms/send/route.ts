import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { sendForm, resolveDefaultForm } from '@/lib/forms/send'

const bodySchema = z.object({
  formId: z.string().optional(),
  targetType: z.enum(['ADMISSION', 'LEAD', 'ENQUIRY', 'STANDALONE']),
  targetId: z.string().optional().nullable(),
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP']),
  // optional overrides — otherwise pulled from the target record
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
})

export const POST = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ req, db, user }) => {
    const body = bodySchema.parse(await req.json())

    // Resolve the form (explicit or default for the target).
    let formId = body.formId
    if (!formId) {
      const def = await resolveDefaultForm(db, user.orgId, body.targetType)
      if (!def) throw Errors.businessRule('No published form yet — create and publish one in Settings → Admission Forms first.')
      formId = def.id
    } else {
      const exists = await db.form.findFirst({ where: { id: formId, orgId: user.orgId }, select: { id: true } })
      if (!exists) throw Errors.notFound('Form')
    }

    // Pull contact + names from the target record.
    let email = body.email ?? null
    let phone = body.phone ?? null
    if (body.targetId) {
      if (body.targetType === 'ADMISSION') {
        const a = await db.admission.findFirst({ where: { id: body.targetId, orgId: user.orgId }, select: { email: true, phone: true } })
        if (!a) throw Errors.notFound('Admission')
        email = email ?? a.email
        phone = phone ?? a.phone
      } else if (body.targetType === 'LEAD') {
        const l = await db.lead.findFirst({ where: { id: body.targetId, orgId: user.orgId }, select: { email: true, phone: true } })
        if (!l) throw Errors.notFound('Lead')
        email = email ?? l.email
        phone = phone ?? l.phone
      }
    }

    const org = await prisma.organization.findUnique({ where: { id: user.orgId }, select: { name: true } })

    const result = await sendForm({
      db,
      orgId: user.orgId,
      formId,
      targetType: body.targetType,
      targetId: body.targetId ?? null,
      channel: body.channel,
      email,
      phone,
      createdById: user.id,
      orgName: org?.name,
    })

    // Timeline entry on the target record.
    const summary = `Application form sent via ${body.channel.toLowerCase()}`
    if (body.targetId && body.targetType === 'ADMISSION') {
      await db.admissionActivity.create({ data: { orgId: user.orgId, admissionId: body.targetId, type: 'SYSTEM', summary, performedById: user.id } })
    } else if (body.targetId && body.targetType === 'LEAD') {
      await db.leadActivity.create({ data: { orgId: user.orgId, leadId: body.targetId, type: 'SYSTEM', summary, performedById: user.id } })
    }

    return ok(result)
  },
})
