import { NextRequest, NextResponse } from 'next/server'
import { route } from '@/lib/api/compose'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { format } from 'date-fns'

export const GET = route({
  module: MODULES.ADMISSION_MANAGEMENT,
  roles: [
    ROLES.ORG_ADMIN,
    ROLES.BRANCH_ADMIN,
    ROLES.COUNSELLOR,
    ROLES.RECEPTIONIST
  ],
  handler: async ({ req, db, user }) => {
    const { searchParams } = new URL(req.url)

    const stageId = searchParams.get('stageId') ?? undefined
    const assignedToId = searchParams.get('assignedToId') ?? searchParams.get('counsellorId') ?? undefined
    const priority = searchParams.get('priority') ?? undefined
    const dateFrom = searchParams.get('dateFrom') ?? undefined
    const dateTo = searchParams.get('dateTo') ?? undefined
    const status = searchParams.get('status') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const academicYearId = searchParams.get('academicYearId') ?? undefined
    const ids = searchParams.get('ids')?.split(',').map(s => s.trim()).filter(Boolean)

    const where: any = {
      orgId: user.orgId,
      deletedAt: null,
      ...(ids && ids.length > 0 && { id: { in: ids } }),
      ...(stageId && { stageId }),
      ...(search && {
        OR: [
          { applicantName: { contains: search, mode: 'insensitive' } },
          { admissionCode: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ]
      }),
      ...(assignedToId && { assignedToId }),
      ...(priority && {
        lead: {
          priority: priority
        }
      }),
      ...(status && { status }),
      ...(academicYearId && { academicYearId }),
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    const admissions = await db.admission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        admissionCode: true,
        applicantName: true,
        parentName: true,
        phone: true,
        email: true,
        gradeSought: true,
        status: true,
        createdAt: true,
        stage: {
          select: { name: true }
        },
        assignedTo: {
          select: { name: true }
        },
        academicYear: {
          select: { name: true }
        },
        lead: {
          select: { priority: true }
        }
      }
    })

    const headers = [
      'Admission Code',
      'Applicant Name',
      'Parent Name',
      'Phone',
      'Email',
      'Grade',
      'Stage',
      'Status',
      'Counsellor',
      'Academic Year',
      'Priority',
      'Created Date',
    ]

    const rows = admissions.map(a => [
      a.admissionCode,
      a.applicantName,
      a.parentName || '',
      a.phone || '',
      a.email || '',
      a.gradeSought || '',
      a.stage?.name || '',
      a.status,
      a.assignedTo?.name || '',
      a.academicYear?.name || '',
      a.lead?.priority || 'MEDIUM',
      format(new Date(a.createdAt), 'dd/MM/yyyy'),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell =>
          `"${String(cell).replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="admissions-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      }
    })
  }
})
