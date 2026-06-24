import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendTemplateEmail, trialEndingTemplate } from '@/lib/integrations/resend'

export async function GET(req: NextRequest) {
  try {
    // 1. Secure check
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // 2. Find organizations ending in exactly 3 days
    const threeDaysFromNowStart = new Date()
    threeDaysFromNowStart.setDate(now.getDate() + 3)
    threeDaysFromNowStart.setHours(0, 0, 0, 0)

    const threeDaysFromNowEnd = new Date()
    threeDaysFromNowEnd.setDate(now.getDate() + 3)
    threeDaysFromNowEnd.setHours(23, 59, 59, 999)

    const trialEndingOrgs = await prisma.organization.findMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: {
          gte: threeDaysFromNowStart,
          lte: threeDaysFromNowEnd
        },
        trialReminderSent: null
      },
      include: {
        users: {
          where: { role: 'ORG_ADMIN', deletedAt: null }
        }
      }
    })

    // Process trial ending notifications
    for (const org of trialEndingOrgs) {
      const adminUser = org.users[0]
      const adminEmail = org.email || adminUser?.email
      const adminName = adminUser?.name || 'Administrator'
      const upgradeUrl = `${process.env.NEXTAUTH_URL || 'https://vidhyaan.com'}/billing`

      if (adminEmail) {
        try {
          await sendTemplateEmail(
            adminEmail,
            `Your Vidhyaan trial is ending in 3 days! ⚠️`,
            trialEndingTemplate({
              schoolName: org.name,
              adminName,
              daysLeft: 3,
              upgradeUrl
            })
          )
        } catch (emailErr) {
          console.error(`Failed to send trial ending email for org ${org.id}:`, emailErr)
        }
      }

      await prisma.organization.update({
        where: { id: org.id },
        data: { trialReminderSent: now }
      })
    }

    // 3. Find organizations whose trial has expired
    const expiredOrgs = await prisma.organization.findMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: {
          lt: now
        }
      },
      include: {
        users: {
          where: { role: 'ORG_ADMIN', deletedAt: null }
        }
      }
    })

    // Process trial expiration & write locks
    for (const org of expiredOrgs) {
      const adminUser = org.users[0]
      const adminEmail = org.email || adminUser?.email
      const adminName = adminUser?.name || 'Administrator'
      const upgradeUrl = `${process.env.NEXTAUTH_URL || 'https://vidhyaan.com'}/billing`

      if (adminEmail) {
        try {
          await sendTemplateEmail(
            adminEmail,
            `Your Vidhyaan trial has expired! ❌`,
            trialEndingTemplate({
              schoolName: org.name,
              adminName,
              daysLeft: 0,
              upgradeUrl
            })
          )
        } catch (emailErr) {
          console.error(`Failed to send trial expired email for org ${org.id}:`, emailErr)
        }
      }

      await prisma.organization.update({
        where: { id: org.id },
        data: { status: 'TRIAL_EXPIRED' }
      })
    }

    return NextResponse.json({
      processed: trialEndingOrgs.length + expiredOrgs.length
    })

  } catch (error: any) {
    console.error('Trial reminders cron error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
