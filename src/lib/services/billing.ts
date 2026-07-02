import { prisma } from '@/lib/db/client'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { trialEndingTemplate, paymentFailedTemplate } from '@/lib/mail/templates'

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
        where: { roleAssignments: { some: { role: 'ORG_ADMIN', status: 'ACTIVE' } }, deletedAt: null },
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

  await sendTransactionalEmail({
    to: adminEmail,
    subject: `Your trial is ending in ${daysLeft} days! ⚠️`,
    htmlBody: trialEndingTemplate({
      schoolName: org.name,
      adminName,
      daysLeft,
      upgradeUrl
    }),
    textBody: `Hi ${adminName}, your trial for ${org.name} is ending in ${daysLeft} days.`
  })
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
        where: { roleAssignments: { some: { role: 'ORG_ADMIN', status: 'ACTIVE' } }, deletedAt: null },
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

  await sendTransactionalEmail({
    to: adminEmail,
    subject: `Payment Failed: Action Required 🚨`,
    htmlBody: paymentFailedTemplate({
      schoolName: org.name,
      amount,
      retryUrl
    }),
    textBody: `Payment Failed for ${org.name}. Amount due: INR ${amount}.`
  })
}
