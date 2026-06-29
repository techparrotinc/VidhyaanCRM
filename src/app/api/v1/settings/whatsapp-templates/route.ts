import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  msg91TemplateId: z.string().min(1).max(50),
  body: z.string().min(1).max(1000)
})

export const GET = route({
  handler: async ({ db, user }) => {
    const templates = await db.whatsappTemplate.findMany({
      where: {
        orgId: user.orgId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return ok(templates)
  }
})

export const POST = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ req, db, user }) => {
    const data = templateSchema.parse(await req.json())
    const template = await db.whatsappTemplate.create({
      data: {
        orgId: user.orgId,
        name: data.name,
        msg91TemplateId: data.msg91TemplateId,
        body: data.body,
        createdById: user.id
      }
    })
    return created(template)
  }
})
