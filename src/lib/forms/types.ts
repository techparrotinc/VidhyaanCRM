// Digital-form engine — shared schema types (client + server safe, no deps).
//
// A Form's `schema` column is a FormSchema. Fields carry a CANONICAL `mapsTo`
// key (see CANONICAL_KEYS) — NEVER a raw DB column — which a target adapter
// (src/lib/forms/targets) resolves to whatever entity it owns. This is what
// lets one form feed a Lead, an Admission, a marketplace Enquiry, or a
// future entity without the engine knowing anything about them.

export type FieldType =
  | 'text'
  | 'textarea'
  | 'numeric'
  | 'email'
  | 'phone'
  | 'date'
  | 'picklist'
  | 'related' // lookup — Course / Counsellor / AcademicYear (resolved by `relatedTo`)
  | 'file'
  | 'consent'
  | 'section' // visual-only header, no value

export type RelatedTo = 'course' | 'counsellor' | 'academicYear' | 'grade'

/** Canonical field identities an adapter knows how to read/write. Anything
 *  not in this list is stored as a custom answer in `data` only. */
export const CANONICAL_KEYS = [
  'applicant.name',
  'applicant.firstName',
  'applicant.lastName',
  'applicant.dob',
  'applicant.gender',
  'parent.name',
  'contact.email',
  'contact.phone',
  'grade',
  'course',
  'academicYear',
  'counsellor',
  'source',
] as const

export type CanonicalKey = (typeof CANONICAL_KEYS)[number]

export interface FieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string // regex source
}

export interface FormField {
  key: string // stable unique id within the form; answer keyed by this
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: string[] // picklist
  relatedTo?: RelatedTo // for type 'related'
  /** canonical mapping — how the adapter lands this answer on its entity */
  mapsTo?: CanonicalKey
  validation?: FieldValidation
  /** file constraints (type 'file') */
  accept?: string[] // mime/ext
  maxSizeMb?: number
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
}

export interface FormSettings {
  consentText?: string
  successMessage?: string
  redirectUrl?: string
  submitLabel?: string
  theme?: { accent?: string }
}

export interface FormSchema {
  sections: FormSection[]
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
  textarea: 'Paragraph',
  numeric: 'Numeric',
  email: 'Email',
  phone: 'Phone',
  date: 'Date',
  picklist: 'Picklist',
  related: 'Related',
  file: 'File Upload',
  consent: 'Consent',
  section: 'Section Header',
}

/** Flatten a schema to its value-bearing fields (drops section headers). */
export function schemaFields(schema: FormSchema): FormField[] {
  return schema.sections.flatMap((s) => s.fields).filter((f) => f.type !== 'section')
}
