// Pure helpers for WhatsApp template variable binding. Approved Meta/DLT
// templates take positional parameters {{1}}..{{n}}; a template's
// `variables` array lists which Vidhyaan token fills each position, in
// order. Unit-tested in tests/template-params.test.ts.

/** Known token vocabulary offered in template builders. */
export const TEMPLATE_TOKENS = [
  'parentName',
  'kidName', // child / student / applicant name
  'schoolName', // org name — school, learning centre, coaching or college
  'grade', // grade/class/course/batch sought (institution-aware)
  'counsellorName',
  'adminName',
  'plan', // fee plan / invoice description
  'term', // billing term / period
  'date',
  'time',
  'amount',
  'days', // day counts (SLA / overdue)
  'count', // record counts (summaries)
  'reason', // free-form reason (holiday cause, rejection note)
  'resumeDate', // reopening date for holiday announcements
  'event', // event title
  'location', // event venue / meeting place
  'link' // per-recipient digital-form URL (campaign with an attached form)
] as const

export type TemplateVariableValues = Record<string, string>

/**
 * Builds the ordered positional parameter list for a template. Unknown
 * tokens resolve to '' (MSG91 rejects missing params, not empty ones).
 * Returns null when tokens is null/absent → caller uses legacy
 * single-blob mode.
 */
export function buildTemplateParameters(
  tokens: unknown,
  values: TemplateVariableValues
): string[] | null {
  if (!Array.isArray(tokens)) return null
  return tokens.map(token =>
    typeof token === 'string' ? (values[token] ?? '') : ''
  )
}

/**
 * Renders a human preview of a template body: replaces {{1}}..{{n}} with
 * the mapped token names (or values when provided). For UI only.
 */
export function previewTemplateBody(
  body: string,
  tokens: unknown,
  values?: TemplateVariableValues
): string {
  if (!Array.isArray(tokens)) return body
  return body.replace(/\{\{(\d+)\}\}/g, (match, num) => {
    const token = tokens[Number(num) - 1]
    if (typeof token !== 'string') return match
    return values?.[token] ?? `{{${token}}}`
  })
}
