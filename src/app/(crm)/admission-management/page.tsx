"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { useCounsellors } from '@/hooks/useCounsellors'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'
import { format } from 'date-fns'
import {
  ClipboardList,
  Users,
  CreditCard,
  Shield,
  ChevronDown,
  ChevronUp,
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
  FileText,
  Loader2,
  BarChart2,
  UserPlus
} from 'lucide-react'
import TableSkeleton from '@/components/shared/TableSkeleton'
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

// Grades constants are imported from @/constants/grades

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
  const [pagination, setPagination] =
    useState({
      total: 0,
      page: 1,
      limit: 25,
      totalPages: 0
    })
  const setCurrentPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }
  const [filters, setFilters] = useState({
    stageId: '',
    applyingFor: '',
    counsellorId: '',
    priority: '',
    search: '',
    status: '',
  })
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeStageFilter, setActiveStageFilter] =
    useState<string | null>(null)

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

  const [stages, setStages] =
    useState<any[]>([])
  const [activeStageId, setActiveStageId] =
    useState<string>('all')
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const res = await fetch(
          '/api/v1/settings/pipeline'
        )
        const data = await res.json()
        setStages(data.stages || [])
      } catch (err) {
        console.error(
          'Failed to fetch stages:', err
        )
      }
    }
    fetchStages()
  }, [])

  const [pipelineExpanded, setPipelineExpanded] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('admission_pipeline_expanded') === 'true'
  })

  const togglePipeline = (val: boolean) => {
    setPipelineExpanded(val)
    localStorage.setItem('admission_pipeline_expanded', String(val))
  }
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
  
  // Use shared hook for counsellor list
  const { counsellors } = useCounsellors()

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

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const close = () => setOpenMenuId(null)
    if (openMenuId) {
      document.addEventListener('click', close)
    }
    return () => {
      document.removeEventListener('click', close)
    }
  }, [openMenuId])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])
  const [showConvertModal, setShowConvertModal] =
    useState<any | null>(null)
  const [showRejectModal, setShowRejectModal] =
    useState<any | null>(null)

  // SWR for pipeline summary
  const { data: pipelineData, mutate: mutatePipeline } = useSWR(
    '/api/v1/admissions/pipeline',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  const stageCounts = useMemo<Record<string, number>>(() => {
    return pipelineData?.data?.pipeline?.reduce(
      (acc: any, s: any) => {
        acc[s.id] = s.count || 0
        return acc
      }, {}
    ) || {}
  }, [pipelineData])

  const totalCount = pipelineData?.data?.total || 0

  const pipeline = useMemo(() => pipelineData?.data?.pipeline ?? [], [pipelineData])
  const pipelineStats = useMemo(() => ({
    total: pipelineData?.data?.total ?? 0,
    conversionRate: pipelineData?.data?.conversionRate ?? 0,
    avgDaysToAdmit: pipelineData?.data?.avgDaysToAdmit ?? 0
  }), [pipelineData])

  const currentPage = pagination.page
  const counsellorFilter = useMemo(() => filterCounsellor ? counsellors.find((c: any) => c.name === filterCounsellor)?.id : null, [filterCounsellor, counsellors])
  const priorityFilter = useMemo(() => filterPriority === 'Urgent' ? 'URGENT' : filterPriority === 'High' ? 'HIGH' : filterPriority === 'Normal' ? 'MEDIUM' : null, [filterPriority])
  const dateRange = useMemo(() => ({
    from: filterDateRange === 'Jun' ? '2026-06-01' : filterDateRange === 'May' ? '2026-05-01' : filterDateRange === 'Apr' ? '2026-04-01' : null,
    to: filterDateRange === 'Jun' ? '2026-06-30' : filterDateRange === 'May' ? '2026-05-31' : filterDateRange === 'Apr' ? '2026-04-30' : null,
  }), [filterDateRange])

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    params.set('page', String(currentPage))
    params.set('limit', '25')

    if (searchQuery) {
      params.set('search', searchQuery)
    }

    if (activeStageId !== 'all') {
      params.set('stageId', activeStageId)
    }

    if (counsellorFilter) {
      params.set('assignedToId', counsellorFilter)
    }

    if (priorityFilter) {
      params.set('priority', priorityFilter)
    }

    if (dateRange.from) {
      params.set('dateFrom', dateRange.from)
    }

    if (dateRange.to) {
      params.set('dateTo', dateRange.to)
    }

    return params.toString()
  }, [currentPage, searchQuery, activeStageId, counsellorFilter, priorityFilter, dateRange])

  const { data: admissionsData, error: swrError, isLoading: loading, mutate } = useSWR<any>(
    `/api/v1/admissions?${buildQueryParams()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
    }
  )

  useEffect(() => {
    fetchAdmissions()
  }, [
    currentPage,
    searchQuery,
    activeStageId,
    counsellorFilter,
    priorityFilter,
    dateRange,
  ])

  const error = swrError ? 'Failed to load admissions' : null

  // Update pagination total / totalPages when SWR data is fetched
  useEffect(() => {
    if (admissionsData?.pagination) {
      setPagination(prev => ({
        ...prev,
        total: admissionsData.pagination.total,
        totalPages: admissionsData.pagination.totalPages
      }))
    }
  }, [admissionsData?.pagination])

  // Derive applicants list from SWR data
  const applicants = useMemo(() => {
    const rawList = admissionsData?.admissions || admissionsData?.data || []
    return rawList.map((adm: any) => {
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
        counsellorId: adm.assignedTo?.id ?? null,
        stage: adm.stage || { name: 'New' },
        stageId: stageData ? stageData.id : (adm.stageId ?? 'new'),
        stageIndex,
        createdDate,
        createdAt: adm.createdAt,
        academicYear: adm.academicYear?.name ?? '',
        status: daysInStage > 14 ? 'overdue' : daysInStage > 7 ? 'warning' : 'active',
        daysInStage,
        pendingAction: null,
        docsUploaded,
        docsRequired,
        feePaid: adm.stage?.isWon ?? false,
        priority: adm.priority === 'URGENT' ? 'Urgent' : adm.priority === 'HIGH' ? 'High' : 'Normal',
        dbStatus: adm.status
      }
    })
  }, [admissionsData])

  // Mutate trigger wrappers
  const fetchPipeline = useCallback(async () => {
    mutatePipeline()
  }, [mutatePipeline])

  const fetchAdmissions = useCallback(async () => {
    mutate()
  }, [mutate])



  // Layout sidebar states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Modal Reject Reason state
  const [rejectReason, setRejectReason] = useState('')

  const [convertStudentName, setConvertStudentName] = useState('')
  const [convertStudentDob, setConvertStudentDob] = useState('')
  const [convertStudentGrade, setConvertStudentGrade] = useState('')
  const [convertStudentSection, setConvertStudentSection] = useState('')
  const [convertStudentRollNumber, setConvertStudentRollNumber] = useState('')
  const [convertStudentGuardianName, setConvertStudentGuardianName] = useState('')
  const [convertError, setConvertError] = useState('')
  const [isSubmittingConvert, setIsSubmittingConvert] = useState(false)

  useEffect(() => {
    if (showConvertModal) {
      setConvertStudentName(showConvertModal.fullName || '')
      setConvertStudentDob('')
      setConvertStudentGrade(showConvertModal.applyingFor || '')
      setConvertStudentSection('')
      setConvertStudentRollNumber('')
      setConvertStudentGuardianName(showConvertModal.parentName || '')
      setConvertError('')
    }
  }, [showConvertModal])

  // Bulk action sub-dropdowns
  const [showBulkStageDropdown, setShowBulkStageDropdown] = useState(false)
  const [showBulkCounsellorDropdown, setShowBulkCounsellorDropdown] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams && searchParams.get('success') === 'created') {
      showToast('Admission record created successfully')
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  const getStatusBadge = (dbStatus: string) => {
    switch (dbStatus) {
      case 'ADMITTED':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Admitted
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Rejected
          </span>
        )
      case 'WAITLISTED':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Waitlisted
          </span>
        )
      case 'WITHDRAWN':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            Withdrawn
          </span>
        )
      case 'IN_PROGRESS':
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            In Progress
          </span>
        )
    }
  }

  const formatStatus = (
    status: string
  ): string => {
    const map: Record<string,string>
      = {
      IN_PROGRESS: 'In Progress',
      ADMITTED: 'Admitted',
      REJECTED: 'Rejected',
      WAITLISTED: 'Waitlisted',
      WITHDRAWN: 'Withdrawn',
    }
    return map[status] || status
  }

  const statusBadgeColor = (
    status: string
  ): string => {
    const map: Record<string,string>
      = {
      IN_PROGRESS:
        'bg-blue-50 text-blue-700',
      ADMITTED:
        'bg-green-50 text-green-700',
      REJECTED:
        'bg-red-50 text-red-700',
      WAITLISTED:
        'bg-amber-50 text-amber-700',
      WITHDRAWN:
        'bg-slate-100 text-slate-500',
    }
    return map[status]
      || 'bg-slate-100 text-slate-500'
  }



  const formatDate = (dateString: any) => {
    if (!dateString) return '—'
    try {
      return format(new Date(dateString), 'd MMM')
    } catch (e) {
      return '—'
    }
  }

  const handleNavigate = (path: string) => {
    router.push(path)
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

  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()

      if (activeStageId !== 'all') {
        params.set('stageId', activeStageId)
      }
      if (searchQuery) {
        params.set('search', searchQuery)
      }
      if (counsellorFilter) {
        params.set('assignedToId', counsellorFilter)
      }
      if (priorityFilter) {
        params.set('priority', priorityFilter)
      }
      if (dateRange.from) {
        params.set('dateFrom', dateRange.from)
      }
      if (dateRange.to) {
        params.set('dateTo', dateRange.to)
      }

      const res = await fetch(`/api/v1/admissions/export?${params.toString()}`)

      if (!res.ok) throw new Error()

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `admissions-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showToast('Export downloaded successfully', 'success')
    } catch {
      showToast('Export failed', 'error')
    } finally {
      setIsExporting(false)
    }
  }

  // ===================================================================
  // FILTERING LOGIC
  // ===================================================================
  const filteredApplicants = 
    applicants.filter((a: any) => {
      if (activeStageFilter) {
        const localStage = configPipeline.find(s => s.id === activeStageFilter)
        const activeLabel = localStage ? localStage.label : ''
        if ((a.stage?.name || a.stage || '').toLowerCase() !== activeLabel.toLowerCase())
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

  const conversionRate = useMemo(() => {
    const total = Object.values(stageCounts).reduce((a, b) => a + b, 0) || totalCount || 0
    const wonStage = stages.find(s => s.isWon === true)
    const admitted = wonStage ? (stageCounts[wonStage.id] || 0) : 0
    return total > 0 ? Math.round((admitted / total) * 100) : 0
  }, [stageCounts, totalCount, stages])

  const displayAdmittedCount = useMemo(() => {
    const wonStage = stages.find(s => s.isWon === true)
    return wonStage ? (stageCounts[wonStage.id] || 0) : 0
  }, [stageCounts, stages])
  const pendingActionCount = 
    applicants.filter(
      (a: any) => a.pendingAction !== null
    ).length

  const showingStart = filteredApplicants.length > 0 ? (pagination.page - 1) * 10 + 1 : 0
  const showingEnd = (pagination.page - 1) * 10 + filteredApplicants.length

  const getStageCount = (stageLabel: string) => {
    const apiStage = pipeline.find(
      (p: any) => p.label === stageLabel ||
      (p.label && stageLabel && p.label.toLowerCase() === stageLabel.toLowerCase())
    )
    return apiStage?.count ?? 0
  }

  const getDatabaseStageId = (localStageLabel: string) => {
    const apiStage = pipeline.find(
      (p: any) => p.label === localStageLabel ||
      (p.label && localStageLabel && p.label.toLowerCase() === localStageLabel.toLowerCase())
    )
    return apiStage?.id
  }

  // Unique lists for filter dropdown values
  const uniqueApplyingFor = Array.from(new Set(applicants.map((a: any) => a.applyingFor)))

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
    setActiveStageId('all')
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
      setSelectedItems(filteredApplicants.map((a: any) => a.id))
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
      const c = counsellors.find((item: any) => item.id === counsellorId)
      showToast(c ? `Assigned to ${c.name}` : 'Unassigned counsellor')
    } catch (err) {
      console.error('Assign failed', err)
    }
    setCounsellorDropdownId(null)
  }

  const handleStatusChange = async (applicantId: string, targetStatus: string) => {
    try {
      const res = await fetch(
        '/api/v1/admissions/' + applicantId,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: targetStatus
          })
        }
      )
      if (!res.ok) throw new Error('Failed to update status')
      fetchAdmissions()
      fetchPipeline()
      showToast(`Status updated to ${targetStatus}`)
    } catch (err: any) {
      console.error('Status update failed', err)
      showToast(err.message || 'Failed to update status', 'error')
    }
  }

  // STEP 9: Wire inline stage change
  const handleMoveStage = async (applicantId: string, targetStageId: string) => {
    const targetStage = configPipeline.find(s => s.id === targetStageId)
    if (!targetStage) return

    const applicant = applicants.find((a: any) => a.id === applicantId)
    if (!applicant) return

    const dbStageId = getDatabaseStageId(targetStage.label) || targetStageId
    const selectedStage = stages.find(s => s.id === dbStageId)

    const previousData = admissionsData
    const rawAdmissions = admissionsData?.admissions || admissionsData?.data || []

    const updatedAdmissions = rawAdmissions.map((a: any) =>
      a.id === applicantId
        ? {
            ...a,
            stageId: dbStageId,
            stage: selectedStage ? {
              id: selectedStage.id,
              name: selectedStage.name,
              color: selectedStage.color || '#e2e8f0',
              isWon: selectedStage.isWon || false,
              isLost: selectedStage.isLost || false
            } : a.stage
          }
        : a
    )

    // Optimistic SWR cache update
    mutate(
      {
        ...admissionsData,
        data: updatedAdmissions,
        admissions: updatedAdmissions
      },
      { revalidate: false }
    )

    try {
      const res = await fetch(
        '/api/v1/admissions/' + applicantId,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            stageId: dbStageId
          })
        }
      )
      if (!res.ok) throw new Error('Failed to update stage')

      const data = await res.json()
      if (data.admission) {
        const finalAdmissions = rawAdmissions.map((a: any) =>
          a.id === applicantId ? data.admission : a
        )
        mutate(
          {
            ...admissionsData,
            data: finalAdmissions,
            admissions: finalAdmissions
          },
          { revalidate: true }
        )
      } else {
        mutate()
      }

      fetchPipeline()

      const dbStage = pipeline.find((p: any) => p.id === dbStageId)
      const isWon = dbStage?.isWon || targetStageId === 'admitted' || targetStageId === 'enrolled'
      const isLost = dbStage?.isLost || targetStageId === 'rejected'

      if (isWon) {
        setShowConvertModal(applicant)
      } else if (isLost) {
        setShowRejectModal(applicant)
      } else {
        showToast('Stage updated', 'success')
      }
    } catch (err: any) {
      // Rollback on failure
      mutate(previousData, { revalidate: false })
      showToast(err.message || 'Failed to update stage', 'error')
    }
    setStageDropdownId(null)
  }

  // STEP 11: Wire convert modal confirm
  const handleConfirmConvert = async () => {
    if (!showConvertModal) return
    const applicantId = showConvertModal.id
    try {
      setIsSubmittingConvert(true)
      setConvertError('')
      const res = await fetch(
        '/api/v1/admissions/' + applicantId + '/convert',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: convertStudentName,
            dateOfBirth: convertStudentDob || undefined,
            gradeLabel: convertStudentGrade,
            rollNumber: convertStudentRollNumber || undefined,
            guardianName: convertStudentGuardianName || undefined
          })
        }
      )
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to convert to student record')
      }
      showToast(`Student record created: ${json.data.studentCode || 'STU-XXXXX'}`)
      setShowConvertModal(null)
      fetchAdmissions()
      fetchPipeline()
      router.push(`/student-management/${json.data.id}`)
    } catch (err: any) {
      console.error('Convert failed', err)
      setConvertError(err.message || 'Failed to convert to student')
    } finally {
      setIsSubmittingConvert(false)
    }
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
    const c = counsellors.find((item: any) => item.name === counsellorName)
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

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return

    const confirmed = window.confirm(
      `Delete ${selectedItems.length} admission(s)? This cannot be undone.`
    )
    if (!confirmed) return

    setIsLoading(true)
    try {
      const results = await Promise.all(
        selectedItems.map(id =>
          fetch(
            `/api/v1/admissions/${id}`,
            { method: 'DELETE' }
          )
        )
      )
      
      const failed = results.filter(r => !r.ok)
      if (failed.length > 0) {
        showToast('Failed to delete some admissions', 'error')
      } else {
        showToast(`${selectedItems.length} admission(s) deleted`, 'success')
      }
      setSelectedItems([])
      fetchAdmissions()
      fetchPipeline()
    } catch (err) {
      console.error(err)
      showToast('Failed to delete some admissions', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAdmission = async (admissionId: string) => {
    const confirmed = window.confirm('Delete this admission record?')
    if (!confirmed) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/v1/admissions/${admissionId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error()
      showToast('Admission deleted', 'success')
      fetchAdmissions()
      fetchPipeline()
    } catch {
      showToast('Failed to delete', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const rowBorderColor = (status: string): string => {
    const colors: Record<string, string> = {
      IN_PROGRESS: 'border-l-blue-400',
      ADMITTED: 'border-l-green-500',
      REJECTED: 'border-l-red-400',
      WAITLISTED: 'border-l-amber-400',
      WITHDRAWN: 'border-l-slate-300',
    }
    return colors[status] || 'border-l-slate-200'
  }

  const getStageColor = (
    name?: string
  ): {
    bg: string
    text: string
    border: string
  } => {
    if (!name) return {
      bg: '#F8FAFC',
      text: '#64748B',
      border: 'border-l-slate-200'
    }
    const n = name.toLowerCase()
    if (n.includes('admit'))
      return { bg: '#F0FDF4',
        text: '#16A34A',
        border: 'border-l-green-500' }
    if (n.includes('reject'))
      return { bg: '#FEF2F2',
        text: '#DC2626',
        border: 'border-l-red-400' }
    if (n.includes('interview'))
      return { bg: '#F5F3FF',
        text: '#7C3AED',
        border: 'border-l-purple-400' }
    if (n.includes('payment'))
      return { bg: '#FFFBEB',
        text: '#D97706',
        border: 'border-l-amber-400' }
    if (n.includes('doc'))
      return { bg: '#EFF6FF',
        text: '#2563EB',
        border: 'border-l-blue-400' }
    if (n.includes('contact'))
      return { bg: '#F0F9FF',
        text: '#0284C7',
        border: 'border-l-sky-400' }
    return { bg: '#F8FAFC',
      text: '#64748B',
      border: 'border-l-slate-300' }
  }

  const getStageBorderColor = (
    stageName?: string
  ): string => {
    if (!stageName)
      return 'border-l-slate-200'
    const n = stageName.toLowerCase()
    if (n.includes('new'))
      return 'border-l-slate-400'
    if (n.includes('contact'))
      return 'border-l-sky-400'
    if (n.includes('application'))
      return 'border-l-blue-400'
    if (n.includes('doc'))
      return 'border-l-indigo-400'
    if (n.includes('interview'))
      return 'border-l-purple-400'
    if (n.includes('payment'))
      return 'border-l-amber-400'
    if (n.includes('admit'))
      return 'border-l-green-500'
    if (n.includes('reject'))
      return 'border-l-red-400'
    return 'border-l-slate-300'
  }

  const getAvatarColor = (
    name: string
): string => {
    const colors = [
      '#1565D8', '#7C3AED', '#059669',
      '#D97706', '#DC2626', '#0891B2',
      '#4F46E5', '#BE185D',
    ]
    const index = name.charCodeAt(0)
      % colors.length
    return colors[index]
  }

  const openCounsellorPicker = (admissionId: string) => {
    setCounsellorDropdownId(counsellorDropdownId === admissionId ? null : admissionId)
  }

  const MINIMUM_ROWS = 8
  const placeholderCount = Math.max(
    0,
    MINIMUM_ROWS - filteredApplicants.length
  )

  return (
    <>
      <div className="p-3 sm:p-4 lg:p-6 space-y-3 max-w-7xl mx-auto w-full select-none bg-white min-h-screen">
          
          {/* SECTION 1 — PAGE HEADER SECTION */}
          <div className="flex items-center justify-between gap-2 mb-6">
            <h1 className="text-xl font-bold text-slate-900 flex-1 min-w-0">
              Admission Management
            </h1>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                {isExporting ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Download size={14} />
                )}
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
              <button
                onClick={() => {
                  setIsNavigating(true)
                  router.push('/admission-management/create')
                }}
                disabled={isNavigating}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                {isNavigating ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Plus size={14} />
                )}
                <span>New Admission</span>
              </button>
            </div>
          </div>

          {/* SECTION 2 — PIPELINE SUMMARY STRIP */}
          {!pipelineExpanded ? (
            <div className="mx-4 mb-3">
              <div 
                className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-[#1565D8]/30 hover:bg-blue-50/20 transition-colors"
                onClick={() => togglePipeline(true)}
              >
                <div className="flex items-center gap-3 overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
                    <BarChart2 className="size-14 text-[#1565D8]" />
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      ADMISSION PIPELINE
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
                    <span className="text-xs text-slate-400">Total:</span>
                    <span className="text-xs font-bold text-slate-800">
                      {Object.values(stageCounts).reduce((a, b) => a + b, 0) || totalCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
                    <span className="text-xs text-slate-400 font-sans">Conversion:</span>
                    <span className="text-xs font-bold text-green-600">{conversionRate}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap">
                    <span className="text-xs text-slate-400 font-sans">Admitted:</span>
                    <span className="text-xs font-bold text-blue-600">
                      {displayAdmittedCount}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap ml-auto">
                  <span className="text-xs text-[#1565D8] font-medium font-sans">View Pipeline</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-4 mb-3">
              <div className="bg-white rounded-xl border border-slate-200 shadow-md px-5 py-4 border-t-4 border-t-[#1565D8] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    ADMISSION MANAGEMENT PIPELINE
                  </span>
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {config.academicYear}
                  </span>
                </div>
                <button
                  onClick={() => togglePipeline(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer font-sans transition-colors"
                >
                  <span>Collapse</span>
                  <ChevronUp size={12} />
                </button>
              </div>

              {/* STATS CARDS ROW */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
                {/* Card 1: Total */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
                  <div className="text-xs text-slate-500 font-medium mb-1">Total Applicants</div>
                  <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
                </div>
                {/* Card 2: Conversion */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
                  <div className="text-xs text-slate-500 font-medium mb-1">Conversion Rate</div>
                  <div className="text-2xl font-bold text-green-600">{conversionRate}%</div>
                </div>
                {/* Card 3: Avg. to admit */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
                  <div className="text-xs text-slate-500 font-medium mb-1">Avg. to Admit</div>
                  <div className="text-2xl font-bold text-[#1565D8]">{pipelineStats.avgDaysToAdmit || 0} days</div>
                </div>
                {/* Card 4: Pending Action */}
                <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
                  <div className="text-xs text-slate-500 font-medium mb-1">Pending Action</div>
                  <div className="text-2xl font-bold text-red-600">{pendingActionCount}</div>
                </div>
              </div>


            </div>
          </div>
          )}
          {/* STAGE TABS */}
          <div className="overflow-x-auto overflow-y-hidden -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mb-4">
            <div className="flex gap-1 min-w-max border-b border-slate-200 pb-0">
              <button
                onClick={() => {
                  setActiveStageId('all')
                  setCurrentPage(1)
                }}
                className={`px-3 py-2.5 text-sm font-medium cursor-pointer relative transition-all duration-200 flex-shrink-0 whitespace-nowrap ${
                  activeStageId === 'all'
                    ? 'text-[#1565D8] border-b-2 border-[#1565D8] mb-[-1px]'
                    : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
                }`}
              >
                All
                <span className={`ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                  activeStageId === 'all'
                    ? 'bg-[#1565D8] text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {Object.values(stageCounts).reduce((a, b) => a + b, 0) || totalCount || 0}
                </span>
              </button>

              {stages.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => {
                    setActiveStageId(stage.id)
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-2.5 text-sm font-medium cursor-pointer relative transition-all duration-200 flex-shrink-0 whitespace-nowrap ${
                    activeStageId === stage.id
                      ? 'text-[#1565D8] border-b-2 border-[#1565D8] mb-[-1px]'
                      : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
                  }`}
                >
                  {stage.name}
                  <span className={`ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                    activeStageId === stage.id
                      ? 'bg-[#1565D8] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {stageCounts[stage.id] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 3 — FILTER BAR / SEARCH / TABLE / PAGINATION CARD */}
          {activeView === 'list' && (loading || filteredApplicants.length > 0) ? (
            loading && applicants.length === 0 ? (
              <TableSkeleton rows={5} columns={7} />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mx-4 mb-4 shadow-sm">
                
                {/* Search and filter row */}
                <div className="flex flex-col gap-2 px-4 py-3 border-b border-slate-100 bg-white w-full">
                  {/* Row 1: Search */}
                  <div className="w-full">
                    <div className="relative flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-4 w-full h-10 sm:h-9">
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
                  </div>

                  {/* Row 2: Filters + Toggle */}
                  <div className="flex items-center gap-2 w-full">
                    {/* Filter buttons — horizontally scrollable */}
                    <div
                      className="flex items-center gap-2 overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                    {/* Applying For */}
                    <div className="relative w-full sm:w-auto flex-shrink-0">
                      <button
                        onClick={() => {
                          setShowApplyingForDropdown(!showApplyingForDropdown)
                          setShowCounsellorFilterDropdown(false)
                          setShowStageFilterDropdown(false)
                          setShowDateFilterDropdown(false)
                          setShowPriorityFilterDropdown(false)
                        }}
                        className="flex-shrink-0 whitespace-nowrap flex items-center justify-between w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans h-10 sm:h-9"
                      >
                        <span>{filterApplyingFor ? `${config.applyingForLabel[type]}: ${getGradeLabel(filterApplyingFor)}` : `${config.applyingForLabel[type]} ▾`}</span>
                      </button>
                      {showApplyingForDropdown && (
                        <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px] max-h-48 overflow-y-auto w-full sm:w-auto">
                          <div 
                            onClick={() => { setFilterApplyingFor(null); setShowApplyingForDropdown(false) }}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                          >
                            All Classes
                          </div>
                          {uniqueApplyingFor.map((option: any) => (
                            <div
                              key={option}
                              onClick={() => { setFilterApplyingFor(option); setShowApplyingForDropdown(false) }}
                              className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer font-medium flex items-center justify-between ${
                                filterApplyingFor === option ? 'bg-blue-50 text-[#1565D8]' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{getGradeLabel(option)}</span>
                              {filterApplyingFor === option && <Check size={12} className="text-[#1565D8]" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Counsellor */}
                    <div className="relative w-full sm:w-auto flex-shrink-0">
                      <button
                        onClick={() => {
                          setShowCounsellorFilterDropdown(!showCounsellorFilterDropdown)
                          setShowApplyingForDropdown(false)
                          setShowStageFilterDropdown(false)
                          setShowDateFilterDropdown(false)
                          setShowPriorityFilterDropdown(false)
                        }}
                        className="flex-shrink-0 whitespace-nowrap flex items-center justify-between w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans h-10 sm:h-9"
                      >
                        <span>{filterCounsellor ? `Counsellor: ${filterCounsellor}` : 'Counsellor ▾'}</span>
                      </button>
                      {showCounsellorFilterDropdown && (
                        <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px] w-full sm:w-auto">
                          <div 
                            onClick={() => { setFilterCounsellor(null); setShowCounsellorFilterDropdown(false) }}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                          >
                            All Counsellors
                          </div>
                          {counsellors.map((c: any) => (
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



                    {/* Date Range */}
                    <div className="relative w-full sm:w-auto flex-shrink-0">
                      <button
                        onClick={() => {
                          setShowDateFilterDropdown(!showDateFilterDropdown)
                          setShowApplyingForDropdown(false)
                          setShowCounsellorFilterDropdown(false)
                          setShowStageFilterDropdown(false)
                          setShowPriorityFilterDropdown(false)
                        }}
                        className="flex-shrink-0 whitespace-nowrap flex items-center justify-between w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans h-10 sm:h-9"
                      >
                        <span>{filterDateRange ? `Date: ${filterDateRange}` : 'Date Range ▾'}</span>
                      </button>
                      {showDateFilterDropdown && (
                        <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[140px] w-full sm:w-auto">
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
                    <div className="relative w-full sm:w-auto flex-shrink-0">
                      <button
                        onClick={() => {
                          setShowPriorityFilterDropdown(!showPriorityFilterDropdown)
                          setShowApplyingForDropdown(false)
                          setShowCounsellorFilterDropdown(false)
                          setShowStageFilterDropdown(false)
                          setShowDateFilterDropdown(false)
                        }}
                        className="flex-shrink-0 whitespace-nowrap flex items-center justify-between w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans h-10 sm:h-9"
                      >
                        <span>{filterPriority ? `Priority: ${filterPriority}` : 'Priority ▾'}</span>
                      </button>
                      {showPriorityFilterDropdown && (
                        <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[140px] w-full sm:w-auto">
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
                        className="flex-shrink-0 whitespace-nowrap text-xs font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 px-1.5 py-1.5 font-sans cursor-pointer w-full sm:w-auto justify-center sm:justify-start"
                      >
                        <X size={13} />
                        Clear Filters
                      </button>
                    )}
                  </div>

                    {/* View toggle — always visible, never shrinks */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1 flex-shrink-0 ml-auto">
                      {/* List */}
                      <button
                        onClick={() => setActiveView('list')}
                        className={`rounded-md p-1.5 transition-all duration-150 cursor-pointer ${
                          (activeView as string) === 'list'
                            ? 'bg-white shadow-sm'
                            : 'bg-transparent hover:bg-slate-200'
                        }`}
                      >
                        <List
                          size={16}
                          strokeWidth={1.5}
                          className={(activeView as string) === 'list' ? 'text-[#1565D8]' : 'text-slate-400'}
                        />
                      </button>

                      {/* Grid */}
                      <button
                        onClick={() => setActiveView('grid')}
                        className={`hidden sm:inline-flex rounded-md p-1.5 transition-all duration-150 cursor-pointer ${
                          (activeView as string) === 'grid'
                            ? 'bg-white shadow-sm'
                            : 'bg-transparent hover:bg-slate-200'
                        }`}
                      >
                        <LayoutGrid
                          size={16}
                          strokeWidth={1.5}
                          className={(activeView as string) === 'grid' ? 'text-[#1565D8]' : 'text-slate-400'}
                        />
                      </button>

                      {/* Kanban */}
                      <button
                        onClick={() => setActiveView('kanban')}
                        className={`rounded-md p-1.5 transition-all duration-150 cursor-pointer ${
                          (activeView as string) === 'kanban'
                            ? 'bg-white shadow-sm'
                            : 'bg-transparent hover:bg-slate-200'
                        }`}
                      >
                        <Columns
                          size={16}
                          strokeWidth={1.5}
                          className={(activeView as string) === 'kanban' ? 'text-[#1565D8]' : 'text-slate-400'}
                        />
                      </button>
                    </div>
                  </div>
                </div>


                 {/* Desktop/Tablet Table View */}
                <div className="hidden sm:block w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <table className="w-full min-w-[800px] border-collapse text-left">
                    {/* TABLE HEADER */}
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 select-none">
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-10 flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedItems.length === filteredApplicants.length && filteredApplicants.length > 0}
                            onChange={handleSelectAll}
                            className="accent-[#1565D8] rounded focus:ring-0 cursor-pointer"
                          />
                        </th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 flex-1 min-w-[200px]">
                          APPLICANT
                        </th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[120px] hidden sm:table-cell">
                          GRADE
                        </th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[100px] hidden sm:table-cell">
                          CONNECT
                        </th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[160px]">
                          STAGE
                        </th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[160px] hidden md:table-cell">
                          COUNSELLOR
                        </th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[80px] hidden lg:table-cell">
                          DATE
                        </th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[50px]">
                          ACTION
                        </th>
                      </tr>
                    </thead>

                    {/* TABLE BODY */}
                    <tbody className="divide-y divide-slate-100">
                      {filteredApplicants.map((admission: any) => {
                        admission.applicantName = admission.fullName;
                        admission.gradeSought = admission.applyingFor;
                        admission.assignedTo = admission.counsellor ? { name: admission.counsellor } : null;

                        return (
                          <tr
                            key={admission.id}
                            className={`border-b border-slate-100 border-l-2 cursor-pointer hover:bg-slate-50/80 transition-colors duration-100 ${
                              getStageBorderColor(admission.stage?.name)
                            }`}
                            onMouseEnter={() => router.prefetch(`/admission-management/${admission.id}`)}
                            onClick={() => router.push(`/admission-management/${admission.id}`)}
                          >
                            {/* Checkbox */}
                            <td className="px-3 py-2.5 w-10 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(admission.id)}
                                onChange={() => handleSelectApplicant(admission.id)}
                                className="accent-[#1565D8] rounded focus:ring-0 cursor-pointer w-4 h-4 border-slate-300"
                              />
                            </td>

                            {/* APPLICANT */}
                            <td className="px-3 py-2.5 flex-1 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                                  style={{
                                    backgroundColor: getAvatarColor(admission.applicantName)
                                  }}>
                                  {admission.applicantName.slice(0, 2).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="min-w-0">
                                  {/* Name */}
                                  <p className="text-sm font-semibold text-slate-800 truncate">
                                    {admission.applicantName}
                                  </p>
                                  {/* Sub-info */}
                                  <p className="text-xs text-slate-400 truncate">
                                    {admission.admissionCode}
                                    {admission.parentName && ` · ${admission.parentName}`}
                                    {admission.phone && ` · ${admission.phone}`}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* GRADE */}
                            <td className="px-3 py-2.5 w-[120px] hidden sm:table-cell">
                              {admission.gradeSought ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                                  {getGradeLabel(admission.gradeSought) || admission.gradeSought}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>

                            {/* CONNECT */}
                            <td className="px-3 py-2.5 w-[100px] hidden sm:table-cell"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1">
                                <a href={`mailto:${admission.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                    admission.email
                                      ? 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                                      : 'text-slate-200 pointer-events-none'
                                  }`}>
                                  <Mail size={13}/>
                                </a>

                                <a href={`https://wa.me/91${admission.phone}`}
                                  target="_blank"
                                  onClick={(e) => e.stopPropagation()}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                    admission.phone
                                      ? 'text-slate-400 hover:bg-green-50 hover:text-green-600'
                                      : 'text-slate-200 pointer-events-none'
                                  }`}>
                                  <MessageCircle size={13}/>
                                </a>

                                <a href={`tel:${admission.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                    admission.phone
                                      ? 'text-slate-400 hover:bg-green-50 hover:text-green-600'
                                      : 'text-slate-200 pointer-events-none'
                                  }`}>
                                  <Phone size={13}/>
                                </a>
                              </div>
                            </td>

                            {/* STAGE */}
                            <td className="px-3 py-2.5 w-[160px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="relative">
                                <select
                                  value={admission.stage?.id ?? ''}
                                  onChange={async (e) => {
                                      e.stopPropagation()
                                      const newStageId = e.target.value
                                      if (!newStageId) return

                                      const selectedStage = stages.find(s => s.id === newStageId)
                                      const previousData = admissionsData
                                      const rawAdmissions = admissionsData?.admissions || admissionsData?.data || []

                                      const updatedAdmissions = rawAdmissions.map((a: any) =>
                                        a.id === admission.id
                                          ? {
                                              ...a,
                                              stageId: newStageId,
                                              stage: selectedStage ? {
                                                id: selectedStage.id,
                                                name: selectedStage.name,
                                                color: selectedStage.color || '#e2e8f0',
                                                isWon: selectedStage.isWon || false,
                                                isLost: selectedStage.isLost || false
                                              } : a.stage
                                            }
                                          : a
                                      )

                                      // Optimistic update
                                      mutate(
                                        {
                                          ...admissionsData,
                                          data: updatedAdmissions,
                                          admissions: updatedAdmissions
                                        },
                                        { revalidate: false }
                                      )

                                      try {
                                        const res = await fetch(
                                          `/api/v1/admissions/${admission.id}`,
                                          {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                              stageId: newStageId
                                            })
                                          }
                                        )

                                        if (!res.ok) {
                                          const err = await res.json()
                                          throw new Error(
                                            err.message || 'Update failed'
                                          )
                                        }

                                        const data = await res.json()
                                        if (data.admission) {
                                          const finalAdmissions = rawAdmissions.map((a: any) =>
                                            a.id === admission.id ? data.admission : a
                                          )
                                          mutate(
                                            {
                                              ...admissionsData,
                                              data: finalAdmissions,
                                              admissions: finalAdmissions
                                            },
                                            { revalidate: true }
                                          )
                                        } else {
                                          mutate()
                                        }

                                        fetchPipeline()
                                        showToast('Stage updated', 'success')

                                      } catch (err: any) {
                                        // Rollback on failure
                                        mutate(previousData, { revalidate: false })
                                        showToast(
                                          err.message || 'Failed to update stage',
                                          'error'
                                        )
                                      }
                                    }}
                                  className="text-[11px] font-semibold pl-2 pr-6 py-1 rounded-full border-0 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20"
                                  style={{
                                    backgroundColor:
                                      getStageColor(
                                        admission.stage?.name
                                      ).bg,
                                    color:
                                      getStageColor(
                                        admission.stage?.name
                                      ).text,
                                  }}>
                                  {!admission.stage && (
                                    <option value="" disabled>
                                      — Select Stage —
                                    </option>
                                  )}
                                  {stages.map(stage => (
                                    <option
                                      key={stage.id}
                                      value={stage.id}>
                                      {stage.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                  size={10}
                                  style={{
                                    color: getStageColor(
                                      admission.stage?.name || admission.stage
                                    ).text
                                  }}/>
                              </div>
                            </td>

                            {/* COUNSELLOR */}
                            <td className="px-3 py-2.5 w-[160px] hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                              <div className="relative">
                                {admission.assignedTo?.name ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                                      {admission.assignedTo.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-[13px] font-medium text-slate-700 truncate max-w-[100px]">
                                      {admission.assignedTo.name}
                                    </span>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        openCounsellorPicker(admission.id)
                                      }}
                                      className="text-slate-300 hover:text-slate-500 ml-auto"
                                    >
                                      <Pencil size={11}/>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openCounsellorPicker(admission.id)
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                                  >
                                    <UserPlus size={11}/>
                                    Select
                                  </button>
                                )}

                                {counsellorDropdownId === admission.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setCounsellorDropdownId(null)
                                      }}
                                    />
                                    <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[180px]">
                                      <div className="px-3 py-1.5 border-b border-slate-50 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                          Assign Counsellor
                                        </span>
                                      </div>
                                      {counsellors.map((c: any) => (
                                        <button
                                          key={c.id}
                                          onClick={async (e) => {
                                            e.stopPropagation()
                                            await handleAssignCounsellor(admission.id, c.id)
                                          }}
                                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                                            admission.counsellorId === c.id
                                              ? 'bg-blue-50 text-blue-700 font-semibold'
                                              : 'text-slate-600 hover:bg-slate-50'
                                          }`}
                                        >
                                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                            {c.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                                          </div>
                                          <span className="flex-1 text-left">{c.name}</span>
                                          {admission.counsellorId === c.id && (
                                            <Check size={13} className="text-blue-500" strokeWidth={2} />
                                          )}
                                        </button>
                                      ))}
                                      {admission.counsellorId && (
                                        <div className="border-t border-slate-50 mt-1 pt-1">
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation()
                                              await handleAssignCounsellor(admission.id, null)
                                            }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 cursor-pointer"
                                          >
                                            <X size={13} className="text-red-400" strokeWidth={1.5} />
                                            Remove Assignment
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* DATE */}
                            <td className="px-3 py-2.5 w-[80px] hidden lg:table-cell">
                              <span className="text-xs text-slate-500">
                                {admission.createdAt ? format(new Date(admission.createdAt), 'd MMM') : '—'}
                              </span>
                            </td>

                            {/* ACTION */}
                            <td className="px-3 py-2.5 w-[50px]" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-start">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                    setMenuPosition({
                                      top: rect.bottom + 4,
                                      left: rect.right - 160,
                                    })
                                    setOpenMenuId(openMenuId === admission.id ? null : admission.id)
                                  }}
                                  className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Empty Row Placeholders to keep minimum 8 rows */}
                      {placeholderCount > 0 && 
                        Array.from({ length: placeholderCount }).map((_, i) => (
                          <tr key={`empty-${i}`}
                            className="border-b border-slate-50 last:border-0 border-l-2 border-l-transparent">
                            <td className="px-3 py-3 w-10"/>
                            <td className="px-3 py-3 flex-1 min-w-[200px]"/>
                            <td className="px-3 py-3 w-[120px] hidden sm:table-cell"/>
                            <td className="px-3 py-3 w-[100px] hidden sm:table-cell"/>
                            <td className="px-3 py-3 w-[160px]"/>
                            <td className="px-3 py-3 w-[160px] hidden md:table-cell"/>
                            <td className="px-3 py-3 w-[80px] hidden lg:table-cell"/>
                            <td className="px-3 py-3 w-[50px]"/>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View (visible on < 640px) */}
                <div className="block sm:hidden divide-y divide-slate-100">
                  {filteredApplicants.map((admission: any) => {
                    admission.applicantName = admission.fullName;
                    admission.gradeSought = admission.applyingFor;
                    admission.assignedTo = admission.counsellor ? { name: admission.counsellor } : null;

                    return (
                      <div
                        key={admission.id}
                        onClick={() => router.push(`/admission-management/${admission.id}`)}
                        className={`p-4 cursor-pointer hover:bg-slate-50 border-l-4 ${
                          getStageBorderColor(admission.stage?.name)
                        }`}
                      >
                        {/* ROW 1: Avatar + Name + Stage inline dropdown */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                              style={{
                                backgroundColor: getAvatarColor(admission.applicantName)
                              }}>
                              {admission.applicantName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-slate-800 truncate">
                              {admission.applicantName}
                            </span>
                          </div>
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={admission.stage?.id ?? ''}
                              onChange={async (e) => {
                                e.stopPropagation()
                                const newStageId = e.target.value
                                if (!newStageId) return

                                const selectedStage = stages.find(s => s.id === newStageId)
                                const previousData = admissionsData
                                const rawAdmissions = admissionsData?.admissions || admissionsData?.data || []

                                const updatedAdmissions = rawAdmissions.map((a: any) =>
                                  a.id === admission.id
                                    ? {
                                        ...a,
                                        stageId: newStageId,
                                        stage: selectedStage ? {
                                          id: selectedStage.id,
                                          name: selectedStage.name,
                                          color: selectedStage.color || '#e2e8f0',
                                          isWon: selectedStage.isWon || false,
                                          isLost: selectedStage.isLost || false
                                        } : a.stage
                                      }
                                    : a
                                )

                                // Optimistic update
                                mutate(
                                  {
                                    ...admissionsData,
                                    data: updatedAdmissions,
                                    admissions: updatedAdmissions
                                  },
                                  { revalidate: false }
                                )

                                try {
                                  const res = await fetch(
                                    `/api/v1/admissions/${admission.id}`,
                                    {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                        stageId: newStageId
                                      })
                                    }
                                  )

                                  if (!res.ok) {
                                    const err = await res.json()
                                    throw new Error(
                                      err.message || 'Update failed'
                                    )
                                  }

                                  const data = await res.json()
                                  if (data.admission) {
                                    const finalAdmissions = rawAdmissions.map((a: any) =>
                                      a.id === admission.id ? data.admission : a
                                    )
                                    mutate(
                                      {
                                        ...admissionsData,
                                        data: finalAdmissions,
                                        admissions: finalAdmissions
                                      },
                                      { revalidate: true }
                                    )
                                  } else {
                                    mutate()
                                  }

                                  fetchPipeline()
                                  showToast('Stage updated', 'success')

                                } catch (err: any) {
                                  // Rollback on failure
                                  mutate(previousData, { revalidate: false })
                                  showToast(
                                    err.message || 'Failed to update stage',
                                    'error'
                                  )
                                }
                              }}
                              className="text-[11px] font-semibold pl-2 pr-6 py-1 rounded-full border-0 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20"
                              style={{
                                backgroundColor:
                                  getStageColor(
                                    admission.stage?.name || admission.stage
                                  ).bg,
                                color:
                                  getStageColor(
                                    admission.stage?.name || admission.stage
                                  ).text,
                              }}
                            >
                              {!admission.stage && (
                                <option value="" disabled>
                                  — Select Stage —
                                </option>
                              )}
                              {stages.map(stage => (
                                <option key={stage.id} value={stage.id}>
                                  {stage.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                              size={10}
                              style={{
                                color: getStageColor(
                                  admission.stage?.name || admission.stage
                                ).text
                              }}
                            />
                          </div>
                        </div>

                        {/* ROW 2: Code + Grade badge */}
                        <div className="flex gap-2 mt-1.5 flex-wrap items-center">
                          <span className="text-xs font-normal text-slate-400 font-mono">
                            {admission.admissionCode}
                          </span>
                          {admission.gradeSought ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                              {getGradeLabel(admission.gradeSought) || admission.gradeSought}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </div>

                        {/* ROW 3: Counsellor + Date */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[13px] font-medium text-slate-700">
                            {admission.assignedTo?.name ? `Counsellor: ${admission.assignedTo.name}` : 'Unassigned'}
                          </span>
                          <span className="text-xs text-slate-500 font-sans">
                            {admission.createdAt ? format(new Date(admission.createdAt), 'd MMM') : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {(loading || filteredApplicants.length > 0) && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
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
                      <button className="hidden sm:flex px-3 py-1.5 border border-[#1565D8] rounded-lg text-xs font-bold text-white bg-[#1565D8] font-sans">
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
            )
          ) : (
            <>
              {/* Separate Search/Filter Bar (for grid and kanban views or empty state list view) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-md p-3 sm:p-4 flex flex-col sm:flex-row gap-2 flex-wrap border-t-2 border-t-slate-300 items-start sm:items-center justify-between mx-4 mb-4">
                {/* Search Input */}
                <div className="relative flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-4 flex-1 min-w-0 max-w-xs sm:max-w-sm h-10 sm:h-9">
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
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto relative">
                  {/* Applying For */}
                  <div className="relative w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setShowApplyingForDropdown(!showApplyingForDropdown)
                        setShowCounsellorFilterDropdown(false)
                        setShowStageFilterDropdown(false)
                        setShowDateFilterDropdown(false)
                        setShowPriorityFilterDropdown(false)
                      }}
                      className="flex items-center justify-between w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans h-10 sm:h-9"
                    >
                      <span>{filterApplyingFor ? `${config.applyingForLabel[type]}: ${getGradeLabel(filterApplyingFor)}` : `${config.applyingForLabel[type]} ▾`}</span>
                    </button>
                    {showApplyingForDropdown && (
                      <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px] max-h-48 overflow-y-auto w-full sm:w-auto">
                        <div 
                          onClick={() => { setFilterApplyingFor(null); setShowApplyingForDropdown(false) }}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                        >
                          All Classes
                        </div>
                        {uniqueApplyingFor.map((option: any) => (
                          <div
                            key={option}
                            onClick={() => { setFilterApplyingFor(option); setShowApplyingForDropdown(false) }}
                            className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer font-medium flex items-center justify-between ${
                              filterApplyingFor === option ? 'bg-blue-50 text-[#1565D8]' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{getGradeLabel(option)}</span>
                            {filterApplyingFor === option && <Check size={12} className="text-[#1565D8]" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Counsellor */}
                  <div className="relative w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setShowCounsellorFilterDropdown(!showCounsellorFilterDropdown)
                        setShowApplyingForDropdown(false)
                        setShowStageFilterDropdown(false)
                        setShowDateFilterDropdown(false)
                        setShowPriorityFilterDropdown(false)
                      }}
                      className="flex items-center justify-between w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans h-10 sm:h-9"
                    >
                      <span>{filterCounsellor ? `Counsellor: ${filterCounsellor}` : 'Counsellor ▾'}</span>
                    </button>
                    {showCounsellorFilterDropdown && (
                      <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px] w-full sm:w-auto">
                        <div 
                          onClick={() => { setFilterCounsellor(null); setShowCounsellorFilterDropdown(false) }}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                        >
                          All Counsellors
                        </div>
                        {counsellors.map((c: any) => (
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



                  {/* Date Range */}
                  <div className="relative w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setShowDateFilterDropdown(!showDateFilterDropdown)
                        setShowApplyingForDropdown(false)
                        setShowCounsellorFilterDropdown(false)
                        setShowStageFilterDropdown(false)
                        setShowPriorityFilterDropdown(false)
                      }}
                      className="flex items-center justify-between w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans h-10 sm:h-9"
                    >
                      <span>{filterDateRange ? `Date: ${filterDateRange}` : 'Date Range ▾'}</span>
                    </button>
                    {showDateFilterDropdown && (
                      <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[140px] w-full sm:w-auto">
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
                  <div className="relative w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setShowPriorityFilterDropdown(!showPriorityFilterDropdown)
                        setShowApplyingForDropdown(false)
                        setShowCounsellorFilterDropdown(false)
                        setShowStageFilterDropdown(false)
                        setShowDateFilterDropdown(false)
                      }}
                      className="flex items-center justify-between w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans h-10 sm:h-9"
                    >
                      <span>{filterPriority ? `Priority: ${filterPriority}` : 'Priority ▾'}</span>
                    </button>
                    {showPriorityFilterDropdown && (
                      <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[140px] w-full sm:w-auto">
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
                      className="text-xs font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 px-1.5 py-1.5 font-sans cursor-pointer w-full sm:w-auto justify-center sm:justify-start"
                    >
                      <X size={13} />
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Right group */}
                <div className="flex gap-2 flex-wrap w-full sm:w-auto justify-end mt-2 sm:mt-0">
                  {/* View Toggle */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1 w-full sm:w-auto justify-center sm:justify-start">
                    {/* List */}
                    <button
                      onClick={() => setActiveView('list')}
                      className={`rounded-md p-1.5 transition-all duration-150 cursor-pointer ${
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
                      className={`hidden sm:inline-flex rounded-md p-1.5 transition-all duration-150 cursor-pointer ${
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
                      className={`rounded-md p-1.5 transition-all duration-150 cursor-pointer ${
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

              {/* Grid View */}
              {activeView === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
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
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <Skeleton className="h-6 w-16 rounded-lg" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <div className="border-t border-slate-200 my-3" />
                        <div className="flex items-center justify-between mt-3.5">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    ))
                  ) : (
                    filteredApplicants.map((a: any) => {
                      const stageData = configPipeline.find(s => s.id === a.stageId) || configPipeline[0]
                      
                      return (
                        <div
                          key={a.id}
                          onMouseEnter={() => router.prefetch(`/admission-management/${a.id}`)}
                          onClick={() => handleNavigate(`/admission-management/${a.id}`)}
                          className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-[#1565D8] cursor-pointer transition-all flex flex-col gap-3 justify-between"
                        >
                          {/* TOP ROW */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                                {a.avatar}
                              </div>
                              <span className="text-sm font-semibold text-slate-800 truncate block font-sans">
                                {a.fullName}
                              </span>
                            </div>
                            {/* Status Badge */}
                            <div className="shrink-0">
                              {getStatusBadge(a.dbStatus)}
                            </div>
                          </div>

                          {/* MIDDLE ROW */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono text-slate-400">
                              {a.admissionCode}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                              {a.applyingFor ? getGradeLabel(a.applyingFor) : '—'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${stageData.bgClass} ${stageData.textClass} border ${stageData.borderClass}`}>
                              {stageData.label}
                            </span>
                          </div>

                          {/* BOTTOM ROW */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {a.counsellor ? (
                                <>
                                  <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-750 text-[8px] font-bold flex items-center justify-center shrink-0">
                                    {a.counsellorAvatar}
                                  </div>
                                  <span className="text-xs text-slate-655 truncate max-w-[100px] font-sans">
                                    {a.counsellor}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs text-slate-400 font-sans">Unassigned</span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-sans">
                              {formatDate(a.createdAt)}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* Kanban View */}
              {activeView === 'kanban' && (
                <div className="relative">
                  <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300">
                    {configPipeline.map(stage => {
                      const stageApplicants = filteredApplicants.filter((a: any) => a.stageId === stage.id)

                      return (
                        <div key={stage.id} className="w-[280px] flex-shrink-0 bg-slate-50 rounded-xl p-3 flex flex-col gap-3">
                          {/* COLUMN HEADER */}
                          <div className="flex items-center justify-between select-none">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.dotClass}`} />
                              <span className="text-sm font-bold text-slate-800 truncate font-sans">
                                {stage.label}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${stage.bgClass} ${stage.textClass}`}>
                                {stageApplicants.length}
                              </span>
                            </div>
                            <button
                              onClick={() => router.push(`/admission-management/create?stage=${stage.id}`)}
                              className="p-1 rounded text-slate-400 hover:text-slate-655 hover:bg-slate-200 cursor-pointer"
                              title={`Add to ${stage.label}`}
                            >
                              <Plus size={14} strokeWidth={2} />
                            </button>
                          </div>

                          {/* COLUMN BODY */}
                          <div className="space-y-3 min-h-[300px] flex-1 overflow-y-auto">
                            {loading ? (
                              Array.from({ length: 2 }).map((_, idx) => (
                                <div
                                  key={`skeleton-kanban-${stage.id}-${idx}`}
                                  className="bg-white rounded-xl border border-slate-200 p-4 relative overflow-hidden"
                                >
                                  <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-3 w-16" />
                                  </div>
                                </div>
                              ))
                            ) : stageApplicants.length === 0 ? (
                              <div className="bg-white/50 rounded-xl border border-dashed border-slate-200 py-8 text-center flex flex-col items-center justify-center">
                                <Inbox size={24} className="text-slate-350" strokeWidth={1.5} />
                                <span className="text-[11px] text-slate-400 font-bold mt-2 font-sans">
                                  No {config.applicantLabel[type]}s
                                </span>
                              </div>
                            ) : (
                              stageApplicants.map((a: any) => {
                                return (
                                  <div
                                    key={a.id}
                                    onMouseEnter={() => router.prefetch(`/admission-management/${a.id}`)}
                                    onClick={() => handleNavigate(`/admission-management/${a.id}`)}
                                    className="bg-white border border-slate-200 rounded-xl p-3 mb-2 hover:shadow-sm cursor-pointer transition-all flex flex-col gap-2.5"
                                  >
                                    <div>
                                      <span className="text-sm font-semibold text-slate-800 block font-sans truncate">
                                        {a.fullName}
                                      </span>
                                      <span className="text-xs font-mono text-slate-400 block mt-0.5">
                                        {a.admissionCode}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                                        {a.applyingFor ? getGradeLabel(a.applyingFor) : '—'}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        {a.counsellor ? (
                                          <>
                                            <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 text-[8px] font-bold flex items-center justify-center shrink-0">
                                              {a.counsellorAvatar}
                                            </div>
                                            <span className="text-xs text-slate-655 truncate max-w-[80px] font-sans">
                                              {a.counsellor.split(' ')[0]}
                                            </span>
                                          </>
                                        ) : (
                                          <span className="text-xs text-slate-400 font-sans">Unassigned</span>
                                        )}
                                      </div>
                                      <span className="text-xs text-slate-400 font-sans">
                                        {formatDate(a.createdAt)}
                                      </span>
                                    </div>

                                    <div className="mt-1 pt-2 border-t border-slate-100 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                                      <span className="text-[10px] text-slate-400 uppercase font-bold">Stage</span>
                                      <select
                                        value={a.stageId}
                                        onChange={(e) => handleMoveStage(a.id, e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                                      >
                                        {configPipeline.map((s) => (
                                          <option key={s.id} value={s.id}>
                                            {s.label}
                                          </option>
                                        ))}
                                      </select>
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

              {/* Shared Pagination (For Grid view only, since List view has its own embedded pagination) */}
              {activeView === 'grid' && (loading || filteredApplicants.length > 0) && (
                <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm mx-4 mb-4">
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
                    <button className="hidden sm:flex px-3 py-1.5 border border-[#1565D8] rounded-lg text-xs font-bold text-white bg-[#1565D8] font-sans">
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
            </>
          )}
      </div>

      {/* ===================================================================
          SECTION 8 — CONVERT TO STUDENT MODAL
          =================================================================== */}
      <Dialog 
        open={showConvertModal !== null} 
        onOpenChange={(open) => { if (!open) setShowConvertModal(null) }}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white text-left max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold font-sans text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Create Student Record
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 mb-4 font-sans">
            This applicant has been admitted. Create their student profile.
          </p>

          {convertError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {convertError}
            </div>
          )}

          {showConvertModal && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block font-sans">Full Name</label>
                <input
                  type="text"
                  value={convertStudentName}
                  onChange={(e) => setConvertStudentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Full Name"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block font-sans">Date of Birth</label>
                <input
                  type="date"
                  value={convertStudentDob}
                  onChange={(e) => setConvertStudentDob(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block font-sans">Class / Grade</label>
                <select
                  value={convertStudentGrade}
                  onChange={(e) => setConvertStudentGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Class/Grade</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                  {convertStudentGrade && !GRADE_OPTIONS.some(opt => opt.value === convertStudentGrade) && (
                    <option value={convertStudentGrade}>{getGradeLabel(convertStudentGrade)}</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block font-sans">Section (Optional)</label>
                  <input
                    type="text"
                    value={convertStudentSection}
                    onChange={(e) => setConvertStudentSection(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. A"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block font-sans">Roll Number (Optional)</label>
                  <input
                    type="text"
                    value={convertStudentRollNumber}
                    onChange={(e) => setConvertStudentRollNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. 101"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block font-sans">Parent/Guardian Name</label>
                <input
                  type="text"
                  value={convertStudentGuardianName}
                  onChange={(e) => setConvertStudentGuardianName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Parent/Guardian Name"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 select-none">
                <button
                  disabled={isSubmittingConvert}
                  onClick={() => setShowConvertModal(null)}
                  className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold cursor-pointer font-sans text-center transition"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmittingConvert}
                  onClick={handleConfirmConvert}
                  className={`flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold cursor-pointer font-sans text-center transition flex items-center justify-center ${isSubmittingConvert ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmittingConvert ? (
                    <>
                      <Loader2 className="animate-spin size-4 mr-2" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Student Record →</span>
                  )}
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
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white text-left">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-sans text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Reject Application
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-slate-500 mb-4 font-sans">
            Please provide a reason for rejecting the application of <span className="font-semibold text-slate-700">{showRejectModal?.fullName}</span>.
          </p>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2 font-sans">
                Common Reasons
              </span>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  'Documents incomplete',
                  'Seats full',
                  'Grade not available',
                  'No response from parent'
                ].map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => setRejectReason(pill)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                      rejectReason === pill
                        ? 'bg-red-50 border-red-200 text-red-700 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5 font-sans">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 bg-white font-sans outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 h-24 resize-none"
                placeholder="Enter details..."
              />
            </div>
          </div>

          <div className="flex w-full gap-3 mt-6 select-none">
            <button
              onClick={() => { setShowRejectModal(null); setRejectReason('') }}
              className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold cursor-pointer font-sans text-center transition"
            >
              Cancel
            </button>
            <button
              disabled={!rejectReason.trim()}
              onClick={handleConfirmReject}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold cursor-pointer font-sans text-center transition"
            >
              Confirm Rejection
            </button>
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
                {pipeline.map((s: any) => (
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
                {counsellors.map((c: any) => (
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

      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
          <Shield className="text-[#1565D8] animate-pulse" size={40}/>
          <div className="mt-3 w-12 h-0.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#1565D8] rounded-full animate-[loader_1s_ease-in-out_infinite]"/>
          </div>
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

      {openMenuId && typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-44 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden text-left"
          >
            <button
              onClick={() => {
                setOpenMenuId(null)
                router.push(`/admission-management/${openMenuId}`)
              }}
              className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Eye size={13} />
              View Admission
            </button>
            <button
              onClick={() => {
                setOpenMenuId(null)
                router.push(`/admission-management/${openMenuId}/edit`)
              }}
              className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Pencil size={13} />
              Edit Admission
            </button>
            <div className="h-px bg-slate-100 mx-2" />
            <button
              onClick={() => {
                setOpenMenuId(null)
                handleDeleteAdmission(openMenuId)
              }}
              className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left flex items-center gap-2 transition-colors cursor-pointer font-medium"
            >
              <Trash2 size={13} />
              Delete Admission
            </button>
          </div>,
          document.body
        )
      }

    </>
  )
}
