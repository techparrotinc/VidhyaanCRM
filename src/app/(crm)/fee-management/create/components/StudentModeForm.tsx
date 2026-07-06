import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { AlertCircle, X, Search, Info } from 'lucide-react'
import { mapGradeValue } from '@/lib/utils/gradeMapping'
import { getGradeLabel } from '@/constants/grades'
import SegmentedControl from './SegmentedControl'
import ManualItemsEditor, { type ManualItem } from './ManualItemsEditor'
import type { WizardFormHandle } from './ClassModeForm'

interface Student {
  id: string
  name: string
  studentCode: string
  gradeLabel: string | null
  guardianName: string | null
  guardianPhone: string | null
}

interface Term {
  id: string
  name: string
  startDate: string
  endDate: string
  order: number
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
  structure: { heads: FeeHead[] } | null
}

interface StudentModeFormProps {
  onValidityChange: (valid: boolean) => void
  onSubmit: (data: {
    student: Student
    invoiceType: 'TERM' | 'ADHOC'
    selectedTerms: Term[]
    selectedPlanId: string | null
    items: { id: string; name: string; amount: number; appliesTo: string; assignedTermOrder?: number | null }[]
  }) => void
}

const StudentModeForm = forwardRef<WizardFormHandle, StudentModeFormProps>(
  function StudentModeForm({ onValidityChange, onSubmit }, ref) {
  const { currentYear } = useAcademicYears()

  // Form State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentsList, setStudentsList] = useState<Student[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const [invoiceType, setInvoiceType] = useState<'TERM' | 'ADHOC'>('TERM')
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')

  // Adhoc/Manual Items State
  const [manualItems, setManualItems] = useState<ManualItem[]>([])

  const [isPlanDropdownExpanded, setIsPlanDropdownExpanded] = useState(false)
  const [hasManuallyChangedPlan, setHasManuallyChangedPlan] = useState(false)

  const getGradeDisplayLabel = (val: string) => {
    const mapped = mapGradeValue(val)
    return getGradeLabel(mapped).replace(/^Class\s+/i, 'Grade ')
  }

  // SWR Fetches
  const { data: termsData } = useSWR<{ success: boolean; data: Term[] }>(
    currentYear?.id ? `/api/v1/settings/terms?academicYearId=${currentYear.id}` : null,
    fetcher
  )

  const { data: plansData } = useSWR<{ success: boolean; data: FeePlan[] }>(
    '/api/v1/fees/plans',
    fetcher
  )

  const terms = React.useMemo(() => termsData?.data || [], [termsData])
  const plans = React.useMemo(() => plansData?.data || [], [plansData])

  // Student Search Debounced Fetch
  useEffect(() => {
    if (!studentSearch.trim() || studentSearch.length < 2) {
      setStudentsList([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(
          `/api/v1/students?search=${encodeURIComponent(studentSearch)}&limit=10`
        )
        const data = await res.json()
        setStudentsList(data.data ?? [])
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [studentSearch])

  // Filter plans matching student's grade
  const filteredPlans = React.useMemo(() => plans.filter(p => p.gradeLabel === selectedStudent?.gradeLabel), [plans, selectedStudent?.gradeLabel])

  // Auto-suggest fee plan logic
  useEffect(() => {
    if (!selectedStudent?.gradeLabel || invoiceType !== 'TERM') {
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
  }, [selectedStudent, invoiceType, filteredPlans, hasManuallyChangedPlan])

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

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    setStudentSearch('')
    setShowDropdown(false)
  }

  const isFormValid =
    selectedStudent !== null &&
    (invoiceType === 'ADHOC' || selectedTermIds.length > 0) &&
    (invoiceType === 'ADHOC'
      ? manualItems.length > 0
      : selectedPlanId !== '' || manualItems.length > 0)

  useEffect(() => {
    onValidityChange(isFormValid)
  }, [isFormValid, onValidityChange])

  const handlePreviewSubmit = () => {
    if (!isFormValid || !selectedStudent) return

    const selectedTermsList = terms
      .filter(t => selectedTermIds.includes(t.id))
      .sort((a, b) => a.order - b.order)

    onSubmit({
      student: selectedStudent,
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

  return (
    <div className="flex flex-col gap-6 bg-white rounded-xl border border-slate-200 p-6">
      {/* ── DETAILS ── */}
      <div className="flex flex-col gap-6">
        {/* Student Search */}
        <div className="flex flex-col gap-1.5 relative">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Search Student <span className="text-red-500">*</span>
          </label>

          {selectedStudent ? (
            <div className="flex items-center justify-between gap-3 p-3.5 bg-blue-50/50 rounded-xl border border-blue-200">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">{selectedStudent.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                  {selectedStudent.studentCode}
                  {selectedStudent.gradeLabel && ` · ${getGradeDisplayLabel(selectedStudent.gradeLabel)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null)
                  setSelectedPlanId('')
                  setManualItems([])
                }}
                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student by name or ID..."
                value={studentSearch}
                onChange={e => {
                  setStudentSearch(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
              />

              {showDropdown && (studentsList.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-20 max-h-48 overflow-y-auto">
                  {isSearching ? (
                    <div className="px-3 py-2 text-sm text-slate-400">Searching...</div>
                  ) : (
                    studentsList.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        className="w-full px-3 py-2.5 text-left hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-100"
                      >
                        <p className="text-sm font-bold text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Code: {s.studentCode} {s.gradeLabel && ` · ${getGradeDisplayLabel(s.gradeLabel)}`}
                        </p>
                      </button>
                    ))
                  )}
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
              { value: 'TERM', label: 'Term' },
              { value: 'ADHOC', label: 'Adhoc' }
            ]}
            value={invoiceType}
            onChange={val => {
              setInvoiceType(val)
              if (val === 'ADHOC') setSelectedPlanId('')
            }}
          />
        </div>

        {/* Term Selection (Term mode only) */}
        {invoiceType === 'TERM' && (
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
        {invoiceType === 'TERM' && selectedStudent?.gradeLabel && (
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
                    Multiple plans found for {getGradeDisplayLabel(selectedStudent.gradeLabel)}
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
            ) : (
              /* SCENARIO C: No plan matches */
              <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3.5 flex items-start gap-2.5 shadow-sm">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 select-none">
                    No fee plan found for {getGradeDisplayLabel(selectedStudent.gradeLabel)}
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

export default StudentModeForm
