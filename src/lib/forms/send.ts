import { prisma } from '@/lib/db/client'
import { sendMeteredSms } from '@/lib/credits/metered-send'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'
import { cleanPhoneNumber } from '@/lib/utils'
import type { FormPurpose, FormChannel } from '@prisma/client'
import { publicFormUrl, newFormToken } from './urls'
import { getAdapter } from './targets'
import { sendTemplateNotification } from '@/lib/whatsapp/notify'

/** Parent/child display names for the WhatsApp form message. */
async function resolveTargetNames(
  targetType: FormPurpose,
  targetId: string | null | undefined
): Promise<{ parentName: string | null; kidName: string | null }> {
  if (!targetId) return { parentName: null, kidName: null }
  try {
    if (targetType === 'LEAD') {
      const lead = await prisma.lead.findUnique({
        where: { id: targetId },
        select: { parentName: true, kidName: true }
      })
      return { parentName: lead?.parentName ?? null, kidName: lead?.kidName ?? null }
    }
    if (targetType === 'ADMISSION') {
      const adm = await prisma.admission.findUnique({
        where: { id: targetId },
        select: { parentName: true, applicantName: true }
      })
      return { parentName: adm?.parentName ?? null, kidName: adm?.applicantName ?? null }
    }
  } catch {
    // fall through to generic names
  }
  return { parentName: null, kidName: null }
}

interface SendArgs {
  db: any // tenant-scoped client (stamps orgId on create)
  orgId: string
  formId: string
  targetType: FormPurpose
  targetId?: string | null
  campaignId?: string | null
  channel: FormChannel
  email?: string | null
  phone?: string | null
  createdById?: string | null
  orgName?: string
}

// Mints a FormInstance (unique token) and delivers the link. EMAIL + SMS in
// P2; WhatsApp campaign delivery arrives with per-recipient tokens in P4.
export async function sendForm(args: SendArgs) {
  const { db, orgId, formId, targetType, targetId, campaignId, channel } = args

  // Whitelisted prefill from the target record (if any).
  let prefill: Record<string, unknown> = {}
  if (targetId) {
    try {
      prefill = await getAdapter(targetType).prefill(prisma, targetId)
    } catch (err) {
      console.error('Form prefill failed:', err)
    }
  }

  const token = newFormToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  const instance = await db.formInstance.create({
    data: {
      orgId,
      formId,
      targetType,
      targetId: targetId ?? null,
      campaignId: campaignId ?? null,
      token,
      channel,
      sentToEmail: args.email ?? null,
      sentToPhone: args.phone ?? null,
      prefill: prefill as any,
      expiresAt,
      createdById: args.createdById ?? null,
    },
  })

  const url = publicFormUrl(token)
  const orgName = args.orgName || 'the school'

  // If delivery fails, drop the instance so no orphan token lingers.
  try {
    if (channel === 'EMAIL') {
      if (!args.email) throw new Error('No email address on file for this record')
      await sendTransactionalEmail({
        to: args.email,
        subject: `Complete your application — ${orgName}`,
        htmlBody: `<p>Hello,</p><p>${orgName} has requested you complete an application form.</p>
          <p><a href="${url}" style="background:#1565D8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Open Application Form</a></p>
          <p>Or paste this link in your browser:<br>${url}</p>`,
        textBody: `${orgName} has requested you complete an application form: ${url}`,
      })
    } else if (channel === 'SMS') {
      if (!args.phone) throw new Error('No phone number on file for this record')
      await sendMeteredSms(
        orgId,
        cleanPhoneNumber(args.phone) as string,
        `${orgName}: please complete your application form: ${url}`,
        `form_instance:${instance.id}`,
      )
    } else if (channel === 'WHATSAPP') {
      if (!args.phone) throw new Error('No phone number on file for this record')
      // Rides on the upload_documents_common template (parent, child, link) —
      // the org must have adopted it from the catalog.
      const target = await resolveTargetNames(targetType, targetId)
      const delivered = await sendTemplateNotification({
        orgId,
        template: 'upload_documents_common',
        phone: cleanPhoneNumber(args.phone) as string,
        values: {
          parentName: target.parentName || 'Parent',
          kidName: target.kidName || 'your child',
          link: url
        },
        ref: `form_instance:${instance.id}`
      })
      if (!delivered) {
        throw new Error(
          'WhatsApp form sends need the "upload documents" template — add it from the catalog in Settings → WhatsApp Templates.'
        )
      }
    } else {
      throw new Error(`Channel ${channel} is not supported for single sends yet`)
    }
  } catch (err) {
    await db.formInstance.delete({ where: { id: instance.id } }).catch(() => {})
    throw err
  }

  return { instanceId: instance.id, url }
}

// Mint a per-recipient form link for a campaign send. Leads target their own
// record (prefill + update); everyone else lands as STANDALONE (mints a Lead
// on submit). campaignId is stamped so submissions feed the campaign funnel.
export async function mintCampaignInstance(
  db: any,
  args: {
    orgId: string
    formId: string
    campaignId: string
    channel: FormChannel
    recipientType: string
    recipientId: string | null
    email?: string | null
    phone?: string | null
  },
): Promise<string> {
  const isLead = args.recipientType === 'LEAD'
  const token = newFormToken()
  const instance = await db.formInstance.create({
    data: {
      orgId: args.orgId,
      formId: args.formId,
      targetType: isLead ? 'LEAD' : 'STANDALONE',
      targetId: isLead ? args.recipientId : null,
      campaignId: args.campaignId,
      token,
      channel: args.channel,
      sentToEmail: args.email ?? null,
      sentToPhone: args.phone ?? null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    select: { id: true },
  })
  void instance
  return publicFormUrl(token)
}

/** Resolve which form to auto-send: the default for this target type, else
 *  any default published form, else the most recent published form. Purpose
 *  is a preference, not a hard filter — the target record decides the adapter. */
export async function resolveDefaultForm(
  db: any,
  orgId: string,
  targetType: FormPurpose,
): Promise<{ id: string } | null> {
  return (
    (await db.form.findFirst({
      where: { orgId, purpose: targetType, status: 'PUBLISHED', isDefault: true, deletedAt: null },
      select: { id: true },
    })) ??
    (await db.form.findFirst({
      where: { orgId, status: 'PUBLISHED', isDefault: true, deletedAt: null },
      select: { id: true },
    })) ??
    (await db.form.findFirst({
      where: { orgId, purpose: targetType, status: 'PUBLISHED', deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    })) ??
    (await db.form.findFirst({
      where: { orgId, status: 'PUBLISHED', deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    }))
  )
}
