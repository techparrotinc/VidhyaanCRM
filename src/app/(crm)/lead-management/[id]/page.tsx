"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  Clock,
  FileText,
  User,
  Plus,
  Users,
  CheckCircle2,
  Trash2,
  Loader2,
  CalendarDays,
  CalendarClock,
  GraduationCap,
  Baby,
  School,
  BookOpen,
  Tag,
  Sparkles,
  ArrowRight,
  XCircle,
  MoreVertical,
  Check,
  MessageCircle,
  Circle,
  ChevronDown,
  Info
} from 'lucide-react'
import RecordSkeleton from '@/components/shared/RecordSkeleton'

import { Card } from "@/components/ui/card"
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'
import ConvertToAdmissionModal from '@/components/modals/ConvertToAdmissionModal'
import { SendFormButton } from '@/components/forms/SendFormButton'
import DateSelector from '@/components/ui/DateSelector'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import LeadPageHeader from '@/components/leads/LeadPageHeader'
import LeadProgressStrip from '@/components/leads/LeadProgressStrip'
import { mapGradeValue } from '@/lib/utils/gradeMapping'
import { institutionMode, admissionNoun } from '@/lib/institution'

interface Lead {
  id: string
  avatar: string
  firstName: string
  lastName: string
  fullName: string
  parentName: string
  phone: string
  email: string
  source: string
  status: string
  priority: string
  applyingFor: string
  academicYear: string
  childName: string
  childAge: string
  currentSchool: string
  counsellor: string
  counsellorAvatar: string | null
  counsellorRole: string
  followUpDate: string
  followUpTime: string
  createdDate: string
  createdTime: string
  lastUpdated: string
  notes: string
  board?: string
  convertedAt?: string
  conversionFeePaid?: number
  conversionPaymentMode?: string
  rejectionReason?: string
  rejectionNotes?: string
}

const initialLeads: Lead[] = [
  {
    id: 'LD-001',
    avatar: 'VD',
    firstName: 'Vimal',
    lastName: 'Das',
    fullName: 'Vimal Das',
    parentName: 'Raj Kumar',
    phone: '9884185362',
    email: 'vimal@email.com',
    source: 'Vidhyaan',
    status: 'Rejected',
    priority: 'High',
    applyingFor: 'LKG',
    academicYear: 'Academic Year 2026-27',
    childName: 'Ravi Kumar',
    childAge: '4 years',
    currentSchool: '',
    counsellor: 'Saran Kumar',
    counsellorAvatar: 'SK',
    counsellorRole: 'Sales Counsellor',
    followUpDate: '20 May 2026',
    followUpTime: '10:00 AM',
    createdDate: '18 May 2026',
    createdTime: '10:30 AM',
    lastUpdated: '19 May 2026',
    notes: '',
    rejectionReason: 'Distance issue',
    rejectionNotes: 'Parent felt school is too far from their new residence.'
  }
]

const relatedLeads = [
  { id: 'LD-008', name: 'Rinah Conrad', avatar: 'RC', applyingFor: 'UKG', status: 'New', date: '13 May 2026' },
]

const statusLabels: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  FOLLOW_UP_PENDING: 'Follow-up',
  CONVERTED: 'Converted',
  NOT_INTERESTED: 'Rejected'
}

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Low Priority',
  MEDIUM: 'Medium Priority',
  HIGH: 'High Priority',
  URGENT: 'Urgent Priority'
}

const sourceDbToUi: Record<string, string> = {
  VIDHYAAN: 'Vidhyaan',
  WALK_IN: 'Walk-in',
  PHONE: 'Phone',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  WEBSITE: 'Web',
  REFERRAL: 'Referral',
  SOCIAL_MEDIA: 'Social Media',
  GOOGLE_ADS: 'Google Ad',
  META_ADS: 'Social Media',
  JUSTDIAL: 'Other',
  CAMPAIGN: 'Other',
  EVENT: 'Other',
  NEWSPAPER: 'Other',
  HOARDING: 'Other',
  IMPORT: 'Other',
  OTHER: 'Other'
}

const statusUiToDb: Record<string, string> = {
  'New': 'NEW',
  'Contacted': 'CONTACTED',
  'Follow-up': 'FOLLOW_UP_PENDING',
  'Converted': 'CONVERTED',
  'Rejected': 'NOT_INTERESTED'
}

