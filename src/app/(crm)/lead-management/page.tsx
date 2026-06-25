"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import TableSkeleton from '@/components/shared/TableSkeleton'
import {
  ClipboardList,
  Shield,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Menu,
  X,
  Eye,
  BarChart2,
  CheckCircle2,
  Plus,
  UserPlus,
  LayoutList,
  Download,
  LayoutGrid,
  CheckSquare,
  Trash2,
  Mail,
  MessageCircle,
  Phone,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ArrowRight,
  Check,
  TriangleAlert,
  Info,
  XCircle,
  ExternalLink
} from 'lucide-react'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'
import ConvertToAdmissionModal from '@/components/modals/ConvertToAdmissionModal'

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


// ===================================================================
// DATA CONSTANTS
// ===================================================================
const institutionType = 'school'

const applyingForLabel = {
  school: 'Applying For',
  institute: 'Course / Program',
  learning_center: 'Course / Program',
}

const isPremium = false

const leadsUsed = 18
const leadsMax = 25

const statusLabels: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  FOLLOW_UP_PENDING: 'Follow-up',
  CONVERTED: 'Converted',
  NOT_INTERESTED: 'Rejected'
}

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

const statusConfig = {
  NEW: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
  },
  CONTACTED: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  INTERESTED: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
    border: 'border-indigo-200',
  },
  FOLLOW_UP_PENDING: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    dot: 'bg-orange-500',
    border: 'border-orange-200',
  },
  CONVERTED: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    dot: 'bg-green-500',
    border: 'border-green-200',
  },
  NOT_INTERESTED: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
    border: 'border-red-200',
  },
}

const sourceConfig = {
  VIDHYAAN: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
  },
  WEBSITE: {
    bg: 'bg-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  },
  PHONE: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    dot: 'bg-purple-500',
  },
  WALK_IN: {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    dot: 'bg-teal-500',
  },
  WHATSAPP: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    dot: 'bg-green-500',
  },
  REFERRAL: {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    dot: 'bg-pink-500',
  },
  OTHER: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    dot: 'bg-orange-500',
  },
  EMAIL: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  },
  SOCIAL_MEDIA: {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    dot: 'bg-pink-500',
  },
  GOOGLE_ADS: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
  },
  META_ADS: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    dot: 'bg-indigo-500',
  },
  JUSTDIAL: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  CAMPAIGN: {
    bg: 'bg-violet-100',
    text: 'text-violet-800',
    dot: 'bg-violet-500',
  },
  EVENT: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    dot: 'bg-cyan-500',
  },
  NEWSPAPER: {
    bg: 'bg-stone-100',
    text: 'text-stone-800',
    dot: 'bg-stone-500',
  },
  HOARDING: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    dot: 'bg-yellow-500',
  },
  IMPORT: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
  },
}

// Grades constants are imported from @/constants/grades

const courses = [
  'Bharatanatyam', 'Hip Hop', 'Guitar - Beginner',
  'Guitar - Advanced', 'Keyboard', 'Vocals',
  'Yoga - Morning', 'Yoga - Evening', 'Zumba',
  'Karate', 'Swimming',
]

const sources = [
  { id: 'VIDHYAAN', label: 'Vidhyaan', dot: 'bg-blue-500' },
  { id: 'WEBSITE', label: 'Website', dot: 'bg-slate-400' },
  { id: 'WALK_IN', label: 'Walk-in', dot: 'bg-teal-500' },
  { id: 'PHONE', label: 'Phone', dot: 'bg-purple-500' },
  { id: 'WHATSAPP', label: 'WhatsApp', dot: 'bg-green-500' },
  { id: 'REFERRAL', label: 'Referral', dot: 'bg-pink-500' },
  { id: 'OTHER', label: 'Other', dot: 'bg-orange-500' },
]

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}


interface Lead {
  id: string
  name: string
  parentName: string
  phone: string
  email: string
  applyingFor: string
  source: string
  counsellor: string | null
  counsellorAvatar: string | null
  createdDate: string
  status: string
  avatar: string
  followUpDate?: string
}

