"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  TrendingUp,
  Users,
  Shield,
  ChevronDown,
  Search,
  Bell,
  Menu,
  X,
  CheckCircle2,
  Calendar,
  Save,
  AlertCircle,
  Lightbulb,
  Zap,
  BookOpen,
  MapPin,
  User,
  TriangleAlert,
  ChevronLeft,
  Megaphone,
  Circle,
  XCircle,
  Info,
  Loader2
} from 'lucide-react'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GRADE_OPTIONS } from '@/constants/grades'

// ===================================================================
// DATA CONSTANTS — FULL UPDATE
// ===================================================================
const institutionType = 'school'

const getCurrentAcademicYear = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  return month >= 3 
    ? `AY ${year}-${(year + 1).toString().slice(2)}`
    : `AY ${year - 1}-${year.toString().slice(2)}`
}

const academicYears = [
  `${getCurrentAcademicYear()} (Current)`,
  `AY ${new Date().getFullYear() + 1}-${(new Date().getFullYear() + 2).toString().slice(2)} (Upcoming)`,
  `AY ${new Date().getFullYear() - 1}-${new Date().getFullYear().toString().slice(2)} (Previous)`,
]

// grades are imported from @/constants/grades

const courses = [
  'Bharatanatyam',
  'Hip Hop',
  'Guitar - Beginner',
  'Guitar - Advanced',
  'Keyboard',
  'Vocals',
  'Yoga - Morning',
  'Yoga - Evening',
  'Zumba',
  'Karate',
  'Swimming',
]

const sources = [
  { id: 'vidhyaan',
    label: 'Vidhyaan',
    dot: 'bg-blue-500' },
  { id: 'walkin',
    label: 'Walk-in',
    dot: 'bg-teal-500' },
  { id: 'phone_enquiry',
    label: 'Phone Enquiry',
    dot: 'bg-purple-500' },
  { id: 'whatsapp',
    label: 'WhatsApp',
    dot: 'bg-green-500' },
  { id: 'school_website',
    label: 'School Website',
    dot: 'bg-slate-400' },
  { id: 'social_media',
    label: 'Social Media',
    dot: 'bg-pink-500' },
  { id: 'referral',
    label: 'Referral',
    dot: 'bg-amber-500' },
  { id: 'education_fair',
    label: 'Education Fair',
    dot: 'bg-indigo-500' },
  { id: 'newspaper_ad',
    label: 'Newspaper Ad',
    dot: 'bg-orange-500' },
  { id: 'google_ad',
    label: 'Google Ad',
    dot: 'bg-red-500' },
  { id: 'other',
    label: 'Other',
    dot: 'bg-slate-300' },
]

const statusOptions = [
  'New',
  'Contacted',
  'Interested',
  'Follow-up Pending',
  'Converted',
  'Not Interested',
]

