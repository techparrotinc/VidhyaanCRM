// Spin up a throwaway LEARNING_CENTER org for manual testing of lead management.
// ADDITIVE ONLY — never deletes. Idempotent: re-running prints the existing org.
// Usage: npx tsx scripts/spin-test-lc-org.ts
import { prisma } from '../src/lib/db/client'
import { UserRole, UserStatus, InstitutionType } from '@prisma/client'
import { findOrCreateUserByPhone } from '../src/lib/auth/findOrCreateUserByPhone'
import { createDefaultAdmissionStages } from '../src/lib/utils/createDefaultAdmissionStages'
import { createDefaultCourses } from '../src/lib/utils/createDefaultCourses'

const ORG_SLUG = 'test-lc-melody'
const SCHOOL_SLUG = 'test-lc-melody'
const SCHOOL_NAME = 'Melody Music Academy (TEST LC)'
const ADMIN_PHONE = '9000000009'
const ADMIN_EMAIL = 'lc-test-admin@vidhyaan.test'
const ADMIN_NAME = 'LC Test Admin'

// Modules the test org can use (incl. admission_management so the
// Convert-to-Enrolment flow is testable).
const MODULE_SLUGS = [
  'lead_management',
  'admission_management',
  'student_management',
  'fee_management',
  'event_management',
  'campaign_management',
  'advanced_reports',
]

async function main() {
  const existing = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } })
  if (existing) {
    console.log(`✓ Test LC org already exists (id=${existing.id}).`)
    printLogin()
    return
  }

  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const freePlan =
    (await prisma.plan.findUnique({ where: { slug: 'free' } })) ??
    (await prisma.plan.findFirst())

  console.log('Creating LEARNING_CENTER org…')
  const org = await prisma.organization.create({
    data: {
      name: SCHOOL_NAME,
      slug: ORG_SLUG,
      institutionType: InstitutionType.LEARNING_CENTER,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      status: 'ACTIVE',
      trialEndsAt,
      planId: freePlan?.id ?? null,
      settings: {
        onboardingStep: 1,
        onboardingCompletedSteps: [],
        profileCompletePct: 0,
        onboardingIsComplete: false,
      },
    },
  })

  const branch = await prisma.branch.create({
    data: { orgId: org.id, name: 'Main Centre', isDefault: true, city: 'Chennai' },
  })

  await prisma.academicYear.create({
    data: {
      orgId: org.id,
      name: 'AY 2026-27',
      type: 'ACADEMIC',
      startDate: new Date('2026-06-01T00:00:00Z'),
      endDate: new Date('2027-04-30T23:59:59Z'),
      status: 'ACTIVE',
    },
  })

  await createDefaultAdmissionStages(org.id)

  const school = await prisma.school.create({
    data: {
      orgId: org.id,
      name: SCHOOL_NAME,
      slug: SCHOOL_SLUG,
      institutionType: InstitutionType.LEARNING_CENTER,
      isPublished: false,
      verificationStatus: 'PENDING',
    },
  })

  await prisma.schoolLocation.create({
    data: { schoolId: school.id, orgId: org.id, city: 'Chennai', isPrimary: true, label: 'Main Centre' },
  })
  await prisma.schoolContact.create({
    data: { schoolId: school.id, orgId: org.id, type: 'email', value: ADMIN_EMAIL, isPrimary: true },
  })
  await prisma.schoolContact.create({
    data: { schoolId: school.id, orgId: org.id, type: 'phone', value: ADMIN_PHONE, isPrimary: true },
  })

  // Enable modules
  const dbModules = await prisma.module.findMany({ where: { slug: { in: MODULE_SLUGS } } })
  await prisma.organizationModule.createMany({
    data: dbModules.map(m => ({ orgId: org.id, moduleId: m.id, enabled: true, enabledAt: new Date() })),
    skipDuplicates: true,
  })

  // Admin user (ORG_ADMIN) — OTP login in dev prints the code to the server console
  const { user } = await findOrCreateUserByPhone({
    phone: ADMIN_PHONE,
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    role: UserRole.ORG_ADMIN,
    orgId: org.id,
    status: UserStatus.ACTIVE,
  })
  await prisma.userBranchAccess.create({
    data: { userId: user.id, branchId: branch.id, role: UserRole.ORG_ADMIN },
  })

  // Real course catalogue so the lead form's Course dropdown shows actual courses
  await createDefaultCourses(org.id, 'MUSIC', user.id)

  const courseCount = await prisma.course.count({ where: { orgId: org.id } })
  console.log(`✓ Created LC org (id=${org.id}), admin user (id=${user.id}), ${courseCount} courses, ${dbModules.length} modules.`)
  printLogin()
}

function printLogin() {
  console.log('\n──────────── LOGIN ────────────')
  console.log('1. npm run dev')
  console.log('2. http://localhost:3000/login')
  console.log(`3. Phone: ${ADMIN_PHONE}  (or email: ${ADMIN_EMAIL})`)
  console.log('4. OTP is printed in the `npm run dev` console (dev mode).')
  console.log('5. Lead form should now show Course/Batch (not Grade).')
  console.log('───────────────────────────────\n')
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
