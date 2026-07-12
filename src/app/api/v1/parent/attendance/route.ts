import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireParent, linkedStudentsWhere } from '@/lib/parent-portal'
import { MONTH_RE, monthRange, dbDateToString } from '@/lib/attendance/dates'
import { computeStats } from '@/lib/attendance/stats'

/**
 * GET /api/v1/parent/attendance?studentId=&month=YYYY-MM
 * Without studentId: linked students that have any attendance (kid picker).
 * With studentId + month: that student's month of records + stats.
 */
export async function GET(req: NextRequest) {
  try {
    const parent = await requireParent()
    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const month = searchParams.get('month')

    const students = await prisma.student.findMany({
      where: linkedStudentsWhere(parent),
      select: {
        id: true,
        name: true,
        gradeLabel: true,
        section: true,
        organization: { select: { name: true } }
      }
    })

    if (!studentId) {
      return NextResponse.json({ success: true, data: { students } })
    }

    const student = students.find(s => s.id === studentId)
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 })
    }
    if (!month || !MONTH_RE.test(month)) {
      return NextResponse.json(
        { success: false, error: 'month (YYYY-MM) is required' },
        { status: 422 }
      )
    }

    const { from, to } = monthRange(month)
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId, date: { gte: from, lt: to } },
      select: {
        id: true, date: true, sessionId: true, status: true, note: true,
        session: {
          select: {
            title: true,
            course: { select: { name: true } },
            batch: { select: { name: true } }
          }
        }
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }]
    })

    return NextResponse.json({
      success: true,
      data: {
        student,
        records: records.map(r => ({ ...r, date: dbDateToString(r.date) })),
        stats: computeStats(records.map(r => r.status))
      }
    })
  } catch (error) {
    console.error('parent attendance error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
