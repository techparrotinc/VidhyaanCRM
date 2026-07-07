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
  Shield,
  ChevronRight,
  Bell,
  Menu,
  Eye,
  Plus,
  Download,
  Trash2,
  Pencil,
  AlertCircle,
  Loader2,
  UserPlus
} from 'lucide-react'
import TableSkeleton from '@/components/shared/TableSkeleton'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { config, type, pipeline as configPipeline } from '@/lib/admission-settings-config'
import ConvertToStudentModal from '@/components/admissions/ConvertToStudentModal'
import RejectModal from '@/components/admissions/RejectModal'
import BulkActionBar from '@/components/admissions/BulkActionBar'
import Toast, { type ToastState } from '@/components/admissions/Toast'
import PipelineSummaryStrip from '@/components/admissions/PipelineSummaryStrip'
import PaginationFooter from '@/components/admissions/PaginationFooter'
import GridView from '@/components/admissions/GridView'
import KanbanView from '@/components/admissions/KanbanView'
import FilterBar from '@/components/admissions/FilterBar'
import ListTable from '@/components/admissions/ListTable'
import { useConfirm } from '@/components/ui/confirm-dialog'

const moduleLabel = config.moduleLabel[type]
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
  const [toast, setToast] = useState<ToastState>({ msg: '', type: 'success', show: false })

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
      revalidateOnFocus: true,
      dedupingInterval: 10000,
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
      // Refresh on focus/mount so creates/converts/deletes made elsewhere
      // appear without a full browser reload
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 5000,
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


  const router = useRouter()
  const searchParams = useSearchParams()
  const confirmDialog = useConfirm()

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

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setFilters(f => ({ ...f, search: value }))
      setPagination(p => ({ ...p, page: 1 }))
    }, 300)
  }

  const handleSearchClear = () => {
    setSearchQuery('')
    setFilters(f => ({ ...f, search: '' }))
    setPagination(p => ({ ...p, page: 1 }))
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
  const handleConvertSuccess = (student: { id: string; studentCode?: string }) => {
    showToast(`Student record created: ${student.studentCode || 'STU-XXXXX'}`)
    setShowConvertModal(null)
    fetchAdmissions()
    fetchPipeline()
    router.push(`/student-management/${student.id}`)
  }

  // STEP 12: Wire reject confirm
  const handleConfirmReject = async (reason: string) => {
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
            rejectionReason: reason
          })
        }
      )
      fetchAdmissions()
      fetchPipeline()
    } catch (err) {
      console.error('Reject failed', err)
    }
    setShowRejectModal(null)
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
    setSelectedItems([])
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return

    const confirmed = await confirmDialog({
      title: `Delete ${selectedItems.length} admission(s)?`,
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger'
    })
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
    const confirmed = await confirmDialog({
      title: 'Delete this admission record?',
      message: 'The record will be removed from all views.',
      confirmLabel: 'Delete',
      variant: 'danger'
    })
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
  const handleStageSelect = async (admissionId: string, newStageId: string) => {
    const selectedStage = stages.find(s => s.id === newStageId)
    const previousData = admissionsData
    const rawAdmissions = admissionsData?.admissions || admissionsData?.data || []

    const updatedAdmissions = rawAdmissions.map((a: any) =>
      a.id === admissionId
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
        `/api/v1/admissions/${admissionId}`,
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
        throw new Error(err.message || 'Update failed')
      }

      const data = await res.json()
      if (data.admission) {
        const finalAdmissions = rawAdmissions.map((a: any) =>
          a.id === admissionId ? data.admission : a
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
      showToast(err.message || 'Failed to update stage', 'error')
    }
  }

  const placeholderCount = Math.max(
    0,
    MINIMUM_ROWS - filteredApplicants.length
  )

  return (
    <>
      <div className="p-3 sm:p-4 lg:p-6 space-y-3 max-w-7xl mx-auto w-full select-none bg-white min-h-screen">
          
          {/* SECTION 1 — PAGE HEADER SECTION */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h1 className="text-xl font-bold text-slate-900 truncate">
              Admission Management
            </h1>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
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
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
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
          <PipelineSummaryStrip
            expanded={pipelineExpanded}
            onToggle={togglePipeline}
            totalApplicants={totalCount}
            headerTotal={Object.values(stageCounts).reduce((a, b) => a + b, 0) || totalCount || 0}
            conversionRate={conversionRate}
            admittedCount={displayAdmittedCount}
            avgDaysToAdmit={pipelineStats.avgDaysToAdmit}
            pendingActionCount={pendingActionCount}
          />
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
                
                <FilterBar
                  variant="list"
                  searchQuery={searchQuery}
                  onSearchInput={handleSearchInput}
                  onSearchClear={handleSearchClear}
                  applyingForOptions={uniqueApplyingFor as string[]}
                  filterApplyingFor={filterApplyingFor}
                  onFilterApplyingFor={setFilterApplyingFor}
                  counsellors={counsellors}
                  filterCounsellor={filterCounsellor}
                  onFilterCounsellor={setFilterCounsellor}
                  filterDateRange={filterDateRange}
                  onFilterDateRange={setFilterDateRange}
                  filterPriority={filterPriority}
                  onFilterPriority={setFilterPriority}
                  isAnyFilterActive={!!isAnyFilterActive}
                  onClearAll={handleClearAllFilters}
                  activeView={activeView}
                  onViewChange={setActiveView}
                />

                <ListTable
                  applicants={filteredApplicants}
                  placeholderCount={placeholderCount}
                  stages={stages}
                  counsellors={counsellors}
                  selectedItems={selectedItems}
                  onSelectAll={handleSelectAll}
                  onSelectOne={handleSelectApplicant}
                  counsellorDropdownId={counsellorDropdownId}
                  onOpenCounsellorPicker={openCounsellorPicker}
                  onCloseCounsellorPicker={() => setCounsellorDropdownId(null)}
                  onAssignCounsellor={handleAssignCounsellor}
                  onStageSelect={handleStageSelect}
                  openMenuId={openMenuId}
                  onToggleRowMenu={(id, position) => {
                    setMenuPosition(position)
                    setOpenMenuId(openMenuId === id ? null : id)
                  }}
                  getStageBorderColor={getStageBorderColor}
                  getAvatarColor={getAvatarColor}
                  getStageColor={getStageColor}
                  onOpen={(id) => router.push(`/admission-management/${id}`)}
                  onPrefetch={(id) => router.prefetch(`/admission-management/${id}`)}
                />

                {/* Pagination */}
                {(loading || filteredApplicants.length > 0) && (
                  <PaginationFooter
                    loading={loading}
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    showingStart={showingStart}
                    showingEnd={showingEnd}
                    totalCount={totalCount}
                    itemLabel={moduleLabel.toLowerCase()}
                    onPrev={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    onNext={() => setPagination(p => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                  />
                )}

              </div>
            )
          ) : (
            <>
              <FilterBar
                variant="standalone"
                searchQuery={searchQuery}
                onSearchInput={handleSearchInput}
                onSearchClear={handleSearchClear}
                applyingForOptions={uniqueApplyingFor as string[]}
                filterApplyingFor={filterApplyingFor}
                onFilterApplyingFor={setFilterApplyingFor}
                counsellors={counsellors}
                filterCounsellor={filterCounsellor}
                onFilterCounsellor={setFilterCounsellor}
                filterDateRange={filterDateRange}
                onFilterDateRange={setFilterDateRange}
                filterPriority={filterPriority}
                onFilterPriority={setFilterPriority}
                isAnyFilterActive={!!isAnyFilterActive}
                onClearAll={handleClearAllFilters}
                activeView={activeView}
                onViewChange={setActiveView}
              />

              {/* Grid View */}
              {activeView === 'grid' && (
                <GridView
                  loading={loading}
                  applicants={filteredApplicants}
                  getStatusBadge={getStatusBadge}
                  formatDate={formatDate}
                  onOpen={(id) => handleNavigate(`/admission-management/${id}`)}
                  onPrefetch={(id) => router.prefetch(`/admission-management/${id}`)}
                />
              )}

              {/* Kanban View */}
              {activeView === 'kanban' && (
                <KanbanView
                  loading={loading}
                  applicants={filteredApplicants}
                  formatDate={formatDate}
                  onOpen={(id) => handleNavigate(`/admission-management/${id}`)}
                  onPrefetch={(id) => router.prefetch(`/admission-management/${id}`)}
                  onAddToStage={(stageId) => router.push(`/admission-management/create?stage=${stageId}`)}
                  onMoveStage={handleMoveStage}
                />
              )}

              {/* Shared Pagination (For Grid view only, since List view has its own embedded pagination) */}
              {activeView === 'grid' && (loading || filteredApplicants.length > 0) && (
                <PaginationFooter
                  variant="card"
                  loading={loading}
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  showingStart={showingStart}
                  showingEnd={showingEnd}
                  totalCount={totalCount}
                  itemLabel={moduleLabel.toLowerCase()}
                  onPrev={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  onNext={() => setPagination(p => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                />
              )}
            </>
          )}
      </div>

      <ConvertToStudentModal
        applicant={showConvertModal}
        onClose={() => setShowConvertModal(null)}
        onSuccess={handleConvertSuccess}
      />

      <RejectModal
        applicant={showRejectModal}
        onClose={() => setShowRejectModal(null)}
        onConfirm={handleConfirmReject}
      />

      <BulkActionBar
        selectedCount={selectedItems.length}
        pipeline={pipeline}
        counsellors={counsellors}
        onMoveStage={handleBulkMoveStage}
        onAssignCounsellor={handleBulkAssignCounsellor}
        onSendCommunication={() => showToast("Communication sent to selected", "success")}
        onExport={() => {
          showToast("Exported selected applicants", "info")
          setSelectedItems([])
        }}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedItems([])}
      />

      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
          <Shield className="text-[#1565D8] animate-pulse" size={40}/>
          <div className="mt-3 w-12 h-0.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#1565D8] rounded-full animate-[loader_1s_ease-in-out_infinite]"/>
          </div>
        </div>
      )}

      <Toast toast={toast} />

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
