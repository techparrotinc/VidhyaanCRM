import { z } from 'zod'
import { route } from '@/lib/api/compose'
import { ok } from '@/lib/api/respond'
import { Errors } from '@/lib/api/errors'
import { ROLES } from '@/constants/roles'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { renderCampaignEmailHtml, renderBlocksToHtml, splitSubject, type EmailBlock } from '@/lib/campaign/renderEmail'

// Send ONE test email so the composer can preview the real render before
// blasting the audience. EMAIL-only in v1 (SMS/WhatsApp tests would burn
// credits + need an approved template). Goes through the transactional
// pipeline — bypasses campaign quota + never touches the daily cap.
const schema = z.object({
  channel: z.literal('EMAIL'),
  to: z.string().email(),
  // The composed body; may carry a leading "Subject: …" line like a real send.
  templateBody: z.string().max(4000),
  heroImageUrl: z.string().url().max(500).optional().nullable(),
  emailBlocks: z.array(z.record(z.string(), z.any())).max(50).optional().nullable(),
})

export const POST = route({
  module: 'campaign_management',
  roles: [ROLES.ORG_ADMIN, ROLES.BRANCH_ADMIN, ROLES.COUNSELLOR],
  handler: async ({ req }) => {
    const body = schema.parse(await req.json())

    const { subject, body: text } = splitSubject(body.templateBody, 'Campaign preview')
    const html = body.emailBlocks && body.emailBlocks.length > 0
      ? renderCampaignEmailHtml({ html: renderBlocksToHtml(body.emailBlocks as EmailBlock[]), imageUrl: body.heroImageUrl })
      : renderCampaignEmailHtml({ body: text, imageUrl: body.heroImageUrl })

    const res = await sendTransactionalEmail({
      to: body.to,
      subject: `[TEST] ${subject}`,
      htmlBody: html,
      textBody: text,
    })

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
