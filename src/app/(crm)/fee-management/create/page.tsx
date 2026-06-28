'use client'

import { useState, useEffect,
  useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save,
  Plus, X, Search } from 'lucide-react'
import { useAcademicYears }
  from '@/hooks/useAcademicYears'

type Student = {
  id: string
  name: string
  studentCode: string
  gradeLabel: string | null
  guardianName: string | null
  guardianPhone: string | null
}

type Term = {
  id: string
  name: string
  startDate: string
  endDate: string
}

type FeePlan = {
  id: string
  name: string
  gradeLabel: string | null
  structure: {
    heads: {
      id: string
      name: string
      frequency: string
      amount: number
      isOptional: boolean
      appliesTo: string
    }[]
  } | null
}

type InvoiceItem = {
  id: string
  head: string
  amount: number
  quantity: number
}

type InvoiceType = 'TERM' | 'ADHOC'

export default function FeeManagementCreatePage() {
  const router = useRouter()
  const { years, currentYear } =
    useAcademicYears()

  // Invoice type selection
  const [invoiceType, setInvoiceType] =
    useState<InvoiceType>('ADHOC')

  // Student search
  const [studentSearch, setStudentSearch] =
    useState('')
  const [students, setStudents] =
    useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null)
  const [showStudentDropdown,
    setShowStudentDropdown] =
    useState(false)
  const [isSearching, setIsSearching] =
    useState(false)

  // Term selection (TERM type only)
  const [terms, setTerms] =
    useState<Term[]>([])
  const [selectedTermId, setSelectedTermId] =
    useState('')

  // Fee plan
  const [feePlans, setFeePlans] =
    useState<FeePlan[]>([])
  const [selectedPlanId, setSelectedPlanId] =
    useState('')

  // Invoice items
  const [items, setItems] =
    useState<InvoiceItem[]>([])
  const [newItem, setNewItem] = useState({
    head: '',
    amount: '',
    quantity: '1'
  })

  // Invoice details
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  // Form state
  const [isSubmitting, setIsSubmitting] =
    useState(false)
  const [error, setError] =
    useState<string | null>(null)

  // Fetch helpers
  useEffect(() => {
    if (!studentSearch.trim() ||
        studentSearch.length < 2) {
      setStudents([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(
          `/api/v1/students?search=${encodeURIComponent(studentSearch)}&limit=10`
        )
        const data = await res.json()
        setStudents(data.data ?? [])
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [studentSearch])

  const fetchTerms = useCallback(
    async () => {
      if (!currentYear?.id) return
      try {
        const res = await fetch(
          `/api/v1/settings/terms?academicYearId=${currentYear.id}`
        )
        const data = await res.json()
        setTerms(data.data ?? [])
      } catch (err) {
        console.error(err)
      }
    }, [currentYear]
  )

  useEffect(() => {
    fetchTerms()
  }, [fetchTerms])

  const fetchFeePlans =
    useCallback(async () => {
      try {
        const res = await fetch(
          '/api/v1/fees/plans'
        )
        const data = await res.json()
        setFeePlans(data.data ?? [])
      } catch (err) {
        console.error(err)
      }
    }, [])

  useEffect(() => {
    fetchFeePlans()
  }, [fetchFeePlans])

  // Fee plan selection handler
  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId)
    if (!planId) {
      setItems([])
      return
    }
    const plan = feePlans.find(
      p => p.id === planId
    )
    if (!plan?.structure?.heads) return

    const planItems = plan.structure.heads
      .map(head => ({
        id: head.id,
        head: head.name,
        amount: head.amount,
        quantity: 1
      }))
    setItems(planItems)
  }

  const handleStudentSelect = (
    student: Student
  ) => {
    setSelectedStudent(student)
    setStudentSearch('')
    setShowStudentDropdown(false)

    // Auto-suggest plan for grade
    if (student.gradeLabel) {
      const gradePlan = feePlans.find(
        p => p.gradeLabel ===
          student.gradeLabel
      )
      if (gradePlan) {
        handlePlanSelect(gradePlan.id)
      }
    }
  }

  // Item handlers
  const handleAddItem = () => {
    if (!newItem.head.trim() ||
        !newItem.amount ||
        isNaN(Number(newItem.amount))) {
      return
    }
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      head: newItem.head,
      amount: Number(newItem.amount),
      quantity: Number(newItem.quantity) || 1
    }])
    setNewItem({
      head: '',
      amount: '',
      quantity: '1'
    })
  }

  const handleRemoveItem = (id: string) => {
    setItems(prev =>
      prev.filter(i => i.id !== id)
    )
  }

  const totalAmount = items.reduce(
    (sum, i) => sum + (i.amount * i.quantity),
    0
  )

  // Submit handler
  const handleSubmit = async () => {
    if (!selectedStudent) {
      setError('Please select a student')
      return
    }
    if (items.length === 0) {
      setError(
        'Add at least one invoice item'
      )
      return
    }
    if (invoiceType === 'TERM' &&
        !selectedTermId) {
      setError(
        'Please select a term for ' +
        'term-based invoice'
      )
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(
        '/api/v1/fees/invoices',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            studentId: selectedStudent.id,
            invoiceType,
            termId: invoiceType === 'TERM'
              ? selectedTermId
              : undefined,
            dueDate: dueDate || undefined,
            notes: notes || undefined,
            items: items.map(i => ({
              head: i.head,
              amount: i.amount,
              quantity: i.quantity
            }))
          })
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(
          data.message ??
          'Failed to create invoice'
        )
      }

      router.push('/fee-management')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 pt-6 pb-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/fee-management')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 flex-shrink-0 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              New Invoice
            </h1>
            <p className="text-xs text-slate-500">
              Create an invoice for a student
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0">
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>

      {/* ── ERROR BANNER ── */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── FORM BODY ── */}
      <div className="px-4 sm:px-6 py-6 flex-1">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

          {/* ── INVOICE TYPE TOGGLE ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Invoice Type
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setInvoiceType('ADHOC')
                  setSelectedTermId('')
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg border transition-colors ${
                  invoiceType === 'ADHOC'
                    ? 'bg-[#1565D8] text-white border-[#1565D8]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}>
                Adhoc Invoice
              </button>
              <button
                onClick={() => setInvoiceType('TERM')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg border transition-colors ${
                  invoiceType === 'TERM'
                    ? 'bg-[#1565D8] text-white border-[#1565D8]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}>
                Term Invoice
              </button>
            </div>

            {invoiceType === 'ADHOC' && (
              <p className="text-xs text-slate-400 mt-2">
                Create a one-off invoice for books, events, uniforms etc.
              </p>
            )}
            {invoiceType === 'TERM' && (
              <p className="text-xs text-slate-400 mt-2">
                Generate invoice for a specific academic term using a fee plan.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col gap-6">

              {/* Student Selection */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Student
                  <span className="text-red-500 ml-0.5">*</span>
                </h2>

                {selectedStudent ? (
                  <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {selectedStudent.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedStudent.studentCode}
                        {selectedStudent.gradeLabel && ` · ${selectedStudent.gradeLabel}`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStudent(null)
                        setItems([])
                        setSelectedPlanId('')
                      }}
                      className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-400 transition-colors">
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
                        setShowStudentDropdown(true)
                      }}
                      onFocus={() => setShowStudentDropdown(true)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {showStudentDropdown && (students.length > 0 || isSearching) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-20 max-h-48 overflow-y-auto">
                        {isSearching ? (
                          <div className="px-3 py-2 text-sm text-slate-400">
                            Searching...
                          </div>
                        ) : (
                          students.map(s => (
                            <button
                              key={s.id}
                              onClick={() => handleStudentSelect(s)}
                              className="w-full px-3 py-2.5 text-left hover:bg-slate-50 transition-colors">
                              <p className="text-sm font-semibold text-slate-800">
                                {s.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {s.studentCode}
                                {s.gradeLabel && ` · ${s.gradeLabel}`}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Term Selection (TERM only) */}
              {invoiceType === 'TERM' && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Term
                    <span className="text-red-500 ml-0.5">*</span>
                  </h2>

                  {terms.length === 0 ? (
                    <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-3">
                      No terms configured. Go to Settings → Terms to add terms first.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {terms.map(term => (
                        <button
                          key={term.id}
                          onClick={() => setSelectedTermId(term.id)}
                          className={`w-full px-3 py-2.5 text-left rounded-lg border transition-colors ${
                            selectedTermId === term.id
                              ? 'bg-blue-50 border-blue-300 text-blue-800'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}>
                          <p className="text-sm font-semibold">
                            {term.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fee Plan Selection */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Fee Plan
                  <span className="text-xs font-normal text-slate-400 ml-1 normal-case">
                    (optional — auto-fills items)
                  </span>
                </h2>

                {feePlans.length === 0 ? (
                  <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-3">
                    No fee plans created yet. Go to Settings → Fee Plans to create one.
                  </div>
                ) : (
                  <select
                    value={selectedPlanId}
                    onChange={e => handlePlanSelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Select fee plan...</option>
                    {feePlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                        {plan.gradeLabel ? ` (${plan.gradeLabel})` : ''}
                      </option>
                    ))}
                  </select>
                )}

                {selectedPlanId && (
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    ✓ Fee heads loaded from plan
                  </p>
                )}
              </div>

              {/* Due Date + Notes */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Invoice Details
                </h2>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col gap-6">

              {/* Invoice Items */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Invoice Items
                  <span className="text-red-500 ml-0.5">*</span>
                </h2>

                {/* Existing items */}
                {items.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            {item.head}
                          </p>
                          <p className="text-xs text-slate-400">
                            ₹{item.amount.toLocaleString('en-IN')}
                            {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <p className="text-sm font-bold text-slate-900">
                            ₹{(item.amount * item.quantity).toLocaleString('en-IN')}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add item form */}
                <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col gap-3">
                  <p className="text-xs font-medium text-slate-500">
                    Add Item
                  </p>

                  <input
                    value={newItem.head}
                    onChange={e =>
                      setNewItem(prev => ({
                        ...prev,
                        head: e.target.value
                      }))
                    }
                    placeholder="Fee head name e.g. Tuition Fee"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={newItem.amount}
                      onChange={e =>
                        setNewItem(prev => ({
                          ...prev,
                          amount: e.target.value
                        }))
                      }
                      placeholder="Amount (₹)"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={newItem.quantity}
                      onChange={e =>
                        setNewItem(prev => ({
                          ...prev,
                          quantity: e.target.value
                        }))
                      }
                      min={1}
                      placeholder="Qty"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleAddItem}
                    disabled={!newItem.head.trim() || !newItem.amount}
                    className="w-full py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <Plus className="w-4 h-4 inline mr-1" />
                    Add Item
                  </button>
                </div>

                {/* Total */}
                {items.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-semibold text-blue-700">
                      Invoice Total
                    </span>
                    <span className="text-lg font-bold text-blue-900">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE STICKY SAVE BAR ── */}
      <div className="lg:hidden sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 flex gap-3">
        <button
          onClick={() => router.push('/fee-management')}
          className="flex-1 py-2.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 py-2.5 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
          {isSubmitting ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>

    </div>
  )
}
