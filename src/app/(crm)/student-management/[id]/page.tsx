"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  User,
  CreditCard,
  Plus,
  ArrowLeft,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import RecordSkeleton from '@/components/shared/RecordSkeleton'
import { getGradeLabel } from '@/constants/grades'

interface Invoice {
  id: string
  invoiceNumber: string
  totalAmount: string
  paidAmount: string
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'WAIVED'
  dueDate: string
  notes: string | null
  createdAt: string
}

interface Student {
  id: string
  studentCode: string
  name: string
  rollNumber: string | null
  gradeLabel: string | null
  guardianName: string | null
  guardianPhone: string | null
  guardianEmail: string | null
  status: 'ACTIVE' | 'ALUMNI' | 'TRANSFERRED' | 'SUSPENDED' | 'DROPPED_OUT'
  dateOfBirth: string | null
  gender: string | null
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params?.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStudentData = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch student info
      const studentRes = await fetch(`/api/v1/students/${studentId}`)
      if (!studentRes.ok) throw new Error('Student not found')
      const studentJson = await studentRes.json()
      setStudent(studentJson.data)

      // Fetch all invoices for aggregate totals calculation
      const invoiceRes = await fetch(`/api/v1/fees/invoices?studentId=${studentId}&limit=100`)
      if (invoiceRes.ok) {
        const invoiceJson = await invoiceRes.json()
        setInvoices(invoiceJson.data || [])
      }
    } catch (err) {
      console.error(err)
      router.push('/student-management')
    } finally {
      setLoading(false)
    }
  }, [studentId, router])

  useEffect(() => {
    if (studentId) {
      fetchStudentData()
    }
  }, [studentId, fetchStudentData])

  if (loading) {
    return (
      <div className="p-6">
        <RecordSkeleton />
      </div>
    )
  }

  if (!student) return null

  // Calculate aggregates
  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0)
  const outstanding = totalBilled - totalPaid

  return (
    <div className="p-6 space-y-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/student-management')}
          className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-slate-400">Students Directory</span>
        <ChevronRight className="h-3 w-3 text-slate-350" />
        <span className="text-xs font-semibold text-slate-700">{student.name}</span>
      </div>

      {/* Grid: Profile + Fee Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profile Snapshot */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-blue-50 text-[#1565D8] flex items-center justify-center font-bold text-2xl uppercase shadow-md border-4 border-white mb-4">
              {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <h2 className="text-lg font-bold text-slate-800">{student.name}</h2>
            <p className="text-sm font-semibold text-[#1565D8] mt-0.5">{student.studentCode}</p>
            <span className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100 uppercase tracking-wider">
              {student.status}
            </span>

            {/* Profile fields */}
            <div className="w-full border-t border-slate-100 mt-6 pt-6 space-y-3.5 text-left">
              <div className="flex items-start gap-3">
                <GraduationCap className="h-4.5 w-4.5 text-slate-400 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Class/Grade</span>
                  <span className="text-sm font-medium text-slate-800">{getGradeLabel(student.gradeLabel || '') || student.gradeLabel || '-'}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-4.5 w-4.5 text-slate-400 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Guardian</span>
                  <span className="text-sm font-medium text-slate-800">{student.guardianName || '-'}</span>
                </div>
              </div>
              {student.guardianPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4.5 w-4.5 text-slate-400 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Guardian Phone</span>
                    <span className="text-sm font-medium text-slate-800">{student.guardianPhone}</span>
                  </div>
                </div>
              )}
              {student.guardianEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4.5 w-4.5 text-slate-400 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Guardian Email</span>
                    <span className="text-sm font-medium text-slate-800 break-all">{student.guardianEmail}</span>
                  </div>
                </div>
              )}
              {student.dateOfBirth && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4.5 w-4.5 text-slate-400 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Date of Birth</span>
                    <span className="text-sm font-medium text-slate-800">
                      {new Date(student.dateOfBirth).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Fee Summary Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {/* Aggregate metrics block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-800">
                ₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Accumulated overall</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Paid</span>
                <div className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-800">
                ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Successfully cleared</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  outstanding > 0 ? 'bg-red-50 text-red-650' : 'bg-blue-50 text-blue-600'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className={`text-xl font-bold ${outstanding > 0 ? 'text-red-650' : 'text-slate-800'}`}>
                ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Pending payments</p>
            </div>
          </div>

          {/* Recent Invoices Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Recent Invoices</h3>
                <p className="text-xs text-slate-400">List of invoices generated for this student</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/fee-management?createInvoiceForStudentId=${student.id}`}
                  className="h-8 inline-flex items-center gap-1.5 px-3 bg-[#1565D8] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Invoice</span>
                </Link>
                <Link
                  href={`/fee-management?studentId=${student.id}`}
                  className="text-xs text-[#1565D8] hover:text-blue-800 font-semibold hover:underline"
                >
                  View All
                </Link>
              </div>
            </div>

            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                <CreditCard className="h-10 w-10 text-slate-350 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No Invoices</p>
                <p className="text-xs text-slate-400 mt-0.5">No fee invoices generated yet for this student.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-3">Invoice No</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Due Date</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.slice(0, 5).map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-3.5 text-sm font-semibold text-slate-700">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-500 max-w-[200px] truncate">
                          {inv.notes || 'Term Fees'}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-semibold text-slate-800">
                          ₹{Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-500">
                          {new Date(inv.dueDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            inv.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-100' :
                            inv.status === 'PARTIALLY_PAID' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            inv.status === 'OVERDUE' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <a
                            href={`/api/v1/fees/invoices/${inv.id}/pdf`}
                            download
                            className="text-xs text-[#1565D8] hover:text-blue-800 font-semibold hover:underline"
                          >
                            Download PDF
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
