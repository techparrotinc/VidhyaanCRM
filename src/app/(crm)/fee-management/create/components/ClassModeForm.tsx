import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { useCourseOptions } from '@/hooks/useCourseOptions'
import { isLearningCentre } from '@/lib/institution'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { AlertCircle, Users, Info } from 'lucide-react'
import { mapGradeValue } from '@/lib/utils/gradeMapping'
import SegmentedControl from './SegmentedControl'
import ManualItemsEditor, { type ManualItem } from './ManualItemsEditor'

interface Term {
  id: string
  name: string
  startDate: string
  endDate: string
  order: number
}

const RECURRING_FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BI_MONTHLY: 'Bi-Monthly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half Yearly',
  ANNUAL: 'Annual'
}

interface FeeHead {
  id: string
  name: string
  amount: number
  appliesTo: string
  assignedTermOrder?: number | null
}

interface FeePlan {
  id: string
  name: string
  gradeLabel: string | null
  courseId: string | null
  structure: { heads: FeeHead[] } | null
}

export interface WizardFormHandle {
  submit: () => void
}

interface ClassModeFormProps {
  onValidityChange: (valid: boolean) => void
  onSubmit: (data: {
    grade: string
    selectedGradeLabel?: string
    courseId?: string
    selectedCourseLabel?: string
    invoiceType: 'TERM' | 'ADHOC'
    selectedTerms: Term[]
    selectedPlanId: string | null
    items: { id: string; name: string; amount: number; appliesTo: string; assignedTermOrder?: number | null }[]
  }) => void
}

