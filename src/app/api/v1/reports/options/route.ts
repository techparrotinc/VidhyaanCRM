import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { prisma } from '@/lib/db/client'
import { REPORTS_MODULE_SLUG } from '@/lib/reports/registry'
import { branchIdsFor } from '@/lib/reports/queries/scope'

const REPORT_VIEWER_ROLES = [
  'ORG_ADMIN', 'BRANCH_ADMIN', 'COUNSELLOR', 'RECEPTIONIST', 'ACCOUNTANT'
]

// Options for 'entity'-type report filters (registry optionsSource).
export const GET = route({
  module: REPORTS_MODULE_SLUG,
  roles: REPORT_VIEWER_ROLES,
  handler: async ({ req, user, db }) => {
    const source = new URL(req.url).searchParams.get('source')

    if (source === 'counsellors') {
      const users = await prisma.user.findMany({
        where: {
          orgId: user.orgId,
          status: 'ACTIVE',
          roleAssignments: { some: { role: 'COUNSELLOR', status: 'ACTIVE' } }
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      })
      return ok(users.map(u => ({ value: u.id, label: u.name })))
    }

    if (source === 'stages') {
      const stages = await db.admissionStage.findMany({
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true }
      })
      return ok(stages.map(s => ({ value: s.id, label: s.name })))
    }

    if (source === 'branches') {
      // Branch lives in the platform schema (not tenant-scoped by forOrg),
      // so scope orgId explicitly. BRANCH_ADMIN only sees their own branches.
      const allowed = await branchIdsFor(user.id, user.role)
      const branches = await prisma.branch.findMany({
        where: {
          orgId: user.orgId,
          deletedAt: null,
          ...(allowed ? { id: { in: allowed } } : {})
        },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        select: { id: true, name: true }
      })
      return ok(branches.map(b => ({ value: b.id, label: b.name })))
    }

    if (source === 'grades') {
      // Union of grades seen on students and leads — covers schools mid-setup.
      const [studentGrades, leadGrades] = await Promise.all([
        db.student.groupBy({ by: ['gradeLabel'], _count: { _all: true } }),
        db.lead.groupBy({ by: ['gradeSought'], _count: { _all: true } })
      ])
      const grades = new Set<string>()
      studentGrades.forEach(g => g.gradeLabel && grades.add(g.gradeLabel))
      leadGrades.forEach(g => g.gradeSought && grades.add(g.gradeSought))
      return ok(
        [...grades]
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .map(g => ({ value: g, label: g }))
      )
    }

    throw Errors.validation({ source: ['Expected counsellors | stages | grades | branches'] })
  }
})
