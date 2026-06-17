"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Globe,
  TrendingUp,
  LineChart,
  ClipboardList,
  Users,
  CreditCard,
  UserCog,
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
  ArrowLeft
} from 'lucide-react'

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  New: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-100' },
  Contacted: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-100' },
  'Follow-up': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-orange-100' },
  Converted: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', border: 'border-green-100' },
  Rejected: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', border: 'border-red-100' },
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

const grades = [
  'LKG', 'UKG', '1st Class', '2nd Class',
  '3rd Class', '4th Class', '5th Class',
  '6th Class', '7th Class', '8th Class',
  '9th Class', '10th Class', '11th Class',
  '12th Class',
]

export default function LeadDetailPage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [salesMarketingOpen, setSalesMarketingOpen] = useState(true)
  const [trialBannerVisible, setTrialBannerVisible] = useState(true)
  const [activeNav, setActiveNav] = useState("Lead Management")

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false)

  // Additional editable field states
  const [firstName, setFirstName] = useState(lead.firstName)
  const [lastName, setLastName] = useState(lead.lastName)
  const [parentName, setParentName] = useState(lead.parentName)
  const [phone, setPhone] = useState(lead.phone)
  const [email, setEmail] = useState(lead.email)
  const [applyingFor, setApplyingFor] = useState(lead.applyingFor)
  const [academicYear, setAcademicYear] = useState(lead.academicYear)
  const [childName, setChildName] = useState(lead.childName)
  const [childAge, setChildAge] = useState(lead.childAge)
  const [currentSchool, setCurrentSchool] = useState(lead.currentSchool)
  const [source, setSource] = useState(lead.source)

  // Lead States
  const [currentStatus, setCurrentStatus] = useState(lead.status)
  const [currentPriority, setCurrentPriority] = useState(lead.priority)
  const [currentCounsellor, setCurrentCounsellor] = useState(lead.counsellor)
  const [currentCounsellorAvatar, setCurrentCounsellorAvatar] = useState(lead.counsellorAvatar)
  const [followUpDate, setFollowUpDate] = useState(lead.followUpDate)
  const [followUpTime, setFollowUpTime] = useState(lead.followUpTime)

  const currentAvatar = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || 'LD'

  // Draft states for cancellation rollback
  const [draftData, setDraftData] = useState({
    firstName: lead.firstName,
    lastName: lead.lastName,
    parentName: lead.parentName,
    phone: lead.phone,
    email: lead.email,
    applyingFor: lead.applyingFor,
    academicYear: lead.academicYear,
    childName: lead.childName,
    childAge: lead.childAge,
    currentSchool: lead.currentSchool,
    source: lead.source,
    status: lead.status,
    priority: lead.priority,
    counsellor: lead.counsellor,
    counsellorAvatar: lead.counsellorAvatar,
    followUpDate: lead.followUpDate,
    followUpTime: lead.followUpTime
  })

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

  const saveEditing = () => {
    setIsEditing(false)
    showToast("Lead updated")
  }

  // Log Activity States
  const [activityTab, setActivityTab] = useState<'note' | 'call' | 'whatsapp' | 'email'>('note')
  const [activityNote, setActivityNote] = useState('')
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false)
  const [activities, setActivities] = useState(timeline)

  // Modals & Dropdowns States
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [statusDropdown, setStatusDropdown] = useState(false)
  const [counsellorDropdown, setCounsellorDropdown] = useState(false)

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

  // Layout module mapping
  const moduleTitle = institutionConfig.moduleTitle[institutionConfig.type as keyof typeof institutionConfig.moduleTitle]

  // ===================================================================
  // COMPONENT CARDS (HELPERS)
  // ===================================================================

  const ContactDetailsCard = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:p-6 text-left">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
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

  const LeadDetailsCard = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:p-6 text-left">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
        LEAD DETAILS
      </h4>
      <div className="space-y-0 divide-y divide-slate-50">
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Lead ID</span>
          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{lead.id}</span>
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
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer ${statusConfig[currentStatus].bg} ${statusConfig[currentStatus].text} ${statusConfig[currentStatus].border}`}
              >
                {currentStatus}
              </span>
              {statusDropdown && (
                <div className="absolute right-0 top-full mt-1.5 z-20 bg-white rounded-xl border border-slate-100 shadow-lg p-1.5 min-w-[160px]">
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
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${priorityConfig[currentPriority].bg} ${priorityConfig[currentPriority].text} border-transparent`}>
              {currentPriority}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Created</span>
          <span className="text-xs font-semibold text-slate-700">{lead.createdDate} {lead.createdTime}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-xs font-medium text-slate-400">Updated</span>
          <span className="text-xs font-semibold text-slate-700">{lead.lastUpdated}</span>
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
                  const found = counsellors.find(c => c.name === val)
                  setCurrentCounsellorAvatar(found ? found.avatar : 'UA')
                }
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            >
              <option value="Unassigned">Unassigned</option>
              {counsellors.map(c => (
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

  const EnquiryInfoCard = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:p-6 text-left">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
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
              {grades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{applyingFor}</span>
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
          <span className="text-xs font-medium text-slate-400">Child Name</span>
          {isEditing ? (
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
            />
          ) : (
            <span className="text-sm font-semibold text-slate-700">{childName}</span>
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

  const TimelineCard = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:p-6 text-left">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
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

  const LogActivityCard = ({ isMobile = false }: { isMobile?: boolean }) => {
    const tabConfigs = {
      note: { icon: FileText, color: 'text-slate-500', label: 'Note', ph: 'Add a note about this lead...' },
      call: { icon: Phone, color: 'text-green-500', label: 'Call', ph: 'Log call details and outcome...' },
      whatsapp: { icon: MessageCircle, color: 'text-green-500', label: 'WhatsApp', ph: 'Log WhatsApp conversation...' },
      email: { icon: Mail, color: 'text-blue-500', label: 'Email', ph: 'Log email summary...' }
    }

    return (
      <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:p-6 text-left">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
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

  const MoveStageCard = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-left">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
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

        {/* Convert to Admission */}
        {currentStatus !== 'Converted' && currentStatus !== 'Rejected' && (
          <button
            onClick={() => setShowConvertModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-transparent bg-[#1565D8] text-white font-bold text-sm cursor-pointer hover:opacity-90 transition shadow-sm"
          >
            <ArrowRight size={16} className="text-white" strokeWidth={1.5} />
            <span>Convert to Admission</span>
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

  const FollowUpCard = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-left">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
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

  const CounsellorCard = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-left" ref={counsellorRef}>
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
        ASSIGNED COUNSELLOR
      </h4>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
          {currentCounsellorAvatar}
        </div>
        <div>
          <h5 className="text-sm font-bold text-slate-800">{currentCounsellor}</h5>
          <p className="text-xs text-slate-400 mt-0.5">{lead.counsellorRole}</p>
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
          <div className="absolute left-0 bottom-full mb-1.5 z-20 bg-white rounded-xl border border-slate-100 shadow-lg p-1.5 w-full">
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
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                  {c.avatar}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs leading-none">{c.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{c.role}</p>
                </div>
                {currentCounsellor === c.name && <Check size={14} className="ml-auto text-slate-400" />}
              </div>
            ))}
            <div className="border-t border-slate-100 my-1" />
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
    </Card>
  )

  const RelatedLeadsCard = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-left">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
        RELATED LEADS
      </h4>
      <p className="text-xs text-slate-400 mb-3">From same phone number</p>

      <div className="space-y-2">
        {relatedLeads.map((rl) => (
          <div key={rl.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-3 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#1565D8]/10 text-[#1565D8] text-xs font-bold flex items-center justify-center flex-shrink-0">
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

  // ===================================================================
  // SIDEBAR COMPONENT
  // ===================================================================
  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-white select-none">
      <div className={`flex items-center gap-3 px-6 pt-6 pb-2 ${!isMobile ? "md:px-3 lg:px-6 md:justify-center lg:justify-start" : ""}`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] shrink-0">
          <Shield className="w-8 h-8 fill-[#1565D8]" strokeWidth={1.5} />
        </div>
        <div className={`flex flex-col min-w-0 ${!isMobile ? "md:hidden lg:flex" : ""}`}>
          <h1 className="text-[15px] font-bold text-slate-800 truncate leading-tight">
            Prince Matriculation
          </h1>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">School Portal</span>
        </div>
      </div>
      <div className={`border-b border-slate-100 mt-4 mb-4 mx-4 ${!isMobile ? "md:mx-2 lg:mx-4" : ""}`} />

      <div className="flex-1 px-2 overflow-y-auto space-y-1">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "Dashboard" ? 'bg-blue-50 text-[#1565D8] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
          title="Dashboard"
        >
          <LayoutDashboard className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Dashboard</span>
        </Link>

        {/* Site Manager */}
        <Link
          href="/site-manager"
          onClick={() => {
            setActiveNav("Site Manager")
            if (isMobile) setMobileMenuOpen(false)
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "Site Manager" ? 'bg-blue-50 text-[#1565D8] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
          title="Site Manager"
        >
          <Globe className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Site Manager</span>
        </Link>

        {/* Sales & Marketing (Collapsible) */}
        <div>
          <button
            onClick={() => setSalesMarketingOpen(!salesMarketingOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""}`}
            title="Sales & Marketing"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="size-[18px] shrink-0" strokeWidth={1.5} />
              <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Sales & Marketing</span>
            </div>
            <ChevronDown className={`size-[14px] transition-transform duration-200 ${salesMarketingOpen ? 'rotate-180' : ''} ${!isMobile ? "md:hidden lg:block" : ""}`} />
          </button>

          {salesMarketingOpen && (
            <div className={`pl-8 pr-2 py-1 ${!isMobile ? "md:pl-0 md:pr-0 md:flex md:justify-center lg:pl-8 lg:pr-2 lg:block" : ""}`}>
              <Link
                href="/lead-management"
                className={`w-full flex items-center gap-3 py-2 text-sm font-medium text-left transition-all ${!isMobile ? "md:justify-center lg:justify-start" : ""} ${activeNav === "Lead Management" ? 'text-[#1565D8] font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                title="Lead Management"
              >
                <LineChart className="size-[16px] shrink-0" strokeWidth={1.5} />
                <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Lead Management</span>
              </Link>
            </div>
          )}
        </div>

        {/* Dynamic module */}
        <Link
          href="/admissions"
          onClick={() => {
            setActiveNav("Module Management")
            if (isMobile) setMobileMenuOpen(false)
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "Module Management" ? 'bg-blue-50 text-[#1565D8] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
          title={moduleTitle}
        >
          <ClipboardList className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`truncate ${!isMobile ? "md:hidden lg:inline" : ""}`}>{moduleTitle}</span>
        </Link>

        {/* Student Management */}
        <Link
          href="/students"
          onClick={() => {
            setActiveNav("Student Management")
            if (isMobile) setMobileMenuOpen(false)
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "Student Management" ? 'bg-blue-50 text-[#1565D8] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
          title="Student Management"
        >
          <Users className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Student Management</span>
        </Link>

        {/* Fee Management */}
        <Link
          href="/fees"
          onClick={() => {
            setActiveNav("Fee Management")
            if (isMobile) setMobileMenuOpen(false)
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "Fee Management" ? 'bg-blue-50 text-[#1565D8] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
          title="Fee Management"
        >
          <CreditCard className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Fee Management</span>
        </Link>

        {/* User & Role Management */}
        <Link
          href="/users"
          onClick={() => {
            setActiveNav("User & Role Management")
            if (isMobile) setMobileMenuOpen(false)
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "User & Role Management" ? 'bg-blue-50 text-[#1565D8] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
          title="User & Role Management"
        >
          <UserCog className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>User & Role Management</span>
        </Link>
      </div>

      {/* Sidebar Footer */}
      <div className={`mt-auto pt-4 border-t border-slate-100 p-4 bg-slate-50/50 flex flex-col gap-2 ${!isMobile ? "md:p-1 md:items-center lg:p-4 lg:items-start" : ""}`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest text-slate-400 ${!isMobile ? "md:hidden lg:block" : ""}`}>PLAN STATUS</span>
        <Badge className={`bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full w-fit hover:bg-amber-100 border-0 shadow-none ${!isMobile ? "md:hidden lg:flex" : ""}`}>
          Free Plan
        </Badge>
        <p className={`text-xs text-slate-500 mt-1 leading-relaxed ${!isMobile ? "md:hidden lg:block" : ""}`}>
          Unlock all premium features like Lead automation & fee collections.
        </p>
        <button className={`w-full bg-[#1565D8] text-white text-sm font-semibold py-2.5 h-auto rounded-lg mt-2 hover:bg-blue-700 transition duration-200 ${!isMobile ? "md:hidden lg:flex" : ""}`}>
          Upgrade to Premium
        </button>
      </div>
    </div>
  )

  const formatINR = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex relative font-sans antialiased select-none">
      {/* 1. FIXED LEFT SIDEBAR */}
      <aside className="hidden md:flex w-16 lg:w-64 fixed inset-y-0 left-0 border-r border-slate-100 bg-white z-30 shadow-sm flex-col">
        <SidebarContent />
      </aside>

      {/* MOBILE TOP NAV BAR */}
      <header className="flex md:hidden h-14 bg-white border-b border-slate-100 px-4 items-center justify-between fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[#1565D8]">
            <Shield className="w-5 h-5 fill-[#1565D8]" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-bold text-slate-800 tracking-tight truncate max-w-[120px]">
            {institutionConfig.name}
          </span>
        </div>
        <span className="text-xs font-bold text-slate-800">View Lead</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => setMobileMenuOpen(true)} className="p-1 rounded-lg text-slate-500 hover:text-slate-900">
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button className="p-1 rounded-lg text-slate-500 hover:text-slate-900 relative">
            <Bell className="w-5 h-5" strokeWidth={1.5} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* MOBILE SIDEBAR DRAWERS */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl transform transition-transform duration-300 translate-x-0 md:hidden flex flex-col">
            <div className="absolute top-4 right-4 z-50">
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent isMobile={true} />
          </div>
        </>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-16 lg:pl-64 pt-14 md:pt-0 flex flex-col min-w-0">
        {/* DESKTOP/TABLET HEADER BAR */}
        <header className="hidden md:flex h-16 border-b border-slate-100 bg-white items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex flex-col min-w-0 text-left">
              <h2 className="text-sm lg:text-base font-bold text-slate-800 tracking-tight leading-tight">
                View Lead
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sales & Marketing › Lead Management › {lead.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="relative hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 w-48 lg:w-64">
              <Search className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-400 w-full"
                readOnly
              />
              <span className="bg-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-mono select-none">
                ⌘K
              </span>
            </div>

            <button className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 relative shrink-0">
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-2 text-left">
              <div className="w-9 h-9 rounded-full bg-[#1565D8] text-white text-sm font-bold flex items-center justify-center shrink-0">
                UA
              </div>
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-700 leading-tight truncate">User Admin</span>
                <span className="text-xs text-slate-400 leading-none truncate">School Admin</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
            </div>
          </div>
        </header>

        {/* TRIAL BANNER */}
        {trialBannerVisible && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 md:px-8 flex flex-col md:flex-row gap-2 md:gap-4 w-full">
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
        <main className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-5 lg:space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* SECTION 1 — PAGE HEADER CARD */}
          <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:p-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* LEFT */}
              <div className="flex items-start gap-4">
                <button
                  onClick={() => router.back()}
                  className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 hover:bg-slate-50 transition cursor-pointer"
                >
                  <ChevronLeft size={18} className="text-slate-500" strokeWidth={1.5} />
                </button>

                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#1565D8]/10 text-[#1565D8] text-sm md:text-base font-bold flex items-center justify-center flex-shrink-0">
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
                    <span>{lead.createdDate}</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold font-mono px-2.5 py-1 rounded-md mt-2">
                    <Hash size={11} strokeWidth={1.5} />
                    <span>{lead.id}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
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
                  <DropdownMenuContent align="end" className="w-52 rounded-xl border border-slate-100 shadow-lg p-1.5">
                    <DropdownMenuItem onClick={() => {
                      navigator.clipboard.writeText(lead.id)
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
                    <DropdownMenuItem onClick={() => {
                      showToast("Lead deleted", "info")
                      router.push('/lead-management')
                    }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 cursor-pointer">
                      <Trash2 size={14} strokeWidth={1.5} className="text-red-400" />
                      Delete Lead
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* ROW 2 */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
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
                  <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-100 shadow-lg p-1.5 min-w-[160px]">
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
                  <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-100 shadow-lg p-1.5 min-w-[200px]">
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
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                          {c.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs leading-none">{c.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{c.role}</p>
                        </div>
                        {currentCounsellor === c.name && <Check size={14} className="ml-auto text-slate-400" />}
                      </div>
                    ))}
                    <div className="border-t border-slate-100 my-1" />
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
                  className="bg-[#1565D8] text-white text-sm font-semibold px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                  <Check size={14} strokeWidth={1.5} />
                  <span>Save Changes</span>
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
        </main>

        {/* DIALOG MODALS */}
        {/* CONVERT MODAL */}
        <Dialog open={showConvertModal} onOpenChange={setShowConvertModal}>
          <DialogContent className="max-w-md w-full rounded-2xl p-6 text-left">
            <DialogHeader className="flex justify-between mb-5">
              <DialogTitle className="text-lg font-bold Poppins">Convert to Admission</DialogTitle>
            </DialogHeader>

            <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#1565D8]/10 text-[#1565D8] text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {currentAvatar}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{firstName} {lastName}</h4>
                  <span className="text-xs text-slate-400">Lead ID: {lead.id}</span>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Grade</span>
                  <span className="text-xs font-semibold text-slate-700">{applyingFor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Academic Year</span>
                  <span className="text-xs font-semibold text-slate-700">{academicYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Parent Name</span>
                  <span className="text-xs font-semibold text-slate-700">{parentName}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4 mb-2 block">
                This action will:
              </span>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">Create a new admission record</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">Assign Applicant ID (AT-XXXXX)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">Move lead status to Converted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">Notify assigned counsellor</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowConvertModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-3 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setCurrentStatus('Converted')
                  setShowConvertModal(false)
                  showToast("Lead converted to admission")
                }}
                className="flex-1 bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                Confirm & Convert →
              </button>
            </div>
          </DialogContent>
        </Dialog>

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
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm w-full focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                defaultValue=""
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
                onClick={() => {
                  setCurrentStatus('Rejected')
                  setShowRejectModal(false)
                  showToast("Lead rejected", "info")
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
      </div>
    </div>
  )
}
