import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'

export const GET = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR, ROLES.RECEPTIONIST],
  handler: async ({ req, db, user }) => {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim()
    const digits = search ? search.replace(/\D/g, '') : ''

    const households = await db.household.findMany({
      where: {
        orgId: user.orgId,
        ...(search
          ? {
              OR: [
                { primaryName: { contains: search, mode: 'insensitive' as const } },
                ...(digits ? [{ phoneNormalized: { contains: digits } }] : []),
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        leads: {
          where: { deletedAt: null },
          select: { id: true, leadCode: true, kidName: true, gradeSought: true, status: true },
          orderBy: { createdAt: 'desc' },
        },
        admissions: {
          where: { deletedAt: null },
          select: { id: true, admissionCode: true, applicantName: true, gradeSought: true, status: true },
          orderBy: { createdAt: 'desc' },
        },
        students: {
          where: { deletedAt: null },
          select: { id: true, studentCode: true, name: true, gradeLabel: true, status: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    const rows = households.map((h: any) => {
      const memberCount = h.leads.length + h.admissions.length + h.students.length
      // Distinct child names across all record types (case-insensitive)
      const names = new Set<string>()
      h.leads.forEach((l: any) => l.kidName && names.add(l.kidName.trim().toLowerCase()))
      h.admissions.forEach((a: any) => a.applicantName && names.add(a.applicantName.trim().toLowerCase()))
      h.students.forEach((s: any) => s.name && names.add(s.name.trim().toLowerCase()))
      return { ...h, memberCount, childCount: names.size }
    })

    // Households of genuine interest are those with more than one record.
    return ok({ families: rows })
  },
})
