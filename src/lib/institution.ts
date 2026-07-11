// Canonical institution-type classification (client + server safe — no deps).
// Learning-centre-style orgs use course/batch + "enquiry" language; the rest
// (school, junior college, …) use grade + "admission" language.

export const LC_INSTITUTION_TYPES = [
  'LEARNING_CENTER',
  'COACHING_CENTER',
  'SKILL_DEVELOPMENT',
  'SPORTS_ACADEMY',
]

/** Accepts the raw enum ('LEARNING_CENTER') or a lowercased form. */
export function isLearningCentre(institutionType?: string | null): boolean {
  if (!institutionType) return false
  return LC_INSTITUTION_TYPES.includes(institutionType.toUpperCase())
}

/** The two UI modes the lead/admission forms branch on. */
export function institutionMode(institutionType?: string | null): 'school' | 'learning_center' {
  return isLearningCentre(institutionType) ? 'learning_center' : 'school'
}

/** What an "admission" is called for this institution type. */
export function admissionNoun(institutionType?: string | null): string {
  return isLearningCentre(institutionType) ? 'Enrolment' : 'Admission'
}

/**
 * The proper noun for the institution itself — used wherever UI would otherwise
 * hardcode "School" (e.g. "School Admin", "School Profile"). Falls back to
 * "Institution" for unknown types so no caller ever leaks the raw enum.
 */
export function institutionNoun(institutionType?: string | null): string {
  switch ((institutionType ?? '').toUpperCase()) {
    case 'LEARNING_CENTER':
      return 'Learning Center'
    case 'COACHING_CENTER':
      return 'Coaching Center'
    case 'SKILL_DEVELOPMENT':
      return 'Skill Center'
    case 'SPORTS_ACADEMY':
      return 'Sports Academy'
    case 'JUNIOR_COLLEGE':
      return 'College'
    case 'SCHOOL':
    case '':
      return 'School'
    default:
      return 'Institution'
  }
}
