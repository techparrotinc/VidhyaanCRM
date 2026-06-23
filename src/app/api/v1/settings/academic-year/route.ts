import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok, created } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { AcademicYearType } from '@prisma/client'

export const GET = route({
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN
  ],
  handler: async ({ db, user }) => {
    const years = await db.academicYear.findMany({
      where: { orgId: user.orgId },
      orderBy: { startDate: 'desc' }
    })
    return ok(years)
  }
})

export const POST = route({
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, db, user }) => {
    const body = z.object({
      name: z.string().min(1),
      type: z.enum([
        'ACADEMIC', 'FINANCIAL',
        'CALENDAR', 'CUSTOM'
      ]),
      startDate: z.string(),
      endDate: z.string(),
      isCurrent: z.boolean().default(false)
    }).parse(await req.json())

    if (body.isCurrent) {
      await db.academicYear.updateMany({
        where: { status: 'ACTIVE', orgId: user.orgId },
        data: { status: 'CLOSED' }
      })
    }

    const year = await db.academicYear.create({
      data: {
        orgId: user.orgId,
        name: body.name,
        type: body.type as AcademicYearType,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        status: body.isCurrent ? 'ACTIVE' : 'UPCOMING'
      }
    })

    return created(year)
  }
})