export default function LeadManagementPage() {
  const router = useRouter()
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  // STEP 2: Remove hardcoded leads array. Replace with empty array:
  const [leads, setLeads] = useState<any[]>([])
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null)

  // STEP 3: Add state variables:
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
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

  // State for active counsellors
  const [counsellors, setCounsellors] = useState<any[]>([])

  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertLead, setConvertLead] = useState<any | null>(null)

  // Fetch counsellors, academic years, and pipeline stages on mount
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

  const openConvertModal = (lead: any) => {
    setConvertLead(lead)
    setShowConvertModal(true)
  }

  // STEP 4: Add fetchLeads function:
  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(pagination.page))
      params.set('limit', '10')
      if (filters.status)
        params.set('status', filters.status)
      if (filters.source)
        params.set('source', filters.source)
      if (filters.counsellorId)
        params.set('counsellorId', filters.counsellorId)
      if (filters.search)
        params.set('search', filters.search)
      if (filters.priority)
        params.set('priority', filters.priority)

      const res = await fetch(
        '/api/v1/leads?' + params.toString()
      )
      if (!res.ok) throw new Error(
        'Failed to fetch leads'
      )
      const json = await res.json()
      
      const mapped = (json.data ?? []).map((l: any) => ({
        id: l.id,
        leadCode: l.leadCode,
        name: l.parentName || '—',
        parentName: l.parentName || '—',
        kidName: l.kidName || '—',
        phone: l.phone || '—',
        email: l.email ?? '—',
        applyingFor: l.gradeSought ?? '—',
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

      setLeads(mapped)
      setPagination(json.pagination ?? {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      })
    } catch (err) {
      setError('Failed to load leads')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page])

  // STEP 5: Add useEffect:
  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

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
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === leadId ? { ...lead, status: newStatus } : lead
          )
        )
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
        const found = counsellors.find(c => c.name === editFormData.counsellor)
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
        l => l.id === unsavedWarning.pendingLeadId
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
        l => l.id === unsavedWarning.pendingLeadId
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
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showCounsellorDropdown, setShowCounsellorDropdown] = useState(false)
  const [showDateDropdown, setShowDateDropdown] = useState(false)

  // Custom notes state
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [currentNoteText, setCurrentNoteText] = useState('')

  // Filter calculations (now directly fetched from backend)
  const filteredLeads = leads

  // Tab count values
  const getTabCount = (statusVal: string) => {
    if (!statusVal) return pagination.total
    if (filters.status === statusVal) return pagination.total
    return leads.filter(l => l.status === statusVal).length
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
      setSelectedLeads(filteredLeads.map(l => l.id))
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
          
          {/* SECTION 1 — GREETING + BREADCRUMB ROW */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {getGreeting()}, {currentUser.firstName}
                <span className="ml-2 text-xl">👋</span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>Sales &amp; Marketing</span>
                <ChevronRight size={12} className="text-slate-300" />
                <span>Lead Management</span>
              </p>
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
                      style={{ width: `${(leadsUsed / leadsMax) * 100}%` }}
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
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 relative">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              
              {/* Row 1 (Mobile/Tablet Search, inline on Desktop) */}
              <div className="w-full lg:w-auto">
                <div className="relative flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-4 py-2 w-full lg:w-64">
                  <Search className="size-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      clearTimeout(searchTimeout.current)
                      searchTimeout.current = setTimeout(
                        () => setFilters(f => ({
                          ...f,
                          search: e.target.value
                        })),
                        300
                      )
                    }}
                    className="bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-500 w-full font-sans"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => {
                        setSearchQuery('')
                        setFilters(f => ({ ...f, search: '' }))
                      }} 
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2/3 Groupings */}
              <div className="w-full lg:w-auto flex flex-col md:flex-row md:items-center gap-3">
                {/* Mobile Row 2: Source & Status */}
                <div className="grid grid-cols-2 md:flex md:items-center gap-3 w-full md:w-auto">
                  {/* Source Dropdown */}
                  <div className="relative w-full">
                    <button
                      onClick={() => {
                        setShowSourceDropdown(!showSourceDropdown)
                        setShowStatusDropdown(false)
                        setShowCounsellorDropdown(false)
                        setShowDateDropdown(false)
                      }}
                      className="flex items-center justify-between md:justify-start gap-1.5 w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer min-h-[38px] font-sans"
                    >
                      <span className="truncate">{filters.source ? `Source: ${filters.source}` : 'Source'}</span>
                      <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                    </button>
                    {showSourceDropdown && (
                      <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 font-sans">
                        {Object.keys(sourceConfig).map(source => (
                          <button
                            key={source}
                            onClick={() => {
                              setFilters(f => ({ ...f, source: source === f.source ? '' : source }))
                              setShowSourceDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filters.source === source ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                          >
                            {source}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative w-full">
                    <button
                      onClick={() => {
                        setShowStatusDropdown(!showStatusDropdown)
                        setShowSourceDropdown(false)
                        setShowCounsellorDropdown(false)
                        setShowDateDropdown(false)
                      }}
                      className="flex items-center justify-between md:justify-start gap-1.5 w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer min-h-[38px] font-sans"
                    >
                      <span className="truncate">{filters.status ? `Status: ${statusLabels[filters.status] || filters.status}` : 'Status'}</span>
                      <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 font-sans">
                        {Object.keys(statusConfig).map(status => (
                          <button
                            key={status}
                            onClick={() => {
                              setFilters(f => ({ ...f, status: status === f.status ? '' : status }))
                              setShowStatusDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filters.status === status ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                          >
                            {statusLabels[status] || status}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Row 3: Counsellor + Date + Export + Toggle */}
                <div className="grid grid-cols-2 min-[480px]:flex min-[480px]:items-center gap-3 w-full md:w-auto">
                  {/* Counsellor Dropdown */}
                  <div className="relative w-full min-[480px]:w-auto">
                    <button
                      onClick={() => {
                        setShowCounsellorDropdown(!showCounsellorDropdown)
                        setShowSourceDropdown(false)
                        setShowStatusDropdown(false)
                        setShowDateDropdown(false)
                      }}
                      className="flex items-center justify-between min-[480px]:justify-start gap-1.5 w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer min-h-[38px] font-sans"
                    >
                      <span className="truncate">
                        {filters.counsellorId 
                          ? `Counsellor: ${counsellors.find(c => c.id === filters.counsellorId)?.name ?? 'Counsellor'}` 
                          : 'Counsellor'}
                      </span>
                      <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                    </button>
                    {showCounsellorDropdown && (
                      <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 font-sans animate-fade-in">
                        {counsellors.map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setFilters(f => ({ ...f, counsellorId: c.id === f.counsellorId ? '' : c.id }))
                              setShowCounsellorDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filters.counsellorId === c.id ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Date Dropdown */}
                  <div className="relative w-full min-[480px]:w-auto">
                    <button
                      onClick={() => {
                        setShowDateDropdown(!showDateDropdown)
                        setShowSourceDropdown(false)
                        setShowStatusDropdown(false)
                        setShowCounsellorDropdown(false)
                      }}
                      className="flex items-center justify-between min-[480px]:justify-start gap-1.5 w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer min-h-[38px] font-sans"
                    >
                      <span className="truncate">{filterDateRange ? `Date: ${filterDateRange === 'May' ? 'May' : 'Apr'}` : 'Date Range'}</span>
                      <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                    </button>
                    {showDateDropdown && (
                      <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 font-sans">
                        <button
                          onClick={() => {
                            setFilterDateRange(filterDateRange === 'May' ? null : 'May')
                            setShowDateDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filterDateRange === 'May' ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                        >
                          May 2026
                        </button>
                        <button
                          onClick={() => {
                            setFilterDateRange(filterDateRange === 'Apr' ? null : 'Apr')
                            setShowDateDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filterDateRange === 'Apr' ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                        >
                          April 2026
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Export Button */}
                  <button className="flex items-center justify-center gap-1.5 border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition min-h-[38px] cursor-pointer w-full min-[480px]:w-auto font-sans">
                    <Download className="size-3.5 text-slate-500 shrink-0" />
                    <span>Export</span>
                  </button>

                  {/* Toggle View */}
                  <div className="flex items-center justify-center bg-slate-100 rounded-lg p-1 gap-1 w-full min-[480px]:w-auto">
                    <button
                      onClick={() => setActiveView('list')}
                      className={`rounded-md p-1.5 transition-all duration-150 flex-1 min-[480px]:flex-none flex justify-center ${
                        activeView === 'list' ? 'bg-white shadow-sm' : 'bg-transparent hover:bg-slate-200'
                      }`}
                      title="List view"
                    >
                      <LayoutList
                        className={`size-4 ${
                          activeView === 'list' ? 'text-[#1565D8]' : 'text-slate-400'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => setActiveView('grid')}
                      className={`rounded-md p-1.5 transition-all duration-150 flex-1 min-[480px]:flex-none flex justify-center ${
                        activeView === 'grid' ? 'bg-white shadow-sm' : 'bg-transparent hover:bg-slate-200'
                      }`}
                      title="Grid view"
                    >
                      <LayoutGrid
                        className={`size-4 ${
                          activeView === 'grid' ? 'text-[#1565D8]' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Clear filters link */}
                {(filters.source || filters.status || filters.counsellorId || filters.search || searchQuery) && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm font-semibold text-slate-400 hover:text-red-500 cursor-pointer flex items-center justify-center gap-1 transition-colors py-2 md:py-0"
                  >
                    <X className="size-3.5" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>

            </div>
          </section>

          {/* SECTION 4 — TAB STRIP */}
          <section 
            className="border-b border-slate-200 pb-0 flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {[
              { id: '', label: 'All', badgeClass: 'bg-slate-200 text-slate-600' },
              { id: 'NEW', label: 'New', badgeClass: 'bg-blue-100 text-blue-700' },
              { id: 'CONTACTED', label: 'Contacted', badgeClass: 'bg-amber-100 text-amber-700' },
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

          {activeView === 'list' && (
            loading && leads.length === 0 ? (
              <TableSkeleton rows={5} columns={8} />
            ) : (
              /* SECTION 6 — LEADS TABLE */
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              
              {/* TABLE HEADER */}
              <div className="bg-slate-50 border-b border-slate-200 hidden md:flex items-center px-5 py-3 gap-4 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                <div className="w-8 flex-shrink-0 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={handleSelectAllLeads}
                    className="w-4 h-4 rounded border-slate-300 accent-[#1565D8] cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-[200px] ">
                  Lead Name
                </div>
                <div className="hidden md:flex w-32 flex-shrink-0 ">
                  {applyingForLabel[institutionType as keyof typeof applyingForLabel]}
                </div>
                <div className="hidden md:flex w-28 flex-shrink-0 ">
                  Source
                </div>
                <div className="hidden lg:flex w-24 flex-shrink-0 ">
                  Connect
                </div>
                <div className="hidden lg:flex w-36 flex-shrink-0 ">
                  Counsellor
                </div>
                <div className="hidden xl:flex w-28 flex-shrink-0 ">
                  Date
                </div>
                <div className="w-28 flex-shrink-0 ">
                  Status
                </div>
                <div className="w-12 flex-shrink-0  text-center">
                  Action
                </div>
              </div>

              {/* TABLE BODY */}
              <div className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center px-5 py-4 gap-4 w-full border-b border-slate-100">
                      <div className="w-8 flex-shrink-0"><Skeleton className="h-4 w-4" /></div>
                      <div className="flex-1 min-w-[200px] flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                      <div className="hidden md:flex w-32 flex-shrink-0"><Skeleton className="h-4 w-20" /></div>
                      <div className="hidden md:flex w-28 flex-shrink-0"><Skeleton className="h-6 w-16 rounded-full" /></div>
                      <div className="hidden lg:flex w-24 flex-shrink-0 gap-1.5"><Skeleton className="h-7 w-7 rounded-lg" /><Skeleton className="h-7 w-7 rounded-lg" /><Skeleton className="h-7 w-7 rounded-lg" /></div>
                      <div className="hidden lg:flex w-36 flex-shrink-0"><Skeleton className="h-8 w-24 rounded-lg" /></div>
                      <div className="hidden xl:flex w-28 flex-shrink-0"><Skeleton className="h-4 w-16" /></div>
                      <div className="w-28 flex-shrink-0"><Skeleton className="h-6 w-16 rounded-full" /></div>
                      <div className="w-12 flex-shrink-0"><Skeleton className="h-8 w-8 rounded-lg" /></div>
                    </div>
                  ))
                ) : filteredLeads.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm font-medium">No leads match the filters.</div>
                ) : (
                  filteredLeads.map((lead, idx) => {
                    const isChecked = selectedLeads.includes(lead.id)
                    const isEditing = editingLeadId === lead.id
                    const isSaved = savedLeadId === lead.id

                    if (isEditing) {
                      const todayStr = new Date().toISOString().split('T')[0]
                      return (
                        <div
                          key={lead.id}
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-4 border-b border-slate-200 border-l-4 border-l-[#1565D8] bg-blue-50/40 flex flex-col transition-all duration-200 shadow-sm"
                        >
                          {/* TOP ROW / EDIT HEADER */}
                          <div className="flex items-center gap-4 flex-wrap w-full">
                            <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <Pencil size={10} strokeWidth={1.5} />
                              <span>Editing</span>
                            </div>

                            {/* Save / Cancel buttons */}
                            <div className="flex ml-auto items-center gap-2">
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                              >
                                <X size={13} strokeWidth={1.5} />
                                <span>Cancel</span>
                              </button>
                              <button
                                onClick={() => saveEdit(lead.id)}
                                className="flex items-center gap-1.5 bg-[#1565D8] text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                              >
                                <Check size={13} strokeWidth={1.5} />
                                <span>Save</span>
                              </button>
                            </div>
                          </div>

                          {/* FIELDS GRID */}
                          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 mt-3 w-full font-sans">
                            {/* 1. Lead Name */}
                            <div className="lg:col-span-1 min-w-0">
                              <input
                                type="text"
                                placeholder="Lead name"
                                value={editFormData.name || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 min-w-0"
                              />
                            </div>

                            {/* 2. Parent Name (school only) */}
                            {institutionType === 'school' && (
                              <div className="lg:col-span-1 min-w-0">
                                <input
                                  type="text"
                                  placeholder="Parent name"
                                  value={editFormData.parentName || ''}
                                  onChange={(e) => setEditFormData({ ...editFormData, parentName: e.target.value })}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 min-w-0"
                                />
                              </div>
                            )}

                            {/* 3. Applying For */}
                            <div className="lg:col-span-1 min-w-0">
                              <select
                                value={editFormData.applyingFor || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, applyingFor: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none cursor-pointer min-w-0"
                              >
                                <option value="">Select option</option>
                                {institutionType === 'school' ? (
                                  GRADE_OPTIONS.map(g => (
                                    <option key={g.value} value={g.value}>
                                      {g.label}
                                    </option>
                                  ))
                                ) : (
                                  courses.map(opt => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>

                            {/* 4. Source */}
                            <div className="lg:col-span-1 min-w-0">
                              <select
                                value={editFormData.source || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none cursor-pointer min-w-0"
                              >
                                <option value="">Select source</option>
                                {sources.map(src => (
                                  <option key={src.id} value={src.id}>
                                    • {src.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* 5. Counsellor */}
                            <div className="lg:col-span-1 min-w-0">
                              <select
                                value={editFormData.counsellor || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, counsellor: e.target.value || '' })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none cursor-pointer min-w-0"
                              >
                                <option value="">Unassigned</option>
                                {counsellors.map(c => (
                                  <option key={c.id} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* 6. Status */}
                            <div className="lg:col-span-1 min-w-0">
                              <select
                                value={editFormData.status || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none cursor-pointer min-w-0 border-l-4 ${
                                  editFormData.status === 'NEW' ? 'border-l-blue-500' :
                                  editFormData.status === 'CONTACTED' ? 'border-l-amber-500' :
                                  editFormData.status === 'FOLLOW_UP_PENDING' ? 'border-l-orange-500' :
                                  editFormData.status === 'CONVERTED' ? 'border-l-green-500' :
                                  editFormData.status === 'NOT_INTERESTED' ? 'border-l-red-500' : 'border-l-slate-200'
                                }`}
                              >
                                {['NEW', 'CONTACTED', 'FOLLOW_UP_PENDING', 'CONVERTED', 'NOT_INTERESTED'].map(st => (
                                  <option key={st} value={st}>
                                    {statusLabels[st] || st}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* 7. Follow-up Date */}
                            <div className="lg:col-span-1 min-w-0">
                              <input
                                type="date"
                                min={todayStr}
                                value={editFormData.followUpDate || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, followUpDate: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 min-w-0 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    }

                    // VIEW MODE ROW
                    return (
                      <div
                        key={lead.id}
                        className={`relative flex flex-col border-b border-slate-100 last:border-0 transition-all duration-200 cursor-pointer ${idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'} ${isSaved ? 'bg-green-50/40' : 'hover:bg-blue-50'}`}
                        onClick={() => {
                          if (editingLeadId) return
                          handleOpenLeadDetails(lead)
                        }}
                      >
                        {/* MOBILE VIEW */}
                        <div className="flex md:hidden items-center justify-between gap-3 w-full py-3.5 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full flex-shrink-0 bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center font-sans">
                              {lead.avatar}
                            </div>
                            {/* Text block */}
                            <div className="min-w-0">
                              <Link
                                href={`/lead-management/${lead.id}`}
                                className="text-sm font-semibold text-slate-800 hover:text-[#1565D8] hover:underline cursor-pointer truncate font-sans block"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleNavigate(`/lead-management/${lead.id}`)
                                }}
                              >
                                {lead.name}
                              </Link>
                              <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mt-1">
                                <span>{institutionType === 'school' ? getGradeLabel(lead.applyingFor) : lead.applyingFor}</span>
                                <span>·</span>
                                <span className="font-mono text-slate-500">{lead.leadCode}</span>
                                <span>·</span>
                                <span>{lead.source}</span>
                                <span>·</span>
                                <span>{lead.createdDate}</span>
                                <span>·</span>
                                <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConfig[lead.status as keyof typeof statusConfig]?.bg} ${statusConfig[lead.status as keyof typeof statusConfig]?.text}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[lead.status as keyof typeof statusConfig]?.dot}`} />
                                  <span>{statusLabels[lead.status] || lead.status}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action menu */}
                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <button 
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-slate-100 transition duration-150 cursor-pointer text-slate-400 focus:outline-none"
                                >
                                  <MoreVertical size={18} strokeWidth={1.5} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end"
                                className="w-56 min-w-[224px] rounded-xl border border-slate-200 shadow-lg p-1.5"
                              >
                                <DropdownMenuItem onClick={() => handleNavigate(`/lead-management/${lead.id}`)}>
                                  <Eye size={14} className="mr-2 text-slate-400" strokeWidth={1.5} />
                                  View Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => startEdit(lead)}>
                                  <Pencil size={14} className="mr-2 text-slate-400" strokeWidth={1.5} />
                                  <span>Edit Lead</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => startEdit(lead)}>
                                  <UserPlus size={14} className="mr-2 text-slate-400" strokeWidth={1.5} />
                                  <span>Assign Counsellor</span>
                                </DropdownMenuItem>
                                {institutionType === 'school' && (
                                  <DropdownMenuItem 
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#1565D8] hover:bg-blue-50 cursor-pointer whitespace-nowrap"
                                    onClick={() => openConvertModal(lead)}
                                  >
                                    <ArrowRight size={14} className="text-[#1565D8] flex-shrink-0" strokeWidth={1.5} />
                                    Convert to Admission
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => markNotInterested(lead.id)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                                  <XCircle size={14} className="text-slate-400" />
                                  <span>Mark Not Interested</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500 hover:bg-red-50" onClick={() => setDeleteModalLead(lead)}>
                                  <Trash2 size={14} className="mr-2 text-red-500" strokeWidth={1.5} />
                                  <span>Delete Lead</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* DESKTOP / TABLET VIEW */}
                        <div className="hidden md:flex items-center px-5 py-4 gap-4 w-full">
                          {/* Checkbox */}
                          <div className="w-8 flex-shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleSelectLead(lead.id)
                              }}
                              className="w-4 h-4 rounded border-slate-300 accent-[#1565D8] cursor-pointer"
                            />
                          </div>

                          {/* Lead Avatar + Name */}
                          <div className="flex-1 min-w-[200px] flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex-shrink-0 bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center font-sans">
                              {lead.avatar}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/lead-management/${lead.id}`}
                                className="text-sm font-semibold text-slate-800 hover:text-[#1565D8] hover:underline cursor-pointer truncate font-sans block"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleNavigate(`/lead-management/${lead.id}`)
                                }}
                              >
                                {lead.name}
                              </Link>
                              <p className="text-xs text-slate-400 mt-0.5 truncate font-sans flex items-center gap-1.5">
                                <span className="font-mono font-semibold bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded">{lead.leadCode}</span>
                                <span>Parent: {lead.parentName}</span>
                              </p>
                              {/* Date sub-text for mobile/tablet (hidden on xl+) */}
                              <p className="xl:hidden text-[10px] text-slate-400 mt-0.5">
                                <span className="hidden xl:inline">
                                  {lead.createdDate}
                                </span>
                                <span className="inline xl:hidden">
                                  {lead.createdDate.slice(0, 6)}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Grade / Course */}
                          <div className="w-32 flex-shrink-0 text-sm font-semibold text-slate-700">
                            {institutionType === 'school' ? (lead.applyingFor ? getGradeLabel(lead.applyingFor) : '—') : (lead.applyingFor || '—')}
                          </div>

                          {/* Source */}
                          <div className="hidden md:flex w-28 flex-shrink-0 items-center">
                            <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit font-sans ${sourceConfig[lead.source as keyof typeof sourceConfig]?.bg || 'bg-slate-100'} ${sourceConfig[lead.source as keyof typeof sourceConfig]?.text || 'text-slate-600'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${sourceConfig[lead.source as keyof typeof sourceConfig]?.dot || 'bg-slate-400'}`} />
                              <span>{lead.source}</span>
                            </div>
                          </div>

                          {/* Connect */}
                          <div className="hidden lg:flex w-24 flex-shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                showToast(`Email initiated for ${lead.name}`)
                              }}
                              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition"
                            >
                              <Mail size={13} className="text-slate-400" strokeWidth={1.5} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                showToast(`WhatsApp opened for ${lead.name}`)
                                window.open(
                                  `https://wa.me/91${lead.phone}`,
                                  '_blank'
                                )
                              }}
                              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition"
                            >
                              <MessageCircle size={13} className="text-slate-400" strokeWidth={1.5} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                showToast(`Call initiated for ${lead.name}`)
                                window.open(`tel:${lead.phone}`)
                              }}
                              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition"
                            >
                              <Phone size={13} className="text-slate-400" strokeWidth={1.5} />
                            </button>
                          </div>

                          {/* Counsellor */}
                          <div
                            className="hidden lg:flex w-36 flex-shrink-0 relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.counsellor ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setStatusDropdownId(null)
                                  setCounsellorDropdownId(
                                    counsellorDropdownId === lead.id ? null : lead.id
                                  )
                                }}
                                className="flex items-center gap-2 hover:opacity-80 cursor-pointer group"
                              >
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                  {lead.counsellorAvatar || lead.counsellor.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-slate-700 truncate">{lead.counsellor}</span>
                                <Pencil size={11} className="text-slate-300 group-hover:text-slate-400 flex-shrink-0 ml-0.5" strokeWidth={1.5} />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setStatusDropdownId(null)
                                  setCounsellorDropdownId(
                                    counsellorDropdownId === lead.id ? null : lead.id
                                  )
                                }}
                                className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-100 cursor-pointer"
                              >
                                <UserPlus size={12} className="text-amber-600" strokeWidth={1.5} />
                                <span>Select</span>
                              </button>
                            )}

                            {/* Counsellor dropdown */}
                            {counsellorDropdownId === lead.id && (
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
                                  {counsellors.map(c => (
                                    <button
                                      key={c.id}
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        await assignCounsellor(lead.id, c.id)
                                        setCounsellorDropdownId(null)
                                        showToast(`Assigned to ${c.name}`)
                                      }}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                                        lead.counsellorId === c.id
                                          ? 'bg-blue-50 text-blue-700 font-semibold'
                                          : 'text-slate-600 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                        {c.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                                      </div>
                                      <span className="flex-1 text-left">{c.name}</span>
                                      {lead.counsellorId === c.id && (
                                        <Check size={13} className="text-blue-500" strokeWidth={2} />
                                      )}
                                    </button>
                                  ))}
                                  {lead.counsellorId && (
                                    <div className="border-t border-slate-50 mt-1 pt-1">
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          await assignCounsellor(lead.id, null)
                                          setCounsellorDropdownId(null)
                                          showToast('Counsellor removed')
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

                          {/* Date */}
                          <div className="hidden xl:flex w-28 flex-shrink-0 items-center text-sm text-slate-500 font-medium font-sans truncate">
                            {lead.createdDate}
                          </div>

                          {/* Status — inline clickable dropdown */}
                          <div
                            className="w-28 flex-shrink-0 relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                             <button
                              disabled={updatingLeadId === lead.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                setCounsellorDropdownId(null)
                                setStatusDropdownId(
                                  statusDropdownId === lead.id ? null : lead.id
                                )
                              }}
                              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-150 hover:opacity-80 hover:shadow-sm font-sans ${
                                statusConfig[lead.status as keyof typeof statusConfig]?.bg
                              } ${
                                statusConfig[lead.status as keyof typeof statusConfig]?.text
                              } ${
                                statusConfig[lead.status as keyof typeof statusConfig]?.border || 'border-transparent'
                              }`}
                            >
                              {updatingLeadId === lead.id ? (
                                <>
                                  <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConfig[lead.status as keyof typeof statusConfig]?.dot}`} />
                                  {statusLabels[lead.status] || lead.status}
                                  <ChevronDown size={10} className="ml-0.5 opacity-60" strokeWidth={2} />
                                </>
                              )}
                            </button>

                            {/* Status dropdown */}
                            {statusDropdownId === lead.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setStatusDropdownId(null)
                                  }}
                                />
                                <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px]">
                                  {(['NEW', 'CONTACTED', 'FOLLOW_UP_PENDING', 'CONVERTED', 'NOT_INTERESTED'] as const).map((status) => (
                                    <button
                                      key={status}
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        await updateStatus(lead.id, status)
                                        setStatusDropdownId(null)
                                        showToast(`Status updated to ${statusLabels[status]}`)
                                      }}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                                        lead.status === status
                                          ? `${statusConfig[status].bg} ${statusConfig[status].text} font-semibold`
                                          : 'text-slate-600 hover:bg-slate-50'
                                      }`}
                                    >
                                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig[status].dot}`} />
                                      {statusLabels[status]}
                                      {lead.status === status && (
                                        <Check size={13} className="ml-auto" strokeWidth={2} />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Action Menu (3-dot menu for all desktop / tablet sizes) */}
                          <div className="w-12 flex-shrink-0 flex items-center justify-center font-sans" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <button 
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none cursor-pointer"
                                >
                                  <MoreVertical size={16} strokeWidth={1.5} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end"
                                className="w-56 min-w-[224px] rounded-xl border border-slate-200 shadow-lg p-1.5"
                              >
                                <DropdownMenuItem onClick={() => handleNavigate(`/lead-management/${lead.id}`)}>
                                  <Eye size={14} className="mr-2 text-slate-400" strokeWidth={1.5} />
                                  View Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => startEdit(lead)}>
                                  <Pencil size={14} className="mr-2 text-slate-400" strokeWidth={1.5} />
                                  <span>Edit Lead</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => startEdit(lead)}>
                                  <UserPlus size={14} className="mr-2 text-slate-400" strokeWidth={1.5} />
                                  <span>Assign Counsellor</span>
                                </DropdownMenuItem>
                                {institutionType === 'school' && (
                                  <DropdownMenuItem 
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#1565D8] hover:bg-blue-50 cursor-pointer whitespace-nowrap"
                                    onClick={() => openConvertModal(lead)}
                                  >
                                    <ArrowRight size={14} className="text-[#1565D8] flex-shrink-0" strokeWidth={1.5} />
                                    Convert to Admission
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => markNotInterested(lead.id)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                                  <XCircle size={14} className="text-slate-400" />
                                  <span>Mark Not Interested</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500 hover:bg-red-50" onClick={() => setDeleteModalLead(lead)}>
                                  <Trash2 size={14} className="mr-2 text-red-500" strokeWidth={1.5} />
                                  <span>Delete Lead</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {/* Success Flash */}
                        {isSaved && (
                          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-4 py-2 mx-5 my-2 animate-fade-in w-fit">
                            <CheckCircle2 size={16} className="text-green-500" strokeWidth={1.5} />
                            <span className="text-sm font-semibold text-green-700">Changes saved successfully</span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </section>
            )
          )}

          {activeView === 'grid' && filteredLeads.length > 0 && (
            
            /* GRID VIEW */
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeads.map(lead => (
                <Card
                  key={lead.id}
                  onClick={() => handleNavigate(`/lead-management/${lead.id}`)}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[220px]"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          {lead.avatar}
                        </div>
                        <div>
                          <Link
                            href={`/lead-management/${lead.id}`}
                            className="text-sm font-semibold text-[#1565D8] hover:underline truncate max-w-[150px] block"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleNavigate(`/lead-management/${lead.id}`)
                            }}
                          >
                            {lead.name}
                          </Link>
                          <span className="text-xs text-slate-400 block mt-0.5">Parent: {lead.parentName}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{lead.leadCode}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConfig[lead.status as keyof typeof statusConfig]?.bg} ${statusConfig[lead.status as keyof typeof statusConfig]?.text}`}>
                        <span>{statusLabels[lead.status] || lead.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold">Applying For</span>
                        <span className="text-slate-700 font-medium">{institutionType === 'school' ? getGradeLabel(lead.applyingFor) : lead.applyingFor}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Source</span>
                        <span className="text-slate-700 font-medium">{lead.source}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block font-semibold">Counsellor</span>
                        <span className="text-slate-700 font-medium">{lead.counsellor || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-4">
                    <span className="text-xs text-slate-400 font-medium">{lead.createdDate}</span>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          showToast(`Email initiated for ${lead.name}`)
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                      >
                        <Mail className="size-3.5 text-slate-400" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          showToast(`WhatsApp opened for ${lead.name}`)
                          window.open(
                            `https://wa.me/91${lead.phone}`,
                            '_blank'
                          )
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                      >
                        <MessageCircle className="size-3.5 text-green-500" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          showToast(`Call initiated for ${lead.name}`)
                          window.open(`tel:${lead.phone}`)
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                      >
                        <Phone className="size-3.5 text-blue-500" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </section>
          )}

          {/* SECTION 7 — PAGINATION */}
          {filteredLeads.length > 0 && (
            <section className="bg-white border border-slate-200 shadow-sm rounded-xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-500 font-medium">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} leads
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  className={`flex items-center gap-1.5 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium transition ${
                    pagination.page <= 1
                      ? 'text-slate-400 opacity-50 cursor-not-allowed'
                      : 'text-slate-600 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="size-4" />
                  <span>Prev</span>
                </button>
                
                {pagination.totalPages <= 5 ? (
                  Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => {
                    const isCurrent = p === pagination.page
                    return (
                      <button
                        key={p}
                        onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                          isCurrent 
                            ? 'bg-[#1565D8] text-white' 
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })
                ) : (
                  Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => {
                    if (
                      p === 1 || 
                      p === pagination.totalPages || 
                      Math.abs(p - pagination.page) <= 1
                    ) {
                      const isCurrent = p === pagination.page
                      return (
                        <button
                          key={p}
                          onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                          className={`w-9 h-9 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                            isCurrent 
                              ? 'bg-[#1565D8] text-white' 
                              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    }
                    
                    if (
                      (p === 2 && pagination.page > 3) || 
                      (p === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
                    ) {
                      return (
                        <span key={p} className="text-slate-400 px-1 font-bold">...</span>
                      )
                    }
                    
                    return null
                  })
                )}

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  className={`flex items-center gap-1.5 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium transition ${
                    pagination.page >= pagination.totalPages
                      ? 'text-slate-400 opacity-50 cursor-not-allowed'
                      : 'text-slate-600 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </section>
          )}

          {/* SECTION 5 — BULK ACTION BAR */}
          {selectedLeads.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-2xl px-6 py-3 shadow-2xl flex items-center gap-4 z-50 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckSquare className="size-4 text-blue-400" />
                <span className="text-sm font-semibold">{selectedLeads.length} leads selected</span>
              </div>
              <div className="w-px h-5 bg-slate-600" />
              
              <div className="flex items-center gap-4 text-sm font-medium">
                <button className="hover:text-blue-300 cursor-pointer transition">Assign Counsellor</button>
                <button className="hover:text-blue-300 cursor-pointer transition">Change Status</button>
                <button className="hover:text-blue-300 cursor-pointer transition">Export Selected</button>
              </div>
              <div className="w-px h-5 bg-slate-600" />

              <button className="flex items-center gap-1 text-red-400 hover:text-red-300 transition cursor-pointer text-sm font-medium">
                <Trash2 className="size-4" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setSelectedLeads([])}
                className="ml-2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* SECTION 8 — LEAD DETAIL DRAWER */}
          {drawerOpen && selectedLead && (
            <>
              {/* Drawer backdrop */}
              <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDrawerOpen(false)} />
              
              {/* Sliding drawer panel */}
              <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transform transition-transform duration-300 translate-x-0">
                
                {/* DRAWER HEADER */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 transition flex items-center justify-center cursor-pointer"
                    >
                      <ChevronLeft className="size-[18px] text-slate-500" />
                    </button>
                    <div>
                      <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {selectedLead.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(institutionType === 'school' ? getGradeLabel(selectedLead.applyingFor) : selectedLead.applyingFor)} · {selectedLead.source}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Lead ID
                        </span>
                        <span className="text-xs font-bold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                          {selectedLead.leadCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNavigate(`/lead-management/${selectedLead?.id}`)}
                      className="flex items-center gap-1.5 border border-[#1565D8] bg-blue-50 text-[#1565D8] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                    >
                      <ExternalLink size={13} strokeWidth={1.5} className="flex-shrink-0" />
                      View Full Page
                    </button>
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition cursor-pointer">
                      <Pencil className="size-3.5 text-slate-500" />
                    </button>
                    <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition cursor-pointer">
                      <MoreVertical className="size-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* DRAWER BODY */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  
                  {/* CONTACT SECTION */}
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                      CONTACT
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
                          <Phone className="size-3.5 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{selectedLead.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-50 rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
                          <Mail className="size-3.5 text-slate-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{selectedLead.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-green-50 rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
                          <MessageCircle className="size-3.5 text-green-500" />
                        </div>
                        <a
                          href={`https://wa.me/${selectedLead.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-green-600 hover:underline cursor-pointer"
                        >
                          Send WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 my-5" />

                  {/* LEAD DETAILS SECTION */}
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                      LEAD DETAILS
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Source</span>
                        <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${sourceConfig[selectedLead.source as keyof typeof sourceConfig]?.bg || 'bg-slate-100'} ${sourceConfig[selectedLead.source as keyof typeof sourceConfig]?.text || 'text-slate-600'}`}>
                          <span>{selectedLead.source}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                          {applyingForLabel[institutionType as keyof typeof applyingForLabel]}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">{institutionType === 'school' ? getGradeLabel(selectedLead.applyingFor) : selectedLead.applyingFor}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Counsellor</span>
                        <span className="text-sm font-semibold text-slate-700">{selectedLead.counsellor || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Created</span>
                        <span className="text-sm font-semibold text-slate-700">{selectedLead.createdDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Status</span>
                        <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ${statusConfig[selectedLead.status as keyof typeof statusConfig]?.bg} ${statusConfig[selectedLead.status as keyof typeof statusConfig]?.text}`}>
                          <span>{statusLabels[selectedLead.status] || selectedLead.status}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Lead ID</span>
                        <span className="text-sm font-semibold text-slate-400">{selectedLead.leadCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 my-5" />

                  {/* ACTIVITY TIMELINE */}
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                      ACTIVITY TIMELINE
                    </h5>
                    <div className="space-y-0">
                      {[
                        { title: `Lead created from ${selectedLead.source}`, date: selectedLead.createdDate },
                        { title: 'Contacted via phone', date: '19 May 2026' },
                        { title: `Status changed to ${selectedLead.status}`, date: '20 May 2026' }
                      ].map((item, idx, arr) => (
                        <div key={idx} className="flex gap-3 pb-4 relative">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1565D8] flex-shrink-0 mt-1.5" />
                            {idx < arr.length - 1 && (
                              <div className="w-px flex-grow bg-slate-100 mt-1" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 leading-tight">{item.title}</p>
                            <span className="text-xs text-slate-400 mt-0.5 block">{item.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 my-5" />

                  {/* ADD NOTE SECTION */}
                  <div>
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                      ADD NOTE
                    </h5>
                    <textarea
                      placeholder="Type a note about this lead..."
                      value={currentNoteText}
                      onChange={(e) => setCurrentNoteText(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:border-[#1565D8] focus:ring-1 focus:ring-[#1565D8]"
                    />
                    <Button
                      onClick={handleSaveNote}
                      className="mt-2 bg-slate-800 text-white text-sm font-semibold px-4 py-2 h-auto rounded-lg hover:bg-slate-700 transition"
                    >
                      Save Note
                    </Button>
                  </div>
                </div>

                {/* DRAWER FOOTER */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                  {institutionType === 'school' ? (
                    <Button 
                      onClick={() => openConvertModal(selectedLead)}
                      className="w-full bg-[#1565D8] text-white text-sm font-bold py-3 h-auto rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                    >
                      <span>Convert to Admission</span>
                      <ArrowRight className="size-4" strokeWidth={2.5} />
                    </Button>
                  ) : (
                    <Button className="w-full bg-green-600 text-white text-sm font-bold py-3 h-auto rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition">
                      <span>Mark as Enrolled</span>
                      <ArrowRight className="size-4" strokeWidth={2.5} />
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* DELETE CONFIRMATION MODAL */}
          <Dialog open={deleteModalLead !== null} onOpenChange={(open) => !open && setDeleteModalLead(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={22} className="text-red-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <DialogTitle style={{ fontFamily: "'Poppins', sans-serif" }}>Delete Lead?</DialogTitle>
                    <DialogDescription className="mt-0.5">This action cannot be undone.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {deleteModalLead && (
                <>
                  {/* LEAD INFO BOX */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center font-sans">
                      {deleteModalLead.avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 font-sans">{deleteModalLead.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-sans">
                        {(institutionType === 'school' ? getGradeLabel(deleteModalLead.applyingFor) : deleteModalLead.applyingFor)} · {deleteModalLead.id}
                      </p>
                    </div>
                  </div>

                  {/* WARNING TEXT */}
                  <div className="text-xs text-slate-500 leading-relaxed font-sans mb-1">
                    Deleting {deleteModalLead.name} will permanently remove:
                    <ul className="mt-2 space-y-1">
                      <li className="flex items-center gap-2 text-xs text-slate-500">
                        <X size={12} className="text-red-400" strokeWidth={1.5} />
                        <span>The lead record and all details</span>
                      </li>
                      <li className="flex items-center gap-2 text-xs text-slate-500">
                        <X size={12} className="text-red-400" strokeWidth={1.5} />
                        <span>All activity history and notes</span>
                      </li>
                      <li className="flex items-center gap-2 text-xs text-slate-500">
                        <X size={12} className="text-red-400" strokeWidth={1.5} />
                        <span>Associated follow-up reminders</span>
                      </li>
                    </ul>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteModalLead(null)}
                      className="flex-1 border border-slate-200 bg-white text-slate-600 text-sm font-semibold h-11 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center justify-center font-sans"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await deleteLead(deleteModalLead.id)
                        setDeleteModalLead(null)
                        showToast("Lead deleted", "info")
                      }}
                      className="flex-1 bg-red-500 text-white text-sm font-bold h-11 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition cursor-pointer font-sans"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                      <span>Delete Lead</span>
                    </button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* UNSAVED CHANGES WARNING MODAL */}
          <Dialog open={unsavedWarning.show} onOpenChange={(open) => !open && setUnsavedWarning({ pendingLeadId: null, show: false })}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <TriangleAlert size={20} className="text-amber-500" strokeWidth={1.5} />
                  </div>
                  <DialogTitle style={{ fontFamily: "'Poppins', sans-serif" }}>Unsaved Changes</DialogTitle>
                </div>
              </DialogHeader>

              <DialogDescription className="text-slate-500 leading-relaxed font-sans mb-2">
                You have unsaved changes on {leads.find(l => l.id === editingLeadId)?.name}. What would you like to do?
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


    </div>
    </>
  )
}
