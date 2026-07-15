// Human-readable automation triggers per canonical template. Shown on
// catalog cards so schools understand what adopting a template turns on.
// Keyed by msg91TemplateId (= Meta template name).

export const WA_TEMPLATE_TRIGGERS: Record<string, string> = {
  enquiry_received: 'Sends to the parent automatically when a new lead/enquiry is created',
  lead_acknowledgement: 'Available for campaigns (enquiry acknowledgement wording)',
  counsellor_introduction: 'Sends to the parent automatically when a counsellor is assigned to their enquiry',
  closure_message: 'Sends to the parent automatically when an enquiry is marked Not Interested / closed',
  followup_reminder_only_if_no_response__23_days:
    'Sends to the parent automatically after 3 days with no activity on their enquiry (once per enquiry)',
  admission_contacted: 'Sends to the parent automatically when their application moves to a "Contacted" stage',
  upload_documents: 'Sends to the parent automatically when their application reaches a documents-required stage',
  upload_documents_common: 'Used in campaigns with an attached digital form — each parent gets their unique upload link',
  admission_payment_required: 'Sends to the parent automatically when their application reaches a payment-required stage',
  admission_confirmation: 'Sends to the parent automatically when the admission is confirmed (won stage)',
  admission_rejected: 'Sends to the parent automatically when the application is rejected',
  holiday_announcement: 'Use in campaigns — fill in the holiday reason and reopening date at compose time',
  fee_invoice: 'Sends to the guardian automatically when a fee invoice is raised',
  fee_invoice_with_payment_link:
    'Sends to the guardian automatically when a fee invoice is raised — includes a tap-to-pay link (preferred over the plain version)',
  fee_due_reminder: 'Sends to the guardian automatically 3 days before an invoice is due',
  fee_overdue_notice: 'Sends to the guardian automatically 1 day after an invoice falls overdue',
  final_reminder: 'Sends to the guardian automatically 14 days after an invoice falls overdue',
  payment_confirmation: 'Sends to the guardian automatically when a fee payment is recorded',
  review_request: 'Sends to the parent automatically when an admission is confirmed, inviting a marketplace review',
  event_announcement: 'Used by Events → Announce when the WhatsApp channel is selected',
  lead_assigned: 'Staff alert — sends to the counsellor’s phone when a lead is assigned to them',
  sla_breach_alert: 'Staff alert — sends to the counsellor after 5 days with no activity on their assigned lead',
  new_admission_assigned: 'Staff alert — sends to the counsellor when an admission case is assigned to them',
  admission_sla_alert: 'Admin alert — sends to org admins when an application sits idle for 5 days',
  admin_fee_escalation: 'Admin alert — sends to org admins when an invoice stays unpaid 30 days past due',
  admin_fee_monthly_summary: 'Admin alert — monthly pending-fees summary sent to org admins on the 1st',
  class_reminder: 'Sends to enrolled guardians when staff tap "Send reminder" on a session — includes time and meeting link',
  class_cancelled: 'Sends to enrolled guardians automatically when a session is cancelled',
  class_rescheduled: 'Sends to enrolled guardians automatically when a session is rescheduled'
}

export const waTemplateTrigger = (msg91TemplateId: string): string | null =>
  WA_TEMPLATE_TRIGGERS[msg91TemplateId] ?? null

/**
 * Canonical variable mappings applied automatically when the admin syncs a
 * known template from Meta (instead of the var1..varN placeholder guess).
 */
export const WA_TEMPLATE_DEFAULT_VARIABLES: Record<string, string[]> = {
  review_request: ['parentName', 'kidName', 'schoolName', 'link'],
  event_announcement: ['parentName', 'schoolName', 'event', 'date', 'location'],
  class_reminder: ['parentName', 'kidName', 'batch', 'date', 'time', 'link', 'schoolName'],
  class_cancelled: ['parentName', 'kidName', 'batch', 'date', 'time', 'reason', 'schoolName'],
  class_rescheduled: ['parentName', 'kidName', 'batch', 'oldDate', 'date', 'time', 'schoolName']
}
