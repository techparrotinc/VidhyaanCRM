import { format } from 'date-fns'

export const institutionType = 'school'

export const applyingForLabel = {
  school: 'Applying For',
  institute: 'Course / Program',
  learning_center: 'Course / Program',
}

export const statusLabels: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  FOLLOW_UP_PENDING: 'Follow-up',
  CONVERTED: 'Converted',
  NOT_INTERESTED: 'Rejected'
}

export const statusConfig = {
  NEW: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
  },
  CONTACTED: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  INTERESTED: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
    border: 'border-indigo-200',
  },
  FOLLOW_UP_PENDING: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    dot: 'bg-orange-500',
    border: 'border-orange-200',
  },
  CONVERTED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    dot: 'bg-green-500',
    border: 'border-green-200',
  },
  NOT_INTERESTED: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
    border: 'border-red-200',
  },
}

export const sourceConfig = {
  VIDHYAAN: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
  },
  WEBSITE: {
    bg: 'bg-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  },
  PHONE: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    dot: 'bg-purple-500',
  },
  WALK_IN: {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    dot: 'bg-teal-500',
  },
  WHATSAPP: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    dot: 'bg-green-500',
  },
  REFERRAL: {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    dot: 'bg-pink-500',
  },
  OTHER: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    dot: 'bg-orange-500',
  },
  EMAIL: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  },
  SOCIAL_MEDIA: {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    dot: 'bg-pink-500',
  },
  GOOGLE_ADS: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
  },
  META_ADS: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
  },
  JUSTDIAL: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  CAMPAIGN: {
    bg: 'bg-violet-100',
    text: 'text-violet-800',
    dot: 'bg-violet-500',
  },
  EVENT: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    dot: 'bg-cyan-500',
  },
  NEWSPAPER: {
    bg: 'bg-stone-100',
    text: 'text-stone-800',
    dot: 'bg-stone-500',
  },
  HOARDING: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    dot: 'bg-yellow-500',
  },
  IMPORT: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
  },
}

export const sources = [
  { id: 'VIDHYAAN', label: 'Vidhyaan', dot: 'bg-blue-500' },
  { id: 'WEBSITE', label: 'Website', dot: 'bg-slate-400' },
  { id: 'WALK_IN', label: 'Walk-in', dot: 'bg-teal-500' },
  { id: 'PHONE', label: 'Phone', dot: 'bg-purple-500' },
  { id: 'WHATSAPP', label: 'WhatsApp', dot: 'bg-green-500' },
  { id: 'REFERRAL', label: 'Referral', dot: 'bg-pink-500' },
  { id: 'OTHER', label: 'Other', dot: 'bg-orange-500' },
]

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—'
  return format(new Date(dateStr), 'd MMM')
}

export const leadRowBorderColor = (status: string): string => {
  const colors: Record<string, string> = {
    NEW: 'border-l-slate-300',
    CONTACTED: 'border-l-blue-400',
    INTERESTED: 'border-l-purple-400',
    FOLLOW_UP_PENDING: 'border-l-amber-400',
    CONVERTED: 'border-l-green-500',
    NOT_INTERESTED: 'border-l-red-400',
  }
  return colors[status] || 'border-l-slate-200'
}

export interface Lead {
  id: string
  name: string
  parentName: string
  phone: string
  email: string
  applyingFor: string
  source: string
  counsellor: string | null
  counsellorAvatar: string | null
  createdDate: string
  status: string
  avatar: string
  followUpDate?: string
}
