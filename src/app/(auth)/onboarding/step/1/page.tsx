'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'

const institutionTypes = [
  { value: 'SCHOOL', label: 'School' },
  { value: 'LEARNING_CENTER', label: 'Learning Center' },
  { value: 'JUNIOR_COLLEGE', label: 'Junior College' },
  { value: 'COACHING_CENTER', label: 'Coaching Center' }
]

const schoolTypes = [
  'Private School',
  'Government School',
  'Government-Aided School',
  'International School',
  'Special Education'
]

const languages = ['English', 'Tamil', 'Hindi', 'Other']

const grades = [
  'Playgroup', 'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
]

export default function OnboardingStep1() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form Fields
  const [name, setName] = useState('')
  const [institutionType, setInstitutionType] = useState('SCHOOL')
  const [schoolType, setSchoolType] = useState('Private School')
  const [establishedYear, setEstablishedYear] = useState('')
  const [description, setDescription] = useState('')
  const [totalStudents, setTotalStudents] = useState('')
  const [totalTeachers, setTotalTeachers] = useState('')
  const [mediumOfInstruction, setMediumOfInstruction] = useState<string[]>([])
  const [gender, setGender] = useState('Co-Educational')
  const [gradeFrom, setGradeFrom] = useState('LKG')
  const [gradeTo, setGradeTo] = useState('Class 10')

  useEffect(() => {
    // Fetch onboarding status to prefill details
    fetch('/api/v1/onboarding/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.school) {
          const s = data.school
          setName(s.name || '')
          setInstitutionType(s.institutionType || 'SCHOOL')
          setSchoolType(s.schoolType || 'Private School')
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
        }
      })
      .catch((err) => console.error('Error pre-filling onboarding form:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleLangToggle = (lang: string) => {
    setMediumOfInstruction((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || !institutionType || !schoolType || !establishedYear) {
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
            institutionType,
            schoolType,
            establishedYear: yearNum,
            description,
            totalStudents: totalStudents ? parseInt(totalStudents) : null,
            totalTeachers: totalTeachers ? parseInt(totalTeachers) : null,
            mediumOfInstruction,
            gender,
            gradeFrom,
            gradeTo
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
        <p className="text-slate-500 text-sm font-semibold">Loading school info...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between">
      <div>
        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-extrabold text-slate-800">Tell us about your school</h2>
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
              School / Center Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter school name"
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                School Type <span className="text-red-500">*</span>
              </label>
              <select
                value={schoolType}
                onChange={(e) => setSchoolType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
              >
                {schoolTypes.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

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

          {/* School Description */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                School Description
              </label>
              <span className={`text-[10px] font-bold ${description.length > 500 ? 'text-red-500' : 'text-slate-400'}`}>
                {description.length} / 500
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Tell parents about your school's vision, achievements and unique strengths..."
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
                Total Teachers <span className="text-slate-400 font-medium">(Optional)</span>
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
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Medium of Instruction
            </label>
            <div className="flex flex-wrap gap-4 pt-1">
              {languages.map((l) => (
                <label key={l} className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mediumOfInstruction.includes(l)}
                    onChange={() => handleLangToggle(l)}
                    className="w-4.5 h-4.5 rounded text-[#1565D8] border-slate-300 focus:ring-[#1565D8]"
                  />
                  <span>{l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Gender Radio Buttons */}
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

          {/* Grades Offered Dropdowns */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Grades Offered
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">From</span>
                <select
                  value={gradeFrom}
                  onChange={(e) => setGradeFrom(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] text-xs cursor-pointer"
                >
                  {grades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <span className="text-slate-400 font-bold self-end pb-3 text-sm">to</span>
              <div className="flex-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">To</span>
                <select
                  value={gradeTo}
                  onChange={(e) => setGradeTo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] text-xs cursor-pointer"
                >
                  {grades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
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
