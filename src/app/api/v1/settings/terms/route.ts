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

    let terms = await db.term.findMany({
      where: {
        orgId: user.orgId,
        academicYearId: yearId ?? undefined
      },
      orderBy: { order: 'asc' }
    })

    if (terms.length === 0 && yearId) {
      try {
        const org = await db.organization.findUnique({
          where: { id: user.orgId },
          select: { institutionType: true }
        })
        const isSchool = org?.institutionType !== 'LEARNING_CENTER'

        if (isSchool) {
          const academicYear = await db.academicYear.findFirst({
            where: { id: yearId }
          })

          const yearMatch = academicYear?.name.match(/\d{4}/)
          const yr = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear()

          const defaultTerms = [
            {
              name: 'Term 1',
              startDate: new Date(`${yr}-04-01`),
              endDate: new Date(`${yr}-06-30`),
              order: 1,
              isActive: true,
              academicYearId: yearId,
              orgId: user.orgId
            },
            {
              name: 'Term 2',
              startDate: new Date(`${yr}-07-01`),
              endDate: new Date(`${yr}-09-30`),
              order: 2,
              isActive: true,
              academicYearId: yearId,
              orgId: user.orgId
            },
            {
              name: 'Term 3',
              startDate: new Date(`${yr}-10-01`),
              endDate: new Date(`${yr + 1}-03-31`),
              order: 3,
              isActive: true,
              academicYearId: yearId,
              orgId: user.orgId
            }
          ]

          await db.term.createMany({
            data: defaultTerms,
            skipDuplicates: true
          })

          terms = await db.term.findMany({
            where: {
              orgId: user.orgId,
              academicYearId: yearId
            },
            orderBy: { order: 'asc' }
          })
        }
      } catch (err) {
        console.error('Failed to auto-seed terms:', err)
      }
    }

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
