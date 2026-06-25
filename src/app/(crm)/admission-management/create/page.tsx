"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  Save,
  ChevronLeft,
  Loader2,
  Info,
  AlertCircle
} from 'lucide-react'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar as UiCalendar } from "@/components/ui/calendar"
import { GRADE_OPTIONS } from '@/constants/grades'

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

export default function CreateAdmissionPage() {
  const router = useRouter()

  const [dbCounsellors, setDbCounsellors] = useState<{ id: string; name: string }[]>([])
  const [dbAcademicYears, setDbAcademicYears] = useState<{ id: string; name: string }[]>([])
  const [dbStages, setDbStages] = useState<{ id: string; name: string; isWon: boolean; isLost: boolean; sortOrder: number }[]>([])

  const [loadingOptions, setLoadingOptions] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Form states
  const [formData, setFormData] = useState({
    applicantName: '',
    parentName: '',
    phone: '',
    email: '',
    gradeSought: '',
    academicYearId: '',
    currentSchool: '',
    stageId: '',
    assignedToId: '',
    priority: 'MEDIUM',
    notes: '',
  })

  const [expectedJoinDate, setExpectedJoinDate] = useState<Date | undefined>(undefined)

  // Fetch counsellors, academic years, and pipeline stages on mount
  useEffect(() => {
    async function fetchOptions() {
      try {
        const [counsellorsRes, yearsRes, pipelineRes] = await Promise.all([
          fetch('/api/v1/users/counsellors'),
          fetch('/api/v1/settings/academic-year'),
          fetch('/api/v1/settings/pipeline')
        ])

        if (counsellorsRes.ok) {
          const json = await counsellorsRes.json()
          if (json.success && Array.isArray(json.data)) {
            setDbCounsellors(json.data)
          }
        }

        if (yearsRes.ok) {
          const json = await yearsRes.json()
          if (json.success && Array.isArray(json.data)) {
            setDbAcademicYears(json.data)
            // Pre-select current or first year
            const activeYear = json.data.find((y: any) => y.status === 'ACTIVE' || y.isCurrent === true)
            if (activeYear) {
              setFormData(prev => ({ ...prev, academicYearId: activeYear.id }))
            } else if (json.data.length > 0) {
              setFormData(prev => ({ ...prev, academicYearId: json.data[0].id }))
            }
          }
        }

        if (pipelineRes.ok) {
          const json = await pipelineRes.json()
          if (json.success && Array.isArray(json.data)) {
            setDbStages(json.data)
            // Pre-select first non-terminal stage
            const sortedStages = [...json.data].sort((a, b) => a.sortOrder - b.sortOrder)
            const firstNonTerminal = sortedStages.find(s => !s.isWon && !s.isLost)
            if (firstNonTerminal) {
              setFormData(prev => ({ ...prev, stageId: firstNonTerminal.id }))
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch options:', err)
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchOptions()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.applicantName.trim()) {
      setErrorMessage('Applicant Name (Child) is required')
      return
    }
    if (!formData.parentName.trim()) {
      setErrorMessage('Parent / Guardian Name is required')
      return
    }
    if (!formData.phone.trim() || formData.phone.trim().length !== 10) {
      setErrorMessage('A valid 10-digit phone number is required')
      return
    }
    if (!formData.gradeSought) {
      setErrorMessage('Applying grade is required')
      return
    }
    if (!formData.academicYearId) {
      setErrorMessage('Academic Year selection is required')
      return
    }
    if (!formData.stageId) {
      setErrorMessage('Initial stage selection is required')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const payload = {
        applicantName: formData.applicantName.trim(),
        parentName: formData.parentName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        gradeSought: formData.gradeSought || null,
        academicYearId: formData.academicYearId || null,
        stageId: formData.stageId || null,
        assignedToId: formData.assignedToId || null,
        priority: formData.priority,
        notes: formData.notes.trim() || null,
        expectedJoinDate: expectedJoinDate ? expectedJoinDate.toISOString() : null,
        currentSchool: formData.currentSchool.trim() || null
      }

      const res = await fetch('/api/v1/admissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to create admission record')
      }

      router.push(`/admission-management/${json.data.id}`)
    } catch (err: any) {
      console.error('Submit error:', err)
      setErrorMessage(err.message || 'Failed to create admission')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = Boolean(
    formData.applicantName.trim() &&
    formData.parentName.trim() &&
    formData.phone.trim().length === 10 &&
    formData.gradeSought &&
    formData.academicYearId &&
    formData.stageId
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-28 space-y-6 max-w-7xl mx-auto w-full select-none text-left">
      {/* PAGE TITLE ROW */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 cursor-pointer transition shrink-0"
          >
            <ChevronLeft className="size-[18px] text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Add New Admission
            </h1>
            <p className="text-sm text-slate-400 mt-0.5 font-sans">
              Create an admission record manually
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-slate-200 bg-white text-slate-650 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer min-h-[42px] font-sans"
          >
            Cancel
          </button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`text-white text-sm font-semibold px-5 py-2.5 h-auto rounded-lg flex items-center gap-2 transition ${isSubmitting ? 'opacity-70 cursor-not-allowed bg-[#1565D8]' : (isFormValid ? 'bg-[#1565D8] hover:bg-blue-700 cursor-pointer' : 'bg-[#1565D8]/50 opacity-50 cursor-not-allowed')}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin size-4 mr-2" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Create Admission Record</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* THREE COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN — Applicant Details */}
        <div className="space-y-6">
          {/* CARD 1 — APPLICANT INFORMATION */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 font-sans uppercase tracking-wider">
              Applicant Information
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Applicant Name (Child) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="applicantName"
                  value={formData.applicantName}
                  onChange={handleInputChange}
                  placeholder="Child's full name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Parent / Guardian Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleInputChange}
                  placeholder="Parent name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                />
              </div>
            </div>
          </Card>

          {/* CARD 2 — ENROLLMENT DETAILS */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 font-sans uppercase tracking-wider">
              Enrollment Details
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Applying For Grade <span className="text-red-500">*</span>
                </label>
                <select
                  name="gradeSought"
                  value={formData.gradeSought}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                  required
                >
                  <option value="">Select Grade</option>
                  {GRADE_OPTIONS.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <select
                  name="academicYearId"
                  value={formData.academicYearId}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                  required
                >
                  <option value="">Select Academic Year</option>
                  {dbAcademicYears.map(y => (
                    <option key={y.id} value={y.id}>{y.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Current School (if any)
                </label>
                <input
                  type="text"
                  name="currentSchool"
                  value={formData.currentSchool}
                  onChange={handleInputChange}
                  placeholder="Previous school"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block font-sans">
                  Expected Join Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-[40px] px-3.5 text-sm border border-slate-200 rounded-lg bg-slate-50 hover:bg-white flex items-center gap-2 text-slate-700 text-left focus:outline-none focus:border-[#1565D8] transition"
                    >
                      <CalendarDays size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="flex-1 truncate font-medium">
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
              </div>
            </div>
          </Card>
        </div>

        {/* CENTER COLUMN — Assignment */}
        <div className="space-y-6">
          {/* CARD 1 — PIPELINE & ASSIGNMENT */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 font-sans uppercase tracking-wider">
              Pipeline & Assignment
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Initial Stage <span className="text-red-500">*</span>
                </label>
                <select
                  name="stageId"
                  value={formData.stageId}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                  required
                >
                  <option value="">Select Stage</option>
                  {dbStages.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.isWon ? '(Won)' : s.isLost ? '(Lost)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Assigned Counsellor
                </label>
                <select
                  name="assignedToId"
                  value={formData.assignedToId}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                >
                  <option value="">Unassigned</option>
                  {dbCounsellors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
          </Card>

          {/* CARD 2 — NOTES */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 font-sans uppercase tracking-wider">
              Notes
            </h3>
            <div>
              <textarea
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any notes about this applicant..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:bg-white transition"
              />
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN — Actions */}
        <div className="space-y-6">
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 font-sans uppercase tracking-wider">
              Actions
            </h3>

            <div className="space-y-2">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className={`w-full text-white text-sm font-bold h-10 rounded-lg flex items-center justify-center gap-2 transition ${isSubmitting ? 'opacity-70 cursor-not-allowed bg-[#1565D8]' : (isFormValid ? 'bg-[#1565D8] hover:bg-blue-700 cursor-pointer' : 'bg-[#1565D8]/50 opacity-50 cursor-not-allowed')}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin size-4 mr-2" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Admission Record</span>
                )}
              </Button>

              <button
                type="button"
                onClick={() => router.back()}
                className="w-full h-9 border border-slate-200 bg-white text-slate-650 text-sm font-semibold rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center font-sans">
              Fields marked <span className="text-red-500 font-bold">*</span> are required
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
