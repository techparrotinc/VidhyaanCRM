import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { GRADE_OPTIONS } from '@/constants/grades'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { AlertCircle, Plus, X } from 'lucide-react'

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

interface ManualItem {
  id: string
  name: string
  amount: number
  quantity: number
}

interface ClassModeFormProps {
  onSubmit: (data: {
    grade: string
    invoiceType: 'TERM' | 'ADHOC'
    selectedTerms: Term[]
    selectedPlanId: string | null
    items: { id: string; name: string; amount: number; appliesTo: string; assignedTermOrder?: number | null }[]
  }) => void
}

export default function ClassModeForm({ onSubmit }: ClassModeFormProps) {
  const { currentYear } = useAcademicYears()

  // Form State
  const [grade, setGrade] = useState('')
  const [invoiceType, setInvoiceType] = useState<'TERM' | 'ADHOC'>('TERM')
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  
  // Adhoc/Manual Items State
  const [manualItems, setManualItems] = useState<ManualItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')

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

  // Filter plans matching grade
  const filteredPlans = React.useMemo(() => plans.filter(p => p.gradeLabel === grade), [plans, grade])

  // Auto-suggest fee plan logic
  useEffect(() => {
    if (!grade || invoiceType !== 'TERM') {
      setSelectedPlanId('')
      return
    }
    if (filteredPlans.length === 1) {
      setSelectedPlanId(filteredPlans[0].id)
    } else {
      setSelectedPlanId('')
    }
  }, [grade, invoiceType, filteredPlans])

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

  // Handle Manual Item Addition
  const handleAddManualItem = () => {
    if (!newItemName.trim() || !newItemAmount || isNaN(Number(newItemAmount))) return
    setManualItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newItemName.trim(),
        amount: Number(newItemAmount),
        quantity: 1
      }
    ])
    setNewItemName('')
    setNewItemAmount('')
  }

  const handleRemoveManualItem = (id: string) => {
    setManualItems(prev => prev.filter(item => item.id !== id))
  }

  // Form Validation
  const isFormValid =
    grade !== '' &&
    (invoiceType === 'ADHOC'
      ? manualItems.length > 0
      : selectedTermIds.length > 0 && (selectedPlanId !== '' || manualItems.length > 0))

  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    const selectedTermsList = terms
      .filter(t => selectedTermIds.includes(t.id))
      .sort((a, b) => a.order - b.order)

    onSubmit({
      grade,
      invoiceType,
      selectedTerms: selectedTermsList,
      selectedPlanId: invoiceType === 'TERM' && selectedPlanId ? selectedPlanId : null,
      items: getSubmittingItems()
    })
  }

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

  return (
    <form onSubmit={handlePreviewSubmit} className="flex flex-col gap-6 bg-white rounded-xl border border-slate-200 p-5">
      {/* Grade Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Grade <span className="text-red-500">*</span>
        </label>
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left h-10 flex items-center justify-between">
            <SelectValue placeholder="Select Grade..." />
          </SelectTrigger>
          <SelectContent>
            {GRADE_OPTIONS.map(g => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Invoice Type <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInvoiceType('TERM')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg border transition-colors ${
              invoiceType === 'TERM'
                ? 'bg-[#1565D8] text-white border-[#1565D8]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Term
          </button>
          <button
            type="button"
            onClick={() => {
              setInvoiceType('ADHOC')
              setSelectedPlanId('')
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg border transition-colors ${
              invoiceType === 'ADHOC'
                ? 'bg-[#1565D8] text-white border-[#1565D8]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Adhoc
          </button>
        </div>
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

      {/* Fee Plan (Term mode only) */}
      {invoiceType === 'TERM' && grade && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Fee Plan
          </label>
          {filteredPlans.length === 0 ? (
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">No fee plan found for this grade.</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You can add items manually below.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left h-10 flex items-center justify-between">
                  <SelectValue placeholder="Select fee plan..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredPlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                Fee heads will be auto-populated from the selected plan
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Item Entry (Always shown in Adhoc, or in Term when no Plan matches or Plan is unselected) */}
      {(invoiceType === 'ADHOC' || (invoiceType === 'TERM' && !selectedPlanId)) && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Invoice Items <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-400">
              {manualItems.length} item{manualItems.length !== 1 ? 's' : ''} added
            </span>
          </div>

          {/* List of Manual Items */}
          {manualItems.length > 0 && (
            <div className="flex flex-col gap-2">
              {manualItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">₹{item.amount.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveManualItem(item.id)}
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Manual Item Inputs */}
          <div className="border border-dashed border-slate-300 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs font-medium text-slate-500">Add Item</p>
            <input
              type="text"
              placeholder="Fee head name e.g. Book Set"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Amount (₹)"
                value={newItemAmount}
                onChange={e => setNewItemAmount(e.target.value)}
                min={0}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <button
                type="button"
                onClick={handleAddManualItem}
                disabled={!newItemName.trim() || !newItemAmount}
                className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 bg-white"
              >
                <Plus className="w-4 h-4 inline mr-1" /> Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        type="submit"
        disabled={!isFormValid}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold bg-[#1565D8] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed text-center select-none"
      >
        Preview & Schedule →
      </button>
    </form>
  )
}
