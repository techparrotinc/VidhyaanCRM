"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import LoadingScreen from '@/components/LoadingScreen'
import {
  ClipboardList,
  Users,
  CreditCard,
  Shield,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Menu,
  X,
  Eye,
  Plus,
  List,
  Download,
  LayoutGrid,
  CheckSquare,
  Trash2,
  Mail,
  MessageCircle,
  Phone,
  Pencil,
  MoreVertical,
  Check,
  Info,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Circle,
  Sparkles,
  Upload,
  Columns,
  Inbox,
  FileText
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { config, type, pipeline } from '@/lib/admission-settings-config'

const moduleLabel = config.moduleLabel[type]
const idPrefix = config.idPrefix[type]

const stageShortLabel: Record<string, string> = {
  'new': 'New',
  'contacted': 'Contacted',
  'application': 'Application',
  'docs': 'Docs',
  'interview': 'Interview',
  'payment': 'Payment',
  'admitted': 'Admitted',
  'rejected': 'Rejected',
}

interface Applicant {
  id: string
  firstName: string
  lastName: string
  fullName: string
  avatar: string
  parentName: string
  childName: string
  phone: string
  email: string
  applyingFor: string
  source: string
  counsellor: string | null
  counsellorAvatar: string | null
  stage: string
  stageId: string
  stageIndex: number
  createdDate: string
  status: string
  daysInStage: number
  pendingAction: string | null
  docsUploaded: number
  docsRequired: number
  feePaid: boolean
  priority: string
}

// ===================================================================
// APPLICANTS DATA
// ===================================================================
const generateId = (seq: number) => {
  const year = new Date().getFullYear()
  return `${idPrefix}-${year}-${String(seq)
    .padStart(5, '0')}`
}

const applicants: Applicant[] = [
  {
    id: generateId(20),
    firstName: 'Suman',
    lastName: 'Manuel',
    fullName: 'Suman Manuel',
    avatar: 'SM',
    parentName: 'Manuel Raja',
    childName: 'Arjun Manuel',
    phone: '8939055488',
    email: 'suman@email.com',
    applyingFor: 'UKG',
    source: 'Web',
    counsellor: 'Vimal Das',
    counsellorAvatar: 'VD',
    stage: 'New',
    stageId: 'new',
    stageIndex: 0,
    createdDate: '30 Apr 2026',
    status: 'active',
    daysInStage: 3,
    pendingAction: null,
    docsUploaded: 0,
    docsRequired: 3,
    feePaid: false,
    priority: 'Normal',
  },
  {
    id: generateId(15),
    firstName: 'Raja',
    lastName: 'S',
    fullName: 'Raja S',
    avatar: 'RS',
    parentName: 'Suresh Raja',
    childName: 'Arjun Raja',
    phone: '9845678901',
    email: 'raja@email.com',
    applyingFor: 'Class 3',
    source: 'Vidhyaan',
    counsellor: 'Vimal Das',
    counsellorAvatar: 'VD',
    stage: 'Contacted',
    stageId: 'contacted',
    stageIndex: 1,
    createdDate: '28 Apr 2026',
    status: 'active',
    daysInStage: 5,
    pendingAction: null,
    docsUploaded: 0,
    docsRequired: 3,
    feePaid: false,
    priority: 'High',
  },
  {
    id: generateId(14),
    firstName: 'Kanna',
    lastName: 'M',
    fullName: 'Kanna M',
    avatar: 'KM',
    parentName: 'Mohan Kanna',
    childName: 'Priya Kanna',
    phone: '9823456781',
    email: 'kanna@email.com',
    applyingFor: 'Class 2',
    source: 'Web',
    counsellor: 'Saran Kumar',
    counsellorAvatar: 'SK',
    stage: 'Application',
    stageId: 'application',
    stageIndex: 2,
    createdDate: '25 Apr 2026',
    status: 'active',
    daysInStage: 8,
    pendingAction: 'Application form incomplete',
    docsUploaded: 1,
    docsRequired: 3,
    feePaid: false,
    priority: 'High',
  },
  {
    id: generateId(13),
    firstName: 'Hemanth',
    lastName: 'R',
    fullName: 'Hemanth R',
    avatar: 'HR',
    parentName: 'Ramesh H',
    childName: 'Dev Hemanth',
    phone: '9812345678',
    email: 'hemanth@email.com',
    applyingFor: 'LKG',
    source: 'Vidhyaan',
    counsellor: 'Saran Kumar',
    counsellorAvatar: 'SK',
    stage: 'Interview',
    stageId: 'interview',
    stageIndex: 4,
    createdDate: '20 Apr 2026',
    status: 'active',
    daysInStage: 2,
    pendingAction: 'Interview: 22 May 9AM',
    docsUploaded: 3,
    docsRequired: 3,
    feePaid: false,
    priority: 'Urgent',
  },
  {
    id: generateId(12),
    firstName: 'Naresh',
    lastName: 'K',
    fullName: 'Naresh K',
    avatar: 'NK',
    parentName: 'Kumar Naresh',
    childName: 'Nila Naresh',
    phone: '9876543210',
    email: 'naresh@email.com',
    applyingFor: 'LKG',
    source: 'Web',
    counsellor: 'Pradeep Kumar',
    counsellorAvatar: 'PK',
    stage: 'Payment',
    stageId: 'payment',
    stageIndex: 5,
    createdDate: '15 Apr 2026',
    status: 'warning',
    daysInStage: 12,
    pendingAction: 'Payment pending: ₹5,000',
    docsUploaded: 3,
    docsRequired: 3,
    feePaid: false,
    priority: 'High',
  },
  {
    id: generateId(5),
    firstName: 'Arjun',
    lastName: 'Prasad',
    fullName: 'Arjun Prasad',
    avatar: 'AP',
    parentName: 'Prasad Arjun',
    childName: 'Riya Prasad',
    phone: '9845123456',
    email: 'arjun@email.com',
    applyingFor: 'UKG',
    source: 'Web',
    counsellor: 'Pradeep Kumar',
    counsellorAvatar: 'PK',
    stage: 'Payment',
    stageId: 'payment',
    stageIndex: 5,
    createdDate: '10 Apr 2026',
    status: 'overdue',
    daysInStage: 18,
    pendingAction: 'Overdue: 18 days in Payment',
    docsUploaded: 2,
    docsRequired: 3,
    feePaid: false,
    priority: 'Urgent',
  },
  {
    id: generateId(4),
    firstName: 'Meena',
    lastName: 'Devi',
    fullName: 'Meena Devi',
    avatar: 'MD',
    parentName: 'Devi Rajan',
    childName: 'Ram Devi',
    phone: '9834567890',
    email: 'meena@email.com',
    applyingFor: 'LKG',
    source: 'Phone Enquiry',
    counsellor: 'Vimal Das',
    counsellorAvatar: 'VD',
    stage: 'Admitted',
    stageId: 'admitted',
    stageIndex: 6,
    createdDate: '05 Apr 2026',
    status: 'active',
    daysInStage: 1,
    pendingAction: null,
    docsUploaded: 3,
    docsRequired: 3,
    feePaid: true,
    priority: 'Normal',
  },
  {
    id: generateId(3),
    firstName: 'Priya',
    lastName: 'Nair',
    fullName: 'Priya Nair',
    avatar: 'PN',
    parentName: 'Nair Pradeep',
    childName: 'Arun Nair',
    phone: '9823412345',
    email: 'priya@email.com',
    applyingFor: 'Class 6',
    source: 'Referral',
    counsellor: 'Saran Kumar',
    counsellorAvatar: 'SK',
    stage: 'Rejected',
    stageId: 'rejected',
    stageIndex: 7,
    createdDate: '01 Apr 2026',
    status: 'active',
    daysInStage: 0,
    pendingAction: null,
    docsUploaded: 0,
    docsRequired: 3,
    feePaid: false,
    priority: 'Normal',
  },
]

const sourceConfig: Record<string, {
  bg: string; text: string; dot: string
}> = {
  Vidhyaan: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    dot: 'bg-blue-600',
  },
  Web: {
    bg: 'bg-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  },
  'Phone Enquiry': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  'Walk-in': {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    dot: 'bg-teal-500',
  },
  WhatsApp: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  Referral: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    dot: 'bg-pink-500',
  },
  'Social Media': {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    dot: 'bg-pink-400',
  },
  'Education Fair': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
  },
  'Newspaper Ad': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  'Google Ad': {
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-400',
  },
  Other: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    dot: 'bg-slate-300',
  },
}

