'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { GRADE_OPTIONS } from '@/constants/grades'

export default function CreateStudentPage() {
  const router = useRouter()
  const { years, isLoading: loadingYears } = useAcademicYears()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    gradeLabel: '',
    rollNumber: '',
    dateOfBirth: '',
    gender: '',
    academicYearId: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setErrorMessage('Student Name is required')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const res = await fetch('/api/v1/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          gender: formData.gender || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          gradeLabel: formData.gradeLabel || undefined,
          rollNumber: formData.rollNumber.trim() || undefined,
          academicYearId: formData.academicYearId || undefined,
          guardianName: formData.guardianName.trim() || undefined,
          guardianPhone: formData.guardianPhone.trim() || undefined,
          guardianEmail: formData.guardianEmail.trim() || undefined
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || json.message || 'Failed to create student')
      }

      router.push('/student-management?success=created')
    } catch (err: any) {
      console.error('Submit error:', err)
      setErrorMessage(err.message || 'Failed to create student')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = Boolean(formData.name.trim())

  return (
    <div className="p-3 sm:p-4 lg:p-6 pb-28 lg:pb-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full text-left">
      {/* PAGE TITLE ROW */}
      <div className="flex items-center justify-between gap-3 mb-2 w-full">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 sm:w-9 sm:h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 cursor-pointer transition shrink-0"
          >
            <ArrowLeft className="size-[18px] text-slate-500" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight font-sans">
              Add New Student
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-sans">
              Enroll a new student manually
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 transition cursor-pointer h-10 sm:h-9"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`text-white text-sm font-semibold px-4 py-2 h-10 sm:h-9 rounded-lg flex items-center justify-center gap-2 transition ${
              isSubmitting
                ? 'opacity-70 cursor-not-allowed bg-[#1565D8]'
                : isFormValid
                ? 'bg-[#1565D8] hover:bg-blue-700 cursor-pointer'
                : 'bg-[#1565D8]/50 opacity-50 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin size-4" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Save Student</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-600 font-medium flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* FORM CARD */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
        {/* Student Information Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100 mb-4">
            Student Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Student Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full name"
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] placeholder:text-slate-400 transition"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] transition"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Academic Year
              </label>
              <select
                name="academicYearId"
                value={formData.academicYearId}
                onChange={handleInputChange}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] transition"
              >
                <option value="">Select Year</option>
                {years.map((y: any) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Grade / Class
              </label>
              <select
                name="gradeLabel"
                value={formData.gradeLabel}
                onChange={handleInputChange}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] transition"
              >
                <option value="">Select Grade</option>
                {GRADE_OPTIONS.map(g => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Roll Number
              </label>
              <input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleInputChange}
                placeholder="Roll number"
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] placeholder:text-slate-400 transition"
              />
            </div>
          </div>
        </div>

        {/* Guardian Information Section */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100 mb-4">
            Guardian Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Guardian Name
              </label>
              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleInputChange}
                placeholder="Guardian's name"
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] placeholder:text-slate-400 transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Guardian Phone
              </label>
              <input
                type="tel"
                name="guardianPhone"
                maxLength={10}
                value={formData.guardianPhone}
                onChange={handleInputChange}
                placeholder="10-digit phone"
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] placeholder:text-slate-400 transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Guardian Email
              </label>
              <input
                type="email"
                name="guardianEmail"
                value={formData.guardianEmail}
                onChange={handleInputChange}
                placeholder="Guardian's email"
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] placeholder:text-slate-400 transition"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
