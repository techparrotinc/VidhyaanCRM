import { Prisma, LeadStatus, LeadSource, StudentStatus, EnrollmentStatus } from '@prisma/client'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db/client'

export const GET = route({
  module: 'campaign_management',
  handler: async ({ req, db, user }) => {
    const { searchParams } = new URL(req.url)
    const pool = searchParams.get('pool')

    const filtersRaw = searchParams.get('filters')
    const filters: Array<{ field: string; value: string }> = filtersRaw
      ? JSON.parse(filtersRaw)
      : []


    if (!pool || !['LEADS', 'STUDENTS', 'BOTH'].includes(pool)) {
      throw Errors.businessRule('Missing or invalid required query parameter: pool')
    }

    let leadCount = 0
    let studentCount = 0

    if (pool === 'LEADS' || pool === 'BOTH') {
      const leadWhere: Prisma.LeadWhereInput = {
        orgId: user.orgId,
        deletedAt: null
      }

      const createdAtFilter: Prisma.DateTimeFilter = {}

      filters.forEach((f) => {
        if (!f.value) return
        if (f.field === 'status') {
          leadWhere.status = f.value as LeadStatus
        } else if (f.field === 'gradeSought' || f.field === 'gradeLabel') {
          leadWhere.gradeSought = f.value
        } else if (f.field === 'source') {
          leadWhere.source = f.value as LeadSource
        } else if (f.field === 'assignedToId') {
          leadWhere.assignedToId = f.value
        } else if (f.field === 'dateFrom') {
          createdAtFilter.gte = new Date(f.value)
        } else if (f.field === 'dateTo') {
          createdAtFilter.lte = new Date(f.value)
        }
      })

      if (createdAtFilter.gte || createdAtFilter.lte) {
        leadWhere.createdAt = createdAtFilter
      }

      leadCount = await prisma.lead.count({ where: leadWhere })
    }

    if (pool === 'STUDENTS' || pool === 'BOTH') {
      const studentWhere: Prisma.StudentWhereInput = {
        orgId: user.orgId,
        deletedAt: null,
        status: StudentStatus.ACTIVE
      }

      filters.forEach((f) => {
        if (!f.value) return
        if (f.field === 'gradeLabel' || f.field === 'gradeSought') {
          studentWhere.gradeLabel = f.value
        } else if (f.field === 'status') {
          studentWhere.status = f.value as StudentStatus
        } else if (f.field === 'academicYearId') {
          studentWhere.academicYearId = f.value
        } else if (f.field === 'courseId') {
          studentWhere.courseEnrollments = {
            some: {
              courseId: f.value,
              status: EnrollmentStatus.ACTIVE
            }
          }
        }
      })

      studentCount = await prisma.student.count({ where: studentWhere })
    }

    return ok({
      total: leadCount + studentCount,
      leadCount,
      studentCount
    })
  }
})
