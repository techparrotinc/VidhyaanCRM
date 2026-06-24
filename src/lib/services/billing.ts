import { prisma } from '@/lib/db'
import { sendTemplateEmail, trialEndingTemplate, paymentFailedTemplate } from '@/lib/integrations/resend'

/**
 * Sends a trial ending warning email to the school admin.
 */
export async function sendTrialEndingEmail(
  orgId: string,
  daysLeft: number
): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      users: {
        where: { role: 'ORG_ADMIN', deletedAt: null },
        take: 1
      }
    }
  })

  if (!org) {
    throw new Error(`Organization ${orgId} not found`)
  }

  const adminEmail = org.email || org.users[0]?.email
  if (!adminEmail) {
    console.warn(`No email found for organization ${orgId}, skipping trial ending email.`)
    return
  }

  const adminName = org.users[0]?.name || 'Administrator'
  const upgradeUrl = `${process.env.NEXTAUTH_URL || 'https://vidhyaan.com'}/billing`

  await sendTemplateEmail(
    adminEmail,
    `Your trial is ending in ${daysLeft} days! ⚠️`,
    trialEndingTemplate({
      schoolName: org.name,
      adminName,
      daysLeft,
      upgradeUrl
    })
  )
}

/**
 * Sends a payment failed warning email to the billing contact.
 */
export async function sendPaymentFailedEmail(
  orgId: string,
  amount: number
): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      users: {
        where: { role: 'ORG_ADMIN', deletedAt: null },
        take: 1
      }
    }
  })

  if (!org) {
    throw new Error(`Organization ${orgId} not found`)
  }

  const adminEmail = org.email || org.users[0]?.email
  if (!adminEmail) {
    console.warn(`No email found for organization ${orgId}, skipping payment failed email.`)
    return
  }

  const retryUrl = `${process.env.NEXTAUTH_URL || 'https://vidhyaan.com'}/billing`

  await sendTemplateEmail(
    adminEmail,
    `Payment Failed: Action Required 🚨`,
    paymentFailedTemplate({
      schoolName: org.name,
      amount,
      retryUrl
    })
  )
}
