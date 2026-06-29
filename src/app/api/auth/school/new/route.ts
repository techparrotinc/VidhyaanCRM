import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { UserRole, UserStatus, OtpChannel, OtpPurpose, InstitutionType } from '@prisma/client'
import { createDefaultCourses } from '@/lib/utils/createDefaultCourses'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

async function generateUniqueOrgSlug(name: string): Promise<string> {
  const base = slugify(name) || 'school-org'
  let slug = base
  let count = 1
  while (true) {
    const existing = await prisma.organization.findUnique({
      where: { slug }
    })
    if (!existing) break
    slug = `${base}-${count}`
    count++
  }
  return slug
}

async function generateUniqueSchoolSlug(name: string): Promise<string> {
  const base = slugify(name) || 'school'
  let slug = base
  let count = 1
  while (true) {
    const existing = await prisma.school.findUnique({
      where: { slug }
    })
    if (!existing) break
    slug = `${base}-${count}`
    count++
  }
  return slug
}

function mapInstitutionType(type: string): InstitutionType {
  const normalized = type.toUpperCase().replace(/\s+/g, '_')
  if (normalized === 'SCHOOL') return InstitutionType.SCHOOL
  if (normalized === 'LEARNING_CENTER') return InstitutionType.LEARNING_CENTER
  if (normalized === 'COACHING_CENTER') return InstitutionType.COACHING_CENTER
  if (normalized === 'JUNIOR_COLLEGE') return InstitutionType.JUNIOR_COLLEGE
  if (normalized === 'SKILL_DEVELOPMENT') return InstitutionType.SKILL_DEVELOPMENT
  if (normalized === 'SPORTS_ACADEMY') return InstitutionType.SPORTS_ACADEMY
  return InstitutionType.SCHOOL
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, // admin full name
      phone,
      email,
      role, // admin role designation
      schoolName,
      institutionType,
      city,
      board,
      establishedYear,
      centerCategory,
      schoolType,
      mediumOfInstruction,
      examFocus,
      gradeFrom,
      gradeTo,
      totalTeachers
    } = body

    if (!name || !phone || !email || !role || !schoolName || !institutionType || !city || (institutionType !== 'LEARNING_CENTER' && institutionType !== 'COACHING_CENTER' && !board)) {
      return NextResponse.json(
        { success: false, error: 'Missing required registration details' },
        { status: 400 }
      )
    }

    // 1. Check duplicate phone/email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone },
          { email }
        ],
        deletedAt: null
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Phone number or email address is already registered. Please login.' },
        { status: 409 }
      )
    }

    const mappedInstType = mapInstitutionType(institutionType)
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // now + 7 days
    const orgSlug = await generateUniqueOrgSlug(schoolName)

    // Find free/trial plan
    let freePlan = await prisma.plan.findUnique({
      where: { slug: 'free' }
    })
    if (!freePlan) {
      freePlan = await prisma.plan.findFirst()
    }

    // 2. Create Organization
    const org = await prisma.organization.create({
      data: {
        name: schoolName,
        slug: orgSlug,
        institutionType: mappedInstType,
        centerCategory: mappedInstType === 'LEARNING_CENTER' || mappedInstType === 'COACHING_CENTER' ? centerCategory : null,
        email,
        phone,
        status: 'ACTIVE',
        trialEndsAt,
        planId: freePlan?.id || null,
        settings: {
          adminRoleDesignation: role,
          onboardingStep: 1,
          onboardingCompletedSteps: [],
          profileCompletePct: 0,
          onboardingIsComplete: false
        }
      }
    })

    // 3. Create default Branch
    const branch = await prisma.branch.create({
      data: {
        orgId: org.id,
        name: 'Main Branch',
        isDefault: true,
        city
      }
    })

    // 4. Create School in marketplace
    const schoolSlug = await generateUniqueSchoolSlug(schoolName)
    const school = await prisma.school.create({
      data: {
        orgId: org.id,
        name: schoolName,
        slug: schoolSlug,
        institutionType: mappedInstType,
        schoolType: schoolType || null,
        centerCategory: mappedInstType === 'LEARNING_CENTER' || mappedInstType === 'COACHING_CENTER' ? centerCategory : null,
        examFocus: Array.isArray(examFocus) ? examFocus : [],
        mediumOfInstructionList: Array.isArray(mediumOfInstruction) ? mediumOfInstruction : [],
        mediumOfInstruction: Array.isArray(mediumOfInstruction) ? mediumOfInstruction.join(', ') : mediumOfInstruction || null,
        gradesOffered: (gradeFrom && gradeTo) ? `${gradeFrom} to ${gradeTo}` : null,
        totalTeachers: totalTeachers ? parseInt(totalTeachers) : null,
        isPublished: false,
        verificationStatus: 'PENDING',
        establishedYear: establishedYear ? parseInt(establishedYear) : null
      }
    })

    // Create school primary location
    await prisma.schoolLocation.create({
      data: {
        schoolId: school.id,
        orgId: org.id,
        city,
        isPrimary: true,
        label: 'Main Campus'
      }
    })

    // Create school board affiliation
    if (board && mappedInstType !== 'LEARNING_CENTER') {
      await prisma.schoolAffiliation.create({
        data: {
          schoolId: school.id,
          orgId: org.id,
          board
        }
      })
    }

    // Create school initial email contact
    await prisma.schoolContact.create({
      data: {
        schoolId: school.id,
        orgId: org.id,
        type: 'email',
        value: email,
        isPrimary: true
      }
    })

    // Create school initial phone contact
    await prisma.schoolContact.create({
      data: {
        schoolId: school.id,
        orgId: org.id,
        type: 'phone',
        value: phone,
        isPrimary: true
      }
    })

    // 5. Enable modules based on institutionType
    try {
      const isSchool = mappedInstType !== 'LEARNING_CENTER'
      const coreModuleSlugs = [
        'lead_management',
        'student_management',
        'fee_management',
        'campaign_management',
        ...(isSchool ? ['admission_management'] : [])
      ]
      const dbModules = await prisma.module.findMany({
        where: { slug: { in: coreModuleSlugs } }
      })
      await prisma.organizationModule.createMany({
        data: dbModules.map(m => ({
          orgId: org.id,
          moduleId: m.id,
          enabled: true,
          enabledAt: new Date()
        })),
        skipDuplicates: true
      })
    } catch (err) {
      console.error('Failed to create org modules:', err)
    }

    // 6. Create free plan Subscription
    if (freePlan) {
      await prisma.subscription.create({
        data: {
          orgId: org.id,
          planId: freePlan.id,
          status: 'TRIALING',
          billingCycle: 'MONTHLY',
          amount: freePlan.monthlyPrice,
          trialEndsAt,
          startedAt: new Date(),
          currentPeriodEnd: trialEndsAt
        }
      })
    }

    // 8. Create User
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        role: UserRole.ORG_ADMIN,
        status: UserStatus.ACTIVE,
        orgId: org.id
      }
    })

    // Create branch access
    await prisma.userBranchAccess.create({
      data: {
        userId: user.id,
        branchId: branch.id,
        role: UserRole.ORG_ADMIN
      }
    })

    // 9. Send OTP to phone
    const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
    const otpCode = await createOTP(
      phone,
      OtpChannel.SMS,
      OtpPurpose.SIGNUP,
      ipAddress
    )

    await sendOTP(phone, otpCode, OtpChannel.SMS, OtpPurpose.SIGNUP)

    // Trigger default courses
    const needsCourses =
      mappedInstType === 'LEARNING_CENTER' ||
      mappedInstType === 'COACHING_CENTER'

    if (needsCourses && centerCategory) {
      await createDefaultCourses(
        org.id,
        centerCategory,
        user.id
      )
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      orgId: org.id
    })

  } catch (error: any) {
    console.error('Register new school API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
