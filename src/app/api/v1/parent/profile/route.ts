import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import bcrypt from 'bcryptjs'

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

    const body = await req.json()
    const { name, email, city, phone } = body

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters' },
        { status: 400 }
      )
    }

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
          role: 'PARENT',
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
        const purpose = 'SIGNUP'
        const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

        const otpCode = await createOTP(phone, channel, purpose, ipAddress)
        await sendOTP(phone, otpCode, channel)

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
          email: normalizedEmail || `${shouldUpdatePhone ? phone : parent.phone}@vidhyaan.com`,
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

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'PARENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Parent role required.' },
        { status: 401 }
      )
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id }
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent record not found' },
        { status: 404 }
      )
    }

    // Set deletedAt on User and Parent in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { 
          deletedAt: new Date(),
          status: 'DEACTIVATED'
        }
      }),
      prisma.parent.update({
        where: { id: parent.id },
        data: { deletedAt: new Date() }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })

  } catch (error: any) {
    console.error('Parent profile DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

