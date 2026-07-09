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
