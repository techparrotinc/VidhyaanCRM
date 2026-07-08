import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { trialEndingTemplate } from '@/lib/mail/templates'
import { createNotification } from '@/lib/services/notifications'
import { remapOrgModulesToPlan } from '@/lib/billing/lifecycle'

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
          where: { roleAssignments: { some: { role: 'ORG_ADMIN', status: 'ACTIVE' } }, deletedAt: null }
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
          await sendTransactionalEmail({
            to: adminEmail,
            subject: `Your Vidhyaan trial is ending in 3 days! ⚠️`,
            htmlBody: trialEndingTemplate({
              schoolName: org.name,
              adminName,
              daysLeft: 3,
              upgradeUrl
            }),
            textBody: `Hi ${adminName}, your trial for ${org.name} is ending in 3 days.`
          })
        } catch (emailErr) {
          console.error(`Failed to send trial ending email for org ${org.id}:`, emailErr)
        }
      }

      if (adminUser) {
        try {
          await createNotification({
            orgId: org.id,
            recipientType: 'USER',
            recipientId: adminUser.id,
            type: 'TRIAL_ENDING',
            title: 'Your trial ends in 3 days',
            body: 'Upgrade to keep access to all CRM features.',
            data: {
              href: '/settings/billing'
            }
          })
        } catch (nErr) {
          console.error(`Failed to trigger trial ending in-app notification for org ${org.id}:`, nErr)
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
          where: { roleAssignments: { some: { role: 'ORG_ADMIN', status: 'ACTIVE' } }, deletedAt: null }
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
          await sendTransactionalEmail({
            to: adminEmail,
            subject: `Your Vidhyaan trial has expired! ❌`,
            htmlBody: trialEndingTemplate({
              schoolName: org.name,
              adminName,
              daysLeft: 0,
              upgradeUrl
            }),
            textBody: `Hi ${adminName}, your trial for ${org.name} has expired.`
          })
        } catch (emailErr) {
          console.error(`Failed to send trial expired email for org ${org.id}:`, emailErr)
        }
      }

      await prisma.organization.update({
        where: { id: org.id },
        data: { status: 'TRIAL_EXPIRED' }
      })

      // Trial ran on Enterprise modules — lock back down to the free plan's set
      try {
        const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } })
        if (freePlan) await remapOrgModulesToPlan(org.id, freePlan.id)
      } catch (e) {
        console.error(`Trial expiry module lockdown failed for org ${org.id}:`, e)
      }
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
