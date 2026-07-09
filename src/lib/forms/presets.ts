// Institution-aware starter schemas + a field library for the builder. This
// is the ONLY place vertical differences live (besides adapters + the label
// helper): schools get grade/section language, learning centres get
// course/batch. New verticals extend here.

import { isLearningCentre } from '@/lib/institution'
import type { FormField, FormSchema } from './types'

let seq = 0
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${(seq++).toString(36)}`

function field(f: Omit<FormField, 'key'> & { key?: string }): FormField {
  return { key: f.key ?? uid('f'), ...f }
}

/** Addable field templates the builder palette offers, grouped. Canonical
 *  (`mapsTo`) fields land on the target entity; the rest are custom. */
export function fieldLibrary(institutionType?: string | null): {
  group: string
  fields: FormField[]
}[] {
  const lc = isLearningCentre(institutionType)
  const gradeLabel = lc ? 'Course / Batch' : 'Grade / Class'

  return [
    {
      group: 'Applicant',
      fields: [
        field({ label: 'First Name', type: 'text', required: true, mapsTo: 'applicant.firstName' }),
        field({ label: 'Last Name', type: 'text', mapsTo: 'applicant.lastName' }),
        field({ label: 'Full Name', type: 'text', mapsTo: 'applicant.name' }),
        field({ label: 'Date of Birth', type: 'date', mapsTo: 'applicant.dob' }),
        field({ label: 'Gender', type: 'picklist', options: ['Male', 'Female', 'Other'], mapsTo: 'applicant.gender' }),
      ],
    },
    {
      group: 'Contact',
      fields: [
        field({ label: 'Parent / Guardian Name', type: 'text', mapsTo: 'parent.name' }),
        field({ label: 'Email', type: 'email', mapsTo: 'contact.email' }),
        field({ label: 'Phone Number', type: 'phone', required: true, mapsTo: 'contact.phone' }),
      ],
    },
    {
      group: 'Academic',
      fields: [
        field({ label: gradeLabel, type: lc ? 'related' : 'text', relatedTo: lc ? 'course' : undefined, mapsTo: lc ? 'course' : 'grade' }),
        field({ label: 'Academic Year', type: 'related', relatedTo: 'academicYear', mapsTo: 'academicYear' }),
        field({ label: 'Counsellor', type: 'related', relatedTo: 'counsellor', mapsTo: 'counsellor' }),
      ],
    },
    {
      group: 'Other',
      fields: [
        field({ label: 'Nationality', type: 'text' }),
        field({ label: 'Mother Tongue', type: 'text' }),
        field({ label: 'Religion', type: 'text' }),
        field({ label: 'Category', type: 'picklist', options: ['General', 'OBC', 'SC', 'ST', 'Other'] }),
        field({ label: 'Address', type: 'textarea' }),
        field({ label: 'Upload Document', type: 'file', accept: ['application/pdf', 'image/jpeg', 'image/png'], maxSizeMb: 10 }),
        field({ label: 'I consent to the processing of this data', type: 'consent', required: true }),
      ],
    },
  ]
}

/** A sensible starter form so a new template isn't blank. */
export function defaultFormSchema(institutionType?: string | null): FormSchema {
  const lc = isLearningCentre(institutionType)
  const primary = lc
    ? field({ label: 'Course / Batch', type: 'related', relatedTo: 'course', mapsTo: 'course' })
    : field({ label: 'Grade / Class Applied For', type: 'text', mapsTo: 'grade' })

  return {
    sections: [
      {
        id: uid('sec'),
        title: lc ? 'Enrolment Information' : 'Admission Information',
        fields: [
          field({ label: 'First Name', type: 'text', required: true, mapsTo: 'applicant.firstName' }),
          field({ label: 'Last Name', type: 'text', mapsTo: 'applicant.lastName' }),
          field({ label: 'Date of Birth', type: 'date', mapsTo: 'applicant.dob' }),
          primary,
        ],
      },
      {
        id: uid('sec'),
        title: 'Contact',
        fields: [
          field({ label: 'Parent / Guardian Name', type: 'text', mapsTo: 'parent.name' }),
          field({ label: 'Phone Number', type: 'phone', required: true, mapsTo: 'contact.phone' }),
          field({ label: 'Email', type: 'email', mapsTo: 'contact.email' }),
        ],
      },
    ],
  }
}
