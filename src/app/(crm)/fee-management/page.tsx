"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Plus,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  User,
  X,
  Mail,
  MoreVertical,
  Printer,
  ChevronRight,
  TrendingUp,
  Download,
  IndianRupee,
  DollarSign,
  Briefcase,
  Users
} from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import TableSkeleton from '@/components/shared/TableSkeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'

// Status Badge Utility
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    UNPAID: 'bg-amber-50 text-amber-700 border-amber-100',
    PAID: 'bg-green-50 text-green-700 border-green-100',
    OVERDUE: 'bg-red-50 text-red-700 border-red-100',
    PARTIALLY_PAID: 'bg-blue-50 text-blue-700 border-blue-100',
    WAIVED: 'bg-slate-100 text-slate-600 border-slate-200'
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.UNPAID}`}>
      {status}
    </span>
  )
}

export default function FeeManagementPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialStudentId = searchParams.get('studentId') || ''
  const createForStudentId = searchParams.get('createInvoiceForStudentId') || ''

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'overdue' | 'plans'>('invoices')
  const [loading, setLoading] = useState(true)

  // Data states
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [overdueInvoices, setOverdueInvoices] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({
    collected: 0,
    overdue: 0,
    upcoming: 0,
    students: { paid: 0, overdue: 0, dueSoon: 0 }
  })
  const [academicYears, setAcademicYears] = useState<any[]>([])

  // Selection states (for bulk actions)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([])

  // Filter states
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('')
  const [dueDateFilter, setDueDateFilter] = useState('')

  // Modal control states
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [createPlanOpen, setCreatePlanOpen] = useState(false)

  // Success overlay toasts
  const [toastMessage, setToastMessage] = useState('')
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null)

  // Form states - Create Invoice
  const [studentSearchInput, setStudentSearchInput] = useState('')
  const [foundStudents, setFoundStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [invoiceDescription, setInvoiceDescription] = useState('Term 1 Fees 2026-27')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceDueDate, setInvoiceDueDate] = useState('')
  const [selectedFeePlanId, setSelectedFeePlanId] = useState('')
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('')
  const [invoiceNotes, setInvoiceNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states - Record Payment
  const [targetInvoice, setTargetInvoice] = useState<any | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CHEQUE' | 'ONLINE' | 'UPI' | 'NEFT_RTGS' | 'DD'>('CASH')
  const [chequeNumber, setChequeNumber] = useState('')
  const [chequeBank, setChequeBank] = useState('')
  const [ddNumber, setDdNumber] = useState('')
  const [ddBank, setDdBank] = useState('')
  const [neftRef, setNeftRef] = useState('')
  const [neftBank, setNeftBank] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])

  // Form states - Create Fee Plan
  const [planName, setPlanName] = useState('')
  const [planDescription, setPlanDescription] = useState('')
  const [planAmount, setPlanAmount] = useState('')
  const [planFrequency, setPlanFrequency] = useState('MONTHLY')

  // Fetch summary and tab-specific data
  const loadSummaryData = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/fees/summary')
      if (res.ok) {
        const json = await res.json()
        setSummary(json.data)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('limit', '50')
      if (initialStudentId) params.set('studentId', initialStudentId)
      if (invoiceStatusFilter) params.set('status', invoiceStatusFilter)
      // client-side search matches both name and code, so we fetch overall and filter or let backend do it
      const res = await fetch(`/api/v1/fees/invoices?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setInvoices(json.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [initialStudentId, invoiceStatusFilter])

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/fees/payments')
      if (res.ok) {
        const json = await res.json()
        setPayments(json.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadOverdue = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/fees/overdue')
      if (res.ok) {
        const json = await res.json()
        setOverdueInvoices(json.data?.invoices || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/fees/plans')
      if (res.ok) {
        const json = await res.json()
        setPlans(json.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/settings/academic-year')
      if (res.ok) {
        const json = await res.json()
        setAcademicYears(json.data || [])
        if (json.data?.length > 0) {
          const current = json.data.find((y: any) => y.status === 'ACTIVE')
          setSelectedAcademicYearId(current?.id || json.data[0].id)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Refetch when tab changes
  useEffect(() => {
    loadSummaryData()
    fetchAcademicYears()
    if (activeTab === 'invoices') loadInvoices()
    if (activeTab === 'payments') loadPayments()
    if (activeTab === 'overdue') loadOverdue()
    if (activeTab === 'plans') loadPlans()
  }, [activeTab, loadInvoices, loadPayments, loadOverdue, loadPlans, loadSummaryData, fetchAcademicYears])

  // Handle direct creation from URL param
  useEffect(() => {
    if (createForStudentId) {
      const init = async () => {
        try {
          const studentRes = await fetch(`/api/v1/students/${createForStudentId}`)
          if (studentRes.ok) {
            const studentJson = await studentRes.json()
            setSelectedStudent(studentJson.data)
            setStudentSearchInput(studentJson.data.name)
            setCreateInvoiceOpen(true)
          }
        } catch (e) {
          console.error(e)
        }
      }
      init()
    }
  }, [createForStudentId])

  // Student search for invoice modal
  useEffect(() => {
    if (!studentSearchInput.trim() || selectedStudent?.name === studentSearchInput) {
      setFoundStudents([])
      return
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/students?search=${studentSearchInput}&limit=5`)
        if (res.ok) {
          const json = await res.json()
          setFoundStudents(json.data || [])
        }
      } catch (e) {
        console.error(e)
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [studentSearchInput, selectedStudent])

  // Handler: Create Invoice Submission
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/v1/fees/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          description: invoiceDescription,
          totalAmount: parseFloat(invoiceAmount),
          dueDate: invoiceDueDate,
          feePlanId: selectedFeePlanId || undefined,
          academicYearId: selectedAcademicYearId || undefined
        })
      })

      if (res.ok) {
        const json = await res.json()
        const newInvoice = json.data
        setToastMessage(`Invoice ${newInvoice.invoiceNumber} created successfully`)
        setCreatedInvoiceId(newInvoice.id)
        setCreateInvoiceOpen(false)
        loadInvoices()
        loadSummaryData()
        // Reset states
        setSelectedStudent(null)
        setStudentSearchInput('')
        setInvoiceAmount('')
        setInvoiceDueDate('')
      } else {
        const errJson = await res.json()
        alert(errJson.message || 'Failed to create invoice')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler: Record Payment Submission
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetInvoice) return
    try {
      setIsSubmitting(true)
      const payload: any = {
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        notes: paymentNotes
      }

      if (paymentMethod === 'CHEQUE') {
        payload.chequeNumber = chequeNumber
        payload.bankName = chequeBank
      } else if (paymentMethod === 'DD') {
        payload.ddNumber = ddNumber
        payload.bankName = ddBank
      } else if (paymentMethod === 'NEFT_RTGS') {
        payload.neftRef = neftRef
        payload.bankName = neftBank
      }

      const res = await fetch(`/api/v1/fees/invoices/${targetInvoice.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const json = await res.json()
        alert(`Payment recorded. Receipt: ${json.receiptNumber}`)
        setRecordPaymentOpen(false)
        setTargetInvoice(null)
        loadInvoices()
        loadSummaryData()
        // Reset states
        setPaymentAmount('')
        setChequeNumber('')
        setChequeBank('')
        setDdNumber('')
        setDdBank('')
        setNeftRef('')
        setNeftBank('')
        setPaymentNotes('')
      } else {
        const errJson = await res.json()
        alert(errJson.message || 'Failed to record payment')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler: Create Fee Plan Submission
  const handleCreateFeePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/v1/fees/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName,
          description: planDescription,
          amount: parseFloat(planAmount),
          frequency: planFrequency
        })
      })

      if (res.ok) {
        setCreatePlanOpen(false)
        loadPlans()
        setPlanName('')
        setPlanDescription('')
        setPlanAmount('')
      } else {
        alert('Failed to create fee plan template')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Action: Trigger Send Email to Parent
  const sendEmailToParent = async () => {
    if (!createdInvoiceId) return
    try {
      const res = await fetch(`/api/v1/fees/invoices/${createdInvoiceId}/email`, {
        method: 'POST'
      })
      if (res.ok) {
        alert('Invoice notification sent to parent successfully.')
      } else {
        const err = await res.json()
        alert(err.message || 'Failed to send notification email. Verify if guardian email is configured.')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCreatedInvoiceId(null)
      setToastMessage('')
    }
  }

  // Invoice row checkbox handler
  const handleToggleSelectInvoice = (id: string) => {
    setSelectedInvoiceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAllInvoices = () => {
    const visibleIds = filteredInvoices.map(inv => inv.id)
    const allSelected = visibleIds.every(id => selectedInvoiceIds.includes(id))
    if (allSelected) {
      setSelectedInvoiceIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setSelectedInvoiceIds(prev => Array.from(new Set([...prev, ...visibleIds])))
    }
  }

  // Invoices Client-Side Filtering
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.student.name.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      (inv.student.studentCode && inv.student.studentCode.toLowerCase().includes(invoiceSearch.toLowerCase()))

    const matchesDueDate = dueDateFilter ? inv.dueDate?.startsWith(dueDateFilter) : true

    return matchesSearch && matchesDueDate
  })

  return (
    <div className="p-6 space-y-6">
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-sans">Fee & Billing Management</h1>
          <p className="text-sm text-slate-500 font-sans">Manage student invoices, payment collections, overdue follow-ups, and fee templates.</p>
        </div>
        <div className="flex gap-2.5">
          <Button
            onClick={() => setCreateInvoiceOpen(true)}
            className="bg-[#1565D8] hover:bg-blue-700 text-white flex items-center gap-1.5 px-3 h-9 shadow-sm rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setCreatePlanOpen(true)}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 px-3 h-9 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fee Plan</span>
          </Button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {toastMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#1565D8]" />
            <span className="text-sm text-slate-750 font-medium">{toastMessage}</span>
          </div>
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              onClick={sendEmailToParent}
              className="px-3 py-1 bg-[#1565D8] hover:bg-blue-700 text-white rounded text-xs font-semibold shadow transition cursor-pointer"
            >
              Yes, Send to Parent
            </button>
            <button
              onClick={() => {
                setToastMessage('')
                setCreatedInvoiceId(null)
              }}
              className="px-3 py-1 bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 rounded text-xs font-semibold transition cursor-pointer"
            >
              No, Later
            </button>
          </div>
        </div>
      )}

      {/* Top Aggregates Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Collection</span>
            <div className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 font-sans">
            ₹{summary.collected.toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-slate-400 font-sans block mt-1">Total received this calendar month</span>
        </Card>

        {/* Metric 2 */}
        <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Overdue</span>
            <div className="w-7 h-7 rounded-full bg-red-50 text-red-650 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-red-650 font-sans">
            ₹{summary.overdue.toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-slate-400 font-sans block mt-1">Outstanding pending overdue bills</span>
        </Card>

        {/* Metric 3 */}
        <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upcoming Due (7d)</span>
            <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 font-sans">
            ₹{summary.upcoming.toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-slate-400 font-sans block mt-1">Due within the next week</span>
        </Card>

        {/* Metric 4 */}
        <Card className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing Coverage</span>
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex gap-2 items-baseline">
            <h3 className="text-xl font-bold text-slate-800 font-sans">
              {summary.students.paid} Paid
            </h3>
            <span className="text-xs text-slate-400">/ {summary.students.overdue} Overdue</span>
          </div>
          <span className="text-[10px] text-slate-400 font-sans block mt-1">Overall payment classification</span>
        </Card>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-200 flex gap-4 w-full">
        {(['invoices', 'payments', 'overdue', 'plans'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setSelectedInvoiceIds([])
            }}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer capitalize ${
              activeTab === tab
                ? 'border-[#1565D8] text-[#1565D8]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Tab Views Content */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[300px]">
        {/* -------------------- TAB 1: INVOICES -------------------- */}
        {activeTab === 'invoices' && (
          <div className="flex flex-col w-full">
            {/* Filter row */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoice or student name..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-1 focus:ring-[#1565D8]/10 transition-all placeholder-slate-400"
                  />
                </div>

                {/* Status selector */}
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#1565D8] transition-all"
                >
                  <option value="">All Statuses</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>

                {/* Date Picker */}
                <input
                  type="date"
                  value={dueDateFilter}
                  onChange={(e) => setDueDateFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#1565D8] transition-all"
                />
              </div>

              {/* Bulk actions */}
              {selectedInvoiceIds.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedInvoiceIds.length} Selected
                  </span>
                  <button
                    onClick={() => {
                      alert(`Sent reminders to ${selectedInvoiceIds.length} parents successfully.`)
                      setSelectedInvoiceIds([])
                    }}
                    className="h-8 inline-flex items-center gap-1.5 px-3 bg-blue-50 text-[#1565D8] hover:bg-blue-100 rounded text-xs font-semibold transition cursor-pointer"
                  >
                    Send Reminders
                  </button>
                  <button
                    onClick={() => {
                      alert('Exported selected invoices to CSV.')
                      setSelectedInvoiceIds([])
                    }}
                    className="h-8 inline-flex items-center gap-1.5 px-3 bg-slate-50 text-slate-650 hover:bg-slate-100 rounded text-xs font-semibold transition cursor-pointer"
                  >
                    Export
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={6} />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-12 w-12 text-slate-350 mb-3" />
                <h3 className="text-sm font-bold text-slate-750">No Invoices Found</h3>
                <p className="text-xs text-slate-450 mt-1 max-w-sm">No fee invoices recorded yet for this organization, or matching this query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredInvoices.length > 0 && filteredInvoices.every(i => selectedInvoiceIds.includes(i.id))}
                          onChange={handleToggleSelectAllInvoices}
                          className="rounded cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-3.5">Invoice No</th>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Grade/Class</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Due Date</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedInvoiceIds.includes(inv.id)}
                            onChange={() => handleToggleSelectInvoice(inv.id)}
                            className="rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-3 text-sm font-semibold text-slate-700">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{inv.student.name}</span>
                            <span className="text-xs text-slate-400">{inv.student.studentCode}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-500 font-medium">
                          {getGradeLabel(inv.student.gradeLabel) || inv.student.gradeLabel || '-'}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-slate-800">
                          ₹{Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-500">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex gap-2.5 items-center justify-end">
                            {inv.status !== 'PAID' && (
                              <button
                                onClick={() => {
                                  setTargetInvoice(inv)
                                  setPaymentAmount(String(Number(inv.totalAmount) - Number(inv.paidAmount)))
                                  setRecordPaymentOpen(true)
                                }}
                                className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 rounded text-xs font-semibold transition cursor-pointer"
                              >
                                Record Payment
                              </button>
                            )}
                            <a
                              href={`/api/v1/fees/invoices/${inv.id}/pdf`}
                              download
                              className="text-xs text-[#1565D8] hover:text-blue-800 font-semibold hover:underline"
                            >
                              Download PDF
                            </a>
                            <button
                              onClick={() => alert(`Reminder email sent successfully to ${inv.student.name}'s guardian.`)}
                              className="text-xs text-slate-400 hover:text-slate-700 transition cursor-pointer font-medium hover:underline"
                            >
                              Send Reminder
                            </button>
                            <Link
                              href={`/student-management/${inv.student.id}`}
                              className="text-xs text-slate-400 hover:text-[#1565D8] transition font-medium hover:underline"
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -------------------- TAB 2: PAYMENTS -------------------- */}
        {activeTab === 'payments' && (
          <div className="flex flex-col w-full">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={5} />
              </div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <CreditCard className="h-12 w-12 text-slate-350 mb-3" />
                <h3 className="text-sm font-bold text-slate-750">No Payments Recorded</h3>
                <p className="text-xs text-slate-450 mt-1 max-w-sm">There are no payment collection records listed for this organization.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-3.5">Payment Date</th>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Method</th>
                      <th className="px-6 py-3.5">Invoice No</th>
                      <th className="px-6 py-3.5">Receipt No</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-3.5 text-sm text-slate-500">
                          {pay.paidAt ? new Date(pay.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{pay.student?.name}</span>
                            <span className="text-xs text-slate-400">{pay.student?.studentCode}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-sm font-bold text-green-700">
                          ₹{Number(pay.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-600 font-medium">
                          {pay.method}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-500 font-semibold">
                          {pay.invoice?.invoiceNumber}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-bold text-slate-800">
                          {pay.receiptNumber}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => alert(`Opening print receipt view for ${pay.receiptNumber}...`)}
                            className="text-xs text-[#1565D8] hover:text-blue-800 font-semibold flex items-center justify-end gap-1.5 ml-auto hover:underline"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -------------------- TAB 3: OVERDUE -------------------- */}
        {activeTab === 'overdue' && (
          <div className="flex flex-col w-full">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-750">Overdue Follow-up Directory</h3>
                <p className="text-xs text-slate-450">Displays unpaid and partially paid bills past their due date.</p>
              </div>
              {overdueInvoices.length > 0 && (
                <button
                  onClick={() => alert(`Successfully dispatched bulk payment reminders to all ${overdueInvoices.length} outstanding accounts.`)}
                  className="h-8 inline-flex items-center gap-1.5 px-3 bg-red-50 text-red-650 hover:bg-red-100 rounded text-xs font-semibold transition cursor-pointer shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Bulk Reminder</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={5} />
              </div>
            ) : overdueInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-350 mb-3" />
                <h3 className="text-sm font-bold text-slate-750">No Overdue Invoices</h3>
                <p className="text-xs text-slate-450 mt-1">Excellent! All fee payments are currently up to date.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-3.5">Invoice No</th>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">Grade/Class</th>
                      <th className="px-6 py-3.5">Total Amount</th>
                      <th className="px-6 py-3.5">Balance Due</th>
                      <th className="px-6 py-3.5">Due Date</th>
                      <th className="px-6 py-3.5">Days Overdue</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {overdueInvoices.map((inv) => {
                      const daysOverdue = Math.max(
                        0,
                        Math.floor((new Date().getTime() - new Date(inv.dueDate).getTime()) / (24 * 60 * 60 * 1000))
                      )
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-3.5 text-sm font-semibold text-slate-700">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-slate-800">
                            {inv.student.name}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-slate-500 font-medium">
                            {getGradeLabel(inv.student.gradeLabel) || inv.student.gradeLabel || '-'}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-slate-500 font-semibold">
                            ₹{Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-3.5 text-sm font-bold text-red-650">
                            ₹{(Number(inv.totalAmount) - Number(inv.paidAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-slate-500 font-medium">
                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-6 py-3.5 text-sm font-bold text-red-650">
                            {daysOverdue} days
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex gap-2 items-center justify-end">
                              <button
                                onClick={() => alert(`Reminder alert dispatched to ${inv.student.guardianPhone || 'guardian'}.`)}
                                className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded text-xs font-semibold transition cursor-pointer"
                              >
                                Send Reminder
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* -------------------- TAB 4: FEE PLANS -------------------- */}
        {activeTab === 'plans' && (
          <div className="flex flex-col w-full">
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={4} />
              </div>
            ) : plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <Briefcase className="h-12 w-12 text-slate-350 mb-3" />
                <h3 className="text-sm font-bold text-slate-750">No Fee Plans Configuration</h3>
                <p className="text-xs text-slate-450 mt-1 max-w-sm">No standardized payment templates established yet. Click "Create Fee Plan" to set one up.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-3.5">Plan Name</th>
                      <th className="px-6 py-3.5">Billing Frequency</th>
                      <th className="px-6 py-3.5">Standard Amount</th>
                      <th className="px-6 py-3.5">Grace Period</th>
                      <th className="px-6 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {plans.map((p) => {
                      const item = p.structure?.[0] || {}
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-3.5 text-sm font-bold text-slate-800">
                            {p.name}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-slate-600 font-medium">
                            {item.frequency || 'MONTHLY'}
                          </td>
                          <td className="px-6 py-3.5 text-sm font-bold text-slate-800">
                            ₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-slate-500">
                            {item.lateFeeGraceDays || 0} days grace
                          </td>
                          <td className="px-6 py-3.5 text-right text-xs font-bold text-slate-400">
                            ACTIVE TEMPLATE
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== CREATE INVOICE DIALOG ==================== */}
      <Dialog open={createInvoiceOpen} onOpenChange={setCreateInvoiceOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 animate-fade-in relative z-50">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-800">Create Fee Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4 text-left font-sans">
            {/* Student Search */}
            <div className="relative">
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Student</label>
              <input
                type="text"
                placeholder="Search student by name..."
                required
                value={studentSearchInput}
                onChange={(e) => setStudentSearchInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#1565D8] focus:ring-1 focus:ring-blue-100"
              />
              {foundStudents.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
                  {foundStudents.map((stu) => (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudent(stu)
                        setStudentSearchInput(stu.name)
                        setFoundStudents([])
                      }}
                      className="w-full px-3 py-2.5 text-xs text-left hover:bg-slate-50 flex justify-between items-center transition cursor-pointer"
                    >
                      <span className="font-bold text-slate-750">{stu.name}</span>
                      <span className="text-slate-400 font-medium">({stu.studentCode}) - {stu.gradeLabel || 'N/A'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Invoice Description</label>
              <input
                type="text"
                placeholder="Term 1 Fees 2026-27"
                required
                value={invoiceDescription}
                onChange={(e) => setInvoiceDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#1565D8]"
              />
            </div>

            {/* Fee Plan Selection (optional) */}
            <div>
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Fee Plan Template (Optional)</label>
              <select
                value={selectedFeePlanId}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedFeePlanId(val)
                  const matching = plans.find(p => p.id === val)
                  if (matching) {
                    const amt = matching.structure?.[0]?.amount || ''
                    setInvoiceAmount(String(amt))
                    setInvoiceDescription(`${matching.name} Fees`)
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#1565D8] cursor-pointer"
              >
                <option value="">Select Fee Plan template</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{Number(p.structure?.[0]?.amount || 0).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <div>
                <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  required
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#1565D8]"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#1565D8]"
                />
              </div>
            </div>

            {/* Academic Year Selection */}
            <div>
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Academic Year</label>
              <select
                value={selectedAcademicYearId}
                onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-750 focus:outline-none focus:border-[#1565D8] cursor-pointer"
              >
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name} {ay.status === 'ACTIVE' ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Notes (Optional)</label>
              <textarea
                placeholder="Internal or billing notes..."
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#1565D8] h-16 resize-none"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCreateInvoiceOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-650 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedStudent}
                className="px-4 py-2 bg-[#1565D8] hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Creating...' : 'Create Invoice'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== RECORD PAYMENT DIALOG ==================== */}
      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 animate-fade-in relative z-50">
          <DialogHeader className="mb-3">
            <DialogTitle className="text-lg font-bold text-slate-800">Record Fee Payment</DialogTitle>
          </DialogHeader>
          {targetInvoice && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 space-y-1 text-left font-sans">
              <p><strong>Invoice Number:</strong> {targetInvoice.invoiceNumber}</p>
              <p><strong>Student Name:</strong> {targetInvoice.student.name} ({targetInvoice.student.studentCode})</p>
              <div className="border-t border-slate-200 mt-2 pt-2 grid grid-cols-3 gap-2">
                <div>
                  <p className="text-slate-400 font-medium">Total Amount</p>
                  <p className="text-sm font-bold text-slate-800">₹{Number(targetInvoice.totalAmount).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Paid So Far</p>
                  <p className="text-sm font-bold text-green-700">₹{Number(targetInvoice.paidAmount).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Balance Due</p>
                  <p className="text-sm font-bold text-red-650">₹{(Number(targetInvoice.totalAmount) - Number(targetInvoice.paidAmount)).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleRecordPayment} className="space-y-4 text-left font-sans mt-3">
            {/* Amount */}
            <div>
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Amount (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#1565D8]"
              />
            </div>

            {/* Payment Method Selector Grid */}
            <div>
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'CASH', label: '💵 Cash' },
                  { value: 'CHEQUE', label: '🏦 Cheque' },
                  { value: 'UPI', label: '💳 UPI' },
                  { value: 'ONLINE', label: '📶 NetBank' },
                  { value: 'NEFT_RTGS', label: '🏧 NEFT' },
                  { value: 'DD', label: '📄 DD' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value as any)}
                    className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition cursor-pointer ${
                      paymentMethod === opt.value
                        ? 'bg-blue-50 border-[#1565D8] text-[#1565D8]'
                        : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic extra fields */}
            {paymentMethod === 'CHEQUE' && (
              <div className="space-y-3 p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Cheque Number</label>
                    <input
                      type="text"
                      required
                      placeholder="XXXXXX"
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1565D8]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC Bank"
                      value={chequeBank}
                      onChange={(e) => setChequeBank(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1565D8]"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'DD' && (
              <div className="space-y-3 p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">DD Number</label>
                    <input
                      type="text"
                      required
                      placeholder="XXXXXX"
                      value={ddNumber}
                      onChange={(e) => setDdNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1565D8]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SBI Bank"
                      value={ddBank}
                      onChange={(e) => setDdBank(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1565D8]"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'NEFT_RTGS' && (
              <div className="space-y-3 p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">UTR/Ref Number</label>
                    <input
                      type="text"
                      required
                      placeholder="UTRXXXXXXXXXXXXXXXX"
                      value={neftRef}
                      onChange={(e) => setNeftRef(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1565D8]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. ICICI Bank"
                      value={neftBank}
                      onChange={(e) => setNeftBank(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1565D8]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Date of Payment */}
            <div>
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Date of Payment</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#1565D8]"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Notes (Optional)</label>
              <textarea
                placeholder="Payment receipts, notes, etc..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#1565D8] h-14 resize-none"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRecordPaymentOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-650 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !paymentAmount}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold shadow transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Recording...' : `Record Payment ₹${parseFloat(paymentAmount || '0').toLocaleString('en-IN')}`}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== CREATE FEE PLAN TEMPLATE DIALOG ==================== */}
      <Dialog open={createPlanOpen} onOpenChange={setCreatePlanOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 animate-fade-in relative z-50">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-800">Create Fee Plan Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFeePlan} className="space-y-4 text-left font-sans">
            {/* Plan Name */}
            <div>
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Fee Plan Name</label>
              <input
                type="text"
                placeholder="e.g. Grade 1 Monthly Tuition Plan"
                required
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#1565D8]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Description (Optional)</label>
              <input
                type="text"
                placeholder="Standard academic term fees layout"
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#1565D8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <div>
                <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Standard Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  required
                  value={planAmount}
                  onChange={(e) => setPlanAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#1565D8]"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block mb-1">Billing Frequency</label>
                <select
                  value={planFrequency}
                  onChange={(e) => setPlanFrequency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#1565D8] cursor-pointer"
                >
                  <option value="ONE_TIME">One Time</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="HALF_YEARLY">Half Yearly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCreatePlanOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-650 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !planName || !planAmount}
                className="px-4 py-2 bg-[#1565D8] hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Creating...' : 'Create Template'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
