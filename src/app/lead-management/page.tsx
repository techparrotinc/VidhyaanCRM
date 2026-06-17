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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
// options: 'school' | 'institute' | 'learning_center'

const applyingForLabel = {
  school: 'Applying For',
  institute: 'Course / Program',
  learning_center: 'Course / Program',
}

const leadsUsed = 18
const leadsMax = 25
const isPremium = false
// Change isPremium to true to test premium view (hides lead cap banner entirely)

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

const leads = [
  {
    id: 'LD-001',
    name: 'Vimal Das',
    parentName: 'Raj Kumar',
    phone: '9884185362',
    email: 'vimal@email.com',
    applyingFor: 'LKG',
    source: 'Vidhyaan',
    counsellor: 'Saran Kumar',
    counsellorAvatar: 'SK',
    createdDate: '18 May 2026',
    status: 'Rejected',
    avatar: 'VD',
  },
  {
    id: 'LD-002',
    name: 'Rinah Conrad',
    parentName: 'Conrad Silva',
    phone: '9876543210',
    email: 'rinah@email.com',
    applyingFor: '3rd Class',
    source: 'Website',
    counsellor: null,
    counsellorAvatar: null,
    createdDate: '13 May 2026',
    status: 'New',
    avatar: 'RC',
  },
  {
    id: 'LD-003',
    name: 'Selva Kumar',
    parentName: 'Kumar Raja',
    phone: '9845123456',
    email: 'selva@email.com',
    applyingFor: '2nd Class',
    source: 'Web',
    counsellor: 'Pradeep Kumar',
    counsellorAvatar: 'PK',
    createdDate: '15 Apr 2026',
    status: 'Rejected',
    avatar: 'SK',
  },
  {
    id: 'LD-004',
    name: 'Mani Raj',
    parentName: 'Raj Mohan',
    phone: '9823456781',
    email: 'mani@email.com',
    applyingFor: 'LKG',
    source: 'Walk-in',
    counsellor: 'Saran Kumar',
    counsellorAvatar: 'SK',
    createdDate: '14 Apr 2026',
    status: 'Contacted',
    avatar: 'MR',
  },
  {
    id: 'LD-005',
    name: 'Balaji S',
    parentName: 'Suresh Balaji',
    phone: '9811234567',
    email: 'balaji@email.com',
    applyingFor: '2nd Class',
    source: 'Web',
    counsellor: 'Saran Kumar',
    counsellorAvatar: 'SK',
    createdDate: '15 Apr 2026',
    status: 'Converted',
    avatar: 'BS',
  },
  {
    id: 'LD-006',
    name: 'Saran Kumar',
    parentName: 'Kumar Saran',
    phone: '9898989898',
    email: 'saran@email.com',
    applyingFor: 'LKG',
    source: 'Vidhyaan',
    counsellor: 'Saran Kumar',
    counsellorAvatar: 'SK',
    createdDate: '13 Apr 2026',
    status: 'Rejected',
    avatar: 'SK',
  },
  {
    id: 'LD-007',
    name: 'Priya Nair',
    parentName: 'Nair Pradeep',
    phone: '9845678901',
    email: 'priya@email.com',
    applyingFor: '10th Class',
    source: 'Phone',
    counsellor: 'Pradeep Kumar',
    counsellorAvatar: 'PK',
    createdDate: '12 Apr 2026',
    status: 'Contacted',
    avatar: 'PN',
  },
  {
    id: 'LD-008',
    name: 'Arun Sharma',
    parentName: 'Sharma Arun',
    phone: '9876501234',
    email: 'arun@email.com',
    applyingFor: '6th Class',
    source: 'Referral',
    counsellor: null,
    counsellorAvatar: null,
    createdDate: '10 Apr 2026',
    status: 'New',
    avatar: 'AS',
  },
  {
    id: 'LD-009',
    name: 'Deepa Krishnan',
    parentName: 'Krishnan R',
    phone: '9823412345',
    email: 'deepa@email.com',
    applyingFor: 'UKG',
    source: 'WhatsApp',
    counsellor: 'Saran Kumar',
    counsellorAvatar: 'SK',
    createdDate: '08 Apr 2026',
    status: 'Converted',
    avatar: 'DK',
  },
  {
    id: 'LD-010',
    name: 'Rahul Verma',
    parentName: 'Verma Sunil',
    phone: '9812345678',
    email: 'rahul@email.com',
    applyingFor: '9th Class',
    source: 'Web',
    counsellor: 'Pradeep Kumar',
    counsellorAvatar: 'PK',
    createdDate: '05 Apr 2026',
    status: 'Follow-up',
    avatar: 'RV',
  },
]

