import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { UserRole, UserStatus, OtpChannel, OtpPurpose, AuditAction, InstitutionType } from '@prisma/client'
import { redis } from '@/lib/redis'
import crypto from 'crypto'
import { sendTemplateEmail, welcomeSchoolTemplate } from '@/lib/integrations/resend'

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
    const body = await req.json()
    const { name, phone, email, role, schoolId, schoolName, institutionType } = body

    if (!name || !phone || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'name, phone, email, and role are required' },
        { status: 400 }
      )
    }

    // 1. Check if phone already registered.
    const existingUser = await prisma.user.findFirst({
      where: {
        phone,
        deletedAt: null
      }
    })

    if (existingUser && existingUser.role === UserRole.ORG_ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Account already exists. Please login.' },
        { status: 409 }
      )
    }

    // 2. Find Organization if schoolId is provided, or create one if schoolName/institutionType is provided
    let org = null
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

      branch = await prisma.branch.create({
        data: {
          orgId: org.id,
          name: 'Main Branch',
          isDefault: true,
          city: 'Unknown'
        }
      })

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

      await prisma.schoolAffiliation.create({
        data: {
          schoolId: school.id,
          orgId: org.id,
          board: 'Other'
        }
      })

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

      const leadModule = await prisma.module.findUnique({
        where: { slug: 'lead_management' }
      })
      if (leadModule) {
        await prisma.organizationModule.create({
          data: {
            orgId: org.id,
            moduleId: leadModule.id,
            enabled: true,
            enabledAt: new Date()
          }
        })
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

    // Check if email already registered in this organization
    const existingEmailUser = await prisma.user.findFirst({
      where: {
        orgId: org.id,
        email,
        deletedAt: null
      }
    })
    if (existingEmailUser) {
      return NextResponse.json(
        { success: false, error: 'An admin user with this email is already registered.' },
        { status: 409 }
      )
    }

    // 3. Create User
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

    // Send welcome email to ORG_ADMIN
    try {
      const finalSchoolName = schoolName || school?.name || org.name
      await sendTemplateEmail(
        email,
        "Welcome to Vidhyaan! 🎉",
        welcomeSchoolTemplate({
          schoolName: finalSchoolName,
          adminName: name,
          loginUrl: `${process.env.NEXTAUTH_URL || 'https://vidhyaan.com'}/login`,
          trialDays: 7
        })
      )
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

    await sendOTP(phone, otpCode, OtpChannel.SMS)

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