// const priorityConfig: Record<string, {
//   bg: string; text: string;
//   border: string; icon: string
// }> = {
//   Normal: {
//     bg: 'bg-blue-50',
//     text: 'text-blue-700',
//     border: 'border-blue-200',
//     icon: 'Circle',
//   },
//   High: {
//     bg: 'bg-amber-50',
//     text: 'text-amber-700',
//     border: 'border-amber-200',
//     icon: 'TrendingUp',
//   },
//   Urgent: {
//     bg: 'bg-red-50',
//     text: 'text-red-600',
//     border: 'border-red-200',
//     icon: 'Zap',
//   },
// }

const counsellors = [
  {
    id: '1',
    name: 'Saran Kumar',
    avatar: 'SK',
    role: 'Senior Counsellor',
  },
  {
    id: '2',
    name: 'Pradeep Kumar',
    avatar: 'PK',
    role: 'Counsellor',
  },
  {
    id: '3',
    name: 'Vimal Das',
    avatar: 'VD',
    role: 'Counsellor',
  },
]

const currentUser = {
  name: 'Saran Kumar',
  firstName: 'Saran',
}

const getGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const getIcon = (name: string) => {
  switch (name) {
    case 'Sparkles':
      return Sparkles
    case 'Phone':
      return Phone
    case 'FileText':
      return FileText
    case 'Upload':
      return Upload
    case 'Users':
      return Users
    case 'CreditCard':
      return CreditCard
    case 'CheckCircle2':
      return CheckCircle2
    case 'XCircle':
      return XCircle
    default:
      return Circle
  }
}


