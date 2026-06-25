"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'
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
  FileText,
  Loader2
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
      conversionRate: 0,
      avgDaysToAdmit: 0
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
          conversionRate: json.data?.conversionRate ?? 0,
          avgDaysToAdmit: json.data?.avgDaysToAdmit ?? 0
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Admitted
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Rejected
          </span>
        )
      case 'WAITLISTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Waitlisted
          </span>
        )
      case 'WITHDRAWN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            Withdrawn
          </span>
        )
      case 'IN_PROGRESS':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            In Progress
          </span>
        )
    }
  }

  const formatDate = (dateString: any) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
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
      (p.label && stageLabel && p.label.toLowerCase() === stageLabel.toLowerCase())
    )
    return apiStage?.count ?? 0
  }

  const getDatabaseStageId = (localStageLabel: string) => {
    const apiStage = pipeline.find(
      p => p.label === localStageLabel ||
      (p.label && localStageLabel && p.label.toLowerCase() === localStageLabel.toLowerCase())
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

    try {
      const dbStageId = getDatabaseStageId(targetStage.label)
      const res = await fetch(
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
      if (!res.ok) throw new Error('Failed to update stage')

      fetchAdmissions()
      fetchPipeline()

      const dbStage = pipeline.find(p => p.id === dbStageId)
      const isWon = dbStage?.isWon || targetStageId === 'admitted' || targetStageId === 'enrolled'
      const isLost = dbStage?.isLost || targetStageId === 'rejected'

      if (isWon) {
        setShowConvertModal(applicant)
      } else if (isLost) {
        setShowRejectModal(applicant)
      } else {
        showToast(`Moved to ${targetStage.label}`)
      }
    } catch (err: any) {
      console.error('Stage update failed', err)
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

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return

    const confirmed = window.confirm(
      `Delete ${selectedItems.length} admission(s)? This cannot be undone.`
    )
    if (!confirmed) return

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
        // If some failed, show error message
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
    }
  }

  const getLeftBorderBg = (a: any) => {
    if (a.status === 'overdue') return 'bg-red-500'
    if (a.status === 'warning') return 'bg-amber-400'
    if (a.status === 'recent' || a.daysInStage <= 1) return 'bg-green-400'
    return 'bg-transparent'
  }

  return (
    <>
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
                  <span className="text-sm font-bold text-[#1565D8]">{pipelineStats.avgDaysToAdmit || 0} days</span>
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
              <div className="flex flex-wrap md:flex-nowrap overflow-x-auto md:overflow-x-visible gap-2 px-4 py-3 pb-2 scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-400">
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
                              (p.label && stage.label && p.label.toLowerCase() === stage.label.toLowerCase())
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
                                ? `border-2 border-[#1565D8] bg-[#EFF6FF] text-[#1565D8] shadow-sm`
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                            }`}
                        >
                          <IconComponent 
                            className={`flex-shrink-0 size-14 md:size-[14px] ${isActive ? 'text-[#1565D8] opacity-100' : 'text-slate-500 opacity-70'}`} 
                            strokeWidth={1.5} 
                          />
                          <span className={`text-lg md:text-xl font-bold ${isActive ? 'text-[#1565D8]' : 'text-slate-800'}`} style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {stageCount}
                          </span>
                          
                          {/* Desktop label */}
                          <span className={`text-[10px] font-semibold uppercase tracking-wide mt-1 hidden lg:block ${isActive ? 'text-[#1565D8]' : 'text-slate-500'}`}>
                            {stage.label}
                          </span>
                          
                          {/* Mobile label */}
                          <span className={`text-[9px] font-semibold uppercase tracking-wide mt-1 block lg:hidden truncate max-w-full ${isActive ? 'text-[#1565D8]' : 'text-slate-500'}`}>
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
                  <span>{filterApplyingFor ? `${config.applyingForLabel[type]}: ${getGradeLabel(filterApplyingFor)}` : `${config.applyingForLabel[type]} ▾`}</span>
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
                        <span>{getGradeLabel(option)}</span>
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
          {activeView === 'list' && (
            loading && applicants.length === 0 ? (
              <TableSkeleton rows={5} columns={7} />
            ) : (loading || filteredApplicants.length > 0) && (
              <div className="w-full overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col">
                  {/* TABLE HEADER */}
                  <div className="flex items-center px-4 py-3 bg-slate-50 border-b border-slate-100 select-none text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <div className="w-8 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === filteredApplicants.length && filteredApplicants.length > 0}
                        onChange={handleSelectAll}
                        className="accent-[#1565D8] rounded focus:ring-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 font-sans">
                      APPLICANT
                    </div>
                    <div className="w-40 flex-shrink-0 font-sans">
                      GRADE / STAGE
                    </div>
                    <div className="w-28 flex-shrink-0 font-sans text-center">
                      STATUS
                    </div>
                    <div className="w-36 flex-shrink-0 font-sans">
                      COUNSELLOR
                    </div>
                    <div className="w-24 flex-shrink-0 font-sans">
                      DATE
                    </div>
                    <div className="w-16 flex-shrink-0 font-sans text-right">
                      ACTIONS
                    </div>
                  </div>

                  {/* TABLE BODY */}
                  <div className="divide-y divide-slate-100">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <div
                          key={`skeleton-${idx}`}
                          className="relative flex items-center px-4 py-3.5 gap-3 bg-white border-b border-slate-100 min-h-[56px]"
                        >
                          <div className="w-8 flex-shrink-0">
                            <Skeleton className="w-4 h-4 rounded" />
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <Skeleton className="w-9 h-9 rounded-full" />
                            <div className="space-y-1.5 flex-1 max-w-[150px]">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-2/3" />
                            </div>
                          </div>
                          <div className="w-40 flex-shrink-0 space-y-1">
                            <Skeleton className="h-4 w-16 rounded-full" />
                            <Skeleton className="h-4 w-20 rounded-full" />
                          </div>
                          <div className="w-28 flex-shrink-0 flex justify-center">
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                          <div className="w-36 flex-shrink-0">
                            <Skeleton className="h-4 w-24 rounded" />
                          </div>
                          <div className="w-24 flex-shrink-0">
                            <Skeleton className="h-4 w-12" />
                          </div>
                          <div className="w-16 flex-shrink-0 flex justify-end">
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
                            className="relative flex items-center px-4 py-3 gap-3 hover:bg-slate-50 border-b border-slate-100 min-h-[56px] h-auto transition-colors duration-100 cursor-pointer bg-white"
                          >
                            {/* Left border highlight */}
                            {leftBorderColor !== 'bg-transparent' && (
                              <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r ${leftBorderColor}`} />
                            )}

                            {/* Checkbox */}
                            <div className="w-8 flex-shrink-0" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(a.id)}
                                onChange={() => handleSelectApplicant(a.id)}
                                className="accent-[#1565D8] rounded focus:ring-0 cursor-pointer"
                              />
                            </div>

                            {/* Applicant Details */}
                            <div className="flex-1 flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 font-sans">
                                {a.avatar}
                              </div>
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/admission-management/${a.id}`}
                                  onClick={e => {
                                    e.stopPropagation()
                                  }}
                                  className="font-semibold text-slate-800 text-sm hover:text-[#1565D8] hover:underline block truncate font-sans"
                                >
                                  {a.fullName}
                                </Link>
                                <span className="text-xs text-slate-400 mt-0.5 truncate block font-sans">
                                  <span className="font-mono">{a.admissionCode}</span>
                                  {a.parentName && ` · ${a.parentName}`}
                                  {a.phone && ` · ${a.phone}`}
                                  {a.academicYear && ` · ${a.academicYear}`}
                                </span>
                              </div>
                            </div>

                            {/* Grade / Stage */}
                            <div className="w-40 flex-shrink-0 flex flex-col items-start gap-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-sans">
                                {a.applyingFor ? getGradeLabel(a.applyingFor) : '—'}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stageData.bgClass} ${stageData.textClass} ${stageData.borderClass} font-sans`}>
                                {stageData.label}
                              </span>
                            </div>

                            {/* Status */}
                            <div className="w-28 flex-shrink-0 flex justify-center">
                              {getStatusBadge(a.dbStatus)}
                            </div>

                            {/* Counsellor */}
                            <div className="w-36 flex-shrink-0 flex items-center gap-2 min-w-0" onClick={e => e.stopPropagation()}>
                              {a.counsellor ? (
                                <>
                                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[8px] font-bold flex items-center justify-center shrink-0">
                                    {a.counsellorAvatar}
                                  </div>
                                  <span className="text-sm text-slate-650 truncate font-sans">
                                    {a.counsellor}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-slate-405 font-sans">Unassigned</span>
                              )}
                            </div>

                            {/* Date */}
                            <div className="w-24 flex-shrink-0 text-xs text-slate-500 font-medium font-sans">
                              {formatDate(a.createdAt)}
                            </div>

                            {/* Actions */}
                            <div className="w-16 flex-shrink-0 flex justify-end" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none cursor-pointer">
                                    <MoreVertical size={16} strokeWidth={1.5} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-56 min-w-[224px] bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 z-40"
                                >
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push('/admission-management/' + a.id)
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                  >
                                    <Eye size={14} strokeWidth={1.5} className="text-slate-400" />
                                    View Applicant
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push('/admission-management/' + a.id + '/edit')
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                  >
                                    <Pencil size={14} strokeWidth={1.5} className="text-slate-400" />
                                    Edit Applicant
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowConvertModal(a)
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#1565D8] hover:bg-blue-50 cursor-pointer whitespace-nowrap"
                                  >
                                    <CheckCircle2 size={14} strokeWidth={1.5} className="text-[#1565D8]" />
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
                                    <XCircle size={14} strokeWidth={1.5} className="text-red-500" />
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
              </div>
            )
          )}

          {/* ===================================================================
              SECTION 6 — GRID VIEW
              =================================================================== */}
          {activeView === 'grid' && (loading || filteredApplicants.length > 0) && (
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
                filteredApplicants.map(a => {
                  const stageData = configPipeline.find(s => s.id === a.stageId) || configPipeline[0]
                  
                  return (
                    <div
                      key={a.id}
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
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

          {/* ===================================================================
              SECTION 7 — KANBAN VIEW
              =================================================================== */}
          {activeView === 'kanban' && (loading || filteredApplicants.length > 0) && (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300">
                {configPipeline.map(stage => {
                  const stageApplicants = filteredApplicants.filter(a => a.stageId === stage.id)

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
                          className="p-1 rounded text-slate-400 hover:text-slate-650 hover:bg-slate-200 cursor-pointer"
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
                          stageApplicants.map(a => {
                            return (
                              <div
                                key={a.id}
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
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
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
                                        <span className="text-xs text-slate-650 truncate max-w-[80px] font-sans">
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
