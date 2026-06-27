import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

const termSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  academicYearId: z.string().min(1),
  order: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true)
})

export const GET = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, user, academicYearId }) => {
    const { searchParams } = new URL(req.url)
    const yearId = searchParams.get('academicYearId') ?? academicYearId

    const terms = await db.term.findMany({
      where: {
        orgId: user.orgId,
        academicYearId: yearId ?? undefined
      },
      orderBy: { order: 'asc' }
    })

    return ok(terms)
  }
})

export const POST = route({
  module: MODULES.FEE_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ req, db, user }) => {
    const body = termSchema.parse(await req.json())

    const term = await db.term.create({
      data: {
        orgId: user.orgId,
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        academicYearId: body.academicYearId,
        order: body.order,
        isActive: body.isActive
      }
    })

    return created(term)
  }
})
