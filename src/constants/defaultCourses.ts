import { FeeFrequency } from '@prisma/client'

interface DefaultCourse {
  name: string
  frequency: FeeFrequency
  amount: number
  billingDay: number
  isActive: boolean
}

export const DEFAULT_COURSES_BY_CATEGORY: Record<string, DefaultCourse[]> = {
  MUSIC: [
    { name: 'Carnatic Vocal',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Keyboard',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Guitar',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
  ],
  DANCE: [
    { name: 'Bharatanatyam',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Western Dance',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Zumba',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
  ],
  ART: [
    { name: 'Sketching & Drawing',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Painting',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Craft',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
  ],
  ABACUS: [
    { name: 'Abacus Level 1',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Abacus Level 2',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Abacus Level 3',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
  ],
  COACHING: [
    { name: 'Maths Tuition',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Science Tuition',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'English Tuition',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
  ],
  SPORTS: [
    { name: 'Cricket',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Football',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Badminton',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
  ],
  LANGUAGE: [
    { name: 'Hindi',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'French',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'German',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
  ],
  STEM: [
    { name: 'Robotics',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Coding — Python',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
    { name: 'Coding — Scratch',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
  ],
  OTHER: [
    { name: 'General Course',
      frequency: 'MONTHLY', amount: 0,
      billingDay: 1, isActive: true },
  ],
}
