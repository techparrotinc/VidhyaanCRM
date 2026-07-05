import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'

const numLike = z.union([z.string().max(20), z.number()]).optional().nullable()
const strOpt = (max: number) => z.string().max(max).optional().nullable()

const onboardingSaveSchema = z.object({
  step: z.coerce.number().int().min(1).max(5),
  data: z.object({
    name: strOpt(200),
    email: strOpt(200),
    institutionType: strOpt(50),
    centerCategory: strOpt(50),
    schoolType: strOpt(50),
    examFocus: z.array(z.string().max(50)).max(50).optional(),
    mediumOfInstruction: z.union([z.string().max(200), z.array(z.string().max(50)).max(20)]).optional().nullable(),
    establishedYear: numLike,
    description: strOpt(5000),
    totalStudents: numLike,
    totalTeachers: numLike,
    gender: strOpt(30),
    gradeFrom: strOpt(30),
    gradeTo: strOpt(30),
    address1: strOpt(300),
    address2: strOpt(300),
    city: strOpt(100),
    state: strOpt(100),
    pincode: strOpt(20),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    phone: strOpt(30),
    phoneSecondary: strOpt(30),
    website: strOpt(300),
    officeHours: strOpt(200),
    mapsLink: strOpt(1000),
    boards: z.array(z.string().max(50)).max(20).optional(),
    affiliationNo: strOpt(100),
    facilities: z.array(z.string().max(100)).max(100).optional(),
    feeRanges: z.array(z.object({
      gradeLabel: z.string().max(50),
      minAmount: numLike,
      maxAmount: numLike
    })).max(50).optional(),
    monthlyFeeMin: numLike,
    monthlyFeeMax: numLike,
    activityTypes: z.array(z.string().max(50)).max(50).optional(),
    admissionOpen: z.boolean().optional(),
    logoUrl: strOpt(1000),
    coverUrl: strOpt(1000),
    galleryUrls: z.array(z.string().max(1000)).max(100).optional(),
    isPublished: z.boolean().optional()
  })
})
import { InstitutionType } from '@prisma/client'
import { redis } from '@/lib/redis'
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || session.user.role !== 'ORG_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const parsed = onboardingSaveSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { step } = parsed.data
    // Validated at runtime above; loose type keeps step-specific field access unchanged
    const data = parsed.data.data as Record<string, any>

    let orgId = user.orgId
    let org: any = null

    // Ensure Organization exists for ORG_ADMIN
    if (!orgId) {
      if (!data.email) {
        return NextResponse.json(
          { success: false, error: 'email is required' },
          { status: 400 }
        )
      }
      const orgName = data.name || 'My Institution'
      const slug = await generateUniqueOrgSlug(orgName)
      org = await prisma.organization.create({
        data: {
          name: orgName,
          slug,
          institutionType: data.institutionType ? mapInstitutionType(data.institutionType) : InstitutionType.SCHOOL,
          email: data.email,
          phone: user.phone || '0000000000',
          status: 'ACTIVE'
        }
      })
      orgId = org.id

      // Auto-create core modules
      try {
        const isSchool = org.institutionType !== 'LEARNING_CENTER'
        const coreModuleSlugs = [
          'lead_management',
          'student_management',
          'fee_management',
          'campaign_management',
          'event_management',
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

      // Link User to new organization
      await prisma.user.update({
        where: { id: user.id },
        data: { orgId: org.id }
      })
    } else {
      org = await prisma.organization.findUnique({
        where: { id: orgId }
      })
    }

    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Ensure School exists for Organization
    let school = await prisma.school.findFirst({
      where: { orgId: org.id }
    })

    // STEP 1: Save School basic info
    if (step === 1) {
      const mappedInstType = data.institutionType ? mapInstitutionType(data.institutionType) : org.institutionType

      // Update Organization model
      org = await prisma.organization.update({
        where: { id: org.id },
        data: {
          institutionType: mappedInstType,
          centerCategory: data.centerCategory || null
        }
      })

      if (school) {
        school = await prisma.school.update({
          where: { id: school.id },
          data: {
            name: data.name,
            institutionType: mappedInstType,
            schoolType: data.schoolType || null,
            centerCategory: data.centerCategory || null,
            examFocus: Array.isArray(data.examFocus) ? data.examFocus : [],
            mediumOfInstructionList: Array.isArray(data.mediumOfInstruction) ? data.mediumOfInstruction : [],
            establishedYear: data.establishedYear ? parseInt(data.establishedYear) : null,
            description: data.description || null,
            totalStudents: data.totalStudents ? parseInt(data.totalStudents) : null,
            totalTeachers: data.totalTeachers ? parseInt(data.totalTeachers) : null,
            mediumOfInstruction: Array.isArray(data.mediumOfInstruction) ? data.mediumOfInstruction.join(', ') : data.mediumOfInstruction || null,
            gender: data.gender || null,
            gradesOffered: (data.gradeFrom && data.gradeTo) ? `${data.gradeFrom} to ${data.gradeTo}` : null
          }
        })
      } else {
        const slug = await generateUniqueSchoolSlug(data.name || 'school')
        school = await prisma.school.create({
          data: {
            orgId: org.id,
            name: data.name,
            slug,
            institutionType: mappedInstType,
            schoolType: data.schoolType || null,
            centerCategory: data.centerCategory || null,
            examFocus: Array.isArray(data.examFocus) ? data.examFocus : [],
            mediumOfInstructionList: Array.isArray(data.mediumOfInstruction) ? data.mediumOfInstruction : [],
            establishedYear: data.establishedYear ? parseInt(data.establishedYear) : null,
            description: data.description || null,
            totalStudents: data.totalStudents ? parseInt(data.totalStudents) : null,
            totalTeachers: data.totalTeachers ? parseInt(data.totalTeachers) : null,
            mediumOfInstruction: Array.isArray(data.mediumOfInstruction) ? data.mediumOfInstruction.join(', ') : data.mediumOfInstruction || null,
            gender: data.gender || null,
            gradesOffered: (data.gradeFrom && data.gradeTo) ? `${data.gradeFrom} to ${data.gradeTo}` : null,
            verificationStatus: 'VERIFIED',
            isVerified: true
          }
        })
      }

      // Trigger default courses
      const needsCourses =
        mappedInstType === 'LEARNING_CENTER' ||
        mappedInstType === 'COACHING_CENTER'

      if (needsCourses && data.centerCategory) {
        const existingCourseCount = await prisma.course.count({
          where: {
            orgId: org.id,
            deletedAt: null
          }
        })

        if (existingCourseCount === 0) {
          await createDefaultCourses(
            org.id,
            data.centerCategory,
            user.id
          )
        }
      }
    }

    // For other steps, school must already be created/initialized in Step 1
    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School profile must be created in Step 1 before proceeding.' },
        { status: 400 }
      )
    }

    // STEP 2: Save Location & Contacts
    if (step === 2) {
      const addressLine = [data.address1, data.address2].filter(Boolean).join(', ')
      
      const existingLocation = await prisma.schoolLocation.findFirst({
        where: { schoolId: school.id, isPrimary: true, deletedAt: null }
      })

      if (existingLocation) {
        await prisma.schoolLocation.update({
          where: { id: existingLocation.id },
          data: {
            addressLine,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
            longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
            label: 'Main Campus'
          }
        })
      } else {
        await prisma.schoolLocation.create({
          data: {
            schoolId: school.id,
            orgId: org.id,
            addressLine,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            latitude: typeof data.latitude === 'number' ? data.latitude : null,
            longitude: typeof data.longitude === 'number' ? data.longitude : null,
            isPrimary: true,
            label: 'Main Campus'
          }
        })
      }

      // Sync primary phone/email to organization too, for admin convenience
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          phone: data.phone || org.phone
        }
      })

      // Sync School contacts
      await prisma.schoolContact.deleteMany({
        where: { schoolId: school.id }
      })

      const contacts = []
      if (data.phone) {
        contacts.push({ schoolId: school.id, orgId: org.id, type: 'phone', value: data.phone, isPrimary: true })
      }
      if (data.phoneSecondary) {
        contacts.push({ schoolId: school.id, orgId: org.id, type: 'phone_secondary', value: data.phoneSecondary, isPrimary: false })
      }
      if (org.email) {
        contacts.push({ schoolId: school.id, orgId: org.id, type: 'email', value: org.email, isPrimary: true })
      }
      if (data.website) {
        contacts.push({ schoolId: school.id, orgId: org.id, type: 'website', value: data.website, isPrimary: false })
      }
      if (data.officeHours) {
        contacts.push({ schoolId: school.id, orgId: org.id, type: 'office_hours', value: data.officeHours, isPrimary: false })
      }
      if (data.mapsLink) {
        contacts.push({ schoolId: school.id, orgId: org.id, type: 'maps_link', value: data.mapsLink, isPrimary: false })
      }

      if (contacts.length > 0) {
        await prisma.schoolContact.createMany({
          data: contacts
        })
      }
    }

    // STEP 3: Save Academics, Facilities & Fee Ranges
    if (step === 3) {
      // Recreate Affiliations/Boards
      await prisma.schoolAffiliation.deleteMany({
        where: { schoolId: school.id }
      })
      if (data.boards && data.boards.length > 0) {
        await prisma.schoolAffiliation.createMany({
          data: data.boards.map((b: string) => ({
            schoolId: school!.id,
            orgId: org!.id,
            board: b,
            affiliationNo: data.affiliationNo || null
          }))
        })
      }

      // Recreate Facilities
      await prisma.schoolFacility.deleteMany({
        where: { schoolId: school.id }
      })
      if (data.facilities && data.facilities.length > 0) {
        await prisma.schoolFacility.createMany({
          data: data.facilities.map((f: string) => ({
            schoolId: school!.id,
            orgId: org!.id,
            name: f
          }))
        })
      }

      // Recreate Fee Ranges for regular schools
      await prisma.schoolFeeRange.deleteMany({
        where: { schoolId: school.id }
      })
      if (data.feeRanges && data.feeRanges.length > 0) {
        await prisma.schoolFeeRange.createMany({
          data: data.feeRanges.map((fr: any) => ({
            schoolId: school!.id,
            orgId: org!.id,
            gradeLabel: fr.gradeLabel,
            minAmount: parseFloat(fr.minAmount || 0),
            maxAmount: parseFloat(fr.maxAmount || 0),
            frequency: 'annual'
          }))
        })
      }

      // Update monthly fee range, activity types and admissions toggle
      await prisma.school.update({
        where: { id: school.id },
        data: {
          monthlyFeeMin: data.monthlyFeeMin ? parseInt(data.monthlyFeeMin) : null,
          monthlyFeeMax: data.monthlyFeeMax ? parseInt(data.monthlyFeeMax) : null,
          activityTypes: data.activityTypes || [],
          admissionOpen: data.admissionOpen ?? false
        }
      })
    }

    // STEP 4: Save Photos
    if (step === 4) {
      await prisma.schoolMedia.deleteMany({
        where: { schoolId: school.id }
      })

      const media = []
      if (data.logoUrl) {
        media.push({ schoolId: school.id, orgId: org.id, type: 'image', url: data.logoUrl, caption: 'logo', sortOrder: 0 })
      }
      if (data.coverUrl) {
        media.push({ schoolId: school.id, orgId: org.id, type: 'image', url: data.coverUrl, caption: 'cover', sortOrder: 1 })
      }
      if (data.galleryUrls && data.galleryUrls.length > 0) {
        data.galleryUrls.forEach((url: string, index: number) => {
          media.push({ schoolId: school!.id, orgId: org!.id, type: 'image', url, caption: 'gallery', sortOrder: index + 2 })
        })
      }

      if (media.length > 0) {
        await prisma.schoolMedia.createMany({
          data: media
        })
      }
    }

    // STEP 5: Launch / Go Live
    if (step === 5) {
      await prisma.school.update({
        where: { id: school.id },
        data: {
          isPublished: data.isPublished ?? true
        }
      })
    }

    // Update Onboarding status settings in Organization
    const currentSettings = (org.settings as any) || {}
    const completedSteps = new Set<number>(currentSettings.onboardingCompletedSteps || [])
    completedSteps.add(step)

    let nextStep = step + 1
    if (step === 5) nextStep = 5

    const updatedSettings = {
      ...currentSettings,
      onboardingStep: nextStep,
      onboardingCompletedSteps: Array.from(completedSteps),
      onboardingIsComplete: step === 5 ? true : currentSettings.onboardingIsComplete || false
    }

    const savedOrg = await prisma.organization.update({
      where: { id: org.id },
      data: {
        settings: updatedSettings
      }
    })

    // Calculate and save the profile completion percentage dynamically (100-point formula)
    const updatedSchool = await prisma.school.findUnique({
      where: { id: school.id },
      include: {
        locations: { where: { deletedAt: null } },
        contacts: { where: { deletedAt: null } },
        affiliations: true,
        media: { where: { deletedAt: null } },
        feeRanges: true
      }
    })

    let score = 10 // Name is always registered / true (10 points)
    if (updatedSchool) {
      if (updatedSchool.media && updatedSchool.media.some(m => m.caption === 'logo')) score += 15
      if (updatedSchool.media && updatedSchool.media.some(m => m.caption === 'cover')) score += 15
      if (updatedSchool.media && updatedSchool.media.some(m => m.caption === 'gallery')) score += 10
      if (updatedSchool.description && updatedSchool.description.trim() !== '') score += 10
      if (updatedSchool.locations && updatedSchool.locations.length > 0) score += 10
      if (updatedSchool.affiliations && updatedSchool.affiliations.length > 0) score += 10
      if (updatedSchool.contacts && updatedSchool.contacts.length > 0) score += 10
      const hasFeeRange = (updatedSchool.feeRanges && updatedSchool.feeRanges.length > 0) || updatedSchool.monthlyFeeMin !== null
      if (hasFeeRange) score += 10

      // Update school profileCompletion in DB
      await prisma.school.update({
        where: { id: school.id },
        data: { profileCompletion: score }
      })

      // Update organization settings
      const latestSettings = (savedOrg.settings as any) || {}
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          settings: {
            ...latestSettings,
            profileCompletePct: score
          }
        }
      })
    }

    // Invalidate organization cache
    try {
      await redis.del(`org:${org.id}`)
    } catch (err) {
      console.error('Failed to invalidate organization cache:', err)
    }

    return NextResponse.json({
      success: true,
      nextStep,
      profileCompletePct: score
    })

  } catch (error: any) {
    console.error('Save onboarding step API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
