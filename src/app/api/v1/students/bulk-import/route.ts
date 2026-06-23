import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { created } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { Gender, StudentStatus } from '@prisma/client'

export const POST = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN],
  handler: async ({ req, user, academicYearId }) => {
    const body = z.object({
      students: z.array(z.object({
        name: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().optional(),
        currentClass: z.string().optional(),
        section: z.string().optional(),
        rollNumber: z.string().optional(),
        dateOfBirth: z.string().optional(),
        gender: z.string().optional()
      })).min(1).max(500)
    }).parse(await req.json())

    const year = new Date().getFullYear()
    const baseCount = await prisma.student.count({
      where: { orgId: user.orgId }
    })

    const studentsData = body.students.map((s, i) => ({
      orgId: user.orgId,
      studentCode: 'STU-' + year + '-' + String(baseCount + i + 1).padStart(5, '0'),
      status: 'ACTIVE' as StudentStatus,
      academicYearId: academicYearId ?? null,
      name: s.name,
      guardianPhone: s.phone ?? null,
      guardianEmail: s.email ?? null,
      gradeLabel: s.currentClass ?? null,
      rollNumber: s.rollNumber ?? null,
      dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : null,
      gender: s.gender ? (s.gender.toUpperCase() as Gender) : null
    }))

    const result = await prisma.student.createMany({
      data: studentsData,
      skipDuplicates: true
    })

    return created({
      imported: result.count,
      total: body.students.length,
      message: result.count + ' students imported successfully'
    })
  }
})
