import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { createOTP, sendOTP } from '@/lib/auth/otp'
import { OtpPurpose } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const parsed = z.object({ schoolId: z.string().min(1).max(50) }).safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'schoolId is required' },
        { status: 400 }
      )
    }
    const { schoolId } = parsed.data

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

    const result = await sendOTP(emailAddress, code, 'EMAIL', OtpPurpose.VERIFY_EMAIL)
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.suppressed ? 'EMAIL_SUPPRESSED' : 'EMAIL_SEND_FAILED',
          message: result.suppressed
            ? 'This email address cannot receive mail (previous delivery failure on record). Update the school contact email or contact support.'
            : 'Could not send the verification code. Please try again in a moment.'
        },
        { status: 502 }
      )
    }

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
