'use client'

import { useState, useEffect,
  useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, subMonths, addMonths } from 'date-fns'
import {
  Download, Plus, Search,
  Mail, MessageCircle, Phone,
  MoreVertical, AlertCircle, CheckCircle
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { useAcademicYears }
  from '@/hooks/useAcademicYears'
import { GRADE_OPTIONS, getGradeLabel }
  from '@/constants/grades'

const STATUS_CONFIG = {
  SCHEDULED: {
    label: 'Scheduled',
    badge: 'bg-blue-50 text-blue-700',
    border: 'border-l-blue-500'
  },
  UNPAID: {
    label: 'Unpaid',
    badge: 'bg-red-50 text-red-700',
    border: 'border-l-red-500'
  },
  PARTIALLY_PAID: {
    label: 'Partial',
    badge: 'bg-amber-50 text-amber-700',
    border: 'border-l-amber-500'
  },
  PAID: {
    label: 'Paid',
    badge: 'bg-green-50 text-green-700',
    border: 'border-l-green-500'
  },
  OVERDUE: {
    label: 'Overdue',
    badge: 'bg-red-100 text-red-800',
    border: 'border-l-red-700'
  },
  WAIVED: {
    label: 'Waived',
    badge: 'bg-slate-100 text-slate-500',
    border: 'border-l-slate-300'
  }
} as const

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'UNPAID', label: 'Unpaid' },
  { key: 'PARTIALLY_PAID',
    label: 'Partially Paid' },
  { key: 'PAID', label: 'Paid' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'WAIVED', label: 'Waived' }
]

type Invoice = {
  id: string
  invoiceNumber: string
  invoiceType: string
  status: string
  totalAmount: number
  paidAmount: number
  dueDate: string | null
  createdAt: string
  student: {
    id: string
    name: string
    studentCode: string
    gradeLabel: string | null
    guardianPhone: string | null
  } | null
  term: {
    id: string
    name: string
  } | null
  course: {
    id: string
    name: string
  } | null
  items: {
    id: string
    head: string
    amount: number
    quantity: number
  }[]
}

type Summary = {
  totalInvoices: number
  collected: number
  outstanding: number
  statusCounts: Record<string, number>
}

