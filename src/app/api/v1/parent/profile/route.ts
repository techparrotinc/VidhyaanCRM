import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { OtpPurpose } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { cleanPhoneNumber } from '@/lib/utils'

const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  email: z.string().email().max(200).optional().nullable().or(z.literal('')),
  city: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  code: z.string().max(10).optional().nullable()
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    // Find Parent record by userId and include kids relation
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        kids: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent profile record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: parent
    })

  } catch (error: any) {
    console.error('Parent profile GET error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const parsedBody = profileUpdateSchema.safeParse(await req.json())
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsedBody.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const body = parsedBody.data
    const { name, email, city, phone: rawPhone } = body
    const phone = rawPhone ? (cleanPhoneNumber(rawPhone) as string) : undefined

    // Find Parent record
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    // Check if phone number is changing
    let shouldUpdatePhone = false
    if (phone && phone !== parent.phone) {
      // Validate phone number format
      if (!/^[6-9]\d{9}$/.test(phone)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid 10-digit mobile number' },
          { status: 400 }
        )
      }

      // Check if phone is already registered as PARENT
      const existingUser = await prisma.user.findFirst({
        where: {
          phone,
          roleAssignments: { some: { role: 'PARENT', status: 'ACTIVE' } },
          id: { not: session.user.id },
          deletedAt: null
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'This phone number is already registered to another account' },
          { status: 409 }
        )
      }

      const { code } = body
      if (!code) {
        // Send OTP code
        const channel = 'SMS'
        const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

        const otpCode = await createOTP(phone, channel, OtpPurpose.SIGNUP, ipAddress)
        await sendOTP(phone, otpCode, channel, OtpPurpose.SIGNUP)

        return NextResponse.json({
          success: true,
          requiresVerification: true,
          pendingPhone: phone
        })
      }

      // Verify OTP code
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          identifier: phone,
          consumedAt: null,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!otpRecord) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired OTP code' },
          { status: 400 }
        )
      }

      const isValid = await bcrypt.compare(code, otpRecord.codeHash)
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid OTP code' },
          { status: 400 }
        )
      }

      // Consume OTP code
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { consumedAt: new Date() }
      })

      shouldUpdatePhone = true
    }

    const normalizedEmail = email && email.trim() !== '' ? email.trim().toLowerCase() : null

    // Update parent and user records in a transaction
    const updatedParent = await prisma.$transaction(async (tx) => {
      // Update User
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          name,
          email: normalizedEmail,
          phone: shouldUpdatePhone ? phone : undefined
        }
      })

      // Update Parent
      return tx.parent.update({
        where: { id: parent.id },
        data: {
          name,
          email: normalizedEmail,
          city: city || null,
          phone: shouldUpdatePhone ? phone : undefined
        },
        include: {
          kids: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' }
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      data: updatedParent
    })

  } catch (error: any) {
    console.error('Parent profile PUT error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
