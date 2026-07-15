import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { ArrowLeft, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import DateSelector from '@/components/ui/DateSelector'
import FeeHeadRow, { FeeHead } from './FeeHeadRow'
import { mapGradeValue } from '@/lib/utils/gradeMapping'
import { getGradeLabel } from '@/constants/grades'
import { buildBatchInvoices } from '../lib/buildBatch'

interface Student {
  id: string
  name: string
  studentCode: string
  gradeLabel: string | null
}

interface Term {
  id: string
  name: string
  startDate: string
  endDate: string
  order: number
}

interface TermSection {
  term: Term
  invoiceType: 'TERM' | 'ADHOC'
  dueDate: string
  scheduleType: 'now' | 'date'
  scheduledDate: string
  feeHeads: FeeHead[]
  error?: string | null
}

interface PreviewStepProps {
  mode: 'class' | 'student'
  grade?: string
  selectedGradeLabel?: string
  courseId?: string
  selectedCourseLabel?: string
  student?: Student
  invoiceType: 'TERM' | 'ADHOC'
  selectedTerms: Term[]
  selectedPlanId: string | null
  initialItems: { id: string; name: string; amount: number; appliesTo: string; assignedTermOrder?: number | null }[]
  onBack: () => void
}

export default function PreviewStep({
  mode,
  grade,
  selectedGradeLabel,
  courseId,
  selectedCourseLabel,
  student,
  invoiceType,
  selectedTerms,
  selectedPlanId,
  initialItems,
  onBack
}: PreviewStepProps) {
  const resolvedGradeLabel = selectedGradeLabel || (grade ? getGradeLabel(mapGradeValue(grade)) : '')
  const isCourseTarget = mode === 'class' && !!courseId
  const targetDisplayLabel = isCourseTarget ? (selectedCourseLabel || '') : resolvedGradeLabel
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittingProgressText, setSubmittingProgressText] = useState('')

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({
    message: '',
    type: 'success',
    show: false
  })

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  // Get active student count using the lightweight API call we modified
  const { data: studentCountData } = useSWR<{ success: boolean; data?: { count: number }; count?: number }>(
    mode === 'class'
      ? (isCourseTarget
          ? `/api/v1/students?courseId=${encodeURIComponent(courseId!)}&status=ACTIVE&limit=1&countOnly=true`
          : (grade ? `/api/v1/students?gradeLabel=${encodeURIComponent(resolvedGradeLabel)}&status=ACTIVE&limit=1&countOnly=true` : null))
      : null,
    fetcher
  )
  const studentCount = mode === 'class' ? (studentCountData?.data?.count ?? studentCountData?.count ?? 0) : 1

  // Distribute Fee Heads to each selected term section based on layout logic
  const [sections, setSections] = useState<TermSection[]>(() => {
    const items = initialItems || []

    // Default due date: 30 days from today in YYYY-MM-DD
    const defaultDue = new Date()
    defaultDue.setDate(defaultDue.getDate() + 30)
    const defaultDueStr = defaultDue.toISOString().split('T')[0]

    // Adhoc has no terms — one pseudo-section carrying all items
    if (invoiceType === 'ADHOC' || selectedTerms.length === 0) {
      return [{
        term: { id: 'adhoc', name: 'Adhoc Invoice', startDate: '', endDate: '', order: 0 },
        invoiceType: 'ADHOC' as const,
        dueDate: defaultDueStr,
        scheduleType: 'now' as const,
        scheduledDate: '',
        feeHeads: items.map(head => ({ ...head, id: `${head.id}-adhoc` }))
      }]
    }

    return selectedTerms.map((term, index, arr) => {
      const isFirst = index === 0
      const isLast = index === arr.length - 1

      const termHeads: FeeHead[] = []

      for (const head of items) {
        if (head.appliesTo === 'ALL_TERMS') {
          termHeads.push({ ...head, id: `${head.id}-${term.id}` })
        } else if (head.appliesTo === 'FIRST_TERM') {
          if (isFirst) {
            termHeads.push({ ...head, id: `${head.id}-${term.id}` })
          }
        } else if (head.appliesTo === 'LAST_TERM') {
          if (isLast) {
            termHeads.push({ ...head, id: `${head.id}-${term.id}` })
          }
        } else if (head.appliesTo === 'CUSTOM') {
          if (term.order === head.assignedTermOrder) {
            termHeads.push({ ...head, id: `${head.id}-${term.id}` })
          } else {
            // Check if head's assignedTermOrder matches ANY of the selected terms
            const hasMatch = arr.some(t => t.order === head.assignedTermOrder)
            // If it doesn't match any selected term, fallback to first selected term
            if (!hasMatch && isFirst) {
              termHeads.push({
                ...head,
                id: `${head.id}-${term.id}`,
                originalTermText: head.assignedTermOrder ? `Term ${head.assignedTermOrder}` : 'unknown term'
              })
            }
          }
        }
      }

      // Default due date: 30 days from today in YYYY-MM-DD
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0]

      return {
        term,
        invoiceType: 'TERM' as const,
        dueDate: defaultDueDateStr,
        scheduleType: 'now' as const,
        scheduledDate: '',
        feeHeads: termHeads
      }
    })
  })

  // Update specific field inside a term section
  const updateSection = (index: number, updated: Partial<TermSection>) => {
    setSections(prev =>
      prev.map((s, idx) => (idx === index ? { ...s, ...updated } : s))
    )
  }

  // Update a fee head row inside a specific term section
  const updateFeeHead = (sectionIndex: number, headId: string, updatedHead: Partial<FeeHead>) => {
    setSections(prev =>
      prev.map((s, idx) => {
        if (idx !== sectionIndex) return s
        return {
          ...s,
          feeHeads: s.feeHeads.map(h => (h.id === headId ? { ...h, ...updatedHead } : h))
        }
      })
    )
  }

  // Remove a fee head row from a term section
  const removeFeeHead = (sectionIndex: number, headId: string) => {
    setSections(prev =>
      prev.map((s, idx) => {
        if (idx !== sectionIndex) return s
        return {
          ...s,
          feeHeads: s.feeHeads.filter(h => h.id !== headId)
        }
      })
    )
  }

  // Add blank fee head row to a term section
  const addBlankFeeHead = (sectionIndex: number) => {
    setSections(prev =>
      prev.map((s, idx) => {
        if (idx !== sectionIndex) return s
        const newHead: FeeHead = {
          id: `new-head-${Date.now()}-${Math.random()}`,
          name: '',
          amount: 0,
          appliesTo: 'ALL_TERMS'
        }
        return {
          ...s,
          feeHeads: [...s.feeHeads, newHead]
        }
      })
    )
  }

  // Date utilities
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return ''
    }
  }

  // Calculation values
  const totalInvoices = sections.length * studentCount
  
  const grandTotalAmount = sections.reduce((sum, s) => {
    const termTotal = s.feeHeads.reduce((tSum, h) => tSum + h.amount, 0)
    return sum + (termTotal * studentCount)
  }, 0)

  // Submit and generation logic
  const handleConfirmAndGenerate = async () => {
    // 1. Validation checks
    let hasValidationError = false
    const validatedSections = sections.map(s => {
      let errorMsg: string | null = null

      if (s.feeHeads.length === 0) {
        errorMsg = 'Please add at least one fee head for this term.'
      } else if (!s.dueDate) {
        errorMsg = 'Please select a due date.'
      } else if (s.feeHeads.some(h => !h.name.trim())) {
        errorMsg = 'All fee heads must have a name.'
      } else if (s.feeHeads.some(h => h.amount < 0)) {
        errorMsg = 'Amounts must be greater than or equal to 0.'
      } else if (s.scheduleType === 'date') {
        if (!s.scheduledDate) {
          errorMsg = 'Please specify a schedule date.'
        } else {
          const sched = new Date(s.scheduledDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (sched.getTime() <= today.getTime()) {
            errorMsg = 'Scheduled date must be in the future.'
          }
        }
      }

      if (errorMsg) {
        hasValidationError = true
      }
      return { ...s, error: errorMsg }
    })

    setSections(validatedSections)
    if (hasValidationError) return

    setIsSubmitting(true)
    setSubmittingProgressText(`Fetching students...`)

    try {
      let finalStudentIds: string[] = []

      if (mode === 'class') {
        // Fetch all active students in class/course up to 500 limit
        const stdRes = await fetch(
          isCourseTarget
            ? `/api/v1/students?courseId=${encodeURIComponent(courseId!)}&status=ACTIVE&limit=500`
            : `/api/v1/students?gradeLabel=${encodeURIComponent(resolvedGradeLabel)}&status=ACTIVE&limit=500`
        )
        const stdData = await stdRes.json()
        const students: Student[] = stdData.data || []
        if (students.length === 0) {
          throw new Error(`No active students found in ${isCourseTarget ? targetDisplayLabel : `Grade ${resolvedGradeLabel}`}`)
        }
        finalStudentIds = students.map(s => s.id)
      } else if (student) {
        finalStudentIds = [student.id]
      }

      setSubmittingProgressText(`Creating ${totalInvoices} invoices for ${finalStudentIds.length} students...`)

      // Generate batch payload (pure builder — see tests/build-batch.test.ts)
      const invoices = buildBatchInvoices(
        sections.map(s => ({
          // LC/coaching "Recurring" sections use a synthetic term (no real
          // Term row exists for them) — never send that id as termId. Tag
          // these as COURSE (not TERM) and carry courseId so the batch route
          // can link/advance the student's CourseEnrollment for auto-billing.
          termId: s.invoiceType === 'ADHOC' || isCourseTarget ? null : s.term.id,
          invoiceType: isCourseTarget && s.invoiceType === 'TERM' ? 'COURSE' as const : s.invoiceType,
          courseId: isCourseTarget ? courseId : undefined,
          dueDate: s.dueDate,
          scheduleType: s.scheduleType,
          scheduledDate: s.scheduledDate,
          feeHeads: s.feeHeads
        })),
        finalStudentIds
      )

      const generatedBatchId = crypto.randomUUID()

      const createRes = await fetch('/api/v1/fees/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'batch',
          batchId: generatedBatchId,
          invoices
        })
      })

      if (!createRes.ok) {
        const errData = await createRes.json()
        throw new Error(errData.message ?? 'Failed to generate batch invoices')
      }

      // Store in session storage
      sessionStorage.setItem('vidhyaan_last_batch_id', generatedBatchId)
      router.push('/fee-management')

    } catch (err: any) {
      console.error(err)
      triggerToast(err.message ?? 'Failed to generate invoices. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
      setSubmittingProgressText('')
    }
  }

  return (
    <div className="flex flex-col font-sans">
      {/* SUMMARY LINE */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-2 pb-4">
        <p className="text-xs text-slate-500 font-medium truncate select-none">
          {mode === 'class'
            ? `${isCourseTarget ? 'Course' : 'Grade'} ${targetDisplayLabel} · ${studentCount} students · ${invoiceType === 'ADHOC' ? 'Adhoc' : (isCourseTarget ? 'Recurring' : `${sections.length} terms`)} · ${totalInvoices} invoices total`
            : `${student?.name} · ${invoiceType === 'ADHOC' ? 'Adhoc' : `${sections.length} terms`} · ${totalInvoices} invoices total`}
        </p>
      </div>

      {/* TOAST POPUP */}
      {toast.show && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg transform transition-all duration-300 ${
            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          {toast.type === 'error' ? <XCircle size={16} className="text-red-500" /> : <CheckCircle2 size={16} className="text-green-500" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* BODY - TERM SECTIONS */}
      <div className="flex-1 px-4 sm:px-6 pb-6 flex flex-col gap-6">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 pb-24">
          {sections.map((section, index) => {
            const termTotal = section.feeHeads.reduce((sum, h) => sum + h.amount, 0)

            return (
              <div key={section.term.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-5">
                {/* Term Info Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2 select-none">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      {section.term.name}
                    </h2>
                    {section.invoiceType === 'TERM' && section.term.startDate && (
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        {formatDate(section.term.startDate)} – {formatDate(section.term.endDate)}
                      </p>
                    )}
                  </div>
                  {section.error && (
                    <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1 font-semibold">
                      <AlertCircle size={12} className="shrink-0 text-red-500" />
                      <span>{section.error}</span>
                    </div>
                  )}
                </div>

                {/* Fee Heads Table */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Fee Heads
                  </h3>

                    <div className="flex items-center gap-2 px-0 py-1.5 mb-1">
                      <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Item Name
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex-shrink-0 w-[100px]">
                        Applies To
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex-shrink-0 w-24 text-right">
                        Amount
                      </span>
                      <span className="w-6 flex-shrink-0" />
                    </div>

                    <div className="divide-y divide-slate-100">
                      {section.feeHeads.map(head => (
                        <FeeHeadRow
                          key={head.id}
                          head={head}
                          onUpdate={updated => updateFeeHead(index, head.id, updated)}
                          onRemove={() => removeFeeHead(index, head.id)}
                        />
                      ))}
                    </div>


                </div>

                {/* Due Date & Schedule Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-slate-100 pt-5">
                  {/* Due Date Picker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide select-none">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <DateSelector
                      value={section.dueDate}
                      onChange={date => updateSection(index, { dueDate: date })}
                    />
                  </div>

                  {/* Schedule Selector */}
                  <div className="flex flex-col gap-1.5 select-none">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Schedule
                    </label>
                    <div className="flex gap-4 items-center h-10">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`schedule-${section.term.id}`}
                          checked={section.scheduleType === 'now'}
                          onChange={() => updateSection(index, { scheduleType: 'now', scheduledDate: '' })}
                          className="text-[#1565D8] focus:ring-[#1565D8]"
                        />
                        <span className="font-medium">Trigger Now</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`schedule-${section.term.id}`}
                          checked={section.scheduleType === 'date'}
                          onChange={() => updateSection(index, { scheduleType: 'date' })}
                          className="text-[#1565D8] focus:ring-[#1565D8]"
                        />
                        <span className="font-medium">Schedule for Date</span>
                      </label>
                    </div>

                    {section.scheduleType === 'date' && (
                      <DateSelector
                        value={section.scheduledDate}
                        onChange={date => updateSection(index, { scheduledDate: date })}
                        placeholder="Select schedule date"
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>

                {/* Add Item + Term Total — single row */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2 gap-3">
                  {/* Add Item button — left side, compact */}
                  <button
                    type="button"
                    onClick={() => addBlankFeeHead(index)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#1565D8] border border-dashed border-blue-200 rounded-lg hover:bg-blue-50/30 transition-colors px-3 py-1.5 flex-shrink-0"
                  >
                    <span className="text-base leading-none">+</span>
                    Add Item
                  </button>

                  {/* Term total — right side */}
                  <div className="flex flex-col items-end select-none">
                    <span className="text-sm font-bold text-slate-800">
                      {section.term.name} Total:&nbsp;₹{termTotal.toLocaleString('en-IN')} each
                    </span>
                    {mode === 'class' && (
                      <p className="text-[11px] text-slate-400 mt-0.5 font-semibold text-right">
                        * Edits apply to all {studentCount} students in this term
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FOOTER (sticky) */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-6 py-4 flex flex-col gap-1 shadow-lg shrink-0 z-10">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Grand Total (Calculated)
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {totalInvoices} invoice{totalInvoices !== 1 ? 's' : ''} ·{' '}
                <span className="text-[#1565D8] font-extrabold text-base">
                  ₹{grandTotalAmount.toLocaleString('en-IN')}
                </span>{' '}
                total
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-50 transition min-h-[42px] cursor-pointer disabled:opacity-50 select-none flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmAndGenerate}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1565D8] hover:bg-blue-700 rounded-lg transition duration-150 cursor-pointer disabled:opacity-50 min-h-[42px] flex items-center gap-2 select-none"
              >
                {isSubmitting ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>
          </div>

          {isSubmitting && submittingProgressText && (
            <p className="text-xs text-[#1565D8] font-bold text-center sm:text-left animate-pulse">
              {submittingProgressText}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
