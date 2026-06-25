"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  TrendingUp,
  Users,
  Shield,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Menu,
  Crown,
  X,
  ArrowRight,
  CheckCircle2,
  Plus,
  UserPlus,
  Calendar,
  ChevronLeft,
  MoreVertical,
  Check,
  Zap,
  Info,
  XCircle,
  Hash,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  FileText,
  User,
  Trash2,
  RefreshCw,
  Pencil,
  Copy,
  Download,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import RecordSkeleton from '@/components/shared/RecordSkeleton'

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'
import ConvertToAdmissionModal from '@/components/modals/ConvertToAdmissionModal'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// Mock database type definitions
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
  convertedAt?: string
  conversionFeePaid?: number
  conversionPaymentMode?: string
  rejectionReason?: string
  rejectionNotes?: string
}

// Initial mock database
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
  },
  {
    id: 'LD-002',
    avatar: 'AS',
    firstName: 'Aarav',
    lastName: 'Sharma',
    fullName: 'Aarav Sharma',
    parentName: 'Amit Sharma',
    phone: '9876543210',
    email: 'aarav@email.com',
    source: 'Web',
    status: 'New',
    priority: 'Normal',
    applyingFor: 'UKG',
    academicYear: 'Academic Year 2026-27',
    childName: 'Aryan Sharma',
    childAge: '5 years',
    currentSchool: 'Nursery Play school',
    counsellor: 'Pradeep K',
    counsellorAvatar: null,
    counsellorRole: 'Counsellor',
    followUpDate: '22 May 2026',
    followUpTime: '11:00 AM',
    createdDate: '18 May 2026',
    createdTime: '11:00 AM',
    lastUpdated: '18 May 2026',
    notes: ''
  },
  {
    id: 'LD-003',
    avatar: 'KP',
    firstName: 'Kavya',
    lastName: 'Patel',
    fullName: 'Kavya Patel',
    parentName: 'Rajesh Patel',
    phone: '9123456789',
    email: 'kavya@email.com',
    source: 'Walk-in',
    status: 'Follow-up',
    priority: 'Urgent',
    applyingFor: 'Grade 1',
    academicYear: 'Academic Year 2026-27',
    childName: 'Keya Patel',
    childAge: '6 years',
    currentSchool: 'Nursery Play school',
    counsellor: 'Saran Kumar',
    counsellorAvatar: 'SK',
    counsellorRole: 'Sales Counsellor',
    followUpDate: '19 May 2026',
    followUpTime: '02:00 PM',
    createdDate: '18 May 2026',
    createdTime: '12:00 PM',
    lastUpdated: '19 May 2026',
    notes: ''
  },
  {
    id: 'LD-004',
    avatar: 'DR',
    firstName: 'Diya',
    lastName: 'Reddy',
    fullName: 'Diya Reddy',
    parentName: 'Srinivas Reddy',
    phone: '8887776665',
    email: 'diya@email.com',
    source: 'Phone',
    status: 'Contacted',
    priority: 'Normal',
    applyingFor: 'Nursery',
    academicYear: 'Academic Year 2026-27',
    childName: 'Dev Reddy',
    childAge: '3 years',
    currentSchool: '',
    counsellor: 'Unassigned',
    counsellorAvatar: null,
    counsellorRole: '',
    followUpDate: '25 May 2026',
    followUpTime: '04:00 PM',
    createdDate: '18 May 2026',
    createdTime: '02:30 PM',
    lastUpdated: '18 May 2026',
    notes: ''
  },
  {
    id: 'LD-005',
    avatar: 'RN',
    firstName: 'Rohan',
    lastName: 'Nair',
    fullName: 'Rohan Nair',
    parentName: 'Girish Nair',
    phone: '7776665554',
    email: 'rohan@email.com',
    source: 'WhatsApp',
    status: 'Converted',
    priority: 'High',
    applyingFor: 'Grade 2',
    academicYear: 'Academic Year 2026-27',
    childName: 'Ridhima Nair',
    childAge: '7 years',
    currentSchool: 'Oakridge International',
    counsellor: 'Pradeep K',
    counsellorAvatar: null,
    counsellorRole: 'Counsellor',
    followUpDate: '18 May 2026',
    followUpTime: '10:00 AM',
    createdDate: '18 May 2026',
    createdTime: '09:00 AM',
    lastUpdated: '18 May 2026',
    notes: '',
    convertedAt: '18 May 2026',
    conversionFeePaid: 45000,
    conversionPaymentMode: 'UPI'
  }
]

const lead = initialLeads[0]

const institutionConfig = {
  type: 'school',
  name: 'Prince Matriculation School',
  pipelineTitle: {
    school: 'Admission Pipeline',
    institute: 'Enrolment Pipeline',
    learning_center: 'Enquiry Pipeline',
  },
  moduleTitle: {
    school: 'Admission Management',
    institute: 'Enrolment Management',
    learning_center: 'Enquiry Management',
  },
}

const counsellors = [
  { id: '1', name: 'Saran Kumar', avatar: 'SK', role: 'Sales Counsellor' },
  { id: '2', name: 'Pradeep Kumar', avatar: 'PK', role: 'Senior Counsellor' },
  { id: '3', name: 'Vimal Das', avatar: 'VD', role: 'Counsellor' },
]

const relatedLeads = [
  { id: 'LD-008', name: 'Rinah Conrad', avatar: 'RC', applyingFor: 'UKG', status: 'New', date: '13 May 2026' },
]

