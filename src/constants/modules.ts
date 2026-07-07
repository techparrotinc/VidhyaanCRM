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
  AI_COPILOT: 'ai_copilot'
} as const

export type ModuleSlug = typeof MODULES[keyof typeof MODULES]
