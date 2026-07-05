export const EVENT_TYPES = [
  // school
  'OPEN_HOUSE', 'PTM', 'ANNUAL_DAY', 'SPORTS_DAY', 'HOLIDAY', 'ADMISSION_DRIVE',
  // learning / coaching center
  'DEMO_CLASS', 'WORKSHOP', 'COMPETITION', 'BATCH_EVENT',
  // shared
  'OTHER'
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  OPEN_HOUSE: 'Open House',
  PTM: 'Parent-Teacher Meeting',
  ANNUAL_DAY: 'Annual Day',
  SPORTS_DAY: 'Sports Day',
  HOLIDAY: 'Holiday',
  ADMISSION_DRIVE: 'Admission Drive',
  DEMO_CLASS: 'Demo Class',
  WORKSHOP: 'Workshop',
  COMPETITION: 'Competition',
  BATCH_EVENT: 'Batch Event',
  OTHER: 'Other'
}

// Which types each institution type sees in the create/edit form
export const SCHOOL_EVENT_TYPES: EventType[] = [
  'OPEN_HOUSE', 'PTM', 'ANNUAL_DAY', 'SPORTS_DAY', 'HOLIDAY', 'ADMISSION_DRIVE', 'OTHER'
]

export const CENTER_EVENT_TYPES: EventType[] = [
  'DEMO_CLASS', 'WORKSHOP', 'COMPETITION', 'BATCH_EVENT', 'HOLIDAY', 'OTHER'
]