const timeline = [
  { id: 1, icon: 'Plus', color: 'bg-blue-500', title: 'Lead created from Vidhyaan', date: '18 May 2026', time: '10:30 AM', note: '', done: true },
  { id: 2, icon: 'User', color: 'bg-purple-500', title: 'Counsellor assigned: Saran Kumar', date: '18 May 2026', time: '11:00 AM', note: '', done: true },
  { id: 3, icon: 'Phone', color: 'bg-green-500', title: 'Contacted via phone', date: '19 May 2026', time: '2:15 PM', note: 'Parent is interested, will visit on 22nd', done: true },
  { id: 4, icon: 'Calendar', color: 'bg-amber-500', title: 'Follow-up scheduled', date: '19 May 2026', time: '2:20 PM', note: 'Follow-up set for 20 May at 10:00 AM', done: true },
  { id: 5, icon: 'Clock', color: 'bg-slate-300', title: 'Follow-up due', date: '20 May 2026', time: '10:00 AM', note: '', done: false },
]

const statusConfig: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  New: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', border: 'border-blue-200' },
  Contacted: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500', border: 'border-amber-200' },
  'Follow-up': { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500', border: 'border-orange-200' },
  Converted: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', border: 'border-green-200' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
}

const priorityConfig: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  Normal: { bg: 'bg-blue-50', text: 'text-blue-700', icon: CheckCircle2 },
  High: { bg: 'bg-amber-50', text: 'text-amber-700', icon: TrendingUp },
  Urgent: { bg: 'bg-red-50', text: 'text-red-600', icon: Zap },
}

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM"
]

const sources = [
  { id: 'vidhyaan', label: 'Vidhyaan', dot: 'bg-blue-500' },
  { id: 'web', label: 'Web', dot: 'bg-slate-400' },
  { id: 'walkin', label: 'Walk-in', dot: 'bg-teal-500' },
  { id: 'phone', label: 'Phone', dot: 'bg-purple-500' },
  { id: 'whatsapp', label: 'WhatsApp', dot: 'bg-green-500' },
  { id: 'referral', label: 'Referral', dot: 'bg-pink-500' },
  { id: 'other', label: 'Other', dot: 'bg-orange-400' },
]

// Grades constants are imported from @/constants/grades

const statusDbToUi: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Contacted',
  FOLLOW_UP_PENDING: 'Follow-up',
  CONVERTED: 'Converted',
  NOT_INTERESTED: 'Rejected'
}

