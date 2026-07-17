import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'

const moveSchema = z.object({
  studentId: z.string().min(1),
  action: z.enum(['PROMOTE', 'RETAIN', 'ALUMNI']),
  // Display labels, matching how Student.gradeLabel is stored ("Class 2")
  toGrade: z.string().max(50).optional().nullable(),
  // Matches the section cap on the create/update student routes — was max(10)
  // here, a stricter, inconsistent limit on the same field.
  toSection: z.string().max(50).optional().nullable(),
  clearRollNumber: z.boolean().optional()
})

const promoteSchema = z.object({
  toAcademicYearId: z.string().min(1),
  moves: z.array(moveSchema).min(1).max(500)
})

/**
 * Year-end student movement. Applies grade/section/academic-year changes
 * for a batch of students in one transaction and logs an activity per
 * student. Invoice generation is a separate follow-up call (existing
 * POST /api/v1/fees/invoices mode:batch) so billing failures never leave
 * the move half-applied.
 */
export const POST = route({
  module: MODULES.STUDENT_MANAGEMENT,
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ req, user }) => {
    const body = promoteSchema.parse(await req.json())

    const targetYear = await prisma.academicYear.findFirst({
      where: { id: body.toAcademicYearId, orgId: user.orgId }
    })
    if (!targetYear) {
      throw Errors.notFound('Target academic year')
    }

    const ids = body.moves.map((m) => m.studentId)
    const students = await prisma.student.findMany({
      where: { id: { in: ids }, orgId: user.orgId, deletedAt: null },
      select: { id: true, name: true, gradeLabel: true, section: true, status: true }
    })
    const studentById = new Map(students.map((s) => [s.id, s]))

    const missing = ids.filter((id) => !studentById.has(id))
    if (missing.length > 0) {
      throw Errors.notFound(`Student(s): ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}`)
    }

    for (const move of body.moves) {
      if (move.action === 'PROMOTE' && !move.toGrade) {
        throw Errors.businessRule(`toGrade is required to promote ${studentById.get(move.studentId)?.name}`)
      }
    }

    const results = await prisma.$transaction(async (tx) => {
      const applied: { studentId: string; summary: string }[] = []

      for (const move of body.moves) {
        const current = studentById.get(move.studentId)!
        const from = `${current.gradeLabel ?? '—'}${current.section ? `-${current.section}` : ''}`

        let data: Record<string, unknown>
        let summary: string

        if (move.action === 'ALUMNI') {
          data = {
            status: 'ALUMNI',
            alumniSince: new Date()
          }
          summary = `Marked as alumni at year end (was ${from})`
        } else if (move.action === 'RETAIN') {
          data = {
            academicYearId: body.toAcademicYearId,
            ...(move.toSection !== undefined && { section: move.toSection?.trim() || null }),
            ...(move.clearRollNumber && { rollNumber: null })
          }
          summary = `Retained in ${from} for ${targetYear.name}`
        } else {
          const to = `${move.toGrade}${move.toSection ? `-${move.toSection.trim()}` : ''}`
          data = {
            gradeLabel: move.toGrade,
            section: move.toSection?.trim() || null,
            academicYearId: body.toAcademicYearId,
            ...(move.clearRollNumber && { rollNumber: null })
          }
          summary = `Promoted from ${from} to ${to} (${targetYear.name})`
        }

        await tx.student.update({
          where: { id: move.studentId, orgId: user.orgId },
          data
        })

        await tx.studentActivity.create({
          data: {
            studentId: move.studentId,
            type: 'SYSTEM',
            summary,
            performedById: user.id
          }
        })

        applied.push({ studentId: move.studentId, summary })
      }

      return applied
    })

    return ok({
      moved: results.length,
      academicYear: targetYear.name,
      results
    })
  }
})