const ClassModeForm = forwardRef<WizardFormHandle, ClassModeFormProps>(
  function ClassModeForm({ onValidityChange, onSubmit }, ref) {
  const { currentYear } = useAcademicYears()

  // Institution mode — schools pick a Grade, LC/coaching/college pick a Course.
  const [isLC, setIsLC] = useState<boolean | null>(null)
  useEffect(() => {
    fetch('/api/v1/settings/org-type')
      .then(r => r.json())
      .then(json => setIsLC(isLearningCentre(json?.data?.institutionType)))
      .catch(() => setIsLC(false))
  }, [])
  const { options: courseOptions } = useCourseOptions(isLC === true)

  // Form State
  const [grade, setGrade] = useState('')
  const [courseId, setCourseId] = useState('')
  const [invoiceType, setInvoiceType] = useState<'TERM' | 'ADHOC'>('TERM')
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')

  // LC/coaching: billing frequency for the recurring round, seeded from the
  // course's own configured frequency (Settings → Courses) and editable here.
  const [courseFrequency, setCourseFrequency] = useState('MONTHLY')
  const [autoSeededCourseId, setAutoSeededCourseId] = useState<string | null>(null)

  // Adhoc/Manual Items State
  const [manualItems, setManualItems] = useState<ManualItem[]>([])

  const [isPlanDropdownExpanded, setIsPlanDropdownExpanded] = useState(false)
  const [hasManuallyChangedPlan, setHasManuallyChangedPlan] = useState(false)

  // Canonical label — must read the same as Lead/Admission grade dropdowns
  const getGradeDisplayLabel = (val: string) => getGradeLabel(mapGradeValue(val))

  const selectedGradeLabel = grade ? getGradeLabel(grade) : ''
  const selectedCourse = courseOptions.find(c => c.id === courseId)
  const selectedCourseLabel = selectedCourse?.name ?? ''

  // The active target (grade slug or courseId) driving count/plan lookups
  const targetSelected = isLC ? courseId !== '' : grade !== ''

  // Fetch active student count for selected grade/course
  const { data: studentCountData, isLoading: isCountLoading } = useSWR<{ success: boolean; data: { count: number } }>(
    isLC
      ? (courseId ? `/api/v1/students?courseId=${encodeURIComponent(courseId)}&status=ACTIVE&limit=1&countOnly=true` : null)
      : (grade ? `/api/v1/students?gradeLabel=${encodeURIComponent(selectedGradeLabel)}&status=ACTIVE&limit=1&countOnly=true` : null),
    fetcher
  )
  const activeStudentCount = studentCountData?.data?.count ?? 0

  // SWR Fetches — school terms only; LC/coaching has no term concept, it
  // bills on a recurring cadence instead (see courseFrequency below).
  const { data: termsData } = useSWR<{ success: boolean; data: Term[] }>(
    isLC === false && currentYear?.id ? `/api/v1/settings/terms?academicYearId=${currentYear.id}` : null,
    fetcher
  )

  const { data: plansData } = useSWR<{ success: boolean; data: FeePlan[] }>(
    '/api/v1/fees/plans',
    fetcher
  )

  const schoolTerms = React.useMemo(() => termsData?.data || [], [termsData])
  // LC/coaching: one synthetic "term" standing in for the recurring billing
  // round, so the existing per-term section machinery (Preview step, batch
  // builder) works unchanged.
  const lcTerms = React.useMemo<Term[]>(
    () => (courseId ? [{ id: 'course-recurring', name: `${RECURRING_FREQUENCY_LABELS[courseFrequency] ?? courseFrequency} Billing`, startDate: '', endDate: '', order: 1 }] : []),
    [courseId, courseFrequency]
  )
  const terms = isLC ? lcTerms : schoolTerms
  const plans = React.useMemo(() => plansData?.data || [], [plansData])

  // Filter plans matching the selected grade or course
  const filteredPlans = React.useMemo(
    () => plans.filter(p => (isLC ? p.courseId === courseId : p.gradeLabel === selectedGradeLabel)),
    [plans, isLC, courseId, selectedGradeLabel]
  )

  // Seed billing frequency from the course's own setting when it changes
  useEffect(() => {
    if (isLC && selectedCourse) {
      setCourseFrequency(selectedCourse.frequency)
    }
  }, [isLC, selectedCourse])

  // Auto-select the synthetic recurring "term" so validity/section logic
  // needs no user action for LC mode
  useEffect(() => {
    if (isLC && courseId && invoiceType === 'TERM') {
      setSelectedTermIds(['course-recurring'])
    } else if (isLC) {
      setSelectedTermIds([])
    }
  }, [isLC, courseId, invoiceType])

  // Auto-fill one invoice item from the course's own price when no fee plan
  // template overrides it — the course record IS the fee definition for LC.
  useEffect(() => {
    if (!isLC || !courseId || !selectedCourse) return
    if (filteredPlans.length > 0) return
    if (autoSeededCourseId === courseId) return
    setManualItems([{ id: `course-${courseId}`, name: selectedCourse.name, amount: Number(selectedCourse.amount), quantity: 1 }])
    setAutoSeededCourseId(courseId)
  }, [isLC, courseId, selectedCourse, filteredPlans, autoSeededCourseId])

  // Auto-suggest fee plan logic
  useEffect(() => {
    if (!targetSelected || invoiceType !== 'TERM') {
      setSelectedPlanId('')
      setHasManuallyChangedPlan(false)
      setIsPlanDropdownExpanded(false)
      return
    }
    if (filteredPlans.length === 1) {
      setSelectedPlanId(filteredPlans[0].id)
      setHasManuallyChangedPlan(false)
    } else if (filteredPlans.length > 1) {
      if (!hasManuallyChangedPlan) {
        setSelectedPlanId('')
      }
    } else {
      setSelectedPlanId('')
    }
  }, [targetSelected, invoiceType, filteredPlans, hasManuallyChangedPlan])

  // Get active items to submit
  const getSubmittingItems = (): any[] => {
    if (invoiceType === 'ADHOC') {
      return manualItems.map(item => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        appliesTo: 'ALL_TERMS',
        assignedTermOrder: null
      }))
    }

    const selectedPlan = plans.find(p => p.id === selectedPlanId)
    if (selectedPlan?.structure?.heads) {
      return selectedPlan.structure.heads.map(h => ({
        id: h.id,
        name: h.name,
        amount: h.amount,
        appliesTo: h.appliesTo,
        assignedTermOrder: h.assignedTermOrder ?? null
      }))
    }

    return manualItems.map(item => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      appliesTo: 'ALL_TERMS',
      assignedTermOrder: null
    }))
  }

  // Handle Terms Checklist Toggles
  const handleTermToggle = (termId: string) => {
    setSelectedTermIds(prev =>
      prev.includes(termId) ? prev.filter(id => id !== termId) : [...prev, termId]
    )
  }

  const isFormValid =
    targetSelected &&
    (!isCountLoading && activeStudentCount > 0) &&
    (invoiceType === 'ADHOC' || selectedTermIds.length > 0) &&
    (invoiceType === 'ADHOC'
      ? manualItems.length > 0
      : selectedPlanId !== '' || manualItems.length > 0)

  useEffect(() => {
    onValidityChange(isFormValid)
  }, [isFormValid, onValidityChange])

  const handlePreviewSubmit = () => {
    if (!isFormValid) return

    // Keep the course's Settings-page frequency in sync with whatever
    // cadence was picked here, so the auto-invoice cron bills on it going forward.
    if (isLC && courseId && invoiceType === 'TERM' && selectedCourse && courseFrequency !== selectedCourse.frequency) {
      fetch(`/api/v1/settings/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency: courseFrequency })
      }).catch(() => {})
    }

    const selectedTermsList = terms
      .filter(t => selectedTermIds.includes(t.id))
      .sort((a, b) => a.order - b.order)

    onSubmit({
      grade: isLC ? '' : grade,
      selectedGradeLabel: isLC ? undefined : selectedGradeLabel,
      courseId: isLC ? courseId : undefined,
      selectedCourseLabel: isLC ? selectedCourseLabel : undefined,
      invoiceType,
      selectedTerms: selectedTermsList,
      selectedPlanId: invoiceType === 'TERM' && selectedPlanId ? selectedPlanId : null,
      items: getSubmittingItems()
    })
  }

  useImperativeHandle(ref, () => ({ submit: handlePreviewSubmit }))

  // Date Formatter Helper
  const formatDateRange = (start: string, end: string) => {
    try {
      const s = new Date(start)
      const e = new Date(end)
      const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' }
      return `${s.toLocaleString('en-US', options)} – ${e.toLocaleString('en-US', options)}`
    } catch {
      return ''
    }
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId)
  const targetDisplayLabel = isLC ? selectedCourseLabel : getGradeDisplayLabel(grade)

  return (
    <div className="flex flex-col gap-6 bg-white rounded-xl border border-slate-200 p-6">
      {/* ── DETAILS ── */}
      <div className="flex flex-col gap-6">
        {/* Grade / Course Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {isLC ? 'Course' : 'Grade'} <span className="text-red-500">*</span>
          </label>
          {isLC ? (
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left h-10 flex items-center justify-between">
                <SelectValue placeholder="Select Course..." />
              </SelectTrigger>
              <SelectContent>
                {courseOptions.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left h-10 flex items-center justify-between">
                <SelectValue placeholder="Select Grade..." />
              </SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS.map(g => (
                  <SelectItem key={g.value} value={g.value}>
                    {getGradeDisplayLabel(g.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {targetSelected && (
            <div className="mt-2">
              {isCountLoading ? (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500 animate-pulse" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800 leading-none">
                      {targetDisplayLabel}
                    </p>
                    <p className="text-xs text-blue-400 mt-1 select-none font-semibold">
                      Loading...
                    </p>
                  </div>
                </div>
              ) : activeStudentCount === 0 ? (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-xs text-amber-600 font-bold select-none">
                      No active students found in {targetDisplayLabel}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800 leading-none">
                      {targetDisplayLabel}
                    </p>
                    <p className="text-xs text-blue-600 mt-1 font-semibold select-none">
                      {activeStudentCount} active students will be invoiced
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invoice Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Invoice Type <span className="text-red-500">*</span>
          </label>
          <SegmentedControl
            options={[
              { value: 'TERM', label: isLC ? 'Recurring' : 'Term' },
              { value: 'ADHOC', label: 'Adhoc' }
            ]}
            value={invoiceType}
            onChange={val => {
              setInvoiceType(val)
              if (val === 'ADHOC') setSelectedPlanId('')
            }}
          />
        </div>

        {/* Billing Frequency (LC/coaching Recurring mode) */}
        {isLC && invoiceType === 'TERM' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Billing Frequency <span className="text-red-500">*</span>
            </label>
            <Select value={courseFrequency} onValueChange={setCourseFrequency}>
              <SelectTrigger className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left h-10 flex items-center justify-between">
                <SelectValue placeholder="Select frequency..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RECURRING_FREQUENCY_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Changing this updates the course's billing cycle in Settings → Courses.
            </p>
          </div>
        )}

        {/* Term Selection (schools only — LC/coaching bills on a recurring cadence, not terms) */}
        {invoiceType === 'TERM' && !isLC && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Select Terms <span className="text-red-500">*</span>
            </label>
            {terms.length === 0 ? (
              <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-3">
                No terms configured. Go to Settings → Terms to add terms first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {terms.map(term => {
                  const isChecked = selectedTermIds.includes(term.id)
                  return (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => handleTermToggle(term.id)}
                      className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all select-none cursor-pointer ${
                        isChecked
                          ? 'border-[#1565D8] bg-blue-50/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="rounded border-slate-300 text-[#1565D8] focus:ring-[#1565D8] h-4 w-4 shrink-0 pointer-events-none"
                        />
                        <span className="text-sm font-bold text-slate-800">{term.name}</span>
                      </div>
                      <span className="text-xs text-slate-400 mt-1.5 pl-6 font-medium">
                        {formatDateRange(term.startDate, term.endDate)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Smart Auto-Apply Fee Plan Info Line (Term mode only) */}
        {invoiceType === 'TERM' && targetSelected && (
          <div className="flex flex-col gap-1.5 animate-fadeIn">
            {filteredPlans.length === 1 ? (
              /* SCENARIO A: Exactly one plan matches */
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-600 font-medium">
                      Using fee plan: <strong className="text-slate-800">"{filteredPlans[0].name}"</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPlanDropdownExpanded(prev => !prev)}
                    className="text-xs text-[#1565D8] underline hover:text-blue-800 transition-colors font-bold cursor-pointer select-none shrink-0"
                  >
                    {hasManuallyChangedPlan ? 'Using custom plan ✓' : 'Change Plan ↓'}
                  </button>
                </div>

                {isPlanDropdownExpanded && (
                  <div className="mt-1 pt-2 border-t border-slate-200 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500">
                      Select a different plan
                    </label>
                    <Select
                      value={selectedPlanId}
                      onValueChange={(val) => {
                        setSelectedPlanId(val)
                        setHasManuallyChangedPlan(true)
                      }}
                    >
                      <SelectTrigger className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left h-10 flex items-center justify-between">
                        <SelectValue placeholder="Select plan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPlans.map(plan => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : filteredPlans.length > 1 ? (
              /* SCENARIO B: Multiple plans found */
              <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xs text-amber-700 font-bold select-none">
                    Multiple plans found for {targetDisplayLabel}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-amber-800">
                    Select one:
                  </label>
                  <Select
                    value={selectedPlanId}
                    onValueChange={(val) => {
                      setSelectedPlanId(val)
                      setHasManuallyChangedPlan(true)
                    }}
                  >
                    <SelectTrigger className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left h-10 flex items-center justify-between text-amber-900 font-semibold shadow-sm">
                      <SelectValue placeholder="Select fee plan ▼" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : isLC ? (
              /* SCENARIO C (LC): course's own price is the fee — no template needed */
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-600 font-medium">
                  Billing ₹{selectedCourse ? Number(selectedCourse.amount).toLocaleString('en-IN') : 0} per {(RECURRING_FREQUENCY_LABELS[courseFrequency] ?? courseFrequency).toLowerCase()} cycle — edit below if needed
                </span>
              </div>
            ) : (
              /* SCENARIO C: No plan matches */
              <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3.5 flex items-start gap-2.5 shadow-sm">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 select-none">
                    No fee plan found for {targetDisplayLabel}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5 select-none font-medium">
                    You can add items manually below
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FEE ITEMS ── */}
      <div className="flex flex-col gap-6 border-t border-slate-100 pt-6">
        {invoiceType === 'TERM' && selectedPlan?.structure?.heads ? (
          /* Read-only plan items — amounts editable per term in the preview step */
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Fee Plan Items
              </label>
              <span className="text-xs text-slate-400">
                from "{selectedPlan.name}"
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {selectedPlan.structure.heads.map(h => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{h.name}</p>
                    <p className="text-xs text-slate-400">
                      {h.appliesTo === 'ALL_TERMS'
                        ? 'Every selected term'
                        : h.appliesTo === 'FIRST_TERM'
                        ? 'First term only'
                        : h.appliesTo === 'LAST_TERM'
                        ? 'Last term only'
                        : h.assignedTermOrder
                        ? `Term ${h.assignedTermOrder} only`
                        : 'Custom'}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 flex-shrink-0">
                    ₹{h.amount.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              You can fine-tune amounts per term in the Preview step.
            </p>
          </div>
        ) : (
          <ManualItemsEditor
            items={manualItems}
            onAdd={item => setManualItems(prev => [...prev, item])}
            onRemove={id => setManualItems(prev => prev.filter(item => item.id !== id))}
          />
        )}
      </div>
    </div>
  )
})

export default ClassModeForm
