'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, BookOpen, Users } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: 'Music',
  DANCE: 'Dance',
  ART: 'Art',
  ABACUS: 'Abacus',
  COACHING: 'Coaching / Tuition',
  SPORTS: 'Sports',
  LANGUAGE: 'Language',
  STEM: 'STEM / Robotics',
  OTHER: 'Other'
}

const FREQUENCY_LABELS: Record<string, string> = {
  ONE_TIME: 'One Time',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half Yearly',
  ANNUAL: 'Annual',
  CUSTOM: 'Custom'
}

const FREQUENCY_COLORS: Record<string, string> = {
  ONE_TIME: 'bg-slate-100 text-slate-600',
  MONTHLY: 'bg-blue-50 text-blue-700',
  QUARTERLY: 'bg-purple-50 text-purple-700',
  HALF_YEARLY: 'bg-amber-50 text-amber-700',
  ANNUAL: 'bg-green-50 text-green-700',
  CUSTOM: 'bg-slate-100 text-slate-600'
}

export default function CoursesSettingsPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    amount: '',
    frequency: 'MONTHLY',
    billingDay: '1',
    durationMonths: '',
    isActive: true
  })

  const fetchCourses = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/v1/settings/courses')
      const data = await res.json()
      setCourses(data.data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value
    }))
  }

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      category: '',
      amount: '',
      frequency: 'MONTHLY',
      billingDay: '1',
      durationMonths: '',
      isActive: true
    })
    setEditingCourse(null)
    setShowForm(false)
    setError(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Course name is required')
      return
    }
    if (!form.amount || isNaN(Number(form.amount))) {
      setError('Valid amount is required')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const url = editingCourse
        ? `/api/v1/settings/courses/${editingCourse.id}`
        : '/api/v1/settings/courses'
      const method = editingCourse ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          category: form.category || undefined,
          amount: Number(form.amount),
          frequency: form.frequency,
          billingDay: Number(form.billingDay),
          durationMonths: form.durationMonths
            ? Number(form.durationMonths)
            : undefined,
          isActive: form.isActive
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message ?? 'Failed to save')
      }

      await fetchCourses()
      resetForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (course: any) => {
    setEditingCourse(course)
    setForm({
      name: course.name,
      description: course.description ?? '',
      category: course.category ?? '',
      amount: String(course.amount),
      frequency: course.frequency,
      billingDay: String(course.billingDay),
      durationMonths: course.durationMonths
        ? String(course.durationMonths)
        : '',
      isActive: course.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Delete this course? Students currently enrolled will not be affected but no new enrollments will be possible.'
      )
    )
      return
    await fetch(`/api/v1/settings/courses/${id}`, { method: 'DELETE' })
    await fetchCourses()
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Courses</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Define courses offered by your center. Fee invoices will be generated based on these settings.
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
          Add Course
        </button>
      </div>

      {/* ── ADD / EDIT FORM ── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </h2>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Course Name */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">
                Course Name
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Abacus Level 1"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Brief description of the course..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select category</option>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fee Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Fee Amount (₹)
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                placeholder="e.g. 2000"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Frequency */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Billing Frequency
              </label>
              <select
                name="frequency"
                value={form.frequency}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {Object.entries(FREQUENCY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Billing Day */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Billing Day of Month
              </label>
              <input
                name="billingDay"
                type="number"
                min={1}
                max={28}
                value={form.billingDay}
                onChange={handleChange}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400">
                Day of month when invoice is auto-generated (1-28)
              </p>
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">
                Duration (months)
              </label>
              <input
                name="durationMonths"
                type="number"
                value={form.durationMonths}
                onChange={handleChange}
                placeholder="Leave blank for ongoing"
                className="w-full sm:w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400">
                Leave blank for ongoing courses with no fixed end date
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingCourse ? 'Update Course' : 'Save Course'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── COURSES LIST ── */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500">
              No courses added yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Add your first course to start generating fee invoices
            </p>
          </div>
        ) : (
          courses.map(course => (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-4"
            >
              {/* Left — Course Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {course.name}
                  </p>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      FREQUENCY_COLORS[course.frequency] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {FREQUENCY_LABELS[course.frequency] ?? course.frequency}
                  </span>
                  {!course.isActive && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-red-50 text-red-600">
                      Inactive
                    </span>
                  )}
                </div>

                {course.description && (
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                    {course.description}
                  </p>
                )}

                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-bold text-slate-900">
                    ₹{Number(course.amount).toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-slate-400 ml-1">
                      / {FREQUENCY_LABELS[course.frequency]?.toLowerCase() ?? 'period'}
                    </span>
                  </span>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {course._count?.enrollments ?? 0} enrolled
                  </span>

                  {course.category && (
                    <span className="text-xs text-slate-400">
                      {CATEGORY_LABELS[course.category] ?? course.category}
                    </span>
                  )}

                  <span className="text-xs text-slate-400">
                    Billing: {course.billingDay}
                    {course.billingDay === 1
                      ? 'st'
                      : course.billingDay === 2
                      ? 'nd'
                      : course.billingDay === 3
                      ? 'rd'
                      : 'th'} of month
                  </span>

                  {course.durationMonths && (
                    <span className="text-xs text-slate-400">
                      {course.durationMonths} month duration
                    </span>
                  )}
                </div>
              </div>

              {/* Right — Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(course)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
