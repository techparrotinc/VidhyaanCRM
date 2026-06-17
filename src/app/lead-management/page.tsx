"use client"

import React, { useState } from 'react'
import Link from 'next/link'
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
  Crown,
  X,
  Eye,
  IndianRupee,
  BarChart2,
  GraduationCap,
  ArrowUpRight,
  CheckCircle2,
  Plus,
  UserPlus,
  UserCheck,
  Receipt,
  Megaphone,
  MessageSquare,
  GitBranch,
  Calendar,
  CalendarOff,
  Settings,
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
  RefreshCw,
  ArrowRight
} from 'lucide-react'

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

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
  },
  Contacted: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  Converted: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  Rejected: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-500',
  },
  'Follow-up': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
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

export default function LeadManagementPage() {
  // Navigation and layout states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [salesMarketingOpen, setSalesMarketingOpen] = useState(true)
  const [activeNav, setActiveNav] = useState("Lead Management")

  // Interactive filtering states
  const [activeTab, setActiveTab] = useState('All')
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<typeof leads[0] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeView, setActiveView] = useState<'list' | 'grid'>('list')

  // Filter dropdown states
  const [filterSource, setFilterSource] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterCounsellor, setFilterCounsellor] = useState<string | null>(null)
  const [filterDateRange, setFilterDateRange] = useState<string | null>(null)

  // Dropdown UI toggles
  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null)
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showCounsellorDropdown, setShowCounsellorDropdown] = useState(false)
  const [showDateDropdown, setShowDateDropdown] = useState(false)

  // Custom notes state
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [currentNoteText, setCurrentNoteText] = useState('')

  const moduleTitle = institutionConfig.moduleTitle[institutionConfig.type as keyof typeof institutionConfig.moduleTitle]

  // Filter calculations
  const filteredLeads = leads.filter(lead => {
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
    if (tab === 'All') return 31
    if (tab === 'New') return 2
    if (tab === 'Contacted') return 8
    if (tab === 'Converted') return 17
    if (tab === 'Rejected') return 10
    if (tab === 'Follow-up') return 4
    return 0
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
  const handleOpenLeadDetails = (lead: typeof leads[0]) => {
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
          
          {/* SECTION 1 — PAGE TITLE ROW */}
          <section className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Lead Management
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Manage and track all your leads in one place.
              </p>
            </div>
            <Button className="bg-[#1565D8] text-white text-sm font-semibold px-5 py-2.5 h-auto rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
              <Plus className="size-4" strokeWidth={2.0} />
              <span>Add Lead</span>
            </Button>
          </section>

          {/* SECTION 2 — LEAD CAP BANNER (Free Plan Only) */}
          <section className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <BarChart2 className="size-[18px] text-amber-500 shrink-0" />
              <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-amber-800">
                <span>Free Plan: {leadsUsed} of {leadsMax} leads captured this month</span>
                
                {/* Progress bar container */}
                <div className="w-32 bg-amber-100 rounded-full h-2 relative inline-flex items-center ml-3 shrink-0">
                  <div
                    className="bg-amber-500 rounded-full h-2 transition-all duration-300"
                    style={{ width: `${(leadsUsed / leadsMax) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-amber-700 ml-2">{leadsUsed}/{leadsMax}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto md:ml-0 shrink-0">
              <span className="text-xs font-semibold text-amber-700">Upgrade for unlimited leads</span>
              <Button className="bg-[#1565D8] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 h-auto rounded-lg transition">
                Upgrade Now →
              </Button>
            </div>
          </section>

          {/* SECTION 3 — FILTER & SEARCH BAR */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative">
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Search input */}
              <div className="relative flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 w-full sm:w-64">
                <Search className="size-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-400 w-full"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Filter: Source */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSourceDropdown(!showSourceDropdown)
                    setShowStatusDropdown(false)
                    setShowCounsellorDropdown(false)
                    setShowDateDropdown(false)
                  }}
                  className={`flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer min-h-[38px]`}
                >
                  <span>{filterSource ? `Source: ${filterSource}` : 'Source'}</span>
                  <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                </button>
                {showSourceDropdown && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-lg z-30 py-1">
                    {Array.from(new Set(leads.map(l => l.source))).map(source => (
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

              {/* Filter: Status */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown)
                    setShowSourceDropdown(false)
                    setShowCounsellorDropdown(false)
                    setShowDateDropdown(false)
                  }}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer min-h-[38px]"
                >
                  <span>{filterStatus ? `Status: ${filterStatus}` : 'Status'}</span>
                  <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                </button>
                {showStatusDropdown && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-lg z-30 py-1">
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

              {/* Filter: Counsellor */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowCounsellorDropdown(!showCounsellorDropdown)
                    setShowSourceDropdown(false)
                    setShowStatusDropdown(false)
                    setShowDateDropdown(false)
                  }}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer min-h-[38px]"
                >
                  <span>{filterCounsellor ? `Counsellor: ${filterCounsellor}` : 'Counsellor'}</span>
                  <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                </button>
                {showCounsellorDropdown && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-lg z-30 py-1">
                    {Array.from(new Set(leads.map(l => l.counsellor).filter(Boolean))).map(c => (
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

              {/* Filter: Date Range */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowDateDropdown(!showDateDropdown)
                    setShowSourceDropdown(false)
                    setShowStatusDropdown(false)
                    setShowCounsellorDropdown(false)
                  }}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer min-h-[38px]"
                >
                  <span>{filterDateRange ? `Date: ${filterDateRange === 'May' ? 'May 2026' : 'April 2026'}` : 'Date Range'}</span>
                  <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                </button>
                {showDateDropdown && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-lg z-30 py-1">
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

              {/* Clear filters link */}
              {(filterSource || filterStatus || filterCounsellor || filterDateRange || searchQuery || activeTab !== 'All') && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm font-medium text-slate-400 hover:text-red-500 cursor-pointer flex items-center gap-1 ml-2 transition-colors"
                >
                  <X className="size-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end shrink-0">
              {/* Export button */}
              <button className="flex items-center gap-1.5 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition min-h-[38px] cursor-pointer">
                <Download className="size-3.5 text-slate-500 shrink-0" />
                <span>Export</span>
              </button>

              {/* View toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setActiveView('list')}
                  className={`rounded-md p-1.5 transition ${activeView === 'list' ? 'bg-white shadow-sm text-[#1565D8]' : 'text-slate-400 hover:text-slate-700'}`}
                  title="List view"
                >
                  <LayoutList className="size-4" />
                </button>
                <button
                  onClick={() => setActiveView('grid')}
                  className={`rounded-md p-1.5 transition ${activeView === 'grid' ? 'bg-white shadow-sm text-[#1565D8]' : 'text-slate-400 hover:text-slate-700'}`}
                  title="Grid view"
                >
                  <LayoutGrid className="size-4" />
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 4 — TAB STRIP */}
          <section className="border-b border-slate-200 pb-0 flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
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
                  className={`px-4 py-2.5 text-sm font-semibold cursor-pointer relative transition-all duration-200 shrink-0 ${isActive ? 'text-[#1565D8] border-b-2 border-[#1565D8] mb-[-1px]' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <span>{tab.label}</span>
                  <span className={`ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : tab.badgeClass}`}>
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
              <Button className="bg-[#1565D8] text-white text-sm font-semibold px-5 py-2.5 h-auto rounded-lg inline-flex items-center gap-2 mt-6 hover:bg-blue-700 transition">
                <Plus className="size-4" />
                <span>Add Lead</span>
              </Button>
            </section>
          ) : activeView === 'list' ? (
            
            /* SECTION 6 — LEADS TABLE */
            <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              
              {/* TABLE HEADER */}
              <div className="bg-slate-50 border-b border-slate-100 hidden md:flex items-center px-5 py-3 gap-4">
                <div className="w-10 flex-shrink-0 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={handleSelectAllLeads}
                    className="w-4 h-4 rounded border-slate-300 accent-[#1565D8]"
                  />
                </div>
                <div className="flex-1 min-w-[200px] text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Lead Name
                </div>
                <div className="w-36 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {applyingForLabel[institutionType as keyof typeof applyingForLabel]}
                </div>
                <div className="w-28 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Source
                </div>
                <div className="w-24 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Connect
                </div>
                <div className="w-40 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Counsellor
                </div>
                <div className="w-28 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Date
                </div>
                <div className="w-28 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </div>
                <div className="w-12 flex-shrink-0"></div>
              </div>

              {/* TABLE BODY */}
              <div className="divide-y divide-slate-50">
                {filteredLeads.map((lead, idx) => {
                  const isChecked = selectedLeads.includes(lead.id)
                  const isMenuOpen = activeRowMenu === lead.id
                  return (
                    <div
                      key={lead.id}
                      className={`flex flex-col md:flex-row md:items-center px-5 py-4 gap-3 md:gap-4 transition-all hover:bg-blue-50/30 cursor-pointer ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <div className="w-10 flex-shrink-0 flex items-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectLead(lead.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-slate-300 accent-[#1565D8]"
                        />
                      </div>

                      {/* Lead Avatar + Name */}
                      <div
                        className="flex-1 min-w-[200px] flex items-center gap-3"
                        onClick={() => handleOpenLeadDetails(lead)}
                      >
                        <div className="w-9 h-9 rounded-full flex-shrink-0 bg-[#1565D8]/10 text-[#1565D8] text-xs font-bold flex items-center justify-center">
                          {lead.avatar}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-[#1565D8] hover:underline cursor-pointer truncate">
                            {lead.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            Parent: {lead.parentName}
                          </p>
                        </div>
                      </div>

                      {/* Applying For */}
                      <div className="w-36 flex-shrink-0 flex md:block justify-between items-center text-sm font-medium text-slate-700">
                        <span className="md:hidden text-xs text-slate-400 font-bold uppercase tracking-wider">Applying For:</span>
                        <span>{lead.applyingFor || '—'}</span>
                      </div>

                      {/* Source */}
                      <div className="w-28 flex-shrink-0 flex md:block justify-between items-center">
                        <span className="md:hidden text-xs text-slate-400 font-bold uppercase tracking-wider">Source:</span>
                        <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ${sourceConfig[lead.source as keyof typeof sourceConfig]?.bg} ${sourceConfig[lead.source as keyof typeof sourceConfig]?.text}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${sourceConfig[lead.source as keyof typeof sourceConfig]?.dot}`} />
                          <span>{lead.source}</span>
                        </div>
                      </div>

                      {/* Connect Quick Actions */}
                      <div className="w-24 flex-shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <a href={`mailto:${lead.email}`} className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition">
                          <Mail className="size-3 text-slate-400" />
                        </a>
                        <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition">
                          <MessageCircle className="size-3 text-green-500" />
                        </a>
                        <a href={`tel:${lead.phone}`} className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition">
                          <Phone className="size-3 text-blue-500" />
                        </a>
                      </div>

                      {/* Counsellor */}
                      <div className="w-40 flex-shrink-0 flex md:block justify-between items-center" onClick={(e) => e.stopPropagation()}>
                        <span className="md:hidden text-xs text-slate-400 font-bold uppercase tracking-wider">Counsellor:</span>
                        {lead.counsellor ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {lead.counsellor[0]}
                            </div>
                            <span className="text-sm font-medium text-slate-700 truncate">{lead.counsellor}</span>
                            <Pencil className="size-3 text-slate-300 ml-1 hover:text-slate-500 cursor-pointer" />
                          </div>
                        ) : (
                          <button className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-amber-100 transition">
                            <UserPlus className="size-3 text-amber-600" />
                            <span>Select Counsellor</span>
                          </button>
                        )}
                      </div>

                      {/* Date */}
                      <div className="w-28 flex-shrink-0 flex md:block justify-between items-center text-sm text-slate-500 font-medium">
                        <span className="md:hidden text-xs text-slate-400 font-bold uppercase tracking-wider">Date:</span>
                        <span>{lead.createdDate}</span>
                      </div>

                      {/* Status */}
                      <div className="w-28 flex-shrink-0 flex md:block justify-between items-center">
                        <span className="md:hidden text-xs text-slate-400 font-bold uppercase tracking-wider">Status:</span>
                        <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full w-fit ${statusConfig[lead.status as keyof typeof statusConfig]?.bg} ${statusConfig[lead.status as keyof typeof statusConfig]?.text}`}>
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConfig[lead.status as keyof typeof statusConfig]?.dot}`} />
                          <span>{lead.status}</span>
                        </div>
                      </div>

                      {/* Action Dot Dropdown */}
                      <div className="w-12 flex-shrink-0 flex justify-end relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveRowMenu(isMenuOpen ? null : lead.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition cursor-pointer"
                        >
                          <MoreVertical className="size-4 text-slate-400" />
                        </button>
                        
                        {/* Custom Dropdown Dialog */}
                        {isMenuOpen && (
                          <div className="absolute right-0 mt-8 w-56 bg-white border border-slate-100 rounded-lg shadow-xl z-30 py-1.5 animate-fade-in text-left">
                            <button
                              onClick={() => {
                                handleOpenLeadDetails(lead)
                                setActiveRowMenu(null)
                              }}
                              className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye className="size-3.5 text-slate-400" />
                              <span>View Lead</span>
                            </button>
                            <button className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                              <Pencil className="size-3.5 text-slate-400" />
                              <span>Edit Lead</span>
                            </button>
                            <button className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                              <UserPlus className="size-3.5 text-slate-400" />
                              <span>Assign Counsellor</span>
                            </button>
                            <button className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                              <RefreshCw className="size-3.5 text-slate-400" />
                              <span>Change Status</span>
                            </button>
                            {institutionType === 'school' && (
                              <button className="w-full px-4 py-2 text-sm text-[#1565D8] font-semibold hover:bg-blue-50/50 flex items-center gap-2">
                                <ArrowRight className="size-3.5" />
                                <span>Convert to Admission</span>
                              </button>
                            )}
                            <div className="border-t border-slate-100 my-1" />
                            <button className="w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50/50 flex items-center gap-2">
                              <Trash2 className="size-3.5" />
                              <span>Delete Lead</span>
                            </button>
                          </div>
                        )}
                      </div>
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
                          <h4 className="text-sm font-semibold text-[#1565D8] hover:underline truncate max-w-[150px]">
                            {lead.name}
                          </h4>
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
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                        <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${sourceConfig[selectedLead.source as keyof typeof sourceConfig]?.bg} ${sourceConfig[selectedLead.source as keyof typeof sourceConfig]?.text}`}>
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

        </main>
      </div>
    </div>
  )
}
