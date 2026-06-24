import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createOTP, sendOTP } from '@/lib/auth/otp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { schoolId } = body

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'schoolId is required' },
        { status: 400 }
      )
    }

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        contacts: {
          where: { type: 'email', deletedAt: null }
        }
      }
    })

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      )
    }

    const emailContact = school.contacts[0]
    if (!emailContact || !emailContact.value) {
      return NextResponse.json(
        { success: false, error: 'No contact email registered for this school' },
        { status: 400 }
      )
    }

    const emailAddress = emailContact.value
    const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

    const code = await createOTP(
      emailAddress,
      'EMAIL',
      'VERIFY_EMAIL',
      ipAddress
    )

    await sendOTP(emailAddress, code, 'EMAIL')

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to school email'
    })
  } catch (error: any) {
    console.error('Verify email route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