export default function FeeManagementPage() {
  const router = useRouter()
  const { years, currentYear } =
    useAcademicYears()

  const [invoices, setInvoices] =
    useState<Invoice[]>([])
  const [summary, setSummary] =
    useState<Summary | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] =
    useState(1)
  const [isLoading, setIsLoading] =
    useState(false)
  const [activeStatus, setActiveStatus] =
    useState('')
  const [search, setSearch] = useState('')
  const [gradeLabel, setGradeLabel] =
    useState('all')
  const [page, setPage] = useState(1)
  const [actionMenuId, setActionMenuId] =
    useState<string | null>(null)
  const [menuPosition, setMenuPosition] =
    useState({ top: 0, left: 0 })

  // New Filters State
  const [institutionType, setInstitutionType] = useState<'SCHOOL' | 'LEARNING_CENTER'>('SCHOOL')
  const [termFilter, setTermFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState(() => format(new Date(), 'yyyy-MM'))
  const [courseFilter, setCourseFilter] = useState('all')
  const [isInitialized, setIsInitialized] = useState(false)
  const searchParams = useSearchParams()
  const [studentIdFilter, setStudentIdFilter] = useState<string | null>(null)

  // Dropdowns lists
  const [termsList, setTermsList] = useState<any[]>([])
  const [coursesList, setCoursesList] = useState<any[]>([])
  const [gradesList, setGradesList] = useState<string[]>([])
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})

  // Batch Summary State
  const [batchId, setBatchId] = useState<string | null>(null)
  const [batchInvoices, setBatchInvoices] = useState<Invoice[]>([])
  const [isBatchLoading, setIsBatchLoading] = useState(false)
  const [batchSearch, setBatchSearch] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [pendingBatchFetch, setPendingBatchFetch] = useState<string | null>(null)

  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }, [])

  const fetchBatchSummary = useCallback(async (id: string) => {
    setIsBatchLoading(true)
    try {
      const res = await fetch(`/api/v1/fees/invoices/batch/${id}`)
      if (!res.ok) throw new Error('Failed to fetch batch summary')
      const data = await res.json()
      setBatchInvoices(data.invoices || [])
    } catch (err) {
      console.error(err)
      triggerToast('Could not load batch summary')
      setBatchId(null)
    } finally {
      setIsBatchLoading(false)
    }
  }, [triggerToast])

  // Effect 1: Read sessionStorage once on mount only.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const lastBatchId = sessionStorage.getItem('vidhyaan_last_batch_id')
    if (lastBatchId) {
      sessionStorage.removeItem('vidhyaan_last_batch_id')
      setBatchId(lastBatchId)
      setPendingBatchFetch(lastBatchId)
    }
  }, [])

  // Effect 2: Trigger fetch when pendingBatchFetch is set.
  useEffect(() => {
    if (pendingBatchFetch) {
      fetchBatchSummary(pendingBatchFetch)
      setPendingBatchFetch(null)
    }
  }, [pendingBatchFetch, fetchBatchSummary])

  const fetchInvoices = useCallback(
    async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', '25')
        if (activeStatus)
          params.set('status', activeStatus)
        if (search)
          params.set('search', search)
        if (gradeLabel && gradeLabel !== 'all')
          params.set('gradeLabel', gradeLabel)
        if (studentIdFilter)
          params.set('studentId', studentIdFilter)

        if (institutionType === 'SCHOOL') {
          if (termFilter && termFilter !== 'all') {
            params.set('termId', termFilter)
          }
        } else {
          if (courseFilter && courseFilter !== 'all') {
            params.set('courseId', courseFilter)
          }
        }
        if (monthFilter) {
          params.set('month', monthFilter)
        }

        const res = await fetch(
          `/api/v1/fees/invoices?${params}`
        )
        const data = await res.json()
        setInvoices(data.data ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setStatusCounts(data.statusCounts ?? {})
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }, [page, activeStatus, search, gradeLabel, termFilter, monthFilter, courseFilter, institutionType, studentIdFilter]
  )

  const fetchSummary = useCallback(
    async () => {
      try {
        const params = new URLSearchParams()
        if (activeStatus)
          params.set('status', activeStatus)
        if (gradeLabel && gradeLabel !== 'all')
          params.set('gradeLabel', gradeLabel)
        if (studentIdFilter)
          params.set('studentId', studentIdFilter)

        if (institutionType === 'SCHOOL') {
          if (termFilter && termFilter !== 'all') {
            params.set('termId', termFilter)
          }
        } else {
          if (courseFilter && courseFilter !== 'all') {
            params.set('courseId', courseFilter)
          }
        }
        if (monthFilter) {
          params.set('month', monthFilter)
        }

        const res = await fetch(
          `/api/v1/fees/summary?${params}`
        )
        const data = await res.json()
        setSummary(data.data ?? null)
      } catch (err) {
        console.error(err)
      }
    }, [activeStatus, gradeLabel, termFilter, monthFilter, courseFilter, institutionType, studentIdFilter]
  )

  // One-time initial configurations on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const urlStudentId = searchParams?.get('studentId')
        const urlCourseId = searchParams?.get('courseId')
        if (urlStudentId) {
          setStudentIdFilter(urlStudentId)
        }

        const orgRes = await fetch('/api/v1/settings/org-type')
        const orgJson = await orgRes.json()
        const instType = orgJson.data?.institutionType || 'SCHOOL'
        setInstitutionType(instType)

        if (instType === 'SCHOOL') {
          const termsRes = await fetch('/api/v1/settings/terms')
          const termsJson = await termsRes.json()
          const terms = termsJson.data || []
          setTermsList(terms)

          const today = new Date()
          const activeTerm = terms.find((t: any) => {
            const start = new Date(t.startDate)
            const end = new Date(t.endDate)
            return today >= start && today <= end
          })
          if (activeTerm) {
            setTermFilter(activeTerm.id)
          } else {
            setTermFilter('all')
          }
        } else {
          const coursesRes = await fetch('/api/v1/settings/courses')
          const coursesJson = await coursesRes.json()
          setCoursesList(coursesJson.data || [])
          if (urlCourseId) {
            setCourseFilter(urlCourseId)
          } else {
            setCourseFilter('all')
          }
        }

        const gradesRes = await fetch('/api/v1/fees/invoices/grades')
        const gradesJson = await gradesRes.json()
        setGradesList(gradesJson.data?.grades || [])
      } catch (err) {
        console.error('Initialization error:', err)
      } finally {
        setIsInitialized(true)
      }
    }

    initData()
  }, [searchParams])

  useEffect(() => {
    if (isInitialized) {
      fetchInvoices()
    }
  }, [fetchInvoices, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      fetchSummary()
    }
  }, [fetchSummary, isInitialized])

  const filteredBatchInvoices = useMemo(() => {
    if (!batchSearch.trim()) return batchInvoices
    const query = batchSearch.toLowerCase()
    return batchInvoices.filter(inv =>
      inv.student?.name?.toLowerCase().includes(query)
    )
  }, [batchInvoices, batchSearch])

  const tabCounts = useMemo<Record<string, number>>(() => {
    return {
      '': statusCounts.ALL ?? total,
      ...statusCounts
    }
  }, [statusCounts, total])

  const monthsOptions = useMemo(() => {
    const list = []
    const now = new Date()
    for (let i = -11; i <= 3; i++) {
      const date = i < 0 ? subMonths(now, Math.abs(i)) : addMonths(now, i)
      list.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy')
      })
    }
    return list.sort((a, b) => a.value.localeCompare(b.value))
  }, [])

  const getSummaryHeaderLabel = () => {
    if (institutionType === 'SCHOOL') {
      if (termFilter && termFilter !== 'all') {
        const term = termsList.find(t => t.id === termFilter)
        return term ? `${term.name} Overview` : 'Overview'
      }
      return 'Overview'
    } else {
      if (monthFilter) {
        const option = monthsOptions.find(o => o.value === monthFilter)
        return option ? `${option.label} Overview` : 'Overview'
      }
      return 'Overview'
    }
  }

  const handleActionClick = useCallback((
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation()
    const rect =
      (e.currentTarget as HTMLElement)
        .getBoundingClientRect()
    setMenuPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 160
    })
    setActionMenuId(
      prev => prev === id ? null : id
    )
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(
        'Delete this invoice? ' +
        'This cannot be undone.'
      )) return
      await fetch(
        `/api/v1/fees/invoices/${id}`,
        { method: 'DELETE' }
      )
      fetchInvoices()
      fetchSummary()
      setActionMenuId(null)
    }, [fetchInvoices, fetchSummary]
  )

  const handleExport = useCallback(() => {
    const params = new URLSearchParams()
    if (activeStatus)
      params.set('status', activeStatus)
    if (gradeLabel && gradeLabel !== 'all')
      params.set('gradeLabel', gradeLabel)
    if (institutionType === 'SCHOOL') {
      if (termFilter && termFilter !== 'all') {
        params.set('termId', termFilter)
      }
    } else {
      if (courseFilter && courseFilter !== 'all') {
        params.set('courseId', courseFilter)
      }
    }
    if (monthFilter) {
      params.set('month', monthFilter)
    }
    window.open(
      `/api/v1/fees/invoices/export?${params}`,
      '_blank'
    )
  }, [activeStatus, gradeLabel, institutionType, termFilter, courseFilter, monthFilter])

  const MIN_ROWS = 8
  const emptyRowCount = Math.max(
    0, MIN_ROWS - invoices.length
  )

  const getBalance = (inv: Invoice) =>
    Number(inv.totalAmount) -
    Number(inv.paidAmount)

  const isOverdue = (inv: Invoice) =>
    inv.dueDate &&
    new Date(inv.dueDate) < new Date() &&
    inv.status !== 'PAID' &&
    inv.status !== 'WAIVED'

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 pt-6 pb-4">
        <h1 className="text-xl font-bold text-slate-900 flex-1 min-w-0">
          Fee Management
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => router.push('/fee-management/create')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>
            {isBatchLoading ? (
        <div className="flex flex-col min-h-[400px] items-center justify-center font-sans select-none flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#1565D8] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Loading invoice summary...</p>
          </div>
        </div>
      ) : batchId ? (
        /* BATCH SUMMARY SCREEN BODY */
        <div className="px-4 sm:px-6 pb-12 flex-1 flex flex-col gap-5 max-w-4xl mx-auto w-full font-sans">
          {/* Success Banner */}
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl select-none">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800 font-sans">Invoices Generated Successfully</p>
              <p className="text-xs text-green-600 font-semibold mt-0.5">{batchInvoices.length} invoices created</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={batchSearch}
              onChange={e => setBatchSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white h-10"
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-2/5">
                      Student
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-1/5">
                      Term
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-1/5">
                      Amount
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-1/5">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatchInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-16 text-center text-sm text-slate-400">
                        No results found
                      </td>
                    </tr>
                  ) : (
                    filteredBatchInvoices.map(inv => {
                      const statusConfig = {
                        SCHEDULED: { label: 'Scheduled', badge: 'bg-blue-50 text-blue-700' },
                        UNPAID: { label: 'Unpaid', badge: 'bg-amber-50 text-amber-700' },
                        PAID: { label: 'Paid', badge: 'bg-green-50 text-green-700' }
                      }
                      const config = statusConfig[inv.status as keyof typeof statusConfig] || { label: inv.status, badge: 'bg-slate-100 text-slate-600' }

                      return (
                        <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-2.5">
                            <p className="text-sm font-semibold text-slate-800 font-sans">{inv.student?.name || '—'}</p>
                            <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                              {inv.student?.gradeLabel || '—'}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 text-sm text-slate-600 font-semibold font-sans">
                            {inv.term?.name || 'Adhoc'}
                          </td>
                          <td className="px-3 py-2.5 text-sm font-bold text-slate-900 font-sans">
                            ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
                              {config.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-4 py-3 border-t border-slate-200 select-none">
              <p className="text-xs text-slate-500 font-bold font-sans">
                Showing {filteredBatchInvoices.length} of {batchInvoices.length} invoices
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                setBatchId(null)
                setBatchInvoices([])
                setBatchSearch('')
                fetchInvoices()
                fetchSummary()
              }}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition duration-150 select-none cursor-pointer font-sans"
            >
              Go to Fee Management
            </button>
          </div>
        </div>
      ) : (
        /* NORMAL VIEW BODY */
        <>
          {/* ── SUMMARY BAR ── */}
          {summary && (
            <div className="px-4 sm:px-6 pb-4">
              <h2 className="text-sm font-bold text-slate-800 mb-2 font-sans select-none">
                {getSummaryHeaderLabel()}
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div
                  className="flex items-center gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  style={{
                    WebkitOverflowScrolling: 'touch'
                  }}>

                  <div className="flex-shrink-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold whitespace-nowrap">
                      Total Invoices
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mt-0.5">
                      {summary.totalInvoices}
                    </p>
                  </div>

                  <div className="w-px h-10 bg-slate-200 flex-shrink-0" />

                  <div className="flex-shrink-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold whitespace-nowrap">
                      Collected
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-0.5">
                      ₹{summary.collected.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="w-px h-10 bg-slate-200 flex-shrink-0" />

                  <div className="flex-shrink-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold whitespace-nowrap">
                      Outstanding
                    </p>
                    <p className="text-2xl font-bold text-red-600 mt-0.5">
                      ₹{summary.outstanding.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="w-px h-10 bg-slate-200 flex-shrink-0" />

                  <div className="flex-shrink-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold whitespace-nowrap">
                      Overdue
                    </p>
                    <p className="text-2xl font-bold text-amber-600 mt-0.5 flex items-center gap-1.5">
                      {summary.statusCounts?.OVERDUE ?? 0}
                      {(summary.statusCounts?.OVERDUE ?? 0) > 0 && (
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      )}
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ── STATUS TABS ── */}
          <div className="px-4 sm:px-6">
            <div className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex gap-1 border-b border-slate-200 min-w-max">
                {STATUS_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveStatus(tab.key)
                      setStudentIdFilter(null)
                      setPage(1)
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
                      activeStatus === tab.key
                        ? 'border-[#1565D8] text-[#1565D8]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}>
                    {tab.label}
                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                      tab.key === 'SCHEDULED'
                        ? 'bg-blue-50 text-blue-700'
                        : activeStatus === tab.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.key === ''
                        ? (statusCounts.ALL ?? total)
                        : (tabCounts[tab.key] ?? 0)
                      }
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── FILTER BAR ── */}
          <div className="px-4 sm:px-6 pt-4">
            <div className="bg-white rounded-xl border border-slate-200 p-2 flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] h-9">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or invoice..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value)
                    setStudentIdFilter(null)
                    setPage(1)
                  }}
                  className="w-full h-full pl-9 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
                />
              </div>

              {/* Grade dropdown */}
              <select
                value={gradeLabel}
                onChange={e => {
                  setGradeLabel(e.target.value)
                  setStudentIdFilter(null)
                  setPage(1)
                }}
                className="flex-shrink-0 h-9 whitespace-nowrap text-sm border border-slate-200 rounded-lg px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[110px] w-auto font-sans"
              >
                <option value="all">All Grades</option>
                {gradesList.map(g => (
                  <option key={g} value={g}>
                    {getGradeLabel(g)}
                  </option>
                ))}
              </select>

              {/* SCHOOL Dropdowns */}
              {institutionType === 'SCHOOL' && (
                <>
                  {/* Term dropdown */}
                  <select
                    value={termFilter}
                    onChange={e => {
                      setTermFilter(e.target.value)
                      setStudentIdFilter(null)
                      setPage(1)
                    }}
                    className="flex-shrink-0 h-9 whitespace-nowrap text-sm border border-slate-200 rounded-lg px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[110px] w-auto font-sans"
                  >
                    <option value="all">All Terms</option>
                    {termsList.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {/* LEARNING CENTER Dropdowns */}
              {institutionType === 'LEARNING_CENTER' && (
                <>
                  {/* Course dropdown */}
                  <select
                    value={courseFilter}
                    onChange={e => {
                      setCourseFilter(e.target.value)
                      setStudentIdFilter(null)
                      setPage(1)
                    }}
                    className="flex-shrink-0 h-9 whitespace-nowrap text-sm border border-slate-200 rounded-lg px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[110px] w-auto font-sans"
                  >
                    <option value="all">All Courses</option>
                    {coursesList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {/* Month dropdown */}
              <select
                value={monthFilter}
                onChange={e => {
                  setMonthFilter(e.target.value)
                  setStudentIdFilter(null)
                  setPage(1)
                }}
                className="flex-shrink-0 h-9 whitespace-nowrap text-sm border border-slate-200 rounded-lg px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[110px] w-auto font-sans"
              >
                {monthsOptions.map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              {/* Export button */}
              <button
                onClick={handleExport}
                title="Export CSV"
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── TABLE ── */}
          <div className="px-4 sm:px-6 pt-4 pb-8 flex-1">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

              <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full min-w-[820px]">

                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Invoice
                      </th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Student
                      </th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Connect
                      </th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Type / Term
                      </th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Due Date
                      </th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-100 animate-pulse">
                          <td colSpan={8} className="px-3 py-2.5">
                            <div className="h-8 bg-slate-100 rounded" />
                          </td>
                        </tr>
                      ))
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-16 text-center text-sm text-slate-400">
                          No invoices found
                        </td>
                      </tr>
                    ) : (
                      <>
                        {invoices.map(inv => {
                          const config =
                            STATUS_CONFIG[inv.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.UNPAID

                          const balance = getBalance(inv)
                          const overdue = isOverdue(inv)

                          const initials = (inv.student?.name ?? 'NA')
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()

                          const colors = [
                            'bg-blue-500',
                            'bg-green-500',
                            'bg-purple-500',
                            'bg-amber-500',
                            'bg-red-500',
                            'bg-indigo-500'
                          ]
                          const avatarColor =
                            colors[(inv.student?.name?.charCodeAt(0) ?? 0) % colors.length]

                          return (
                            <tr
                              key={inv.id}
                              onClick={() => router.push(`/fee-management/${inv.id}`)}
                              className={`border-b border-slate-100 border-l-2 ${config.border} hover:bg-slate-50/80 transition-colors cursor-pointer`}>

                              {/* Invoice */}
                              <td className="px-3 py-2.5">
                                <p className="text-sm font-semibold text-slate-800 font-mono">
                                  {inv.invoiceNumber}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {format(new Date(inv.createdAt), 'd MMM')}
                                </p>
                              </td>

                              {/* Student */}
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor}`}>
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                      {inv.student?.name ?? '—'}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">
                                      {inv.student?.studentCode}
                                      {inv.student?.gradeLabel && ` · ${inv.student.gradeLabel}`}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Connect */}
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={e => {
                                      e.stopPropagation()
                                      if (inv.student?.guardianPhone)
                                        window.open(`mailto:${inv.student.guardianPhone}`)
                                    }}
                                    className="text-slate-400 hover:text-blue-500 transition-colors">
                                    <Mail className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation()
                                      if (inv.student?.guardianPhone)
                                        window.open(`https://wa.me/91${inv.student.guardianPhone}`)
                                    }}
                                    className="text-slate-400 hover:text-green-500 transition-colors">
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation()
                                      if (inv.student?.guardianPhone)
                                        window.open(`tel:${inv.student.guardianPhone}`)
                                    }}
                                    className="text-slate-400 hover:text-blue-500 transition-colors">
                                    <Phone className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>

                              {/* Type / Term */}
                              <td className="px-3 py-2.5 font-sans">
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  {inv.invoiceType}
                                </span>
                                {(inv.term || inv.invoiceType === 'TERM') && (
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {inv.term?.name || '—'}
                                  </p>
                                )}
                                {inv.course && (
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {inv.course.name}
                                  </p>
                                )}
                              </td>

                              {/* Amount */}
                              <td className="px-3 py-2.5">
                                <p className="text-sm font-bold text-slate-900">
                                  ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                                </p>
                                {balance > 0 && inv.status !== 'UNPAID' && (
                                  <p className="text-xs text-slate-400">
                                    Bal: ₹{balance.toLocaleString('en-IN')}
                                  </p>
                                )}
                              </td>

                              {/* Status */}
                              <td className="px-3 py-2.5">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
                                  {config.label}
                                </span>
                                {overdue && (
                                  <p className="text-[11px] text-red-500 font-medium mt-0.5 flex items-center gap-0.5">
                                    <AlertCircle className="w-3 h-3" />
                                    Overdue
                                  </p>
                                )}
                              </td>

                              {/* Due Date */}
                              <td className="px-3 py-2.5">
                                <span className={`text-xs whitespace-nowrap ${overdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                                  {inv.dueDate
                                    ? format(new Date(inv.dueDate), 'd MMM')
                                    : '—'
                                  }
                                </span>
                              </td>

                              {/* Action */}
                              <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={e => handleActionClick(e, inv.id)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}

                        {/* Empty placeholder rows */}
                        {Array.from({ length: emptyRowCount }).map((_, i) => (
                          <tr key={`empty-${i}`} className="border-b border-slate-100 border-l-2 border-l-transparent">
                            <td colSpan={8} className="px-3 py-2.5 h-[52px]" />
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500 flex-shrink-0">
                  Showing {invoices.length === 0
                    ? '0'
                    : `${(page - 1) * 25 + 1}–${Math.min(page * 25, total)}`
                  } of {total} invoices
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
                    Previous
                  </button>
                  <span className="w-8 h-8 flex items-center justify-center bg-[#1565D8] text-white text-sm font-semibold rounded-lg">
                    {page}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── ACTION PORTAL MENU ── */}
      {actionMenuId &&
        typeof window !== 'undefined' &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActionMenuId(null)} />
            <div
              className="fixed z-50 bg-white rounded-xl shadow-lg border border-slate-200 py-1 w-44"
              style={{
                top: menuPosition.top,
                left: menuPosition.left
              }}>
              <button
                onClick={() => {
                  router.push(`/fee-management/${actionMenuId}`)
                  setActionMenuId(null)
                }}
                className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors">
                View Invoice
              </button>
              <button
                onClick={() => {
                  router.push(`/fee-management/${actionMenuId}?pay=true`)
                  setActionMenuId(null)
                }}
                className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors">
                Record Payment
              </button>
              <button
                onClick={() => handleDelete(actionMenuId)}
                className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors">
                Delete Invoice
              </button>
            </div>
          </>,
          document.body
        )
      }

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 select-none">
          <AlertCircle size={16} className="text-red-400" />
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  )
}
