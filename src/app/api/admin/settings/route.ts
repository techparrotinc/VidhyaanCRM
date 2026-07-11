import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { encryptSecret } from '@/lib/payments/vault'
import { invalidatePlatformConfigCache } from '@/lib/platform-config'

const intLike = z.union([z.string().max(20), z.number()]).transform((v) => String(v))
const strOpt = (max: number) => z.string().max(max).optional()

const platformSettingsSchema = z.object({
  freePlanLeadCap: intLike.optional(),
  trialDurationDays: intLike.optional(),
  defaultOtpTtlMinutes: intLike.optional(),
  enableWhatsapp: z.boolean().optional(),
  enableCampaignModule: z.boolean().optional(),
  enableAiFeatures: z.boolean().optional(),
  enablePublicApiAccess: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  fromEmailAddress: strOpt(200),
  supportEmail: strOpt(200),
  fromName: strOpt(100),
  opsAlertEmail: strOpt(200),
  slackWebhookUrl: strOpt(500),
  razorpayLiveKey: strOpt(200),
  razorpayWebhookSecret: strOpt(200),
  doSpacesEndpoint: strOpt(300),
  doSpacesBucket: strOpt(100),
  doSpacesCdnUrl: strOpt(300),
  // Admin-managed integration credentials (Phase 3). Secrets arrive as
  // plaintext and are encrypted at rest; '' clears a stored value.
  razorpayKeyId: strOpt(200),
  razorpayKeySecret: strOpt(200),
  s3Region: strOpt(60),
  s3AccessKeyId: strOpt(200),
  s3SecretKey: strOpt(400),
  zeptoToken: strOpt(600),
  zeptoFromEmail: strOpt(200),
  zeptoCampaignEmail: strOpt(200),
  msg91AuthKey: strOpt(200),
  msg91WhatsappNumber: strOpt(40),
  msg91SenderId: strOpt(40),
  metaWaAccessToken: strOpt(600),
  metaWaPhoneNumberId: strOpt(40),
  metaWaBusinessAccountId: strOpt(40),
  // Usage & ROI model
  usageHourlyRate: intLike.optional(),
  usageMinutesPerAction: z.record(z.string().max(40), z.number().min(0).max(600)).optional(),
  // External uptime monitor
  uptimeRobotApiKey: strOpt(200),
  enabledBillingCycles: z
    .array(z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']))
    .min(1, 'At least one billing cycle must stay enabled')
    .optional(),
  pricesIncludeGst: z.boolean().optional(),
  businessName: strOpt(200),
  businessAddress: strOpt(500),
  businessGstin: strOpt(20)
})

// Never send secret ciphertext to the client. Strip the *Enc columns + the
// legacy plaintext webhook secret and expose boolean "is configured" flags so
// the UI can show a set/not-set state without revealing values.
function maskSettings(s: any) {
  const {
    razorpayKeySecretEnc,
    razorpayWebhookSecretEnc,
    razorpayWebhookSecret,
    s3SecretKeyEnc,
    zeptoTokenEnc,
    msg91AuthKeyEnc,
    metaWaAccessTokenEnc,
    uptimeRobotApiKeyEnc,
    ...rest
  } = s
  return {
    ...rest,
    hasRazorpayKeySecret: !!razorpayKeySecretEnc,
    hasRazorpayWebhookSecret: !!(razorpayWebhookSecretEnc || razorpayWebhookSecret),
    hasS3SecretKey: !!s3SecretKeyEnc,
    hasZeptoToken: !!zeptoTokenEnc,
    hasMsg91AuthKey: !!msg91AuthKeyEnc,
    hasMetaWaAccessToken: !!metaWaAccessTokenEnc,
    hasUptimeRobotKey: !!uptimeRobotApiKeyEnc,
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (!session?.user || !['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' }
    })

    return NextResponse.json(maskSettings(settings))

  } catch (error: any) {
    console.error('Get Platform Settings API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    // Only SUPER_ADMIN can write settings
    if (!session?.user || role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. SUPER_ADMIN required.' }, { status: 401 })
    }

    const parsed = platformSettingsSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const body = parsed.data

    // If freePlanLeadCap changes, we update the free plan's lead cap and all its organizations as requested:
    // "Free plan lead cap: Save -> updates all free plan orgs."
    if (body.freePlanLeadCap !== undefined) {
      const cap = parseInt(body.freePlanLeadCap)
      const freePlan = await prisma.plan.findUnique({
        where: { slug: 'free' }
      })
      if (freePlan) {
        await prisma.plan.update({
          where: { id: freePlan.id },
          data: { leadCap: cap }
        })
        await prisma.organization.updateMany({
          where: { planId: freePlan.id, deletedAt: null },
          data: { leadCap: cap }
        })
      }
    }

    // Encrypt a secret for storage; undefined = leave as-is, '' = clear (null).
    const encField = (v: string | undefined): string | null | undefined => {
      if (v === undefined) return undefined
      if (v === '') return null
      return encryptSecret(v)
    }
    const plainOrClear = (v: string | undefined): string | null | undefined => {
      if (v === undefined) return undefined
      return v === '' ? null : v
    }

    const settings = await prisma.platformSettings.update({
      where: { id: 'default' },
      data: {
        // Integration credentials (Phase 3)
        razorpayKeyId: plainOrClear(body.razorpayKeyId),
        razorpayKeySecretEnc: encField(body.razorpayKeySecret),
        razorpayWebhookSecretEnc: encField(body.razorpayWebhookSecret),
        s3Region: plainOrClear(body.s3Region),
        s3AccessKeyId: plainOrClear(body.s3AccessKeyId),
        s3SecretKeyEnc: encField(body.s3SecretKey),
        zeptoTokenEnc: encField(body.zeptoToken),
        zeptoFromEmail: plainOrClear(body.zeptoFromEmail),
        zeptoCampaignEmail: plainOrClear(body.zeptoCampaignEmail),
        msg91AuthKeyEnc: encField(body.msg91AuthKey),
        msg91WhatsappNumber: plainOrClear(body.msg91WhatsappNumber),
        msg91SenderId: plainOrClear(body.msg91SenderId),
        metaWaAccessTokenEnc: encField(body.metaWaAccessToken),
        metaWaPhoneNumberId: plainOrClear(body.metaWaPhoneNumberId),
        metaWaBusinessAccountId: plainOrClear(body.metaWaBusinessAccountId),
        usageHourlyRate: body.usageHourlyRate !== undefined ? parseInt(body.usageHourlyRate) : undefined,
        usageMinutesPerAction: body.usageMinutesPerAction !== undefined ? body.usageMinutesPerAction : undefined,
        uptimeRobotApiKeyEnc: encField(body.uptimeRobotApiKey),
        freePlanLeadCap: body.freePlanLeadCap !== undefined ? parseInt(body.freePlanLeadCap) : undefined,
        trialDurationDays: body.trialDurationDays !== undefined ? parseInt(body.trialDurationDays) : undefined,
        defaultOtpTtlMinutes: body.defaultOtpTtlMinutes !== undefined ? parseInt(body.defaultOtpTtlMinutes) : undefined,
        enableWhatsapp: body.enableWhatsapp !== undefined ? Boolean(body.enableWhatsapp) : undefined,
        enableCampaignModule: body.enableCampaignModule !== undefined ? Boolean(body.enableCampaignModule) : undefined,
        enableAiFeatures: body.enableAiFeatures !== undefined ? Boolean(body.enableAiFeatures) : undefined,
        enablePublicApiAccess: body.enablePublicApiAccess !== undefined ? Boolean(body.enablePublicApiAccess) : undefined,
        maintenanceMode: body.maintenanceMode !== undefined ? Boolean(body.maintenanceMode) : undefined,
        fromEmailAddress: body.fromEmailAddress !== undefined ? body.fromEmailAddress : undefined,
        supportEmail: body.supportEmail !== undefined ? body.supportEmail : undefined,
        fromName: body.fromName !== undefined ? body.fromName : undefined,
        opsAlertEmail: body.opsAlertEmail !== undefined ? body.opsAlertEmail : undefined,
        slackWebhookUrl: body.slackWebhookUrl !== undefined ? body.slackWebhookUrl : undefined,
        razorpayLiveKey: body.razorpayLiveKey !== undefined ? body.razorpayLiveKey : undefined,
        // razorpayWebhookSecret is now stored encrypted via razorpayWebhookSecretEnc above.
        doSpacesEndpoint: body.doSpacesEndpoint !== undefined ? body.doSpacesEndpoint : undefined,
        doSpacesBucket: body.doSpacesBucket !== undefined ? body.doSpacesBucket : undefined,
        doSpacesCdnUrl: body.doSpacesCdnUrl !== undefined ? body.doSpacesCdnUrl : undefined,
        enabledBillingCycles: body.enabledBillingCycles !== undefined ? body.enabledBillingCycles : undefined,
        pricesIncludeGst: body.pricesIncludeGst !== undefined ? Boolean(body.pricesIncludeGst) : undefined,
        businessName: body.businessName !== undefined ? body.businessName : undefined,
        businessAddress: body.businessAddress !== undefined ? body.businessAddress : undefined,
        businessGstin: body.businessGstin !== undefined ? body.businessGstin.toUpperCase() : undefined,
      }
    })

    // Drop the resolver's cached settings so new credentials/flags take effect.
    invalidatePlatformConfigCache()

    return NextResponse.json(maskSettings(settings))

  } catch (error: any) {
    console.error('Update Platform Settings API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
