import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/client'
import { OtpChannel, OtpPurpose } from '@prisma/client'
import { sendOtpSms } from '@/lib/integrations/msg91'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { sendMetaAuthOtp } from '@/lib/integrations/meta-whatsapp'
import { getMetaWhatsAppConfig } from '@/lib/platform-config'

export function generateOTP(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String((array[0] % 9000) + 1000)
}

/**
 * Verify a code against the newest unconsumed OTP for `identifier` and consume
 * it. Mirrors the Credentials authorize() OTP block: 5-attempt cap, bcrypt
 * compare, single-use. Dev bypass code 123456 outside production.
 */
export async function verifyAndConsumeOtp(identifier: string, code: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development' && code === '123456') return true

  const otpRecord = await prisma.otpCode.findFirst({
    where: { identifier, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' }
  })
  if (!otpRecord) return false

  if (otpRecord.attempts >= 5) {
    await prisma.otpCode.delete({ where: { id: otpRecord.id } })
    return false
  }
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { attempts: { increment: 1 } }
  })

  const isValid = await bcrypt.compare(code, otpRecord.codeHash)
  if (!isValid) return false

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { consumedAt: new Date() }
  })
  return true
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

async function sendOtpEmail(email: string, code: string): Promise<{ success: boolean; suppressed?: boolean }> {
  const token = process.env.ZEPTOMAIL_API_TOKEN
  if (!token) {
    console.warn('Skipping email OTP send: ZEPTOMAIL_API_TOKEN is not configured')
    return { success: false }
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
    // deliver() doesn't throw on a suppressed address, it returns
    // {success:false, suppressed:true} — previously discarded here, so a
    // suppressed recipient's OTP silently vanished with the caller none the
    // wiser. Propagate it so callers can tell the user, instead of always
    // reporting success.
    return await sendTransactionalEmail({
      to: email,
      subject: 'Vidhyaan - Verification Code',
      htmlBody: html,
      textBody: `Your Vidhyaan verification code is: ${code}`
    })
  } catch (err) {
    console.error('Failed to send OTP email via ZeptoMail:', err)
    return { success: false }
  }
}

export type OrgOtpChannel = 'SMS' | 'WHATSAPP' | 'BOTH'

/** Org-configurable OTP delivery preference (Settings → Notifications). */
export async function getOrgOtpChannel(orgId: string): Promise<OrgOtpChannel> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { settings: true }
    })
    const pref = (org?.settings as any)?.otpChannel
    return pref === 'WHATSAPP' || pref === 'BOTH' ? pref : 'SMS'
  } catch {
    return 'SMS'
  }
}

/** OTP over WhatsApp via the Meta AUTHENTICATION template. Throws on failure. */
async function sendOtpWhatsAppMeta(phone: string, code: string): Promise<void> {
  const cfg = await getMetaWhatsAppConfig()
  if (!cfg.configured) throw new Error('Meta WhatsApp not configured')
  await sendMetaAuthOtp({
    to: phone,
    code,
    accessToken: cfg.accessToken!,
    phoneNumberId: cfg.phoneNumberId!,
    templateName: process.env.META_WA_OTP_TEMPLATE || 'otp_login'
  })
}

export async function sendOTP(
  contact: string,
  code: string,
  channel: OtpChannel,
  purpose?: OtpPurpose,
  opts?: { orgId?: string | null }
): Promise<{ success: boolean; suppressed?: boolean }> {
  const isDev = process.env.NODE_ENV === 'development' && process.env.FORCE_REAL_OTP !== 'true'

  if (isDev) {
    console.log('='.repeat(40))
    console.log('DEV OTP for:', contact)
    console.log('OTP Code:', code)
    console.log('Channel:', channel)
    console.log('Purpose:', purpose)
    console.log('='.repeat(40))
    return { success: true }
  }

  if (channel === 'SMS') {
    let templateId = process.env.MSG91_OTP_TEMPLATE_ID!
    if (purpose === 'SIGNUP' && process.env.MSG91_SIGNUP_TEMPLATE_ID) {
      templateId = process.env.MSG91_SIGNUP_TEMPLATE_ID
    } else if ((purpose === 'LOGIN' || purpose === 'VERIFY_PHONE') && process.env.MSG91_LOGIN_TEMPLATE_ID) {
      templateId = process.env.MSG91_LOGIN_TEMPLATE_ID
    }

    // Org preference decides the channel mix; platform users (no org) keep
    // SMS unless the env kill-switch opts everyone into WhatsApp too.
    const pref: OrgOtpChannel = opts?.orgId
      ? await getOrgOtpChannel(opts.orgId)
      : process.env.ENABLE_WHATSAPP === 'true' ? 'BOTH' : 'SMS'

    let waDelivered = false
    if (pref === 'WHATSAPP' || pref === 'BOTH') {
      try {
        await sendOtpWhatsAppMeta(contact, code)
        waDelivered = true
      } catch (err: any) {
        console.error('WhatsApp OTP failed (falling back to SMS):', err?.message ?? err)
      }
    }

    // SMS is the reliability floor: send it unless the org chose
    // WhatsApp-only AND the WhatsApp send actually went through.
    if (!(pref === 'WHATSAPP' && waDelivered)) {
      await sendOtpSms(contact, code, templateId)
    }
    return { success: true }
  }

  if (channel === 'EMAIL') {
    return sendOtpEmail(contact, code)
  }

  return { success: true }
}
