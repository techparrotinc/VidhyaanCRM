export type InstitutionType =
  | 'SCHOOL'
  | 'LEARNING_CENTER'
  | 'JUNIOR_COLLEGE'
  | 'COACHING_CENTER'

export interface InstitutionFieldConfig {
  showSchoolType: boolean
  showCenterCategory: boolean
  showMediumOfInstruction: boolean
  showGender: boolean
  showGradesOffered: boolean
  headingLabel: string
  nameLabel: string
  roleLabel: string
}

export const INSTITUTION_CONFIG: Record<InstitutionType, InstitutionFieldConfig> = {
  SCHOOL: {
    showSchoolType: true,
    showCenterCategory: false,
    showMediumOfInstruction: true,
    showGender: true,
    showGradesOffered: true,
    headingLabel: 'Tell us about your institution',
    nameLabel: 'School Name',
    roleLabel: 'Your Role at School',
  },
  LEARNING_CENTER: {
    showSchoolType: false,
    showCenterCategory: true,
    showMediumOfInstruction: false,
    showGender: false,
    showGradesOffered: false,
    headingLabel: 'Tell us about your institution',
    nameLabel: 'Center Name',
    roleLabel: 'Your Role at Center',
  },
  JUNIOR_COLLEGE: {
    showSchoolType: true,
    showCenterCategory: false,
    showMediumOfInstruction: true,
    showGender: true,
    showGradesOffered: true,
    headingLabel: 'Tell us about your institution',
    nameLabel: 'College Name',
    roleLabel: 'Your Role at College',
  },
  COACHING_CENTER: {
    showSchoolType: false,
    showCenterCategory: true,
    showMediumOfInstruction: false,
    showGender: false,
    showGradesOffered: false,
    headingLabel: 'Tell us about your institution',
    nameLabel: 'Center Name',
    roleLabel: 'Your Role at Center',
  },
}

export const CENTER_CATEGORIES = [
  { value: 'MUSIC',    label: 'Music' },
  { value: 'DANCE',    label: 'Dance' },
  { value: 'ART',      label: 'Art' },
  { value: 'ABACUS',   label: 'Abacus' },
  { value: 'COACHING', label: 'Coaching / Tuition' },
  { value: 'SPORTS',   label: 'Sports' },
  { value: 'LANGUAGE', label: 'Language' },
  { value: 'STEM',     label: 'STEM / Robotics' },
  { value: 'OTHER',    label: 'Other' },
]
