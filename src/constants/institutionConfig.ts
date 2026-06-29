export type InstitutionType =
  | 'SCHOOL'
  | 'LEARNING_CENTER'
  | 'JUNIOR_COLLEGE'
  | 'COACHING_CENTER'

export interface SchoolTypeOption {
  value: string
  label: string
}

export interface InstitutionFieldConfig {
  showSchoolType: boolean
  showCenterCategory: boolean
  showExamFocus: boolean
  showMediumOfInstruction: boolean
  showGender: boolean
  showGradesOffered: boolean
  gradesLocked: boolean
  lockedGradeLabel: string
  schoolTypeOptions: SchoolTypeOption[]
  headingLabel: string
  nameLabel: string
  nameFieldLabel: string
  roleLabel: string
  locationHeading: string
  genericLabel: string
  teacherLabel: string
}

export const INSTITUTION_CONFIG:
  Record<InstitutionType, InstitutionFieldConfig> = {

  SCHOOL: {
    showSchoolType: true,
    showCenterCategory: false,
    showExamFocus: false,
    showMediumOfInstruction: true,
    showGender: true,
    showGradesOffered: true,
    gradesLocked: false,
    lockedGradeLabel: '',
    schoolTypeOptions: [
      { value: 'PRIVATE',
        label: 'Private School' },
      { value: 'GOVERNMENT',
        label: 'Government School' },
      { value: 'GOVERNMENT_AIDED',
        label: 'Government-Aided School' },
      { value: 'INTERNATIONAL',
        label: 'International School' },
      { value: 'SPECIAL_EDUCATION',
        label: 'Special Education School' },
    ],
    headingLabel: 'Tell us about your institution',
    nameLabel: 'School',
    nameFieldLabel: 'School Name',
    roleLabel: 'Your Role at School',
    locationHeading:
      'Where is your institution located?',
    genericLabel: 'Institution',
    teacherLabel: 'Total Teachers',
  },

  LEARNING_CENTER: {
    showSchoolType: false,
    showCenterCategory: true,
    showExamFocus: false,
    showMediumOfInstruction: false,
    showGender: false,
    showGradesOffered: false,
    gradesLocked: false,
    lockedGradeLabel: '',
    schoolTypeOptions: [],
    headingLabel: 'Tell us about your institution',
    nameLabel: 'Center',
    nameFieldLabel: 'Center Name',
    roleLabel: 'Your Role at Center',
    locationHeading:
      'Where is your institution located?',
    genericLabel: 'Institution',
    teacherLabel: 'Total Trainers',
  },

  JUNIOR_COLLEGE: {
    showSchoolType: true,
    showCenterCategory: false,
    showExamFocus: false,
    showMediumOfInstruction: true,
    showGender: true,
    showGradesOffered: true,
    gradesLocked: true,
    lockedGradeLabel:
      'Class 11 & Class 12 (HSC / Intermediate)',
    schoolTypeOptions: [
      { value: 'PRIVATE',
        label: 'Private Junior College' },
      { value: 'GOVERNMENT',
        label: 'Government Junior College' },
      { value: 'GOVERNMENT_AIDED',
        label: 'Government-Aided Junior College' },
      { value: 'AUTONOMOUS',
        label: 'Autonomous Junior College' },
      { value: 'MINORITY',
        label: 'Minority Junior College' },
    ],
    headingLabel: 'Tell us about your institution',
    nameLabel: 'College',
    nameFieldLabel: 'College Name',
    roleLabel: 'Your Role at College',
    locationHeading:
      'Where is your institution located?',
    genericLabel: 'Institution',
    teacherLabel: 'Total Faculty',
  },

  COACHING_CENTER: {
    showSchoolType: false,
    showCenterCategory: true,
    showExamFocus: true,
    showMediumOfInstruction: false,
    showGender: false,
    showGradesOffered: false,
    gradesLocked: false,
    lockedGradeLabel: '',
    schoolTypeOptions: [],
    headingLabel: 'Tell us about your institution',
    nameLabel: 'Center',
    nameFieldLabel: 'Center Name',
    roleLabel: 'Your Role at Center',
    locationHeading:
      'Where is your institution located?',
    genericLabel: 'Institution',
    teacherLabel: 'Total Faculty',
  },
}

export const CENTER_CATEGORIES = [
  { value: 'MUSIC',    label: 'Music' },
  { value: 'DANCE',    label: 'Dance' },
  { value: 'ART',      label: 'Art' },
  { value: 'ABACUS',  label: 'Abacus' },
  { value: 'COACHING', label: 'Coaching / Tuition' },
  { value: 'SPORTS',  label: 'Sports' },
  { value: 'LANGUAGE', label: 'Language' },
  { value: 'STEM',     label: 'STEM / Robotics' },
  { value: 'OTHER',   label: 'Other' },
]

export const EXAM_FOCUS_OPTIONS = [
  { value: 'IIT_JEE',
    label: 'IIT-JEE (Mains & Advanced)' },
  { value: 'NEET',
    label: 'NEET' },
  { value: 'UPSC',
    label: 'UPSC / Civil Services' },
  { value: 'CA_FOUNDATION',
    label: 'CA Foundation' },
  { value: 'CLASS_10_BOARD',
    label: 'Class 10 Board Exams' },
  { value: 'CLASS_12_BOARD',
    label: 'Class 12 Board Exams' },
  { value: 'BANK_SSC',
    label: 'Bank / SSC / Govt Exams' },
  { value: 'NATA',
    label: 'NATA / Architecture' },
  { value: 'CLAT',
    label: 'CLAT / Law Entrance' },
  { value: 'GATE',
    label: 'GATE' },
  { value: 'NDA',
    label: 'NDA / Defence' },
  { value: 'OLYMPIAD',
    label: 'Olympiad / Competitive' },
  { value: 'SPOKEN_ENGLISH',
    label: 'Spoken English' },
  { value: 'OTHER',
    label: 'Other' },
]

export const INDIAN_LANGUAGES = [
  { value: 'ENGLISH',   label: 'English' },
  { value: 'HINDI',     label: 'Hindi' },
  { value: 'TAMIL',     label: 'Tamil' },
  { value: 'TELUGU',    label: 'Telugu' },
  { value: 'KANNADA',   label: 'Kannada' },
  { value: 'MALAYALAM', label: 'Malayalam' },
  { value: 'MARATHI',   label: 'Marathi' },
  { value: 'BENGALI',   label: 'Bengali' },
  { value: 'GUJARATI',  label: 'Gujarati' },
  { value: 'PUNJABI',   label: 'Punjabi' },
  { value: 'ODIA',      label: 'Odia' },
  { value: 'ASSAMESE',  label: 'Assamese' },
  { value: 'URDU',      label: 'Urdu' },
  { value: 'SANSKRIT',  label: 'Sanskrit' },
  { value: 'KONKANI',   label: 'Konkani' },
  { value: 'MANIPURI',  label: 'Manipuri' },
  { value: 'NEPALI',    label: 'Nepali' },
  { value: 'BODO',      label: 'Bodo' },
  { value: 'DOGRI',     label: 'Dogri' },
  { value: 'KASHMIRI',  label: 'Kashmiri' },
  { value: 'MAITHILI',  label: 'Maithili' },
  { value: 'SANTALI',   label: 'Santali' },
  { value: 'SINDHI',    label: 'Sindhi' },
]
