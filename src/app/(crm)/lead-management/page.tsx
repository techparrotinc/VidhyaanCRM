"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { format } from 'date-fns'
import { useCounsellors } from '@/hooks/useCounsellors'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import TableSkeleton from '@/components/shared/TableSkeleton'
import {
  ClipboardList,
  Shield,
  Bell,
  Menu,
  X,
  Eye,
  BarChart2,
  CheckCircle2,
  Plus,
  Trash2,
  Pencil,
  ArrowRight,
  Check,
  TriangleAlert,
  Info,
  XCircle,
  ExternalLink
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import ConvertToAdmissionModal from '@/components/modals/ConvertToAdmissionModal'
import LeadDetailDrawer from '@/components/leads/LeadDetailDrawer'
import DeleteLeadModal from '@/components/leads/DeleteLeadModal'
import LeadPagination from '@/components/leads/LeadPagination'
import LeadBulkActionBar from '@/components/leads/LeadBulkActionBar'
import LeadFilterBar from '@/components/leads/LeadFilterBar'
import LeadsTable from '@/components/leads/LeadsTable'
import LeadGridView from '@/components/leads/LeadGridView'
import { formatDate } from '@/components/leads/leadConfig'
import { useAcademicYearStore } from '@/stores/academic-year.store'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"


export default function LeadManagementPage() {
  const router = useRouter()
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  // STEP 2: Remove hardcoded leads array. Replace with empty array:
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null)

  // STEP 3: Add state variables:
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 0
  })
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    counsellorId: '',
    search: '',
    priority: ''
  })
  const [filterDateRange, setFilterDateRange] = useState<string | null>(null)

  // Use shared hook for active counsellors
  const { counsellors } = useCounsellors()

  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertLead, setConvertLead] = useState<any | null>(null)

  const openConvertModal = (lead: any) => {
    setConvertLead(lead)
    setShowConvertModal(true)
  }

  // SWR for data fetching
  const currentPage = pagination.page
  const search = filters.search
  const statusFilter = filters.status
  const counsellorFilter = filters.counsellorId

  const selectedYearId = useAcademicYearStore((s) => s.selectedYearId)

  const params = useMemo(() => {
    return new URLSearchParams({
      page: String(currentPage),
      limit: '25',
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
      ...(counsellorFilter && { assignedToId: counsellorFilter }),
      ...(filters.source && { source: filters.source }),
      ...(filters.priority && { priority: filters.priority }),
      ...(selectedYearId && { academicYearId: selectedYearId }),
    })
  }, [currentPage, search, statusFilter, counsellorFilter, filters.source, filters.priority, selectedYearId])

  const { data, error: swrError, isLoading: loading, mutate } = useSWR<any>(
    `/api/v1/leads?${params.toString()}`,
    fetcher,
    {
      // Revalidate when the tab/page regains focus and on mount so the list
      // reflects creates/deletes made on other pages without a full browser
      // refresh. keepPreviousData avoids flicker while the fresh page loads.
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 5000,
      keepPreviousData: true,
    }
  )

  const error = swrError ? 'Failed to load leads' : null

  // Update pagination total / totalPages when SWR data is fetched
  useEffect(() => {
    if (data?.pagination) {
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }))
    }
  }, [data?.pagination])

  // Derive leads list from data
  const leads = useMemo(() => {
    const rawList = data?.leads || data?.data || []
    return rawList.map((l: any) => ({
      id: l.id,
      leadCode: l.leadCode,
      name: l.parentName || '—',
      parentName: l.parentName || '—',
      kidName: l.kidName || '—',
      phone: l.phone || '—',
      email: l.email ?? '—',
      applyingFor: l.gradeSought || l.course || l.batch || '—',
      // Raw value for the convert-to-admission modal's grade pre-fill —
      // applyingFor above is display-only ('—' is not a valid grade)
      gradeSought: l.gradeSought ?? '',
      source: l.source || '—',
      counsellor: l.assignedTo?.name ?? null,
      counsellorId: l.assignedToId ?? null,
      counsellorAvatar: l.assignedTo?.name 
        ? l.assignedTo.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() 
        : null,
      createdDate: formatDate(l.createdAt),
      status: l.status,
      priority: l.priority,
      avatar: (l.parentName || 'L').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      followUpDate: l.nextFollowUpAt ? new Date(l.nextFollowUpAt).toISOString().split('T')[0] : '',
      academicYearId: l.academicYearId ?? null,
      notes: l.notes ?? null,
    }))
  }, [data])

  // Real lead-cap usage from the API. `unlimited` is plan-aware (paid plans are
  // never capped), so the upgrade banner never nags a paying org.
  const leadsMax: number | null = data?.leadCap?.cap ?? null
  const leadsUsed: number = data?.leadCap?.used ?? 0
  const isPremium = (data?.leadCap?.unlimited ?? (leadsMax === null)) as boolean

  // Mutate/refresh function for SWR
  const fetchLeads = useCallback(async () => {
    mutate()
  }, [mutate])

  // Lead cap banner visibility (dismissed per session)
  const [showLeadBanner, setShowLeadBanner] = useState(true)

  // Navigation and layout states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Interactive filtering states
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeView, setActiveView] = useState<'list' | 'grid'>('list')

  interface EditLeadFormData {
    name?: string
    parentName?: string
    applyingFor?: string
    source?: string
    counsellor?: string | null
    status?: string
    followUpDate?: string
  }

  // Inline editing & deletion states
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<EditLeadFormData>({})
  const [deleteModalLead, setDeleteModalLead] = useState<any | null>(null)
  const [unsavedWarning, setUnsavedWarning] = useState<{
    pendingLeadId: string | null
    show: boolean
  }>({ pendingLeadId: null, show: false })
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null)

  // Inline status & counsellor dropdown states
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null)
  const [counsellorDropdownId, setCounsellorDropdownId] = useState<string | null>(null)
  
  // Toast notifications state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    show: boolean
  }>({ message: '', type: 'success', show: false })

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

  const handleDeleteLead = (leadId: string) => {
    const lead = leads.find((l: any) => l.id === leadId)
    if (lead) {
      setDeleteModalLead(lead)
    }
  }

  const handleConvertLead = (leadId: string) => {
    const lead = leads.find((l: any) => l.id === leadId)
    if (lead) {
      openConvertModal(lead)
    }
  }

  // Helper functions
  const showToast = (
    message: string, 
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    setToast({ message, type, show: true })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  const startEdit = (lead: any) => {
    if (editingLeadId && editingLeadId !== lead.id) {
      setUnsavedWarning({
        pendingLeadId: lead.id,
        show: true,
      })
      return
    }
    setEditingLeadId(lead.id)
    setEditFormData({
      name: lead.name,
      parentName: lead.parentName,
      applyingFor: lead.applyingFor,
      source: lead.source,
      counsellor: lead.counsellor,
      status: lead.status,
      followUpDate: lead.followUpDate || '',
    })
  }

  const cancelEdit = () => {
    setEditingLeadId(null)
    setEditFormData({})
  }

  // STEP 9: Wire inline status change
  const updateStatus = async (leadId: string, newStatus: string) => {
    try {
      setUpdatingLeadId(leadId)
      const res = await fetch(
        '/api/v1/leads/' + leadId,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      )
      if (res.ok) {
        fetchLeads()
      }
    } catch (err) {
      console.error('Status update failed', err)
    } finally {
      setUpdatingLeadId(null)
    }
  }

  // STEP 10: Wire inline counsellor assign
  const assignCounsellor = async (leadId: string, counsellorId: string | null) => {
    try {
      await fetch(
        '/api/v1/leads/' + leadId,
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
      fetchLeads()
    } catch (err) {
      console.error('Assign failed', err)
    }
  }

  // STEP 11: Wire delete
  const markNotInterested = async (leadId: string) => {
    try {
      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'NOT_INTERESTED' })
      })
      if (!res.ok) throw new Error('Failed to update status')
      showToast("Lead marked as Not Interested", "success")
      fetchLeads()
    } catch (err: any) {
      console.error(err)
      showToast(err.message || "Failed to update lead", "error")
    }
  }

  const deleteLead = async (leadId: string) => {
    try {
      await fetch(
        '/api/v1/leads/' + leadId,
        { method: 'DELETE' }
      )
      fetchLeads()
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const saveEdit = async (leadId: string) => {
    try {
      const parts = (editFormData.name ?? '').trim().split(' ')
      const firstName = parts[0] || ''
      const lastName = parts.slice(1).join(' ')

      const payload: any = {
        firstName,
        lastName,
        source: editFormData.source,
        status: editFormData.status,
        gradeSought: editFormData.applyingFor,
      }

      if (editFormData.counsellor !== undefined) {
        const found = counsellors.find((c: any) => c.name === editFormData.counsellor)
        payload.assignedToId = found ? found.id : null
      }

      if (editFormData.followUpDate !== undefined) {
        payload.nextFollowUpAt = editFormData.followUpDate || null
      }

      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to update lead')

      setSavedLeadId(leadId)
      setTimeout(() => setSavedLeadId(null), 2000)
      setEditingLeadId(null)
      setEditFormData({})
      showToast("Lead updated successfully")
      fetchLeads()
    } catch (err) {
      console.error(err)
      showToast("Failed to update lead", "error")
    }
  }

  const handleUnsavedDiscard = () => {
    setEditingLeadId(null)
    setEditFormData({})
    if (unsavedWarning.pendingLeadId) {
      const lead = leads.find(
        (l: any) => l.id === unsavedWarning.pendingLeadId
      )
      if (lead) startEdit(lead)
    }
    setUnsavedWarning({ 
      pendingLeadId: null, 
      show: false 
    })
  }

  const handleUnsavedSave = (leadId: string) => {
    saveEdit(leadId)
    if (unsavedWarning.pendingLeadId) {
      const lead = leads.find(
        (l: any) => l.id === unsavedWarning.pendingLeadId
      )
      if (lead) setTimeout(() => startEdit(lead), 100)
    }
    setUnsavedWarning({ 
      pendingLeadId: null, 
      show: false 
    })
  }

  const saveEditRef = useRef(saveEdit)
  const cancelEditRef = useRef(cancelEdit)

  useEffect(() => {
    saveEditRef.current = saveEdit
    cancelEditRef.current = cancelEdit
  })

  // Keyboard handler for inline edit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!editingLeadId) return
      if (e.key === 'Escape') cancelEditRef.current()
      if (e.key === 'Enter') {
        e.preventDefault()
        saveEditRef.current(editingLeadId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingLeadId])

  // Keyboard handler for status & counsellor dropdowns
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStatusDropdownId(null)
        setCounsellorDropdownId(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Dropdown UI toggles

  // Custom notes state
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [currentNoteText, setCurrentNoteText] = useState('')

  // Filter calculations (now directly fetched from backend)
  const filteredLeads = leads

  // Tab count values
  const getTabCount = (statusVal: string) => {
    if (!statusVal) return pagination.total
    if (filters.status === statusVal) return pagination.total
    return leads.filter((l: any) => l.status === statusVal).length
  }

  // Handle clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: '',
      source: '',
      counsellorId: '',
      search: '',
      priority: ''
    })
    setSearchQuery('')
  }

  // Handle individual lead selection
  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    )
  }

  // Handle select all leads
  const handleSelectAllLeads = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map((l: any) => l.id))
    }
  }

  // Open lead details side drawer
  const handleOpenLeadDetails = (lead: any) => {
    setSelectedLead(lead)
    setCurrentNoteText(notes[lead.id] || '')
    setDrawerOpen(true)
  }

  // Save lead specific note
  const handleSaveNote = () => {
    if (selectedLead) {
      setNotes(prev => ({
        ...prev,
        [selectedLead.id]: currentNoteText
      }))
      alert("Note saved successfully!")
    }
  }

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-5 lg:space-y-6 max-w-7xl mx-auto w-full select-none">
          
          {/* SECTION 1 — PAGE HEADER ROW */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Lead Management
              </h1>
            </div>
            <Link href="/lead-management/add-lead">
              <button className="bg-[#1565D8] text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition cursor-pointer">
                <Plus size={16} strokeWidth={1.5}/>
                Add Lead
              </button>
            </Link>
          </div>

          {/* SECTION 2 — LEAD CAP BANNER (Free Plan Only, Dismissible) */}
          {showLeadBanner && !isPremium && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
              {/* Left: icon + text + progress */}
              <div className="flex items-center gap-3 min-w-0">
                <BarChart2 className="size-[18px] text-amber-500 shrink-0" />
                <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-amber-800 min-w-0">
                  <span className="truncate">Free Plan: {leadsUsed} of {leadsMax} leads captured this month</span>
                  <div className="w-32 bg-amber-100 rounded-full h-2 inline-flex items-center shrink-0 ml-1">
                    <div
                      className="bg-amber-500 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${leadsMax ? Math.min(100, (leadsUsed / leadsMax) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-amber-700 ml-1">{leadsUsed}/{leadsMax}</span>
                </div>
              </div>

              {/* Right: upgrade CTA + close */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:inline text-xs font-semibold text-amber-700">Upgrade for unlimited leads</span>
                <Button className="bg-[#1565D8] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 h-auto rounded-lg transition shrink-0">
                  Upgrade Now →
                </Button>
                <button
                  onClick={() => setShowLeadBanner(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition flex-shrink-0 ml-1"
                  aria-label="Dismiss banner"
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3 — FILTER & SEARCH BAR */}
          <LeadFilterBar
            searchQuery={searchQuery}
            onSearchInput={(value) => {
              setSearchQuery(value)
              clearTimeout(searchTimeout.current)
              searchTimeout.current = setTimeout(
                () => setFilters(f => ({ ...f, search: value })),
                300
              )
            }}
            onSearchClear={() => {
              setSearchQuery('')
              setFilters(f => ({ ...f, search: '' }))
            }}
            filters={filters}
            onToggleSource={(source) => setFilters(f => ({ ...f, source: source === f.source ? '' : source }))}
            onToggleStatus={(status) => setFilters(f => ({ ...f, status: status === f.status ? '' : status }))}
            onToggleCounsellor={(id) => setFilters(f => ({ ...f, counsellorId: id === f.counsellorId ? '' : id }))}
            counsellors={counsellors}
            filterDateRange={filterDateRange}
            onFilterDateRange={setFilterDateRange}
            activeView={activeView}
            onViewChange={setActiveView}
            onClearAll={handleClearFilters}
          />

          {/* SECTION 4 — TAB STRIP */}
          <section 
            className="border-b border-slate-200 pb-0 flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {[
              { id: '', label: 'All', badgeClass: 'bg-slate-200 text-slate-600' },
              { id: 'NEW', label: 'New', badgeClass: 'bg-blue-100 text-blue-700' },
              { id: 'CONTACTED', label: 'Contacted', badgeClass: 'bg-amber-100 text-amber-700' },
              { id: 'INTERESTED', label: 'Interested', badgeClass: 'bg-purple-100 text-purple-700' },
              { id: 'CONVERTED', label: 'Converted', badgeClass: 'bg-green-100 text-green-700' },
              { id: 'NOT_INTERESTED', label: 'Rejected', badgeClass: 'bg-red-100 text-red-600' },
              { id: 'FOLLOW_UP_PENDING', label: 'Follow-up', badgeClass: 'bg-orange-100 text-orange-700' },
            ].map(tab => {
              const isActive = filters.status === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilters(f => ({ ...f, status: tab.id, page: 1 }))}
                  className={`px-3 md:px-4 py-2.5 text-xs md:text-sm font-semibold cursor-pointer relative transition-all duration-200 shrink-0 ${isActive ? 'text-[#1565D8] border-b-[3px] border-[#1565D8] mb-[-1px]' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  <span>{tab.label}</span>
                  <span className={`ml-2 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-[#1565D8] text-white' : tab.badgeClass}`}>
                    {getTabCount(tab.id)}
                  </span>
                </button>
              )
            })}
          </section>

          {/* EMPTY STATE */}
          {filteredLeads.length === 0 && !loading && (
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm py-20 text-center">
              <ClipboardList className="size-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-500" style={{ fontFamily: "'Poppins', sans-serif" }}>
                No leads found
              </h3>
              <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
                Try adjusting your filters or add a new lead to get started.
              </p>
              <Link href="/lead-management/add-lead">
                <Button className="bg-[#1565D8] text-white text-sm font-semibold px-5 py-2.5 h-auto rounded-lg inline-flex items-center gap-2 mt-6 hover:bg-blue-700 transition cursor-pointer">
                  <Plus className="size-4" />
                  <span>Add Lead</span>
                </Button>
              </Link>
            </section>
          )}

          {activeView === 'list' && (loading || filteredLeads.length > 0) && (
            loading && leads.length === 0 ? (
              <TableSkeleton rows={5} columns={8} />
            ) : (
              <LeadsTable
                leads={filteredLeads}
                mobileLeads={leads}
                selectedLeads={selectedLeads}
                onSelectAll={handleSelectAllLeads}
                onSelectLead={handleSelectLead}
                editingLeadId={editingLeadId}
                editFormData={editFormData}
                onEditFormChange={setEditFormData}
                onCancelEdit={cancelEdit}
                onSaveEdit={saveEdit}
                savedLeadId={savedLeadId}
                updatingLeadId={updatingLeadId}
                counsellors={counsellors}
                statusDropdownId={statusDropdownId}
                onSetStatusDropdownId={setStatusDropdownId}
                counsellorDropdownId={counsellorDropdownId}
                onSetCounsellorDropdownId={setCounsellorDropdownId}
                onUpdateStatus={updateStatus}
                onAssignCounsellor={assignCounsellor}
                showToast={showToast}
                openMenuId={openMenuId}
                onToggleRowMenu={(id, position) => {
                  setMenuPosition(position)
                  setOpenMenuId(openMenuId === id ? null : id)
                }}
                onOpen={(id) => router.push(`/lead-management/${id}`)}
                onPrefetch={(id) => router.prefetch(`/lead-management/${id}`)}
              />
            )
          )}

          {activeView === 'grid' && filteredLeads.length > 0 && (
            <LeadGridView
              leads={filteredLeads}
              onOpen={(id) => handleNavigate(`/lead-management/${id}`)}
              showToast={showToast}
            />
          )}

          {/* SECTION 7 — PAGINATION */}
          {filteredLeads.length > 0 && (
            <LeadPagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            />
          )}

          {/* SECTION 5 — BULK ACTION BAR */}
          <LeadBulkActionBar
            selectedIds={selectedLeads}
            selectedLeads={filteredLeads.filter((l: any) => selectedLeads.includes(l.id))}
            counsellors={counsellors}
            onClear={() => setSelectedLeads([])}
            onDone={(message) => {
              showToast(message, "success")
              setSelectedLeads([])
              fetchLeads()
            }}
            onError={(message) => showToast(message, "error")}
          />

          {/* SECTION 8 — LEAD DETAIL DRAWER */}
          <LeadDetailDrawer
            lead={selectedLead}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onViewFullPage={(id) => handleNavigate(`/lead-management/${id}`)}
            noteText={currentNoteText}
            onNoteChange={setCurrentNoteText}
            onSaveNote={handleSaveNote}
            onConvert={openConvertModal}
          />

          {/* DELETE CONFIRMATION MODAL */}
          <DeleteLeadModal
            lead={deleteModalLead}
            onClose={() => setDeleteModalLead(null)}
            onConfirm={async (leadId) => {
              await deleteLead(leadId)
              setDeleteModalLead(null)
              showToast("Lead deleted", "info")
            }}
          />

          {/* UNSAVED CHANGES WARNING MODAL */}
          <Dialog open={unsavedWarning.show} onOpenChange={(open) => !open && setUnsavedWarning({ pendingLeadId: null, show: false })}>
            <DialogContent className="max-w-sm w-[calc(100%-2rem)] sm:w-full">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <TriangleAlert size={20} className="text-amber-500" strokeWidth={1.5} />
                  </div>
                  <DialogTitle style={{ fontFamily: "'Poppins', sans-serif" }}>Unsaved Changes</DialogTitle>
                </div>
              </DialogHeader>

              <DialogDescription className="text-slate-500 leading-relaxed font-sans mb-2">
                You have unsaved changes on {leads.find((l: any) => l.id === editingLeadId)?.name}. What would you like to do?
              </DialogDescription>

              {/* BUTTONS */}
              <div className="flex flex-col gap-2 font-sans">
                <button
                  onClick={() => handleUnsavedSave(editingLeadId!)}
                  className="w-full bg-[#1565D8] text-white text-sm font-bold h-11 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition cursor-pointer"
                >
                  <Check size={16} strokeWidth={1.5} />
                  <span>Save Changes & Continue</span>
                </button>
                <button
                  onClick={handleUnsavedDiscard}
                  className="w-full border border-slate-200 bg-white text-slate-600 text-sm font-semibold h-11 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
                >
                  Discard Changes
                </button>
                <button
                  onClick={() => setUnsavedWarning({ pendingLeadId: null, show: false })}
                  className="w-full text-slate-400 text-sm font-medium text-center cursor-pointer hover:text-slate-600 py-2"
                >
                  Keep editing current record
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* CONVERT TO ADMISSION DIALOG */}
          {convertLead && (
            <ConvertToAdmissionModal
              lead={convertLead}
              isOpen={showConvertModal}
              onClose={() => {
                setShowConvertModal(false)
                setConvertLead(null)
              }}
              onSuccess={(admissionId) => {
                setShowConvertModal(false)
                setConvertLead(null)
                setDrawerOpen(false)
                showToast("Lead converted to admission!")
                fetchLeads()
              }}
            />
          )}

          {/* TOAST NOTIFICATION */}
          <div 
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 transform transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'}`}
          >
            <div className="flex items-center gap-3 bg-slate-800 text-white rounded-xl px-5 py-3 shadow-2xl min-w-[280px]">
              {toast.type === 'success' && <CheckCircle2 size={16} className="text-green-400" strokeWidth={1.5} />}
              {toast.type === 'info' && <Info size={16} className="text-blue-400" strokeWidth={1.5} />}
              {toast.type === 'error' && <XCircle size={16} className="text-red-400" strokeWidth={1.5} />}
              
              <span className="text-sm font-semibold font-sans">{toast.message}</span>
              
              <button 
                onClick={() => setToast(t => ({ ...t, show: false }))} 
                className="ml-auto text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>

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
                    router.push(`/lead-management/${openMenuId}`)
                  }}
                  className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Eye size={13} />
                  View Lead
                </button>
                <button
                  onClick={() => {
                    setOpenMenuId(null)
                    router.push(`/lead-management/${openMenuId}/edit`)
                  }}
                  className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Pencil size={13} />
                  Edit Lead
                </button>
                <div className="h-px bg-slate-100 mx-2" />
                <button
                  onClick={() => {
                    setOpenMenuId(null)
                    handleConvertLead(openMenuId)
                  }}
                  className="w-full px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 text-left flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ArrowRight size={13} />
                  Convert to Admission
                </button>
                <div className="h-px bg-slate-100 mx-2" />
                <button
                  onClick={() => {
                    setOpenMenuId(null)
                    handleDeleteLead(openMenuId)
                  }}
                  className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left flex items-center gap-2 transition-colors cursor-pointer font-medium"
                >
                  <Trash2 size={13} />
                  Delete Lead
                </button>
              </div>,
              document.body
            )
          }

    </div>
    </>
  )
}
