import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireParent, linkedStudentsWhere } from '@/lib/parent-portal'

const DATE = /^\d{4}-\d{2}-\d{2}$/

const createSchema = z.object({
  studentId: z.string().min(1),
  fromDate: z.string().regex(DATE),
  toDate: z.string().regex(DATE),
  reason: z.string().trim().min(3).max(500)
})

/** GET — the parent's leave requests across all linked wards. */
export async function GET() {
  try {
    const parent = await requireParent()
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const students = await prisma.student.findMany({
      where: linkedStudentsWhere(parent),
      select: { id: true }
    })
    const requests = await prisma.leaveRequest.findMany({
      where: { studentId: { in: students.map((s) => s.id) } },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { student: { select: { id: true, name: true } } }
    })
    return NextResponse.json({ success: true, data: { requests } })
  } catch (e) {
    console.error('parent/leave-requests GET error:', e)
    return NextResponse.json({ success: false, error: 'Failed to load leave requests' }, { status: 500 })
  }
}

/** POST — raise a leave request for a linked ward; notifies the school. */
export async function POST(req: NextRequest) {
  try {
    const parent = await requireParent()
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = createSchema.safeParse(await req.json().catch(() => null))
    if (!body.success) {
      return NextResponse.json(
        { success: false, error: body.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      )
    }
    const { studentId, fromDate, toDate, reason } = body.data
    if (toDate < fromDate) {
      return NextResponse.json({ success: false, error: 'End date must be on or after start date' }, { status: 400 })
    }

    // Ward ownership check — same visibility rule as every parent route.
    const student = await prisma.student.findFirst({
      where: { id: studentId, ...linkedStudentsWhere(parent) },
      select: { id: true, orgId: true, name: true }
    })
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 })
    }

    const request = await prisma.leaveRequest.create({
      data: {
        orgId: student.orgId,
        studentId: student.id,
        parentId: parent.id,
        fromDate: new Date(`${fromDate}T00:00:00.000Z`),
        toDate: new Date(`${toDate}T00:00:00.000Z`),
        reason
      },
      include: { student: { select: { id: true, name: true } } }
    })

    return NextResponse.json({ success: true, data: { request } }, { status: 201 })
  } catch (e) {
    console.error('parent/leave-requests POST error:', e)
    return NextResponse.json({ success: false, error: 'Failed to submit leave request' }, { status: 500 })
  }
}
