import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { sendCampaignEmail } from '@/lib/integrations/zeptomail'
import { renderCampaignEmailHtml, renderBlocksToHtml, sanitizeEmailHtml, splitSubject, type EmailBlock } from '@/lib/campaign/renderEmail'

// Send ONE test email so the composer can preview the real render before
// blasting the audience. EMAIL-only in v1 (SMS/WhatsApp tests would burn
// credits + need an approved template). Goes through the CAMPAIGN pipeline
// (Amazon SES, from send.vidhyaan.com) so it exercises the exact path a real
// campaign takes — bypasses quota + never touches the daily cap.
const schema = z.object({
  channel: z.literal('EMAIL'),
  to: z.string().email(),
  // The composed body; may carry a leading "Subject: …" line like a real send.
  templateBody: z.string().max(4000),
  heroImageUrl: z.string().url().max(500).optional().nullable(),
  emailBlocks: z.array(z.record(z.string(), z.any())).max(50).optional().nullable(),
  emailHtml: z.string().max(50000).optional().nullable(),
})

export const POST = route({
  module: 'campaign_management',
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ req }) => {
    const body = schema.parse(await req.json())

    const { subject, body: text } = splitSubject(body.templateBody, 'Campaign preview')
    const html =
      body.emailBlocks && body.emailBlocks.length > 0
        ? renderCampaignEmailHtml({ html: renderBlocksToHtml(body.emailBlocks as EmailBlock[]), imageUrl: body.heroImageUrl })
        : body.emailHtml
          ? renderCampaignEmailHtml({ html: sanitizeEmailHtml(body.emailHtml), imageUrl: body.heroImageUrl })
          : renderCampaignEmailHtml({ body: text, imageUrl: body.heroImageUrl })

    let res: { success: boolean; suppressed?: boolean }
    try {
      res = await sendCampaignEmail({
        to: body.to,
        subject: `[TEST] ${subject}`,
        htmlBody: html,
        textBody: text,
      })
    } catch (err: any) {
      // Surface the provider error (e.g. SES sandbox: recipient not verified)
      // so the composer sees why instead of a generic failure.
      throw Errors.businessRule(
        `Test email failed to send: ${err?.message ?? 'sending error'}. If Amazon SES is still in sandbox, verify this address in SES or request production access.`
      )
    }

    if (!res.success) {
      throw Errors.businessRule(
        res.suppressed
          ? 'That address is on the suppression list (previously hard-bounced).'
          : 'Test email failed to send. Check the sending configuration.'
      )
    }
    return ok({ sent: true, to: body.to })
  },
})
