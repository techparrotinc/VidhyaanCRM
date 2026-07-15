// Scenario-level WhatsApp emitters — one function per workflow trigger.
// All fire-and-forget via notifyWhatsApp; template adoption per org is the
// on/off switch (see notify.ts). Values use the shared token vocabulary in
// src/lib/campaign/templateParams.ts.

import { format } from 'date-fns'
import { prisma } from '@/lib/db/client'
import { sendPush } from '@/lib/push/send'
import { notifyWhatsApp, sendTemplateNotification, staffWhatsAppAllowed, orgDisplayName, gradeValue } from './notify'

/** Mobile push piggybacks on the guardian's WhatsApp phone — same fire-and-forget rule. */
async function pushToGuardian(phone: string | null | undefined, payload: Parameters<typeof sendPush>[1]): Promise<void> {
  if (!phone) return
  const parent = await prisma.parent.findUnique({ where: { phone }, select: { userId: true } }).catch(() => null)
  if (parent?.userId) void sendPush([parent.userId], payload)
}

export function formatInr(amount: unknown): string {
  const n = Number(amount)
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : '-'
}

/** "Tuition Fee" or "Tuition Fee +2 more" from invoice line items. */
export function invoiceItemsLabel(items: Array<{ head: string }>): string {
  if (!items.length) return 'Fees'
  return items.length === 1 ? items[0].head : `${items[0].head} +${items.length - 1} more`
}

interface LeadLike {
  id: string
  parentName: string
  phone: string
  kidName?: string | null
  gradeSought?: string | null
  course?: string | null
  batch?: string | null
}

interface CounsellorLike {
  id?: string | null
  name: string
  phone?: string | null
}

/**
 * Lead assigned → parent gets a counsellor introduction; counsellor gets a
 * work alert. `skipParentIntro` suppresses the introduction when the lead
 * was assigned at creation — the parent just received the enquiry
 * acknowledgement seconds earlier, and two instant messages read as spam.
 */
export async function onLeadAssigned(
  orgId: string,
  lead: LeadLike,
  counsellor: CounsellorLike,
  opts?: { skipParentIntro?: boolean }
): Promise<void> {
  const schoolName = await orgDisplayName(orgId)
  const grade = gradeValue(lead)

  if (!opts?.skipParentIntro) {
    notifyWhatsApp({
      orgId,
      template: 'counsellor_introduction',
      phone: lead.phone,
      values: { parentName: lead.parentName, counsellorName: counsellor.name, schoolName, grade },
      ref: `lead_assigned_intro:${lead.id}`
    })
  }

  if (await staffWhatsAppAllowed(counsellor.id, 'LEAD_RECEIVED')) {
    notifyWhatsApp({
      orgId,
      template: 'lead_assigned',
      phone: counsellor.phone,
      values: {
        counsellorName: counsellor.name,
        parentName: lead.parentName,
        kidName: lead.kidName || '-',
        grade
      },
      ref: `lead_assigned_staff:${lead.id}`
    })
  }

  // Staff in-app/push alert — separate channel from the WhatsApp opt-in
  // above (mobile-app-plan §4.4: push events are role-routed, not gated by
  // the WhatsApp preference toggle).
  if (counsellor.id) {
    void sendPush([counsellor.id], {
      title: 'New lead assigned',
      body: `${lead.parentName}${lead.kidName ? ` (${lead.kidName})` : ''} — ${grade}`,
      data: { url: '/(org)/leads' }
    })
  }
}

/** Lead marked not interested / closed → polite closure to the parent. */
export async function onLeadClosed(orgId: string, lead: LeadLike): Promise<void> {
  const schoolName = await orgDisplayName(orgId)
  notifyWhatsApp({
    orgId,
    template: 'closure_message',
    phone: lead.phone,
    values: { parentName: lead.parentName, schoolName },
    ref: `lead_closed:${lead.id}`
  })
}

interface AdmissionLike {
  id: string
  applicantName: string
  parentName?: string | null
  phone?: string | null
  gradeSought?: string | null
}

interface StageLike {
  name: string
  isWon: boolean
  isLost: boolean
  requiresDocs: boolean
  requiresPayment: boolean
}

/**
 * Admission moved to a new stage → parent notification matched on the
 * stage's semantic flags first, then name heuristics. Org-renamed stages
 * keep working as long as the flags are set.
 */
export async function onAdmissionStageChange(
  orgId: string,
  admission: AdmissionLike,
  stage: StageLike,
  counsellorName?: string | null
): Promise<void> {
  const schoolName = await orgDisplayName(orgId)
  const parentName = admission.parentName || 'Parent'
  const kidName = admission.applicantName || 'your child'
  const grade = gradeValue({ gradeSought: admission.gradeSought })

  let template: string | null = null
  let values: Record<string, string> = {}

  if (stage.isWon) {
    template = 'admission_confirmation'
    values = { parentName, kidName, schoolName, grade }
  } else if (stage.isLost) {
    template = 'admission_rejected'
    values = { parentName, schoolName, kidName }
  } else if (stage.requiresDocs) {
    template = 'upload_documents'
    values = { parentName, kidName, grade }
  } else if (stage.requiresPayment) {
    template = 'admission_payment_required'
    values = { parentName, kidName, grade }
  } else if (/contact/i.test(stage.name)) {
    template = 'admission_contacted'
    values = {
      parentName,
      counsellorName: counsellorName || 'the admission team',
      schoolName,
      kidName,
      grade
    }
  }
  // interview_scheduled intentionally not auto-wired: admissions carry no
  // interview date/time field yet — see work log.

  if (!template) return
  notifyWhatsApp({
    orgId,
    template,
    phone: admission.phone,
    values,
    ref: `admission_stage:${admission.id}:${template}`
  })
}

