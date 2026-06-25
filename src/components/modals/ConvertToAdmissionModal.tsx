"use client"

import React, { useState, useEffect } from 'react'
import { ClipboardList, Info, ArrowRight, X } from 'lucide-react'
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
  status?: string | null
}

interface ConvertToAdmissionModalProps {
  lead: LeadRecord | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (admissionId: string) => void
}

const statusLabels: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  FOLLOW_UP_PENDING: 'Follow-up',
  CONVERTED: 'Converted',
  NOT_INTERESTED: 'Rejected'
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
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Fetch API options on mount in parallel
  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setLoadingOptions(true)
      try {
        const [yearsRes, pipelineRes, counsellorsRes] = await Promise.all([
          fetch('/api/v1/settings/academic-year'),
          fetch('/api/v1/settings/pipeline'),
          fetch('/api/v1/users/counsellors')
        ])

        if (yearsRes.ok) {
          const yearsData = await yearsRes.json()
          if (yearsData.success) {
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
        }

        if (pipelineRes.ok) {
          const pipelineData = await pipelineRes.json()
          if (pipelineData.success) {
            const stagesList = pipelineData.data || []
            setPipelineStages(stagesList)

            // Pre-select first stage
            const firstNonTerminal = stagesList
              .filter((s: any) => !s.isWon && !s.isLost)
              .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))[0]
            if (firstNonTerminal) {
              setStageId((prev) => prev || firstNonTerminal.id)
            }
          }
        }

        if (counsellorsRes.ok) {
          const counsellorsData = await counsellorsRes.json()
          if (counsellorsData.success) {
            setCounsellors(counsellorsData.data || [])
          }
        }
      } catch (err) {
        console.error('Error fetching conversion config data:', err)
      } finally {
        setLoadingOptions(false)
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
          priority: lead.priority || undefined
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
      <DialogContent className="max-w-2xl w-full rounded-2xl p-0 overflow-hidden bg-white shadow-2xl border border-slate-200">
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-height: 700px) {
            .modal-compact-form {
              padding-top: 12px !important;
              padding-bottom: 12px !important;
              gap: 12px !important;
            }
            .modal-compact-gap {
              gap: 12px !important;
            }
            .modal-compact-header {
              padding-top: 12px !important;
              padding-bottom: 10px !important;
            }
            .modal-compact-footer {
              padding-top: 10px !important;
              padding-bottom: 10px !important;
            }
          }
        ` }} />

        {/* HEADER */}
        <div className="modal-compact-header px-6 pt-5 pb-4 border-b border-slate-200 flex items-center justify-between bg-white relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1565D8] flex-shrink-0">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">
                Convert to Admission
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Lead #{lead?.leadCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-5 right-6 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* LEAD SUMMARY STRIP */}
        <div className="px-6 py-2.5 bg-[#EFF6FF] border-b border-[#DBEAFE] flex items-center justify-between text-xs">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Parent</div>
            <div className="text-slate-700 font-medium truncate mt-0.5">{lead?.parentName || '—'}</div>
          </div>
          <div className="w-px h-8 bg-[#DBEAFE] mx-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Phone</div>
            <div className="text-slate-700 font-medium truncate mt-0.5">{lead?.phone || '—'}</div>
          </div>
          <div className="w-px h-8 bg-[#DBEAFE] mx-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Grade</div>
            <div className="text-slate-700 font-medium truncate mt-0.5">
              {lead?.gradeSought ? getGradeLabel(lead.gradeSought) : '—'}
            </div>
          </div>
          <div className="w-px h-8 bg-[#DBEAFE] mx-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</div>
            <div className="text-slate-700 font-medium truncate mt-0.5">
              {lead?.status ? (statusLabels[lead.status] || lead.status) : '—'}
            </div>
          </div>
        </div>

        {/* FORM AREA */}
        <div className="modal-compact-form p-6 space-y-4 max-h-[50vh] overflow-y-auto min-h-0 bg-white">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          {/* ROW 1: APPLICANT NAME */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Applicant Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              onBlur={() => handleBlur('applicantName')}
              placeholder="Child who will be admitted"
              className={`w-full h-[38px] px-3 bg-white border rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#1565D8]/10 focus:border-[#1565D8] transition-colors ${
                isFieldInvalid('applicantName', applicantName)
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-slate-200'
              }`}
            />
            {isFieldInvalid('applicantName', applicantName) && (
              <p className="text-xs text-red-500 mt-1">{getError('applicantName', applicantName)}</p>
            )}
          </div>

          {/* ROW 2: TWO COLUMNS (GRADE & ACADEMIC YEAR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 modal-compact-gap">
            {/* Grade */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Applying For <span className="text-red-500">*</span>
              </label>
              {loadingOptions ? (
                <div className="h-[38px] w-full bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                <select
                  value={gradeSought}
                  onChange={(e) => setGradeSought(e.target.value)}
                  onBlur={() => handleBlur('gradeSought')}
                  className={`w-full h-[38px] px-3 bg-white border rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#1565D8]/10 focus:border-[#1565D8] transition-colors ${
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
              )}
              {isFieldInvalid('gradeSought', gradeSought) && (
                <p className="text-xs text-red-500 mt-1">{getError('gradeSought', gradeSought)}</p>
              )}
            </div>

            {/* Academic Year */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              {loadingOptions ? (
                <div className="h-[38px] w-full bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                <select
                  value={academicYearId}
                  onChange={(e) => setAcademicYearId(e.target.value)}
                  onBlur={() => handleBlur('academicYearId')}
                  className={`w-full h-[38px] px-3 bg-white border rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#1565D8]/10 focus:border-[#1565D8] transition-colors ${
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
              )}
              {isFieldInvalid('academicYearId', academicYearId) && (
                <p className="text-xs text-red-500 mt-1">{getError('academicYearId', academicYearId)}</p>
              )}
            </div>
          </div>

          {/* ROW 3: TWO COLUMNS (STAGE & COUNSELLOR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 modal-compact-gap">
            {/* Stage */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Initial Stage <span className="text-red-500">*</span>
              </label>
              {loadingOptions ? (
                <div className="h-[38px] w-full bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                <select
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value)}
                  onBlur={() => handleBlur('stageId')}
                  className={`w-full h-[38px] px-3 bg-white border rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#1565D8]/10 focus:border-[#1565D8] transition-colors ${
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
              )}
              {isFieldInvalid('stageId', stageId) && (
                <p className="text-xs text-red-500 mt-1">{getError('stageId', stageId)}</p>
              )}
            </div>

            {/* Counsellor */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                Assign To
              </label>
              {loadingOptions ? (
                <div className="h-[38px] w-full bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                <select
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full h-[38px] px-3 bg-white border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#1565D8]/10 focus:border-[#1565D8] transition-colors"
                >
                  <option value="">Unassigned</option>
                  {counsellors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* ROW 4: NOTES */}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#1565D8]/10 focus:border-[#1565D8] transition-colors resize-none"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-compact-footer px-6 py-4 bg-[#F8FAFC] border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 rounded-b-2xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Info size={14} className="shrink-0 text-slate-400" />
            <span>Leads status will be updated to Converted automatically</span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 sm:flex-none px-5 py-2.5 border border-slate-200 bg-white rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !isFormValid || loadingOptions}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#1565D8] hover:bg-blue-700 active:bg-blue-800 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:bg-blue-600/50 disabled:cursor-not-allowed"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