const statusDbToUi: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  FOLLOW_UP_PENDING: 'Follow-up',
  CONVERTED: 'Converted',
  NOT_INTERESTED: 'Rejected'
}

const priorityDbToUi: Record<string, string> = {
  LOW: 'Normal',
  MEDIUM: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent'
}

const priorityUiToDb: Record<string, string> = {
  'Normal': 'MEDIUM',
  'High': 'HIGH',
  'Urgent': 'URGENT'
}

const timeSlots = [
  "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM"
]

const format = (dateInput: any, formatStr: string): string => {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return String(dateInput)

  const day = date.getDate()
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  
  if (formatStr === 'd MMM yyyy') {
    return `${day} ${monthList[date.getMonth()]} ${date.getFullYear()}`
  }
  if (formatStr === 'EEEE, d MMMM yyyy') {
    return `${daysOfWeek[date.getDay()]}, ${day} ${monthFull[date.getMonth()]} ${date.getFullYear()}`
  }
  if (formatStr === 'h:mm a') {
    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    return `${hours}:${minutes} ${ampm}`
  }
  return date.toLocaleDateString()
}

const formatDistanceToNow = (dateInput: any, options?: { addSuffix?: boolean }): string => {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '—'
  
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  let result = ''
  if (diffSecs < 60) {
    result = 'just now'
    return result
  } else if (diffMins < 60) {
    result = `${diffMins} min${diffMins > 1 ? 's' : ''}`
  } else if (diffHours < 24) {
    result = `${diffHours} hour${diffHours > 1 ? 's' : ''}`
  } else {
    result = `${diffDays} day${diffDays > 1 ? 's' : ''}`
  }

  if (options?.addSuffix) {
    return `${result} ago`
  }
  return result
}

