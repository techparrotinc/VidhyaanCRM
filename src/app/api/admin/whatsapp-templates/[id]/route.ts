import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ok, errorResponse } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { z } from 'zod'
import { WA_CATEGORY_VALUES } from '@/constants/whatsapp-template-categories'

const WRITE_ROLES = ['SUPER_ADMIN', 'OPERATIONS_ADMIN']

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  msg91TemplateId: z.string().min(1).max(100).optional(),
  language: z.string().min(2).max(10).optional(),
  body: z.string().min(1).max(1000).optional(),
  variables: z.array(z.string().min(1).max(40)).max(10).optional().nullable(),
  category: z.enum(WA_CATEGORY_VALUES).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional()
})

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) throw Errors.unauthenticated()
    if (!WRITE_ROLES.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin write access required')
    }

    const { id } = await context.params
    const body = updateSchema.parse(await req.json())

    const existing = await prisma.sharedWhatsappTemplate.findFirst({
      where: { id, deletedAt: null }
    })
    if (!existing) throw Errors.notFound('Shared template')

    const updated = await prisma.sharedWhatsappTemplate.update({
      where: { id },
      data: {
        ...body,
        variables: body.variables === undefined ? undefined : body.variables ?? undefined
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'SharedWhatsappTemplate',
        entityId: id,
        after: body
      }
    })

    return ok(updated)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) throw Errors.unauthenticated()
    if (!WRITE_ROLES.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin write access required')
    }

    const { id } = await context.params
    await prisma.sharedWhatsappTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'SharedWhatsappTemplate',
        entityId: id
      }
    })

    return ok({ deleted: true })
  } catch (error) {
    return errorResponse(error)
  }
}
