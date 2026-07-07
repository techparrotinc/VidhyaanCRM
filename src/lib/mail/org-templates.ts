import { prisma } from '@/lib/db/client'
import { sendTransactionalEmail } from '@/lib/integrations/zeptomail'

/**
 * Org-customizable email templates. Each entry ships a code default;
 * an OrgEmailTemplate row overrides subject/body for that org.
 * Bodies are plain text with {{variables}} and blank-line paragraphs —
 * rendered into the branded shell at send time, so admins can't break
 * the layout. Platform emails (OTP, welcome, billing) are not listed
 * here and stay locked.
 */

export const ORG_EMAIL_TEMPLATE_KEYS = [
  'FEE_INVOICE',
  'EVENT_INVITE',
  'EVENT_CANCELLED',
  'ENQUIRY_CONFIRMATION',
  'LEAD_ACKNOWLEDGEMENT',
  'INTERVIEW_SCHEDULED',
  'ADMISSION_CONFIRMED',
  'WELCOME_STUDENT'
] as const

export type OrgEmailTemplateKey = (typeof ORG_EMAIL_TEMPLATE_KEYS)[number]

type TemplateDef = {
  key: OrgEmailTemplateKey
  label: string
  description: string
  variables: { name: string; hint: string }[]
  defaultSubject: string
  defaultBody: string
}

export const ORG_EMAIL_TEMPLATES: TemplateDef[] = [
  {
    key: 'FEE_INVOICE',
    label: 'Fee Invoice',
    description: 'Sent to the guardian when you email an invoice from Fee Management.',
    variables: [
      { name: 'parentName', hint: 'Guardian name' },
      { name: 'studentName', hint: 'Student name' },
      { name: 'invoiceNumber', hint: 'e.g. INV-2026-00012' },
      { name: 'amount', hint: 'Total amount, e.g. ₹12,000' },
      { name: 'dueDate', hint: 'Due date' },
      { name: 'schoolName', hint: 'Your school name' },
      { name: 'paymentLink', hint: 'Online payment link' }
    ],
    defaultSubject: 'Fee invoice {{invoiceNumber}} — {{schoolName}}',
    defaultBody:
      `Dear {{parentName}},\n\nPlease find the fee invoice for {{studentName}}.\n\nInvoice: {{invoiceNumber}}\nAmount: {{amount}}\nDue date: {{dueDate}}\n\nYou can pay online here: {{paymentLink}}\n\nIf you have already paid, kindly ignore this email.\n\nWarm regards,\n{{schoolName}}`
  },
  {
    key: 'EVENT_INVITE',
    label: 'Event Announcement',
    description: 'Sent when you announce a published event to parents or leads.',
    variables: [
      { name: 'recipientName', hint: 'Parent / lead name' },
      { name: 'eventTitle', hint: 'Event title' },
      { name: 'eventDate', hint: 'Date & time' },
      { name: 'eventLocation', hint: 'Venue or meeting link' },
      { name: 'schoolName', hint: 'Your school name' }
    ],
    defaultSubject: '{{eventTitle}} — {{schoolName}}',
    defaultBody:
      `Dear {{recipientName}},\n\nYou're invited: {{eventTitle}}\n\nWhen: {{eventDate}}\nWhere: {{eventLocation}}\n\nWe look forward to seeing you there. You can RSVP from the parent portal.\n\nWarm regards,\n{{schoolName}}`
  },
  {
    key: 'EVENT_CANCELLED',
    label: 'Event Cancellation',
    description: 'Sent to attendees who RSVP’d when a published event is cancelled.',
    variables: [
      { name: 'recipientName', hint: 'Attendee name' },
      { name: 'eventTitle', hint: 'Event title' },
      { name: 'eventDate', hint: 'Original date & time' },
      { name: 'schoolName', hint: 'Your school name' }
    ],
    defaultSubject: 'Cancelled: {{eventTitle}} — {{schoolName}}',
    defaultBody:
      `Dear {{recipientName}},\n\nWe're sorry — {{eventTitle}} scheduled for {{eventDate}} has been cancelled.\n\nWe apologise for any inconvenience. We'll keep you posted about future events.\n\nWarm regards,\n{{schoolName}}`
  },
  {
    key: 'ENQUIRY_CONFIRMATION',
    label: 'Enquiry Confirmation',
    description: 'Auto-reply to a parent right after they submit an admission enquiry on your listing.',
    variables: [
      { name: 'parentName', hint: 'Parent name' },
      { name: 'childName', hint: 'Child name (may be empty)' },
      { name: 'schoolName', hint: 'Your school name' }
    ],
    defaultSubject: 'We received your enquiry — {{schoolName}}',
    defaultBody:
      `Dear {{parentName}},\n\nThank you for your interest in {{schoolName}}. We have received your admission enquiry and our admissions team will contact you shortly.\n\nWarm regards,\nAdmissions Team, {{schoolName}}`
  },
  {
    key: 'LEAD_ACKNOWLEDGEMENT',
    label: 'Lead Acknowledgement',
    description: 'Auto-reply when your team records a new enquiry with an email address.',
    variables: [
      { name: 'parentName', hint: 'Parent name' },
      { name: 'childName', hint: 'Child name (may be empty)' },
      { name: 'schoolName', hint: 'Your school name' }
    ],
    defaultSubject: 'Thank you for your enquiry — {{schoolName}}',
    defaultBody:
      `Dear {{parentName}},\n\nThank you for enquiring about admissions at {{schoolName}}. Our team has recorded your details and will reach out shortly with the next steps.\n\nWarm regards,\nAdmissions Team, {{schoolName}}`
  },
  {
    key: 'INTERVIEW_SCHEDULED',
    label: 'Interview / Interaction Scheduled',
    description: 'Sent to the applicant’s parent when an admission moves to an interview stage.',
    variables: [
      { name: 'parentName', hint: 'Parent name' },
      { name: 'applicantName', hint: 'Applicant name' },
      { name: 'stageName', hint: 'Stage name, e.g. Interview Scheduled' },
      { name: 'schoolName', hint: 'Your school name' }
    ],
    defaultSubject: 'Next step for {{applicantName}} — {{schoolName}}',
    defaultBody:
      `Dear {{parentName}},\n\nGood news — {{applicantName}}'s application has moved to "{{stageName}}".\n\nOur admissions team will contact you to confirm the date and time. Please keep the required documents handy.\n\nWarm regards,\nAdmissions Team, {{schoolName}}`
  },
  {
    key: 'ADMISSION_CONFIRMED',
    label: 'Admission Confirmed',
    description: 'Sent to the parent when an applicant is marked as admitted.',
    variables: [
      { name: 'parentName', hint: 'Parent name' },
      { name: 'applicantName', hint: 'Applicant name' },
      { name: 'gradeSought', hint: 'Class applied for' },
      { name: 'schoolName', hint: 'Your school name' }
    ],
    defaultSubject: 'Congratulations! {{applicantName}} is admitted — {{schoolName}}',
    defaultBody:
      `Dear {{parentName}},\n\nCongratulations! We are delighted to confirm the admission of {{applicantName}} to {{gradeSought}} at {{schoolName}}.\n\nOur team will contact you regarding fee payment and the remaining formalities.\n\nWe look forward to welcoming your family.\n\nWarm regards,\nAdmissions Team, {{schoolName}}`
  },
  {
    key: 'WELCOME_STUDENT',
    label: 'Student Welcome',
    description: 'Sent to the guardian when the admitted applicant becomes an enrolled student.',
    variables: [
      { name: 'parentName', hint: 'Guardian name' },
      { name: 'studentName', hint: 'Student name' },
      { name: 'studentCode', hint: 'e.g. STU-2026-00012' },
      { name: 'gradeLabel', hint: 'Class enrolled in' },
      { name: 'schoolName', hint: 'Your school name' },
      { name: 'portalLink', hint: 'Parent portal link' }
    ],
    defaultSubject: 'Welcome to {{schoolName}}, {{studentName}}!',
    defaultBody:
      `Dear {{parentName}},\n\nWelcome to the {{schoolName}} family! {{studentName}} is now enrolled in {{gradeLabel}}.\n\nStudent ID: {{studentCode}}\n\nYou can track fees, invoices and school events on the parent portal: {{portalLink}}\n\nWarm regards,\n{{schoolName}}`
  }
]

