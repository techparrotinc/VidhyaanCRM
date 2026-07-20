import { NextResponse } from 'next/server'
import { route } from '@/lib/api/compose'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'

export const GET = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR
  ],
  handler: async ({ req, db }) => {
    const { searchParams } = new URL(req.url)

    const status = searchParams.get('status') ?? undefined
    const gradeLabel = searchParams.get('gradeLabel') ?? undefined
    const courseId = searchParams.get('courseId') ?? undefined
    const academicYearId = searchParams.get('academicYearId') ?? undefined

    const where: any = {}
    if (status) where.status = status
    if (gradeLabel) where.gradeLabel = gradeLabel
    if (courseId) where.courseEnrollments = { some: { courseId, status: 'ACTIVE' } }
    if (academicYearId) where.academicYearId = academicYearId

    const students = await db.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: {
          select: { name: true }
        },
        academicYear: {
          select: { name: true }
        }
      }
    })

    const headers = [
      'Student Code',
      'Name',
      'Grade',
      'Roll Number',
      'Guardian Name',
      'Guardian Phone',
      'Guardian Email',
      'Gender',
      'Status',
      'Branch',
      'Academic Year',
      'Date of Birth',
      'Created At'
    ]

    const rows = students.map(s => [
      s.studentCode,
      s.name,
      s.gradeLabel ?? '',
      s.rollNumber ?? '',
      s.guardianName ?? '',
      s.guardianPhone ?? '',
      s.guardianEmail ?? '',
      s.gender ?? '',
      s.status,
      s.branch?.name ?? '',
      s.academicYear?.name ?? '',
      s.dateOfBirth
        ? s.dateOfBirth.toISOString().split('T')[0]
        : '',
      s.createdAt.toISOString().split('T')[0]
    ])

    const csv = [headers, ...rows]
      .map(r =>
        r.map(v =>
          '"' + String(v).replace(/"/g, '""') + '"'
        ).join(',')
      ).join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="students.csv"'
      }
    })
  }
})
