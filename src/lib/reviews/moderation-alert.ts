// Alert platform moderators when a review lands in the FLAGGED queue —
// nobody polls /admin/reviews, so flags must push. Email only (platform
// admins live outside org-scoped in-app notifications).

import { prisma } from '@/lib/db'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'

export async function alertModeratorsReviewFlagged(opts: {
  reviewId: string
  schoolName: string
  flaggedBy: string // e.g. "3 user reports" | "School (reason: …)"
}): Promise<void> {
  try {
    const moderators = await prisma.user.findMany({
      where: {
        roleAssignments: {
          some: { role: { in: ['SUPER_ADMIN', 'OPERATIONS_ADMIN'] }, status: 'ACTIVE' },
        },
        status: 'ACTIVE',
        deletedAt: null,
        email: { not: null },
      },
      select: { email: true },
    })
    if (moderators.length === 0) return

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const queueUrl = `${baseUrl}/admin/reviews`

    await Promise.all(
      moderators.map((m) =>
        sendTransactionalEmail({
          to: m.email as string,
          subject: `Review flagged on ${opts.schoolName} — decision needed`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <p style="font-size:14px;color:#334155;">A review on <b>${opts.schoolName}</b> was flagged by ${opts.flaggedBy} and is now hidden pending your decision.</p>
              <p style="text-align:center;margin:24px 0;">
                <a href="${queueUrl}" style="display:inline-block;background:#1565D8;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">Open Moderation Queue</a>
              </p>
            </div>`,
          textBody: `A review on ${opts.schoolName} was flagged by ${opts.flaggedBy}. Decide at ${queueUrl}`,
        }).catch(() => {})
      )
    )
  } catch (e) {
    console.error('Moderator flag alert failed:', e)
  }
}