const registry = new Map(ORG_EMAIL_TEMPLATES.map((t) => [t.key, t]))

export function replaceVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, name) => vars[name] ?? '')
}

/** Branded HTML shell around a plain-text body (paragraphs + line breaks). */
export function renderEmailHtml(bodyText: string, opts?: { imageUrl?: string | null }): string {
  const escaped = bodyText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // Bare URLs become links
  const linked = escaped.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" style="color:#1565D8;text-decoration:none;">$1</a>'
  )
  const hero = opts?.imageUrl
    ? `<img src="${opts.imageUrl}" alt="" style="width:100%;max-width:560px;border-radius:12px;display:block;margin-bottom:16px;" />`
    : ''
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #334155; line-height: 1.6;">
    ${hero}${linked.replace(/\n/g, '<br/>')}
  </div>`
}

/**
 * Effective subject+body for an org: DB override if present, else the
 * code default. Variables replaced in both.
 */
export async function resolveOrgEmail(
  orgId: string,
  key: OrgEmailTemplateKey,
  vars: Record<string, string>
): Promise<{ subject: string; bodyText: string; html: string }> {
  const def = registry.get(key)
  if (!def) throw new Error(`Unknown org email template: ${key}`)

  const override = await prisma.orgEmailTemplate.findUnique({
    where: { orgId_key: { orgId, key } }
  })

  const subject = replaceVars(override?.subject ?? def.defaultSubject, vars)
  const bodyText = replaceVars(override?.body ?? def.defaultBody, vars)
  return { subject, bodyText, html: renderEmailHtml(bodyText) }
}

/**
 * Fire-and-forget send using the org's (possibly customized) template.
 * Never throws — an email failure must not fail the CRM action. Callers
 * invoke without await.
 */
export async function sendOrgTemplateEmail(
  orgId: string,
  key: OrgEmailTemplateKey,
  to: string | null | undefined,
  vars: Record<string, string>
): Promise<void> {
  try {
    if (!to || !to.includes('@')) return
    if (!process.env.ZEPTOMAIL_API_TOKEN) return
    const { subject, bodyText, html } = await resolveOrgEmail(orgId, key, vars)
    await sendTransactionalEmail({ to, subject, htmlBody: html, textBody: bodyText })
  } catch (err) {
    console.error(`Org template email failed (${key} → ${to}):`, err)
  }
}
