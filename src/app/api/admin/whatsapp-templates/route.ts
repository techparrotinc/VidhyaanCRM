import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ok, created, errorResponse } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { z } from 'zod'
import { WA_CATEGORY_VALUES, guessWaTemplateCategory } from '@/constants/whatsapp-template-categories'

const READ_ROLES = ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN']
const WRITE_ROLES = ['SUPER_ADMIN', 'OPERATIONS_ADMIN']

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  msg91TemplateId: z.string().min(1).max(100),
  language: z.string().min(2).max(10).default('en'),
  body: z.string().min(1).max(1000),
  variables: z.array(z.string().min(1).max(40)).max(10).optional().nullable(),
  category: z.enum(WA_CATEGORY_VALUES).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
})

/** GET — full catalog of templates approved on Vidhyaan's shared WABA. */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) throw Errors.unauthenticated()
    if (!READ_ROLES.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin access required')
    }

    const templates = await prisma.sharedWhatsappTemplate.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    })
    return ok(templates)
  } catch (error) {
    return errorResponse(error)
  }
}

/** POST — publish an approved template into the shared catalog. */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) throw Errors.unauthenticated()
    if (!WRITE_ROLES.includes(session.user.role)) {
      throw Errors.forbidden('Platform admin write access required')
    }

    const body = templateSchema.parse(await req.json())

    const template = await prisma.sharedWhatsappTemplate.create({
      data: {
        name: body.name,
        msg91TemplateId: body.msg91TemplateId,
        language: body.language,
        body: body.body,
        variables: body.variables ?? undefined,
        category: body.category ?? guessWaTemplateCategory(body.name, body.body),
        isActive: body.isActive,
        sortOrder: body.sortOrder
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'SharedWhatsappTemplate',
        entityId: template.id,
        after: { name: body.name, msg91TemplateId: body.msg91TemplateId }
      }
    })

    return created(template)
  } catch (error) {
    return errorResponse(error)
  }
}
