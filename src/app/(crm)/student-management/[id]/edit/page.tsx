'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Save, Lightbulb } from 'lucide-react'
import { useStudent } from '@/hooks/useStudent'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { GRADE_OPTIONS } from '@/constants/grades'

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 focus:bg-white transition'

const labelClass =
  'text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1'

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border border-green-200',
  ALUMNI: 'bg-purple-50 text-purple-700 border border-purple-200',
  TRANSFERRED: 'bg-amber-50 text-amber-700 border border-amber-200',
  SUSPENDED: 'bg-red-50 text-red-700 border border-red-200',
  DROPPED_OUT: 'bg-slate-100 text-slate-500 border border-slate-200'
}

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="w-6 h-6 rounded-full bg-[#1565D8] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">
        {title}
      </h3>
    </div>
  )
}

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const { student, isLoading } = useStudent(id)
  const { years } = useAcademicYears()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    gender: '',
    dateOfBirth: '',
    gradeLabel: '',
    rollNumber: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    academicYearId: '',
    status: 'ACTIVE',
    notes: ''
  })

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name ?? '',
        gender: student.gender ?? '',
        dateOfBirth: student.dateOfBirth
          ? student.dateOfBirth.split('T')[0]
          : '',
        gradeLabel: student.gradeLabel ?? '',
        rollNumber: student.rollNumber ?? '',
        guardianName: student.guardianName ?? '',
        guardianPhone: student.guardianPhone ?? '',
        guardianEmail: student.guardianEmail ?? '',
        academicYearId: student.academicYearId ?? '',
        status: student.status ?? 'ACTIVE',
        notes: ''
      })
    }
  }, [student])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Student name is required')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/v1/students/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...form,
            dateOfBirth: form.dateOfBirth || undefined,
            gender: form.gender || undefined,
            gradeLabel: form.gradeLabel || undefined,
            rollNumber: form.rollNumber || undefined,
            guardianEmail: form.guardianEmail || undefined,
            academicYearId: form.academicYearId || undefined,
            notes: form.notes || undefined
          })
        }
      )
      if (!res.ok) {
        const data = await res.json()
        throw new Error(
          data.message ?? 'Failed to update student'
        )
      }
      router.push(`/student-management/${id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-6 h-6 border-2 border-[#1565D8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const initials = (form.name || student?.name || 'S')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const selectedYearName = years?.find((ay: any) => ay.id === form.academicYearId)?.name

  const cancelHref = `/student-management/${id}`

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="p-4 md:p-6 lg:p-8 pb-28 space-y-6 max-w-7xl mx-auto w-full">

        {/* ── TITLE ROW ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push(cancelHref)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 flex-shrink-0 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-800 truncate">
                Edit Student
              </h1>
              <p className="text-sm text-slate-400 truncate">
                {student?.studentCode ?? ''}
                {student?.name ? ` · ${student.name}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push(cancelHref)}
              className="px-4 py-2 text-sm font-medium border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap">
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* ── ERROR BANNER ── */}
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── FORM + PREVIEW GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ── LEFT: FORM SECTIONS ── */}
          <div className="space-y-6">

            {/* Section 1: Student Information */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <SectionHeader number={1} title="Student Information" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Full Name<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Student full name"
                    className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className={inputClass}>
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Grade</label>
                  <select
                    name="gradeLabel"
                    value={form.gradeLabel}
                    onChange={handleChange}
                    className={inputClass}>
                    <option value="">Select grade</option>
                    {GRADE_OPTIONS.map(g => (
                      <option key={g.value} value={g.label}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Roll Number</label>
                  <input
                    name="rollNumber"
                    value={form.rollNumber}
                    onChange={handleChange}
                    placeholder="e.g. 42"
                    className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={inputClass}>
                    <option value="ACTIVE">Active</option>
                    <option value="ALUMNI">Alumni</option>
                    <option value="TRANSFERRED">Transferred</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="DROPPED_OUT">Dropped Out</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Academic Year</label>
                  <select
                    name="academicYearId"
                    value={form.academicYearId}
                    onChange={handleChange}
                    className={inputClass}>
                    <option value="">Select academic year</option>
                    {years?.map((ay: any) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Guardian Details */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <SectionHeader number={2} title="Guardian Details" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Guardian Name</label>
                  <input
                    name="guardianName"
                    value={form.guardianName}
                    onChange={handleChange}
                    placeholder="Parent or guardian name"
                    className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Guardian Phone</label>
                  <input
                    name="guardianPhone"
                    value={form.guardianPhone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={inputClass} />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Guardian Email</label>
                  <input
                    type="email"
                    name="guardianEmail"
                    value={form.guardianEmail}
                    onChange={handleChange}
                    placeholder="guardian@email.com"
                    className={inputClass} />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Any additional notes..."
                    rows={4}
                    className={`${inputClass} resize-none`} />
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: PREVIEW SIDEBAR ── */}
          <div className="space-y-6 lg:sticky lg:top-24">

            {/* Student Preview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-4">
                Student Preview
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#1565D8] text-white flex items-center justify-center text-base font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {form.name || 'Student name'}
                  </p>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${STATUS_BADGE[form.status] ?? STATUS_BADGE.ACTIVE}`}>
                    {form.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { label: 'Student Code', value: student?.studentCode ?? '—' },
                  { label: 'Grade', value: form.gradeLabel || '—' },
                  { label: 'Roll Number', value: form.rollNumber || '—' },
                  { label: 'Academic Year', value: selectedYearName ?? '—' },
                  { label: 'Guardian', value: form.guardianName || '—' },
                  { label: 'Guardian Phone', value: form.guardianPhone || '—' }
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2 gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {row.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 truncate text-right">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-[#1565D8]" />
                <h3 className="text-[10px] font-semibold uppercase tracking-wide text-[#1565D8]">
                  Quick Tips
                </h3>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed list-disc pl-4">
                <li>Student code is auto-generated and cannot be changed.</li>
                <li>Guardian phone links this student to the parent portal login.</li>
                <li>Changing status to Alumni or Dropped Out hides the student from active lists.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY FOOTER ── */}
      <div className="fixed bottom-0 left-0 md:left-[var(--sidebar-width,256px)] right-0 bg-white border-t border-slate-200 shadow-lg px-4 sm:px-8 py-4 z-40">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400 truncate">
            {student?.studentCode ?? ''} · <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push(cancelHref)}
              className="px-4 py-2 text-sm font-medium border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap">
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