const sameDay = (d1Str: any, d2Str: any): boolean => {
  if (!d1Str || !d2Str) return false
  const d1 = new Date(d1Str)
  const d2 = new Date(d2Str)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

const formatSource = (src: string) => {
  return sourceDbToUi[src] || src || '—'
}

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const leadId = params?.id as string

  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [counsellorsList, setCounsellorsList] = useState<any[]>([])
  const [academicYearsList, setAcademicYearsList] = useState<any[]>([])
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [institutionType, setInstitutionType] = useState('school')

  // Lead States
  const [currentStatus, setCurrentStatus] = useState('New')
  const [currentPriority, setCurrentPriority] = useState('Normal')
  const [currentCounsellor, setCurrentCounsellor] = useState('Unassigned')
  const [currentCounsellorAvatar, setCurrentCounsellorAvatar] = useState('UA')
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpTime, setFollowUpTime] = useState('')

  // Reject Modal state
  const [rejectReason, setRejectReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Fetch lead details and counsellors on mount
  useEffect(() => {
    if (!leadId) return

    async function fetchLead() {
      try {
        const res = await fetch(`/api/v1/leads/${leadId}`)
        if (!res.ok) throw new Error('Lead not found')
        const json = await res.json()
        setLead(json.data)
      } catch (err) {
        console.error('Failed to fetch lead from API, falling back to mock:', err)
        const mock = initialLeads.find((l: any) => l.id === leadId) || initialLeads[0]
        setLead(mock)
      } finally {
        setLoading(false)
      }
    }

    async function fetchCounsellors() {
      try {
        const res = await fetch('/api/v1/counsellors')
        if (res.ok) {
          const json = await res.json()
          setCounsellorsList(json.data ?? [])
        }
      } catch (err) {
        console.error('Failed to fetch counsellors', err)
      }
    }

    async function fetchModules() {
      try {
        const res = await fetch('/api/v1/school-profile')
        const json = await res.json()
        if (json.success) {
          if (json.enabledModules) setEnabledModules(json.enabledModules)
          if (json.school?.institutionType) {
            setInstitutionType(institutionMode(json.school.institutionType))
          }
        }
      } catch (err) {
        console.error('Failed to fetch school-profile', err)
      }
    }

    async function fetchAcademicYears() {
      try {
        const res = await fetch('/api/v1/settings/academic-year')
        if (res.ok) {
          const json = await res.json()
          setAcademicYearsList(json.data ?? [])
        }
      } catch (err) {
        console.error('Failed to fetch academic years', err)
      }
    }

    fetchLead()
    fetchCounsellors()
    fetchModules()
    fetchAcademicYears()
  }, [leadId])

  // Sync lead details to local states
  useEffect(() => {
    if (!lead) return
    const mappedStatus = statusDbToUi[lead.status] || 'New'
    setCurrentStatus(mappedStatus)
    setCurrentPriority(priorityDbToUi[lead.priority] || 'Normal')
    setCurrentCounsellor(lead.assignedTo?.name || 'Unassigned')
    setCurrentCounsellorAvatar(
      lead.assignedTo?.name
        ? lead.assignedTo.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'UA'
    )

    if (lead.nextFollowUpAt) {
      const dateObj = new Date(lead.nextFollowUpAt)
      const yyyy = dateObj.getFullYear()
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
      const dd = String(dateObj.getDate()).padStart(2, '0')
      setFollowUpDate(`${yyyy}-${mm}-${dd}`)

      let hours = dateObj.getHours()
      const minutes = String(dateObj.getMinutes()).padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      hours = hours ? hours : 12
      setFollowUpTime(`${String(hours).padStart(2, '0')}:${minutes} ${ampm}`)
    } else {
      setFollowUpDate('')
      setFollowUpTime('')
    }

    if (lead.activities) {
      const mappedActivities = lead.activities.map((act: any) => {
        let iconName = 'FileText'
        let color = 'bg-slate-500'
        let title = act.summary

        switch (act.type) {
          case 'SYSTEM':
            iconName = 'Plus'
            color = 'bg-blue-500'
            break
          case 'ASSIGNMENT':
            iconName = 'User'
            color = 'bg-purple-500'
            break
          case 'CALL':
            iconName = 'Phone'
            color = 'bg-green-500'
            break
          case 'STATUS_CHANGE':
            iconName = 'Clock'
            color = 'bg-slate-400'
            break
          case 'WHATSAPP':
            iconName = 'MessageCircle'
            color = 'bg-green-600'
            break
          case 'EMAIL':
            iconName = 'Mail'
            color = 'bg-blue-500'
            break
          default:
            iconName = 'FileText'
            color = 'bg-slate-500'
        }

        const actDate = new Date(act.createdAt)
        const dateFormatted = actDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
        const timeFormatted = actDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })

        return {
          id: act.id,
          icon: iconName,
          color,
          title,
          date: dateFormatted,
          time: timeFormatted,
          note: '',
          done: true,
          createdAt: act.createdAt,
          type: act.type
        }
      })
      setActivities(mappedActivities)
    }

  }, [lead])

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'CONVERTED') {
      setShowConvertModal(true)
      return
    }
    if (newStatus === 'NOT_INTERESTED') {
      setShowRejectModal(true)
      return
    }
    try {
      const dbStatus = newStatus
      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: dbStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      const json = await res.json()
      setLead(json.data)
      const newStatusUi = statusDbToUi[dbStatus] || 'New'
      setCurrentStatus(newStatusUi)
      showToast(`Status updated to ${newStatusUi}`)
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to update status', 'error')
    }
  }

  // Follow-up Dialog states & handlers
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false)
  const [dialogFollowUpDate, setDialogFollowUpDate] = useState('')
  const [dialogFollowUpTime, setDialogFollowUpTime] = useState('10:00 AM')

  const openFollowUpDialog = () => {
    setDialogFollowUpDate(followUpDate)
    setDialogFollowUpTime(followUpTime || '10:00 AM')
    setFollowUpDialogOpen(true)
  }

  const handleSaveFollowUpDialog = async () => {
    try {
      let nextFollowUpDate: Date | null = null
      if (dialogFollowUpDate) {
        if (dialogFollowUpTime) {
          const [hoursStr, minutesStrWithAmPm] = dialogFollowUpTime.split(':')
          const [minutesStr, ampm] = minutesStrWithAmPm.split(' ')
          let hours = parseInt(hoursStr)
          const minutes = parseInt(minutesStr)
          if (ampm === 'PM' && hours < 12) hours += 12
          if (ampm === 'AM' && hours === 12) hours = 0
          nextFollowUpDate = new Date(dialogFollowUpDate)
          nextFollowUpDate.setHours(hours, minutes, 0, 0)
        } else {
          nextFollowUpDate = new Date(dialogFollowUpDate)
        }
      }

      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextFollowUpAt: nextFollowUpDate ? nextFollowUpDate.toISOString() : null,
          status: lead?.status === 'NEW' ? 'FOLLOW_UP_PENDING' : lead?.status
        })
      })
      if (!res.ok) throw new Error('Failed to update follow-up')
      const json = await res.json()
      setLead(json.data)
      setFollowUpDialogOpen(false)
      showToast('Follow-up scheduled')
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to update follow-up', 'error')
    }
  }

  const handleClearFollowUp = async () => {
    try {
      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextFollowUpAt: null
        })
      })
      if (!res.ok) throw new Error('Failed to clear follow-up')
      const json = await res.json()
      setLead(json.data)
      showToast('Follow-up marked done')
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to clear follow-up', 'error')
    }
  }

  // Log Activity States
  const [activityTab, setActivityTab] = useState<'note' | 'call' | 'whatsapp' | 'email'>('note')
  const [activityText, setActivityText] = useState('')
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false)
  const [activities, setActivities] = useState<any[]>([])

  // Modals & Dropdowns States
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks'>('timeline')

  // Toast State
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'info' | 'error'
    show: boolean
  }>({ msg: '', type: 'success', show: false })

  const showToast = (
    msg: string,
    type: 'success' | 'info' | 'error' = 'success'
  ) => {
    setToast({ msg, type, show: true })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  // Save Activity Handler
  const handleSaveActivity = async () => {
    if (!activityText.trim()) return

    const tabTypeMap = {
      note: 'NOTE',
      call: 'CALL',
      whatsapp: 'WHATSAPP',
      email: 'EMAIL'
    } as const

    const type = tabTypeMap[activityTab]

    try {
      const activityRes = await fetch(`/api/v1/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          summary: activityText
        })
      })

      if (!activityRes.ok) throw new Error('Failed to log activity')

      if (scheduleFollowUp && followUpDate) {
        let nextFollowUpDate: Date | null = null
        if (followUpTime) {
          const [hoursStr, minutesStrWithAmPm] = followUpTime.split(':')
          const [minutesStr, ampm] = minutesStrWithAmPm.split(' ')
          let hours = parseInt(hoursStr)
          const minutes = parseInt(minutesStr)
          if (ampm === 'PM' && hours < 12) hours += 12
          if (ampm === 'AM' && hours === 12) hours = 0
          nextFollowUpDate = new Date(followUpDate)
          nextFollowUpDate.setHours(hours, minutes, 0, 0)
        } else {
          nextFollowUpDate = new Date(followUpDate)
        }

        const putRes = await fetch(`/api/v1/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nextFollowUpAt: nextFollowUpDate ? nextFollowUpDate.toISOString() : null,
            status: 'FOLLOW_UP_PENDING'
          })
        })
        if (putRes.ok) {
          setCurrentStatus('Follow-up')
        }
      }

      const detailRes = await fetch(`/api/v1/leads/${leadId}`)
      if (detailRes.ok) {
        const detailJson = await detailRes.json()
        setLead(detailJson.data)
      }

      setActivityText('')
      setScheduleFollowUp(false)
      showToast("Activity logged")
    } catch (err: any) {
      console.error(err)
      showToast(err.message || "Failed to log activity", "error")
    }
  }

  // Textarea Ctrl+Enter listener
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      handleSaveActivity()
    }
  }

  const handleSaveRejectModal = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'NOT_INTERESTED',
          lostReason: rejectReason || null
        })
      })

      if (!res.ok) {
        throw new Error('Failed to reject lead')
      }

      const json = await res.json()
      setLead(json.data)
      setCurrentStatus('Rejected')
      setShowRejectModal(false)
      showToast("Lead moved to Rejected status")
    } catch (err: any) {
      console.error(err)
      showToast(err.message || "Failed to reject lead", "error")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <RecordSkeleton />
  }

  const isConverted = lead?.status === 'CONVERTED'
  const isRejected = lead?.status === 'NOT_INTERESTED'
  const showConvertButton = !isConverted && enabledModules.includes('admission_management')

  const parentName = lead?.parentName || lead?.studentName || ''
  const initials = parentName
    ? parentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'LD'

  // Icon mapping for timeline
  const getTimelineIcon = (iconName: string) => {
    switch (iconName) {
      case 'Plus': return Plus
      case 'User': return User
      case 'Phone': return Phone
      case 'Calendar': return Calendar
      case 'Clock': return Clock
      default: return FileText
    }
  }

  // Follow-up card helper calculations
  const hasFollowUp = !!lead?.nextFollowUpAt
  let isOverdue = false
  let isTodayVal = false
  let isFuture = false

  if (hasFollowUp) {
    const followUpDateObj = new Date(lead.nextFollowUpAt)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    isOverdue = followUpDateObj < todayStart
    isTodayVal = sameDay(lead.nextFollowUpAt, now)
    isFuture = !isOverdue && !isTodayVal
  }

  let followUpContainerClass = "bg-white border border-slate-200 rounded-xl p-4"
  if (hasFollowUp) {
    if (isOverdue) followUpContainerClass = "bg-red-50 border border-red-100 rounded-xl p-3"
    else if (isTodayVal) followUpContainerClass = "bg-amber-50 border border-amber-100 rounded-xl p-3"
    else followUpContainerClass = "bg-blue-50 border border-blue-100 rounded-xl p-3"
  }

  const tabConfigs = {
    note: { icon: FileText, color: 'text-slate-500', label: 'Note', ph: 'Write a note about this lead...' },
    call: { icon: Phone, color: 'text-green-500', label: 'Call', ph: 'Summarize the call...' },
    whatsapp: { icon: MessageCircle, color: 'text-green-500', label: 'WhatsApp', ph: 'What was discussed...' },
    email: { icon: Mail, color: 'text-blue-500', label: 'Email', ph: 'Email summary...' }
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-50/30 text-slate-800 flex flex-col">
      <LeadPageHeader
        mode="view"
        lead={lead}
        showToast={showToast}
        onDeleteSuccess={() => router.push('/lead-management')}
      />

      <LeadProgressStrip
        status={lead?.status}
        onStatusChange={handleStatusChange}
      />

      {/* THREE COLUMN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4 md:h-[calc(100vh-116px)] h-auto overflow-hidden">
        
        {/* LEFT COLUMN: Snapshot & Profile */}
        <div className="overflow-y-auto overflow-x-hidden space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pb-4">
          
          {/* CARD 1 — CONTACT */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="w-12 h-12 rounded-full bg-[#1565D8] mx-auto flex items-center justify-center text-white font-bold text-base shadow-sm">
              {initials}
            </div>
            <h4 className="text-base font-bold text-slate-900 text-center mt-2 truncate">
              {parentName}
            </h4>
            <div className="text-center mt-1">
              <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                # {lead.leadCode}
              </span>
            </div>
            
            <div className="my-3 border-t border-slate-100" />
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-1.5">
                <Phone size={13} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Phone</span>
                  <a href={`tel:${lead.phone}`} className="text-sm text-[#1565D8] hover:underline font-medium">
                    {lead.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1.5">
                <Mail size={13} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Email</span>
                  <a href={`mailto:${lead.email}`} className="text-sm text-[#1565D8] hover:underline font-medium">
                    {lead.email || '—'}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1.5">
                <Plus size={13} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Source</span>
                  <div>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {formatSource(lead.source)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1.5">
                <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Created</span>
                  <span className="text-sm text-slate-800 font-medium">
                    {format(lead.createdAt, 'd MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* CARD 2 — STUDENT PROFILE */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">
              STUDENT PROFILE
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-1.5">
                <Baby size={13} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Child Name</span>
                  <span className="text-sm text-slate-800 font-medium">{lead.kidName || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1.5">
                <Clock size={13} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Child Age</span>
                  <span className="text-sm text-slate-800 font-medium">{lead.childAge ? `${lead.childAge} years` : '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1.5">
                <GraduationCap size={13} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {institutionType === 'school' ? 'Applying For' : 'Course / Batch'}
                  </span>
                  <span className="text-sm text-slate-800 font-medium">
                    {institutionType === 'school'
                      ? (lead.gradeSought ? getGradeLabel(lead.gradeSought) : '—')
                      : ([lead.course, lead.batch].filter(Boolean).join(' · ') || '—')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1.5">
                <School size={13} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Current School</span>
                  <span className="text-sm text-slate-800 font-medium">{lead.currentSchool || '—'}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* CARD 3 — LEAD INFO */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">
              LEAD INFORMATION
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-1.5">
                <User size={13} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Counsellor</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-5 h-5 bg-slate-700 text-white text-[8px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {currentCounsellorAvatar}
                    </div>
                    <span className="text-sm text-slate-800 font-medium">
                      {currentCounsellor}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1.5">
                <BookOpen size={13} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Academic Year</span>
                  <span className="text-sm text-slate-800 font-medium">
                    {lead.academicYear?.name || lead.academicYear || '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 py-1.5">
                <Tag size={13} className="text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Priority</span>
                  <div className="mt-1">
                    <span className={`h-6 px-2.5 rounded-full text-xs font-semibold flex items-center justify-center border w-fit ${priorityColors[lead.priority] || 'bg-slate-100 text-slate-650'}`}>
                      {priorityLabels[lead.priority] || lead.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* CENTER COLUMN: Follow-Up & Timeline Activities */}
        <div className="overflow-y-auto overflow-x-hidden space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pb-4">
          
          {/* CARD 1 — FOLLOW-UP */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarClock size={14} className="text-[#1565D8]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  FOLLOW-UP
                </span>
              </div>
              {hasFollowUp && (
                <button
                  onClick={openFollowUpDialog}
                  className="text-xs text-[#1565D8] hover:underline font-semibold cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>

            {hasFollowUp ? (
              <div className={followUpContainerClass}>
                <div className="flex items-center justify-between">
                  <div>
                    {isOverdue && (
                      <span className="bg-red-100 text-red-750 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        ⚠ Overdue
                      </span>
                    )}
                    {isTodayVal && (
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        ● Today
                      </span>
                    )}
                    {isFuture && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        ● Upcoming
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleClearFollowUp}
                    className="text-xs border border-slate-200 bg-white hover:bg-slate-50 px-2 py-0.5 rounded text-slate-650 font-semibold transition cursor-pointer"
                  >
                    Mark Done
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <CalendarDays size={13} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-800">
                    {format(lead.nextFollowUpAt, 'EEEE, d MMMM yyyy')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={13} className="text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {format(lead.nextFollowUpAt, 'h:mm a')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center text-center">
                <CalendarClock size={24} className="text-slate-200 mb-2" />
                <span className="text-sm font-medium text-slate-400">No follow-up scheduled</span>
                <span className="text-xs text-slate-300 mt-1">Schedule a follow-up to stay on top of this lead</span>
                <button
                  onClick={openFollowUpDialog}
                  className="mt-3 h-8 px-4 text-xs font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                  Schedule Follow-up
                </button>
              </div>
            )}
          </Card>

          {/* CARD 2 — ACTIVITY TABS */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex border-b border-slate-100 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'border-[#1565D8] text-[#1565D8]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Activity Feed & Logs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'tasks'
                    ? 'border-[#1565D8] text-[#1565D8]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Schedule & Tasks
              </button>
            </div>

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {/* LOG ACTIVITY */}
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-2">
                    LOG ACTIVITY
                  </div>
                  
                  <div className="flex gap-1 p-1 bg-slate-50 rounded-lg w-fit mb-3">
                    {(Object.keys(tabConfigs) as Array<keyof typeof tabConfigs>).map((tab) => {
                      const isActive = activityTab === tab
                      const config = tabConfigs[tab]
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActivityTab(tab)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                            isActive ? 'bg-white shadow-sm text-[#1565D8]' : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {config.label}
                        </button>
                      )
                    })}
                  </div>

                  <textarea
                    rows={3}
                    value={activityText}
                    onChange={(e) => setActivityText(e.target.value)}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder={tabConfigs[activityTab].ph}
                    className="w-full resize-none border border-slate-200 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:border-[#1565D8]"
                  />

                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-400">{activityText.length} characters</span>
                    <button
                      type="button"
                      onClick={handleSaveActivity}
                      disabled={!activityText.trim()}
                      className="bg-[#1565D8] text-white h-8 px-4 text-xs font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Save Activity
                    </button>
                  </div>
                </div>

                <div className="border-b border-slate-100 my-3" />

                {/* ACTIVITY STREAM FEED */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      ACTIVITY STREAM FEED
                    </span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {activities.length}
                    </span>
                  </div>

                  {activities.length > 0 ? (
                    <div className="space-y-4 relative pl-3.5 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                      {activities.map((act) => {
                        const Icon = getTimelineIcon(act.icon)
                        return (
                          <div key={act.id} className="relative text-left">
                            {/* Bullet icon */}
                            <div className={`absolute -left-[21px] top-0.5 w-[14px] h-[14px] rounded-full border border-white flex items-center justify-center ${act.color}`}>
                              <Icon size={7} className="text-white" />
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold text-slate-800 leading-snug">{act.title}</h5>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {act.date} · {act.time}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <FileText className="size-6 text-slate-200 mx-auto mb-2" />
                      <h5 className="text-xs font-bold text-slate-400">No stream logs yet</h5>
                      <p className="text-[10px] text-slate-350 mt-0.5">Activities will appear chronologically here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="text-xs font-semibold text-slate-500 mb-1">Scheduled Dates & Timelines</div>
                {hasFollowUp ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50/40 border border-blue-100/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CalendarClock size={16} className="text-[#1565D8]" />
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold text-slate-800">
                          {format(lead.nextFollowUpAt, 'd MMM yyyy')}
                        </span>
                        <span className="text-xs text-slate-500">
                          Follow-up Scheduled at {format(lead.nextFollowUpAt, 'h:mm a')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={openFollowUpDialog}
                      className="text-xs text-[#1565D8] hover:underline font-semibold cursor-pointer"
                    >
                      Reschedule
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-slate-50/50 rounded-xl text-slate-400 text-xs">
                    No tasks or follow-ups are pending.
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Actions & Affiliated Data */}
        <div className="overflow-y-auto overflow-x-hidden space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pb-4 md:col-span-2 xl:col-span-1">
          
          {/* CARD 1 — QUICK ACTIONS */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">
              QUICK ACTIONS
            </div>

            <div className="space-y-2">
              {isConverted ? (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex items-center justify-center gap-2 text-green-700 text-xs font-bold shadow-sm w-full">
                  <Sparkles size={13} className="text-green-500 animate-pulse" />
                  <span>Converted to {admissionNoun(institutionType)}</span>
                </div>
              ) : (
                <>
                  {showConvertButton && (
                    <button
                      onClick={() => setShowConvertModal(true)}
                      className="w-full h-9 text-sm font-semibold bg-[#1565D8] text-white rounded-lg flex items-center justify-center gap-1.5 hover:bg-blue-700 transition cursor-pointer"
                    >
                      <span>Convert to {admissionNoun(institutionType)}</span>
                      <ArrowRight size={13} />
                    </button>
                  )}

                  {!isRejected && (
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="w-full h-9 text-sm font-semibold border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-1.5 cursor-pointer transition"
                    >
                      <XCircle size={13} className="text-red-500" />
                      <span>Not Interested</span>
                    </button>
                  )}

                  {!isConverted && (currentStatus === 'New' || currentStatus === 'Follow-up') && (
                    <button
                      onClick={() => handleStatusChange('CONTACTED')}
                      className="w-full h-9 text-sm font-semibold border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Mark as Contacted</span>
                    </button>
                  )}

                  <SendFormButton
                    targetType="LEAD"
                    targetId={lead.id}
                    hasEmail={!!lead.email}
                    hasPhone={!!lead.phone}
                    label={`Send ${admissionNoun(institutionType).toLowerCase()} form`}
                    className="w-full h-9 gap-1.5"
                  />
                </>
              )}
            </div>
          </Card>

          {/* CARD 2 — RELATED LEADS */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              RELATED LEADS
            </div>
            <p className="text-xs text-slate-400 mb-3">From same phone number</p>

            {relatedLeads.length > 0 ? (
              <div className="space-y-2">
                {relatedLeads.map((rl) => (
                  <div
                    key={rl.id}
                    onClick={() => router.push(`/lead-management/${rl.id}`)}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition duration-150 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {rl.avatar}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h5 className="text-sm font-semibold text-slate-800 truncate">{rl.name}</h5>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {rl.applyingFor} · {rl.status} · {rl.date}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-3">No related leads found</p>
            )}
          </Card>

          {/* CARD 3 — ENROLLMENT DETAILS */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">
              ENROLLMENT DETAILS
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 text-xs">
                <span className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">APPLYING FOR</span>
                <span className="text-slate-800 font-semibold truncate max-w-[150px]">
                  {lead.gradeSought ? getGradeLabel(lead.gradeSought) : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 text-xs">
                <span className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">ACADEMIC YEAR</span>
                <span className="text-slate-800 font-semibold">
                  {lead.academicYear?.name || lead.academicYear || '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 text-xs">
                <span className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">BOARD</span>
                <span className="text-slate-850 font-semibold">{lead.board || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 text-xs">
                <span className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">JOINING DATE</span>
                <span className="text-slate-800 font-semibold">
                  {lead.expectedJoinDate ? format(lead.expectedJoinDate, 'd MMM yyyy') : '—'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* DIALOG MODALS */}
      {/* CONVERT MODAL */}
      {lead && (
        <ConvertToAdmissionModal
          lead={lead}
          isOpen={showConvertModal}
          admissionTerm={admissionNoun(institutionType)}
          onClose={() => setShowConvertModal(false)}
          onSuccess={(admissionId) => {
            setCurrentStatus('Converted')
            showToast(`Lead converted to ${admissionNoun(institutionType).toLowerCase()}!`)
            router.push('/admission-management')
          }}
        />
      )}

      {/* REJECT MODAL */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-sm w-[calc(100%-2rem)] sm:w-full rounded-2xl p-6 text-left bg-white border border-slate-200">
          <DialogHeader className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <XCircle size={20} className="text-red-500" />
            </div>
            <DialogTitle className="text-lg font-bold Poppins">Reject This Lead?</DialogTitle>
          </DialogHeader>

          <DialogDescription className="text-sm text-slate-500 leading-relaxed mb-5">
            Are you sure you want to reject {parentName}? This will move them out of the active pipeline.
          </DialogDescription>

          <div className="mb-5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              Reason (optional)
            </label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
            >
              <option value="">Select a reason</option>
              <option value="Distance issue">Too far from school</option>
              <option value="Fees issue">Fees are too high</option>
              <option value="Not interested in board">Prefers different curriculum</option>
              <option value="Joined another school">Joined elsewhere</option>
              <option value="Other">Other / Not specified</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowRejectModal(false)}
              className="border border-slate-200 bg-white text-slate-600 text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRejectModal}
              disabled={isSaving}
              className="bg-red-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-red-650 transition flex items-center gap-2 disabled:opacity-75 cursor-pointer"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : null}
              Confirm Reject
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* FOLLOW UP DIALOG */}
      <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full rounded-2xl p-6 text-left bg-white border border-slate-200">
          <DialogHeader className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <CalendarClock size={20} className="text-[#1565D8]" />
            </div>
            <DialogTitle className="text-lg font-bold Poppins">Schedule Follow-up</DialogTitle>
          </DialogHeader>

          <DialogDescription className="text-sm text-slate-500 leading-relaxed mb-5">
            Set a date and time to contact this parent.
          </DialogDescription>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Follow-up Date
              </label>
              <DateSelector
                value={dialogFollowUpDate}
                onChange={setDialogFollowUpDate}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Follow-up Time
              </label>
              <div className="relative">
                <select
                  value={dialogFollowUpTime}
                  onChange={(e) => setDialogFollowUpTime(e.target.value)}
                  className="w-full h-9 px-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] appearance-none cursor-pointer"
                >
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setFollowUpDialogOpen(false)}
              className="border border-slate-200 bg-white text-slate-650 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFollowUpDialog}
              className="bg-[#1565D8] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
            >
              Save Follow-up
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <div 
            className="flex items-center gap-3 bg-slate-800 text-white rounded-xl px-6 py-4 shadow-2xl min-w-[320px] pointer-events-auto transform transition-all duration-300 animate-in fade-in zoom-in-95"
          >
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-green-400 shrink-0" strokeWidth={1.5} />}
            {toast.type === 'info' && <Info size={18} className="text-blue-400 shrink-0" strokeWidth={1.5} />}
            {toast.type === 'error' && <XCircle size={18} className="text-red-400 shrink-0" strokeWidth={1.5} />}
            
            <span className="text-sm font-semibold font-sans">{toast.msg}</span>
            
            <button 
              type="button"
              onClick={() => setToast(t => ({ ...t, show: false }))} 
              className="ml-auto text-slate-400 hover:text-slate-200 cursor-pointer pl-2"
            >
              <XCircle size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
