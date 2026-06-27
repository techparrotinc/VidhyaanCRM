'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, DollarSign, X } from 'lucide-react'
import { GRADE_OPTIONS } from '@/constants/grades'

const FREQUENCY_LABELS: Record<string, string> = {
  ONE_TIME: 'One Time',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half Yearly',
  ANNUAL: 'Annual',
  CUSTOM: 'Custom'
}

const APPLIES_TO_LABELS: Record<string, string> = {
  ALL_TERMS: 'All Terms',
  FIRST_TERM: 'First Term Only',
  LAST_TERM: 'Last Term Only',
  CUSTOM: 'Custom'
}

type FeeHead = {
  id: string
  name: string
  frequency: string
  amount: number
  isOptional: boolean
  appliesTo: string
}

type FeePlan = {
  id: string
  name: string
  gradeLabel: string | null
  institutionType: string | null
  structure: { heads: FeeHead[] } | null
  createdAt: string
}

export default function FeePlansSettingsPage() {
  const [plans, setPlans] = useState<FeePlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<FeePlan | null>(null)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    gradeLabel: ''
  })

  const [heads, setHeads] = useState<FeeHead[]>([])

  const [newHead, setNewHead] = useState({
    name: '',
    frequency: 'MONTHLY',
    amount: '',
    isOptional: false,
    appliesTo: 'ALL_TERMS'
  })

  const fetchPlans = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/v1/fees/plans')
      const data = await res.json()
      setPlans(data.data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleAddHead = () => {
    if (!newHead.name.trim() || !newHead.amount || isNaN(Number(newHead.amount))) {
      return
    }
    setHeads(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newHead.name,
        frequency: newHead.frequency,
        amount: Number(newHead.amount),
        isOptional: newHead.isOptional,
        appliesTo: newHead.appliesTo
      }
    ])
    setNewHead({
      name: '',
      frequency: 'MONTHLY',
      amount: '',
      isOptional: false,
      appliesTo: 'ALL_TERMS'
    })
  }

  const handleRemoveHead = (id: string) => {
    setHeads(prev => prev.filter(h => h.id !== id))
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Plan name is required')
      return
    }
    if (heads.length === 0) {
      setError('Add at least one fee head')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const url = editingPlan ? `/api/v1/fees/plans/${editingPlan.id}` : '/api/v1/fees/plans'
      const method = editingPlan ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          gradeLabel: form.gradeLabel || undefined,
          structure: { heads }
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message ?? 'Failed to save')
      }

      await fetchPlans()
      resetForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setForm({ name: '', gradeLabel: '' })
    setHeads([])
    setNewHead({
      name: '',
      frequency: 'MONTHLY',
      amount: '',
      isOptional: false,
      appliesTo: 'ALL_TERMS'
    })
    setEditingPlan(null)
    setShowForm(false)
    setError(null)
  }

  const handleEdit = (plan: FeePlan) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      gradeLabel: plan.gradeLabel ?? ''
    })
    setHeads(plan.structure?.heads ?? [])
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fee plan? This cannot be undone.')) return
    await fetch(`/api/v1/fees/plans/${id}`, { method: 'DELETE' })
    await fetchPlans()
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Fee Plans</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Define fee structures with multiple fee heads. Used when generating invoices.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </button>
      </div>

      {/* ── ADD / EDIT FORM ── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-slate-700">
            {editingPlan ? 'Edit Fee Plan' : 'New Fee Plan'}
          </h2>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Plan Name + Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 sm:col-span-1">
              <label className="text-xs font-medium text-slate-600">
                Plan Name
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Standard Fee — Class 5"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Applicable Grade
              </label>
              <select
                value={form.gradeLabel}
                onChange={e => setForm(prev => ({ ...prev, gradeLabel: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">All Grades / Not grade-specific</option>
                {GRADE_OPTIONS.map(g => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── FEE HEADS ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Fee Heads
              </h3>
              <span className="text-xs text-slate-400">
                {heads.length} head{heads.length !== 1 ? 's' : ''} added
              </span>
            </div>

            {/* Existing heads */}
            {heads.length > 0 && (
              <div className="flex flex-col gap-2">
                {heads.map(head => (
                  <div
                    key={head.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">
                          {head.name}
                        </p>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {FREQUENCY_LABELS[head.frequency]}
                        </span>
                        {head.isOptional && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            Optional
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {APPLIES_TO_LABELS[head.appliesTo]}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        ₹{head.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveHead(head.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new head form */}
            <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col gap-3">
              <p className="text-xs font-medium text-slate-500">
                Add Fee Head
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Head Name */}
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <input
                    value={newHead.name}
                    onChange={e => setNewHead(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Fee head name e.g. Tuition Fee"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1">
                  <input
                    type="number"
                    value={newHead.amount}
                    onChange={e => setNewHead(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Amount (₹)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Frequency */}
                <div className="flex flex-col gap-1">
                  <select
                    value={newHead.frequency}
                    onChange={e => setNewHead(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {Object.entries(FREQUENCY_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Applies To */}
                <div className="flex flex-col gap-1">
                  <select
                    value={newHead.appliesTo}
                    onChange={e => setNewHead(prev => ({ ...prev, appliesTo: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {Object.entries(APPLIES_TO_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isOptional"
                    checked={newHead.isOptional}
                    onChange={e => setNewHead(prev => ({ ...prev, isOptional: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <label htmlFor="isOptional" className="text-xs text-slate-600 cursor-pointer">
                    Optional fee head
                  </label>
                </div>
              </div>

              <button
                onClick={handleAddHead}
                disabled={!newHead.name.trim() || !newHead.amount}
                className="w-full py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                + Add Fee Head
              </button>
            </div>
          </div>

          {/* Total */}
          {heads.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">
                Total (all heads)
              </span>
              <span className="text-sm font-bold text-blue-900">
                ₹{heads.reduce((sum, h) => sum + h.amount, 0).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Save Plan'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── PLANS LIST ── */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
            Loading fee plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500">
              No fee plans created yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Create fee plans to use when generating invoices
            </p>
          </div>
        ) : (
          plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Plan header row */}
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800 font-bold">
                      {plan.name}
                    </p>
                    {plan.gradeLabel && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 flex-shrink-0">
                        {plan.gradeLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {plan.structure?.heads?.length ?? 0} fee head
                    {(plan.structure?.heads?.length ?? 0) !== 1 ? 's' : ''}
                    {' · '}Total: ₹
                    {(plan.structure?.heads?.reduce((sum, h) => sum + h.amount, 0) ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setExpandedPlanId(prev => (prev === plan.id ? null : plan.id))}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    {expandedPlanId === plan.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded fee heads */}
              {expandedPlanId === plan.id && plan.structure?.heads && plan.structure.heads.length > 0 && (
                <div className="border-t border-slate-100 px-4 pb-4">
                  <table className="w-full mt-3">
                    <thead>
                      <tr className="text-left">
                        <th className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 pb-2">
                          Fee Head
                        </th>
                        <th className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 pb-2">
                          Frequency
                        </th>
                        <th className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 pb-2">
                          Applies To
                        </th>
                        <th className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 pb-2 text-right">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.structure.heads.map(head => (
                        <tr key={head.id} className="border-t border-slate-100">
                          <td className="py-2 text-sm text-slate-700 font-medium">
                            {head.name}
                            {head.isOptional && (
                              <span className="ml-1.5 text-[11px] text-amber-600 font-normal">
                                (optional)
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-xs text-slate-500">
                            {FREQUENCY_LABELS[head.frequency]}
                          </td>
                          <td className="py-2 text-xs text-slate-500">
                            {APPLIES_TO_LABELS[head.appliesTo]}
                          </td>
                          <td className="py-2 text-sm font-bold text-slate-900 text-right">
                            ₹{head.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
