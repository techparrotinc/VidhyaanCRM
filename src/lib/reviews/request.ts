// Review-request incentive (PRD: "WhatsApp/Email reminder after admission
// confirmed"). Fired when an admission flips to ADMITTED. Fire-and-forget at
// call sites — a failed nudge must never fail the admission update.
//
// Idempotency: one request per admission, ledgered as an AdmissionActivity of
// type REVIEW_REQUEST; also skipped when the parent already reviewed the
// school. WhatsApp goes through metered-send (BYO creds first, else 1 credit)
// only when the org opted into WhatsApp; email is the default channel.

import { prisma } from '@/lib/db'
import { cleanPhoneNumber } from '@/lib/utils'
import { sendMeteredWhatsApp } from '@/lib/credits/metered-send'
import { renderEmailHtml } from '@/lib/mail/org-templates'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'

// Ledgered as a SYSTEM activity with this summary prefix (ActivityType enum
// has no dedicated value; avoids a schema change for a marker row).
const LEDGER_PREFIX = 'Review request sent'

export async function sendReviewRequestForAdmission(
  orgId: string,
  admission: {
    id: string
    applicantName: string
    parentName?: string | null
    phone?: string | null
    email?: string | null
  }
): Promise<void> {
  // Idempotency ledger — one nudge per admission
  const alreadySent = await prisma.admissionActivity.findFirst({
    where: {
      orgId,
      admissionId: admission.id,
      type: 'SYSTEM',
      summary: { startsWith: LEDGER_PREFIX },
    },
    select: { id: true },
  })
  if (alreadySent) return

  // Resolve the org's public marketplace listing for the deep link
  const [org, school] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } }),
    prisma.school.findFirst({
      where: { orgId, deletedAt: null },
      select: { id: true, slug: true, institutionType: true },
    }),
  ])
  if (!school) return // no marketplace listing → nowhere to review

  // Skip when this parent already reviewed the school
  const phoneKey = cleanPhoneNumber(admission.phone ?? '')
  const parent =
    typeof phoneKey === 'string' && phoneKey.length >= 10
      ? await prisma.parent.findFirst({
          where: { OR: [{ phone: phoneKey }, { phone: `+91${phoneKey}` }, { phone: `91${phoneKey}` }] },
          select: { id: true },
        })
      : null
  if (parent) {
    const existingReview = await prisma.schoolReview.findFirst({
      where: { parentId: parent.id, schoolId: school.id, deletedAt: null },
      select: { id: true },
    })
    if (existingReview) return
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://app-dev.vidhyaan.com'
  const profilePath = school.institutionType === 'LEARNING_CENTER' ? 'learning-centers' : 'schools'
  const reviewLink = `${baseUrl}/${profilePath}/${school.slug}#reviews`
  const schoolName = org?.name ?? 'your school'
  const parentName = admission.parentName || 'Parent'

  let delivered = false

  // Email (default channel)
  if (admission.email) {
    try {
      await sendTransactionalEmail({
        to: admission.email,
        toName: parentName,
        subject: `Congratulations! Share your admission experience at ${schoolName}`,
        htmlBody: renderEmailHtml(
          `Dear ${parentName},\n\nCongratulations on ${admission.applicantName}'s confirmed admission at ${schoolName}!\n\nYour experience matters to other parents choosing a school. It takes just 2 minutes to share a review:\n\n${reviewLink}\n\nThank you for helping the parent community make informed choices.\n\nWarm regards,\n${schoolName} (via Vidhyaan)`
        ),
      })
      delivered = true
    } catch (e) {
      console.error('Review request email failed:', e)
    }
  }

  // WhatsApp via metered send (never let credit errors bubble up)
  if (admission.phone && typeof phoneKey === 'string' && phoneKey.length >= 10) {
    try {
      await sendMeteredWhatsApp(
        orgId,
        phoneKey,
        'review_request',
        `Congratulations ${parentName}! ${admission.applicantName}'s admission at ${schoolName} is confirmed. Loved the experience? Share a quick review to help other parents: ${reviewLink}`,
        `review-request:${admission.id}`
      )
      delivered = true
    } catch (e) {
      console.error('Review request WhatsApp failed:', e)
    }
  }

  if (delivered) {
    await prisma.admissionActivity.create({
      data: {
        orgId,
        admissionId: admission.id,
        type: 'SYSTEM',
        summary: `${LEDGER_PREFIX} to ${parentName} (${[admission.email, admission.phone].filter(Boolean).join(', ')})`,
      },
    })
  }
}