const statusConfig = {
  New: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    border: 'border-blue-100',
  },
  Contacted: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-100',
  },
  'Follow-up': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    border: 'border-orange-100',
  },
  Converted: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
    border: 'border-green-100',
  },
  Rejected: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-500',
    border: 'border-red-100',
  },
}

const sourceConfig = {
  Vidhyaan: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  Web: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  Website: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  Phone: {
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
}

const institutionConfig = {
  type: 'school',
  name: 'Prince Matriculation School',
  moduleTitle: {
    school: 'Admission Management',
    institute: 'Enrolment Management',
    learning_center: 'Enquiry Management',
  }
}

const counsellors = [
  { id: '1', name: 'Saran Kumar' },
  { id: '2', name: 'Pradeep Kumar' },
  { id: '3', name: 'Vimal Das' },
]

const grades = [
  'LKG', 'UKG', '1st Class', '2nd Class',
  '3rd Class', '4th Class', '5th Class',
  '6th Class', '7th Class', '8th Class',
  '9th Class', '10th Class', '11th Class',
  '12th Class',
]

const courses = [
  'Bharatanatyam', 'Hip Hop', 'Guitar - Beginner',
  'Guitar - Advanced', 'Keyboard', 'Vocals',
  'Yoga - Morning', 'Yoga - Evening', 'Zumba',
  'Karate', 'Swimming',
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

const statusBorderMap: Record<string, string> = {
  'New': 'border-l-blue-500',
  'Contacted': 'border-l-amber-500',
  'Converted': 'border-l-green-500',
  'Rejected': 'border-l-red-500',
  'Follow-up': 'border-l-orange-500'
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
  // Leads state (local for edit/delete)
  const [leadsState, setLeadsState] = useState<Lead[]>(leads)

  // Lead cap banner visibility (dismissed per session)
  const [showLeadBanner, setShowLeadBanner] = useState(true)

  // Navigation and layout states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [salesMarketingOpen, setSalesMarketingOpen] = useState(true)
  const [activeNav, setActiveNav] = useState("Lead Management")

  // Interactive filtering states
  const [activeTab, setActiveTab] = useState('All')
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
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
  const [deleteModalLead, setDeleteModalLead] = useState<Lead | null>(null)
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

  const startEdit = (lead: Lead) => {
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

  const saveEdit = (leadId: string) => {
    setLeadsState(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          name: editFormData.name ?? lead.name,
          parentName: editFormData.parentName ?? lead.parentName,
          applyingFor: editFormData.applyingFor ?? lead.applyingFor,
          source: editFormData.source ?? lead.source,
          counsellor: (editFormData.counsellor ?? lead.counsellor) || '',
          status: editFormData.status ?? lead.status,
          followUpDate: editFormData.followUpDate,
        }
      }
      return lead
    }))
    setSavedLeadId(leadId)
    setTimeout(() => setSavedLeadId(null), 2000)
    setEditingLeadId(null)
    setEditFormData({})
    showToast("Lead updated successfully")
  }

  const handleUnsavedDiscard = () => {
    setEditingLeadId(null)
    setEditFormData({})
    if (unsavedWarning.pendingLeadId) {
      const lead = leadsState.find(
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
      const lead = leadsState.find(
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


  // Filter dropdown states
  const [filterSource, setFilterSource] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterCounsellor, setFilterCounsellor] = useState<string | null>(null)
  const [filterDateRange, setFilterDateRange] = useState<string | null>(null)

  // Dropdown UI toggles
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showCounsellorDropdown, setShowCounsellorDropdown] = useState(false)
  const [showDateDropdown, setShowDateDropdown] = useState(false)


  // Custom notes state
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [currentNoteText, setCurrentNoteText] = useState('')

  const moduleTitle = institutionConfig.moduleTitle[institutionConfig.type as keyof typeof institutionConfig.moduleTitle]

  // Filter calculations
  const filteredLeads = leadsState.filter(lead => {
    if (activeTab !== 'All' && lead.status !== activeTab) return false
    if (searchQuery && !lead.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterSource && lead.source !== filterSource) return false
    if (filterStatus && lead.status !== filterStatus) return false
    if (filterCounsellor && lead.counsellor !== filterCounsellor) return false
    if (filterDateRange) {
      // Basic mock range filter
      if (filterDateRange === 'May' && !lead.createdDate.includes('May')) return false
      if (filterDateRange === 'Apr' && !lead.createdDate.includes('Apr')) return false
    }
    return true
  })

  // Tab count values
  const getTabCount = (tab: string) => {
    if (tab === 'All') return leadsState.length
    return leadsState.filter(l => l.status === tab).length
  }


  // Handle clear all filters
  const handleClearFilters = () => {
    setFilterSource(null)
    setFilterStatus(null)
    setFilterCounsellor(null)
    setFilterDateRange(null)
    setSearchQuery('')
    setActiveTab('All')
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
  const handleOpenLeadDetails = (lead: Lead) => {
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

  // Sidebar navigation component
  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Top Brand Section */}
      <div className={`flex items-center gap-3 px-6 pt-6 pb-2 ${!isMobile ? "md:px-3 lg:px-6 md:justify-center lg:justify-start" : ""}`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] shrink-0">
          <Shield className="w-8 h-8 fill-[#1565D8]" strokeWidth={1.5} />
        </div>
        <div className={`flex flex-col min-w-0 ${!isMobile ? "md:hidden lg:flex" : ""}`}>
          <h1 className="text-[15px] font-bold text-slate-800 truncate leading-tight">
            Prince Matriculation
          </h1>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">School Admin Portal</span>
        </div>
      </div>
      <div className={`border-b border-slate-100 mt-4 mb-4 mx-4 ${!isMobile ? "md:mx-2 lg:mx-4" : ""}`} />

      {/* Navigation list */}
      <div className="flex-1 px-2 overflow-y-auto space-y-1">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "Dashboard"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
          title="Dashboard"
        >
          <LayoutDashboard className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Dashboard</span>
        </Link>

        {/* Site Manager */}
        <button
          onClick={() => {
            setActiveNav("Site Manager")
            if (isMobile) setMobileMenuOpen(false)
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "Site Manager"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
          title="Site Manager"
        >
          <Globe className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Site Manager</span>
        </button>

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
                className={`w-full flex items-center gap-3 py-2 text-sm font-medium text-left transition-all ${!isMobile ? "md:justify-center lg:justify-start" : ""} ${activeNav === "Lead Management" ? 'text-[#1565D8] font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                title="Lead Management"
              >
                <LineChart className="size-[16px] shrink-0" strokeWidth={1.5} />
                <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Lead Management</span>
              </Link>
            </div>
          )}
        </div>

        {/* Dynamic Admission/Enrolment/Enquiry module */}
        <button
          onClick={() => {
            setActiveNav("Module Management")
            if (isMobile) setMobileMenuOpen(false)
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "Module Management"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
          title={moduleTitle}
        >
          <ClipboardList className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`truncate ${!isMobile ? "md:hidden lg:inline" : ""}`}>{moduleTitle}</span>
        </button>

        {/* Student Management */}
        <button
          onClick={() => {
            setActiveNav("Student Management")
            if (isMobile) setMobileMenuOpen(false)
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "Student Management"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
          title="Student Management"
        >
          <Users className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Student Management</span>
        </button>

        {/* Fee Management */}
        <button
          onClick={() => {
            setActiveNav("Fee Management")
            if (isMobile) setMobileMenuOpen(false)
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "Fee Management"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
          title="Fee Management"
        >
          <CreditCard className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Fee Management</span>
        </button>

        {/* User & Role Management */}
        <button
          onClick={() => {
            setActiveNav("User & Role Management")
            if (isMobile) setMobileMenuOpen(false)
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "User & Role Management"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
          title="User & Role Management"
        >
          <UserCog className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>User & Role Management</span>
        </button>
      </div>

      {/* Sidebar Footer - Plan Status */}
      <div className={`mt-auto pt-4 border-t border-slate-100 p-4 bg-slate-50/50 flex flex-col gap-2 ${!isMobile ? "md:p-1 md:items-center lg:p-4 lg:items-start" : ""}`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest text-slate-400 ${!isMobile ? "md:hidden lg:block" : ""}`}>PLAN STATUS</span>
        <Badge className={`bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full w-fit hover:bg-amber-100 border-0 shadow-none ${!isMobile ? "md:hidden lg:flex" : ""}`}>
          Free Plan
        </Badge>
        <p className={`text-xs text-slate-500 mt-1 leading-relaxed ${!isMobile ? "md:hidden lg:block" : ""}`}>
          Unlock all premium features like Lead automation & fee collections.
        </p>
        <Button className={`w-full bg-[#1565D8] text-white text-sm font-semibold py-2.5 h-auto rounded-lg mt-2 hover:bg-blue-700 transition duration-200 ${!isMobile ? "md:hidden lg:flex" : ""}`}>
          Upgrade to Premium
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex relative font-sans antialiased select-none">
      {/* 1. FIXED LEFT SIDEBAR (Desktop w-64, Tablet slim w-16) */}
      <aside className="hidden md:flex w-16 lg:w-64 fixed inset-y-0 left-0 border-r border-slate-100 bg-white z-30 shadow-sm flex-col">
        <SidebarContent />
      </aside>

      {/* MOBILE TOP NAV BAR */}
      <header className="flex md:hidden h-14 bg-white border-b border-slate-100 px-2 min-[375px]:px-4 items-center justify-between fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-1.5 min-[375px]:gap-2 min-w-0 flex-shrink">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[#1565D8] shrink-0">
            <Shield className="w-5 h-5 fill-[#1565D8]" strokeWidth={1.5} />
          </div>
          <span className="text-xs min-[375px]:text-sm font-bold text-slate-800 tracking-tight truncate max-w-[60px] min-[375px]:max-w-[100px] min-[400px]:max-w-[120px] shrink-0">
            Prince Matriculation School
          </span>
        </div>
        <span className="text-xs min-[375px]:text-sm font-bold text-slate-800 shrink-0">Lead Management</span>
        <div className="flex items-center gap-1.5 min-[375px]:gap-3 shrink-0">
          {/* Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer animate-fade-in"
          >
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>
          {/* Notifications */}
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
            <SidebarContent isMobile={true} />
          </div>
        </>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-16 lg:pl-64 pt-14 md:pt-0 flex flex-col min-w-0">
        {/* DESKTOP/TABLET HEADER BAR */}
        <header className="hidden md:flex h-16 border-b border-slate-100 bg-white items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm lg:text-lg font-bold text-slate-800 tracking-tight leading-tight truncate">
                Lead Management
              </h2>
              <p className="text-xs text-slate-400 truncate leading-relaxed">
                Sales & Marketing › Lead Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Global Search Bar */}
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

            {/* Notification Bell */}
            <button className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 relative shrink-0">
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {/* User Profile */}
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
        <main className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-5 lg:space-y-6 max-w-7xl mx-auto w-full bg-[#F8FAFC] min-h-[calc(100vh-4rem)]">
          
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
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 md:p-5 relative">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              
              {/* Row 1 (Mobile/Tablet Search, inline on Desktop) */}
              <div className="w-full lg:w-auto">
                <div className="relative flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 w-full lg:w-64">
                  <Search className="size-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-400 w-full font-sans"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
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
                      className="flex items-center justify-between md:justify-start gap-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer min-h-[38px] font-sans"
                    >
                      <span className="truncate">{filterSource ? `Source: ${filterSource}` : 'Source'}</span>
                      <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                    </button>
                    {showSourceDropdown && (
                      <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-lg z-30 py-1 font-sans">
                        {Array.from(new Set(leadsState.map(l => l.source))).map(source => (
                          <button
                            key={source}
                            onClick={() => {
                              setFilterSource(source === filterSource ? null : source)
                              setShowSourceDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filterSource === source ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
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
                      className="flex items-center justify-between md:justify-start gap-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer min-h-[38px] font-sans"
                    >
                      <span className="truncate">{filterStatus ? `Status: ${filterStatus}` : 'Status'}</span>
                      <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-lg z-30 py-1 font-sans">
                        {Object.keys(statusConfig).map(status => (
                          <button
                            key={status}
                            onClick={() => {
                              setFilterStatus(status === filterStatus ? null : status)
                              setShowStatusDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filterStatus === status ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                          >
                            {status}
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
                      className="flex items-center justify-between min-[480px]:justify-start gap-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer min-h-[38px] font-sans"
                    >
                      <span className="truncate">{filterCounsellor ? `Counsellor: ${filterCounsellor}` : 'Counsellor'}</span>
                      <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                    </button>
                    {showCounsellorDropdown && (
                      <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-lg z-30 py-1 font-sans">
                        {Array.from(new Set(leadsState.map(l => l.counsellor).filter(Boolean))).map(c => (
                          <button
                            key={c}
                            onClick={() => {
                              setFilterCounsellor(c === filterCounsellor ? null : c)
                              setShowCounsellorDropdown(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filterCounsellor === c ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                          >
                            {c}
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
                      className="flex items-center justify-between min-[480px]:justify-start gap-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer min-h-[38px] font-sans"
                    >
                      <span className="truncate">{filterDateRange ? `Date: ${filterDateRange === 'May' ? 'May' : 'Apr'}` : 'Date Range'}</span>
                      <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                    </button>
                    {showDateDropdown && (
                      <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-lg z-30 py-1 font-sans">
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
                  <button className="flex items-center justify-center gap-1.5 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition min-h-[38px] cursor-pointer w-full min-[480px]:w-auto font-sans">
                    <Download className="size-3.5 text-slate-500 shrink-0" />
                    <span>Export</span>
                  </button>

                  {/* Toggle View */}
                  <div className="flex items-center justify-center bg-slate-100 rounded-lg p-1 gap-1 w-full min-[480px]:w-auto">
                    <button
                      onClick={() => setActiveView('list')}
                      className={`rounded-md p-1.5 transition flex-1 min-[480px]:flex-none flex justify-center ${activeView === 'list' ? 'bg-white shadow-sm text-[#1565D8]' : 'text-slate-400 hover:text-slate-700'}`}
                      title="List view"
                    >
                      <LayoutList className="size-4" />
                    </button>
                    <button
                      onClick={() => setActiveView('grid')}
                      className={`rounded-md p-1.5 transition flex-1 min-[480px]:flex-none flex justify-center ${activeView === 'grid' ? 'bg-white shadow-sm text-[#1565D8]' : 'text-slate-400 hover:text-slate-700'}`}
                      title="Grid view"
                    >
                      <LayoutGrid className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Clear filters link */}
                {(filterSource || filterStatus || filterCounsellor || filterDateRange || searchQuery || activeTab !== 'All') && (
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
              { id: 'All', label: 'All', badgeClass: 'bg-slate-100 text-slate-500' },
              { id: 'New', label: 'New', badgeClass: 'bg-blue-100 text-blue-700' },
              { id: 'Contacted', label: 'Contacted', badgeClass: 'bg-amber-100 text-amber-700' },
              { id: 'Converted', label: 'Converted', badgeClass: 'bg-green-100 text-green-700' },
              { id: 'Rejected', label: 'Rejected', badgeClass: 'bg-red-100 text-red-600' },
              { id: 'Follow-up', label: 'Follow-up', badgeClass: 'bg-orange-100 text-orange-700' },
            ].map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 md:px-4 py-2.5 text-xs md:text-sm font-semibold cursor-pointer relative transition-all duration-200 shrink-0 ${isActive ? 'text-[#1565D8] border-b-2 border-[#1565D8] mb-[-1px]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <span>{tab.label}</span>
                  <span className={`ml-2 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : tab.badgeClass}`}>
                    {getTabCount(tab.id)}
                  </span>
                </button>
              )
            })}
          </section>

          {/* EMPTY STATE */}
          {filteredLeads.length === 0 ? (
            <section className="bg-white rounded-xl border border-slate-100 shadow-sm py-20 text-center">
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
          ) : activeView === 'list' ? (
            
            /* SECTION 6 — LEADS TABLE */
            <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              
              {/* TABLE HEADER */}
              <div className="bg-slate-50 border-b border-slate-100 hidden md:flex items-center px-5 py-3 gap-4">
                <div className="w-8 flex-shrink-0 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={handleSelectAllLeads}
                    className="w-4 h-4 rounded border-slate-300 accent-[#1565D8] cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-[200px] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Lead Name
                </div>
                <div className="hidden md:flex w-32 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {applyingForLabel[institutionType as keyof typeof applyingForLabel]}
                </div>
                <div className="hidden md:flex w-28 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Source
                </div>
                <div className="hidden lg:flex w-24 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Connect
                </div>
                <div className="hidden lg:flex w-36 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Counsellor
                </div>
                <div className="hidden xl:flex w-28 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Date
                </div>
                <div className="w-28 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </div>
                <div className="w-12 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Action
                </div>
              </div>

              {/* TABLE BODY */}
              <div className="divide-y divide-slate-50">
                {filteredLeads.map((lead, idx) => {
                  const isChecked = selectedLeads.includes(lead.id)
                  const isEditing = editingLeadId === lead.id
                  const isSaved = savedLeadId === lead.id

                  if (isEditing) {
                    const todayStr = new Date().toISOString().split('T')[0]
                    return (
                      <div
                        key={lead.id}
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-4 border-b border-slate-100 border-l-4 border-l-[#1565D8] bg-blue-50/40 flex flex-col transition-all duration-200 shadow-sm"
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
                              {(institutionType === 'school' ? grades : courses).map(opt => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
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
                                <option key={src.id} value={src.label}>
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
                                editFormData.status === 'New' ? 'border-l-blue-500' :
                                editFormData.status === 'Contacted' ? 'border-l-amber-500' :
                                editFormData.status === 'Follow-up' ? 'border-l-orange-500' :
                                editFormData.status === 'Converted' ? 'border-l-green-500' :
                                editFormData.status === 'Rejected' ? 'border-l-red-500' : 'border-l-slate-200'
                              }`}
                            >
                              {['New', 'Contacted', 'Follow-up', 'Converted', 'Rejected'].map(st => (
                                <option key={st} value={st}>
                                  {st}
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
                      className={`relative flex flex-col border-b border-slate-50 last:border-0 transition-all duration-200 cursor-pointer ${idx % 2 === 1 ? 'bg-slate-50/10' : ''} ${isSaved ? 'bg-green-50/40' : 'hover:bg-blue-50/20'}`}
                      onClick={() => {
                        if (editingLeadId) return
                        setSelectedLead(lead)
                        setDrawerOpen(true)
                      }}
                    >
                      {/* MOBILE VIEW */}
                      <div className="flex md:hidden items-center justify-between gap-3 w-full py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full flex-shrink-0 bg-[#1565D8]/10 text-[#1565D8] text-xs font-bold flex items-center justify-center font-sans">
                            {lead.avatar}
                          </div>
                          {/* Text block */}
                          <div className="min-w-0">
                            <Link
                              href={`/lead-management/${lead.id}`}
                              className="text-sm font-semibold text-[#1565D8] hover:underline cursor-pointer truncate font-sans block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {lead.name}
                            </Link>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate font-sans">
                              <span>{lead.source}</span>
                              <span>·</span>
                              <span>{lead.createdDate}</span>
                              <span>·</span>
                              <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConfig[lead.status as keyof typeof statusConfig]?.bg} ${statusConfig[lead.status as keyof typeof statusConfig]?.text}`}>
                                <div className={`w-1 h-1 rounded-full ${statusConfig[lead.status as keyof typeof statusConfig]?.dot}`} />
                                <span>{lead.status}</span>
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
                              className="w-56 min-w-[224px] rounded-xl border border-slate-100 shadow-lg p-1.5"
                            >
                              <DropdownMenuItem onClick={() => router.push(`/lead-management/${lead.id}`)}>
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
                                  onClick={() => {}}
                                >
                                  <ArrowRight size={14} className="text-[#1565D8] flex-shrink-0" strokeWidth={1.5} />
                                  Convert to Admission
                                </DropdownMenuItem>
                              )}
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
                          <div className="w-9 h-9 rounded-full flex-shrink-0 bg-[#1565D8]/10 text-[#1565D8] text-xs font-bold flex items-center justify-center font-sans">
                            {lead.avatar}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/lead-management/${lead.id}`}
                              className="text-sm font-semibold text-[#1565D8] hover:underline cursor-pointer truncate font-sans block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {lead.name}
                            </Link>
                            <p className="text-xs text-slate-400 mt-0.5 truncate font-sans">
                              Parent: {lead.parentName}
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

                        {/* Applying For */}
                        <div className="hidden md:flex w-32 flex-shrink-0 items-center text-sm font-medium text-slate-700 font-sans truncate">
                          {lead.applyingFor || '—'}
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
                          <a 
                            href={`mailto:${lead.email}`} 
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition"
                          >
                            <Mail size={13} className="text-slate-400" strokeWidth={1.5} />
                          </a>
                          <a 
                            href={`https://wa.me/${lead.phone}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition"
                          >
                            <MessageCircle size={13} className="text-slate-400" strokeWidth={1.5} />
                          </a>
                          <a 
                            href={`tel:${lead.phone}`} 
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition"
                          >
                            <Phone size={13} className="text-slate-400" strokeWidth={1.5} />
                          </a>
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
                              <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-100 shadow-lg p-1.5 min-w-[180px]">
                                <div className="px-3 py-1.5 border-b border-slate-50 mb-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Assign Counsellor
                                  </span>
                                </div>
                                {counsellors.map(c => (
                                  <button
                                    key={c.id}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setLeadsState(prev => prev.map(l =>
                                        l.id === lead.id
                                          ? {
                                              ...l,
                                              counsellor: c.name,
                                              counsellorAvatar: c.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
                                            }
                                          : l
                                      ))
                                      setCounsellorDropdownId(null)
                                      showToast(`Assigned to ${c.name}`)
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                                      lead.counsellor === c.name
                                        ? 'bg-blue-50 text-blue-700 font-semibold'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                      {c.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                                    </div>
                                    <span className="flex-1 text-left">{c.name}</span>
                                    {lead.counsellor === c.name && (
                                      <Check size={13} className="text-blue-500" strokeWidth={2} />
                                    )}
                                  </button>
                                ))}
                                {lead.counsellor && (
                                  <div className="border-t border-slate-50 mt-1 pt-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setLeadsState(prev => prev.map(l =>
                                          l.id === lead.id ? { ...l, counsellor: null, counsellorAvatar: null } : l
                                        ))
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
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConfig[lead.status as keyof typeof statusConfig]?.dot}`} />
                            {lead.status}
                            <ChevronDown size={10} className="ml-0.5 opacity-60" strokeWidth={2} />
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
                              <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-100 shadow-lg p-1.5 min-w-[160px]">
                                {(['New', 'Contacted', 'Follow-up', 'Converted', 'Rejected'] as const).map((status) => (
                                  <button
                                    key={status}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setLeadsState(prev => prev.map(l =>
                                        l.id === lead.id ? { ...l, status } : l
                                      ))
                                      setStatusDropdownId(null)
                                      showToast(`Status updated to ${status}`)
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                                      lead.status === status
                                        ? `${statusConfig[status].bg} ${statusConfig[status].text} font-semibold`
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig[status].dot}`} />
                                    {status}
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
                              className="w-56 min-w-[224px] rounded-xl border border-slate-100 shadow-lg p-1.5"
                            >
                              <DropdownMenuItem onClick={() => router.push(`/lead-management/${lead.id}`)}>
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
                                  onClick={() => {}}
                                >
                                  <ArrowRight size={14} className="text-[#1565D8] flex-shrink-0" strokeWidth={1.5} />
                                  Convert to Admission
                                </DropdownMenuItem>
                              )}
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
                      
                      {/* Success Flash */}
                      {isSaved && (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-4 py-2 mx-5 my-2 animate-fade-in w-fit">
                          <CheckCircle2 size={16} className="text-green-500" strokeWidth={1.5} />
                          <span className="text-sm font-semibold text-green-700">Changes saved successfully</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ) : (
            
            /* GRID VIEW */
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeads.map(lead => (
                <Card
                  key={lead.id}
                  onClick={() => handleOpenLeadDetails(lead)}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[220px]"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1565D8]/10 text-[#1565D8] text-xs font-bold flex items-center justify-center">
                          {lead.avatar}
                        </div>
                        <div>
                          <Link
                            href={`/lead-management/${lead.id}`}
                            className="text-sm font-semibold text-[#1565D8] hover:underline truncate max-w-[150px] block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.name}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{lead.id}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConfig[lead.status as keyof typeof statusConfig]?.bg} ${statusConfig[lead.status as keyof typeof statusConfig]?.text}`}>
                        <span>{lead.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold">Applying For</span>
                        <span className="text-slate-700 font-medium">{lead.applyingFor}</span>
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
                      <a href={`mailto:${lead.email}`} className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                        <Mail className="size-3.5 text-slate-400" />
                      </a>
                      <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                        <MessageCircle className="size-3.5 text-green-500" />
                      </a>
                      <a href={`tel:${lead.phone}`} className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                        <Phone className="size-3.5 text-blue-500" />
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </section>
          )}

          {/* SECTION 7 — PAGINATION */}
          {filteredLeads.length > 0 && (
            <section className="bg-white border border-slate-100 shadow-sm rounded-xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-500 font-medium">
                Showing 1–{filteredLeads.length} of 31 leads
              </div>
              
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium text-slate-400 opacity-50 cursor-not-allowed">
                  <ChevronLeft className="size-4" />
                  <span>Prev</span>
                </button>
                
                <button className="w-9 h-9 rounded-lg text-sm font-semibold bg-[#1565D8] text-white flex items-center justify-center">
                  1
                </button>
                <button className="w-9 h-9 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center">
                  2
                </button>
                <button className="w-9 h-9 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center">
                  3
                </button>
                <span className="text-slate-400 px-1 font-bold">...</span>
                <button className="w-9 h-9 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center">
                  4
                </button>

                <button className="flex items-center gap-1.5 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
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
              <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-100 z-50 flex flex-col transform transition-transform duration-300 translate-x-0">
                
                {/* DRAWER HEADER */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
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
                        {selectedLead.applyingFor} · {selectedLead.source}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Lead ID
                        </span>
                        <span className="text-xs font-bold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                          {selectedLead.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/lead-management/${selectedLead?.id}`)}
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

                  <div className="border-t border-slate-100 my-5" />

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
                        <span className="text-sm font-semibold text-slate-700">{selectedLead.applyingFor}</span>
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
                          <span>{selectedLead.status}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Lead ID</span>
                        <span className="text-sm font-semibold text-slate-400">{selectedLead.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 my-5" />

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

                  <div className="border-t border-slate-100 my-5" />

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
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                  {institutionType === 'school' ? (
                    <Button className="w-full bg-[#1565D8] text-white text-sm font-bold py-3 h-auto rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition">
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
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-[#1565D8]/10 text-[#1565D8] text-sm font-bold flex items-center justify-center font-sans">
                      {deleteModalLead.avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 font-sans">{deleteModalLead.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-sans">
                        {deleteModalLead.applyingFor} · {deleteModalLead.id}
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
                      onClick={() => {
                        setLeadsState(prev => prev.filter(l => l.id !== deleteModalLead.id))
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
                You have unsaved changes on {leadsState.find(l => l.id === editingLeadId)?.name}. What would you like to do?
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


        </main>
      </div>
    </div>
  )
}
