"use client"

import React, { useState, useEffect } from 'react'
import { ClipboardList, Lock, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'

interface LeadRecord {
  id: string
  leadCode: string
  parentName: string
  kidName?: string | null
  phone: string
  email?: string | null
  gradeSought?: string | null
  academicYearId?: string | null
  assignedToId?: string | null
  priority?: string | null
  notes?: string | null
}

interface ConvertToAdmissionModalProps {
  lead: LeadRecord | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (admissionId: string) => void
}

export default function ConvertToAdmissionModal({
  lead,
  isOpen,
  onClose,
  onSuccess,
}: ConvertToAdmissionModalProps) {
  // Form fields
  const [applicantName, setApplicantName] = useState('')
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [gradeSought, setGradeSought] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [stageId, setStageId] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [notes, setNotes] = useState('')

  // Validation / interaction states
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // API list states
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [pipelineStages, setPipelineStages] = useState<any[]>([])
  const [counsellors, setCounsellors] = useState<any[]>([])

  // Fetch API options on mount
  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      try {
        // Academic Years
        const yearsRes = await fetch('/api/v1/settings/academic-year')
        const yearsData = await yearsRes.json()
        if (yearsRes.ok && yearsData.success) {
          const yearsList = yearsData.data || []
          setAcademicYears(yearsList)

          // Pre-select active year
          const activeYear = yearsList.find(
            (y: any) => y.status === 'ACTIVE' || y.isCurrent === true
          )
          if (activeYear) {
            setAcademicYearId((prev) => prev || activeYear.id)
          }
        }

        // Pipeline Stages
        const pipelineRes = await fetch('/api/v1/settings/pipeline')
        const pipelineData = await pipelineRes.json()
        if (pipelineRes.ok && pipelineData.success) {
          const stagesList = pipelineData.data || []
          setPipelineStages(stagesList)

          // Pre-select first non-terminal stage
          const firstNonTerminal = stagesList
            .filter((s: any) => !s.isWon && !s.isLost)
            .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))[0]
          if (firstNonTerminal) {
            setStageId(firstNonTerminal.id)
          }
        }

        // Counsellors
        const counsellorsRes = await fetch('/api/v1/users/counsellors')
        const counsellorsData = await counsellorsRes.json()
        if (counsellorsRes.ok && counsellorsData.success) {
          setCounsellors(counsellorsData.data || [])
        }
      } catch (err) {
        console.error('Error fetching conversion config data:', err)
      }
    }

    fetchData()
  }, [isOpen])

  // Prefill fields when lead updates
  useEffect(() => {
    if (!isOpen || !lead) return

    setApplicantName(lead.kidName || lead.parentName || '')
    setParentName(lead.parentName || '')
    setPhone(lead.phone || '')
    setEmail(lead.email || '')
    setGradeSought(lead.gradeSought || '')
    setAssignedToId(lead.assignedToId || '')
    setNotes(lead.notes || '')
    setAcademicYearId(lead.academicYearId || '')
    
    // Clear validation states
    setTouched({})
    setSubmitAttempted(false)
    setError('')
  }, [lead, isOpen])

  // Touch handlers
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // Inline validations
  const getError = (field: string, value: string) => {
    if (field === 'applicantName' && !value.trim()) {
      return 'Applicant name is required'
    }
    if (field === 'parentName' && !value.trim()) {
      return 'Parent name is required'
    }
    if (field === 'phone' && !value.trim()) {
      return 'Phone number is required'
    }
    if (field === 'gradeSought' && !value) {
      return 'Grade is required'
    }
    if (field === 'academicYearId' && !value) {
      return 'Academic year is required'
    }
    if (field === 'stageId' && !value) {
      return 'Initial stage is required'
    }
    return ''
  }

  const isFieldInvalid = (field: string, value: string) => {
    const err = getError(field, value)
    return err ? (touched[field] || submitAttempted) : false
  }

  // Form validity
  const isFormValid =
    !getError('applicantName', applicantName) &&
    !getError('parentName', parentName) &&
    !getError('phone', phone) &&
    !getError('gradeSought', gradeSought) &&
    !getError('academicYearId', academicYearId) &&
    !getError('stageId', stageId)

  const handleSubmit = async () => {
    setSubmitAttempted(true)
    if (!isFormValid || !lead) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/v1/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName,
          parentName,
          phone,
          email: email || undefined,
          gradeSought,
          leadId: lead.id,
          assignedToId: assignedToId || undefined,
          academicYearId: academicYearId || undefined,
          stageId: stageId || undefined,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to convert lead')
      }

      onSuccess(data.data.id)
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to convert lead')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl w-full rounded-2xl p-6 text-left max-h-[95vh] overflow-y-auto bg-white">
        <DialogHeader className="flex flex-row items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <ClipboardList size={22} />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold font-sans text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Convert to Admission
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Creating admission record from lead #{lead?.leadCode}
            </p>
          </div>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          
          {/* COLUMN 1: APPLICANT INFO */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 font-sans">
              Applicant Information
            </h4>

            {/* Field 1: Applicant Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-sans">
                Applicant Name (Child) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                onBlur={() => handleBlur('applicantName')}
                placeholder="Child / Applicant name"
                className={`w-full h-10 px-3 bg-white border rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                  isFieldInvalid('applicantName', applicantName)
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200'
                }`}
              />
              <p className="text-[11px] text-slate-400 mt-1">Enter child&apos;s name</p>
              {isFieldInvalid('applicantName', applicantName) && (
                <p className="text-xs text-red-500 mt-1">{getError('applicantName', applicantName)}</p>
              )}
            </div>

            {/* Field 2: Parent Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-sans">
                Parent / Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                onBlur={() => handleBlur('parentName')}
                placeholder="Parent / Guardian Name"
                className={`w-full h-10 px-3 bg-white border rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                  isFieldInvalid('parentName', parentName)
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200'
                }`}
              />
              {isFieldInvalid('parentName', parentName) && (
                <p className="text-xs text-red-500 mt-1">{getError('parentName', parentName)}</p>
              )}
            </div>

            {/* Field 3: Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-sans flex items-center justify-between">
                <span>Phone Number <span className="text-red-500">*</span></span>
                <Lock size={12} className="text-slate-400" />
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  readOnly
                  className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans text-slate-500 cursor-not-allowed focus:outline-none"
                  placeholder="Phone"
                />
              </div>
            </div>

            {/* Field 4: Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-sans">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* COLUMN 2: ADMISSION DETAILS */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 font-sans">
              Admission Details
            </h4>

            {/* Field 1: Applying For (Grade) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-sans">
                Applying For (Grade) <span className="text-red-500">*</span>
              </label>
              <select
                value={gradeSought}
                onChange={(e) => setGradeSought(e.target.value)}
                onBlur={() => handleBlur('gradeSought')}
                className={`w-full h-10 px-3 bg-white border rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                  isFieldInvalid('gradeSought', gradeSought)
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200'
                }`}
              >
                <option value="">Select Grade</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
                {gradeSought && !GRADE_OPTIONS.some((opt) => opt.value === gradeSought) && (
                  <option value={gradeSought}>{getGradeLabel(gradeSought)}</option>
                )}
              </select>
              {isFieldInvalid('gradeSought', gradeSought) && (
                <p className="text-xs text-red-500 mt-1">{getError('gradeSought', gradeSought)}</p>
              )}
            </div>

            {/* Field 2: Academic Year */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-sans">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                onBlur={() => handleBlur('academicYearId')}
                className={`w-full h-10 px-3 bg-white border rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                  isFieldInvalid('academicYearId', academicYearId)
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200'
                }`}
              >
                <option value="">Select Year</option>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name} {ay.status === 'ACTIVE' ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              {isFieldInvalid('academicYearId', academicYearId) && (
                <p className="text-xs text-red-500 mt-1">{getError('academicYearId', academicYearId)}</p>
              )}
            </div>

            {/* Field 3: Start at Stage */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-sans">
                Initial Stage <span className="text-red-500">*</span>
              </label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                onBlur={() => handleBlur('stageId')}
                className={`w-full h-10 px-3 bg-white border rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                  isFieldInvalid('stageId', stageId)
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200'
                }`}
              >
                <option value="">Select Stage</option>
                {pipelineStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
              {isFieldInvalid('stageId', stageId) && (
                <p className="text-xs text-red-500 mt-1">{getError('stageId', stageId)}</p>
              )}
            </div>

            {/* Field 4: Assign To */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-sans">
                Assign To (Counsellor)
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="">Unassigned</option>
                {counsellors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FULL WIDTH ROW: Notes */}
          <div className="sm:col-span-2 mt-2">
            <label className="block text-sm font-medium text-slate-700 mb-1 font-sans">
              Notes / Remarks
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter internal notes or comments"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (!isFormValid && submitAttempted)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg text-sm font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:bg-blue-600/50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Converting...</span>
              </>
            ) : (
              <>
                <span>Convert to Admission</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
