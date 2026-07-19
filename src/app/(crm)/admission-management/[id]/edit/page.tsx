"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  CalendarDays,
  Save,
  ChevronLeft,
  Loader2,
  Info,
  AlertCircle,
  ChevronDown
} from 'lucide-react'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar as UiCalendar } from "@/components/ui/calendar"
import { GRADE_OPTIONS } from '@/constants/grades'
import { AppSelect } from '@/components/ui/app-select'

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

export default function EditAdmissionPage() {
  const router = useRouter()
  const params = useParams()
  const admissionId = params?.id as string

  const [dbCounsellors, setDbCounsellors] = useState<{ id: string; name: string }[]>([])
  const [dbAcademicYears, setDbAcademicYears] = useState<{ id: string; name: string }[]>([])
  const [dbStages, setDbStages] = useState<{ id: string; name: string; isWon: boolean; isLost: boolean; sortOrder: number }[]>([])

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Read-only info from fetched record
  const [admissionCode, setAdmissionCode] = useState('')
  const [status, setStatus] = useState('')

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
          }
        }

        if (pipelineRes.ok) {
          const json = await pipelineRes.json()
          if (json.success && Array.isArray(json.data)) {
            setDbStages(json.data)
          }
        }
      } catch (err) {
        console.error('Failed to fetch options:', err)
      }
    }

    fetchOptions()
  }, [])

  // Fetch existing admission details
  useEffect(() => {
    if (!admissionId) return

    async function fetchAdmissionDetails() {
      try {
        const res = await fetch(`/api/v1/admissions/${admissionId}`)
        if (!res.ok) throw new Error('Failed to load admission details')
        const json = await res.json()
        const data = json.data

        if (data) {
          setAdmissionCode(data.admissionCode || '')
          setStatus(data.status || '')
          setFormData({
            applicantName: data.applicantName || '',
            parentName: data.parentName || data.lead?.parentName || '',
            phone: data.phone || '',
            email: data.email || '',
            gradeSought: data.gradeSought || '',
            academicYearId: data.academicYearId || '',
            currentSchool: data.currentSchool || '',
            stageId: data.stageId || '',
            assignedToId: data.assignedToId || '',
            priority: data.priority || 'MEDIUM',
            notes: '',
          })
          if (data.expectedJoinDate) {
            setExpectedJoinDate(new Date(data.expectedJoinDate))
          }
        }
      } catch (err: any) {
        console.error(err)
        setErrorMessage(err.message || 'Failed to load details')
      } finally {
        setLoading(false)
      }
    }

    fetchAdmissionDetails()
  }, [admissionId])

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

      const res = await fetch(`/api/v1/admissions/${admissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to update admission record')
      }

      router.push(`/admission-management/${admissionId}`)
    } catch (err: any) {
      console.error('Submit error:', err)
      setErrorMessage(err.message || 'Failed to update admission')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#1565D8]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col select-none text-left">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 cursor-pointer transition shrink-0"
          >
            <ChevronLeft className="size-[18px] text-slate-500" />
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900">
              Edit Admission
            </span>
            <span className="text-xs text-slate-400">
              Update details for {formData.applicantName}
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-8 px-4 text-sm font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition cursor-pointer font-sans"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`h-8 px-4 text-sm font-semibold text-white rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              isSubmitting ? 'opacity-70 bg-[#1565D8]' : (isFormValid ? 'bg-[#1565D8] hover:bg-blue-700' : 'bg-[#1565D8]/50 opacity-50 cursor-not-allowed')
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={13} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 pb-24 lg:pb-4">
        
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          
          {/* CARD 1 — APPLICANT INFORMATION */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100 mb-3">
              Applicant Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                  Applicant Name (Child) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="applicantName"
                  value={formData.applicantName}
                  onChange={handleInputChange}
                  placeholder="Child's full name"
                  className="w-full h-10 lg:h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 transition-all font-sans"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                  Parent / Guardian <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleInputChange}
                  placeholder="Parent name"
                  className="w-full h-10 lg:h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 transition-all font-sans"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile"
                  className="w-full h-10 lg:h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 transition-all font-sans"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  className="w-full h-10 lg:h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 transition-all font-sans"
                />
              </div>
            </div>
          </Card>

          {/* CARD 2 — ENROLLMENT DETAILS */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100 mb-3">
              Enrollment Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                  Applying For Grade <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <AppSelect
                    name="gradeSought"
                    value={formData.gradeSought}
                    onChange={handleInputChange}
                    className="w-full h-10 lg:h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none pr-8 transition-all font-sans cursor-pointer"
                    required
                  >
                    <option value="">Select Grade</option>
                    {GRADE_OPTIONS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </AppSelect>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                  Academic Year
                </label>
                <div className="relative">
                  <AppSelect
                    name="academicYearId"
                    value={formData.academicYearId}
                    onChange={handleInputChange}
                    className="w-full h-10 lg:h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none pr-8 transition-all font-sans cursor-pointer"
                  >
                    <option value="">Select Academic Year</option>
                    {dbAcademicYears.map(y => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </AppSelect>
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                  Current School
                </label>
                <input
                  type="text"
                  name="currentSchool"
                  value={formData.currentSchool}
                  onChange={handleInputChange}
                  placeholder="Previous school details"
                  className="w-full h-10 lg:h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 transition-all font-sans"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold block mb-1 font-sans">
                  Expected Join Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-10 lg:h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 flex items-center justify-between text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 transition-all font-sans font-medium"
                    >
                      <span className="truncate font-semibold text-slate-700">
                        {expectedJoinDate
                          ? format(expectedJoinDate, 'd MMM yyyy')
                          : 'Select Expected Date'}
                      </span>
                      <CalendarDays size={14} className="text-slate-400 pointer-events-none" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="z-[9999] w-auto p-0 shadow-xl rounded-xl border border-slate-200 bg-white"
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

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          
          {/* CARD 1 — PIPELINE & ASSIGNMENT */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100 mb-3">
              Pipeline & Assignment
            </h3>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Stage
              </label>
              <div className="relative">
                <AppSelect
                  name="stageId"
                  value={formData.stageId}
                  onChange={handleInputChange}
                  className="w-full h-10 lg:h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none pr-8 transition-all font-sans cursor-pointer"
                >
                  <option value="">Select Stage</option>
                  {dbStages.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </AppSelect>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Assigned Counsellor
              </label>
              <div className="relative">
                <AppSelect
                  name="assignedToId"
                  value={formData.assignedToId}
                  onChange={handleInputChange}
                  className="w-full h-10 lg:h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none pr-8 transition-all font-sans cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {dbCounsellors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </AppSelect>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Priority
              </label>
              <div className="relative">
                <AppSelect
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full h-10 lg:h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none pr-8 transition-all font-sans cursor-pointer"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </AppSelect>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                CURRENT STATUS
              </span>
              <div className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                status === 'ADMITTED' ? 'border-green-200 bg-green-50 text-green-800' :
                status === 'REJECTED' ? 'border-red-200 bg-red-50 text-red-800' :
                'border-amber-200 bg-amber-50 text-amber-800'
              }`}>
                {status}
              </div>
            </div>
          </Card>

          {/* CARD 2 — NOTES */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100 mb-3">
              Notes
            </h3>
            <div>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Internal notes..."
                className="w-full p-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 transition-all font-sans"
              />
            </div>
          </Card>
        </div>
      </div>

      {/* MOBILE STICKY SAVE BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex gap-3 z-30 lg:hidden shadow-lg">
        <button
          onClick={() => router.back()}
          className="flex-1 h-11 border border-slate-200 text-slate-650 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer transition flex items-center justify-center bg-white"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className={`flex-1 h-11 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
            isSubmitting ? 'opacity-70 bg-[#1565D8] cursor-not-allowed' : (isFormValid ? 'bg-[#1565D8] hover:bg-blue-700 cursor-pointer' : 'bg-[#1565D8]/50 opacity-50 cursor-not-allowed')
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>Saving...</span>
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  )
}