export default function AdmissionManagementPage() {
  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================
  const [activeView, setActiveView] =
    useState<'list' | 'grid' | 'kanban'>
    ('list')
  const [selectedItems, setSelectedItems] =
    useState<string[]>([])
  const [searchQuery, setSearchQuery] =
    useState('')
  const [activeStageFilter, 
    setActiveStageFilter] =
    useState<string | null>(null)
  const [stageDropdownId, 
    setStageDropdownId] =
    useState<string | null>(null)
  const [counsellorDropdownId,
    setCounsellorDropdownId] =
    useState<string | null>(null)
  const [applicantsList, setApplicantsList] =
    useState<Applicant[]>(applicants)
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'info' | 'error'
    show: boolean
  }>({ msg: '', type: 'success', show: false })
  const [showConvertModal, setShowConvertModal] =
    useState<Applicant | null>(null)
  const [showRejectModal, setShowRejectModal] =
    useState<Applicant | null>(null)

  // Dropdown filter variables
  const [filterApplyingFor, setFilterApplyingFor] = useState<string | null>(null)
  const [filterCounsellor, setFilterCounsellor] = useState<string | null>(null)
  const [filterStage, setFilterStage] = useState<string | null>(null)
  const [filterDateRange, setFilterDateRange] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)

  // UI state for dropdown filter panels
  const [showApplyingForDropdown, setShowApplyingForDropdown] = useState(false)
  const [showCounsellorFilterDropdown, setShowCounsellorFilterDropdown] = useState(false)
  const [showStageFilterDropdown, setShowStageFilterDropdown] = useState(false)
  const [showDateFilterDropdown, setShowDateFilterDropdown] = useState(false)
  const [showPriorityFilterDropdown, setShowPriorityFilterDropdown] = useState(false)

  // Layout sidebar states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Modal Reject Reason state
  const [rejectReason, setRejectReason] = useState('')

  // Bulk action sub-dropdowns
  const [showBulkStageDropdown, setShowBulkStageDropdown] = useState(false)
  const [showBulkCounsellorDropdown, setShowBulkCounsellorDropdown] = useState(false)

  const router = useRouter()
  const [navigating, setNavigating] = useState(false)

  const handleNavigate = (path: string) => {
    setNavigating(true)
    setTimeout(() => {
      router.push(path)
    }, 100)
  }

  const showToast = (
    msg: string,
    type: 'success' | 'info' | 'error' =
    'success'
  ) => {
    setToast({ msg, type, show: true })
    setTimeout(() =>
      setToast(t => ({ ...t, show: false })),
      3000
    )
  }

  // ===================================================================
  // FILTERING LOGIC
  // ===================================================================
  const filteredApplicants = 
    applicantsList.filter(a => {
      if (activeStageFilter &&
        a.stageId !== activeStageFilter)
        return false
      if (searchQuery &&
        !a.fullName.toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
        !a.id.toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
        !a.applyingFor.toLowerCase()
        .includes(searchQuery.toLowerCase()))
        return false
      
      // Dropdown filters
      if (filterApplyingFor && a.applyingFor !== filterApplyingFor) return false
      if (filterCounsellor && a.counsellor !== filterCounsellor) return false
      if (filterStage && a.stageId !== filterStage) return false
      if (filterPriority && a.priority !== filterPriority) return false
      if (filterDateRange) {
        if (filterDateRange === 'May' && !a.createdDate.includes('May')) return false
        if (filterDateRange === 'Apr' && !a.createdDate.includes('Apr')) return false
      }

      return true
    })

  const totalCount = applicantsList.length
  const conversionRate = Math.round(
    (applicantsList.filter(
      a => a.stageId === 'admitted' ||
      a.stageId === 'enrolled'
    ).length / totalCount) * 100
  )
  const pendingActionCount = 
    applicantsList.filter(
      a => a.pendingAction !== null
    ).length

  // Unique lists for filter dropdown values
  const uniqueApplyingFor = Array.from(new Set(applicantsList.map(a => a.applyingFor)))

  const isAnyFilterActive = !!(
    filterApplyingFor ||
    filterCounsellor ||
    filterStage ||
    filterDateRange ||
    filterPriority ||
    searchQuery ||
    activeStageFilter
  )

  const handleClearAllFilters = () => {
    setFilterApplyingFor(null)
    setFilterCounsellor(null)
    setFilterStage(null)
    setFilterDateRange(null)
    setFilterPriority(null)
    setSearchQuery('')
    setActiveStageFilter(null)
    setSelectedItems([])
  }

  // ===================================================================
  // ACTIONS / LOGIC HANDLERS
  // ===================================================================
  const handleSelectApplicant = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === filteredApplicants.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredApplicants.map(a => a.id))
    }
  }

  const handleAssignCounsellor = (applicantId: string, name: string | null) => {
    setApplicantsList(prev => prev.map(a => {
      if (a.id === applicantId) {
        const c = counsellors.find(item => item.name === name)
        return {
          ...a,
          counsellor: name,
          counsellorAvatar: c ? c.avatar : null
        }
      }
      return a
    }))
    setCounsellorDropdownId(null)
    showToast(name ? `Assigned to ${name}` : 'Unassigned counsellor')
  }

  const handleMoveStage = (applicantId: string, targetStageId: string) => {
    const targetStage = pipeline.find(s => s.id === targetStageId)
    if (!targetStage) return

    const applicant = applicantsList.find(a => a.id === applicantId)
    if (!applicant) return

    if (targetStage.isTerminal) {
      if (targetStageId === 'admitted' || targetStageId === 'enrolled') {
        setShowConvertModal(applicant)
      } else if (targetStageId === 'rejected') {
        setShowRejectModal(applicant)
      }
    } else {
      setApplicantsList(prev => prev.map(a => {
        if (a.id === applicantId) {
          return {
            ...a,
            stageId: targetStageId,
            stage: targetStage.label,
            stageIndex: targetStage.order - 1
          }
        }
        return a
      }))
      showToast(`Moved to ${targetStage.label}`)
    }
    setStageDropdownId(null)
  }

  const handleConfirmConvert = () => {
    if (!showConvertModal) return
    const applicantId = showConvertModal.id
    const name = showConvertModal.fullName

    const targetStageId = type === 'school' ? 'admitted' : 'enrolled'
    const targetStage = pipeline.find(s => s.id === targetStageId)
    if (targetStage) {
      setApplicantsList(prev => prev.map(a => {
        if (a.id === applicantId) {
          return {
            ...a,
            stageId: targetStage.id,
            stage: targetStage.label,
            stageIndex: targetStage.order - 1,
            feePaid: true
          }
        }
        return a
      }))
    }
    setShowConvertModal(null)
    showToast(`${name} converted to student`)
  }

  const handleConfirmReject = () => {
    if (!showRejectModal) return
    const applicantId = showRejectModal.id
    const name = showRejectModal.fullName

    const targetStage = pipeline.find(s => s.id === 'rejected')
    if (targetStage) {
      setApplicantsList(prev => prev.map(a => {
        if (a.id === applicantId) {
          return {
            ...a,
            stageId: targetStage.id,
            stage: targetStage.label,
            stageIndex: targetStage.order - 1,
            pendingAction: rejectReason ? `Rejected: ${rejectReason}` : 'Rejected'
          }
        }
        return a
      }))
    }
    setShowRejectModal(null)
    setRejectReason('')
    showToast(`${name} application rejected`, 'error')
  }

  // Bulk operation handlers
  const handleBulkMoveStage = (targetStageId: string) => {
    const targetStage = pipeline.find(s => s.id === targetStageId)
    if (!targetStage) return

    setApplicantsList(prev => prev.map(a => {
      if (selectedItems.includes(a.id)) {
        return {
          ...a,
          stageId: targetStageId,
          stage: targetStage.label,
          stageIndex: targetStage.order - 1
        }
      }
      return a
    }))
    setShowBulkStageDropdown(false)
    setSelectedItems([])
    showToast(`Selected applicants moved to ${targetStage.label}`)
  }

  const handleBulkAssignCounsellor = (counsellorName: string | null) => {
    setApplicantsList(prev => prev.map(a => {
      if (selectedItems.includes(a.id)) {
        const c = counsellors.find(item => item.name === counsellorName)
        return {
          ...a,
          counsellor: counsellorName,
          counsellorAvatar: c ? c.avatar : null
        }
      }
      return a
    }))
    setShowBulkCounsellorDropdown(false)
    setSelectedItems([])
    showToast(counsellorName ? `Selected assigned to ${counsellorName}` : 'Selected unassigned')
  }

  const handleBulkDelete = () => {
    setApplicantsList(prev => prev.filter(a => !selectedItems.includes(a.id)))
    setSelectedItems([])
    showToast('Deleted selected applicants', 'error')
  }

  const getLeftBorderBg = (a: typeof applicants[0]) => {
    if (a.status === 'overdue') return 'bg-red-500'
    if (a.status === 'warning') return 'bg-amber-400'
    if (a.status === 'recent' || a.daysInStage <= 1) return 'bg-green-400'
    return 'bg-transparent'
  }

  return (
    <>
      {navigating && <LoadingScreen />}
      <div className="min-h-screen bg-slate-100 text-slate-800 flex relative font-sans antialiased select-none">
      {/* 1. FIXED LEFT SIDEBAR (Desktop w-64, Tablet slim w-16) */}
      <Sidebar />

      {/* MOBILE TOP NAV BAR */}
      <header className="flex md:hidden h-14 bg-white border-b border-slate-200 px-2 min-[375px]:px-4 items-center justify-between fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-1.5 min-[375px]:gap-2 min-w-0 flex-shrink">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[#1565D8] shrink-0">
            <Shield className="w-5 h-5 fill-[#1565D8]" strokeWidth={1.5} />
          </div>
          <span className="text-xs min-[375px]:text-sm font-bold text-slate-800 tracking-tight truncate max-w-[60px] min-[375px]:max-w-[100px] min-[400px]:max-w-[120px] shrink-0">
            Prince Matriculation School
          </span>
        </div>
        <span className="text-xs min-[375px]:text-sm font-bold text-slate-800 shrink-0">{moduleLabel}</span>
        <div className="flex items-center gap-1.5 min-[375px]:gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
          >
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
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Sidebar isMobile={true} onCloseMobileMenu={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-16 lg:pl-64 pt-14 md:pt-0 flex flex-col min-w-0">
        
        {/* DESKTOP/TABLET HEADER BAR */}
        <header className="hidden md:flex h-16 border-b border-slate-200 bg-white items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm lg:text-lg font-bold text-slate-800 tracking-tight leading-tight truncate">
                {moduleLabel}
              </h2>
              <p className="text-xs text-slate-500 truncate leading-relaxed">
                Sales & Marketing › {moduleLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="relative hidden lg:flex items-center gap-2 bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 w-48 lg:w-64">
              <Search className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.5} />
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

            <button className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative shrink-0">
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

        {/* MAIN CONTAINER CONTENT */}
        <main className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto w-full">
          
          {/* SECTION 1 — PAGE TITLE ROW */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {getGreeting()}, {currentUser.firstName} 👋
              </h1>
              <div className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5 font-sans">
                <span>Sales & Marketing</span>
                <ChevronRight size={12} className="text-slate-300" strokeWidth={3} />
                <span>{moduleLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => showToast("Export initiated", "info")}
                className="border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-slate-50 hover:shadow-sm transition-shadow cursor-pointer"
              >
                <Download size={14} strokeWidth={1.5} />
                Export
              </button>
              <button
                onClick={() => router.push('/admission-management/create')}
                className="bg-[#1565D8] text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition cursor-pointer"
              >
                <Plus size={16} strokeWidth={1.5} />
                {config.newButtonLabel[type]}
              </button>
            </div>
          </div>

          {/* SECTION 2 — PIPELINE SUMMARY STRIP */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-md px-5 py-4 border-t-4 border-t-[#1565D8]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {moduleLabel.toUpperCase()} PIPELINE
                </span>
                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  {config.academicYear}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 font-sans">
                  <span className="text-sm font-bold text-slate-900">{totalCount}</span>
                  <span className="text-xs text-slate-500">Total</span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-1.5 font-sans">
                  <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{conversionRate}%</span>
                  <span className="text-xs text-slate-500">Conversion</span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-1.5 font-sans">
                  <span className="text-sm font-bold text-[#1565D8]">14 days</span>
                  <span className="text-xs text-slate-500">Avg. to admit</span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-1.5 font-sans">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-0.5" />
                  <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">{pendingActionCount}</span>
                  <span className="text-xs text-slate-500">Pending action</span>
                </div>
              </div>
            </div>

            {/* STAGE BOXES ROW */}
            <div className="relative">
              <div className="grid grid-cols-4 gap-2 md:flex md:items-stretch md:gap-2 md:overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-400">
                {pipeline.map((stage, idx) => {
                  const IconComponent = getIcon(stage.iconName)
                  const isActive = activeStageFilter === stage.id
                  const maxCount = Math.max(...pipeline.map(s => s.count)) || 1

                  return (
                    <React.Fragment key={stage.id}>
                      <div className="flex flex-col">
                        <div
                          onClick={() => {
                            setActiveStageFilter(
                              activeStageFilter === stage.id
                                ? null
                                : stage.id
                            )
                          }}
                          className={`flex flex-col items-center text-center px-2 py-2 rounded-xl border cursor-pointer transition-all duration-200 flex-shrink-0 min-w-[100px]
                            md:flex-row md:items-center md:text-left md:gap-2 md:px-3 md:py-2
                            ${
                              isActive
                                ? `border-2 ${stage.borderClass} ${stage.bgClass} shadow-sm`
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          <IconComponent 
                            className={`flex-shrink-0 size-14 md:size-[14px] ${stage.textClass} ${isActive ? 'opacity-100' : 'opacity-70'}`} 
                            strokeWidth={1.5} 
                          />
                          <span className={`text-lg md:text-xl font-bold ${isActive ? stage.textClass : 'text-slate-800'}`} style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {stage.count}
                          </span>
                          
                          {/* Desktop label */}
                          <span className={`text-[10px] font-semibold uppercase tracking-wide mt-1 hidden lg:block ${stage.textClass}`}>
                            {stage.label}
                          </span>
                          
                          {/* Mobile label */}
                          <span className={`text-[9px] font-semibold uppercase tracking-wide mt-1 block lg:hidden truncate max-w-full ${stage.textClass}`}>
                            {stageShortLabel[stage.id]}
                          </span>
                        </div>
                        <div
                          className={`hidden md:block h-1 rounded-full mt-1.5 ${stage.barClass}`}
                          style={{ width: `${(stage.count / maxCount) * 100}%`, minWidth: '6px' }}
                        />
                      </div>

                      {idx < pipeline.length - 1 && (
                        <ChevronRight 
                          size={12} 
                          className="hidden md:block text-slate-200 self-center flex-shrink-0" 
                          strokeWidth={2.5} 
                        />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
              
              {/* Right fade gradient hint */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none hidden xl:block"/>
            </div>

            {activeStageFilter && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => {
                    setActiveStageFilter(null)
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-[#1565D8] flex items-center gap-1 cursor-pointer font-sans"
                >
                  <X size={12} />
                  Clear filter · Showing {pipeline.find(p => p.id === activeStageFilter)?.label} ({filteredApplicants.length})
                </button>
              </div>
            )}
          </div>

          {/* SECTION 3 — FILTER BAR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-md px-4 py-3 border-t-2 border-t-slate-300 space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
            
            {/* Search Input */}
            <div className="relative flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-4 py-2 w-full md:w-72">
              <Search size={15} className="text-slate-400" strokeWidth={1.5} />
              <input
                type="text"
                placeholder={`Search by name, ID, ${config.applyingForLabel[type]}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-slate-750 placeholder-slate-500 font-sans"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 relative">
              {/* Applying For */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowApplyingForDropdown(!showApplyingForDropdown)
                    setShowCounsellorFilterDropdown(false)
                    setShowStageFilterDropdown(false)
                    setShowDateFilterDropdown(false)
                    setShowPriorityFilterDropdown(false)
                  }}
                  className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans"
                >
                  <span>{filterApplyingFor ? `${config.applyingForLabel[type]}: ${filterApplyingFor}` : `${config.applyingForLabel[type]} ▾`}</span>
                </button>
                {showApplyingForDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px] max-h-48 overflow-y-auto">
                    <div 
                      onClick={() => { setFilterApplyingFor(null); setShowApplyingForDropdown(false) }}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                    >
                      All Classes
                    </div>
                    {uniqueApplyingFor.map(option => (
                      <div
                        key={option}
                        onClick={() => { setFilterApplyingFor(option); setShowApplyingForDropdown(false) }}
                        className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer font-medium flex items-center justify-between ${
                          filterApplyingFor === option ? 'bg-blue-50 text-[#1565D8]' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{option}</span>
                        {filterApplyingFor === option && <Check size={12} className="text-[#1565D8]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Counsellor */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowCounsellorFilterDropdown(!showCounsellorFilterDropdown)
                    setShowApplyingForDropdown(false)
                    setShowStageFilterDropdown(false)
                    setShowDateFilterDropdown(false)
                    setShowPriorityFilterDropdown(false)
                  }}
                  className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans"
                >
                  <span>{filterCounsellor ? `Counsellor: ${filterCounsellor}` : 'Counsellor ▾'}</span>
                </button>
                {showCounsellorFilterDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px]">
                    <div 
                      onClick={() => { setFilterCounsellor(null); setShowCounsellorFilterDropdown(false) }}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                    >
                      All Counsellors
                    </div>
                    {counsellors.map(c => (
                      <div
                        key={c.id}
                        onClick={() => { setFilterCounsellor(c.name); setShowCounsellorFilterDropdown(false) }}
                        className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer font-medium flex items-center justify-between ${
                          filterCounsellor === c.name ? 'bg-blue-50 text-[#1565D8]' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{c.name}</span>
                        {filterCounsellor === c.name && <Check size={12} className="text-[#1565D8]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stage */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowStageFilterDropdown(!showStageFilterDropdown)
                    setShowApplyingForDropdown(false)
                    setShowCounsellorFilterDropdown(false)
                    setShowDateFilterDropdown(false)
                    setShowPriorityFilterDropdown(false)
                  }}
                  className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans"
                >
                  <span>{filterStage ? `Stage: ${pipeline.find(s => s.id === filterStage)?.label}` : 'Stage ▾'}</span>
                </button>
                {showStageFilterDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px] max-h-48 overflow-y-auto">
                    <div 
                      onClick={() => { setFilterStage(null); setShowStageFilterDropdown(false) }}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                    >
                      All Stages
                    </div>
                    {pipeline.map(s => (
                      <div
                        key={s.id}
                        onClick={() => { setFilterStage(s.id); setShowStageFilterDropdown(false) }}
                        className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer font-medium flex items-center justify-between ${
                          filterStage === s.id ? 'bg-blue-50 text-[#1565D8]' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{s.label}</span>
                        {filterStage === s.id && <Check size={12} className="text-[#1565D8]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowDateFilterDropdown(!showDateFilterDropdown)
                    setShowApplyingForDropdown(false)
                    setShowCounsellorFilterDropdown(false)
                    setShowStageFilterDropdown(false)
                    setShowPriorityFilterDropdown(false)
                  }}
                  className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans"
                >
                  <span>{filterDateRange ? `Date: ${filterDateRange}` : 'Date Range ▾'}</span>
                </button>
                {showDateFilterDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[140px]">
                    <div 
                      onClick={() => { setFilterDateRange(null); setShowDateFilterDropdown(false) }}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                    >
                      All Time
                    </div>
                    {['May', 'Apr'].map(month => (
                      <div
                        key={month}
                        onClick={() => { setFilterDateRange(month); setShowDateFilterDropdown(false) }}
                        className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer font-medium flex items-center justify-between ${
                          filterDateRange === month ? 'bg-blue-50 text-[#1565D8]' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{month === 'May' ? 'May 2026' : 'April 2026'}</span>
                        {filterDateRange === month && <Check size={12} className="text-[#1565D8]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowPriorityFilterDropdown(!showPriorityFilterDropdown)
                    setShowApplyingForDropdown(false)
                    setShowCounsellorFilterDropdown(false)
                    setShowStageFilterDropdown(false)
                    setShowDateFilterDropdown(false)
                  }}
                  className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans"
                >
                  <span>{filterPriority ? `Priority: ${filterPriority}` : 'Priority ▾'}</span>
                </button>
                {showPriorityFilterDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[140px]">
                    <div 
                      onClick={() => { setFilterPriority(null); setShowPriorityFilterDropdown(false) }}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                    >
                      All Priorities
                    </div>
                    {['Normal', 'High', 'Urgent'].map(p => (
                      <div
                        key={p}
                        onClick={() => { setFilterPriority(p); setShowPriorityFilterDropdown(false) }}
                        className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer font-medium flex items-center justify-between ${
                          filterPriority === p ? 'bg-blue-50 text-[#1565D8]' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{p}</span>
                        {filterPriority === p && <Check size={12} className="text-[#1565D8]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {isAnyFilterActive && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 px-1.5 py-1.5 font-sans"
                >
                  <X size={13} />
                  Clear Filters
                </button>
              )}
            </div>

            {/* Right group */}
            <div className="flex items-center gap-2 justify-end">
              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">

                {/* List */}
                <button
                  onClick={() => setActiveView('list')}
                  className={`rounded-md p-1.5 transition-all duration-150 ${
                    activeView === 'list'
                      ? 'bg-white shadow-sm'
                      : 'bg-transparent hover:bg-slate-200'
                  }`}
                >
                  <List
                    size={16}
                    strokeWidth={1.5}
                    className={activeView === 'list' ? 'text-[#1565D8]' : 'text-slate-400'}
                  />
                </button>

                {/* Grid */}
                <button
                  onClick={() => setActiveView('grid')}
                  className={`rounded-md p-1.5 transition-all duration-150 ${
                    activeView === 'grid'
                      ? 'bg-white shadow-sm'
                      : 'bg-transparent hover:bg-slate-200'
                  }`}
                >
                  <LayoutGrid
                    size={16}
                    strokeWidth={1.5}
                    className={activeView === 'grid' ? 'text-[#1565D8]' : 'text-slate-400'}
                  />
                </button>

                {/* Kanban */}
                <button
                  onClick={() => setActiveView('kanban')}
                  className={`rounded-md p-1.5 transition-all duration-150 ${
                    activeView === 'kanban'
                      ? 'bg-white shadow-sm'
                      : 'bg-transparent hover:bg-slate-200'
                  }`}
                >
                  <Columns
                    size={16}
                    strokeWidth={1.5}
                    className={activeView === 'kanban' ? 'text-[#1565D8]' : 'text-slate-400'}
                  />
                </button>

              </div>
            </div>
          </div>



          {/* EMPTY STATE BLOCK */}
          {filteredApplicants.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-20 text-center flex flex-col items-center justify-center">
              <ClipboardList size={48} className="text-slate-200" strokeWidth={1.5} />
              <h3 className="text-lg font-bold text-slate-500 mt-4 font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
                No {config.applicantLabel[type]}s found
              </h3>
              <p className="text-sm text-slate-400 mt-2 max-w-xs font-sans">
                Try adjusting filters or add a new {config.applicantLabel[type].toLowerCase()}
              </p>
              <button
                onClick={() => router.push('/admission-management/create')}
                className="bg-[#1565D8] text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition mt-6 cursor-pointer font-sans"
              >
                <Plus size={16} strokeWidth={1.5} />
                {config.newButtonLabel[type]}
              </button>
            </div>
          )}

          {/* ===================================================================
              SECTION 5 — LIST VIEW
              =================================================================== */}
          {activeView === 'list' && filteredApplicants.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* TABLE HEADER */}
              <div className="hidden md:flex items-center px-4 py-3 gap-3 bg-slate-100 border-b border-slate-200 select-none">
                <div className="w-8 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredApplicants.length && filteredApplicants.length > 0}
                    onChange={handleSelectAll}
                    className="accent-[#1565D8] rounded focus:ring-0 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-[200px] text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans">
                  {config.applicantLabel[type].toUpperCase()}
                </div>
                <div className="hidden md:flex w-32 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans">
                  {config.applyingForLabel[type].toUpperCase()}
                </div>
                <div className="hidden md:flex w-28 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans">
                  SOURCE
                </div>
                <div className="hidden xl:flex w-24 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans">
                  CONNECT
                </div>
                <div className="hidden xl:flex w-36 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans">
                  COUNSELLOR
                </div>
                <div className="w-36 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans">
                  STAGE
                </div>
                <div className="hidden md:flex w-20 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans">
                  DOCS
                </div>
                <div className="hidden xl:flex w-24 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans">
                  DATE
                </div>
                <div className="w-12 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans">
                  ACTION
                </div>
              </div>

              {/* TABLE BODY */}
              <div className="divide-y divide-slate-100">
                {filteredApplicants.map((a, idx) => {
                  const stageData = pipeline.find(s => s.id === a.stageId) || pipeline[0]
                  const leftBorderColor = getLeftBorderBg(a)

                  return (
                    <div
                      key={a.id}
                      onClick={() => handleNavigate(`/admission-management/${a.id}`)}
                      className={`relative flex items-center px-4 py-3.5 gap-3 transition-colors duration-100 cursor-pointer hover:bg-blue-50 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      {/* Left border highlight */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r ${leftBorderColor}`} />

                      {/* Checkbox */}
                      <div className="w-8 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(a.id)}
                          onChange={() => handleSelectApplicant(a.id)}
                          className="accent-[#1565D8] rounded focus:ring-0 cursor-pointer"
                        />
                      </div>

                      {/* Applicant details */}
                      <div className="flex-1 min-w-[200px] flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {a.avatar}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admission-management/${a.id}`}
                            onClick={e => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleNavigate(`/admission-management/${a.id}`)
                            }}
                            className="text-base font-semibold text-[#1565D8] hover:underline truncate block font-sans"
                          >
                            {a.fullName}
                          </Link>
                          <span className="text-xs text-slate-400 mt-0.5 truncate block font-sans">
                            {type === 'school' ? `Parent: ${a.parentName}` : a.phone}
                          </span>
                          
                          {/* Pending action badge */}
                          {a.pendingAction && (
                            <div className="flex items-center gap-1 w-fit bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5 mt-1">
                              <AlertCircle size={10} className="text-amber-500" strokeWidth={2.5} />
                              <span className="text-[10px] font-semibold text-amber-700 font-sans">
                                {a.pendingAction}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Applying For */}
                      <div className="hidden md:flex w-32 flex-shrink-0">
                        <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-lg w-fit font-sans">
                          {a.applyingFor}
                        </span>
                      </div>

                      {/* Source */}
                      <div className="hidden md:flex w-28 flex-shrink-0">
                        <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ${
                          sourceConfig[a.source]?.bg || 'bg-slate-100'
                        } ${sourceConfig[a.source]?.text || 'text-slate-600'}`}>
                          <span className={`w-2 h-2 rounded-full ${sourceConfig[a.source]?.dot || 'bg-slate-400'}`} />
                          <span>{a.source}</span>
                        </div>
                      </div>

                      {/* Connect icons */}
                      <div className="hidden xl:flex w-24 flex-shrink-0 items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => showToast("Email initiated", "info")}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition"
                          title="Send Email"
                        >
                          <Mail size={13} className="text-slate-400" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => {
                            window.open(`https://wa.me/91${a.phone}`)
                            showToast("WhatsApp opened", "success")
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-green-50 hover:border-green-200 transition"
                          title="WhatsApp chat"
                        >
                          <MessageCircle size={13} className="text-green-500" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => {
                            window.open(`tel:${a.phone}`)
                            showToast("Call initiated", "success")
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition"
                          title="Phone Call"
                        >
                          <Phone size={13} className="text-blue-500" strokeWidth={1.5} />
                        </button>
                      </div>

                      {/* Counsellor selection */}
                      <div className="hidden xl:flex w-36 flex-shrink-0 relative" onClick={e => e.stopPropagation()}>
                        {a.counsellor ? (
                          <div
                            onClick={() => setCounsellorDropdownId(counsellorDropdownId === a.id ? null : a.id)}
                            className="flex items-center gap-2 cursor-pointer group hover:opacity-85"
                          >
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {a.counsellorAvatar}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 group-hover:text-[#1565D8] truncate font-sans">
                              {a.counsellor}
                            </span>
                            <Pencil size={11} className="text-slate-300 group-hover:text-slate-400 shrink-0" strokeWidth={2} />
                          </div>
                        ) : (
                          <button
                            onClick={() => setCounsellorDropdownId(a.id)}
                            className="text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 px-2.5 py-1.5 rounded-lg border border-amber-200 cursor-pointer font-sans"
                          >
                            Assign
                          </button>
                        )}

                        {counsellorDropdownId === a.id && (
                          <div className="absolute bottom-full left-0 mb-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[200px]">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5 border-b border-slate-100 mb-1 font-sans">
                              Assign Counsellor
                            </div>
                            {counsellors.map(c => (
                              <div
                                key={c.id}
                                onClick={() => handleAssignCounsellor(a.id, c.name)}
                                className="px-3 py-2 rounded-lg cursor-pointer text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-sans"
                              >
                                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold flex items-center justify-center shrink-0">
                                  {c.avatar}
                                </div>
                                <span>{c.name}</span>
                              </div>
                            ))}
                            <DropdownMenuSeparator />
                            <div
                              onClick={() => handleAssignCounsellor(a.id, null)}
                              className="px-3 py-2 rounded-lg cursor-pointer text-xs font-bold text-red-500 hover:bg-red-50 font-sans"
                            >
                              Unassign
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stage selection */}
                      <div className="w-36 flex-shrink-0 relative" onClick={e => e.stopPropagation()}>
                        <div
                          onClick={() => setStageDropdownId(stageDropdownId === a.id ? null : a.id)}
                          className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full border cursor-pointer hover:opacity-85 justify-between w-fit ${
                            stageData.bgClass
                          } ${stageData.textClass} ${stageData.borderClass}`}
                        >
                          <span className="truncate">{stageData.label}</span>
                          <ChevronDown size={10} className="ml-0.5 shrink-0" strokeWidth={2.5} />
                        </div>

                        {/* Stage dots */}
                        <div className="flex items-center gap-1 mt-1.5 select-none">
                          {pipeline.filter(s => s.id !== 'rejected').map((s, sIdx) => (
                            <span
                              key={s.id}
                              className={`w-2 h-2 rounded-full ${
                                sIdx <= a.stageIndex ? `${s.dotClass} opacity-100` : 'bg-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-[9px] text-slate-400 ml-1.5 font-sans font-medium">
                            {a.stageIndex + 1}/{pipeline.length - 1}
                          </span>
                        </div>

                        {/* Days in stage warning */}
                        {a.daysInStage > 7 && (
                          <div className="text-[10px] text-red-400 font-medium mt-1 flex items-center gap-0.5 font-sans">
                            <span>⚠</span>
                            <span>{a.daysInStage}d in stage</span>
                          </div>
                        )}

                        {stageDropdownId === a.id && (
                          <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[180px] max-h-56 overflow-y-auto">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5 border-b border-slate-100 mb-1 font-sans">
                              MOVE TO STAGE
                            </div>
                            {pipeline.map(s => (
                              <div
                                key={s.id}
                                onClick={() => handleMoveStage(a.id, s.id)}
                                className={`px-3 py-2 rounded-lg cursor-pointer text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between font-sans ${
                                  a.stageId === s.id ? 'bg-slate-50 font-bold' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${s.dotClass}`} />
                                  <span>{s.label}</span>
                                </div>
                                {a.stageId === s.id && <Check size={12} className="text-[#1565D8]" />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Documents Upload status */}
                      <div className="hidden md:flex w-20 flex-shrink-0 flex-col gap-1">
                        <span className={`text-xs font-bold font-sans ${
                          a.docsUploaded === a.docsRequired ? 'text-green-600 font-bold' :
                          a.docsUploaded > 0 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'
                        }`}>
                          {a.docsUploaded}/{a.docsRequired}
                        </span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded overflow-hidden">
                          <div
                            className={`h-1.5 rounded ${
                              a.docsUploaded === a.docsRequired ? 'bg-green-500' :
                              a.docsUploaded > 0 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${(a.docsUploaded / a.docsRequired) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="hidden xl:flex w-24 flex-shrink-0 text-sm text-slate-500 font-medium font-sans">
                        {a.createdDate}
                      </div>

                      {/* Dropdown Menu actions */}
                      <div className="w-12 flex-shrink-0 flex justify-center" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none">
                              <MoreVertical size={16} strokeWidth={1.5}/>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-56 min-w-[224px] rounded-xl border border-slate-100 shadow-lg p-1.5"
                          >
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleNavigate(`/admission-management/${a.id}`)
                              }}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <Eye size={14} strokeWidth={1.5} className="text-slate-400"/>
                              View Applicant
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/admission-management/${a.id}/edit`)
                              }}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <Pencil size={14} strokeWidth={1.5} className="text-slate-400"/>
                              Edit Applicant
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <FileText size={14} strokeWidth={1.5} className="text-slate-400"/>
                              View Documents
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <CreditCard size={14} strokeWidth={1.5} className="text-slate-400"/>
                              View Fee Plans
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowConvertModal(a)
                              }}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#1565D8] hover:bg-blue-50 cursor-pointer whitespace-nowrap"
                            >
                              <CheckCircle2 size={14} strokeWidth={1.5} className="text-[#1565D8]"/>
                              {config.convertToStudentLabel[type]}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowRejectModal(a)
                              }}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 cursor-pointer"
                            >
                              <XCircle size={14} strokeWidth={1.5} className="text-red-500"/>
                              Reject Application
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION 6 — GRID VIEW
              =================================================================== */}
          {activeView === 'grid' && filteredApplicants.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApplicants.map(a => {
                const stageData = pipeline.find(s => s.id === a.stageId) || pipeline[0]
                const leftBorderColor = getLeftBorderBg(a)
                
                return (
                  <div
                    key={a.id}
                    onClick={() => handleNavigate(`/admission-management/${a.id}`)}
                    className="bg-white rounded-xl border border-slate-200 shadow-md p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
                  >
                    {/* Left border highlight */}
                    {leftBorderColor !== 'bg-transparent' && (
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${leftBorderColor}`} />
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">
                          {a.avatar}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 font-mono block">
                            {a.id}
                          </span>
                          <span className="text-sm font-bold text-slate-800 hover:text-[#1565D8] truncate block font-sans">
                            {a.fullName}
                          </span>
                          <span className="text-xs text-slate-400 mt-0.5 truncate block font-sans">
                            {type === 'school' ? `Parent: ${a.parentName}` : a.phone}
                          </span>
                        </div>
                      </div>

                      {/* Grid Trigger Actions */}
                      <div onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none cursor-pointer">
                              <MoreVertical size={16} strokeWidth={1.5} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 min-w-[224px] rounded-xl border border-slate-200 shadow-lg p-1.5">
                            <DropdownMenuItem onClick={() => handleNavigate(`/admission-management/${a.id}`)}>
                              <Eye size={14} className="mr-2 text-slate-400" strokeWidth={1.5} />
                              <span>View {config.applicantLabel[type]}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admission-management/${a.id}/edit`)}>
                              <Pencil size={14} className="mr-2 text-slate-400" strokeWidth={1.5} />
                              <span>Edit {config.applicantLabel[type]}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => showToast("Showing Documents", "info")}>
                              <FileText size={14} className="mr-2 text-slate-400" strokeWidth={1.5} />
                              <span>View Documents</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowConvertModal(a)} className="text-[#1565D8] font-semibold">
                              <CheckCircle2 size={14} className="mr-2 text-[#1565D8]" strokeWidth={1.5} />
                              <span>{config.convertToStudentLabel[type]}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowRejectModal(a)} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                              <XCircle size={14} className="mr-2 text-red-500" strokeWidth={1.5} />
                              <span>Reject Application</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg font-sans">
                        {a.applyingFor}
                      </span>
                      <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        sourceConfig[a.source]?.bg || 'bg-slate-100'
                      } ${sourceConfig[a.source]?.text || 'text-slate-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${sourceConfig[a.source]?.dot || 'bg-slate-400'}`} />
                        <span>{a.source}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 my-3" />

                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        stageData.bgClass} ${stageData.textClass} ${stageData.borderClass}`}
                      >
                        {stageData.label}
                      </div>

                      <span className={`text-xs font-bold font-sans ${
                        a.docsUploaded === a.docsRequired ? 'text-green-600 font-bold' :
                        a.docsUploaded > 0 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'
                      }`}>
                        {a.docsUploaded}/{a.docsRequired} docs
                      </span>
                    </div>

                    {/* Progress dots in Grid */}
                    <div className="flex items-center gap-1 mt-2.5 select-none">
                      {pipeline.filter(s => s.id !== 'rejected').map((s, sIdx) => (
                        <span
                          key={s.id}
                          className={`w-2 h-2 rounded-full ${
                            sIdx <= a.stageIndex ? `${s.dotClass} opacity-100` : 'bg-slate-200'
                          }`}
                        />
                      ))}
                      <span className="text-[9px] text-slate-400 ml-1.5 font-sans font-medium">
                        {a.stageIndex + 1}/{pipeline.length - 1}
                      </span>
                    </div>

                    {/* Pending Action details */}
                    {a.pendingAction && (
                      <div className="flex items-start bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2">
                        <AlertCircle size={12} className="text-amber-500 mr-1.5 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span className="text-[10px] font-semibold text-amber-700 leading-tight font-sans">
                          {a.pendingAction}
                        </span>
                      </div>
                    )}

                    {/* Counsellor + Date */}
                    <div className="flex items-center justify-between mt-3.5">
                      <div className="flex items-center gap-2">
                        {a.counsellor ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[9px] font-bold flex items-center justify-center shrink-0">
                              {a.counsellorAvatar}
                            </div>
                            <span className="text-xs font-semibold text-slate-650 truncate max-w-[120px] font-sans">
                              {a.counsellor}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 font-sans">Unassigned</span>
                        )}
                      </div>

                      <span className="text-xs text-slate-400 font-sans">{a.createdDate}</span>
                    </div>

                    {/* Connect Actions strip */}
                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => showToast("Email initiated", "info")}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-blue-50 transition"
                        >
                          <Mail size={13} className="text-slate-400" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => {
                            window.open(`https://wa.me/91${a.phone}`)
                            showToast("WhatsApp opened", "success")
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-green-50 transition"
                        >
                          <MessageCircle size={13} className="text-green-500" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => {
                            window.open(`tel:${a.phone}`)
                            showToast("Call initiated", "success")
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-blue-50 transition"
                        >
                          <Phone size={13} className="text-blue-500" strokeWidth={1.5} />
                        </button>
                      </div>

                      <Link 
                        href={`/admission-management/${a.id}`} 
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleNavigate(`/admission-management/${a.id}`)
                        }}
                        className="text-xs font-bold text-[#1565D8] hover:underline font-sans flex items-center gap-0.5"
                      >
                        <span>View Details</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ===================================================================
              SECTION 7 — KANBAN VIEW
              =================================================================== */}
          {activeView === 'kanban' && filteredApplicants.length > 0 && (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300">
                {pipeline.map(stage => {
                  const stageApplicants = filteredApplicants.filter(a => a.stageId === stage.id)

                  return (
                    <div key={stage.id} className="w-[280px] flex-shrink-0">
                      {/* COLUMN HEADER */}
                      <div className="flex items-center justify-between mb-3 bg-white p-3 rounded-lg border border-slate-200 shadow-md select-none">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.dotClass}`} />
                          <span className="text-xs font-bold text-slate-700 truncate font-sans">
                            {stage.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${stage.bgClass} ${stage.textClass}`}>
                            {stageApplicants.length}
                          </span>
                        </div>
                        <button
                          onClick={() => router.push(`/admission-management/create?stage=${stage.id}`)}
                          className="p-1 rounded text-slate-400 hover:text-slate-650 hover:bg-slate-50 cursor-pointer"
                          title={`Add to ${stage.label}`}
                        >
                          <Plus size={14} strokeWidth={2} />
                        </button>
                      </div>

                      {/* COLUMN BODY */}
                      <div className="space-y-3 min-h-[300px] bg-slate-50/50 p-2 rounded-xl border border-dashed border-slate-150">
                        {stageApplicants.length === 0 ? (
                          <div className="bg-slate-50/20 rounded-xl border border-dashed border-slate-200 py-8 text-center flex flex-col items-center justify-center">
                            <Inbox size={24} className="text-slate-350" strokeWidth={1.5} />
                            <span className="text-[11px] text-slate-400 font-bold mt-2 font-sans">
                              No {config.applicantLabel[type]}s
                            </span>
                          </div>
                        ) : (
                          stageApplicants.map(a => {
                            const leftBorderColor = getLeftBorderBg(a)


                            return (
                              <div
                                key={a.id}
                                onClick={() => handleNavigate(`/admission-management/${a.id}`)}
                                className="bg-white rounded-xl border border-slate-200 shadow-md p-4 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
                              >
                                {/* Left border highlight */}
                                {leftBorderColor !== 'bg-transparent' && (
                                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${leftBorderColor}`} />
                                )}
                                <div className="flex justify-between items-start">
                                  <div className="min-w-0">
                                    <span className="text-[9px] font-bold text-slate-400 font-mono block">
                                      {a.id}
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 hover:text-[#1565D8] truncate block mt-0.5 font-sans">
                                      {a.fullName}
                                    </span>
                                  </div>

                                  <div onClick={e => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger>
                                        <button className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer focus:outline-none">
                                          <MoreVertical size={13} strokeWidth={1.5} />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-48 rounded-lg border border-slate-200 shadow-lg p-1">
                                        <DropdownMenuItem onClick={() => handleNavigate(`/admission-management/${a.id}`)}>
                                          View Info
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push(`/admission-management/${a.id}/edit`)}>
                                          Edit Info
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowConvertModal(a)} className="text-[#1565D8] font-bold">
                                          Convert
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowRejectModal(a)} className="text-red-500">
                                          Reject
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>

                                <p className="text-[10px] text-slate-400 mt-1 truncate font-sans">
                                  {type === 'school' ? `Parent: ${a.parentName}` : a.phone}
                                </p>

                                <div className="flex justify-between items-center mt-3">
                                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded font-sans">
                                    {a.applyingFor}
                                  </span>
                                  <div className={`flex items-center gap-1.5 text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                                    sourceConfig[a.source]?.bg || 'bg-slate-100'
                                  } ${sourceConfig[a.source]?.text || 'text-slate-650'}`}>
                                    <span className={`w-2 h-2 rounded-full ${sourceConfig[a.source]?.dot || 'bg-slate-400'}`} />
                                    <span>{a.source}</span>
                                  </div>
                                </div>

                                {/* Progress dots in Kanban card */}
                                <div className="flex items-center gap-1 mt-2.5 select-none">
                                  {pipeline.filter(s => s.id !== 'rejected').map((s, sIdx) => (
                                    <span
                                      key={s.id}
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        sIdx <= a.stageIndex ? `${s.dotClass} opacity-100` : 'bg-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>

                                <div className="flex items-center justify-between mt-2.5">
                                  <span className={`text-[10px] font-bold font-sans ${
                                    a.docsUploaded === a.docsRequired ? 'text-green-600 font-bold' :
                                    a.docsUploaded > 0 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'
                                  }`}>
                                    {a.docsUploaded}/{a.docsRequired} docs
                                  </span>
                                </div>

                                {a.pendingAction && (
                                  <div className="flex items-start bg-amber-50 border border-amber-100 rounded px-2 py-1.5 mt-2">
                                    <AlertCircle size={10} className="text-amber-500 mr-1.5 mt-0.5 shrink-0" strokeWidth={2.5} />
                                    <span className="text-[9px] font-semibold text-amber-700 leading-tight font-sans">
                                      {a.pendingAction}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                  <div className="flex items-center gap-1.5">
                                    {a.counsellor ? (
                                      <>
                                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 text-[8px] font-bold flex items-center justify-center shrink-0">
                                          {a.counsellorAvatar}
                                        </div>
                                        <span className="text-[10px] font-medium text-slate-500 truncate max-w-[80px] font-sans">
                                          {a.counsellor.split(' ')[0]}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[9px] font-medium text-slate-400 font-sans">Unassigned</span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-sans">{a.createdDate}</span>
                                </div>

                                {/* Quick connects strip */}
                                <div className="mt-2.5 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => showToast("Email initiated", "info")}
                                    className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-blue-50 transition"
                                  >
                                    <Mail size={11} className="text-slate-400" strokeWidth={1.5} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      window.open(`https://wa.me/91${a.phone}`)
                                      showToast("WhatsApp opened", "success")
                                    }}
                                    className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-green-50 transition"
                                  >
                                    <MessageCircle size={11} className="text-green-500" strokeWidth={1.5} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      window.open(`tel:${a.phone}`)
                                      showToast("Call initiated", "success")
                                    }}
                                    className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-blue-50 transition"
                                  >
                                    <Phone size={11} className="text-blue-500" strokeWidth={1.5} />
                                  </button>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION 11 — PAGINATION & EMPTY SPACE FOOTER
              =================================================================== */}
          {(activeView === 'list' || activeView === 'grid') && filteredApplicants.length > 0 && (
            <div className="bg-white border-t border-slate-200 rounded-b-xl px-5 py-4 flex items-center justify-between shadow-sm">
              <span className="text-sm text-slate-500 font-sans">
                Showing 1–{filteredApplicants.length} of {totalCount} {moduleLabel.toLowerCase()}
              </span>

              <div className="flex items-center gap-2 select-none">
                <button
                  disabled
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-400 bg-slate-50/50 cursor-not-allowed font-sans"
                >
                  Previous
                </button>
                <button className="px-3 py-1.5 border border-[#1565D8] rounded-lg text-xs font-bold text-white bg-[#1565D8] cursor-pointer font-sans">
                  1
                </button>
                <button
                  disabled
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-400 bg-slate-50/50 cursor-not-allowed font-sans"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ===================================================================
          SECTION 8 — CONVERT TO STUDENT MODAL
          =================================================================== */}
      <Dialog 
        open={showConvertModal !== null} 
        onOpenChange={(open) => { if (!open) setShowConvertModal(null) }}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {config.convertToStudentLabel[type]}
            </DialogTitle>
          </DialogHeader>

          {showConvertModal && (
            <div>
              <div className="bg-slate-50 rounded-xl p-4 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1565D8] text-white font-bold flex items-center justify-center shrink-0">
                  {showConvertModal.avatar}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-bold text-slate-800 block leading-tight font-sans">
                    {showConvertModal.fullName}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block font-sans">
                    ID: {showConvertModal.id} · Grade: {showConvertModal.applyingFor} · {config.academicYear}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3 font-sans">
                  This action will:
                </span>
                <div className="space-y-3">
                  {type === 'school' ? (
                    <>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span className="text-sm text-slate-650 font-sans leading-tight">Create a Student record in Student Management</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span className="text-sm text-slate-650 font-sans leading-tight">Pre-fill all applicant data</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span className="text-sm text-slate-650 font-sans leading-tight">Mark application as Admitted</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span className="text-sm text-slate-650 font-sans leading-tight">Assign Student ID (STU-{new Date().getFullYear()}-XXXXX)</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span className="text-sm text-slate-650 font-sans leading-tight">Send confirmation notification</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span className="text-sm text-slate-650 font-sans leading-tight">Mark as Enrolled</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span className="text-sm text-slate-650 font-sans leading-tight">Create Student record</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" strokeWidth={2.5} />
                        <span className="text-sm text-slate-650 font-sans leading-tight">Activate fee plan</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 select-none">
                <button
                  onClick={() => setShowConvertModal(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold cursor-pointer font-sans"
                >
                  Later
                </button>
                <button
                  onClick={handleConfirmConvert}
                  className="px-4 py-2 bg-[#1565D8] hover:bg-blue-700 text-white rounded-lg text-sm font-semibold cursor-pointer font-sans"
                >
                  Confirm &amp; Convert →
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================================================================
          SECTION 9 — REJECT MODAL
          =================================================================== */}
      <Dialog 
        open={showRejectModal !== null} 
        onOpenChange={(open) => { if (!open) { setShowRejectModal(null); setRejectReason('') } }}
      >
        <DialogContent className="max-w-sm rounded-2xl p-6 bg-white">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <XCircle size={28} strokeWidth={1.5} />
            </div>

            <DialogTitle className="text-lg font-bold font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Reject Application?
            </DialogTitle>

            {showRejectModal && (
              <p className="text-sm text-slate-400 mt-2 font-sans leading-relaxed">
                Reject application of <span className="font-bold text-slate-700">{showRejectModal.fullName}</span> ({showRejectModal.id})?
              </p>
            )}

            <div className="w-full mt-5 mb-6 text-left">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1.5 font-sans">
                Select reason (optional)
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 bg-white font-sans outline-none focus:border-[#1565D8]"
              >
                <option value="">Choose a reason...</option>
                <option value="Seats not available">Seats not available</option>
                <option value="Documents incomplete">Documents incomplete</option>
                <option value="Failed interview">Failed interview</option>
                <option value="Parent withdrew">Parent withdrew</option>
                <option value="Fee not paid">Fee not paid</option>
                <option value="Does not meet criteria">Does not meet criteria</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex w-full gap-3 select-none">
              <button
                onClick={() => { setShowRejectModal(null); setRejectReason('') }}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold cursor-pointer font-sans"
              >
                Keep Application
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold cursor-pointer font-sans"
              >
                Reject
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================================================
          SECTION 10 — BULK ACTION BAR
          =================================================================== */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-2xl px-6 py-3 shadow-2xl flex items-center gap-4 z-50 select-none animate-fade-in whitespace-nowrap">
          <CheckSquare size={16} className="text-blue-400 shrink-0" strokeWidth={2} />
          <span className="text-sm font-semibold font-sans">{selectedItems.length} selected</span>

          <div className="w-px h-5 bg-slate-600 shrink-0" />

          {/* Bulk Move Stage Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowBulkStageDropdown(!showBulkStageDropdown)
                setShowBulkCounsellorDropdown(false)
              }}
              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer font-sans"
            >
              Move Stage ▾
            </button>
            {showBulkStageDropdown && (
              <div className="absolute bottom-full left-0 mb-2.5 z-20 bg-slate-700 text-white rounded-xl border border-slate-650 shadow-lg p-1.5 min-w-[160px] max-h-48 overflow-y-auto">
                {pipeline.map(s => (
                  <div
                    key={s.id}
                    onClick={() => handleBulkMoveStage(s.id)}
                    className="px-3 py-1.5 text-xs font-semibold hover:bg-slate-600 rounded-lg cursor-pointer flex items-center gap-2 font-sans"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dotClass}`} />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bulk Assign Counsellor Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowBulkCounsellorDropdown(!showBulkCounsellorDropdown)
                setShowBulkStageDropdown(false)
              }}
              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer font-sans"
            >
              Assign Counsellor
            </button>
            {showBulkCounsellorDropdown && (
              <div className="absolute bottom-full left-0 mb-2.5 z-20 bg-slate-700 text-white rounded-xl border border-slate-650 shadow-lg p-1.5 min-w-[160px]">
                {counsellors.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleBulkAssignCounsellor(c.name)}
                    className="px-3 py-1.5 text-xs font-semibold hover:bg-slate-600 rounded-lg cursor-pointer flex items-center gap-2 font-sans"
                  >
                    <span>{c.name}</span>
                  </div>
                ))}
                <div className="border-t border-slate-600 my-1" />
                <div
                  onClick={() => handleBulkAssignCounsellor(null)}
                  className="px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-slate-600 rounded-lg cursor-pointer font-sans"
                >
                  Unassign
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => showToast("Communication sent to selected", "success")}
            className="text-xs font-semibold text-slate-300 hover:text-white cursor-pointer font-sans"
          >
            Send Communication
          </button>

          <button
            onClick={() => {
              showToast("Exported selected applicants", "info")
              setSelectedItems([])
            }}
            className="text-xs font-semibold text-slate-300 hover:text-white cursor-pointer font-sans"
          >
            Export
          </button>

          <div className="w-px h-5 bg-slate-600 shrink-0" />

          <button
            onClick={handleBulkDelete}
            className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer font-sans"
          >
            <Trash2 size={14} strokeWidth={1.5} />
            <span>Delete</span>
          </button>

          <button
            onClick={() => {
              setSelectedItems([])
              setShowBulkStageDropdown(false)
              setShowBulkCounsellorDropdown(false)
            }}
            className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* ===================================================================
          TOAST NOTIFICATIONS
          =================================================================== */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 md:bottom-6 md:right-6 left-4 right-4 md:left-auto z-50 animate-fade-in select-none">
          <div className={`p-4 rounded-xl shadow-xl border flex items-center gap-3 bg-white ${
            toast.type === 'success' ? 'border-green-200 text-green-800' :
            toast.type === 'error' ? 'border-red-200 text-red-800' :
            'border-blue-200 text-blue-800'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="size-5 text-green-500" strokeWidth={2.5} />}
            {toast.type === 'error' && <XCircle className="size-5 text-red-500" strokeWidth={2.5} />}
            {toast.type === 'info' && <Info className="size-5 text-blue-500" strokeWidth={2.5} />}
            <span className="text-sm font-semibold font-sans">{toast.msg}</span>
          </div>
        </div>
      )}

    </div>
    </>
  )
}
