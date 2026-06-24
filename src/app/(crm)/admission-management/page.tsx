"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
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

import { config, type, pipeline as configPipeline } from '@/lib/admission-settings-config'

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
  const [applicants, setApplicants] =
    useState<any[]>([])
  const [loading, setLoading] =
    useState(true)
  const [error, setError] =
    useState<string | null>(null)
  const [pipeline, setPipeline] =
    useState<any[]>([])
  const [pipelineStats, setPipelineStats] =
    useState({
      total: 0,
      conversionRate: 0
    })
  const [pagination, setPagination] =
    useState({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    })
  const [filters, setFilters] = useState({
    stageId: '',
    counsellorId: '',
    search: '',
    academicYearId: ''
  })
  const [activeStageFilter, setActiveStageFilter] =
    useState<string | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
  const [counsellors, setCounsellors] =
    useState<any[]>([])

  const [stageDropdownId, 
    setStageDropdownId] =
    useState<string | null>(null)
  const [counsellorDropdownId,
    setCounsellorDropdownId] =
    useState<string | null>(null)
  const [toast, setToast] = useState<{
    msg: string
    type: 'success' | 'info' | 'error'
    show: boolean
  }>({ msg: '', type: 'success', show: false })
  const [showConvertModal, setShowConvertModal] =
    useState<any | null>(null)
  const [showRejectModal, setShowRejectModal] =
    useState<any | null>(null)

  // Fetch counsellors on mount
  useEffect(() => {
    const fetchCounsellors = async () => {
      try {
        const res = await fetch('/api/v1/counsellors')
        if (res.ok) {
          const json = await res.json()
          setCounsellors(json.data ?? [])
        }
      } catch (err) {
        console.error('Failed to fetch counsellors', err)
      }
    }
    fetchCounsellors()
  }, [])

  // STEP 4: Fetch pipeline summary on mount
  const fetchPipeline = useCallback(
    async () => {
      try {
        const res = await fetch(
          '/api/v1/admissions/pipeline'
        )
        if (!res.ok) throw new Error(
          'Failed to fetch pipeline'
        )
        const json = await res.json()
        setPipeline(json.data?.pipeline ?? [])
        setPipelineStats({
          total: json.data?.total ?? 0,
          conversionRate:
            json.data?.conversionRate ?? 0
        })
      } catch (err) {
        console.error('Pipeline error:', err)
      }
    }, []
  )

  // STEP 5: Add fetchAdmissions function
  const fetchAdmissions = useCallback(
    async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page',
          String(pagination.page))
        params.set('limit', '10')
        if (filters.stageId)
          params.set('stageId',
            filters.stageId)
        if (filters.counsellorId)
          params.set('counsellorId',
            filters.counsellorId)
        if (filters.search)
          params.set('search', filters.search)
        if (filters.academicYearId)
          params.set('academicYearId',
            filters.academicYearId)

        const res = await fetch(
          '/api/v1/admissions?' +
          params.toString()
        )
        if (!res.ok) throw new Error(
          'Failed to fetch admissions'
        )
        const json = await res.json()
        
        // Map API data to original Applicant UI fields
        const mapped = (json.data ?? []).map((adm: any) => {
          const name = adm.applicantName ?? ''
          const avatar = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
          
          const counsellorName = adm.assignedTo?.name ?? null
          const counsellorAvatar = counsellorName
            ? counsellorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            : null
            
          const stageData = configPipeline.find(
            s => s.label === adm.stage?.name ||
            s.label?.toLowerCase() === adm.stage?.name?.toLowerCase() ||
            adm.stage?.name?.toLowerCase().startsWith(s.label?.toLowerCase()) ||
            s.label?.toLowerCase().startsWith(adm.stage?.name?.toLowerCase())
          )
          const stageIndex = stageData ? stageData.order - 1 : 0
          
          const docsUploaded = adm._count?.documents ?? 0
          const docsRequired = 3

          const createdDate = adm.createdAt ? new Date(adm.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }) : '—'

          const daysInStage = adm.createdAt
            ? Math.floor((Date.now() - new Date(adm.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0

          return {
            id: adm.id,
            admissionCode: adm.admissionCode ?? '',
            firstName: name.split(' ')[0] || '',
            lastName: name.split(' ').slice(1).join(' ') || '',
            fullName: name,
            avatar,
            parentName: adm.parentName ?? '',
            phone: adm.phone ?? '',
            email: adm.email ?? '',
            applyingFor: adm.gradeSought ?? '',
            source: adm.source ?? 'Other',
            counsellor: counsellorName,
            counsellorAvatar,
            stage: adm.stage?.name ?? 'New',
            stageId: stageData ? stageData.id : (adm.stageId ?? 'new'),
            stageIndex,
            createdDate,
            status: daysInStage > 14 ? 'overdue' : daysInStage > 7 ? 'warning' : 'active',
            daysInStage,
            pendingAction: null,
            docsUploaded,
            docsRequired,
            feePaid: adm.stage?.isWon ?? false,
            priority: adm.priority === 'URGENT' ? 'Urgent' : adm.priority === 'HIGH' ? 'High' : 'Normal'
          }
        })

        setApplicants(mapped)
        setPagination(json.pagination ?? {
          total: 0, page: 1,
          limit: 10, totalPages: 0
        })
      } catch (err) {
        setError('Failed to load admissions')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, [filters, pagination.page]
  )

  // STEP 6: Add useEffects
  useEffect(() => {
    fetchPipeline()
  }, [fetchPipeline])

  useEffect(() => {
    fetchAdmissions()
  }, [fetchAdmissions])

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
    applicants.filter(a => {
      if (activeStageFilter) {
        const localStage = configPipeline.find(s => s.id === activeStageFilter)
        const activeLabel = localStage ? localStage.label : ''
        if (a.stage.toLowerCase() !== activeLabel.toLowerCase())
          return false
      }
      if (searchQuery &&
        !a.fullName.toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
        !a.admissionCode.toLowerCase()
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

  const totalCount = pipelineStats.total
  const conversionRate = pipelineStats.conversionRate
  const pendingActionCount = 
    applicants.filter(
      a => a.pendingAction !== null
    ).length

  const showingStart = filteredApplicants.length > 0 ? (pagination.page - 1) * 10 + 1 : 0
  const showingEnd = (pagination.page - 1) * 10 + filteredApplicants.length

  const getStageCount = (stageLabel: string) => {
    const apiStage = pipeline.find(
      p => p.label === stageLabel ||
      p.label?.toLowerCase() === stageLabel?.toLowerCase() ||
      p.label?.toLowerCase().startsWith(stageLabel?.toLowerCase()) ||
      stageLabel?.toLowerCase().startsWith(p.label?.toLowerCase())
    )
    return apiStage?.count ?? 0
  }

  const getDatabaseStageId = (localStageLabel: string) => {
    const apiStage = pipeline.find(
      p => p.label === localStageLabel ||
      p.label?.toLowerCase() === localStageLabel?.toLowerCase() ||
      p.label?.toLowerCase().startsWith(localStageLabel?.toLowerCase()) ||
      localStageLabel?.toLowerCase().startsWith(p.label?.toLowerCase())
    )
    return apiStage?.id
  }

  // Unique lists for filter dropdown values
  const uniqueApplyingFor = Array.from(new Set(applicants.map(a => a.applyingFor)))

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

  // STEP 10: Wire inline counsellor assign
  const handleAssignCounsellor = async (applicantId: string, counsellorId: string | null) => {
    try {
      await fetch(
        '/api/v1/admissions/' + applicantId,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assignedToId: counsellorId
          })
        }
      )
      fetchAdmissions()
      const c = counsellors.find(item => item.id === counsellorId)
      showToast(c ? `Assigned to ${c.name}` : 'Unassigned counsellor')
    } catch (err) {
      console.error('Assign failed', err)
    }
    setCounsellorDropdownId(null)
  }

  // STEP 9: Wire inline stage change
  const handleMoveStage = async (applicantId: string, targetStageId: string) => {
    const targetStage = configPipeline.find(s => s.id === targetStageId)
    if (!targetStage) return

    const applicant = applicants.find(a => a.id === applicantId)
    if (!applicant) return

    if (targetStage.isTerminal) {
      if (targetStageId === 'admitted' || targetStageId === 'enrolled') {
        setShowConvertModal(applicant)
      } else if (targetStageId === 'rejected') {
        setShowRejectModal(applicant)
      }
    } else {
      try {
        const dbStageId = getDatabaseStageId(targetStage.label)
        await fetch(
          '/api/v1/admissions/' + applicantId,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              stageId: dbStageId || targetStageId
            })
          }
        )
        fetchAdmissions()
        fetchPipeline()
        showToast(`Moved to ${targetStage.label}`)
      } catch (err) {
        console.error('Stage update failed', err)
      }
    }
    setStageDropdownId(null)
  }

  // STEP 11: Wire convert modal confirm
  const handleConfirmConvert = async () => {
    if (!showConvertModal) return
    const applicantId = showConvertModal.id
    try {
      await fetch(
        '/api/v1/admissions/' +
        applicantId + '/convert',
        { method: 'POST' }
      )
      fetchAdmissions()
      fetchPipeline()
      showToast('Student record created')
    } catch (err) {
      console.error('Convert failed', err)
    }
    setShowConvertModal(null)
  }

  // STEP 12: Wire reject confirm
  const handleConfirmReject = async () => {
    if (!showRejectModal) return
    const applicantId = showRejectModal.id
    try {
      await fetch(
        '/api/v1/admissions/' + applicantId,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'REJECTED',
            rejectionReason: rejectReason
          })
        }
      )
      fetchAdmissions()
      fetchPipeline()
    } catch (err) {
      console.error('Reject failed', err)
    }
    setShowRejectModal(null)
    setRejectReason('')
  }

  // Bulk operation handlers
  const handleBulkMoveStage = async (targetStageId: string) => {
    const targetStage = configPipeline.find(s => s.id === targetStageId)
    if (!targetStage) return

    try {
      const dbStageId = getDatabaseStageId(targetStage.label)
      await Promise.all(selectedItems.map(id =>
        fetch('/api/v1/admissions/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stageId: dbStageId || targetStageId })
        })
      ))
      fetchAdmissions()
      fetchPipeline()
      showToast(`Selected applicants moved to ${targetStage.label}`)
    } catch (err) {
      console.error('Bulk move failed', err)
    }
    setShowBulkStageDropdown(false)
    setSelectedItems([])
  }

  const handleBulkAssignCounsellor = async (counsellorName: string | null) => {
    const c = counsellors.find(item => item.name === counsellorName)
    const counsellorId = c ? c.id : null
    try {
      await Promise.all(selectedItems.map(id =>
        fetch('/api/v1/admissions/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedToId: counsellorId })
        })
      ))
      fetchAdmissions()
      showToast(counsellorName ? `Selected assigned to ${counsellorName}` : 'Selected unassigned')
    } catch (err) {
      console.error('Bulk assign failed', err)
    }
    setShowBulkCounsellorDropdown(false)
    setSelectedItems([])
  }

  const handleBulkDelete = () => {
    setApplicants(prev => prev.filter(a => !selectedItems.includes(a.id)))
    setSelectedItems([])
    showToast('Deleted selected applicants', 'error')
  }

  const getLeftBorderBg = (a: any) => {
    if (a.status === 'overdue') return 'bg-red-500'
    if (a.status === 'warning') return 'bg-amber-400'
    if (a.status === 'recent' || a.daysInStage <= 1) return 'bg-green-400'
    return 'bg-transparent'
  }

  return (
    <>
      {navigating && <LoadingScreen />}
      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto w-full select-none">
          
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
                {configPipeline.map((stage, idx) => {
                  const IconComponent = getIcon(stage.iconName)
                  const isActive = activeStageFilter === stage.id
                  const maxCount = Math.max(...pipeline.map(s => s.count), 0) || 1
                  const stageCount = getStageCount(stage.label)

                  return (
                    <React.Fragment key={stage.id}>
                      <div className="flex flex-col">
                        <div
                          onClick={() => {
                            const newStageId = activeStageFilter === stage.id ? '' : stage.id
                            setActiveStageFilter(newStageId || null)
                            
                            const dbStage = pipeline.find(
                              p => p.label === stage.label ||
                              p.label?.toLowerCase() === stage.label?.toLowerCase() ||
                              p.label?.toLowerCase().startsWith(stage.label?.toLowerCase()) ||
                              stage.label?.toLowerCase().startsWith(p.label?.toLowerCase())
                            )
                            
                            setFilters(f => ({
                              ...f,
                              stageId: newStageId ? (dbStage ? dbStage.id : '') : ''
                            }))
                            setPagination(p => ({ ...p, page: 1 }))
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
                            {stageCount}
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
                          style={{ width: `${(stageCount / maxCount) * 100}%`, minWidth: '6px' }}
                        />
                      </div>

                      {idx < configPipeline.length - 1 && (
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
                    setFilters(f => ({
                      ...f,
                      stageId: ''
                    }))
                    setPagination(p => ({ ...p, page: 1 }))
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-[#1565D8] flex items-center gap-1 cursor-pointer font-sans"
                >
                  <X size={12} />
                  Clear filter · Showing {configPipeline.find(p => p.id === activeStageFilter)?.label} ({filteredApplicants.length})
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
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  clearTimeout(searchTimeout.current)
                  searchTimeout.current = setTimeout(
                    () => {
                      setFilters(f => ({
                        ...f,
                        search: e.target.value
                      }))
                      setPagination(p =>
                        ({ ...p, page: 1 }))
                    },
                    300
                  )
                }}
                className="bg-transparent border-none outline-none text-sm w-full text-slate-750 placeholder-slate-500 font-sans"
              />
              {searchQuery && (
                <button onClick={() => {
                  setSearchQuery('')
                  setFilters(f => ({
                    ...f,
                    search: ''
                  }))
                  setPagination(p => ({ ...p, page: 1 }))
                }} className="text-slate-400 hover:text-slate-650">
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
                  <span>{filterStage ? `Stage: ${configPipeline.find(s => s.id === filterStage)?.label}` : 'Stage ▾'}</span>
                </button>
                {showStageFilterDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px] max-h-48 overflow-y-auto">
                    <div 
                      onClick={() => { setFilterStage(null); setShowStageFilterDropdown(false) }}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                    >
                      All Stages
                    </div>
                    {configPipeline.map(s => (
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
          {!loading && filteredApplicants.length === 0 && (
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
          {activeView === 'list' && (loading || filteredApplicants.length > 0) && (
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <div
                      key={`skeleton-${idx}`}
                      className={`relative flex items-center px-4 py-3.5 gap-3 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      <div className="w-8 flex-shrink-0">
                        <Skeleton className="w-4 h-4 rounded" />
                      </div>
                      <div className="flex-1 min-w-[200px] flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-full" />
                        <div className="space-y-1.5 flex-1 max-w-[150px]">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                      <div className="hidden md:flex w-32 flex-shrink-0">
                        <Skeleton className="h-6 w-16 rounded-lg" />
                      </div>
                      <div className="hidden md:flex w-28 flex-shrink-0">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <div className="hidden xl:flex w-24 flex-shrink-0 gap-1.5">
                        <Skeleton className="w-7 h-7 rounded-lg" />
                        <Skeleton className="w-7 h-7 rounded-lg" />
                        <Skeleton className="w-7 h-7 rounded-lg" />
                      </div>
                      <div className="hidden xl:flex w-36 flex-shrink-0">
                        <Skeleton className="h-5 w-24 rounded" />
                      </div>
                      <div className="w-36 flex-shrink-0">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <div className="hidden md:flex w-20 flex-shrink-0">
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <div className="hidden xl:flex w-24 flex-shrink-0">
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="w-12 flex-shrink-0 flex justify-center">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                      </div>
                    </div>
                  ))
                ) : (
                  filteredApplicants.map((a, idx) => {
                    const stageData = configPipeline.find(s => s.id === a.stageId) || configPipeline[0]
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
                                e.stopPropagation()
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
                          } ${sourceConfig[a.source]?.text || 'text-slate-650'}`}>
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
                                  onClick={() => handleAssignCounsellor(a.id, c.id)}
                                  className="px-3 py-2 rounded-lg cursor-pointer text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-sans"
                                >
                                  <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold flex items-center justify-center shrink-0">
                                    {c.name ? c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : ''}
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
                            {configPipeline.filter(s => s.id !== 'rejected').map((s, sIdx) => (
                              <span
                                key={s.id}
                                className={`w-2 h-2 rounded-full ${
                                  sIdx <= a.stageIndex ? `${s.dotClass} opacity-100` : 'bg-slate-200'
                                }`}
                              />
                            ))}
                            <span className="text-[9px] text-slate-400 ml-1.5 font-sans font-medium">
                              {a.stageIndex + 1}/{configPipeline.length - 1}
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
                              {configPipeline.map(s => (
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
                                  router.push('/admission-management/' + a.id)
                                }}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                <Eye size={14} strokeWidth={1.5} className="text-slate-400"/>
                                View Applicant
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push('/admission-management/' + a.id + '/edit')
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
                  })
                )}
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION 6 — GRID VIEW
              =================================================================== */}
          {activeView === 'grid' && (loading || filteredApplicants.length > 0) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`skeleton-grid-${idx}`}
                    className="bg-white rounded-xl border border-slate-200 shadow-md p-5 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-1.5 flex-1 min-w-[120px]">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="w-8 h-8 rounded-lg" />
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <Skeleton className="h-6 w-16 rounded-lg" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <div className="border-t border-slate-200 my-3" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex items-center gap-1 mt-2.5">
                      {Array.from({ length: 7 }).map((_, sIdx) => (
                        <Skeleton key={sIdx} className="w-2 h-2 rounded-full" />
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="w-7 h-7 rounded-lg" />
                        <Skeleton className="w-7 h-7 rounded-lg" />
                        <Skeleton className="w-7 h-7 rounded-lg" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))
              ) : (
                filteredApplicants.map(a => {
                  const stageData = configPipeline.find(s => s.id === a.stageId) || configPipeline[0]
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
                              {a.admissionCode}
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
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push('/admission-management/' + a.id)
                                }}
                              >
                                <Eye size={14} className="mr-2 text-slate-400" strokeWidth={1.5} />
                                <span>View {config.applicantLabel[type]}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push('/admission-management/' + a.id + '/edit')
                                }}
                              >
                                <Pencil size={14} className="mr-2 text-slate-400" strokeWidth={1.5} />
                                <span>Edit {config.applicantLabel[type]}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  showToast("Showing Documents", "info")
                                }}
                              >
                                <FileText size={14} className="mr-2 text-slate-400" strokeWidth={1.5} />
                                <span>View Documents</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowConvertModal(a)
                                }}
                                className="text-[#1565D8] font-semibold"
                              >
                                <CheckCircle2 size={14} className="mr-2 text-[#1565D8]" strokeWidth={1.5} />
                                <span>{config.convertToStudentLabel[type]}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowRejectModal(a)
                                }}
                                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              >
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
                        } ${sourceConfig[a.source]?.text || 'text-slate-660'}`}>
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
                        {configPipeline.filter(s => s.id !== 'rejected').map((s, sIdx) => (
                          <span
                            key={s.id}
                            className={`w-2 h-2 rounded-full ${
                              sIdx <= a.stageIndex ? `${s.dotClass} opacity-100` : 'bg-slate-200'
                            }`}
                          />
                        ))}
                        <span className="text-[9px] text-slate-400 ml-1.5 font-sans font-medium">
                          {a.stageIndex + 1}/{configPipeline.length - 1}
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
                })
              )}
            </div>
          )}

          {/* ===================================================================
              SECTION 7 — KANBAN VIEW
              =================================================================== */}
          {activeView === 'kanban' && (loading || filteredApplicants.length > 0) && (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300">
                {configPipeline.map(stage => {
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
                          {loading ? (
                            <Skeleton className="w-6 h-4 rounded-full shrink-0" />
                          ) : (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${stage.bgClass} ${stage.textClass}`}>
                              {stageApplicants.length}
                            </span>
                          )}
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
                        {loading ? (
                          Array.from({ length: 2 }).map((_, idx) => (
                            <div
                              key={`skeleton-kanban-${stage.id}-${idx}`}
                              className="bg-white rounded-xl border border-slate-200 shadow-md p-4 relative overflow-hidden"
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-1 flex-1">
                                  <Skeleton className="h-2.5 w-12" />
                                  <Skeleton className="h-4 w-28" />
                                </div>
                                <Skeleton className="w-6 h-6 rounded" />
                              </div>
                              <Skeleton className="h-3.5 w-20 mt-1.5" />
                              <div className="flex justify-between items-center mt-3">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-4 w-16 rounded-full" />
                              </div>
                              <div className="flex items-center gap-1 mt-2.5">
                                {Array.from({ length: 7 }).map((_, sIdx) => (
                                  <Skeleton key={sIdx} className="w-1.5 h-1.5 rounded-full" />
                                ))}
                              </div>
                              <div className="flex items-center justify-between mt-2.5">
                                <Skeleton className="h-3 w-12" />
                              </div>
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-3 w-10" />
                              </div>
                              <div className="mt-2.5 flex items-center gap-1">
                                <Skeleton className="w-6 h-6 rounded" />
                                <Skeleton className="w-6 h-6 rounded" />
                                <Skeleton className="w-6 h-6 rounded" />
                              </div>
                            </div>
                          ))
                        ) : stageApplicants.length === 0 ? (
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
                                      {a.admissionCode}
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
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            router.push('/admission-management/' + a.id)
                                          }}
                                        >
                                          View Info
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            router.push('/admission-management/' + a.id + '/edit')
                                          }}
                                        >
                                          Edit Info
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setShowConvertModal(a)
                                          }}
                                          className="text-[#1565D8] font-bold"
                                        >
                                          Convert
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setShowRejectModal(a)
                                          }}
                                          className="text-red-500"
                                        >
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
                                  {configPipeline.filter(s => s.id !== 'rejected').map((s, sIdx) => (
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
          {(activeView === 'list' || activeView === 'grid') && (loading || filteredApplicants.length > 0) && (
            <div className="bg-white border-t border-slate-200 rounded-b-xl px-5 py-4 flex items-center justify-between shadow-sm">
              <span className="text-sm text-slate-500 font-sans">
                Showing {loading ? '...' : `${showingStart}–${showingEnd}`} of {totalCount} {moduleLabel.toLowerCase()}
              </span>

              <div className="flex items-center gap-2 select-none">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={loading || pagination.page <= 1}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-semibold font-sans transition ${
                    loading || pagination.page <= 1
                      ? 'border-slate-200 text-slate-400 bg-slate-50/50 cursor-not-allowed'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-750 cursor-pointer'
                  }`}
                >
                  Previous
                </button>
                <button className="px-3 py-1.5 border border-[#1565D8] rounded-lg text-xs font-bold text-white bg-[#1565D8] font-sans">
                  {pagination.page}
                </button>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                  disabled={loading || pagination.page >= pagination.totalPages}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-semibold font-sans transition ${
                    loading || pagination.page >= pagination.totalPages
                      ? 'border-slate-200 text-slate-400 bg-slate-50/50 cursor-not-allowed'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-750 cursor-pointer'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

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

    </>
  )
}
