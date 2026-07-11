'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, ArrowRight, MapPin, Award, Lock, ArrowLeft } from 'lucide-react'
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

const institutionTypeLabels: Record<string, string> = {
  SCHOOL: 'School',
  LEARNING_CENTER: 'Learning Center',
  JUNIOR_COLLEGE: 'Junior College',
  COACHING_CENTER: 'Coaching Center'
}

interface SimilarSchool {
  id: string
  name: string
  slug: string
  institutionType: string
  locations: Array<{ address: string; city: string }>
  affiliations: Array<{ board: string }>
}

const grades = [...GRADE_RANGE_OPTIONS]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: School details fields
  const [schoolName, setSchoolName] = useState('')
  const [institutionType, setInstitutionType] = useState('SCHOOL')
  const [city, setCity] = useState('Chennai')
  const [board, setBoard] = useState('CBSE')
  const [establishedYear, setEstablishedYear] = useState('')
  const [role, setRole] = useState('')
  const [centerCategory, setCenterCategory] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  // New fields from Step 1 Onboarding
  const [schoolType, setSchoolType] = useState('PRIVATE')
  const [totalTeachers, setTotalTeachers] = useState('')
  const [mediumOfInstruction, setMediumOfInstruction] = useState<string[]>(['ENGLISH'])
  const [examFocus, setExamFocus] = useState<string[]>([])
  const [gradeFrom, setGradeFrom] = useState('LKG')
  const [gradeTo, setGradeTo] = useState('Class 10')

  const config = INSTITUTION_CONFIG[
    institutionType as InstitutionType
  ] ?? INSTITUTION_CONFIG['SCHOOL']

  // Update school type if institution type changes and makes previous value invalid
  useEffect(() => {
    if (config.showSchoolType && config.schoolTypeOptions.length > 0) {
      const isValid = config.schoolTypeOptions.some(opt => opt.value === schoolType)
      if (!isValid) {
        setSchoolType(config.schoolTypeOptions[0].value)
      }
    }
  }, [institutionType, config, schoolType])

  // Similar school warning state
  const [similarSchool, setSimilarSchool] = useState<SimilarSchool | null>(null)
  const [showWarning, setShowWarning] = useState(false)

  // Step 2: Admin details fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    setPhone(val)
  }

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const needsBoard = config.showSchoolType
    const needsCenterCategory = config.showCenterCategory

    if (!schoolName || !institutionType || !city || (needsBoard && !board) || (needsCenterCategory && !centerCategory) || !role) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Check similar schools
      const res = await fetch(`/api/public/schools?search=${encodeURIComponent(schoolName)}&city=${encodeURIComponent(city)}`)
      const data = await res.json()

      if (res.ok && data.success && data.data && data.data.length > 0) {
        // Similar school found
        setSimilarSchool(data.data[0])
        setShowWarning(true)
      } else {
        // No similar school, proceed to Step 2
        setStep(2)
      }
    } catch (err: any) {
      console.error('Similar school check error:', err)
      // Proceed to Step 2 anyway on error
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const handleContinueRegistering = () => {
    setShowWarning(false)
    setStep(2)
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || !phone || !email) {
      setError('Please fill in all fields')
      return
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number starting with 6-9')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/school/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          role,
          schoolName,
          institutionType,
          city,
          board: config.showSchoolType ? board : null,
          schoolType: config.showSchoolType ? schoolType : null,
          centerCategory: config.showCenterCategory ? centerCategory : null,
          establishedYear: establishedYear ? parseInt(establishedYear) : null,
          mediumOfInstruction,
          examFocus: config.showExamFocus ? examFocus : [],
          gradeFrom: config.showGradesOffered ? (config.gradesLocked ? 'Class 11' : gradeFrom) : null,
          gradeTo: config.showGradesOffered ? (config.gradesLocked ? 'Class 12' : gradeTo) : null,
          totalTeachers: totalTeachers ? parseInt(totalTeachers) : null
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create school account')
      }

      // Store phone in sessionStorage for verify-phone page
      sessionStorage.setItem('claim_register_phone', phone)
      
      // Redirect to OTP verification page
      router.push('/claim-profile/verify-phone')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to complete registration')
    } finally {
      setLoading(false)
    }
  }

  const progressSteps = [
    { number: 1, label: 'Details' },
    { number: 2, label: 'Account' }
  ]

  return (
    <main className="h-screen w-full flex font-sans antialiased overflow-hidden bg-[#F8FAFC]">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          animation: fadeSlideUp 0.4s ease-out forwards;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }
      `}} />

      {/* ========== LEFT BRANDED PANEL (hidden on mobile) ========== */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#60A5FA] animate-gradient h-full">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/[0.04]" />
        <div className="absolute top-1/3 -right-16 w-56 h-56 rounded-full bg-white/[0.06]" />
        <div className="absolute -bottom-12 left-1/4 w-40 h-40 rounded-full bg-white/[0.05]" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full h-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vidhyaan-icon-white.svg" alt="Vidhyaan" className="w-9 h-9" />
            <span className="text-lg font-extrabold text-white tracking-tight">Vidhyaan for Partners</span>
          </div>

          {/* Hero text */}
          <div className="space-y-5 animate-fade-slide-up">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
                Scale Your Institution.<br />
                Empower Your<br />
                <span className="text-blue-100">Learners.</span>
              </h2>
              <p className="text-white/85 text-sm leading-relaxed max-w-[340px]">
                Create a customized digital profile, run online admissions, collect fee settlements instantly, and manage your school or learning center on India's premier platform.
              </p>
            </div>

            {/* Floating stat cards */}
            <div className="flex gap-2.5 pt-1">
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 animate-float" style={{ animationDelay: '0s' }}>
                <div className="text-xl font-extrabold text-white">100K+</div>
                <div className="text-[10px] font-medium text-white/70 mt-0.5">Queries</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 animate-float" style={{ animationDelay: '1s' }}>
                <div className="text-xl font-extrabold text-white">1-Click</div>
                <div className="text-[10px] font-medium text-white/70 mt-0.5">Settlement</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 animate-float" style={{ animationDelay: '2s' }}>
                <div className="text-xl font-extrabold text-white">Free</div>
                <div className="text-[10px] font-medium text-white/70 mt-0.5">Setup</div>
              </div>
            </div>
          </div>

          {/* Bottom trust strip */}
          <div className="flex items-center gap-2 text-[11px] text-blue-200/60 font-medium">
            <Lock className="w-3 h-3 text-white/50" />
            <span className="text-white/50">256-bit encrypted · SOC 2 compliant</span>
          </div>
        </div>
      </div>

      {/* ========== RIGHT REGISTER PANEL ========== */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 h-full overflow-hidden">
        <div className="w-full max-w-[720px] animate-fade-slide-up">
          
          {/* Mobile logo (hidden on desktop) */}
          <div className="flex flex-col items-center mb-4 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vidhyaan-icon.svg" alt="Vidhyaan" className="w-10 h-10 mb-1.5" />
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Vidhyaan
            </h1>
          </div>

          {/* Card Container */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_30px_rgb(0,0,0,0.03)] p-5 lg:p-6">
            
            {/* Header section (very compact) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3.5 mb-4 gap-3">
              <div>
                <h1 className="text-lg font-black text-slate-900 leading-tight">
                  Register Your Institution
                </h1>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Create a free profile and grow your academy.
                </p>
              </div>

              {/* Animated Progress Indicators */}
              <div className="flex items-center gap-4">
                {progressSteps.map((s) => {
                  const isCompleted = s.number < step
                  const isActive = s.number === step
                  return (
                    <div key={s.number} className="flex items-center gap-1.5">
                      <div 
                        className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                          isActive 
                            ? 'w-5 h-5 bg-[#1565D8] text-white font-extrabold text-[10px]' 
                            : isCompleted 
                              ? 'w-5 h-5 bg-emerald-500 text-white text-[10px] flex items-center justify-center' 
                              : 'w-5 h-5 bg-slate-100 border border-slate-200 text-slate-400 text-[10px]'
                        }`}
                      >
                        {isCompleted ? '✓' : s.number}
                      </div>
                      <span className={`text-[10px] font-extrabold tracking-wider ${
                        isActive ? 'text-[#1565D8]' : isCompleted ? 'text-emerald-500' : 'text-slate-400'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-[11px] font-semibold text-red-600 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* WARNING CARD FOR SIMILAR SCHOOLS */}
            {showWarning && similarSchool ? (
              <div className="space-y-4 animate-fadeIn max-w-[480px] mx-auto py-3">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 flex gap-3 text-xs leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-amber-800 block">We found a similar institution on file:</span>
                    <div className="bg-white p-2.5 rounded-lg border border-amber-200/60 space-y-1 my-1">
                      <span className="font-extrabold text-slate-800 text-xs block">{similarSchool.name}</span>
                      <span className="text-slate-400 text-[10px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {similarSchool.locations[0]?.address}, {similarSchool.locations[0]?.city}
                      </span>
                      {similarSchool.affiliations[0]?.board && (
                        <span className="text-slate-400 text-[10px] flex items-center gap-1">
                          <Award className="w-3 h-3 text-slate-400" />
                          {similarSchool.affiliations[0].board}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-700 block">Is this your institution?</span>
                    <p className="text-slate-500 text-[11px]">
                      Claiming is faster than registering a duplicate listing.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => router.push(`/claim-profile/verify/${similarSchool.id}`)}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Yes, Claim This Institution</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleContinueRegistering}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-all cursor-pointer text-center"
                  >
                    No, Continue Registering New Institution
                  </button>
                </div>
              </div>
            ) : step === 1 ? (
              <form onSubmit={handleNext} className="space-y-3.5">
                {/* 2-Column Grid Layout for Desktop to avoid vertical scrolling */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  
                  {/* LEFT COLUMN FIELDS */}
                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        {config.nameFieldLabel} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="Enter school or center name"
                        disabled={loading}
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1565D8] focus:ring-1 focus:ring-blue-100 transition-all text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Institution Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={institutionType}
                        onChange={(e) => setInstitutionType(e.target.value)}
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] transition-all text-xs cursor-pointer"
                        required
                      >
                        {Object.entries(institutionTypeLabels).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          City <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] transition-all text-xs cursor-pointer"
                          required
                        >
                          <option value="Chennai">Chennai</option>
                          <option value="Bengaluru">Bengaluru</option>
                          <option value="Mumbai">Mumbai</option>
                          <option value="New Delhi">New Delhi</option>
                          <option value="Hyderabad">Hyderabad</option>
                          <option value="Pune">Pune</option>
                          <option value="Kolkata">Kolkata</option>
                        </select>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Role <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] transition-all text-xs cursor-pointer"
                          required
                        >
                          <option value="" disabled>Select role</option>
                          <option value="Principal">Principal</option>
                          <option value="Vice Principal">Vice Principal</option>
                          <option value="Administrative Head">Administrative Head</option>
                          <option value="IT Manager">IT Manager</option>
                          <option value="Owner/Management">Owner</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Established Year
                        </label>
                        <input
                          type="number"
                          value={establishedYear}
                          onChange={(e) => setEstablishedYear(e.target.value)}
                          placeholder="e.g. 2005"
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1565D8] transition-all text-xs"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          {config.teacherLabel}
                        </label>
                        <input
                          type="number"
                          value={totalTeachers}
                          onChange={(e) => setTotalTeachers(e.target.value)}
                          placeholder="e.g. 25"
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1565D8] transition-all text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN FIELDS */}
                  <div className="space-y-3">
                    
                    {config.showSchoolType && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Curriculum <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={board}
                            onChange={(e) => setBoard(e.target.value)}
                            className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] transition-all text-xs cursor-pointer"
                            required
                          >
                            <option value="CBSE">CBSE</option>
                            <option value="ICSE">ICSE</option>
                            <option value="State Board">State Board</option>
                            <option value="IB">IB</option>
                            <option value="Cambridge">Cambridge</option>
                            <option value="IGCSE">IGCSE</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            School Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={schoolType}
                            onChange={(e) => setSchoolType(e.target.value)}
                            className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] transition-all text-xs cursor-pointer"
                            required
                          >
                            {config.schoolTypeOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {config.showCenterCategory && (
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Center Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={centerCategory}
                          onChange={(e) => setCenterCategory(e.target.value)}
                          className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] transition-all text-xs cursor-pointer"
                          required
                        >
                          <option value="">Select category</option>
                          {CENTER_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {config.showGradesOffered && (
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Grades Offered
                        </label>
                        {config.gradesLocked ? (
                          <div className="px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-[11px] text-slate-500 font-semibold leading-normal">
                            {config.lockedGradeLabel}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={gradeFrom}
                              onChange={(e) => setGradeFrom(e.target.value)}
                              className="flex-1 h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] text-[11px] cursor-pointer"
                            >
                              {grades.map((g) => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                            <span className="text-slate-400 text-xs font-bold">to</span>
                            <select
                              value={gradeTo}
                              onChange={(e) => setGradeTo(e.target.value)}
                              className="flex-1 h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#1565D8] text-[11px] cursor-pointer"
                            >
                              {grades.map((g) => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {config.showMediumOfInstruction && (
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Medium of Instruction
                        </label>
                        <LanguageTagInput
                          value={mediumOfInstruction ?? []}
                          onChange={(vals) => setMediumOfInstruction(vals)}
                          options={INDIAN_LANGUAGES}
                        />
                      </div>
                    )}

                    {config.showExamFocus && (
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          Exam Focus
                        </label>
                        <ExamFocusTagInput
                          value={examFocus ?? []}
                          onChange={(vals) => setExamFocus(vals)}
                          options={EXAM_FOCUS_OPTIONS}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-350 text-[#1565D8] focus:ring-[#1565D8]"
                      required
                    />
                    <span className="text-[10px] text-slate-500 leading-normal">
                      I agree to the{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#1565D8] font-bold hover:underline">
                        Terms
                      </a>{' '}
                      &{' '}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#1565D8] font-bold hover:underline">
                        Privacy Policy
                      </a>
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading || !agreeTerms || schoolName.trim().length < 2}
                    className="ml-auto w-40 flex items-center justify-center h-9 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg transition-all text-xs cursor-pointer disabled:cursor-not-allowed select-none"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 2 FORM: Admin Account details (Very compact) */
              <form onSubmit={handleCreateAccount} className="space-y-4 max-w-[420px] mx-auto py-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    disabled={loading}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1565D8] transition-all text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-500 font-semibold select-none text-xs border-r border-slate-200 pr-2">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      disabled={loading}
                      className="w-full h-9 pl-12 pr-3 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1565D8] transition-all text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    disabled={loading}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1565D8] transition-all text-xs"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-auto w-48 flex items-center justify-center h-9 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg transition-all text-xs cursor-pointer select-none"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Register & Verify'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer switcher links */}
          <div className="text-center mt-3.5 flex items-center justify-center gap-3 text-xs font-semibold text-slate-500 select-none">
            <Link href="/login" className="text-[#1565D8] hover:underline">
              Already registered? Login
            </Link>
            <span className="text-slate-300 font-normal">|</span>
            <Link href="/" className="text-slate-600 hover:underline flex items-center gap-1">
              ← Back to Home
            </Link>
          </div>

          {/* Bottom trust strip (mobile) */}
          <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-slate-400 font-medium lg:hidden">
            <Lock className="w-3 h-3" />
            <span>256-bit encrypted · Verified Partner Profiles</span>
          </div>
        </div>
      </div>
    </main>
  )
}
