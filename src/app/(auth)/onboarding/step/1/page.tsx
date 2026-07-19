'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import {
  INSTITUTION_CONFIG,
  CENTER_CATEGORIES,
  EXAM_FOCUS_OPTIONS,
  INDIAN_LANGUAGES,
  type InstitutionType,
} from '@/constants/institutionConfig'
import { LanguageTagInput } from '@/components/ui/LanguageTagInput'
import { ExamFocusTagInput } from '@/components/ui/ExamFocusTagInput'
import { GRADE_RANGE_OPTIONS } from '@/constants/grades'
import { AppSelect } from '@/components/ui/app-select'

const institutionTypes = [
  { value: 'SCHOOL', label: 'School' },
  { value: 'LEARNING_CENTER', label: 'Learning Center' },
  { value: 'JUNIOR_COLLEGE', label: 'Junior College' },
  { value: 'COACHING_CENTER', label: 'Coaching Center' }
]

const grades = [...GRADE_RANGE_OPTIONS]

export default function OnboardingStep1() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form Fields
  const [name, setName] = useState('')
  const [institutionType, setInstitutionType] = useState('SCHOOL')
  const [schoolType, setSchoolType] = useState('PRIVATE')
  const [centerCategory, setCenterCategory] = useState('')
  const [examFocus, setExamFocus] = useState<string[]>([])
  const [establishedYear, setEstablishedYear] = useState('')
  const [description, setDescription] = useState('')
  const [totalStudents, setTotalStudents] = useState('')
  const [totalTeachers, setTotalTeachers] = useState('')
  const [mediumOfInstruction, setMediumOfInstruction] = useState<string[]>([])
  const [gender, setGender] = useState('Co-Educational')
  const [gradeFrom, setGradeFrom] = useState('LKG')
  const [gradeTo, setGradeTo] = useState('Class 10')
  const [email, setEmail] = useState('')

  const config = INSTITUTION_CONFIG[
    institutionType as InstitutionType
  ] ?? INSTITUTION_CONFIG['SCHOOL']

  useEffect(() => {
    // Fetch onboarding status to prefill details
    fetch('/api/v1/onboarding/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.school) {
          const s = data.school
          setName(s.name || '')
          setInstitutionType(s.institutionType || 'SCHOOL')
          setSchoolType(s.schoolType || 'PRIVATE')
          setCenterCategory(s.centerCategory || '')
          setExamFocus(s.examFocus || [])
          setEstablishedYear(s.establishedYear ? s.establishedYear.toString() : '')
          setDescription(s.description || '')
          setTotalStudents(s.totalStudents ? s.totalStudents.toString() : '')
          setTotalTeachers(s.totalTeachers ? s.totalTeachers.toString() : '')
          
          if (s.mediumOfInstruction) {
            setMediumOfInstruction(s.mediumOfInstruction.split(', '))
          }
          setGender(s.gender || 'Co-Educational')

          if (s.gradesOffered && s.gradesOffered.includes(' to ')) {
            const [from, to] = s.gradesOffered.split(' to ')
            setGradeFrom(from || 'LKG')
            setGradeTo(to || 'Class 10')
          }
          const em = s.contacts?.find((c: any) => c.type === 'email')
          if (em) {
            setEmail(em.value || '')
          }
        }
      })
      .catch((err) => console.error('Error pre-filling onboarding form:', err))
      .finally(() => setLoading(false))
  }, [])

  // Update school type if institution type changes and makes previous value invalid
  useEffect(() => {
    if (config.showSchoolType && config.schoolTypeOptions.length > 0) {
      const isValid = config.schoolTypeOptions.some(opt => opt.value === schoolType)
      if (!isValid) {
        setSchoolType(config.schoolTypeOptions[0].value)
      }
    }
  }, [institutionType, config])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || !email || !institutionType || (config.showSchoolType && !schoolType) || (config.showCenterCategory && !centerCategory) || !establishedYear) {
      setError('Please fill in all required fields')
      return
    }

    const yearNum = parseInt(establishedYear)
    const currentYear = new Date().getFullYear()
    if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear) {
      setError(`Please enter a valid established year (1800 - ${currentYear})`)
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/v1/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 1,
          data: {
            name,
            email,
            institutionType,
            schoolType: config.showSchoolType ? schoolType : null,
            centerCategory: config.showCenterCategory ? centerCategory : null,
            examFocus: config.showExamFocus ? examFocus : [],
            establishedYear: yearNum,
            description,
            totalStudents: totalStudents ? parseInt(totalStudents) : null,
            totalTeachers: totalTeachers ? parseInt(totalTeachers) : null,
            mediumOfInstruction: config.showMediumOfInstruction ? mediumOfInstruction : [],
            gender: config.showGender ? gender : null,
            gradeFrom: config.showGradesOffered ? (config.gradesLocked ? 'Class 11' : gradeFrom) : null,
            gradeTo: config.showGradesOffered ? (config.gradesLocked ? 'Class 12' : gradeTo) : null
          }
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save school details')
      }

      router.push('/onboarding/step/2')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 flex-1">
        <Loader2 className="w-8 h-8 text-[#1565D8] animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-semibold">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between">
      <div>
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">{config.headingLabel}</h1>
          <p className="text-sm text-slate-500">This information will appear on your public profile</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form id="step-1-form" onSubmit={handleSubmit} className="space-y-5">
          {/* School Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {config.nameFieldLabel.toUpperCase()} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${config.nameLabel.toLowerCase()} name`}
              disabled={saving}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
              required
            />
          </div>

          {/* Primary Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Primary Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`e.g. contact@${config.genericLabel.toLowerCase()}.edu`}
              disabled={saving}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
              required
            />
          </div>

          {/* Institution Type Segmented Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Institution Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl">
              {institutionTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setInstitutionType(t.value)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl text-center transition-all cursor-pointer ${
                    institutionType === t.value
                      ? 'bg-[#1565D8] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* School Type Dropdown */}
            {config.showSchoolType && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  School Type <span className="text-red-500">*</span>
                </label>
                <AppSelect
                  value={schoolType}
                  onChange={(e) => setSchoolType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
                >
                  {config.schoolTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </AppSelect>
              </div>
            )}

            {/* Center Category Dropdown */}
            {config.showCenterCategory && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Center Category <span className="text-red-500">*</span>
                </label>
                <AppSelect
                  value={centerCategory}
                  onChange={(e) => setCenterCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm cursor-pointer bg-white"
                >
                  <option value="">Select category...</option>
                  {CENTER_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </AppSelect>
              </div>
            )}

            {/* Year Established */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Year Established <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={establishedYear}
                onChange={(e) => setEstablishedYear(e.target.value)}
                placeholder="e.g. 1995"
                min={1800}
                max={new Date().getFullYear()}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                required
              />
            </div>
          </div>

          {/* Exam Focus field */}
          {config.showExamFocus && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                EXAM / COURSE FOCUS
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
              </label>
              <ExamFocusTagInput
                value={examFocus ?? []}
                onChange={(vals) => setExamFocus(vals)}
                options={EXAM_FOCUS_OPTIONS}
              />
              <p className="text-xs text-slate-400 mt-0.5">
                Select all that apply — helps students find your center
              </p>
            </div>
          )}

          {/* School Description */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {config.nameLabel} Description
              </label>
              <span className={`text-[10px] font-bold ${description.length > 500 ? 'text-red-500' : 'text-slate-400'}`}>
                {description.length} / 500
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder={`Tell parents about your ${config.nameLabel.toLowerCase()}'s vision, achievements and unique strengths...`}
              className="w-full min-h-[100px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Students */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Students <span className="text-slate-400 font-medium">(Optional)</span>
              </label>
              <input
                type="number"
                value={totalStudents}
                onChange={(e) => setTotalStudents(e.target.value)}
                placeholder="e.g. 800"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
              />
            </div>

            {/* Total Teachers */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {config.teacherLabel} <span className="text-slate-400 font-medium">(Optional)</span>
              </label>
              <input
                type="number"
                value={totalTeachers}
                onChange={(e) => setTotalTeachers(e.target.value)}
                placeholder="e.g. 45"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
              />
            </div>
          </div>

          {/* Medium of Instruction Checkboxes */}
          {config.showMediumOfInstruction && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                MEDIUM OF INSTRUCTION
              </label>
              <LanguageTagInput
                value={mediumOfInstruction ?? []}
                onChange={(vals) => setMediumOfInstruction(vals)}
                options={INDIAN_LANGUAGES}
              />
            </div>
          )}

          {/* Gender Radio Buttons */}
          {config.showGender && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Gender
              </label>
              <div className="flex flex-wrap gap-5 pt-1">
                {['Co-Educational', 'Boys Only', 'Girls Only'].map((g) => (
                  <label key={g} className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === g}
                      onChange={() => setGender(g)}
                      className="w-4.5 h-4.5 text-[#1565D8] border-slate-300 focus:ring-[#1565D8]"
                    />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Grades Offered Dropdowns */}
          {config.showGradesOffered && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Grades Offered
              </label>
              {config.gradesLocked ? (
                <div className="px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-600">
                  {config.lockedGradeLabel}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">From</span>
                    <AppSelect
                      value={gradeFrom}
                      onChange={(e) => setGradeFrom(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] text-xs cursor-pointer"
                    >
                      {grades.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </AppSelect>
                  </div>
                  <span className="text-slate-400 font-bold self-end pb-3 text-sm">to</span>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">To</span>
                    <AppSelect
                      value={gradeTo}
                      onChange={(e) => setGradeTo(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] text-xs cursor-pointer"
                    >
                      {grades.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </AppSelect>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Bottom Nav Bar */}
      <div className="border-t border-slate-100 pt-6 mt-8 flex items-center justify-between">
        <button
          disabled
          type="button"
          className="px-5 py-2.5 text-slate-300 font-bold text-sm bg-slate-50 rounded-xl select-none cursor-not-allowed"
        >
          ← Back
        </button>

        <button
          type="submit"
          form="step-1-form"
          disabled={saving}
          className="px-6 py-2.5 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>Save & Continue</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
