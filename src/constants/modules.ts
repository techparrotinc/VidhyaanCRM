export const MODULES = {
  LEAD_MANAGEMENT: 'lead_management',
  ADMISSION_MANAGEMENT: 'admission_management',
  STUDENT_MANAGEMENT: 'student_management',
  FEE_MANAGEMENT: 'fee_management',
  CAMPAIGN_MANAGEMENT: 'campaign_management',
  EVENT_MANAGEMENT: 'event_management',
  ADVANCED_REPORTS: 'advanced_reports',
  PAYMENT_GATEWAY: 'payment_gateway',
  WHATSAPP_SMS: 'whatsapp_sms_notifications',
  FORMS_REQUESTS: 'forms_requests',
  ADMISSION_WORKFLOW: 'admission_workflow',
  STUDENT_LIFECYCLE: 'student_lifecycle',
  API_ACCESS: 'api_access',
  CUSTOM_DOMAIN: 'custom_domain',
  WHATSAPP_ADDON: 'whatsapp_addon',
  SMS_ADDON: 'sms_addon',
  AI_COPILOT: 'ai_copilot',
  ATTENDANCE: 'attendance',
  COURSE_SCHEDULE: 'course_schedule'
} as const

export type ModuleSlug = typeof MODULES[keyof typeof MODULES]

// The full Enterprise-tier module set — granted to new orgs' 7-day trial,
// and used as a fallback anywhere the `enterprise` Plan row can't be found.
// WHATSAPP_ADDON/SMS_ADDON are excluded: those are metered credit add-ons
// purchased separately, not part of any plan's module grant.
// admission_management is school-only — callers filter it out for LC orgs.
export const ENTERPRISE_MODULE_SLUGS: ModuleSlug[] = [
  MODULES.LEAD_MANAGEMENT,
  MODULES.ADMISSION_MANAGEMENT,
  MODULES.STUDENT_MANAGEMENT,
  MODULES.FEE_MANAGEMENT,
  MODULES.CAMPAIGN_MANAGEMENT,
  MODULES.EVENT_MANAGEMENT,
  MODULES.ADVANCED_REPORTS,
  MODULES.PAYMENT_GATEWAY,
  MODULES.WHATSAPP_SMS,
  MODULES.FORMS_REQUESTS,
  MODULES.ADMISSION_WORKFLOW,
  MODULES.STUDENT_LIFECYCLE,
  MODULES.API_ACCESS,
  MODULES.CUSTOM_DOMAIN,
  MODULES.AI_COPILOT,
  MODULES.ATTENDANCE,
  MODULES.COURSE_SCHEDULE
]
