"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronDown,
  CalendarDays,
  AlertCircle,
  TriangleAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react'
const format = (dateInput: any, formatStr: string): string => {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return String(dateInput)

  const day = date.getDate()
  const monthList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  if (formatStr === 'd MMM yyyy') {
    return `${day} ${monthList[date.getMonth()]} ${date.getFullYear()}`
  }
  return date.toLocaleDateString()
}

import { Card } from "@/components/ui/card"
import { GRADE_OPTIONS } from '@/constants/grades'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import RecordSkeleton from '@/components/shared/RecordSkeleton'

import LeadPageHeader from '@/components/leads/LeadPageHeader'
import { mapGradeValue } from '@/lib/utils/gradeMapping'

const sourceOptions = [
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'PHONE', label: 'Phone Enquiry' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'WEBSITE', label: 'School Website' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'OTHER', label: 'Other' }
]

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' }
]

const statusOptions = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'FOLLOW_UP_PENDING', label: 'Follow-up' },
  { value: 'NOT_INTERESTED', label: 'Rejected' },
]

const timeOptions = [
  { value: "09:00 AM", label: "9:00 AM" },
  { value: "09:30 AM", label: "9:30 AM" },
  { value: "10:00 AM", label: "10:00 AM" },
  { value: "10:30 AM", label: "10:30 AM" },
  { value: "11:00 AM", label: "11:00 AM" },
  { value: "11:30 AM", label: "11:30 AM" },
  { value: "12:00 PM", label: "12:00 PM" },
  { value: "12:30 PM", label: "12:30 PM" },
  { value: "01:00 PM", label: "1:00 PM" },
  { value: "01:30 PM", label: "1:30 PM" },
  { value: "02:00 PM", label: "2:00 PM" },
  { value: "02:30 PM", label: "2:30 PM" },
  { value: "03:00 PM", label: "3:00 PM" },
  { value: "03:30 PM", label: "3:30 PM" },
  { value: "04:00 PM", label: "4:00 PM" },
  { value: "04:30 PM", label: "4:30 PM" },
  { value: "05:00 PM", label: "5:00 PM" },
  { value: "05:30 PM", label: "5:30 PM" },
  { value: "06:00 PM", label: "6:00 PM" },
  { value: "06:30 PM", label: "6:30 PM" },
]

