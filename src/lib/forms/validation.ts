import { z } from 'zod'
import { CANONICAL_KEYS } from './types'

const fieldTypeEnum = z.enum([
  'text', 'textarea', 'numeric', 'email', 'phone', 'date',
  'picklist', 'related', 'file', 'consent', 'section',
])

const fieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1).max(200),
  type: fieldTypeEnum,
  required: z.boolean().optional(),
  placeholder: z.string().max(200).optional(),
  helpText: z.string().max(400).optional(),
  options: z.array(z.string()).optional(),
  relatedTo: z.enum(['course', 'counsellor', 'academicYear', 'grade']).optional(),
  mapsTo: z.enum(CANONICAL_KEYS).optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
  accept: z.array(z.string()).optional(),
  maxSizeMb: z.number().positive().max(50).optional(),
})

const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  fields: z.array(fieldSchema),
})

export const formSchemaSchema = z.object({
  sections: z.array(sectionSchema).min(1),
})

export const formSettingsSchema = z
  .object({
    consentText: z.string().max(2000).optional(),
    successMessage: z.string().max(1000).optional(),
    redirectUrl: z.string().url().max(500).optional(),
    submitLabel: z.string().max(60).optional(),
    theme: z.object({ accent: z.string().max(20).optional() }).optional(),
  })
  .optional()

export const createFormSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  purpose: z.enum(['ADMISSION', 'LEAD', 'ENQUIRY', 'STANDALONE']),
  schema: formSchemaSchema,
  settings: formSettingsSchema,
  courseIds: z.array(z.string()).optional(),
  gradeLabels: z.array(z.string()).optional(),
  applicationFeeAmount: z.number().nonnegative().optional().nullable(),
  feeCurrency: z.string().length(3).optional(),
  feeRequired: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
})

export const updateFormSchema = createFormSchema.partial().extend({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  isDefault: z.boolean().optional(),
})

// A published form must capture a phone (mapped to contact.phone) — it's the
// identity/dedup key; without it submissions create useless phone-less records.
export function schemaHasContactPhone(schema: z.infer<typeof formSchemaSchema>): boolean {
  return schema.sections.some((s) => s.fields.some((f) => f.mapsTo === 'contact.phone'))
}

// Every field key in a schema must be unique — answers are keyed by it and
// collisions silently drop data.
export function assertUniqueFieldKeys(schema: z.infer<typeof formSchemaSchema>): void {
  const keys = schema.sections.flatMap((s) => s.fields.map((f) => f.key))
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i)
  if (dupes.length) {
    throw new z.ZodError([
      { code: 'custom', path: ['schema'], message: `Duplicate field keys: ${[...new Set(dupes)].join(', ')}` },
    ])
  }
}
