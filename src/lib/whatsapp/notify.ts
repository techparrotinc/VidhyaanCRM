// Central emitter for workflow-triggered WhatsApp notifications (lead,
// admission and fee lifecycle). One rule everywhere: the org adopting the
// template from the catalog IS the on/off switch — no template, no send.
// Always call fire-and-forget; a notification must never fail the workflow
// that triggered it.

import { prisma } from '@/lib/db/client'
import { sendMeteredWhatsApp } from '@/lib/credits/metered-send'
import { buildTemplateParameters, type TemplateVariableValues } from '@/lib/campaign/templateParams'
import { enabledModuleSlugs } from '@/lib/forms/modules'
import { MODULES } from '@/constants/modules'
import { cleanPhoneNumber } from '@/lib/utils'

export interface TemplateNotificationArgs {
  orgId: string
  /** Approved template name (msg91TemplateId — same identifier on Meta). */
  template: string
  phone: string | null | undefined
  values: TemplateVariableValues
  /** Credit-ledger reference, e.g. "fee_due:<invoiceId>". */
  ref: string
}

/**
 * Sends one workflow notification. Returns true when a message went out;
 * false when skipped (add-on off, template not adopted, no phone).
 * Throws only on an actual send failure — callers decide whether to log.
 */
export async function sendTemplateNotification(
  args: TemplateNotificationArgs
): Promise<boolean> {
  const phone = cleanPhoneNumber(args.phone ?? '') as string
  if (!phone || phone.length < 10) return false

  const modules = await enabledModuleSlugs(args.orgId)
  if (!modules.has(MODULES.WHATSAPP_ADDON)) return false

  const template = await prisma.whatsappTemplate.findFirst({
    where: {
      orgId: args.orgId,
      msg91TemplateId: args.template,
      status: { in: ['VERIFIED', 'SYNCED'] },
      deletedAt: null
    },
    orderBy: { createdAt: 'desc' }
  })
  if (!template) return false

  const parameters = buildTemplateParameters(template.variables, args.values)

  await sendMeteredWhatsApp(
    args.orgId,
    phone,
    template.msg91TemplateId,
    '', // structured params path — legacy blob unused
    args.ref,
    { language: template.language, parameters: parameters ?? undefined }
  )
  return true
}

/** Fire-and-forget wrapper: logs failures, never throws. */
export function notifyWhatsApp(args: TemplateNotificationArgs): void {
  sendTemplateNotification(args).catch(err =>
    console.error(`WhatsApp notify failed (${args.template}, ${args.ref}):`, err?.message ?? err)
  )
}

/** Org display name for the schoolName token (works for every org type). */
export async function orgDisplayName(orgId: string): Promise<string> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true }
  })
  return org?.name || 'our institution'
}

/** Institution-aware grade/course/batch value. */
export function gradeValue(rec: {
  gradeSought?: string | null
  course?: string | null
  batch?: string | null
}): string {
  return rec.gradeSought || rec.course || rec.batch || 'admission'
}
