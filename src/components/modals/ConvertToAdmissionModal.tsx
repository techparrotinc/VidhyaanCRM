"use client"

import React, { useState, useEffect } from 'react'
import { ClipboardList, Info, ArrowRight, X, Hash, User, Phone, GraduationCap, Tag, Activity } from 'lucide-react'
import {
  Dialog,
  DialogContent,
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

export function mapGradeToValue(grade: string | null | undefined): string {
  if (!grade) return ''

  const normalized = grade.toLowerCase().trim()

  if (normalized.includes('pre-kg') || normalized.includes('pre kg') || normalized.includes('pre_kg')) {
    return 'pre_kg'
  }
  if (normalized.includes('nursery')) {
    return 'nursery'
  }
  if (normalized.includes('lkg') || normalized.includes('l.k.g')) {
    return 'lkg'
  }
  if (normalized.includes('ukg') || normalized.includes('u.k.g')) {
    return 'ukg'
  }

  const gradeMap: Record<string, string> = {
    'class 1': 'class_1',
    'class 2': 'class_2',
    'class 3': 'class_3',
    'class 4': 'class_4',
    'class 5': 'class_5',
    'class 6': 'class_6',
    'class 7': 'class_7',
    'class 8': 'class_8',
    'class 9': 'class_9',
    'class 10': 'class_10',
    'class 11': 'class_11_science',
    'class 12': 'class_12_science',
    '1': 'class_1',
    '2': 'class_2',
    '3': 'class_3',
    '4': 'class_4',
    '5': 'class_5',
    '6': 'class_6',
    '7': 'class_7',
    '8': 'class_8',
    '9': 'class_9',
    '10': 'class_10',
  }

  for (const [key, val] of Object.entries(gradeMap)) {
    if (normalized.includes(key)) {
      return val
    }
  }

  return gradeMap[normalized] || grade
}

export default function ConvertToAdmissionModal({
  lead,
  isOpen,
  onClose,
  onSuccess,
}: ConvertToAdmissionModalProps) {
  // Form fields state object
  const [formData, setFormData] = useState({
    applicantName: '',
    gradeSought: '',
    academicYearId: '',
    stageId: '',
    assignedToId: '',
    notes: ''
  })

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
              setFormData((prev) => ({
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
              setFormData((prev) => ({
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

    setFormData({
      applicantName: lead.kidName || lead.parentName || '',
      gradeSought: mapGradeToValue(lead.gradeSought),
      academicYearId: lead.academicYearId || '',
      stageId: '', // Set by the pipeline stages load
      assignedToId: lead.assignedToId || '',
      notes: lead.notes || ''
    })
    
    // Clear validation states
    setTouched({})
    setSubmitAttempted(false)
    setError('')
  }, [lead, isOpen])

  // Prefill grade sought when lead updates (Cause 2 Fix)
  useEffect(() => {
    if (lead?.gradeSought) {
      setFormData(prev => ({
        ...prev,
        gradeSought: mapGradeToValue(lead.gradeSought)
      }))
    }
  }, [lead?.gradeSought])

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

  const isFieldInvalid = (field: string) => {
    const value = formData[field as keyof typeof formData] || ''
    const err = getError(field, value)
    return err ? (touched[field] || submitAttempted) : false
  }

  // Form validity
  const isFormValid =
    !getError('applicantName', formData.applicantName) &&
    !getError('gradeSought', formData.gradeSought) &&
    !getError('academicYearId', formData.academicYearId) &&
    !getError('stageId', formData.stageId)

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
          applicantName: formData.applicantName,
          parentName: lead.parentName,
          phone: lead.phone,
          email: lead.email || undefined,
          gradeSought: formData.gradeSought,
          leadId: lead.id,
          assignedToId: formData.assignedToId || undefined,
          academicYearId: formData.academicYearId || undefined,
          stageId: formData.stageId || undefined,
          notes: formData.notes || undefined,
          priority: lead.priority || 'MEDIUM'
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

  // Dynamic Grade Options
  const mappedValue = mapGradeToValue(lead?.gradeSought)
  const gradeOptions = [
    ...GRADE_OPTIONS,
    ...(lead?.gradeSought && !GRADE_OPTIONS.find(g => g.value === mappedValue)
      ? [{ value: lead.gradeSought, label: lead.gradeSought }]
      : []
    )
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-[780px] w-[95vw] h-auto md:h-[600px] max-h-[90vh] rounded-2xl p-0 overflow-hidden bg-white shadow-[0_25px_50px_rgba(0,0,0,0.25)] border border-slate-100 flex flex-col md:flex-row">
        <style dangerouslySetInnerHTML={{ __html: `
          .max-w-\\[780px\\] > button {
            display: none !important;
          }
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

        {/* LEFT PANEL */}
        <div className="w-full md:w-[260px] md:flex-shrink-0 bg-[#1565D8] rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none p-5 md:pt-7 md:px-6 md:pb-7 flex flex-col text-white overflow-hidden select-none">
          {/* Top Section */}
          <div className="bg-white/15 rounded-xl p-3 w-fit text-white">
            <ClipboardList size={24} />
          </div>
          <h3 className="text-xl font-bold text-white leading-tight mt-4">
            Convert to Admission
          </h3>
          <p className="text-sm text-blue-200 mt-1">
            Review and confirm the admission details
          </p>

          <div className="w-10 h-0.5 bg-white/30 mt-6 mb-6" />

          {/* Lead Info Section */}
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-3">
              FROM LEAD
            </div>
            
            <div className="space-y-3">
              {/* Row 1: Lead ID */}
              <div className="flex items-start gap-2">
                <Hash size={16} className="text-white/70 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] text-blue-300 uppercase font-semibold">Lead ID</div>
                  <div className="font-mono text-sm text-white font-semibold">{lead?.leadCode}</div>
                </div>
              </div>

              {/* Row 2: Parent */}
              <div className="flex items-start gap-2">
                <User size={16} className="text-white/70 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-blue-300 uppercase font-semibold">Parent</div>
                  <div className="text-sm text-white font-medium truncate">{lead?.parentName}</div>
                </div>
              </div>

              {/* Row 3: Phone (hidden on mobile) */}
              <div className="hidden md:flex items-start gap-2">
                <Phone size={16} className="text-white/70 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] text-blue-300 uppercase font-semibold">Phone</div>
                  <div className="text-sm text-white">{lead?.phone}</div>
                </div>
              </div>

              {/* Row 4: Grade */}
              <div className="flex items-start gap-2">
                <GraduationCap size={16} className="text-white/70 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-blue-300 uppercase font-semibold">Applying For</div>
                  <div className="text-sm text-white truncate">
                    {lead?.gradeSought ? getGradeLabel(lead.gradeSought) : 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Row 5: Source (hidden on mobile) */}
              <div className="hidden md:flex items-start gap-2">
                <Tag size={16} className="text-white/70 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-blue-300 uppercase font-semibold">Source</div>
                  <div className="text-sm text-blue-200 capitalize truncate">{lead?.source || '—'}</div>
                </div>
              </div>

              {/* Row 6: Status (hidden on mobile) */}
              <div className="hidden md:flex items-start gap-2">
                <Activity size={16} className="text-white/70 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-blue-300 uppercase font-semibold">Status</div>
                  <div className="text-sm text-blue-200 truncate">
                    {lead?.status ? (statusLabels[lead.status] || lead.status) : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="hidden md:block mt-auto bg-white/10 rounded-xl p-3 border border-white/20">
            <p className="text-xs text-blue-200 leading-relaxed">
              ℹ Lead status will automatically update to Converted after successful admission creation.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-white rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none flex flex-col overflow-hidden">
          
          {/* HEADER */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-800">
              Admission Details
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* BODY */}
          <div className="modal-compact-form p-6 space-y-4 flex-1 overflow-y-auto min-h-0 bg-white">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* FIELD 1: APPLICANT NAME */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1 block">
                Applicant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.applicantName}
                onChange={(e) => setFormData(prev => ({ ...prev, applicantName: e.target.value }))}
                onBlur={() => handleBlur('applicantName')}
                placeholder="Enter child's full name"
                className={`w-full h-10 px-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/10 focus:border-[#1565D8] transition-colors ${
                  isFieldInvalid('applicantName')
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200'
                }`}
              />
              <span className="text-xs text-slate-400 mt-1">Child who will be enrolled</span>
              {isFieldInvalid('applicantName') && (
                <p className="text-xs text-red-500 mt-1">{getError('applicantName', formData.applicantName)}</p>
              )}
            </div>

            {/* TWO COLUMN ROW: APPLYING FOR (GRADE) & ACADEMIC YEAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Grade select */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1 block">
                  Applying For <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gradeSought}
                  onChange={(e) => setFormData(prev => ({ ...prev, gradeSought: e.target.value }))}
                  onBlur={() => handleBlur('gradeSought')}
                  className={`w-full h-10 px-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/10 focus:border-[#1565D8] transition-colors ${
                    isFieldInvalid('gradeSought')
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200'
                  }`}
                >
                  <option value="">Select Grade</option>
                  {gradeOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                {isFieldInvalid('gradeSought') && (
                  <p className="text-xs text-red-500 mt-1">{getError('gradeSought', formData.gradeSought)}</p>
                )}
              </div>

              {/* Academic Year select */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1 block">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                {loadingOptions ? (
                  <div className="h-10 w-full bg-slate-100 animate-pulse rounded-lg" />
                ) : (
                  <select
                    value={formData.academicYearId}
                    onChange={(e) => setFormData(prev => ({ ...prev, academicYearId: e.target.value }))}
                    onBlur={() => handleBlur('academicYearId')}
                    className={`w-full h-10 px-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/10 focus:border-[#1565D8] transition-colors ${
                      isFieldInvalid('academicYearId')
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
                {isFieldInvalid('academicYearId') && (
                  <p className="text-xs text-red-500 mt-1">{getError('academicYearId', formData.academicYearId)}</p>
                )}
              </div>
            </div>

            {/* TWO COLUMN ROW: INITIAL STAGE & ASSIGN TO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Stage select */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1 block">
                  Initial Stage <span className="text-red-500">*</span>
                </label>
                {loadingOptions ? (
                  <div className="h-10 w-full bg-slate-100 animate-pulse rounded-lg" />
                ) : (
                  <select
                    value={formData.stageId}
                    onChange={(e) => setFormData(prev => ({ ...prev, stageId: e.target.value }))}
                    onBlur={() => handleBlur('stageId')}
                    className={`w-full h-10 px-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/10 focus:border-[#1565D8] transition-colors ${
                      isFieldInvalid('stageId')
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
                {isFieldInvalid('stageId') && (
                  <p className="text-xs text-red-500 mt-1">{getError('stageId', formData.stageId)}</p>
                )}
              </div>

              {/* Assign To select */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1 block">
                  Assign To
                </label>
                {loadingOptions ? (
                  <div className="h-10 w-full bg-slate-100 animate-pulse rounded-lg" />
                ) : (
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedToId: e.target.value }))}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/10 focus:border-[#1565D8] transition-colors"
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

            {/* NOTES */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1 block">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes or remarks..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1565D8]/10 focus:border-[#1565D8] transition-colors resize-none"
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 bg-[#FAFAFA] border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl md:rounded-br-2xl md:rounded-bl-none">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !isFormValid || loadingOptions}
              className="px-5 py-2.5 bg-[#1565D8] hover:bg-blue-700 active:bg-blue-800 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:bg-blue-600/50 disabled:cursor-not-allowed"
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
