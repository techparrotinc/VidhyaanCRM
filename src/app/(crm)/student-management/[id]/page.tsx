'use client'

import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft, Pencil, Trash2,
  Mail, MessageCircle, Phone,
  User, GraduationCap, Calendar,
  Hash, BookOpen
} from 'lucide-react'
import { useStudent } from '@/hooks/useStudent'
import { getGradeLabel } from '@/constants/grades'

const STATUS_CONFIG = {
  ACTIVE: {
    label: 'Active',
    badge: 'bg-green-50 text-green-700 border border-green-200'
  },
  ALUMNI: {
    label: 'Alumni',
    badge: 'bg-purple-50 text-purple-700 border border-purple-200'
  },
  TRANSFERRED: {
    label: 'Transferred',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200'
  },
  SUSPENDED: {
    label: 'Suspended',
    badge: 'bg-red-50 text-red-700 border border-red-200'
  },
  DROPPED_OUT: {
    label: 'Dropped Out',
    badge: 'bg-slate-100 text-slate-500 border border-slate-200'
  }
} as const

export default function StudentDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()

  const { student, isLoading } = useStudent(id)

  const handleDelete = async () => {
    if (!confirm('Delete this student? This cannot be undone.')) return
    const res = await fetch(`/api/v1/students/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/student-management')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-6 h-6 border-2 border-[#1565D8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <p className="text-sm text-slate-500">Student not found.</p>
      </div>
    )
  }

  const config = STATUS_CONFIG[student.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ACTIVE

  const initials = (student.name || '')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const colors = [
    'bg-blue-500', 'bg-green-500',
    'bg-purple-500', 'bg-amber-500',
    'bg-red-500', 'bg-indigo-500'
  ]
  const avatarColor = colors[(student.name || 'S').charCodeAt(0) % colors.length]

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 pt-6 pb-4">

        {/* Top row */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            onClick={() => router.push('/student-management')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 flex-shrink-0 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push(`/student-management/${id}/edit`)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Student identity row */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 ${avatarColor}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 truncate max-w-[250px] sm:max-w-md">
                {student.name}
              </h1>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${config.badge}`}>
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                {student.studentCode}
              </span>
              {student.gradeLabel && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {getGradeLabel(student.gradeLabel)}
                  </span>
                </>
              )}
              {student.academicYear && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">
                    {student.academicYear.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Connect icons */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 overflow-x-auto scrollbar-none">
          {student.guardianPhone && (
            <>
              <button
                onClick={() => window.open(`tel:${student.guardianPhone}`)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors whitespace-nowrap">
                <Phone className="w-4 h-4" />
                Call Guardian
              </button>
              <button
                onClick={() => window.open(`https://wa.me/91${student.guardianPhone}`)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-600 transition-colors whitespace-nowrap">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </>
          )}
          {student.guardianEmail && (
            <button
              onClick={() => window.open(`mailto:${student.guardianEmail}`)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors whitespace-nowrap">
              <Mail className="w-4 h-4" />
              Email Guardian
            </button>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="px-4 sm:px-6 py-6 flex-1">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── CARD 1: Student Info ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-0 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Student Information
            </h2>

            {[
              {
                icon: <Hash className="w-4 h-4" />,
                label: 'Student Code',
                value: student.studentCode
              },
              {
                icon: <User className="w-4 h-4" />,
                label: 'Gender',
                value: student.gender
                  ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1).toLowerCase()
                  : null
              },
              {
                icon: <Calendar className="w-4 h-4" />,
                label: 'Date of Birth',
                value: student.dateOfBirth
                  ? format(new Date(student.dateOfBirth), 'd MMM yyyy')
                  : null
              },
              {
                icon: <GraduationCap className="w-4 h-4" />,
                label: 'Grade',
                value: student.gradeLabel ? getGradeLabel(student.gradeLabel) : null
              },
              {
                icon: <Hash className="w-4 h-4" />,
                label: 'Roll Number',
                value: student.rollNumber
              },
              {
                icon: <BookOpen className="w-4 h-4" />,
                label: 'Academic Year',
                value: student.academicYear?.name ?? null
              },
              {
                icon: <Calendar className="w-4 h-4" />,
                label: 'Enrolled On',
                value: format(new Date(student.createdAt), 'd MMM yyyy')
              },
              {
                icon: <Calendar className="w-4 h-4" />,
                label: 'Last Updated',
                value: format(new Date(student.updatedAt), 'd MMM yyyy')
              }
            ].map((row, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                <span className="text-slate-400 mt-0.5 flex-shrink-0">
                  {row.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">
                    {row.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {row.value ?? '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── CARD 2: Guardian + Invoices ── */}
          <div className="flex flex-col gap-6">

            {/* Guardian Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Guardian Information
              </h2>

              {[
                {
                  label: 'Name',
                  value: student.guardianName
                },
                {
                  label: 'Phone',
                  value: student.guardianPhone
                },
                {
                  label: 'Email',
                  value: student.guardianEmail
                }
              ].map((row, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">
                      {row.label}
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {row.value ?? '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Linked Admission Card */}
            {student.admission && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Linked Admission
                </h2>
                <button
                  onClick={() => router.push(`/admission-management/${student.admission!.id}`)}
                  className="text-sm font-semibold text-[#1565D8] hover:underline font-mono bg-blue-50/50 hover:bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg transition-colors w-full text-left">
                  {student.admission.admissionCode}
                </button>
              </div>
            )}

            {/* Recent Invoices Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Recent Invoices
              </h2>

              {!student.invoices || student.invoices.length === 0 ? (
                <p className="text-sm text-slate-400">No invoices yet.</p>
              ) : (
                <div className="flex flex-col gap-0">
                  {student.invoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 font-mono">
                          {inv.invoiceNumber}
                        </p>
                        <p className="text-xs text-slate-400">
                          {inv.dueDate ? format(new Date(inv.dueDate), 'd MMM yyyy') : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">
                          ₹{inv.totalAmount.toLocaleString('en-IN')}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          inv.status === 'PAID'
                            ? 'bg-green-50 text-green-700 border border-green-150'
                            : inv.status === 'OVERDUE'
                            ? 'bg-red-50 text-red-700 border border-red-150'
                            : 'bg-amber-50 text-amber-700 border border-amber-150'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
