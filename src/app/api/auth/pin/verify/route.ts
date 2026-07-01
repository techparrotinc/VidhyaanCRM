import { NextRequest, NextResponse } from 'next/server'
import { verifyPinCredentials, verifyPinToken } from '@/lib/auth/verifyPin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, pin, token } = body

    if (token) {
      const result = await verifyPinToken(token)
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error, message: result.message },
          { status: result.status }
        )
      }
      return NextResponse.json({
        success: true,
        userId: result.userId
      })
    }

    if (!phone || !pin) {
      return NextResponse.json(
        { success: false, error: 'Phone number and PIN are required' },
        { status: 400 }
      )
    }

    const result = await verifyPinCredentials(phone, pin)
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
          retryAfter: result.retryAfter,
          attemptsLeft: result.attemptsLeft
        },
        { status: result.status }
      )
    }

    return NextResponse.json({
      success: true,
      userId: result.userId,
      token: result.token
    })

  } catch (error: any) {
    console.error('Verify PIN API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
