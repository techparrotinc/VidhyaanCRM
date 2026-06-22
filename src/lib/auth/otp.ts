import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { OtpChannel, OtpPurpose } from '@prisma/client'

export function generateOTP(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String((array[0] % 900000) + 100000)
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

export async function sendOTP(
  contact: string,
  code: string,
  channel: OtpChannel
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('DEV OTP for', contact, ':', code)
    return
  }
  // Production: integrate MSG91 here later
  console.log('OTP sending not configured yet')
}
