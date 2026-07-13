import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { requireParent, linkedStudentsWhere } from '@/lib/parent-portal'

/**
 * Exam results for every linked ward, grouped per student → exam. Percentages
 * computed server-side so the report card renders straight off the payload.
 */
export async function GET() {
  try {
    const parent = await requireParent()
    if (!parent) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const students = await prisma.student.findMany({
      where: { ...linkedStudentsWhere(parent), status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        gradeLabel: true,
        section: true,
        organization: { select: { name: true } }
      }
    })
    if (students.length === 0) {
      return NextResponse.json({ success: true, data: { students: [] } })
    }

    const results = await prisma.examResult.findMany({
      where: { studentId: { in: students.map((s) => s.id) } },
      orderBy: [{ examDate: 'desc' }, { subject: 'asc' }]
    })

    const data = students.map((s) => {
      const mine = results.filter((r) => r.studentId === s.id)
      const examMap = new Map<string, typeof mine>()
      for (const r of mine) {
        const list = examMap.get(r.examName) ?? []
        list.push(r)
        examMap.set(r.examName, list)
      }
      const exams = [...examMap.entries()].map(([examName, rows]) => {
        const total = rows.reduce((sum, r) => sum + Number(r.marksObtained), 0)
        const max = rows.reduce((sum, r) => sum + Number(r.maxMarks), 0)
        return {
          examName,
          examDate: rows.find((r) => r.examDate)?.examDate ?? null,
          total,
          max,
          percentage: max > 0 ? Math.round((total / max) * 1000) / 10 : null,
          subjects: rows.map((r) => ({
            subject: r.subject,
            marksObtained: Number(r.marksObtained),
            maxMarks: Number(r.maxMarks),
            grade: r.grade,
            remarks: r.remarks
          }))
        }
      })
      return {
        id: s.id,
        name: s.name,
        gradeLabel: s.gradeLabel,
        section: s.section,
        orgName: s.organization.name,
        exams
      }
    })

    return NextResponse.json({ success: true, data: { students: data } })
  } catch (e) {
    console.error('parent/results error:', e)
    return NextResponse.json({ success: false, error: 'Failed to load results' }, { status: 500 })
  }
}