const statusUiToDb: Record<string, string> = {
  'New': 'NEW',
  'Contacted': 'CONTACTED',
  'Follow-up': 'FOLLOW_UP_PENDING',
  'Converted': 'CONVERTED',
  'Rejected': 'NOT_INTERESTED'
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

const sourceUiToDb: Record<string, string> = {
  'Vidhyaan': 'VIDHYAAN',
  'Web': 'WEBSITE',
  'Walk-in': 'WALK_IN',
  'Phone': 'PHONE',
  'WhatsApp': 'WHATSAPP',
  'Referral': 'REFERRAL',
  'Other': 'OTHER'
}

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const leadId = params?.id as string

  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [counsellorsList, setCounsellorsList] = useState<any[]>([])

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [trialBannerVisible, setTrialBannerVisible] = useState(true)

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false)

  // Additional editable field states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [applyingFor, setApplyingFor] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState('')
  const [currentSchool, setCurrentSchool] = useState('')
  const [source, setSource] = useState('')

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

  const currentAvatar = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || 'LD'

  // Draft states for cancellation rollback
  const [draftData, setDraftData] = useState({
    firstName: '',
    lastName: '',
    parentName: '',
    phone: '',
    email: '',
    applyingFor: '',
    academicYear: '',
    childName: '',
    childAge: '',
    currentSchool: '',
    source: '',
    status: 'New',
    priority: 'Normal',
    counsellor: 'Unassigned',
    counsellorAvatar: 'UA',
    followUpDate: '',
    followUpTime: ''
  })

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
        console.error(err)
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
        if (json.success && json.enabledModules) {
          setEnabledModules(json.enabledModules)
        }
      } catch (err) {
        console.error('Failed to fetch school-profile', err)
      }
    }

    fetchLead()
    fetchCounsellors()
    fetchModules()
  }, [leadId])

  // Sync lead details to local states
  useEffect(() => {
    if (!lead) return
    const parts = (lead.parentName || '').split(' ')
    const fName = parts[0] || ''
    const lName = parts.slice(1).join(' ') || ''
    setFirstName(fName)
    setLastName(lName)
    setParentName(lead.parentName || '')
    setPhone(lead.phone || '')
    setEmail(lead.email || '')
    setApplyingFor(lead.gradeSought || '')
    setAcademicYear(lead.academicYear?.name || 'AY 2026-27')
    setChildName(lead.kidName || '')
    setChildAge('')
    setCurrentSchool('')
    setSource(sourceDbToUi[lead.source] || 'Other')

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
          done: true
        }
      })
      setActivities(mappedActivities)
    }

  }, [lead])

  const startEditing = () => {
    setDraftData({
      firstName,
      lastName,
      parentName,
      phone,
      email,
      applyingFor,
      academicYear,
      childName,
      childAge,
      currentSchool,
      source,
      status: currentStatus,
      priority: currentPriority,
      counsellor: currentCounsellor,
      counsellorAvatar: currentCounsellorAvatar,
      followUpDate,
      followUpTime
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setFirstName(draftData.firstName)
    setLastName(draftData.lastName)
    setParentName(draftData.parentName)
    setPhone(draftData.phone)
    setEmail(draftData.email)
    setApplyingFor(draftData.applyingFor)
    setAcademicYear(draftData.academicYear)
    setChildName(draftData.childName)
    setChildAge(draftData.childAge)
    setCurrentSchool(draftData.currentSchool)
    setSource(draftData.source)
    setCurrentStatus(draftData.status)
    setCurrentPriority(draftData.priority)
    setCurrentCounsellor(draftData.counsellor)
    setCurrentCounsellorAvatar(draftData.counsellorAvatar)
    setFollowUpDate(draftData.followUpDate)
    setFollowUpTime(draftData.followUpTime)
    setIsEditing(false)
  }

  const saveEditing = async () => {
    setIsSaving(true)
    try {
      const payload: any = {
        firstName,
        lastName,
        phone,
        email: email || null,
        source: sourceUiToDb[source] || 'OTHER',
        status: statusUiToDb[currentStatus] || 'NEW',
        priority: priorityUiToDb[currentPriority] || 'MEDIUM',
        gradeSought: applyingFor || null,
        kidName: childName || null,
        assignedToId: currentCounsellor === 'Unassigned' ? null : (counsellorsList.find(c => c.name === currentCounsellor)?.id || lead?.assignedToId)
      }

      if (followUpDate) {
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
        payload.nextFollowUpAt = nextFollowUpDate ? nextFollowUpDate.toISOString() : null
      } else {
        payload.nextFollowUpAt = null
      }

      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to update lead')
      }

      const json = await res.json()
      setLead(json.data)
      setIsEditing(false)
      showToast("Lead updated")
    } catch (err: any) {
      console.error(err)
      showToast(err.message || "Failed to save changes", "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Quick Action Handlers
  const handleUpdateStatus = async (newStatusUi: string) => {
    try {
      const dbStatus = statusUiToDb[newStatusUi]
      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: dbStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      const json = await res.json()
      setLead(json.data)
      setCurrentStatus(newStatusUi)
      showToast(`Status updated to ${newStatusUi}`)
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to update status', 'error')
    }
  }

  const handleUpdateCounsellor = async (counsellorName: string) => {
    try {
      const found = counsellorsList.find(c => c.name === counsellorName)
      const counsellorId = counsellorName === 'Unassigned' ? null : found?.id

      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: counsellorId })
      })
      if (!res.ok) throw new Error('Failed to reassign counsellor')
      const json = await res.json()
      setLead(json.data)
      setCurrentCounsellor(counsellorName)
      setCurrentCounsellorAvatar(counsellorName === 'Unassigned' ? 'UA' : (counsellorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'SK'))
      showToast(`Reassigned to ${counsellorName}`)
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to reassign counsellor', 'error')
    }
  }

  // Log Activity States
  const [activityTab, setActivityTab] = useState<'note' | 'call' | 'whatsapp' | 'email'>('note')
  const [activityNote, setActivityNote] = useState('')
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false)
  const [activities, setActivities] = useState<any[]>([])

  // Modals & Dropdowns States
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [statusDropdown, setStatusDropdown] = useState(false)
  const [counsellorDropdown, setCounsellorDropdown] = useState(false)

  const [enabledModules, setEnabledModules] = useState<string[]>([])

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

  // Dropdown Refs
  const statusRef = useRef<HTMLDivElement>(null)
  const counsellorRef = useRef<HTMLDivElement>(null)

  // Escape key and Outside click handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStatusDropdown(false)
        setCounsellorDropdown(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusDropdown(false)
      }
      if (counsellorRef.current && !counsellorRef.current.contains(e.target as Node)) {
        setCounsellorDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // Save Activity Handler
  const handleSaveActivity = () => {
    if (!activityNote.trim()) return

    const tabConfig = {
      note: { icon: 'FileText', color: 'bg-slate-500', name: 'Note' },
      call: { icon: 'Phone', color: 'bg-green-500', name: 'Call' },
      whatsapp: { icon: 'MessageCircle', color: 'bg-green-600', name: 'WhatsApp chat' },
      email: { icon: 'Mail', color: 'bg-blue-500', name: 'Email' }
    }

    const newActivity = {
      id: Date.now(),
      icon: tabConfig[activityTab].icon,
      color: tabConfig[activityTab].color,
      title: `${tabConfig[activityTab].name} logged`,
      date: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      note: activityNote,
      done: true
    }

    if (scheduleFollowUp) {
      const today = new Date()
      const formattedDate = new Date(followUpDate || today).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      const followUpActivity = {
        id: Date.now() + 1,
        icon: 'Calendar',
        color: 'bg-amber-500',
        title: 'Follow-up scheduled',
        date: formattedDate,
        time: followUpTime,
        note: `Follow-up scheduled for ${formattedDate} at ${followUpTime}`,
        done: false
      }
      setActivities(prev => [followUpActivity, newActivity, ...prev])
      setFollowUpDate(formattedDate)
      setFollowUpTime(followUpTime)
      setCurrentStatus('Follow-up')
    } else {
      setActivities(prev => [newActivity, ...prev])
    }

    setActivityNote('')
    setScheduleFollowUp(false)
    showToast("Activity logged")
  }

  // Textarea Ctrl+Enter listener
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      handleSaveActivity()
    }
  }


  // ===================================================================
  // COMPONENT CARDS (HELPERS)
  // ===================================================================

  const ContactDetailsCard = ({}: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 text-left">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
        CONTACT DETAILS
      </h4>
      <div className="space-y-1 divide-y divide-slate-50">
        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-500">
            <User size={16} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Lead Name</p>
            {isEditing ? (
              <input
                type="text"
                value={`${firstName} ${lastName}`}
                onChange={(e) => {
                  const parts = e.target.value.split(' ')
                  setFirstName(parts[0] || '')
                  setLastName(parts.slice(1).join(' ') || '')
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 mt-1"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{firstName} {lastName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-500">
            <Users size={16} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Parent Name</p>
            {isEditing ? (
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 mt-1"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{parentName}</p>
            )}
          </div>
        </div>

        {/* Child Name / Student Name */}
        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-500">
            <User size={16} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Child Name</p>
            {isEditing ? (
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 mt-1"
              />
            ) : (
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{childName || '—'}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500">
            <Phone size={16} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Phone</p>
            {isEditing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 mt-1"
              />
            ) : (
              <p className="text-sm font-medium text-slate-700 mt-0.5">{phone}</p>
            )}
          </div>
          {!isEditing && (
            <a href={`tel:${phone}`} className="text-xs font-semibold text-[#1565D8] ml-auto hover:underline">
              Call →
            </a>
          )}
        </div>

        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-500">
            <Mail size={16} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Email</p>
            {isEditing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 mt-1"
              />
            ) : (
              <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">{email}</p>
            )}
          </div>
          {!isEditing && (
            <a href={`mailto:${email}`} className="text-xs font-semibold text-[#1565D8] ml-auto hover:underline">
              Email →
            </a>
          )}
        </div>

        <div className="flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 text-green-500">
            <MessageCircle size={16} strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">WhatsApp</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5">Send Message</p>
          </div>
          {!isEditing && (
            <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#1565D8] ml-auto hover:underline">
              Chat →
            </a>
          )}
        </div>
      </div>
    </Card>
  )

  const LeadDetailsCard = ({}: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 text-left">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
        LEAD DETAILS
      </h4>
      <div className="space-y-0 divide-y divide-slate-50">
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Lead ID</span>
          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{lead?.leadCode}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Source</span>
          {isEditing ? (
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            >
              {sources.map(s => (
                <option key={s.id} value={s.label}>{s.label}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-medium border border-slate-200 bg-slate-50 rounded-full px-2.5 py-0.5 text-slate-600">
              {source}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Status</span>
          {isEditing ? (
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            >
              {Object.keys(statusConfig).map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          ) : (
            <div className="relative" ref={statusRef}>
              <span
                onClick={() => setStatusDropdown(!statusDropdown)}
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer ${statusConfig[currentStatus]?.bg || 'bg-slate-100'} ${statusConfig[currentStatus]?.text || 'text-slate-800'} ${statusConfig[currentStatus]?.border || 'border-slate-200'}`}
              >
                {currentStatus}
              </span>
              {statusDropdown && (
                <div className="absolute right-0 top-full mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px]">
                  {Object.keys(statusConfig).map((st) => (
                    <div
                      key={st}
                      onClick={() => {
                        handleUpdateStatus(st)
                        setStatusDropdown(false)
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer text-slate-700"
                    >
                      <span className={`w-2 h-2 rounded-full ${statusConfig[st]?.dot || 'bg-slate-500'}`} />
                      <span>{st}</span>
                      {currentStatus === st && <Check size={14} className="ml-auto text-slate-400" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Priority</span>
          {isEditing ? (
            <select
              value={currentPriority}
              onChange={(e) => setCurrentPriority(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            >
              {Object.keys(priorityConfig).map(pr => (
                <option key={pr} value={pr}>{pr}</option>
              ))}
            </select>
          ) : (
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${priorityConfig[currentPriority]?.bg || 'bg-slate-100'} ${priorityConfig[currentPriority]?.text || 'text-slate-800'} border-transparent`}>
              {currentPriority}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Created</span>
          <span className="text-xs font-semibold text-slate-700">{lead?.createdAt ? new Date(lead.createdAt).toLocaleString('en-IN') : '—'}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Updated</span>
          <span className="text-xs font-semibold text-slate-700">{lead?.updatedAt ? new Date(lead.updatedAt).toLocaleString('en-IN') : '—'}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Counsellor</span>
          {isEditing ? (
            <select
              value={currentCounsellor}
              onChange={(e) => {
                const val = e.target.value
                setCurrentCounsellor(val)
                if (val === 'Unassigned') {
                  setCurrentCounsellorAvatar('UA')
                } else {
                  const found = counsellorsList.find(c => c.name === val)
                  setCurrentCounsellorAvatar(found ? found.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'UA')
                }
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            >
              <option value="Unassigned">Unassigned</option>
              {counsellorsList.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center">
                {currentCounsellorAvatar}
              </div>
              <span className="text-sm font-semibold text-slate-700">{currentCounsellor}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )

  const EnquiryInfoCard = ({}: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 text-left">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
        ENQUIRY INFORMATION
      </h4>
      <div className="space-y-0 divide-y divide-slate-50">
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Applying For</span>
          {isEditing ? (
            <select
              value={applyingFor}
              onChange={(e) => setApplyingFor(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            >
              <option value="">Select Grade</option>
              {GRADE_OPTIONS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
              {applyingFor && !GRADE_OPTIONS.some(opt => opt.value === applyingFor) && (
                <option value={applyingFor}>{getGradeLabel(applyingFor)}</option>
              )}
            </select>
          ) : (
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{getGradeLabel(applyingFor)}</span>
          )}
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Academic Year</span>
          {isEditing ? (
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            >
              <option value="AY 2026-27">AY 2026-27</option>
              <option value="AY 2025-26">AY 2025-26</option>
            </select>
          ) : (
            <span className="text-sm font-semibold text-slate-700">{academicYear}</span>
          )}
        </div>

        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Child Age</span>
          {isEditing ? (
            <input
              type="text"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            />
          ) : (
            <span className="text-sm font-semibold text-slate-700">{childAge}</span>
          )}
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Current School</span>
          {isEditing ? (
            <input
              type="text"
              value={currentSchool}
              onChange={(e) => setCurrentSchool(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            />
          ) : (
            <span className={`text-sm font-semibold ${currentSchool ? "text-slate-700" : "text-slate-300"}`}>
              {currentSchool || "—"}
            </span>
          )}
        </div>
      </div>
    </Card>
  )

  const TimelineCard = ({}: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 text-left">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          ACTIVITY TIMELINE
        </h4>
        <span className="text-xs text-slate-400 font-medium">{activities.length} activities</span>
      </div>

      <div className="relative pl-8">
        <div className="absolute left-[15px] top-3 bottom-3 w-px bg-slate-100" />
        <div className="space-y-6">
          {activities.map((act) => {
            const Icon = getTimelineIcon(act.icon)
            return (
              <div key={act.id} className="relative flex gap-4 pb-6 last:pb-0">
                <div className={`absolute -left-8 top-0.5 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0 ${act.done ? act.color : "bg-slate-100 border-slate-200"}`}>
                  <Icon size={13} className={act.done ? "text-white" : "text-slate-400"} strokeWidth={act.done ? 2 : 1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">{act.title}</span>
                    {!act.done && (
                      <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Upcoming
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{act.date} at {act.time}</p>
                  {act.note && (
                    <div className="bg-slate-50 rounded-lg border-l-2 border-slate-200 px-3 py-2.5 text-sm text-slate-600 font-medium leading-relaxed mt-2">
                      {act.note}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )

  const LogActivityCard = ({}: { isMobile?: boolean }) => {
    const tabConfigs = {
      note: { icon: FileText, color: 'text-slate-500', label: 'Note', ph: 'Add a note about this lead...' },
      call: { icon: Phone, color: 'text-green-500', label: 'Call', ph: 'Log call details and outcome...' },
      whatsapp: { icon: MessageCircle, color: 'text-green-500', label: 'WhatsApp', ph: 'Log WhatsApp conversation...' },
      email: { icon: Mail, color: 'text-blue-500', label: 'Email', ph: 'Log email summary...' }
    }

    return (
      <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 text-left">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
          LOG ACTIVITY
        </h4>

        {/* Tab Row */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1 mb-5">
          {(['note', 'call', 'whatsapp', 'email'] as const).map((tab) => {
            const Icon = tabConfigs[tab].icon
            return (
              <button
                key={tab}
                onClick={() => setActivityTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${activityTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <Icon size={13} className={tabConfigs[tab].color} strokeWidth={1.5} />
                <span>{tabConfigs[tab].label}</span>
              </button>
            )
          })}
        </div>

        {/* Textarea */}
        <textarea
          value={activityNote}
          onChange={(e) => setActivityNote(e.target.value.slice(0, 500))}
          onKeyDown={handleTextareaKeyDown}
          placeholder={tabConfigs[activityTab].ph}
          rows={4}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-1 focus:ring-[#1565D8]/10 resize-none"
        />
        <p className="text-right text-xs text-slate-400 mt-1">{activityNote.length}/500</p>

        {/* Schedule Follow-up toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer mt-3 w-fit select-none">
          <input
            type="checkbox"
            checked={scheduleFollowUp}
            onChange={(e) => setScheduleFollowUp(e.target.checked)}
            className="w-4 h-4 rounded text-[#1565D8] accent-[#1565D8] border-slate-300"
          />
          <span className="text-sm font-medium text-slate-600">Schedule a follow-up</span>
        </label>

        {scheduleFollowUp && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <input
                type="date"
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#1565D8] focus:outline-none"
              />
            </div>
            <div>
              <select
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#1565D8] focus:outline-none"
              >
                {timeSlots.map((ts) => (
                  <option key={ts} value={ts}>{ts}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-between items-center">
          <span className="text-[10px] text-slate-400 hidden md:block">Tip: Ctrl+Enter to save</span>
          <button
            onClick={handleSaveActivity}
            className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition ml-auto"
          >
            <Check size={14} strokeWidth={1.5} />
            <span>Save</span>
          </button>
        </div>
      </Card>
    )
  }

  const MoveStageCard = ({}: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-left">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
        MOVE STAGE
      </h4>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-400">Current:</span>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig[currentStatus].bg} ${statusConfig[currentStatus].text} ${statusConfig[currentStatus].border}`}>
          {currentStatus}
        </span>
      </div>

      <div className="space-y-2">
        {/* Mark as Contacted */}
        {(currentStatus === 'New' || currentStatus === 'Follow-up') && (
          <button
            onClick={() => {
              setCurrentStatus('Contacted')
              showToast("Lead status updated to Contacted")
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 font-semibold text-sm cursor-pointer hover:opacity-90 transition"
          >
            <MessageCircle size={16} className="text-amber-500" strokeWidth={1.5} />
            <span>Mark as Contacted</span>
            <ChevronRight size={14} className="ml-auto" />
          </button>
        )}

        {/* Schedule Follow-up */}
        {currentStatus !== 'Follow-up' && currentStatus !== 'Converted' && currentStatus !== 'Rejected' && (
          <button
            onClick={() => {
              setCurrentStatus('Follow-up')
              showToast("Status updated to Follow-up")
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-orange-200 bg-orange-50 text-orange-800 font-semibold text-sm cursor-pointer hover:opacity-90 transition"
          >
            <Calendar size={16} className="text-orange-500" strokeWidth={1.5} />
            <span>Schedule Follow-up</span>
            <ChevronRight size={14} className="ml-auto" />
          </button>
        )}



        {/* Reject Lead */}
        {currentStatus !== 'Rejected' && currentStatus !== 'Converted' && (
          <button
            onClick={() => setShowRejectModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-100 bg-white text-red-500 font-semibold text-sm cursor-pointer hover:opacity-90 transition"
          >
            <XCircle size={16} className="text-red-400" strokeWidth={1.5} />
            <span>Reject Lead</span>
            <ChevronRight size={14} className="ml-auto" />
          </button>
        )}
      </div>
    </Card>
  )

  const FollowUpCard = ({}: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-left">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
        FOLLOW-UP
      </h4>
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2.5 text-left">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-amber-500" strokeWidth={1.5} />
            <span className="text-xs text-slate-500">Scheduled:</span>
            {!isEditing && <span className="text-sm font-bold text-slate-800 ml-auto">{followUpDate}</span>}
          </div>
          {isEditing && (
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-amber-500" strokeWidth={1.5} />
            <span className="text-xs text-slate-500">Time:</span>
            {!isEditing && <span className="text-sm font-bold text-slate-800 ml-auto">{followUpTime}</span>}
          </div>
          {isEditing && (
            <select
              value={followUpTime}
              onChange={(e) => setFollowUpTime(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            >
              {timeSlots.map((ts) => (
                <option key={ts} value={ts}>{ts}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      {!isEditing && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setScheduleFollowUp(true)
              showToast("Open log activity to reschedule", "info")
            }}
            className="border border-slate-200 bg-white text-slate-600 text-xs font-semibold py-2.5 rounded-lg text-center flex items-center justify-center gap-1.5 hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw size={12} strokeWidth={1.5} />
            <span>Reschedule</span>
          </button>
          <button
            onClick={() => {
              setCurrentStatus('Contacted')
              showToast("Follow-up marked done")
            }}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Check size={12} strokeWidth={1.5} />
            <span>Mark Done</span>
          </button>
        </div>
      )}
    </Card>
  )

  const CounsellorCard = ({}: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-left" ref={counsellorRef}>
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
        ASSIGNED COUNSELLOR
      </h4>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
          {currentCounsellorAvatar}
        </div>
        <div>
          <h5 className="text-sm font-bold text-slate-800">{currentCounsellor}</h5>
          <p className="text-xs text-slate-400 mt-0.5">Counsellor</p>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={() => setCounsellorDropdown(!counsellorDropdown)}
          className="w-full border border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100 transition cursor-pointer"
        >
          <UserPlus size={14} strokeWidth={1.5} />
          <span>Reassign Counsellor</span>
        </button>

        {counsellorDropdown && (
          <div className="absolute left-0 bottom-full mb-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 w-full">
            {counsellorsList.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  handleUpdateCounsellor(c.name)
                  setCounsellorDropdown(false)
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer text-slate-700"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs leading-none">{c.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Counsellor</p>
                </div>
                {currentCounsellor === c.name && <Check size={14} className="ml-auto text-slate-400" />}
              </div>
            ))}
            <div className="border-t border-slate-200 my-1" />
            <button
              onClick={() => {
                handleUpdateCounsellor("Unassigned")
                setCounsellorDropdown(false)
              }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
            >
              Remove assignment
            </button>
          </div>
        )}
      </div>
    </Card>
  )

  const RelatedLeadsCard = ({}: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-left">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
        RELATED LEADS
      </h4>
      <p className="text-xs text-slate-400 mb-3">From same phone number</p>

      <div className="space-y-2">
        {relatedLeads.map((rl) => (
          <div key={rl.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-3 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {rl.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="text-sm font-semibold text-slate-700 truncate">{rl.name}</h5>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {rl.applyingFor} · {rl.status} · {rl.date}
              </p>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </div>
        ))}
      </div>
    </Card>
  )

  if (loading) {
    return <RecordSkeleton />
  }

  return (
    <>
      {/* TRIAL BANNER */}
      {trialBannerVisible && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 md:px-8 flex flex-col md:flex-row gap-2 md:gap-4 animate-fade-in w-full mb-6">
          <div className="flex items-start md:items-center gap-2 w-full md:w-auto text-left">
            <Crown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 md:mt-0" strokeWidth={1.5} />
            <p className="text-xs md:text-sm text-amber-800 font-medium leading-relaxed">
              🎉 7-Day Free Trial of Vidhyaan Premium is active!{" "}
              <span className="text-[#92400E] font-bold">Trial ends in 7 days.</span>
            </p>
            <button onClick={() => setTrialBannerVisible(false)} className="p-1 rounded text-amber-500 hover:text-amber-700 ml-auto md:hidden transition shrink-0">
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto md:ml-auto shrink-0">
            <span className="text-xs md:text-sm font-semibold text-[#1565D8] underline cursor-pointer hover:text-blue-700 whitespace-nowrap">
              See features
            </span>
            <button className="bg-[#1565D8] text-white text-xs md:text-sm font-semibold px-4 md:px-5 py-2 h-8 md:h-9 flex-1 md:flex-initial rounded-lg hover:bg-blue-700 transition duration-200 whitespace-nowrap">
              Activate Premium
            </button>
            <button onClick={() => setTrialBannerVisible(false)} className="p-1 rounded text-amber-500 hover:text-amber-700 hidden md:block transition">
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER CONTENT */}
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-5 lg:space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* SECTION 1 — PAGE HEADER CARD */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* LEFT */}
              <div className="flex items-start gap-4">
                <button
                  onClick={() => router.back()}
                  className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 hover:bg-slate-50 transition cursor-pointer"
                >
                  <ChevronLeft size={18} className="text-slate-500" strokeWidth={1.5} />
                </button>

                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-100 text-blue-700 text-sm md:text-base font-bold flex items-center justify-center flex-shrink-0">
                  {currentAvatar}
                </div>

                <div className="min-w-0">
                  <h3 className="text-base md:text-lg lg:text-xl font-bold text-slate-800 Poppins leading-tight">
                    {firstName} {lastName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs md:text-sm text-slate-400">
                    <span>{parentName}</span>
                    <span className="text-slate-200">·</span>
                    <span>{applyingFor}</span>
                    <span className="text-slate-200">·</span>
                    <span>{source}</span>
                    <span className="text-slate-200">·</span>
                    <span>{lead?.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : '—'}</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold font-mono px-2.5 py-1 rounded-md mt-2">
                    <Hash size={11} strokeWidth={1.5} />
                    <span>{lead?.leadCode}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                {!isEditing && currentStatus !== 'Converted' && currentStatus !== 'Rejected' && enabledModules.includes('admission_management') && (
                  <button
                    onClick={() => setShowConvertModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 border-[1.5px] border-[#1565D8] rounded-lg text-[#1565D8] text-sm font-medium bg-white hover:bg-blue-50 transition cursor-pointer"
                  >
                    <span>Convert to Admission</span>
                    <ArrowRight size={14} className="text-[#1565D8]" strokeWidth={1.5} />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (isEditing) cancelEditing()
                    else startEditing()
                  }}
                  className={`flex items-center gap-1.5 border text-sm font-semibold px-4 py-2 rounded-lg transition ${isEditing ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  <Pencil size={14} strokeWidth={1.5} />
                  <span>Edit Lead</span>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition">
                      <MoreVertical size={16} className="text-slate-500" strokeWidth={1.5} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl border border-slate-200 shadow-lg p-1.5">
                    <DropdownMenuItem onClick={() => {
                      navigator.clipboard.writeText(lead?.leadCode || '')
                      showToast("Lead ID copied")
                    }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                      <Copy size={14} strokeWidth={1.5} className="text-slate-400" />
                      Copy Lead ID
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      showToast("Lead exported")
                    }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                      <Download size={14} strokeWidth={1.5} className="text-slate-400" />
                      Export Lead
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => startEditing()} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                      <Pencil size={14} strokeWidth={1.5} className="text-slate-400" />
                      Edit Lead
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/lead-management')} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                      <ArrowLeft size={14} strokeWidth={1.5} className="text-slate-400" />
                      Back to List
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowRejectModal(true)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 cursor-pointer">
                      <XCircle size={14} strokeWidth={1.5} className="text-red-400" />
                      Reject Lead
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      try {
                        const deleteRes = await fetch(`/api/v1/leads/${leadId}`, {
                          method: 'DELETE'
                        })
                        if (!deleteRes.ok) throw new Error('Failed to delete lead')
                        showToast("Lead deleted", "info")
                        router.push('/lead-management')
                      } catch (err: any) {
                        console.error(err)
                        showToast(err.message || "Failed to delete lead", "error")
                      }
                    }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 cursor-pointer">
                      <Trash2 size={14} strokeWidth={1.5} className="text-red-400" />
                      Delete Lead
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* ROW 2 */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2">
              {/* CHIP 1 — STATUS (interactive) */}
              <div className="relative" ref={statusRef}>
                <button
                  onClick={() => setStatusDropdown(!statusDropdown)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition ${statusConfig[currentStatus].bg} ${statusConfig[currentStatus].text} ${statusConfig[currentStatus].border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[currentStatus].dot}`} />
                  <span>{currentStatus}</span>
                  <ChevronDown size={13} className="ml-0.5" strokeWidth={1.5} />
                </button>
                {statusDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px]">
                    {Object.keys(statusConfig).map((st) => (
                      <div
                        key={st}
                        onClick={() => {
                          setCurrentStatus(st)
                          setStatusDropdown(false)
                          showToast(`Status updated to ${st}`)
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer text-slate-700"
                      >
                        <span className={`w-2 h-2 rounded-full ${statusConfig[st].dot}`} />
                        <span>{st}</span>
                        {currentStatus === st && <Check size={14} className="ml-auto text-slate-400" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CHIP 2 — PRIORITY */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-transparent text-xs font-semibold ${priorityConfig[currentPriority].bg} ${priorityConfig[currentPriority].text}`}>
                {React.createElement(priorityConfig[currentPriority].icon, { size: 12, strokeWidth: 1.5 })}
                <span>{currentPriority} Priority</span>
              </div>

              {/* CHIP 3 — FOLLOW-UP */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700">
                <Calendar size={12} className="text-amber-500" strokeWidth={1.5} />
                <span>Follow-up: {followUpDate} · {followUpTime}</span>
              </div>

              {/* CHIP 4 — COUNSELLOR (interactive) */}
              <div className="relative" ref={counsellorRef}>
                <button
                  onClick={() => setCounsellorDropdown(!counsellorDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center">
                    {currentCounsellorAvatar}
                  </div>
                  <span>{currentCounsellor}</span>
                  <ChevronDown size={11} className="text-slate-400" strokeWidth={1.5} />
                </button>
                {counsellorDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[200px]">
                    {counsellors.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setCurrentCounsellor(c.name)
                          setCurrentCounsellorAvatar(c.avatar)
                          setCounsellorDropdown(false)
                          showToast(`Reassigned to ${c.name}`)
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer text-slate-700"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {c.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs leading-none">{c.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{c.role}</p>
                        </div>
                        {currentCounsellor === c.name && <Check size={14} className="ml-auto text-slate-400" />}
                      </div>
                    ))}
                    <div className="border-t border-slate-200 my-1" />
                    <button
                      onClick={() => {
                        setCurrentCounsellor("Unassigned")
                        setCurrentCounsellorAvatar("UA")
                        setCounsellorDropdown(false)
                        showToast("Counsellor assignment removed", "info")
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      Remove assignment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Sticky Editing Bar */}
          {isEditing && (
            <div className="sticky top-16 z-10 bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 mb-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Pencil size={14} className="text-[#1565D8]" strokeWidth={1.5} />
                <span className="text-sm font-semibold text-[#1565D8]">Editing lead details</span>
                <span className="text-xs text-slate-400">· Changes not saved yet</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => cancelEditing()}
                  className="border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveEditing()}
                  disabled={isSaving}
                  className={`bg-[#1565D8] text-white text-sm font-semibold px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin size-4 mr-2" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={1.5} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* MOBILE VIEW (< md) */}
          <div className="block md:hidden space-y-4">
            <MoveStageCard isMobile />
            <FollowUpCard isMobile />
            <ContactDetailsCard isMobile />
            <LeadDetailsCard isMobile />
            <EnquiryInfoCard isMobile />
            <TimelineCard isMobile />
            <LogActivityCard isMobile />
            <CounsellorCard isMobile />
            {relatedLeads.length > 0 && <RelatedLeadsCard isMobile />}
          </div>

          {/* TABLET / DESKTOP VIEW (>= md) */}
          <div className="hidden md:grid grid-cols-1 gap-5 md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr_260px] xl:grid-cols-[300px_1fr_280px]">
            {/* Left Column */}
            <div className="space-y-5 lg:sticky lg:top-24 col-span-1">
              <ContactDetailsCard />
              <LeadDetailsCard />
              <EnquiryInfoCard />
            </div>

            {/* Center Column */}
            <div className="space-y-5 col-span-1">
              <TimelineCard />
              <LogActivityCard />
            </div>

            {/* Right Column */}
            <div className="space-y-5 lg:sticky lg:top-24 col-span-1 md:col-span-2 lg:col-span-1">
              <MoveStageCard />
              <FollowUpCard />
              <CounsellorCard />
              {relatedLeads.length > 0 && <RelatedLeadsCard />}
            </div>
          </div>
        </div>

        {/* DIALOG MODALS */}
        {/* CONVERT MODAL */}
        {lead && (
          <ConvertToAdmissionModal
            lead={lead}
            isOpen={showConvertModal}
            onClose={() => setShowConvertModal(false)}
            onSuccess={(admissionId) => {
              setCurrentStatus('Converted')
              showToast("Lead converted to admission!")
              router.push(`/admission-management/${admissionId}`)
            }}
          />
        )}

        {/* REJECT MODAL */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent className="max-w-sm w-full rounded-2xl p-6 text-left">
            <DialogHeader className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <XCircle size={20} className="text-red-500" />
              </div>
              <DialogTitle className="text-lg font-bold Poppins">Reject This Lead?</DialogTitle>
            </DialogHeader>

            <DialogDescription className="text-sm text-slate-500 leading-relaxed mb-5">
              Are you sure you want to reject {firstName} {lastName}? This will move them out of the active pipeline.
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
                <option value="" disabled>Select reason (optional)</option>
                <option value="not_interested">Not interested</option>
                <option value="budget">Budget constraints</option>
                <option value="another_school">Chose another school</option>
                <option value="no_contact">Could not be contacted</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-3 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Keep Lead
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/v1/leads/${leadId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        status: 'NOT_INTERESTED'
                      })
                    })
                    if (!res.ok) throw new Error('Failed to reject lead')

                    if (rejectReason) {
                      await fetch(`/api/v1/leads/${leadId}/activities`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'STATUS_CHANGE',
                          summary: `Rejected with reason: ${rejectReason}`
                        })
                      })
                    }

                    setCurrentStatus('Rejected')
                    setShowRejectModal(false)
                    showToast("Lead rejected", "info")

                    const detailRes = await fetch(`/api/v1/leads/${leadId}`)
                    if (detailRes.ok) {
                      const json = await detailRes.json()
                      setLead(json.data)
                    }
                  } catch (err: any) {
                    console.error(err)
                    showToast(err.message || "Failed to reject lead", "error")
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Trash2 size={16} strokeWidth={1.5} />
                Reject
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* TOAST NOTIFICATION */}
        <div
          className={`fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:translate-x-0 z-50 transform transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'}`}
        >
          <div className="flex items-center gap-3 bg-slate-800 text-white rounded-xl px-5 py-3 shadow-2xl min-w-[260px] max-w-[360px] ml-auto">
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-green-400" strokeWidth={1.5} />}
            {toast.type === 'info' && <Info size={16} className="text-blue-400" strokeWidth={1.5} />}
            {toast.type === 'error' && <XCircle size={16} className="text-red-400" strokeWidth={1.5} />}

            <span className="text-sm font-semibold font-sans">{toast.msg}</span>

            <button
              onClick={() => setToast(t => ({ ...t, show: false }))}
              className="ml-auto text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
    </>
  )
}
