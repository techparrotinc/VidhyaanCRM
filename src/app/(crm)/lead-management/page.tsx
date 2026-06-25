"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import LoadingScreen from '@/components/LoadingScreen'
import { Skeleton } from '@/components/ui/skeleton'
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
  ExternalLink,
  Clock
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

const priorityConfig: Record<string, { bg: string, text: string }> = {
  HIGH: { bg: 'bg-red-50 border-red-200 text-red-700', text: 'HIGH' },
  URGENT: { bg: 'bg-red-100 border-red-300 text-red-800 font-bold', text: 'URGENT' },
  MEDIUM: { bg: 'bg-amber-50 border-amber-200 text-amber-700', text: 'MEDIUM' },
  LOW: { bg: 'bg-slate-100 border-slate-200 text-slate-600', text: 'LOW' }
}

const getFollowUpStatus = (dateStr?: string) => {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  
  if (d.getTime() < today.getTime()) {
    return 'OVERDUE'
  } else if (d.getTime() === today.getTime()) {
    return 'TODAY'
  }
  return 'FUTURE'
}

const formatFollowUpDate = (dateStr?: string) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

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

const getPriorityBadgeStyle = (priority: string) => {
  const p = (priority || 'MEDIUM').toUpperCase()
  const config = priorityConfig[p] || priorityConfig.MEDIUM
  return config.bg
}

const getFollowUpInfo = (dateStr: string) => {
  if (!dateStr) return { text: '—', className: 'text-slate-400 italic', isOverdue: false }
  const status = getFollowUpStatus(dateStr)
  const formatted = formatFollowUpDate(dateStr)
  if (status === 'OVERDUE') {
    return { text: formatted, className: 'text-red-600 font-semibold', isOverdue: true }
  } else if (status === 'TODAY') {
    return { text: 'Today', className: 'text-amber-600 font-semibold', isOverdue: false }
  }
  return { text: formatted, className: 'text-slate-700 font-medium', isOverdue: false }
}

