import type { CanonicalKey, FormSchema } from './types'
import { schemaFields } from './types'

export interface UploadedFile {
  fieldKey: string
  url: string
  name: string
  size?: number
}

export interface ValidationIssue {
  key: string
  message: string
}

// Server-side validation of raw answers against a schema. Never trust the
// client — required/type/length are all re-checked here.
export function validateAnswers(
  schema: FormSchema,
  data: Record<string, unknown>,
  files: UploadedFile[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const fileKeys = new Set(files.map((f) => f.fieldKey))

  for (const f of schemaFields(schema)) {
    const raw = data[f.key]
    const isEmpty = raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)

    if (f.type === 'file') {
      if (f.required && !fileKeys.has(f.key)) issues.push({ key: f.key, message: `${f.label} is required` })
      continue
    }
    if (f.type === 'consent') {
      if (!raw) issues.push({ key: f.key, message: `${f.label} must be accepted` })
      continue
    }
    if (isEmpty) {
      if (f.required) issues.push({ key: f.key, message: `${f.label} is required` })
      continue
    }

    const val = String(raw)
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      issues.push({ key: f.key, message: `${f.label} must be a valid email` })
    }
    if (f.type === 'phone' && !/^[6-9]\d{9}$/.test(val.replace(/\D/g, '').slice(-10))) {
      issues.push({ key: f.key, message: `${f.label} must be a valid 10-digit mobile` })
    }
    if (f.type === 'numeric' && Number.isNaN(Number(val))) {
      issues.push({ key: f.key, message: `${f.label} must be a number` })
    }
    if (f.validation?.maxLength && val.length > f.validation.maxLength) {
      issues.push({ key: f.key, message: `${f.label} is too long` })
    }
    if (f.type === 'picklist' && f.options?.length && !f.options.includes(val)) {
      issues.push({ key: f.key, message: `${f.label} has an invalid choice` })
    }
  }
  return issues
}

/** Pull canonical (mapped) values out of raw answers, keyed by CanonicalKey. */
export function extractCanonical(
  schema: FormSchema,
  data: Record<string, unknown>,
): Partial<Record<CanonicalKey, unknown>> {
  const out: Partial<Record<CanonicalKey, unknown>> = {}
  for (const f of schemaFields(schema)) {
    if (!f.mapsTo) continue
    const raw = data[f.key]
    if (raw == null || raw === '') continue
    out[f.mapsTo] = raw
  }
  // Compose full name from first/last if a combined name wasn't provided.
  if (out['applicant.name'] == null && (out['applicant.firstName'] || out['applicant.lastName'])) {
    out['applicant.name'] = [out['applicant.firstName'], out['applicant.lastName']]
      .filter(Boolean)
      .join(' ')
  }
  return out
}

/** Map an instance's canonical prefill onto field keys for the public form. */
export function prefillToFieldValues(
  schema: FormSchema,
  prefill: Partial<Record<CanonicalKey, unknown>>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of schemaFields(schema)) {
    if (f.mapsTo && prefill[f.mapsTo] != null) out[f.key] = prefill[f.mapsTo]
  }
  return out
}
