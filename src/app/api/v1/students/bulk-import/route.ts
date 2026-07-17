import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { created } from '@/lib/api/respond'
import { MODULES } from '@/constants/modules'
import { ROLES } from '@/constants/roles'
import { prisma } from '@/lib/db'
import { Gender, StudentStatus } from '@prisma/client'
import { findMatches, loadDedupConfig, dedupFields } from '@/lib/dedup'
import { isFreeTierCapped, FREE_TIER_LIMITS } from '@/lib/billing/limits'

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
      })).min(1).max(500),
      // Import every row even when a duplicate is detected
      force: z.boolean().optional()
    }).parse(await req.json())

    const year = new Date().getFullYear()
    const baseCount = await prisma.student.count({
      where: { orgId: user.orgId }
    })

    // Free-tier cap (25 students) isn't enforced by a single before/after
    // check here — a 500-row import could otherwise blow straight past it in
    // one request. Once the running count hits the cap, remaining rows are
    // skipped rather than failing the whole batch (matches the single-create
    // route's cap, just applied incrementally).
    const freeTierCapped = await isFreeTierCapped(user.orgId)
    let activeCount = baseCount

    // Real dedup: skipDuplicates on createMany was a no-op (no DB unique key on
    // name/phone). Evaluate each row against the org rules AND against rows
    // already imported in this same batch.
    const config = await loadDedupConfig(prisma, user.orgId)
    const skipped: { name: string; reason: string; match: string | null }[] = []
    let seq = baseCount
    let imported = 0

    for (const s of body.students) {
      if (freeTierCapped && activeCount >= FREE_TIER_LIMITS.STUDENTS) {
        skipped.push({ name: s.name, reason: 'free_tier_limit', match: null })
        continue
      }
      if (!body.force) {
        const dedup = await findMatches(prisma, {
          orgId: user.orgId,
          phone: s.phone,
          email: s.email,
          childName: s.name,
          grade: s.currentClass,
          academicYearId: academicYearId ?? null,
        }, config)
        if (dedup.action === 'hard' || dedup.action === 'soft') {
          skipped.push({ name: s.name, reason: dedup.action, match: dedup.matches[0]?.code ?? null })
          continue
        }
      }

      const identity = await dedupFields(prisma, {
        orgId: user.orgId, phone: s.phone, name: s.name, email: s.email,
      })
      seq += 1
      await prisma.student.create({
        data: {
          orgId: user.orgId,
          studentCode: 'STU-' + year + '-' + String(seq).padStart(5, '0'),
          status: 'ACTIVE' as StudentStatus,
          academicYearId: academicYearId ?? null,
          name: s.name,
          guardianPhone: s.phone ?? null,
          guardianEmail: s.email ?? null,
          phoneNormalized: identity.phoneNormalized,
          householdId: identity.householdId,
          gradeLabel: s.currentClass ?? null,
          rollNumber: s.rollNumber ?? null,
          dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : null,
          gender: s.gender ? (s.gender.toUpperCase() as Gender) : null,
        }
      })
      imported++
      activeCount++
    }

    const capSkipped = skipped.filter(s => s.reason === 'free_tier_limit').length
    const dupSkipped = skipped.length - capSkipped

    return created({
      imported,
      skipped: skipped.length,
      skippedRows: skipped,
      total: body.students.length,
      message: `${imported} imported` +
        (dupSkipped ? `, ${dupSkipped} skipped as duplicates` : '') +
        (capSkipped ? `, ${capSkipped} skipped (free-tier limit of ${FREE_TIER_LIMITS.STUDENTS} students reached — upgrade to import more)` : '')
    })
  }
})
