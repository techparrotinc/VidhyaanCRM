'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import {
  BookOpen,
  Plus,
  GraduationCap,
  MoreVertical,
  FileText,
  X,
  Loader2
} from 'lucide-react'
import EnrollModal from './EnrollModal'

interface Course {
  id: string
  name: string
  amount: number
  frequency: string
  billingDay: number
  category: string | null
}

interface Enrollment {
  id: string
  courseId: string
  status: string
  startDate: string
  endDate: string | null
  nextBillingDate: string | null
  createdAt: string
  course: Course
}

interface CourseEnrollmentCardProps {
  studentId: string
  enrollments: Enrollment[]
  onRevalidate: () => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

function formatFrequency(frequency: string): string {
  switch (frequency) {
    case 'MONTHLY':
      return '/ month'
    case 'QUARTERLY':
      return '/ quarter'
    case 'HALF_YEARLY':
      return '/ 6 months'
    case 'ANNUAL':
      return '/ year'
    case 'ONE_TIME':
      return 'one-time'
    default:
      return frequency.toLowerCase()
  }
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-50 text-green-700'
    case 'PAUSED':
      return 'bg-amber-50 text-amber-700'
    case 'COMPLETED':
      return 'bg-slate-100 text-slate-600'
    case 'CANCELLED':
      return 'bg-red-50 text-red-600'
    default:
      return 'bg-slate-100 text-slate-500'
  }
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th'
  }
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

function getFrequencyLabel(frequency: string): string {
  switch (frequency) {
    case 'QUARTERLY':
      return 'Quarterly'
    case 'HALF_YEARLY':
      return 'Half-yearly'
    case 'ANNUAL':
      return 'Annual'
    case 'ONE_TIME':
      return 'One-time'
    default:
      return frequency.toLowerCase().replace('_', ' ')
  }
}

export default function CourseEnrollmentCard({
  studentId,
  enrollments,
  onRevalidate,
  toast
}: CourseEnrollmentCardProps) {
  const router = useRouter()
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseDownOutside(event: MouseEvent) {
      if (menuOpenId && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const trigger = document.getElementById(`trigger-${menuOpenId}`)
        if (trigger && trigger.contains(event.target as Node)) {
          return
        }
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleMouseDownOutside)
    return () => {
      document.removeEventListener('mousedown', handleMouseDownOutside)
    }
  }, [menuOpenId])

  const handleActionClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 176 // w-44 is 176px
    })
    setMenuOpenId(prev => prev === id ? null : id)
  }

  const handleCancel = async (enrollmentId: string) => {
    setCancellingId(enrollmentId)
    try {
      const res = await fetch(`/api/v1/students/${studentId}/enrollments/${enrollmentId}`, {
        method: 'DELETE'
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to cancel enrollment')
      }
      toast.success('Enrollment cancelled')
      onRevalidate()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel enrollment')
    } finally {
      setCancellingId(null)
      setMenuOpenId(null)
    }
  }

  const handleViewInvoices = (courseId: string) => {
    router.push(`/fee-management?studentId=${studentId}&courseId=${courseId}`)
    setMenuOpenId(null)
  }

  const activeCount = enrollments.filter(e => e.status === 'ACTIVE').length

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center">
          <h3 className="text-sm font-semibold text-slate-800">Courses</h3>
          {enrollments.length > 0 && (
            <span className="text-xs text-slate-400 ml-2">
              {activeCount} enrolled
            </span>
          )}
        </div>
        <button
          onClick={() => setShowEnrollModal(true)}
          className="flex items-center text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Enroll in course
        </button>
      </div>

      {/* Card Body */}
      {enrollments.length === 0 ? (
        <div className="py-8 text-center">
          <GraduationCap className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Not enrolled in any course yet.</p>
          <p className="text-xs text-slate-400 mt-1">Click "Enroll in course" to get started.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {enrollments.map((enrollment) => {
            const isMonthly = enrollment.course.frequency === 'MONTHLY'
            const suffix = getOrdinalSuffix(enrollment.course.billingDay)
            const dateStr = format(new Date(enrollment.startDate), 'd MMM yyyy')
            const frequencyLabel = getFrequencyLabel(enrollment.course.frequency)

            return (
              <div key={enrollment.id} className="flex items-center gap-3 px-4 py-3">
                {/* Course Icon Circle */}
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4.5 h-4.5 text-blue-500" />
                </div>

                {/* Course Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {enrollment.course.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Started {dateStr} · {isMonthly
                      ? `Billing on ${enrollment.course.billingDay}${suffix} every month`
                      : frequencyLabel
                    }
                  </p>
                </div>

                {/* Amount, status and action */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      ₹{enrollment.course.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatFrequency(enrollment.course.frequency)}
                    </p>
                  </div>

                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getStatusBadge(enrollment.status)}`}>
                    {enrollment.status.charAt(0) + enrollment.status.slice(1).toLowerCase()}
                  </span>

                  <button
                    id={`trigger-${enrollment.id}`}
                    onClick={(e) => handleActionClick(e, enrollment.id)}
                    className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 cursor-pointer text-slate-400 transition"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <EnrollModal
          studentId={studentId}
          onSuccess={onRevalidate}
          onClose={() => setShowEnrollModal(false)}
          toast={toast}
        />
      )}

      {/* Action Menu Portal */}
      {menuOpenId && typeof window !== 'undefined' && (() => {
        const enrollment = enrollments.find(e => e.id === menuOpenId)
        if (!enrollment) return null

        return createPortal(
          <div ref={menuRef} className="contents">
            {/* Backdrop to capture clicks if needed, but we also have outside click listener */}
            <div className="fixed z-50 bg-white rounded-xl shadow-lg border border-slate-200 py-1 w-44 animate-fade-in" style={{
              top: menuPosition.top,
              left: menuPosition.left
            }}>
              <button
                onClick={() => handleViewInvoices(enrollment.course.id)}
                className="w-full px-3 py-2 text-xs font-medium text-left text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                View invoices
              </button>
              
              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => handleCancel(enrollment.id)}
                disabled={cancellingId === enrollment.id || enrollment.status === 'CANCELLED'}
                className="w-full px-3 py-2 text-xs font-medium text-left text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
              >
                {cancellingId === enrollment.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                Cancel enrollment
              </button>
            </div>
          </div>,
          document.body
        )
      })()}
    </div>
  )
}
