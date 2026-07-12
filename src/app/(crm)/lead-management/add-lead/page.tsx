"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  CalendarDays,
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar as UiCalendar } from "@/components/ui/calendar"
import { GRADE_OPTIONS } from '@/constants/grades'
import { mapGradeValue } from '@/lib/utils/gradeMapping'
import { DedupDialog, DedupPayload } from "@/components/dedup/DedupDialog"
import { institutionMode } from '@/lib/institution'

const format = (date: Date, formatStr: string): string => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  if (formatStr === 'yyyy-MM-dd') {
    return `${yyyy}-${mm}-${dd}`
  }
  if (formatStr === 'd MMM yyyy') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${date.getDate()} ${months[date.getMonth()]} ${yyyy}`
  }
  return date.toLocaleDateString()
}

const sources = [
  { id: 'VIDHYAAN', label: 'Vidhyaan', dot: 'bg-blue-500' },
  { id: 'WALK_IN', label: 'Walk-in', dot: 'bg-teal-500' },
  { id: 'PHONE', label: 'Phone Enquiry', dot: 'bg-purple-500' },
  { id: 'WHATSAPP', label: 'WhatsApp', dot: 'bg-green-500' },
  { id: 'WEBSITE', label: 'School Website', dot: 'bg-slate-400' },
  { id: 'SOCIAL_MEDIA', label: 'Social Media', dot: 'bg-pink-500' },
  { id: 'REFERRAL', label: 'Referral', dot: 'bg-amber-500' },
  { id: 'EVENT', label: 'Education Fair', dot: 'bg-indigo-500' },
  { id: 'NEWSPAPER', label: 'Newspaper Ad', dot: 'bg-orange-500' },
  { id: 'GOOGLE_ADS', label: 'Google Ad', dot: 'bg-red-500' },
  { id: 'OTHER', label: 'Other', dot: 'bg-slate-300' },
]

const statusOptions = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'FOLLOW_UP_PENDING', label: 'Follow-up Pending' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
]

const priorityOptions = [
  { value: 'MEDIUM', label: 'Normal', icon: 'Circle', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { value: 'HIGH', label: 'High', icon: 'TrendingUp', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { value: 'URGENT', label: 'Urgent', icon: 'Zap', bg: 'bg-red-50', text: 'text-red-650', border: 'border-red-200' },
]

// Fallback only — real courses are fetched from the org's course catalogue.
const DEFAULT_COURSES = [
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

const timeSlots = [
  { value: '09:00', label: '9:00 AM' },
  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '14:30', label: '2:30 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '15:30', label: '3:30 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '16:30', label: '4:30 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '17:30', label: '5:30 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '18:30', label: '6:30 PM' },
]


// The real lead code is generated server-side on save (nextLeadCode); the
// form shows a neutral placeholder rather than a fabricated number, and a
// deterministic value avoids the SSR/client hydration mismatch Math.random caused.
const LEAD_ID_PLACEHOLDER = 'Assigned on save' 

export default function AddLeadPage() {
  const router = useRouter()

  const [dbCounsellors, setDbCounsellors] = useState<{ id: string; name: string }[]>([])
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([])
  const [dbAcademicYears, setDbAcademicYears] = useState<{ id: string; name: string }[]>([])
  // Real institution type drives grade vs course/batch fields (was hardcoded 'school').
  const [institutionType, setInstitutionType] = useState<'school' | 'learning_center'>('school')
  // Real course catalogue for learning centres (fallback to the sample list).
  const [courses, setCourses] = useState<string[]>(DEFAULT_COURSES)

  // Fetch counsellors and academic years on mount
  useEffect(() => {
    async function fetchCounsellors() {
      try {
        const res = await fetch('/api/v1/counsellors')
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          setDbCounsellors(json.data)
        }
      } catch (err) {
        console.error('Failed to fetch counsellors', err)
      }
    }

    async function fetchCampaigns() {
      try {
        const res = await fetch('/api/v1/campaigns?limit=50')
        const json = await res.json()
        if (Array.isArray(json.data)) {
          setCampaigns(json.data.map((c: any) => ({ id: c.id, name: c.name })))
        }
      } catch (err) {
        console.error('Failed to fetch campaigns', err)
      }
    }

    async function fetchInstitutionType() {
      try {
        const res = await fetch('/api/v1/school-profile')
        const json = await res.json()
        if (json.success && json.school?.institutionType) {
          setInstitutionType(institutionMode(json.school.institutionType))
        }
      } catch (err) {
        console.error('Failed to fetch institution type', err)
      }
    }

    async function fetchCourses() {
      try {
        const res = await fetch('/api/v1/settings/courses')
        const json = await res.json()
        const names = (json.data ?? []).map((c: any) => c.name).filter(Boolean)
        if (names.length > 0) setCourses(names)
      } catch (err) {
        console.error('Failed to fetch courses', err)
      }
    }

    async function fetchAcademicYears() {
      try {
        const res = await fetch('/api/v1/settings/academic-year')
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          setDbAcademicYears(json.data)
          // Default to the org's active year so new leads never land year-less
          const active = json.data.find((y: any) => y.status === 'ACTIVE')
          if (active) {
            setFormData(prev => prev.academicYearId ? prev : { ...prev, academicYearId: active.id })
          }
        }
      } catch (err) {
        console.error('Failed to fetch academic years', err)
      }
    }

    fetchCounsellors()
    fetchCampaigns()
    fetchAcademicYears()
    fetchInstitutionType()
    fetchCourses()
  }, [])

  // Form states
  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    email: '',
    kidName: '',
    childAge: '',
    currentSchool: '',
    source: 'WALK_IN',
    priority: 'MEDIUM',
    status: 'NEW',
    gradeSought: '',
    academicYearId: '',
    assignedToId: '',
    notes: '',
    siblingInSchool: false,
    campaignId: '',
    course: '',
    batch: '',
    studentAge: '',
    startDate: '',
  })

  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined)
  const [followUpTime, setFollowUpTime] = useState('09:00')
  const [expectedJoinDate, setExpectedJoinDate] = useState<Date | undefined>(undefined)

  // Auto-generate Lead ID on page load
  const leadId = LEAD_ID_PLACEHOLDER

  const [duplicateFound, setDuplicateFound] = useState<any>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dedup, setDedup] = useState<DedupPayload | null>(null)

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

    if (!formData.parentName.trim()) newErrors.parentName = "Parent name is required"
    
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
      if (!formData.gradeSought) newErrors.gradeSought = "Applying grade is required"
    } else {
      if (!formData.course) newErrors.course = "Course selection is required"
    }

    if (!formData.assignedToId) newErrors.counsellorId = "Assigning a counsellor is required"
    if (!followUpDate) newErrors.followUpDate = "Follow-up date is required"
    if (!followUpTime) newErrors.followUpTime = "Follow-up time is required"
    if (!formData.priority) newErrors.priority = "Priority setting is required"

    setErrors(newErrors)
    return newErrors
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
  // Handle Save
  const handleSubmit = async () => {
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      scrollToFirstError(newErrors)
      showToast('Please fill the required fields', 'error')
      return
    }

    submit(false)
  }

  const submit = async (force = false) => {
    setIsSubmitting(true)

    try {
      let nextFollowUpAt: string | null = null

      if (followUpDate) {
        const dateStr = format(followUpDate, 'yyyy-MM-dd')
        const timeStr = followUpTime || '09:00'
        nextFollowUpAt = new Date(`${dateStr}T${timeStr}:00`).toISOString()
      }

      const payload = {
        parentName: formData.parentName.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || null,
        kidName: formData.kidName?.trim() || null,
        childAge: formData.childAge
          ? parseInt(formData.childAge.toString())
          : null,
        currentSchool: formData.currentSchool?.trim() || null,
        source: formData.source || 'WALK_IN',
        priority: formData.priority || 'MEDIUM',
        status: 'NEW',
        gradeSought: institutionType === 'school' ? (formData.gradeSought || null) : null,
        course: institutionType === 'learning_center' ? (formData.course || null) : null,
        batch: institutionType === 'learning_center' ? (formData.batch || null) : null,
        academicYearId: formData.academicYearId || null,
        assignedToId: formData.assignedToId || null,
        notes: formData.notes?.trim() || null,
        nextFollowUpAt,
        expectedJoinDate: expectedJoinDate ? expectedJoinDate.toISOString() : null,
        ...(force ? { force: true } : {}),
      }

      const res = await fetch(
        '/api/v1/leads',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const errorData = await res.json()
        // Duplicate detected — show the match picker instead of a toast.
        if (errorData.code === 'CONFLICT' && errorData.details?.dedup) {
          setDedup(errorData.details.dedup)
          return
        }
        console.error('API error:', errorData)
        throw new Error(
          errorData.message || 'Failed to create lead'
        )
      }

      const created = await res.json()

      setDedup(null)
      showToast('Lead created successfully')

      // API envelope is { success, data: lead }
      const newLeadId = created.data?.id ?? created.id
      if (newLeadId) {
        router.push(`/lead-management/${newLeadId}`)
      } else {
        router.push('/lead-management')
      }

    } catch (err: any) {
      console.error('Submit error:', err)
      showToast(err.message || 'Failed to create lead', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Save stays clickable so an incomplete form surfaces inline field errors
  // via validateForm() instead of a silently disabled button.
  const buttonDisabled = isSubmitting

  // Get user avatar initials
  const getInitials = () => {
    const parts = formData.parentName.trim().split(/\s+/)
    const f = parts[0]?.charAt(0).toUpperCase() || ''
    const l = parts[1]?.charAt(0).toUpperCase() || ''
    return (f || l) ? `${f}${l}` : '?'
  }

  // Get today's ISO date string
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0]
  }

  return (
    <>
      <DedupDialog
        payload={dedup}
        onClose={() => setDedup(null)}
        onForce={() => submit(true)}
        busy={isSubmitting}
      />
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-4 md:p-6 lg:p-8 pb-28 space-y-6 max-w-7xl mx-auto w-full">
          
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
                type="button"
                onClick={handleSubmit}
                disabled={buttonDisabled}
                className={`text-white text-sm font-semibold px-5 py-2.5 h-auto rounded-lg flex items-center gap-2 transition ${isSubmitting ? 'opacity-70 cursor-not-allowed bg-[#1565D8]' : (!buttonDisabled ? 'bg-[#1565D8] hover:bg-blue-700 cursor-pointer' : 'bg-[#1565D8]/50 opacity-50 cursor-not-allowed')}`}
              >
                {isSubmitting ? (
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
                  
                  {/* Parent Name */}
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                      Parent / Guardian Name <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleInputChange}
                      placeholder="Enter parent/guardian name"
                      className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.parentName ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100' : 'border-slate-200'}`}
                    />
                    {errors.parentName && (
                      <span className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        <span>{errors.parentName}</span>
                      </span>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
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
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
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
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                      Source <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    
                    <div className="flex flex-wrap gap-2">
                      {sources.map(source => {
                        const isSelected = formData.source === source.id
                        return (
                          <div
                            key={source.id}
                            onClick={() => handleSourceSelect(source.id)}
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
              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-visible">
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
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                        Applying For (Grade) <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <select
                        name="gradeSought"
                        value={formData.gradeSought}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.gradeSought ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200'}`}
                      >
                        <option value="">Select grade</option>
                        {GRADE_OPTIONS.map(grade => (
                          <option key={grade.value} value={grade.value}>{grade.label}</option>
                        ))}
                      </select>
                      {errors.gradeSought && (
                        <span className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          <span>{errors.gradeSought}</span>
                        </span>
                      )}
                    </div>

                    {/* Academic Year */}
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                        Academic Year
                      </label>
                      <select
                        name="academicYearId"
                        value={formData.academicYearId}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                      >
                        <option value="">Select Academic Year</option>
                        {dbAcademicYears.map(year => (
                          <option key={year.id} value={year.id}>{year.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Child's Name */}
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                        Child&apos;s Name
                      </label>
                      <input
                        type="text"
                        name="kidName"
                        value={formData.kidName}
                        onChange={handleInputChange}
                        placeholder="Child's full name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                      />
                    </div>

                    {/* Child's Age */}
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                        Child&apos;s Age
                      </label>
                      <input
                        type="number"
                        name="childAge"
                        min={1}
                        max={25}
                        value={formData.childAge}
                        onChange={handleInputChange}
                        placeholder="Age in years"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                      />
                    </div>

                    {/* Current School */}
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
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
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                        EXPECTED JOIN DATE
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white flex items-center gap-2 text-slate-700 text-left focus:outline-none focus:border-[#1565D8]"
                          >
                            <CalendarDays size={13} className="text-slate-400 flex-shrink-0" />
                            <span className="flex-1 truncate">
                              {expectedJoinDate
                                ? format(expectedJoinDate, 'd MMM yyyy')
                                : 'Select date'}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          avoidCollisions={true}
                          collisionPadding={16}
                          sideOffset={4}
                          className="z-[9999] w-auto p-0 shadow-xl rounded-xl border border-slate-200"
                        >
                          <UiCalendar
                            mode="single"
                            selected={expectedJoinDate}
                            onSelect={setExpectedJoinDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-[11px] text-slate-400 mt-1">
                        When does the parent expect the child to join?
                      </p>
                    </div>

                    {/* Sibling enrolled in school */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
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
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
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
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
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
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
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
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
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
              <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-visible">
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
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                      Assign Counsellor <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <select
                      name="counsellorId"
                      value={formData.assignedToId}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedToId: e.target.value }))}
                      className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.counsellorId ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200'}`}
                    >
                      <option value="">Select counsellor</option>
                      {dbCounsellors.map((c: { id: string; name: string }) => (
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
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                      Lead Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition"
                    >
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Follow-up Date */}
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                      Follow-up Date <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={`w-full h-9 px-3 text-sm border rounded-lg bg-white flex items-center gap-2 text-slate-700 text-left focus:outline-none focus:border-[#1565D8] ${errors.followUpDate ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                        >
                          <CalendarDays size={13} className="text-slate-400 flex-shrink-0" />
                          <span className="flex-1 truncate">
                            {followUpDate
                              ? format(followUpDate, 'd MMM yyyy')
                              : 'Select date'}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        avoidCollisions={true}
                        collisionPadding={16}
                        sideOffset={4}
                        className="z-[9999] w-auto p-0 shadow-xl rounded-xl border border-slate-200"
                      >
                        <UiCalendar
                          mode="single"
                          selected={followUpDate}
                          onSelect={setFollowUpDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-[11px] text-slate-400 mt-1 block">When should this lead be followed up?</span>
                    {followUpDate && (
                      (() => {
                        const day = new Date(followUpDate).getDay()
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
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                      Follow-up Time <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <select
                      name="followUpTime"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      className={`w-full bg-slate-50 border rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition ${errors.followUpTime ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-slate-200'}`}
                    >
                      <option value="">Select time</option>
                      {timeSlots.map(slot => (
                        <option key={slot.value} value={slot.value}>{slot.label}</option>
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
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                      Priority <span className="text-red-500 ml-0.5">*</span>
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                      {priorityOptions.map(item => {
                        const isSelected = formData.priority === item.value
                        const Icon = item.icon === 'Circle' ? Circle : (item.icon === 'TrendingUp' ? TrendingUp : Zap)
                        const iconColor = item.value === 'HIGH' ? 'text-amber-500' : item.value === 'URGENT' ? 'text-red-500' : 'text-blue-500'
                        return (
                          <div
                            key={item.value}
                            onClick={() => handlePrioritySelect(item.value)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold cursor-pointer transition-all duration-150 ${isSelected ? `${item.border} ${item.bg} ${item.text} ring-1` : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'}`}
                          >
                            <Icon className={`size-3.5 ${isSelected ? iconColor : 'text-slate-400'}`} />
                            <span>{item.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Campaign dropdown selector */}
                  <div className="md:col-span-2 mt-4">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
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
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
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
                        {formData.parentName.trim() || "New Lead"}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {institutionType === 'school' ? `Parent: ${formData.kidName ? `Parent of ${formData.kidName}` : '—'}` : (formData.phone || '—')}
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
                        {GRADE_OPTIONS.find(g => g.value === formData.gradeSought)?.label || '—'}
                      </span>
                    </div>

                    {/* Source */}
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-medium">Source</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        {formData.source && (
                          <div className={`w-1.5 h-1.5 rounded-full ${sources.find(s => s.id === formData.source)?.dot || 'bg-slate-400'}`} />
                        )}
                        <span className="text-slate-700 font-semibold">{sources.find(s => s.id === formData.source)?.label || '—'}</span>
                      </div>
                    </div>

                    {/* Counsellor */}
                    <div className="flex items-center gap-2 text-xs">
                      <User className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-medium">Counsellor</span>
                      <span className="text-slate-700 font-semibold ml-auto truncate max-w-[120px]">
                        {dbCounsellors.find((c: { id: string; name: string }) => c.id === formData.assignedToId)?.name || '—'}
                      </span>
                    </div>

                    {/* Follow-up */}
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-medium">Follow-up</span>
                      <span className="text-slate-700 font-semibold ml-auto">
                        {followUpDate ? `${format(followUpDate, 'yyyy-MM-dd')} ${followUpTime ? `@ ${timeSlots.find(t => t.value === followUpTime)?.label || ''}` : ''}` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Status & Priority tags */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Status:</span>
                      {(() => {
                        const statusConfig = {
                          'NEW': { bg: 'bg-blue-50', text: 'text-blue-700' },
                          'CONTACTED': { bg: 'bg-amber-50', text: 'text-amber-700' },
                          'INTERESTED': { bg: 'bg-purple-50', text: 'text-purple-700' },
                          'FOLLOW_UP_PENDING': { bg: 'bg-orange-50', text: 'text-orange-700' },
                          'CONVERTED': { bg: 'bg-green-50', text: 'text-green-700' },
                          'NOT_INTERESTED': { bg: 'bg-red-50', text: 'text-red-600' },
                        }
                        const config = statusConfig[formData.status as keyof typeof statusConfig] || { bg: 'bg-slate-50', text: 'text-slate-600' }
                        return (
                          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                            <span>{statusOptions.find(s => s.value === formData.status)?.label || formData.status}</span>
                          </div>
                        )
                      })()}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Priority:</span>
                      {(() => {
                        const config = priorityOptions.find(p => p.value === formData.priority) || priorityOptions[0]
                        return (
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                            <span>{config.label}</span>
                          </div>
                        )
                      })()}
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
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 bg-red-50 text-red-650 rounded`}>
                          {duplicateFound.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/lead-management/${duplicateFound.id}`)}
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
                type="button"
                onClick={handleSubmit}
                disabled={buttonDisabled}
                className={`text-white text-sm font-semibold px-6 py-2.5 h-auto rounded-lg flex items-center gap-2 transition ${isSubmitting ? 'opacity-70 cursor-not-allowed bg-[#1565D8]' : (!buttonDisabled ? 'bg-[#1565D8] hover:bg-blue-700 cursor-pointer' : 'bg-[#1565D8]/50 opacity-50 cursor-not-allowed')}`}
              >
                {isSubmitting ? (
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
