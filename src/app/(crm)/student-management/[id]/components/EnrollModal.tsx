'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DatePicker } from '@/components/ui/datetime-picker'
import { X, Info, Loader2 } from 'lucide-react'
import { AppSelect } from '@/components/ui/app-select'

interface Course {
  id: string
  name: string
  amount: number
  frequency: string
  billingDay: number
  isActive: boolean
}

interface EnrollModalProps {
  studentId: string
  onSuccess: () => void
  onClose: () => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

export default function EnrollModal({
  studentId,
  onSuccess,
  onClose,
  toast
}: EnrollModalProps) {
  const router = useRouter()
  const [courseId, setCourseId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Set default start date to today (local time YYYY-MM-DD)
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setStartDate(`${yyyy}-${mm}-${dd}`)

    // Fetch active courses
    async function fetchCourses() {
      try {
        const res = await fetch('/api/v1/settings/courses')
        if (!res.ok) throw new Error('Failed to fetch courses')
        const json = await res.json()
        const fetchedCourses = json.data ?? json ?? []
        // Filter active courses only
        const activeCourses = fetchedCourses.filter((c: Course) => c.isActive)
        setCourses(activeCourses)
      } catch (err: any) {
        console.error('Fetch courses error:', err)
        toast.error('Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/students/${studentId}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId,
          startDate
        })
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to enroll student')
      }

      toast.success('Student enrolled successfully')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to enroll student')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md overflow-hidden shadow-xl animate-fade-in text-left">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">Enroll in course</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-4 flex flex-col gap-4">
            {/* Course Selection */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1 font-medium">Course</label>
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading courses...
                </div>
              ) : (
                <AppSelect
                  value={courseId}
                  onChange={(e) => {
                    if (e.target.value === '__manage__') { router.push('/settings/courses'); return }
                    setCourseId(e.target.value)
                  }}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} - ₹{course.amount.toLocaleString('en-IN')} ({course.frequency.toLowerCase().replace('_', ' ')})
                    </option>
                  ))}
                  <option value="__manage__">＋ Add course…</option>
                </AppSelect>
              )}
            </div>

            {/* Start Date */}
            <div className="flex flex-col">
              <label className="text-xs text-slate-500 mb-1 font-medium">Start date</label>
              <DatePicker value={startDate} onChange={setStartDate} clearable={false} />
            </div>

            {/* Info box */}
            <div className="bg-blue-50 rounded-lg p-3 flex gap-2 items-start">
              <Info className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 leading-normal">
                First invoice will be generated immediately on enroll. Recurring invoices run automatically on the billing day set in the course.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!courseId || submitting}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
              Confirm enroll
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
