import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/client'
import { OtpChannel, OtpPurpose } from '@prisma/client'
import { sendOtpSms, sendOtpWhatsApp } from '@/lib/integrations/msg91'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'

export function generateOTP(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String((array[0] % 9000) + 1000)
}

export async function createOTP(
  identifier: string,
  channel: OtpChannel,
  purpose: OtpPurpose,
  ipAddress?: string
): Promise<string> {
  const code = generateOTP()
  const codeHash = await bcrypt.hash(code, 10)
  const expiresAt = new Date(
    Date.now() +
    Number(process.env.OTP_TTL_SECONDS || 600) * 1000
  )

  // Delete existing unused OTPs
  await prisma.otpCode.deleteMany({
    where: {
      identifier,
      consumedAt: null
    }
  })

  // Create new OTP record
  await prisma.otpCode.create({
    data: {
      identifier,
      channel,
      purpose,
      codeHash,
      expiresAt,
      ipAddress: ipAddress ?? null,
      attempts: 0
    }
  })

  return code
}

async function sendOtpEmail(email: string, code: string): Promise<void> {
  const token = process.env.ZEPTOMAIL_API_TOKEN
  if (!token) {
    console.warn('Skipping email OTP send: ZEPTOMAIL_API_TOKEN is not configured')
    return
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1a365d; margin-bottom: 16px;">Verification Code</h2>
      <p>Your Vidhyaan verification code is:</p>
      <div style="background-color: #f7fafc; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
        ${code}
      </div>
      <p style="color: #718096; font-size: 14px;">This code is valid for 10 minutes. Please do not share it with anyone.</p>
      <hr style="border: none; border-top: 1px solid #edf2f7; margin: 20px 0;" />
      <p style="color: #a0aec0; font-size: 11px;">If you did not request this code, please ignore this email.</p>
    </div>
  `

  try {
    await sendTransactionalEmail({
      to: email,
      subject: 'Vidhyaan - Verification Code',
      htmlBody: html,
      textBody: `Your Vidhyaan verification code is: ${code}`
    })
  } catch (err) {
    console.error('Failed to send OTP email via ZeptoMail:', err)
  }
}

export async function sendOTP(
  contact: string,
  code: string,
  channel: OtpChannel,
  purpose?: OtpPurpose
): Promise<void> {
  const isDev = process.env.NODE_ENV === 'development' && process.env.FORCE_REAL_OTP !== 'true'

  if (isDev) {
    console.log('='.repeat(40))
    console.log('DEV OTP for:', contact)
    console.log('OTP Code:', code)
    console.log('Channel:', channel)
    console.log('Purpose:', purpose)
    console.log('='.repeat(40))
    return
  }

  if (channel === 'SMS') {
    let templateId = process.env.MSG91_OTP_TEMPLATE_ID!
    if (purpose === 'SIGNUP' && process.env.MSG91_SIGNUP_TEMPLATE_ID) {
      templateId = process.env.MSG91_SIGNUP_TEMPLATE_ID
    } else if ((purpose === 'LOGIN' || purpose === 'VERIFY_PHONE') && process.env.MSG91_LOGIN_TEMPLATE_ID) {
      templateId = process.env.MSG91_LOGIN_TEMPLATE_ID
    }

    await sendOtpSms(
      contact,
      code,
      templateId
    )

    if (process.env.ENABLE_WHATSAPP === 'true') {
      await sendOtpWhatsApp(contact, code).catch((err) => {
        console.error('WhatsApp OTP failed:', err)
      })
    }
  }

  if (channel === 'EMAIL') {
    await sendOtpEmail(contact, code)
  }
}
