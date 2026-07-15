import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { UserRole, UserStatus, OtpChannel, OtpPurpose, AuditAction, InstitutionType } from '@prisma/client'
import { redis } from '@/lib/redis'
import crypto from 'crypto'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { welcomeSchoolTemplate } from '@/lib/mail/templates'
import { findOrCreateUserByPhone } from '@/lib/auth/findOrCreateUserByPhone'
import { createDefaultAdmissionStages } from '@/lib/utils/createDefaultAdmissionStages'
import { ENTERPRISE_MODULE_SLUGS } from '@/constants/modules'
import { z } from 'zod'
import { checkEmailDeliverable } from '@/lib/email/validate'

const registerSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().min(5).max(20),
  email: z.string().email().max(200),
  role: z.string().min(1).max(50),
  schoolId: z.string().max(50).optional().nullable(),
  schoolName: z.string().max(200).optional().nullable(),
  institutionType: z.string().max(50).optional().nullable()
})

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

export async function POST(req: NextRequest) {
  try {
    const parsed = registerSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'name, phone, email, and role are required' },
        { status: 400 }
      )
    }
    const { name, phone, email, role, schoolId, schoolName, institutionType } = parsed.data

    // Deliverability gate — OTP + welcome mail go to this address; a typo
    // here locks the user out AND bounces on our sending domain.
    const emailCheck = await checkEmailDeliverable(email)
    if (!emailCheck.ok) {
      return NextResponse.json(
        { success: false, error: emailCheck.message, suggestion: emailCheck.suggestion ?? null },
        { status: 422 }
      )
    }



    // 2. Find Organization if schoolId is provided, or create one if schoolName/institutionType is provided
    let org: any = null
    let school = null
    let branch = null

    if (schoolId) {
      school = await prisma.school.findUnique({
        where: { id: schoolId }
      })
      if (!school) {
        return NextResponse.json(
          { success: false, error: 'School not found' },
          { status: 404 }
        )
      }
      if (!school.orgId) {
        return NextResponse.json(
          { success: false, error: 'No organization linked to this school. Please claim the school first.' },
          { status: 400 }
        )
      }
      org = await prisma.organization.findUnique({
        where: { id: school.orgId }
      })
      if (!org) {
        return NextResponse.json(
          { success: false, error: 'Linked organization not found' },
          { status: 404 }
        )
      }
    } else if (schoolName && institutionType) {
      const mappedInstType = institutionType.toUpperCase().replace(/\s+/g, '_') as InstitutionType
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const orgSlug = slugify(schoolName) || 'school-org'
      
      let uniqueOrgSlug = orgSlug
      let count = 1
      while (true) {
        const existing = await prisma.organization.findUnique({
          where: { slug: uniqueOrgSlug }
        })
        if (!existing) break
        uniqueOrgSlug = `${orgSlug}-${count}`
        count++
      }

      let freePlan = await prisma.plan.findUnique({
        where: { slug: 'free' }
      })
      if (!freePlan) {
        freePlan = await prisma.plan.findFirst()
      }

      org = await prisma.organization.create({
        data: {
          name: schoolName,
          slug: uniqueOrgSlug,
          institutionType: mappedInstType,
          email,
          phone,
          // 7-day premium trial — TRIAL (not ACTIVE) drives the trial UI + expiry cron.
          status: 'TRIAL',
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

      branch = await prisma.branch.create({
        data: {
          orgId: org.id,
          name: 'Main Branch',
          isDefault: true,
          city: 'Unknown'
        }
      })

      // Create default active academic year (AY 2026-27)
      await prisma.academicYear.create({
        data: {
          orgId: org.id,
          name: 'AY 2026-27',
          type: 'ACADEMIC',
          startDate: new Date('2026-06-01T00:00:00Z'),
          endDate: new Date('2027-04-30T23:59:59Z'),
          status: 'ACTIVE'
        }
      })

      // Seed default admission pipeline stages
      await createDefaultAdmissionStages(org.id)

      const schoolSlug = slugify(schoolName) || 'school'
      let uniqueSchoolSlug = schoolSlug
      count = 1
      while (true) {
        const existing = await prisma.school.findUnique({
          where: { slug: uniqueSchoolSlug }
        })
        if (!existing) break
        uniqueSchoolSlug = `${schoolSlug}-${count}`
        count++
      }

      school = await prisma.school.create({
        data: {
          orgId: org.id,
          name: schoolName,
          slug: uniqueSchoolSlug,
          institutionType: mappedInstType,
          isPublished: false,
          verificationStatus: 'PENDING'
        }
      })

      await prisma.schoolLocation.create({
        data: {
          schoolId: school.id,
          orgId: org.id,
          city: 'Unknown',
          isPrimary: true,
          label: 'Main Campus'
        }
      })

      if (mappedInstType !== 'LEARNING_CENTER') {
        await prisma.schoolAffiliation.create({
          data: {
            schoolId: school.id,
            orgId: org.id,
            board: 'Other'
          }
        })
      }

      await prisma.schoolContact.create({
        data: {
          schoolId: school.id,
          orgId: org.id,
          type: 'email',
          value: email,
          isPrimary: true
        }
      })

      await prisma.schoolContact.create({
        data: {
          schoolId: school.id,
          orgId: org.id,
          type: 'phone',
          value: phone,
          isPrimary: true
        }
      })

      try {
        // 7-day trial showcases the full Enterprise experience (all modules
        // incl. AI + advanced reports); expiry drops the org to free-plan
        // modules via the trial cron.
        const enterprisePlan = await prisma.plan.findUnique({
          where: { slug: 'enterprise' },
          include: { planModules: true }
        })
        const isSchool = mappedInstType !== 'LEARNING_CENTER'
        const trialModuleSlugs = enterprisePlan?.planModules.length
          ? enterprisePlan.planModules.map((pm) => pm.moduleSlug)
          : ENTERPRISE_MODULE_SLUGS.filter(slug => isSchool || slug !== 'admission_management')
        const dbModules = await prisma.module.findMany({
          where: { slug: { in: trialModuleSlugs } }
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
    } else {
      return NextResponse.json(
        { success: false, error: 'Either schoolId or schoolName + institutionType is required' },
        { status: 400 }
      )
    }



    // 3. Create User
    let userResult
    try {
      userResult = await findOrCreateUserByPhone({
        phone,
        name,
        email,
        role: UserRole.ORG_ADMIN,
        orgId: org.id,
        status: UserStatus.ACTIVE
      })
    } catch (err: any) {
      if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
        return NextResponse.json(
          { success: false, error: 'An admin user with this email is already registered.' },
          { status: 409 }
        )
      }
      throw err
    }

    const { user, isNewUser } = userResult
    if (!isNewUser) {
      return NextResponse.json(
        { success: false, error: 'Phone number is already registered. Please login.' },
        { status: 409 }
      )
    }

    // Send welcome email to ORG_ADMIN
    try {
      const finalSchoolName = schoolName || school?.name || org.name
      await sendTransactionalEmail({
        to: email,
        subject: "Welcome to Vidhyaan! 🎉",
        htmlBody: welcomeSchoolTemplate({
          schoolName: finalSchoolName,
          adminName: name,
          loginUrl: `${process.env.NEXTAUTH_URL || 'https://vidhyaan.com'}/login`,
          trialDays: 7
        }),
        textBody: `Welcome to Vidhyaan! ${finalSchoolName} is registered. Admin Name: ${name}.`
      })
    } catch (emailErr) {
      console.error('Failed to send school registration welcome email:', emailErr)
    }

    if (branch) {
      await prisma.userBranchAccess.create({
        data: {
          userId: user.id,
          branchId: branch.id,
          role: UserRole.ORG_ADMIN
        }
      })
    }

    // Store designation role in Organization settings if org exists
    if (org && role) {
      try {
        const currentSettings = (org.settings as any) || {}
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            settings: {
              ...currentSettings,
              adminRoleDesignation: role
            }
          }
        })
      } catch (e) {
        console.error('Failed to update organization settings with admin role designation:', e)
      }
    }

    // 4. Send OTP to phone
    const ipAddress = req.headers.get('x-forwarded-for') ?? undefined
    const otpCode = await createOTP(
      phone,
      OtpChannel.SMS,
      OtpPurpose.SIGNUP,
      ipAddress
    )

    await sendOTP(phone, otpCode, OtpChannel.SMS, OtpPurpose.SIGNUP)

    // 5. Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        orgId: org.id,
        action: AuditAction.CREATE,
        entityType: 'USER',
        entityId: user.id,
        ipAddress: ipAddress ?? null,
        userAgent: req.headers.get('user-agent') ?? null,
        after: {
          name,
          phone,
          email,
          role: UserRole.ORG_ADMIN,
          schoolRoleDesignation: role,
          schoolId
        }
      }
    }).catch(e => console.error('Failed to write registration audit log:', e))

    // 6. Generate temporary token for automatic sign in (NextAuth PIN credentials path)
    const tempToken = crypto.randomUUID()
    await redis.set(`pin_auth_token:${tempToken}`, user.id, 'EX', 60)

    return NextResponse.json({
      success: true,
      userId: user.id,
      token: tempToken
    })

  } catch (error: any) {
    console.error('School registration API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