const priorityOptions = [
  { value: 'Normal',
    icon: 'Circle',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200' },
  { value: 'High',
    icon: 'TrendingUp',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200' },
  { value: 'Urgent',
    icon: 'Zap',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200' },
]

const counsellors = [
  { id: '1', name: 'Saran Kumar' },
  { id: '2', name: 'Pradeep Kumar' },
  { id: '3', name: 'Vimal Das' },
]

const campaigns = [
  { id: '1', name: 'Summer Admission 2026' },
  { id: '2', name: 'Open Day May 2026' },
  { id: '3', name: 'WhatsApp Campaign Apr 2026' },
]

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM',
  '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM',
  '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM',
  '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM',
]

const generateLeadId = () => {
  const year = new Date().getFullYear()
  const seq = Math.floor(
    Math.random() * 90000
  ) + 10000
  return `LD-${year}-${seq}`
}

const existingLeads = [
  {
    name: 'Vimal Das',
    phone: '9884185362',
    applyingFor: 'LKG',
    date: '18 May 2026',
    status: 'Not Interested',
    id: 'LD-2026-00001',
  },
]

const sourceUiToDb: Record<string, string> = {
  'Vidhyaan': 'VIDHYAAN',
  'Walk-in': 'WALK_IN',
  'Phone Enquiry': 'PHONE',
  'WhatsApp': 'WHATSAPP',
  'School Website': 'WEBSITE',
  'Social Media': 'SOCIAL_MEDIA',
  'Referral': 'REFERRAL',
  'Education Fair': 'EVENT',
  'Newspaper Ad': 'NEWSPAPER',
  'Google Ad': 'GOOGLE_ADS',
  'Other': 'OTHER'
}

const statusUiToDb: Record<string, string> = {
  'New': 'NEW',
  'Contacted': 'CONTACTED',
  'Interested': 'INTERESTED',
  'Follow-up Pending': 'FOLLOW_UP_PENDING',
  'Converted': 'CONVERTED',
  'Not Interested': 'NOT_INTERESTED'
}

const priorityUiToDb: Record<string, string> = {
  'Normal': 'MEDIUM',
  'High': 'HIGH',
  'Urgent': 'URGENT'
}

export default function AddLeadPage() {
  const router = useRouter()

  // Navigation/Layout states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    source: '',
    applyingFor: '',
    academicYear: academicYears[0],
    childName: '',
    childAge: '',
    currentSchool: '',
    course: '',
    batch: '',
    studentAge: '',
    startDate: '',
    siblingInSchool: false,
    expectedJoinDate: '',
    campaignId: '',
    counsellorId: '',
    status: 'New',
    followUpDate: '',
    followUpTime: '',
    priority: 'Normal',
    notes: '',
  })

  // Auto-generate Lead ID on page load
  const [leadId] = useState(generateLeadId)

  const [duplicateFound, setDuplicateFound] = useState<typeof existingLeads[0] | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [noteType, setNoteType] = useState('General')
  const noteTypes = [
    'General', 'Call', 'Meeting',
    'WhatsApp', 'Email', 'Site Visit',
  ]

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

  // Check duplicate phone logic
  const checkDuplicate = async (phone: string) => {
    if (phone.length !== 10) return
    try {
      const res = await fetch('/api/v1/leads?search=' + phone)
      const json = await res.json()
      if (json.data && json.data.length > 0) {
        const lead = json.data[0]
        setDuplicateWarning(
          'A lead with this phone number already exists: ' +
          lead.parentName
        )
        setDuplicateFound({
          name: lead.parentName || '—',
          phone: lead.phone || '—',
          applyingFor: lead.gradeSought || '—',
          date: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }) : '—',
          status: lead.status || 'NEW',
          id: lead.id
        })
      } else {
        setDuplicateWarning(null)
        setDuplicateFound(null)
      }
    } catch (err) {
      console.error('Duplicate check failed', err)
    }
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
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const isValid = validateForm()
    if (!isValid) {
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
      return
    }

    setSubmitting(true)
    try {
      // Parse and combine follow-up date and time
      let nextFollowUpAt: string | null = null
      if (formData.followUpDate) {
        let nextFollowUpDate = new Date(formData.followUpDate)
        if (formData.followUpTime) {
          const [hoursStr, minutesStrWithAmPm] = formData.followUpTime.split(':')
          const [minutesStr, ampm] = minutesStrWithAmPm.split(' ')
          let hours = parseInt(hoursStr)
          const minutes = parseInt(minutesStr)
          if (ampm === 'PM' && hours < 12) hours += 12
          if (ampm === 'AM' && hours === 12) hours = 0
          nextFollowUpDate.setHours(hours, minutes, 0, 0)
        }
        nextFollowUpAt = nextFollowUpDate.toISOString()
      }

      const res = await fetch(
        '/api/v1/leads',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            email: formData.email || null,
            source: sourceUiToDb[formData.source] || 'OTHER',
            status: statusUiToDb[formData.status] || 'NEW',
            priority: priorityUiToDb[formData.priority] || 'MEDIUM',
            gradeSought: formData.applyingFor || null,
            kidName: formData.childName || null,
            assignedToId: formData.counsellorId || null,
            nextFollowUpAt,
            notes: formData.notes || null,
            childAge: formData.childAge || null,
            currentSchool: formData.currentSchool || null,
            expectedJoinDate: formData.expectedJoinDate ? new Date(formData.expectedJoinDate).toISOString() : null,
            siblingInSchool: formData.siblingInSchool,
            course: formData.course || null,
            batch: formData.batch || null,
            studentAge: formData.studentAge || null,
            startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null
          })
        }
      )

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to create lead')
      }

      if (json.data?.queued) {
        showToast(
          'Lead saved to queue. Upgrade to access queued leads.',
          'info'
        )
      } else {
        showToast('Lead created successfully')
      }

      router.push('/lead-management')

    } catch (err: any) {
      showToast(err.message ?? 'Failed to create lead', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const isFormValid = Boolean(
    (formData.firstName?.trim() || (formData as any).parentName?.trim()) &&
    formData.phone?.trim() &&
    formData.phone.length === 10 &&
    formData.source
  )

  const buttonDisabled = !isFormValid || submitting

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
    <>
      <form onSubmit={handleSave} className="p-4 md:p-6 lg:p-8 pb-28 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* PAGE TITLE ROW */}
          <section className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 cursor-pointer transition shrink-0"
              >
                <ChevronLeft className="size-[18px] text-slate-500" />
              </button>
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
              <button
                type="button"
                onClick={() => router.push('/lead-management')}
                className="border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-50 transition min-h-[42px] flex items-center justify-center cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={buttonDisabled}
                className={`text-white text-sm font-semibold px-5 py-2.5 h-auto rounded-lg flex items-center gap-2 transition ${submitting ? 'opacity-70 cursor-not-allowed bg-[#1565D8]' : (!buttonDisabled ? 'bg-[#1565D8] hover:bg-blue-700 cursor-pointer' : 'bg-[#1565D8]/50 opacity-50 cursor-not-allowed')}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin size-4 mr-2" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>Save Lead</span>
                  </>
                )}
              </Button>
            </div>
          </section>

          {/* TWO COLUMN GRID LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            
            {/* LEFT COLUMN: FORM SECTIONS */}
            <div className="space-y-6">
              
              {/* FORM SECTION 1 — LEAD INFORMATION */}
              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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
              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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
                        {GRADE_OPTIONS.map(grade => (
                          <option key={grade.value} value={grade.value}>{grade.label}</option>
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

                    {/* Expected Join Date */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        EXPECTED JOIN DATE
                      </label>
                      <input
                        type="date"
                        name="expectedJoinDate"
                        min={getTodayDateString()}
                        value={formData.expectedJoinDate}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        When does the parent expect the child to join?
                      </p>
                    </div>

                    {/* Sibling enrolled in school */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                        SIBLING ALREADY ENROLLED
                      </label>
                      <div
                        onClick={() => setFormData(prev => ({ ...prev, siblingInSchool: !prev.siblingInSchool }))}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer mt-1"
                      >
                        <span className="text-sm text-slate-600 pr-2">
                          Does the applicant have a sibling currently enrolled in this school?
                        </span>
                        <div className={`w-11 h-6 rounded-full relative shrink-0 transition-colors duration-200 ${formData.siblingInSchool ? 'bg-[#1565D8]' : 'bg-slate-200'}`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${formData.siblingInSchool ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                      {formData.siblingInSchool && (
                        <div className="bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 w-fit">
                          ✓ Sibling enrolled — higher conversion likelihood
                        </div>
                      )}
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
              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
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
                      {statusOptions.map(status => (
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
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.followUpDate}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.followUpDate ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200'}`}
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">When should this lead be followed up?</span>
                    {formData.followUpDate && (
                      (() => {
                        const day = new Date(formData.followUpDate).getDay()
                        const isWeekend = day === 0 || day === 6
                        return isWeekend && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1.5 flex items-center gap-2">
                            <TriangleAlert size={13} className="text-amber-500" />
                            <span className="text-xs text-amber-700 font-medium">Selected date is a weekend. Are you sure?</span>
                          </div>
                        )
                      })()
                    )}
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
                      {timeSlots.map(slot => (
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
                      {priorityOptions.map(item => {
                        const isSelected = formData.priority === item.value
                        const Icon = item.icon === 'Circle' ? Circle : (item.icon === 'TrendingUp' ? TrendingUp : Zap)
                        const iconColor = item.value === 'High' ? 'text-amber-500' : item.value === 'Urgent' ? 'text-red-500' : 'text-blue-500'
                        return (
                          <div
                            key={item.value}
                            onClick={() => handlePrioritySelect(item.value)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold cursor-pointer transition-all duration-150 ${isSelected ? `${item.border} ${item.bg} ${item.text} ring-1` : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'}`}
                          >
                            <Icon className={`size-3.5 ${isSelected ? iconColor : 'text-slate-400'}`} />
                            <span>{item.value}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Campaign dropdown selector */}
                  <div className="md:col-span-2 mt-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      CAMPAIGN (OPTIONAL)
                    </label>
                    <select
                      name="campaignId"
                      value={formData.campaignId}
                      onChange={handleInputChange}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                    >
                      <option value="">None — no campaign</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Link this lead to a marketing campaign for tracking ROI
                    </p>
                  </div>

                </div>
              </Card>

              {/* FORM SECTION 4 — NOTES */}
              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 rounded-full bg-[#1565D8] text-white text-xs font-bold flex items-center justify-center">
                    4
                  </div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <span>NOTES</span>
                    <span className="text-xs text-slate-400 font-normal ml-1">(Optional)</span>
                  </h3>
                </div>

                {/* Note Type tags */}
                <div className="mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                    NOTE TYPE
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {noteTypes.map(type => {
                      const isSelected = noteType === type
                      return (
                        <div
                          key={type}
                          onClick={() => setNoteType(type)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer transition ${isSelected ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >
                          {type}
                        </div>
                      )
                    })}
                  </div>
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
              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                  LEAD PREVIEW
                </h5>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                  
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
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    
                    {/* Lead ID */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-medium">Lead ID</span>
                      <span className="ml-auto font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {leadId}
                      </span>
                    </div>

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
                          <div className={`w-1.5 h-1.5 rounded-full ${sources.find(s => s.label === formData.source)?.dot || 'bg-slate-400'}`} />
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
                  <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Status:</span>
                      {(() => {
                        const statusConfig = {
                          'New': { bg: 'bg-blue-50', text: 'text-blue-700' },
                          'Contacted': { bg: 'bg-amber-50', text: 'text-amber-700' },
                          'Interested': { bg: 'bg-purple-50', text: 'text-purple-700' },
                          'Follow-up Pending': { bg: 'bg-orange-50', text: 'text-orange-700' },
                          'Converted': { bg: 'bg-green-50', text: 'text-green-700' },
                          'Not Interested': { bg: 'bg-red-50', text: 'text-red-600' },
                        }
                        const config = statusConfig[formData.status as keyof typeof statusConfig] || { bg: 'bg-slate-50', text: 'text-slate-600' }
                        return (
                          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                            <span>{formData.status}</span>
                          </div>
                        )
                      })()}
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
              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
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

              {/* SIBLING STATUS card */}
              {formData.siblingInSchool && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="size-[15px] text-green-600" strokeWidth={1.5} />
                    <span className="text-sm font-bold text-green-700">Sibling Enrolled</span>
                  </div>
                  <p className="text-xs text-green-600 leading-relaxed">
                    This applicant has a sibling currently in this school. Conversion likelihood is significantly higher.
                  </p>
                </div>
              )}

              {/* CAMPAIGN card */}
              {formData.campaignId && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Megaphone className="size-[15px] text-blue-600" strokeWidth={1.5} />
                    <span className="text-sm font-bold text-blue-700">Linked Campaign</span>
                  </div>
                  <p className="text-xs text-blue-600">
                    {campaigns.find(c => c.id === formData.campaignId)?.name}
                  </p>
                </div>
              )}

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
                    "Phone required for WhatsApp connect",
                    "Assign a counsellor immediately for faster follow-up",
                    "Set follow-up before saving — never miss a lead",
                    "Link to a campaign to track marketing ROI",
                    "Mark sibling if family already enrolled — boosts priority"
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
          <div className="fixed bottom-0 left-0 md:left-[var(--sidebar-width,256px)] right-0 bg-white border-t border-slate-200 shadow-lg px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 z-40 transition-[left] duration-200">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Lead ID:</span>
              <span className="text-xs font-bold font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                {leadId}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">
                * Required fields
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/lead-management')}
                className="border border-slate-200 text-slate-600 bg-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-50 transition min-h-[40px] cursor-pointer flex items-center justify-center"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={buttonDisabled}
                className={`text-white text-sm font-semibold px-6 py-2.5 h-auto rounded-lg flex items-center gap-2 transition ${submitting ? 'opacity-70 cursor-not-allowed bg-[#1565D8]' : (!buttonDisabled ? 'bg-[#1565D8] hover:bg-blue-700 cursor-pointer' : 'bg-[#1565D8]/50 opacity-50 cursor-not-allowed')}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin size-4 mr-2" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>Save Lead</span>
                  </>
                )}
              </Button>
            </div>
          </div>

        </form>

        {/* TOAST NOTIFICATION */}
        <div 
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 transform transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'}`}
        >
          <div className="flex items-center gap-3 bg-slate-800 text-white rounded-xl px-5 py-3 shadow-2xl min-w-[280px]">
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-green-400" strokeWidth={1.5} />}
            {toast.type === 'info' && <Info size={16} className="text-blue-400" strokeWidth={1.5} />}
            {toast.type === 'error' && <XCircle size={16} className="text-red-400" strokeWidth={1.5} />}
            
            <span className="text-sm font-semibold font-sans">{toast.message}</span>
            
            <button 
              type="button"
              onClick={() => setToast(t => ({ ...t, show: false }))} 
              className="ml-auto text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

    </>
  )
}
