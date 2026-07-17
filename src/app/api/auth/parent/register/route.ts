import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { AuditAction, OtpChannel, OtpPurpose, UserRole, UserStatus, Prisma } from '@prisma/client'
import { cleanPhoneNumber } from '@/lib/utils'
import { findOrCreateUserByPhone } from '@/lib/auth/findOrCreateUserByPhone'

const parentRegisterSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  phone: z.preprocess(cleanPhoneNumber, z.string().regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid 10-digit mobile number' })),
  // email intentionally absent — parent emails come only from Google SSO
  // (verified, never bounces); typed emails were a bounce source.
  city: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => {
      throw Object.assign(new Error('Invalid or empty request body'), { isBodyParse: true })
    })
    const result = parentRegisterSchema.safeParse(body)

    if (!result.success) {
      const issues = result.error.issues
      return NextResponse.json(
        {
          success: false,
          error: issues[0]?.message || 'Invalid registration data',
          details: issues
        },
        { status: 400 }
      )
    }

    const { name, phone, city } = result.data

    // 2. Create or Find User
    const userResult = await findOrCreateUserByPhone({
      phone,
      name,
      email: null,
      role: UserRole.PARENT,
      orgId: null,
      status: UserStatus.ACTIVE
    })

    const { user, isNewUser } = userResult
    if (!isNewUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'An account with this phone number already exists. Please login instead.'
        },
        { status: 409 }
      )
    }

    // 3. Create or update Parent record in marketplace schema
    // Since parent enquiries may have already created a Parent record, we upsert on phone
    const existingParent = await prisma.parent.findUnique({
      where: { phone }
    })

    let parentRecord
    if (existingParent) {
      parentRecord = await prisma.parent.update({
        where: { id: existingParent.id },
        data: {
          userId: user.id,
          name,
          city: city || existingParent.city
        }
      })
    } else {
      parentRecord = await prisma.parent.create({
        data: {
          userId: user.id,
          name,
          phone,
          email: null,
          city: city || null
        }
      })
    }

    // 4. Send welcome OTP via regular OTP send logic (purpose: SIGNUP/LOGIN)
    const channel: OtpChannel = 'SMS'
    const purpose: OtpPurpose = OtpPurpose.SIGNUP
    const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

    const code = await createOTP(
      phone,
      channel,
      purpose,
      ipAddress
    )

    await sendOTP(phone, code, channel, purpose)

    // 5. Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.CREATE,
        entityType: 'USER',
        entityId: user.id,
        ipAddress: ipAddress ?? null,
        userAgent: req.headers.get('user-agent') ?? null,
        after: {
          name,
          phone,
          role: UserRole.PARENT,
          parentId: parentRecord.id
        }
      }
    }).catch(e => console.error('Failed to write registration audit log:', e))

    // 6. Return response
    return NextResponse.json({
      success: true,
      userId: user.id,
      message: 'Account created. Please verify your phone number.'
    })

  } catch (error: any) {
    if (error?.isBodyParse) {
      return NextResponse.json(
        { success: false, error: 'Invalid or empty request body' },
        { status: 400 }
      )
    }
    console.error('Parent registration error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const field = (error.meta?.target as string[])
      if (field?.includes('phone')) {
        return NextResponse.json(
          { success: false, error: 'This phone number is already registered. Please login instead.' },
          { status: 409 }
        )
      }
      if (field?.includes('email')) {
        return NextResponse.json(
          { success: false, error: 'This email address is already registered. Please login instead.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'An account with these details already exists. Please login instead.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error during registration'
      },
      { status: 500 }
    )
  }
}