export default function EditLeadPage() {
  const router = useRouter()
  const params = useParams()
  const leadId = params?.id as string

  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dbCounsellors, setDbCounsellors] = useState<{ id: string; name: string }[]>([])
  const [dbAcademicYears, setDbAcademicYears] = useState<{ id: string; name: string; status: string }[]>([])

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
  })

  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined)
  const [followUpTime, setFollowUpTime] = useState('10:00 AM')

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

  // Fetch lead details and counsellors on mount
  useEffect(() => {
    if (!leadId) return

    async function fetchLead() {
      try {
        const res = await fetch(`/api/v1/leads/${leadId}`)
        if (!res.ok) throw new Error('Lead not found')
        const json = await res.json()
        setLead(json.data)
      } catch (err) {
        console.error('Failed to fetch lead', err)
        showToast('Failed to fetch lead details', 'error')
      } finally {
        setLoading(false)
      }
    }

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

    async function fetchAcademicYears() {
      try {
        const res = await fetch('/api/v1/settings/academic-year')
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          setDbAcademicYears(json.data)
        }
      } catch (err) {
        console.error('Failed to fetch academic years', err)
      }
    }

    fetchLead()
    fetchCounsellors()
    fetchAcademicYears()
  }, [leadId])

  // Sync lead details to local states
  useEffect(() => {
    if (lead) {
      setFormData({
        parentName: lead.parentName || lead.studentName || '',
        phone: lead.phone || '',
        email: lead.email || '',
        kidName: lead.kidName || '',
        childAge: lead.childAge || '',
        currentSchool: lead.currentSchool || '',
        source: lead.source || 'WALK_IN',
        priority: lead.priority || 'MEDIUM',
        status: lead.status || 'NEW',
        gradeSought: mapGradeValue(lead.gradeSought),
        academicYearId: lead.academicYearId || '',
        assignedToId: lead.assignedToId || '',
        notes: lead.notes || '',
      })

      if (lead.nextFollowUpAt) {
        const dateObj = new Date(lead.nextFollowUpAt)
        setFollowUpDate(dateObj)

        let hours = dateObj.getHours()
        const minutes = String(dateObj.getMinutes()).padStart(2, '0')
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12
        setFollowUpTime(`${String(hours).padStart(2, '0')}:${minutes} ${ampm}`)
      }
    }
  }, [lead])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev }
        delete copy[field]
        return copy
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.parentName.trim()) {
      newErrors.parentName = "Parent/Guardian name is required"
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Invalid Indian mobile number (must start with 6-9 and be exactly 10 digits)"
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.source) newErrors.source = "Lead source is required"
    if (!formData.gradeSought) newErrors.gradeSought = "Applying grade is required"
    if (!formData.assignedToId) newErrors.assignedToId = "Assigning a counsellor is required"
    if (!followUpDate) newErrors.followUpDate = "Follow-up date is required"
    if (!followUpTime) newErrors.followUpTime = "Follow-up time is required"
    if (!formData.priority) newErrors.priority = "Priority setting is required"

    setErrors(newErrors)
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors }
  }

  const handleSave = async () => {
    const { isValid } = validateForm()
    if (!isValid) {
      showToast("Please fill all required fields correctly.", "error")
      return
    }

    setSubmitting(true)
    try {
      const academicYearId = formData.academicYearId || null

      // Parse and combine follow-up date and time
      let nextFollowUpAt: string | null = null
      if (followUpDate) {
        let nextFollowUpDate = new Date(followUpDate)
        if (followUpTime) {
          const [hoursStr, minutesStrWithAmPm] = followUpTime.split(':')
          const [minutesStr, ampm] = minutesStrWithAmPm.split(' ')
          let hours = parseInt(hoursStr)
          const minutes = parseInt(minutesStr)
          if (ampm === 'PM' && hours < 12) hours += 12
          if (ampm === 'AM' && hours === 12) hours = 0
          nextFollowUpDate.setHours(hours, minutes, 0, 0)
        }
        nextFollowUpAt = nextFollowUpDate.toISOString()
      }

      // Split parentName into firstName and lastName
      const parts = formData.parentName.trim().split(/\s+/)
      const firstName = parts[0] || ''
      const lastName = parts.slice(1).join(' ') || ''

      const res = await fetch(
        `/api/v1/leads/${leadId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstName,
            lastName,
            phone: formData.phone,
            email: formData.email || null,
            source: formData.source,
            status: formData.status,
            priority: formData.priority,
            gradeSought: formData.gradeSought || null,
            kidName: formData.kidName || null,
            assignedToId: formData.assignedToId || null,
            nextFollowUpAt,
            notes: formData.notes || null,
            academicYearId,
            childAge: formData.childAge || null,
            currentSchool: formData.currentSchool || null,
            siblingInSchool: lead?.siblingInSchool ?? false,
          })
        }
      )

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to update lead')
      }

      showToast('Lead is updated successfully')
      router.push(`/lead-management/${leadId}`)

    } catch (err: any) {
      showToast(err.message ?? 'Failed to update lead', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <RecordSkeleton />
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-50/30 text-slate-800 flex flex-col">
      <LeadPageHeader
        mode="edit"
        lead={lead}
        isSubmitting={submitting}
        onSave={handleSave}
        onCancel={() => router.back()}
      />

      {/* THREE COLUMN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4 md:h-[calc(100vh-116px)] h-auto overflow-hidden">
        
        {/* LEFT COLUMN */}
        <div className="overflow-y-auto overflow-x-hidden space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pb-4">
          
          {/* CARD 1 — CONTACT DETAILS */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">
              CONTACT DETAILS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Lead Name (Parent Name) <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => handleChange('parentName', e.target.value)}
                  placeholder="Parent / Guardian name"
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
                />
                {errors.parentName && (
                  <span className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.parentName}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Phone Number <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
                />
                {errors.phone && (
                  <span className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.phone}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Email address"
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
                />
                {errors.email && (
                  <span className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.email}</span>
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* CARD 2 — STUDENT PROFILE */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">
              STUDENT PROFILE
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Child Name
                </label>
                <input
                  type="text"
                  value={formData.kidName}
                  onChange={(e) => handleChange('kidName', e.target.value)}
                  placeholder="Child's full name"
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Child Age
                </label>
                <input
                  type="number"
                  min="1" max="25"
                  value={formData.childAge}
                  onChange={(e) => handleChange('childAge', e.target.value)}
                  placeholder="Age in years"
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Current School
                </label>
                <input
                  type="text"
                  value={formData.currentSchool}
                  onChange={(e) => handleChange('currentSchool', e.target.value)}
                  placeholder="Current school name"
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10"
                />
              </div>
            </div>
          </Card>

          {/* CARD 3 — LEAD DETAILS */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">
              LEAD DETAILS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Source <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.source}
                    onChange={(e) => handleChange('source', e.target.value)}
                    className="w-full h-9 px-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] appearance-none cursor-pointer"
                  >
                    {sourceOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex-shrink-0" size={13}/>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Priority <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="w-full h-9 px-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] appearance-none cursor-pointer"
                  >
                    {priorityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex-shrink-0" size={13}/>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Applying For Grade <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.gradeSought}
                    onChange={(e) => handleChange('gradeSought', e.target.value)}
                    className="w-full h-9 px-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] appearance-none cursor-pointer"
                  >
                    <option value="">Select Grade</option>
                    {GRADE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex-shrink-0" size={13}/>
                </div>
                {errors.gradeSought && (
                  <span className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.gradeSought}</span>
                  </span>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Academic Year
                </label>
                <div className="relative">
                  <select
                    value={formData.academicYearId}
                    onChange={(e) => handleChange('academicYearId', e.target.value)}
                    className="w-full h-9 px-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] appearance-none cursor-pointer"
                  >
                    <option value="">Select Academic Year</option>
                    {dbAcademicYears.map(year => (
                      <option key={year.id} value={year.id}>{year.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex-shrink-0" size={13}/>
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Assigned Counsellor <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => handleChange('assignedToId', e.target.value)}
                    className="w-full h-9 px-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] appearance-none cursor-pointer"
                  >
                    <option value="">Select Counsellor</option>
                    {dbCounsellors.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex-shrink-0" size={13}/>
                </div>
                {errors.assignedToId && (
                  <span className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.assignedToId}</span>
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* CENTER COLUMN */}
        <div className="overflow-y-auto overflow-x-hidden space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pb-4">
          
          {/* CARD 1 — FOLLOW-UP SCHEDULING */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">
              SCHEDULE FOLLOW-UP
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Follow-up Date <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button"
                      className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white flex items-center gap-2 text-slate-700 text-left focus:outline-none focus:border-[#1565D8]">
                      <CalendarDays size={13} className="text-slate-400 flex-shrink-0"/>
                      <span className="flex-1 truncate text-sm">
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
                    className="z-[9999] w-auto p-0 shadow-xl rounded-xl border border-slate-200">
                    <Calendar
                      mode="single"
                      selected={followUpDate}
                      onSelect={setFollowUpDate}
                      initialFocus/>
                  </PopoverContent>
                </Popover>
                {errors.followUpDate && (
                  <span className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.followUpDate}</span>
                  </span>
                )}
                {followUpDate && (
                  (() => {
                    const day = new Date(followUpDate).getDay()
                    const isWeekend = day === 0 || day === 6
                    return isWeekend && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1.5 flex items-center gap-1.5">
                        <TriangleAlert size={11} className="text-amber-500" />
                        <span className="text-[10px] text-amber-700 font-medium">Selected date is a weekend.</span>
                      </div>
                    )
                  })()
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                  Follow-up Time <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full h-9 px-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] appearance-none cursor-pointer"
                  >
                    {timeOptions.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13}/>
                </div>
                {errors.followUpTime && (
                  <span className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.followUpTime}</span>
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* CARD 2 — NOTES */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">
              NOTES
            </div>
            
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add internal notes about this lead..."
              className="w-full resize-none border border-slate-200 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:border-[#1565D8]"
            />
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="overflow-y-auto overflow-x-hidden space-y-3 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pb-4 md:col-span-2 xl:col-span-1">
          
          {/* CARD 1 — ASSIGNMENT */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">
              ASSIGNMENT
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1">
                Lead Status
              </label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full h-9 px-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] appearance-none cursor-pointer"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex-shrink-0" size={13}/>
              </div>
            </div>
          </Card>

          {/* CARD 2 — SAVE ACTIONS */}
          <Card className="bg-white border border-slate-200 rounded-xl p-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="w-full h-10 text-sm font-semibold bg-[#1565D8] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin size-4" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="w-full h-9 text-sm font-medium border border-slate-200 text-slate-650 rounded-xl hover:bg-slate-50 mt-2 transition cursor-pointer"
            >
              Cancel
            </button>

            <p className="text-xs text-slate-400 mt-3 text-center">
              All fields marked * are required
            </p>
          </Card>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <div 
            className="flex items-center gap-3 bg-slate-800 text-white rounded-xl px-6 py-4 shadow-2xl min-w-[320px] pointer-events-auto transform transition-all duration-300 animate-in fade-in zoom-in-95"
          >
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-green-400 shrink-0" strokeWidth={1.5} />}
            {toast.type === 'info' && <Info size={18} className="text-blue-400 shrink-0" strokeWidth={1.5} />}
            {toast.type === 'error' && <XCircle size={18} className="text-red-400 shrink-0" strokeWidth={1.5} />}
            
            <span className="text-sm font-semibold font-sans">{toast.message}</span>
            
            <button 
              type="button"
              onClick={() => setToast(t => ({ ...t, show: false }))} 
              className="ml-auto text-slate-400 hover:text-slate-200 cursor-pointer pl-2"
            >
              <XCircle size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
