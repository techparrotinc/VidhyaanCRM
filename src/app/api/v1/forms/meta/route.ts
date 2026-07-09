import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db/client'
import { availablePurposes, getAdapter } from '@/lib/forms/targets'
import { enabledModuleSlugs } from '@/lib/forms/modules'
import { fieldLibrary, defaultFormSchema } from '@/lib/forms/presets'

// Everything the builder needs to render: which purposes are allowed (with
// institution-aware labels), the field palette, a starter schema, and the
// option sources for `related` fields (course / counsellor / academic year).
export const GET = route({
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN],
  handler: async ({ db, user }) => {
    const [modules, org] = await Promise.all([
      enabledModuleSlugs(user.orgId),
      prisma.organization.findUnique({
        where: { id: user.orgId },
        select: { institutionType: true },
      }),
    ])
    const institutionType = org?.institutionType ?? null

    const purposes = availablePurposes({ enabledModules: modules, institutionType }).map((p) => ({
      value: p,
      label: getAdapter(p).labelNoun(institutionType),
    }))

    const [courses, academicYears, counsellors] = await Promise.all([
      db.course.findMany({
        where: { orgId: user.orgId, isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      db.academicYear.findMany({
        where: { orgId: user.orgId },
        select: { id: true, name: true },
        orderBy: { startDate: 'desc' },
      }),
      prisma.user.findMany({
        where: {
          orgId: user.orgId,
          status: 'ACTIVE',
          roleAssignments: {
            some: {
              role: { in: ['COUNSELLOR', 'BRANCH_ADMIN', 'ORG_ADMIN'] },
              status: 'ACTIVE',
            },
          },
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ])

    return ok({
      institutionType,
      purposes,
      fieldLibrary: fieldLibrary(institutionType),
      defaultSchema: defaultFormSchema(institutionType),
      relatedSources: {
        course: courses.map((c) => ({ id: c.id, label: c.name })),
        academicYear: academicYears.map((y) => ({ id: y.id, label: y.name })),
        counsellor: counsellors.map((u) => ({ id: u.id, label: u.name ?? '—' })),
      },
    })
  },
})
