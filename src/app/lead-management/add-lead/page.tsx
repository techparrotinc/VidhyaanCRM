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
  Save,
  AlertCircle,
  Lightbulb,
  Zap,
  BookOpen,
  MapPin,
  User,
  TriangleAlert,
  ChevronLeft
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

const academicYears = [
  'AY 2026-27', 'AY 2025-26', 'AY 2024-25',
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

const existingLeads = [
  {
    name: 'Vimal Das',
    phone: '9884185362',
    applyingFor: 'LKG',
    date: '18 May 2026',
    status: 'Rejected',
  },
]

const sourceConfig = {
  Vidhyaan: { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  Web: { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100' },
  Website: { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100' },
  'Walk-in': { dot: 'bg-teal-500', text: 'text-teal-700', bg: 'bg-teal-50' },
  Phone: { dot: 'bg-purple-505', text: 'text-purple-700', bg: 'bg-purple-50' },
  WhatsApp: { dot: 'bg-green-505', text: 'text-green-700', bg: 'bg-green-50' },
  Referral: { dot: 'bg-pink-500', text: 'text-pink-700', bg: 'bg-pink-50' },
  Other: { dot: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50' },
}

const statusConfig = {
  New: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Contacted: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Converted: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Rejected: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  'Follow-up': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
}

export default function AddLeadPage() {
  // Navigation/Layout states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [salesMarketingOpen, setSalesMarketingOpen] = useState(true)
  const [activeNav, setActiveNav] = useState("Lead Management")

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    source: '',
    // School fields
    applyingFor: '',
    academicYear: 'AY 2026-27',
    childName: '',
    childAge: '',
    currentSchool: '',
    // Institute fields
    course: '',
    batch: '',
    studentAge: '',
    startDate: '',
    // Assignment
    counsellorId: '',
    status: 'New',
    followUpDate: '',
    followUpTime: '',
    priority: 'Normal',
    // Notes
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [duplicateFound, setDuplicateFound] = useState<typeof existingLeads[0] | null>(null)
  const [sourceSelected, setSourceSelected] = useState('')

  // Check duplicate phone logic
  const checkDuplicate = (phone: string) => {
    const found = existingLeads.find(l => l.phone === phone)
    setDuplicateFound(found || null)
  }

  // Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error inline
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev }
        delete copy[name]
        return copy
      })
    }
  }

  // Handle source chip click
  const handleSourceSelect = (source: string) => {
    setFormData(prev => ({ ...prev, source }))
    setSourceSelected(source)
    if (errors.source) {
      setErrors(prev => {
        const copy = { ...prev }
        delete copy.source
        return copy
      })
    }
  }

  // Handle priority click
  const handlePrioritySelect = (priority: string) => {
    setFormData(prev => ({ ...prev, priority }))
  }

  // Form Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits"
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.source) newErrors.source = "Lead source is required"

    if (institutionType === 'school') {
      if (!formData.applyingFor) newErrors.applyingFor = "Applying grade is required"
    } else {
      if (!formData.course) newErrors.course = "Course selection is required"
    }

    if (!formData.counsellorId) newErrors.counsellorId = "Assigning a counsellor is required"
    if (!formData.followUpDate) newErrors.followUpDate = "Follow-up date is required"
    if (!formData.followUpTime) newErrors.followUpTime = "Follow-up time is required"
    if (!formData.priority) newErrors.priority = "Priority setting is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Scroll to first error helper
  const scrollToFirstError = (newErrors: Record<string, string>) => {
    const firstErrorKey = Object.keys(newErrors)[0]
    if (firstErrorKey) {
      const element = document.getElementsByName(firstErrorKey)[0]
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
      }
    }
  }

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const isValid = validateForm()
    if (isValid) {
      alert("Lead created successfully!")
      // Reset form or navigate
    } else {
      // Find errors and scroll
      const newErrors: Record<string, string> = {}
      if (!formData.firstName.trim()) newErrors.firstName = "firstName"
      if (!formData.lastName.trim()) newErrors.lastName = "lastName"
      if (!formData.phone.trim() || !/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = "phone"
      if (!formData.source) newErrors.source = "source"
      if (institutionType === 'school' && !formData.applyingFor) newErrors.applyingFor = "applyingFor"
      if (institutionType !== 'school' && !formData.course) newErrors.course = "course"
      if (!formData.counsellorId) newErrors.counsellorId = "counsellorId"
      if (!formData.followUpDate) newErrors.followUpDate = "followUpDate"
      if (!formData.followUpTime) newErrors.followUpTime = "followUpTime"
      scrollToFirstError(newErrors)
    }
  }

  // Check if all required fields are filled for enabling save button
  const isFormValidToSave = 
    formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' &&
    /^[0-9]{10}$/.test(formData.phone) &&
    formData.source !== '' &&
    (institutionType === 'school' ? formData.applyingFor !== '' : formData.course !== '') &&
    formData.counsellorId !== '' &&
    formData.followUpDate !== '' &&
    formData.followUpTime !== '' &&
    formData.priority !== ''

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

        {/* Sales & Marketing */}
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

        {/* Dynamic Admission module */}
        <button
          onClick={() => {
            setActiveNav("Module Management")
            if (isMobile) setMobileMenuOpen(false)
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${!isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""} ${activeNav === "Module Management"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
          title="Admission Management"
        >
          <ClipboardList className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`truncate ${!isMobile ? "md:hidden lg:inline" : ""}`}>Admission Management</span>
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

      {/* Sidebar Footer */}
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

  // Get user avatar initials
  const getInitials = () => {
    const f = formData.firstName.trim().charAt(0).toUpperCase()
    const l = formData.lastName.trim().charAt(0).toUpperCase()
    return (f || l) ? `${f}${l}` : '?'
  }

  // Get today's ISO date string
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex relative font-sans antialiased select-none">
      
      {/* 1. FIXED LEFT SIDEBAR */}
      <aside className="hidden md:flex w-16 lg:w-64 fixed inset-y-0 left-0 border-r border-slate-100 bg-white z-30 shadow-sm flex-col">
        <SidebarContent />
      </aside>

      {/* MOBILE TOP NAV BAR */}
      <header className="flex md:hidden h-14 bg-white border-b border-slate-100 px-4 items-center justify-between fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[#1565D8] shrink-0">
            <Shield className="w-5 h-5 fill-[#1565D8]" strokeWidth={1.5} />
          </div>
          <span className="text-xs min-[375px]:text-sm font-bold text-slate-800 tracking-tight truncate">
            Prince Matriculation School
          </span>
        </div>
        <span className="text-xs font-bold text-slate-800 shrink-0">Add New Lead</span>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </button>
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
                Add New Lead
              </h2>
              <p className="text-xs text-slate-400 truncate leading-relaxed">
                Sales & Marketing › Lead Management › Add New Lead
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
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
        <form onSubmit={handleSave} className="p-4 md:p-6 lg:p-8 pb-28 space-y-6 max-w-7xl mx-auto w-full bg-[#F8FAFC]">
          
          {/* PAGE TITLE ROW */}
          <section className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Link
                href="/lead-management"
                className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 cursor-pointer transition shrink-0"
              >
                <ChevronLeft className="size-[18px] text-slate-500" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Add New Lead
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Capture a new enquiry quickly
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/lead-management"
                className="border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-50 transition min-h-[42px] flex items-center justify-center"
              >
                Cancel
              </Link>
              <Button
                type="submit"
                className="bg-[#1565D8] text-white text-sm font-semibold px-5 py-2.5 h-auto rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
              >
                <Save className="size-4" />
                <span>Save Lead</span>
              </Button>
            </div>
          </section>

          {/* TWO COLUMN GRID LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            
            {/* LEFT COLUMN: FORM SECTIONS */}
            <div className="space-y-6">
              
              {/* FORM SECTION 1 — LEAD INFORMATION */}
              <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#1565D8] text-white text-xs font-bold flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    LEAD INFORMATION
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* First Name */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      First Name <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.firstName ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100' : 'border-slate-200'}`}
                    />
                    {errors.firstName && (
                      <span className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        <span>{errors.firstName}</span>
                      </span>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      Last Name <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.lastName ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100' : 'border-slate-200'}`}
                    />
                    {errors.lastName && (
                      <span className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        <span>{errors.lastName}</span>
                      </span>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      Phone Number <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        maxLength={10}
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={() => checkDuplicate(formData.phone)}
                        placeholder="10-digit mobile number"
                        className={`w-full bg-slate-50 border rounded-lg pl-4 pr-10 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.phone ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100' : /^[0-9]{10}$/.test(formData.phone) ? 'border-green-300 bg-green-50' : 'border-slate-200'}`}
                      />
                      {/^[0-9]{10}$/.test(formData.phone) && (
                        <CheckCircle2 className="size-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2 shrink-0" />
                      )}
                    </div>
                    {errors.phone && (
                      <span className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        <span>{errors.phone}</span>
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="email@example.com"
                        className={`w-full bg-slate-50 border rounded-lg pl-4 pr-10 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.email ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100' : formData.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'border-green-300 bg-green-50' : 'border-slate-200'}`}
                      />
                      {formData.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                        <CheckCircle2 className="size-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2 shrink-0" />
                      )}
                    </div>
                    {errors.email && (
                      <span className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        <span>{errors.email}</span>
                      </span>
                    )}
                  </div>

                  {/* Source selector (Full width) */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                      Source <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    
                    <div className="flex flex-wrap gap-2">
                      {sources.map(source => {
                        const isSelected = formData.source === source.label
                        return (
                          <div
                            key={source.id}
                            onClick={() => handleSourceSelect(source.label)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-150 ${isSelected ? 'border-[#1565D8] bg-blue-50 text-[#1565D8] ring-1 ring-[#1565D8]/20' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${source.dot}`} />
                            <span>{source.label}</span>
                          </div>
                        )
                      })}
                    </div>
                    {errors.source && (
                      <span className="text-xs text-red-500 font-medium mt-1.5 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        <span>{errors.source}</span>
                      </span>
                    )}
                  </div>
                </div>
              </Card>

              {/* FORM SECTION 2 — ENQUIRY DETAILS */}
              <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#1565D8] text-white text-xs font-bold flex items-center justify-center">
                    2
                  </div>
                  <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    ENQUIRY DETAILS
                  </h3>
                </div>

                {institutionType === 'school' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Applying For Grade */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        Applying For (Grade) <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <select
                        name="applyingFor"
                        value={formData.applyingFor}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.applyingFor ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200'}`}
                      >
                        <option value="">Select grade</option>
                        {grades.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                      {errors.applyingFor && (
                        <span className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          <span>{errors.applyingFor}</span>
                        </span>
                      )}
                    </div>

                    {/* Academic Year */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        Academic Year <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <select
                        name="academicYear"
                        value={formData.academicYear}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                      >
                        {academicYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    {/* Child's Name */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      Child&apos;s Name
                    </label>
                      <input
                        type="text"
                        name="childName"
                        value={formData.childName}
                        onChange={handleInputChange}
                        placeholder="Child's full name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                      />
                    </div>

                    {/* Child's Age */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      Child&apos;s Age
                    </label>
                      <input
                        type="number"
                        name="childAge"
                        min={3}
                        max={18}
                        value={formData.childAge}
                        onChange={handleInputChange}
                        placeholder="Age in years"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                      />
                    </div>

                    {/* Current School */}
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        Current School (if any)
                      </label>
                      <input
                        type="text"
                        name="currentSchool"
                        value={formData.currentSchool}
                        onChange={handleInputChange}
                        placeholder="Name of current school"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                      />
                    </div>

                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Course */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        Course / Program <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <select
                        name="course"
                        value={formData.course}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.course ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200'}`}
                      >
                        <option value="">Select course</option>
                        {courses.map(course => (
                          <option key={course} value={course}>{course}</option>
                        ))}
                      </select>
                      {errors.course && (
                        <span className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          <span>{errors.course}</span>
                        </span>
                      )}
                    </div>

                    {/* Batch */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        Batch / Timing
                      </label>
                      <select
                        name="batch"
                        value={formData.batch}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                      >
                        <option value="">Select batch</option>
                        {['Morning', 'Afternoon', 'Evening', 'Weekend'].map(batch => (
                          <option key={batch} value={batch}>{batch}</option>
                        ))}
                      </select>
                    </div>

                    {/* Student Age */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        Student Age / Level
                      </label>
                      <input
                        type="text"
                        name="studentAge"
                        value={formData.studentAge}
                        onChange={handleInputChange}
                        placeholder="e.g. 12 years / Beginner"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                      />
                    </div>

                    {/* Preferred Start Date */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        Preferred Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                      />
                    </div>
                  </div>
                )}
              </Card>

              {/* FORM SECTION 3 — ASSIGNMENT & FOLLOW-UP */}
              <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#1565D8] text-white text-xs font-bold flex items-center justify-center">
                    3
                  </div>
                  <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    ASSIGNMENT & FOLLOW-UP
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Assign Counsellor */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      Assign Counsellor <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <select
                      name="counsellorId"
                      value={formData.counsellorId}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.counsellorId ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200'}`}
                    >
                      <option value="">Select counsellor</option>
                      {counsellors.map((c: { id: string; name: string }) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.counsellorId && (
                      <span className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        <span>{errors.counsellorId}</span>
                      </span>
                    )}
                  </div>

                  {/* Lead Status */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      Lead Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                    >
                      {['New', 'Contacted', 'Follow-up'].map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Follow-up Date */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                      Follow-up Date <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="date"
                      name="followUpDate"
                      min={getTodayDateString()}
                      value={formData.followUpDate}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.followUpDate ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200'}`}
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">When should this lead be followed up?</span>
                    {errors.followUpDate && (
                      <span className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        <span>{errors.followUpDate}</span>
                      </span>
                    )}
                  </div>

                  {/* Follow-up Time */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      Follow-up Time <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <select
                      name="followUpTime"
                      value={formData.followUpTime}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.followUpTime ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200'}`}
                    >
                      <option value="">Select time</option>
                      {['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM'].map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    {errors.followUpTime && (
                      <span className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        <span>{errors.followUpTime}</span>
                      </span>
                    )}
                  </div>

                  {/* Priority Field */}
                  <div className="md:col-span-2 mt-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                      Priority <span className="text-red-500 ml-0.5">*</span>
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                      {[
                        { value: 'Normal', icon: CheckCircle2, border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-700', iconColor: 'text-blue-500' },
                        { value: 'High', icon: TrendingUp, border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-700', iconColor: 'text-amber-500' },
                        { value: 'Urgent', icon: Zap, border: 'border-red-300', bg: 'bg-red-50', text: 'text-red-700', iconColor: 'text-red-500' }
                      ].map(item => {
                        const isSelected = formData.priority === item.value
                        const Icon = item.icon
                        return (
                          <div
                            key={item.value}
                            onClick={() => handlePrioritySelect(item.value)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold cursor-pointer transition-all duration-150 ${isSelected ? `${item.border} ${item.bg} ${item.text} ring-1` : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'}`}
                          >
                            <Icon className={`size-3.5 ${isSelected ? item.iconColor : 'text-slate-400'}`} />
                            <span>{item.value}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                </div>
              </Card>

              {/* FORM SECTION 4 — NOTES */}
              <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#1565D8] text-white text-xs font-bold flex items-center justify-center">
                    4
                  </div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <span>NOTES</span>
                    <span className="text-xs text-slate-400 font-normal ml-1">(Optional)</span>
                  </h3>
                </div>

                <textarea
                  name="notes"
                  maxLength={500}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any additional notes about this lead, their requirements, or conversation summary..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                />
                
                <div className="flex justify-end mt-1.5">
                  <span className="text-xs text-slate-400">{formData.notes.length} / 500</span>
                </div>
              </Card>

            </div>

            {/* RIGHT COLUMN: PREVIEW PANEL */}
            <div className="space-y-4 lg:sticky lg:top-24">
              
              {/* CARD 1 — LEAD PREVIEW */}
              <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                  LEAD PREVIEW
                </h5>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                  
                  {/* Top row */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1565D8]/10 text-[#1565D8] text-sm font-bold flex items-center justify-center shrink-0">
                      {getInitials()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate">
                        {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : "New Lead"}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {institutionType === 'school' ? `Parent: ${formData.childName ? `Parent of ${formData.childName}` : '—'}` : (formData.phone || '—')}
                      </p>
                    </div>
                  </div>

                  {/* Details Rows */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    
                    {/* Grade / Course */}
                    <div className="flex items-center gap-2 text-xs">
                      <BookOpen className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-medium">
                        {institutionType === 'school' ? 'Grade' : 'Course'}
                      </span>
                      <span className="text-slate-700 font-semibold ml-auto truncate max-w-[120px]">
                        {(institutionType === 'school' ? formData.applyingFor : formData.course) || '—'}
                      </span>
                    </div>

                    {/* Source */}
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-medium">Source</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        {formData.source && (
                          <div className={`w-1.5 h-1.5 rounded-full ${sourceConfig[formData.source as keyof typeof sourceConfig]?.dot || 'bg-slate-400'}`} />
                        )}
                        <span className="text-slate-700 font-semibold">{formData.source || '—'}</span>
                      </div>
                    </div>

                    {/* Counsellor */}
                    <div className="flex items-center gap-2 text-xs">
                      <User className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-medium">Counsellor</span>
                      <span className="text-slate-700 font-semibold ml-auto truncate max-w-[120px]">
                        {counsellors.find((c: { id: string; name: string }) => c.id === formData.counsellorId)?.name || '—'}
                      </span>
                    </div>

                    {/* Follow-up */}
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-medium">Follow-up</span>
                      <span className="text-slate-700 font-semibold ml-auto">
                        {formData.followUpDate ? `${formData.followUpDate} ${formData.followUpTime ? `@ ${formData.followUpTime}` : ''}` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Status & Priority tags */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Status:</span>
                      <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConfig[formData.status as keyof typeof statusConfig]?.bg} ${statusConfig[formData.status as keyof typeof statusConfig]?.text}`}>
                        <span>{formData.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Priority:</span>
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formData.priority === 'High' ? 'bg-amber-50 text-amber-700' : formData.priority === 'Urgent' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                        <span>{formData.priority}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </Card>

              {/* CARD 2 — DUPLICATE CHECK */}
              <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  DUPLICATE CHECK
                </h5>

                {/* State A: No phone entered yet */}
                {!formData.phone && (
                  <div className="bg-slate-50 rounded-lg p-3 text-center space-y-2">
                    <Search className="size-[18px] text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400">
                      Enter phone number to check for duplicates
                    </p>
                  </div>
                )}

                {/* State B: Phone entered, no duplicate */}
                {formData.phone && !duplicateFound && (
                  <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                    <span className="text-xs font-semibold text-green-700">No duplicate found</span>
                  </div>
                )}

                {/* State C: Duplicate found */}
                {formData.phone && duplicateFound && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <TriangleAlert className="size-4 text-amber-500 shrink-0" />
                      <span className="text-xs font-bold text-amber-800">Possible duplicate found</span>
                    </div>

                    <div className="bg-white border border-amber-100 rounded-lg p-3 mt-2">
                      <h6 className="text-sm font-bold text-slate-800">{duplicateFound.name}</h6>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <span>{duplicateFound.applyingFor}</span>
                        <span>·</span>
                        <span>{duplicateFound.date}</span>
                        <span>·</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 bg-red-50 text-red-600 rounded`}>
                          {duplicateFound.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => alert("Viewing lead dashboard details...")}
                        className="border border-slate-200 text-slate-600 bg-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 w-full text-center cursor-pointer transition"
                      >
                        View Lead
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuplicateFound(null)}
                        className="border border-amber-300 text-amber-700 bg-amber-50 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-100 w-full text-center cursor-pointer transition"
                      >
                        Continue Anyway
                      </button>
                    </div>
                  </div>
                )}
              </Card>

              {/* CARD 3 — QUICK TIPS */}
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="size-4 text-blue-500 shrink-0" />
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
                    QUICK TIPS
                  </h5>
                </div>

                <ul className="space-y-2.5">
                  {[
                    "Phone number is required for WhatsApp connect",
                    "Assign a counsellor for faster lead follow-up",
                    "Set a follow-up date to never miss a lead",
                    "Add notes to capture important details from the conversation"
                  ].map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-blue-700 font-medium leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

          {/* STICKY SAVE FOOTER */}
          <div className="fixed bottom-0 left-0 md:left-16 lg:left-64 right-0 bg-white border-t border-slate-100 shadow-lg px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 z-40">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400 font-medium">
                * Required fields must be filled before saving
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/lead-management"
                className="border border-slate-200 text-slate-600 bg-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-50 transition min-h-[40px] cursor-pointer flex items-center justify-center"
              >
                Cancel
              </Link>
              <Button
                type="submit"
                disabled={!isFormValidToSave}
                className={`text-white text-sm font-semibold px-6 py-2.5 h-auto rounded-lg flex items-center gap-2 transition ${isFormValidToSave ? 'bg-[#1565D8] hover:bg-blue-700 cursor-pointer' : 'bg-[#1565D8]/50 opacity-50 cursor-not-allowed'}`}
              >
                <Save className="size-4" />
                <span>Save Lead</span>
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}
