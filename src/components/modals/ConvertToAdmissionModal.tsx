"use client"

import React, { useState, useEffect } from 'react'
import { ClipboardList, Info, ArrowRight, X, Phone, GraduationCap, Tag, Circle, Loader2 } from 'lucide-react'
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'
import { mapGradeValue } from '@/lib/utils/gradeMapping'

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
  source?: string | null
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
  // Form state
  const [form, setForm] = useState(() => ({
    applicantName:
      lead?.kidName ||
      lead?.parentName || '',
    gradeSought:
      mapGradeValue(lead?.gradeSought),
    academicYearId: '',
    stageId: '',
    assignedToId:
      lead?.assignedToId || '',
    notes: lead?.notes || '',
  }))

  // Option list states
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [pipelineStages, setPipelineStages] = useState<any[]>([])
  const [counsellors, setCounsellors] = useState<any[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Interaction/submission states
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Update form fields when lead changes
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      applicantName:
        lead?.kidName ||
        lead?.parentName || '',
      gradeSought:
        mapGradeValue(lead?.gradeSought),
      assignedToId:
        lead?.assignedToId || '',
      notes: lead?.notes || '',
    }))
    setTouched({})
    setSubmitAttempted(false)
    setError('')
  }, [lead?.id])

  // Fetch options when modal is opened
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
              setForm((prev) => ({
                ...prev,
                academicYearId: prev.academicYearId || activeYear.id
              }))
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
              setForm((prev) => ({
                ...prev,
                stageId: prev.stageId || firstNonTerminal.id
              }))
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
        console.error('Error fetching modal options:', err)
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchData()
  }, [isOpen])

  // Inline Validation Helpers
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const getFieldError = (field: string): string => {
    if (field === 'applicantName' && !form.applicantName.trim()) {
      return 'Applicant name is required'
    }
    if (field === 'gradeSought' && !form.gradeSought) {
      return 'Applying grade is required'
    }
    if (field === 'academicYearId' && !form.academicYearId) {
      return 'Academic year is required'
    }
    if (field === 'stageId' && !form.stageId) {
      return 'Initial stage is required'
    }
    return ''
  }

  const isFieldInvalid = (field: string): boolean => {
    const err = getFieldError(field)
    return !!err && (touched[field] || submitAttempted)
  }

  const isFormValid =
    !getFieldError('applicantName') &&
    !getFieldError('gradeSought') &&
    !getFieldError('academicYearId') &&
    !getFieldError('stageId')

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
          applicantName: form.applicantName,
          parentName: lead.parentName,
          phone: lead.phone,
          email: lead.email || null,
          gradeSought: form.gradeSought,
          academicYearId: form.academicYearId,
          stageId: form.stageId,
          assignedToId: form.assignedToId || null,
          notes: form.notes || null,
          leadId: lead.id,
          priority: lead.priority || 'MEDIUM',
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

  if (!isOpen || !lead) return null

  // Dynamic Grade Options (unshift if not in standard list)
  const mappedValue = mapGradeValue(lead.gradeSought)
  const gradeOptions: { value: string; label: string }[] = [...GRADE_OPTIONS]
  if (lead.gradeSought && !GRADE_OPTIONS.some(opt => opt.value === mappedValue)) {
    gradeOptions.unshift({
      value: lead.gradeSought,
      label: lead.gradeSought
    })
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-50 flex items-center justify-center p-4">
      {/* CSS overrides for responsive states & scrollbar */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E2E8F0;
          border-radius: 9999px;
        }
        .form-input-style {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          font-size: 14px;
          color: #1E293B;
          background: white;
          transition: border 150ms, box-shadow 150ms;
          outline: none;
        }
        .form-input-style:focus {
          border-color: #1565D8 !important;
          box-shadow: 0 0 0 3px rgba(21,101,216,0.1) !important;
        }
        .form-input-style.has-value {
          border-color: #CBD5E1;
        }
        .form-input-style.has-error {
          border-color: #EF4444;
        }
        textarea.form-input-style {
          height: auto;
          padding: 8px 12px;
          resize: none;
        }
        @media (max-width: 479px) {
          .modal-grid {
            grid-template-columns: 1fr !important;
          }
          .modal-footer {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .modal-footer-info {
            display: none !important;
          }
          .modal-footer-buttons {
            width: 100% !important;
            flex-direction: column !important;
          }
          .modal-footer-buttons button {
            width: 100% !important;
          }
        }
      ` }} />

      <div className="bg-white rounded-[20px] w-full max-w-[560px] max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden relative">
        
        {/* SECTION 1 — COMPACT COLORED HEADER */}
        <div className="bg-gradient-to-r from-[#1565D8] to-[#1E40AF] px-6 py-5 shrink-0 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[rgba(255,255,255,0.2)] rounded-xl p-2 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base leading-snug">
                  Convert to Admission
                </h3>
                <p className="text-blue-200 text-xs mt-0.5">
                  Lead #{lead.leadCode} · {lead.parentName}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="bg-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.25)] rounded-lg p-1.5 cursor-pointer flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Info Pills Row */}
          <div className="mt-3 flex gap-2 flex-wrap">
            <div className="bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)] rounded-full px-3 py-1 text-xs text-white flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{lead.phone}</span>
            </div>
            <div className="bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)] rounded-full px-3 py-1 text-xs text-white flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{lead.gradeSought ? getGradeLabel(lead.gradeSought) : 'No grade'}</span>
            </div>
            <div className="bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)] rounded-full px-3 py-1 text-xs text-white flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>{lead.source || 'No source'}</span>
            </div>
            <div className="bg-[rgba(255,255,255,0.15)] border border-[rgba(255,255,255,0.2)] rounded-full px-3 py-1 text-xs text-white flex items-center gap-1.5">
              <Circle className="w-2 h-2 fill-current" />
              <span>{lead.status ? (statusLabels[lead.status] || lead.status) : 'No status'}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2 — FORM BODY */}
        <div className="bg-white px-6 py-5 flex-1 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="modal-grid grid grid-cols-2 gap-x-4 gap-y-3">
            {/* FIELD 1: APPLICANT NAME */}
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                APPLICANT NAME *
              </label>
              <input
                type="text"
                required
                placeholder="Child's full name"
                value={form.applicantName}
                onChange={(e) => setForm(prev => ({ ...prev, applicantName: e.target.value }))}
                onBlur={() => handleBlur('applicantName')}
                className={`form-input-style ${form.applicantName ? 'has-value' : ''} ${isFieldInvalid('applicantName') ? 'has-error' : ''}`}
              />
              <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Info className="w-[10px] h-[10px] text-slate-400" />
                The child who will be admitted
              </span>
              {isFieldInvalid('applicantName') && (
                <span className="text-xs text-red-500 block mt-1">
                  {getFieldError('applicantName')}
                </span>
              )}
            </div>

            {/* FIELD 2: APPLYING FOR (GRADE) */}
            <div className="col-span-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                APPLYING FOR *
              </label>
              <select
                required
                value={form.gradeSought}
                onChange={(e) => setForm(prev => ({ ...prev, gradeSought: e.target.value }))}
                onBlur={() => handleBlur('gradeSought')}
                className={`form-input-style ${form.gradeSought ? 'has-value' : ''} ${isFieldInvalid('gradeSought') ? 'has-error' : ''}`}
              >
                <option value="">Select Grade</option>
                {gradeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {isFieldInvalid('gradeSought') && (
                <span className="text-xs text-red-500 block mt-1">
                  {getFieldError('gradeSought')}
                </span>
              )}
            </div>

            {/* FIELD 3: ACADEMIC YEAR */}
            <div className="col-span-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                ACADEMIC YEAR *
              </label>
              {loadingOptions ? (
                <select disabled className="form-input-style opacity-60">
                  <option>Loading...</option>
                </select>
              ) : (
                <select
                  required
                  value={form.academicYearId}
                  onChange={(e) => setForm(prev => ({ ...prev, academicYearId: e.target.value }))}
                  onBlur={() => handleBlur('academicYearId')}
                  className={`form-input-style ${form.academicYearId ? 'has-value' : ''} ${isFieldInvalid('academicYearId') ? 'has-error' : ''}`}
                >
                  <option value="">Select Year</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} {ay.status === 'ACTIVE' ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              )}
              {isFieldInvalid('academicYearId') && (
                <span className="text-xs text-red-500 block mt-1">
                  {getFieldError('academicYearId')}
                </span>
              )}
            </div>

            {/* FIELD 4: INITIAL STAGE */}
            <div className="col-span-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                INITIAL STAGE *
              </label>
              {loadingOptions ? (
                <select disabled className="form-input-style opacity-60">
                  <option>Loading...</option>
                </select>
              ) : (
                <select
                  required
                  value={form.stageId}
                  onChange={(e) => setForm(prev => ({ ...prev, stageId: e.target.value }))}
                  onBlur={() => handleBlur('stageId')}
                  className={`form-input-style ${form.stageId ? 'has-value' : ''} ${isFieldInvalid('stageId') ? 'has-error' : ''}`}
                >
                  <option value="">Select Stage</option>
                  {pipelineStages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              )}
              {isFieldInvalid('stageId') && (
                <span className="text-xs text-red-500 block mt-1">
                  {getFieldError('stageId')}
                </span>
              )}
            </div>

            {/* FIELD 5: ASSIGN TO */}
            <div className="col-span-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                ASSIGN TO
              </label>
              {loadingOptions ? (
                <select disabled className="form-input-style opacity-60">
                  <option>Loading...</option>
                </select>
              ) : (
                <select
                  value={form.assignedToId}
                  onChange={(e) => setForm(prev => ({ ...prev, assignedToId: e.target.value }))}
                  className={`form-input-style ${form.assignedToId ? 'has-value' : ''}`}
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

            {/* FIELD 6: NOTES */}
            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                NOTES
              </label>
              <textarea
                rows={2}
                placeholder="Any additional notes..."
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className={`form-input-style ${form.notes ? 'has-value' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3 — FIXED FOOTER */}
        <div className="modal-footer bg-[#F8FAFC] border-t-[1.5px] border-[#F1F5F9] px-6 py-3.5 shrink-0 flex items-center justify-between">
          <div className="modal-footer-info flex items-center gap-2 text-slate-400">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs">Lead will be marked as Converted</span>
          </div>

          <div className="modal-footer-buttons flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border-[1.5px] border-[#E2E8F0] rounded-lg text-slate-600 text-sm font-medium bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !isFormValid}
              className={`px-6 py-2.5 bg-[#1565D8] hover:bg-[#1250B0] rounded-lg text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                submitting
                  ? 'opacity-70 cursor-not-allowed'
                  : !isFormValid
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin size-4 mr-2" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <span>Convert</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
