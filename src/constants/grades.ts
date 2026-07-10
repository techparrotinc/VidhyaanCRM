export const GRADE_OPTIONS = [
  { value: 'pre_kg', label: 'Pre-KG' },
  { value: 'nursery', label: 'Nursery' },
  { value: 'lkg', label: 'LKG' },
  { value: 'ukg', label: 'UKG' },
  { value: 'class_1', label: 'Class 1' },
  { value: 'class_2', label: 'Class 2' },
  { value: 'class_3', label: 'Class 3' },
  { value: 'class_4', label: 'Class 4' },
  { value: 'class_5', label: 'Class 5' },
  { value: 'class_6', label: 'Class 6' },
  { value: 'class_7', label: 'Class 7' },
  { value: 'class_8', label: 'Class 8' },
  { value: 'class_9', label: 'Class 9' },
  { value: 'class_10', label: 'Class 10' },
  { value: 'class_11_science', label: 'Class 11 - Science' },
  { value: 'class_11_commerce', label: 'Class 11 - Commerce' },
  { value: 'class_11_arts', label: 'Class 11 - Arts' },
  { value: 'class_12_science', label: 'Class 12 - Science' },
  { value: 'class_12_commerce', label: 'Class 12 - Commerce' },
  { value: 'class_12_arts', label: 'Class 12 - Arts' },
  { value: 'other', label: 'Other' },
] as const

export type GradeValue = typeof GRADE_OPTIONS[number]['value']

export const GRADE_LABELS: Record<string, string> = Object.fromEntries(
  GRADE_OPTIONS.map(g => [g.value, g.label])
)

export function getGradeLabel(value: string): string {
  return GRADE_LABELS[value] || value
}

/** Canonical display labels (no "Other") — for pick lists that store the label text. */
export const GRADE_LABEL_OPTIONS = GRADE_OPTIONS
  .filter(g => g.value !== 'other')
  .map(g => g.label)

/**
 * Ordered plain grade ladder for range endpoints (gradeFrom/gradeTo) —
 * no stream splits, since a range like "LKG to Class 12" spans streams.
 */
export const GRADE_RANGE_OPTIONS = [
  'Pre-KG',
  'Nursery',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
] as const