/** Admission assigned to a counsellor → staff work alert. */
export async function onAdmissionAssigned(
  orgId: string,
  admission: AdmissionLike,
  counsellor: CounsellorLike
): Promise<void> {
  if (!(await staffWhatsAppAllowed(counsellor.id, 'ADMISSION_STAGE_CHANGED'))) return
  notifyWhatsApp({
    orgId,
    template: 'new_admission_assigned',
    phone: counsellor.phone,
    values: {
      counsellorName: counsellor.name,
      kidName: admission.applicantName || '-',
      grade: gradeValue({ gradeSought: admission.gradeSought })
    },
    ref: `admission_assigned:${admission.id}`
  })
}

interface InvoiceNotifyArgs {
  orgId: string
  invoiceId: string
  guardianName?: string | null
  guardianPhone?: string | null
  /** fee plan / line-item description */
  plan: string
  amount: string
  dueDate?: Date | null
}

/**
 * Invoice created → fee details to the guardian. Prefers the payment-link
 * variant (deep link into the parent portal checkout — payments reconcile
 * through the existing gateway webhook) when the org adopted it; falls back
 * to the plain fee_invoice template.
 */
export async function onInvoiceCreated(args: InvoiceNotifyArgs): Promise<void> {
  const schoolName = await orgDisplayName(args.orgId)
  const values = {
    parentName: args.guardianName || 'Parent',
    plan: args.plan,
    amount: args.amount,
    date: args.dueDate ? format(args.dueDate, 'd MMM yyyy') : '-',
    schoolName,
    link: `${process.env.NEXTAUTH_URL || 'https://vidhyaan.com'}/parent/fees?invoice=${args.invoiceId}`
  }

  const withLink = await sendTemplateNotification({
    orgId: args.orgId,
    template: 'fee_invoice_with_payment_link',
    phone: args.guardianPhone,
    values,
    ref: `fee_invoice:${args.invoiceId}`
  }).catch(() => false)

  if (!withLink) {
    notifyWhatsApp({
      orgId: args.orgId,
      template: 'fee_invoice',
      phone: args.guardianPhone,
      values,
      ref: `fee_invoice:${args.invoiceId}`
    })
  }

  void pushToGuardian(args.guardianPhone, {
    title: 'New fee due',
    body: `${values.plan} · ${values.amount}${args.dueDate ? ` due ${values.date}` : ''} at ${schoolName}.`,
    data: { url: '/(parent)/fees', invoiceId: args.invoiceId }
  })
}

/** Batch invoice run → per-guardian fee notifications for active invoices. */
export async function notifyBatchInvoices(orgId: string, invoiceIds: string[]): Promise<void> {
  const invoices = await prisma.invoice.findMany({
    where: { id: { in: invoiceIds }, orgId, status: 'UNPAID', deletedAt: null },
    include: {
      student: { select: { guardianName: true, guardianPhone: true } },
      items: { select: { head: true } }
    }
  })
  for (const inv of invoices) {
    await onInvoiceCreated({
      orgId,
      invoiceId: inv.id,
      guardianName: inv.student?.guardianName,
      guardianPhone: inv.student?.guardianPhone,
      plan: invoiceItemsLabel(inv.items),
      amount: formatInr(inv.totalAmount),
      dueDate: inv.dueDate
    }).catch(() => {})
  }
}

/** Payment recorded → confirmation to the guardian. */
/** Org staff who should hear about money moving — same role set as the fees tab. */
async function financeStaffIds(orgId: string): Promise<string[]> {
  const staff = await prisma.user.findMany({
    where: {
      orgId,
      deletedAt: null,
      status: 'ACTIVE',
      roleAssignments: { some: { role: { in: ['ORG_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'] }, status: 'ACTIVE' } }
    },
    select: { id: true },
    take: 20
  })
  return staff.map((s) => s.id)
}

export async function onPaymentRecorded(args: {
  orgId: string
  paymentId: string
  guardianName?: string | null
  guardianPhone?: string | null
  studentName?: string | null
  plan: string
}): Promise<void> {
  const schoolName = await orgDisplayName(args.orgId)
  notifyWhatsApp({
    orgId: args.orgId,
    template: 'payment_confirmation',
    phone: args.guardianPhone,
    values: {
      parentName: args.guardianName || 'Parent',
      plan: args.plan,
      schoolName
    },
    ref: `payment_confirmation:${args.paymentId}`
  })

  void pushToGuardian(args.guardianPhone, {
    title: 'Payment received',
    body: `${args.plan} · payment confirmed at ${schoolName}.`,
    data: { url: '/(parent)/fees' }
  })

  void financeStaffIds(args.orgId).then((ids) => {
    if (ids.length === 0) return
    void sendPush(ids, {
      title: 'Payment received',
      body: `${args.studentName ?? 'A student'} · ${args.plan}`,
      data: { url: '/(org)/fees' }
    })
  })
}
