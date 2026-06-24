import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { UserRole, UserStatus, OtpChannel, OtpPurpose, AuditAction } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, role, schoolId } = body

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

    // 2. Find Organization if schoolId is provided
    let org = null
    if (schoolId) {
      const school = await prisma.school.findUnique({
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
    }

    // Check if email already registered in this organization
    const existingEmailUser = await prisma.user.findFirst({
      where: {
        orgId: org ? org.id : null,
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
        orgId: org ? org.id : null
      }
    })

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
        orgId: org ? org.id : null,
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

    return NextResponse.json({
      success: true,
      userId: user.id
    })

  } catch (error: any) {
    console.error('School registration API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