export default function LeadManagementPage() {
  const router = useRouter()
  const [navigating, setNavigating] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

  const handleNavigate = (path: string) => {
    setNavigating(true)
    setTimeout(() => {
      router.push(path)
    }, 100)
  }

  const [leads, setLeads] = useState<any[]>([])
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null)

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

  const [counsellors, setCounsellors] = useState<any[]>([])

  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertLead, setConvertLead] = useState<any | null>(null)

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
        name: l.parentName,
        parentName: l.parentName,
        kidName: l.kidName,
        phone: l.phone,
        email: l.email ?? '',
        applyingFor: l.gradeSought ?? '',
        source: l.source,
        counsellor: l.assignedTo?.name ?? null,
        counsellorId: l.assignedToId ?? null,
        counsellorAvatar: l.assignedTo?.name 
          ? l.assignedTo.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() 
          : null,
        createdDate: formatDate(l.createdAt),
        status: l.status,
        priority: l.priority,
        avatar: l.parentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
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

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const [showLeadBanner, setShowLeadBanner] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  const [editingLeadId, setEditingLeadId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<EditLeadFormData>({})
  const [deleteModalLead, setDeleteModalLead] = useState<any | null>(null)
  const [unsavedWarning, setUnsavedWarning] = useState<{
    pendingLeadId: string | null
    show: boolean
  }>({ pendingLeadId: null, show: false })
  const [savedLeadId, setSavedLeadId] = useState<string | null>(null)
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null)
  const [counsellorDropdownId, setCounsellorDropdownId] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    show: boolean
  }>({ message: '', type: 'success', show: false })

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

  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showCounsellorDropdown, setShowCounsellorDropdown] = useState(false)
  const [showDateDropdown, setShowDateDropdown] = useState(false)

  const [notes, setNotes] = useState<Record<string, string>>({})
  const [currentNoteText, setCurrentNoteText] = useState('')

  const filteredLeads = leads

  const getTabCount = (statusVal: string) => {
    if (!statusVal) return pagination.total
    if (filters.status === statusVal) return pagination.total
    return leads.filter(l => l.status === statusVal).length
  }

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

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
    )
  }

  const handleSelectAllLeads = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id))
    }
  }

  const handleOpenLeadDetails = (lead: any) => {
    setSelectedLead(lead)
    setCurrentNoteText(notes[lead.id] || '')
    setDrawerOpen(true)
  }

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
      {navigating && <LoadingScreen />}
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-5 lg:space-y-6 max-w-7xl mx-auto w-full select-none text-slate-900">
          
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

              <div className="w-full lg:w-auto flex flex-col md:flex-row md:items-center gap-3">
                <div className="grid grid-cols-2 md:flex md:items-center gap-3 w-full md:w-auto">
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

                <div className="grid grid-cols-2 min-[480px]:flex min-[480px]:items-center gap-3 w-full md:w-auto">
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

                  <button className="flex items-center justify-center gap-1.5 border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition min-h-[38px] cursor-pointer w-full min-[480px]:w-auto font-sans">
                    <Download className="size-3.5 text-slate-500 shrink-0" />
                    <span>Export</span>
                  </button>

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

          {filteredLeads.length === 0 && (
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
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 hidden md:flex items-center px-5 py-3 gap-4 text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                <div className="w-8 flex-shrink-0 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={handleSelectAllLeads}
                    className="w-4 h-4 rounded border-slate-300 accent-[#1565D8] cursor-pointer"
                  />
                </div>
                <div className="flex-1">Lead</div>
                <div className="w-[160px]">Details</div>
                <div className="w-[120px] text-center">Status</div>
                <div className="w-[90px] text-center">Priority</div>
                <div className="w-[140px]">Counsellor</div>
                <div className="w-[120px]">Follow Up</div>
                <div className="w-[80px] text-center ml-auto">Action</div>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center px-5 py-4 gap-4 w-full border-b border-slate-100">
                      <div className="w-8 flex-shrink-0"><Skeleton className="h-4 w-4" /></div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="w-[160px] flex flex-col gap-1.5">
                        <Skeleton className="h-4 w-16 rounded" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="w-[120px] flex justify-center"><Skeleton className="h-6 w-20 rounded-full" /></div>
                      <div className="w-[90px] flex justify-center"><Skeleton className="h-5 w-14 rounded-full" /></div>
                      <div className="w-[140px] flex items-center gap-2"><Skeleton className="w-6 h-6 rounded-full" /><Skeleton className="h-4 w-20" /></div>
                      <div className="w-[120px]"><Skeleton className="h-4 w-16" /></div>
                      <div className="w-[80px] flex justify-center ml-auto"><Skeleton className="h-8 w-8 rounded-lg" /></div>
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
                        <div key={lead.id} className="px-4 py-4 border-b border-slate-200 border-l-4 border-l-[#1565D8] bg-blue-50/40">
                          <div className="flex items-center gap-2">
                             <input type="text" value={editFormData.name || ''} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="bg-transparent border-b border-blue-200 focus:outline-none text-sm font-semibold w-full" />
                             <button onClick={() => saveEdit(lead.id)} className="bg-[#1565D8] text-white text-xs px-3 py-1.5 rounded">Save</button>
                             <button onClick={cancelEdit} className="border border-slate-300 text-xs px-3 py-1.5 rounded">Cancel</button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={lead.id} className={`relative flex flex-col border-b border-slate-100 last:border-0 hover:bg-slate-50 transition ${isSaved ? 'bg-green-50/40' : ''}`} onClick={() => !editingLeadId && handleOpenLeadDetails(lead)}>
                        <div className="hidden md:flex items-center px-5 py-4 gap-4 w-full cursor-pointer min-h-[56px]">
                          <div className="w-8 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={isChecked} onChange={() => handleSelectLead(lead.id)} className="accent-[#1565D8]" />
                          </div>
                          
                          {/* Column 1: LEAD (Lead Code + Name, Phone + Email) */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-900 font-semibold text-sm">{lead.kidName || lead.parentName}</span>
                              <span className="text-xs text-slate-500 font-mono">#{lead.leadCode}</span>
                            </div>
                            <div className="text-xs text-slate-600">
                              <span>{lead.phone}</span>
                              {lead.email && <span className="text-slate-500"> • {lead.email}</span>}
                            </div>
                          </div>

                          {/* Column 2: DETAILS (Grade, Source) */}
                          <div className="w-[160px] flex-shrink-0 flex flex-col gap-1 items-start">
                            {lead.applyingFor ? (
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                                {getGradeLabel(lead.applyingFor)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            )}
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{lead.source}</span>
                          </div>

                          {/* Column 3: STATUS */}
                          <div className="w-[120px] flex-shrink-0 flex justify-center" onClick={(e) => e.stopPropagation()}>
                            <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusConfig[lead.status as keyof typeof statusConfig]?.bg} ${statusConfig[lead.status as keyof typeof statusConfig]?.text}`}>
                              {statusLabels[lead.status] || lead.status}
                            </div>
                          </div>

                          {/* Column 4: PRIORITY */}
                          <div className="w-[90px] flex-shrink-0 flex justify-center">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getPriorityBadgeStyle(lead.priority)}`}>
                              {lead.priority || 'MEDIUM'}
                            </span>
                          </div>

                          {/* Column 5: COUNSELLOR */}
                          <div className="w-[140px] flex-shrink-0 flex items-center gap-2">
                            {lead.counsellor ? (
                              <>
                                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 border border-blue-100">
                                  {lead.counsellorAvatar}
                                </div>
                                <span className="text-xs text-slate-700 truncate font-sans font-medium">
                                  {lead.counsellor}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Unassigned</span>
                            )}
                          </div>

                          {/* Column 6: FOLLOW UP */}
                          {(() => {
                            const { text, className, isOverdue } = getFollowUpInfo(lead.followUpDate)
                            return (
                              <div className={`w-[120px] flex-shrink-0 text-xs ${className} flex items-center gap-1`}>
                                {isOverdue && <Clock size={12} className="text-red-500" />}
                                <span>{text}</span>
                              </div>
                            )
                          })()}

                          {/* Column 7: ACTIONS */}
                          <div className="w-[80px] flex-shrink-0 flex justify-center ml-auto" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none cursor-pointer">
                                  <MoreVertical size={16} strokeWidth={1.5} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl border border-slate-100 shadow-lg p-1.5 bg-white">
                                <DropdownMenuItem onClick={() => handleOpenLeadDetails(lead)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                                  <Eye size={14} className="text-slate-400" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => startEdit(lead)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                                  <Pencil size={14} className="text-slate-400" />
                                  Edit Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openConvertModal(lead)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                                  <ArrowRight size={14} className="text-slate-400" />
                                  Convert to Admission
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => markNotInterested(lead.id)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                                  <XCircle size={14} className="text-slate-400" />
                                  Mark Not Interested
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => deleteLead(lead.id)} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer">
                                  <Trash2 size={14} className="text-red-400" />
                                  Delete Lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          )}

          {activeView === 'grid' && filteredLeads.length > 0 && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeads.map(lead => (
                <Card key={lead.id} className="p-5 border-slate-200 shadow-sm hover:border-blue-200 transition">
                  <div className="font-semibold text-sm text-slate-900 mb-1">{lead.name}</div>
                  <div className="text-xs text-slate-500 mb-4">{lead.phone}</div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                    <span>{lead.status}</span>
                    <button onClick={() => openConvertModal(lead)} className="text-[#1565D8]">Convert</button>
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
                <button disabled={pagination.page <= 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50">Prev</button>
                <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50">Next</button>
              </div>
            </section>
          )}

          {/* SECTION 8 — LEAD DETAIL DRAWER */}
          {drawerOpen && selectedLead && (
            <>
              <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDrawerOpen(false)} />
              <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 overflow-y-auto p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Lead Details: {selectedLead.name}</h2>
                <button onClick={() => setDrawerOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X /></button>
                <div className="space-y-4 text-slate-600">
                    <p>Phone: {selectedLead.phone}</p>
                    <p>Email: {selectedLead.email}</p>
                    <p>Status: {selectedLead.status}</p>
                </div>
              </div>
            </>
          )}

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
