'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { useStudent } from '@/hooks/useStudent'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { GRADE_OPTIONS } from '@/constants/grades'

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

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 pt-6 pb-4 border-b border-slate-200 bg-white">

        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push(`/student-management/${id}`)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 flex-shrink-0 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate">
              Edit Student
            </h1>
            <p className="text-xs text-slate-500 truncate">
              {student?.studentCode ?? ''}
              {student?.name ? ` · ${student.name}` : ''}
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0">
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : 'Save Changes'}
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
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── CARD 1: Student Details ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">

            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Student Details
            </h2>

            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Full Name
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Student full name"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            {/* Grade */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Grade
              </label>
              <select
                name="gradeLabel"
                value={form.gradeLabel}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select grade</option>
                {GRADE_OPTIONS.map(g => (
                  <option key={g.value} value={g.label}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Roll Number */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Roll Number
              </label>
              <input
                name="rollNumber"
                value={form.rollNumber}
                onChange={handleChange}
                placeholder="e.g. 42"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="ACTIVE">Active</option>
                <option value="ALUMNI">Alumni</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DROPPED_OUT">Dropped Out</option>
              </select>
            </div>

            {/* Academic Year */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Academic Year
              </label>
              <select
                name="academicYearId"
                value={form.academicYearId}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select academic year</option>
                {years?.map((ay: any) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* ── CARD 2: Guardian Details ── */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">

            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Guardian Details
            </h2>

            {/* Guardian Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Guardian Name
              </label>
              <input
                name="guardianName"
                value={form.guardianName}
                onChange={handleChange}
                placeholder="Parent or guardian name"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            {/* Guardian Phone */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Guardian Phone
              </label>
              <input
                name="guardianPhone"
                value={form.guardianPhone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            {/* Guardian Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Guardian Email
              </label>
              <input
                type="email"
                name="guardianEmail"
                value={form.guardianEmail}
                onChange={handleChange}
                placeholder="guardian@email.com"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any additional notes..."
                rows={5}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
            </div>

            {/* Student Code (read only) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Student Code
              </label>
              <input
                value={student?.studentCode ?? ''}
                readOnly
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed" />
              <p className="text-[11px] text-slate-400">
                Auto-generated. Cannot be changed.
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* ── MOBILE STICKY SAVE BAR ── */}
      <div className="lg:hidden sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 flex gap-3">
        <button
          onClick={() => router.push(`/student-management/${id}`)}
          className="flex-1 py-2.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 py-2.5 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

    </div>
  )
}
