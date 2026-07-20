'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { ArrowLeft, Save, Loader2, AlertCircle, CalendarDays } from 'lucide-react'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { useAcademicYearStore } from '@/stores/academic-year.store'
import { useClassOptions } from '@/hooks/useClassOptions'
import { isLearningCentre } from '@/lib/institution'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar as UiCalendar } from "@/components/ui/calendar"
import { DedupDialog, DedupPayload } from "@/components/dedup/DedupDialog"
import { AppSelect } from '@/components/ui/app-select'
import { ScheduleBuilder, type ScheduleValue } from '@/components/students/ScheduleBuilder'

const format = (date: Date, formatStr: string): string => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  if (formatStr === 'yyyy-MM-dd') {
    return `${yyyy}-${mm}-${dd}`
  }
  if (formatStr === 'd MMM yyyy') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${parseInt(dd)} ${months[date.getMonth()]} ${yyyy}`
  }
  return date.toLocaleDateString()
}

export default function CreateStudentPage() {
  const router = useRouter()
  const { years, currentYear, isLoading: loadingYears } = useAcademicYears()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [dedup, setDedup] = useState<DedupPayload | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    gradeLabel: '',
    section: '',
    rollNumber: '',
    gender: '',
    academicYearId: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: ''
  })

  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined)

  // Institution mode — schools pick class+section, centres pick course+batch.
  const [isLC, setIsLC] = useState<boolean | null>(null)
  useEffect(() => {
    fetch('/api/v1/settings/org-type')
      .then(r => r.json())
      .then(json => setIsLC(isLearningCentre(json?.data?.institutionType)))
      .catch(() => setIsLC(false))
  }, [])

  // School: class/section master (falls back to the static grade ladder).
  const { options: classOptions } = useClassOptions(isLC === false)
  const selectedClass = classOptions.find(c => c.name === formData.gradeLabel)
  const sectionOptions = selectedClass?.sections ?? []

  // School: fee plan matched to the chosen class (admins/accountants only —
  // fetch failure just hides the card).
  const [feePlans, setFeePlans] = useState<any[]>([])
  useEffect(() => {
    if (isLC !== false || !formData.gradeLabel) {
      setFeePlans([])
      return
    }
    // Fee plan templates store the grade SLUG ('class_5'), students the label.
    const slug = selectedClass?.gradeSlug || formData.gradeLabel
    fetch(`/api/v1/fees/plans?gradeLabel=${encodeURIComponent(slug)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => setFeePlans(json?.data ?? []))
      .catch(() => setFeePlans([]))
  }, [isLC, formData.gradeLabel, selectedClass?.gradeSlug])

  // LC: course catalog + batches for quick-enroll.
  const [courses, setCourses] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [courseId, setCourseId] = useState('')
  // Schedule choice for the LC enrol flow (join a batch vs custom weekly slots).
  const [schedule, setSchedule] = useState<ScheduleValue>({ mode: 'none', batchId: '', slots: [] })
  useEffect(() => {
    if (isLC !== true) return
    fetch('/api/v1/options/courses')
      .then(r => r.json())
      .then(json => setCourses(json?.data?.courses ?? []))
      .catch(() => {})
    fetch('/api/v1/options/batches')
      .then(r => r.json())
      .then(json => setBatches(json?.data?.batches ?? []))
      .catch(() => {})
  }, [isLC])
  const selectedCourse = courses.find(c => c.id === courseId)

  // Default the academic year to the global switcher selection (else the
  // org's active year) so new students never land without a year scope.
  const selectedYearId = useAcademicYearStore((s) => s.selectedYearId)
  useEffect(() => {
    if (formData.academicYearId) return
    const defaultId = (selectedYearId && years.some((y: any) => y.id === selectedYearId))
      ? selectedYearId
      : currentYear?.id
    if (defaultId) setFormData(prev => prev.academicYearId ? prev : { ...prev, academicYearId: defaultId })
  }, [selectedYearId, currentYear?.id, years, formData.academicYearId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const submit = async (force = false) => {
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
          dateOfBirth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : undefined,
          gradeLabel: formData.gradeLabel || undefined,
          section: formData.section.trim() || undefined,
          batchId: (schedule.mode === 'batch' && schedule.batchId) || undefined,
          rollNumber: formData.rollNumber.trim() || undefined,
          academicYearId: formData.academicYearId || undefined,
          guardianName: formData.guardianName.trim() || undefined,
          guardianPhone: formData.guardianPhone.trim() || undefined,
          guardianEmail: formData.guardianEmail.trim() || undefined,
          ...(force ? { force: true } : {}),
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        // Duplicate detected — surface the match picker instead of a raw error.
        if (json.code === 'CONFLICT' && json.details?.dedup) {
          setDedup(json.details.dedup)
          return
        }
        throw new Error(json.error || json.message || 'Failed to create student')
      }

      setDedup(null)

      // LC quick-enroll: course chosen → enrolment + first invoice in one go.
      // Failure is non-blocking; the student page has the enroll card.
      if (isLC && courseId && json.data?.id) {
        try {
          await fetch(`/api/v1/students/${json.data.id}/enrollments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId,
              startDate: format(new Date(), 'yyyy-MM-dd'),
              // Custom weekly schedule → per-student slots + generated sessions.
              // A batched student uses the cohort schedule, so no slots here.
              ...(schedule.mode === 'custom' && schedule.slots.length > 0
                ? { schedule: { slots: schedule.slots, startDate: format(new Date(), 'yyyy-MM-dd') } }
                : {})
            })
          })
        } catch (err) {
          console.error('Quick-enroll failed (student created):', err)
        }
      }
      // Invalidate student list cache
      await mutate(
        (key: string) =>
          typeof key === 'string' &&
          key.startsWith('/api/v1/students'),
        undefined,
        { revalidate: true }
      )

      router.push('/student-management?success=created')
    } catch (err: any) {
      console.error('Submit error:', err)
      setErrorMessage(err.message || 'Failed to create student')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setErrorMessage('Student Name is required')
      return
    }
    submit(false)
  }

  const isFormValid = Boolean(formData.name.trim())

  return (
    <div className="p-3 sm:p-4 lg:p-6 pb-28 lg:pb-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full text-left">
      <DedupDialog
        payload={dedup}
        onClose={() => setDedup(null)}
        onForce={() => submit(true)}
        busy={isSubmitting}
      />
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
            className="border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-slate-50 transition min-h-[42px] flex items-center justify-center cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition ${
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
                <span>Saving...</span>
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
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6 overflow-visible">
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
              <AppSelect
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] transition"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </AppSelect>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Date of Birth
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-10 px-3.5 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 flex items-center gap-2 text-slate-700 text-left focus:outline-none focus:border-[#1565D8] transition"
                  >
                    <CalendarDays size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="flex-1 truncate font-medium">
                      {dateOfBirth
                        ? format(dateOfBirth, 'd MMM yyyy')
                        : 'Select date'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  avoidCollisions={true}
                  collisionPadding={16}
                  sideOffset={4}
                  className="z-[9999] w-auto p-0 shadow-xl rounded-xl border border-slate-200"
                >
                  <UiCalendar
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={setDateOfBirth}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                Academic Year
              </label>
              <AppSelect
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
              </AppSelect>
            </div>

            {isLC !== true && (
              <>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                    Class
                  </label>
                  <AppSelect
                    name="gradeLabel"
                    value={formData.gradeLabel}
                    onChange={e => {
                      if (e.target.value === '__manage__') { router.push('/settings/classes'); return }
                      setFormData(prev => ({ ...prev, gradeLabel: e.target.value, section: '' }))
                    }}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] transition"
                  >
                    <option value="">Select Class</option>
                    {classOptions.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__manage__">＋ Add class…</option>
                  </AppSelect>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                    Section
                  </label>
                  {sectionOptions.length > 0 ? (
                    <AppSelect
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] transition"
                    >
                      <option value="">No section</option>
                      {sectionOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </AppSelect>
                  ) : (
                    <input
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      placeholder={formData.gradeLabel ? 'e.g. A (optional)' : 'Pick a class first'}
                      disabled={!formData.gradeLabel}
                      className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] placeholder:text-slate-400 transition disabled:bg-slate-50"
                    />
                  )}
                </div>
              </>
            )}

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

        {/* LC: course enrolment + batch (quick-enroll) */}
        {isLC === true && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100 mb-4">
              Course Enrolment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                  Course
                </label>
                <AppSelect
                  value={courseId}
                  onChange={e => setCourseId(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] transition"
                >
                  <option value="">Enroll later</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </AppSelect>
              </div>
              <div className="sm:col-span-2">
                <ScheduleBuilder
                  course={selectedCourse ?? null}
                  batches={batches}
                  onChange={setSchedule}
                />
              </div>
              {selectedCourse && (
                <div className="sm:col-span-2 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    ₹{Number(selectedCourse.amount).toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      / {String(selectedCourse.frequency).toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Saving will enroll the student and generate the first invoice automatically.
                    Next invoices follow on day {selectedCourse.billingDay} of the billing period.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* School: fee plan matched to the chosen class */}
        {isLC === false && formData.gradeLabel && feePlans.length > 0 && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
              Fee plan for {formData.gradeLabel}
            </p>
            <p className="text-sm font-semibold text-slate-800">{feePlans[0].name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Invoices for this class use this plan — generate them from Fee Management after saving.
            </p>
          </div>
        )}

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
