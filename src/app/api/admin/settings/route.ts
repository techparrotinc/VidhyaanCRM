import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

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

    return NextResponse.json(settings)

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

    const body = await req.json()

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

    const settings = await prisma.platformSettings.update({
      where: { id: 'default' },
      data: {
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
        razorpayWebhookSecret: body.razorpayWebhookSecret !== undefined ? body.razorpayWebhookSecret : undefined,
        doSpacesEndpoint: body.doSpacesEndpoint !== undefined ? body.doSpacesEndpoint : undefined,
        doSpacesBucket: body.doSpacesBucket !== undefined ? body.doSpacesBucket : undefined,
        doSpacesCdnUrl: body.doSpacesCdnUrl !== undefined ? body.doSpacesCdnUrl : undefined,
      }
    })

    return NextResponse.json(settings)

  } catch (error: any) {
    console.error('Update Platform Settings API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
