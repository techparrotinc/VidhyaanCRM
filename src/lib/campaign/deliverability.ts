import type { forOrg } from '@/lib/db'

// Shared-domain protection: if an org's recent EMAIL campaigns bounce or draw
// complaints above provider-safe thresholds, block further sends (auto-pause)
// until they clean their lists. SES itself pauses accounts that breach ~5%
// bounce / ~0.1% complaint — we stop well before that to protect the shared
// send.vidhyaan.com reputation for everyone.

export const BOUNCE_RATE_LIMIT = 0.05 // 5%
export const COMPLAINT_RATE_LIMIT = 0.001 // 0.1%
// Below this many measured sends the rates are too noisy to act on.
const MIN_SAMPLE = 50
// Trailing window for the reputation measurement.
const WINDOW_DAYS = 30

export async function checkEmailDeliverabilityGuard(
  db: ReturnType<typeof forOrg>,
  orgId: string
): Promise<{ blocked: boolean; reason?: string }> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const base = {
    orgId,
    sentAt: { gte: since },
    campaign: { channel: 'EMAIL' as const },
  }

  const [measured, bounced, complained] = await Promise.all([
    // Sends we have a delivery verdict for (exclude still-pending/just-sent).
    db.campaignRecipient.count({
      where: { ...base, status: { in: ['DELIVERED', 'BOUNCED', 'COMPLAINED'] } },
    }),
    db.campaignRecipient.count({ where: { ...base, status: 'BOUNCED' } }),
    db.campaignRecipient.count({ where: { ...base, status: 'COMPLAINED' } }),
  ])

  if (measured < MIN_SAMPLE) return { blocked: false }

  const bounceRate = bounced / measured
  const complaintRate = complained / measured

  if (bounceRate > BOUNCE_RATE_LIMIT) {
    return {
      blocked: true,
      reason: `Email sending is paused: your recent bounce rate is ${(bounceRate * 100).toFixed(1)}% (limit ${(BOUNCE_RATE_LIMIT * 100).toFixed(0)}%). Clean your recipient lists — sending to invalid addresses harms deliverability for everyone. Contact support to resume.`,
    }
  }
  if (complaintRate > COMPLAINT_RATE_LIMIT) {
    return {
      blocked: true,
      reason: `Email sending is paused: your recent spam-complaint rate is ${(complaintRate * 100).toFixed(2)}% (limit ${(COMPLAINT_RATE_LIMIT * 100).toFixed(1)}%). Only email contacts who expect to hear from you. Contact support to resume.`,
    }
  }
  return { blocked: false }
}
