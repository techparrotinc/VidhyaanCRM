// Categories for WhatsApp templates — shared by the platform catalog
// (SharedWhatsappTemplate) and org templates (WhatsappTemplate). Stored as
// plain strings (not a Prisma enum) so adding a category is a code change,
// not a migration.

export const WA_TEMPLATE_CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'FEE_REMINDER', label: 'Fee Reminders' },
  { value: 'ATTENDANCE', label: 'Attendance' },
  { value: 'HOMEWORK', label: 'Homework' },
  { value: 'HOLIDAY', label: 'Holidays' },
  { value: 'EXAM', label: 'Exams' },
  { value: 'EVENT', label: 'Events' },
  { value: 'ADMISSION', label: 'Admissions' }
] as const

export type WaTemplateCategory = (typeof WA_TEMPLATE_CATEGORIES)[number]['value']

export const WA_CATEGORY_VALUES = WA_TEMPLATE_CATEGORIES.map(c => c.value) as [
  WaTemplateCategory,
  ...WaTemplateCategory[]
]

export const waCategoryLabel = (value: string | null | undefined): string =>
  WA_TEMPLATE_CATEGORIES.find(c => c.value === value)?.label ?? 'General'

// Keyword heuristic used by the sync imports so templates land in a sensible
// bucket without manual triage; admins can recategorize afterwards.
const KEYWORDS: Array<[WaTemplateCategory, RegExp]> = [
  ['FEE_REMINDER', /\bfee|due|payment|invoice|paid|balance\b/i],
  ['ATTENDANCE', /\babsent|attendance|present|late\b/i],
  ['HOMEWORK', /\bhomework|assignment|classwork\b/i],
  ['HOLIDAY', /\bholiday|vacation|leave|closed\b/i],
  ['EXAM', /\bexam|test|result|marks|grade\b/i],
  ['EVENT', /\bevent|annual day|sports|celebration|function|meeting|ptm\b/i],
  ['ADMISSION', /\badmission|enquiry|enrol|application\b/i]
]

export function guessWaTemplateCategory(name: string, body?: string): WaTemplateCategory {
  // The name states intent; the body often mentions incidental words from
  // other buckets (a holiday notice citing fee due dates) — so match name first.
  for (const [category, pattern] of KEYWORDS) {
    if (pattern.test(name)) return category
  }
  if (body) {
    for (const [category, pattern] of KEYWORDS) {
      if (pattern.test(body)) return category
    }
  }
  return 'GENERAL'
}
