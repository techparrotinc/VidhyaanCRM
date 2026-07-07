import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { ORG_EMAIL_TEMPLATES, ORG_EMAIL_TEMPLATE_KEYS } from '@/lib/mail/org-templates'

/** Registry + this org's overrides, merged for the settings page. */
export const GET = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ user }) => {
    const overrides = await prisma.orgEmailTemplate.findMany({
      where: { orgId: user.orgId }
    })
    const byKey = new Map(overrides.map((o) => [o.key, o]))

    return ok(
      ORG_EMAIL_TEMPLATES.map((t) => {
        const o = byKey.get(t.key)
        return {
          key: t.key,
          label: t.label,
          description: t.description,
          variables: t.variables,
          defaultSubject: t.defaultSubject,
          defaultBody: t.defaultBody,
          subject: o?.subject ?? t.defaultSubject,
          body: o?.body ?? t.defaultBody,
          isCustomized: !!o,
          updatedAt: o?.updatedAt ?? null
        }
      })
    )
  }
})

const putSchema = z.object({
  key: z.enum(ORG_EMAIL_TEMPLATE_KEYS),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000)
})

export const PUT = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, user }) => {
    const body = putSchema.parse(await req.json())

    const saved = await prisma.orgEmailTemplate.upsert({
      where: { orgId_key: { orgId: user.orgId, key: body.key } },
      create: {
        orgId: user.orgId,
        key: body.key,
        subject: body.subject,
        body: body.body,
        updatedBy: user.id
      },
      update: {
        subject: body.subject,
        body: body.body,
        updatedBy: user.id
      }
    })

    return ok(saved)
  }
})

/** Reset a template to the code default. */
export const DELETE = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, user }) => {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    if (!key || !(ORG_EMAIL_TEMPLATE_KEYS as readonly string[]).includes(key)) {
      throw Errors.businessRule('Unknown template key')
    }

    await prisma.orgEmailTemplate.deleteMany({
      where: { orgId: user.orgId, key }
    })

    return ok({ reset: true })
  }
})
