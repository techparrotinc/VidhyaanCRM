'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Loader2, AlertCircle, ArrowRight, MapPin, Award, Lock, ArrowLeft } from 'lucide-react'
import {
  INSTITUTION_CONFIG,
  CENTER_CATEGORIES,
  EXAM_FOCUS_OPTIONS,
  INDIAN_LANGUAGES,
  type InstitutionType,
} from '@/constants/institutionConfig'
import { LanguageTagInput } from '@/components/ui/LanguageTagInput'
import { ExamFocusTagInput } from '@/components/ui/ExamFocusTagInput'

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

const grades = [
  'Playgroup', 'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
]

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
    <main className="min-h-screen w-full flex font-sans antialiased">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          animation: fadeSlideUp 0.5s ease-out forwards;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
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
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#60A5FA] animate-gradient">
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
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
              <Shield className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">Vidhyaan for Partners</span>
          </div>

          {/* Hero text */}
          <div className="space-y-6 animate-fade-slide-up">
            <div className="space-y-3">
              <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
                Scale Your Institution.<br />
                Empower Your<br />
                <span className="text-blue-100">Learners.</span>
              </h2>
              <p className="text-white/90 text-base leading-relaxed max-w-[360px]">
                Create a customized digital profile, run online admissions, collect fee settlements instantly, and manage your school or learning center on India's premier platform.
              </p>
            </div>

            {/* Floating stat cards */}
            <div className="flex gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/15 animate-float" style={{ animationDelay: '0s' }}>
                <div className="text-2xl font-extrabold text-white">100K+</div>
                <div className="text-xs font-medium text-white/70 mt-0.5">Monthly Queries</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/15 animate-float" style={{ animationDelay: '1s' }}>
                <div className="text-2xl font-extrabold text-white">1-Click</div>
                <div className="text-xs font-medium text-white/70 mt-0.5">Fee Settlement</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/15 animate-float" style={{ animationDelay: '2s' }}>
                <div className="text-2xl font-extrabold text-white">Free</div>
                <div className="text-xs font-medium text-white/70 mt-0.5">Listing Setup</div>
              </div>
            </div>
          </div>

          {/* Bottom trust strip */}
          <div className="flex items-center gap-2 text-xs text-blue-200/60 font-medium">
            <Lock className="w-3.5 h-3.5 text-white/50" />
            <span className="text-white/50">256-bit encrypted · SOC 2 compliant · Verified Partner Profiles</span>
          </div>
        </div>
      </div>

      {/* ========== RIGHT REGISTER PANEL ========== */}
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] px-5 py-8 lg:px-12 overflow-y-auto">
        <div className="w-full max-w-[520px] animate-fade-slide-up my-auto">
          
          {/* Mobile logo (hidden on desktop) */}
          <div className="flex flex-col items-center mb-6 lg:hidden">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1565D8] to-[#1E88E5] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/40 mb-2.5">
              <Shield className="text-white w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Vidhyaan
            </h1>
          </div>

          {/* Card Container */}
          <div className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-6 lg:p-8">
            
            {/* Animated Progress Indicators */}
            <div className="relative flex items-center justify-between w-full max-w-[240px] mx-auto mb-6">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-100 rounded-full z-0" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#1565D8] rounded-full transition-all duration-500 z-0" 
                style={{ width: `${((step - 1) / 1) * 100}%` }}
              />
              {progressSteps.map((s) => {
                const isCompleted = s.number < step
                const isActive = s.number === step
                return (
                  <div key={s.number} className="relative z-10 flex flex-col items-center gap-1">
                    <div 
                      className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                        isActive 
                          ? 'w-7 h-7 bg-[#1565D8] ring-4 ring-blue-100 text-white font-bold text-xs animate-pulse' 
                          : isCompleted 
                            ? 'w-6 h-6 bg-emerald-500 text-white text-xs flex items-center justify-center' 
                            : 'w-6 h-6 bg-slate-100 border border-slate-200 text-slate-400 text-xs'
                      }`}
                    >
                      {isCompleted ? '✓' : s.number}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                      isActive ? 'text-[#1565D8]' : isCompleted ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Register Your Institution
              </h1>
              <p className="text-slate-500 mt-1 text-xs">
                Create your free school or center profile on Vidhyaan in minutes.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* WARNING CARD FOR SIMILAR SCHOOLS */}
            {showWarning && similarSchool ? (
              <div className="space-y-5 animate-fadeIn">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3 text-xs leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-amber-800 block text-sm">We found a similar institution on file:</span>
                    <div className="bg-white p-3.5 rounded-xl border border-amber-200/60 space-y-1.5 my-2">
                      <span className="font-extrabold text-slate-800 text-sm block">{similarSchool.name}</span>
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {similarSchool.locations[0]?.address}, {similarSchool.locations[0]?.city}
                      </span>
                      {similarSchool.affiliations[0]?.board && (
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          {similarSchool.affiliations[0].board}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-700 block">Is this your institution?</span>
                    <p className="text-slate-500">
                      If this is your institution, claiming it is faster than registering a duplicate listing.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => router.push(`/claim-profile/verify/${similarSchool.id}`)}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-100/50"
                  >
                    <span>Yes, Claim This Institution</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleContinueRegistering}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all cursor-pointer text-center"
                  >
                    No, Continue Registering New Institution
                  </button>
                </div>
              </div>
            ) : step === 1 ? (
              <form onSubmit={handleNext} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {config.nameFieldLabel.toUpperCase()} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Enter school or center name"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] transition-all text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Institution Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl">
                    {['SCHOOL', 'LEARNING_CENTER', 'JUNIOR_COLLEGE', 'COACHING_CENTER'].map((typeVal) => (
                      <button
                        key={typeVal}
                        type="button"
                        onClick={() => setInstitutionType(typeVal)}
                        className={`py-2 px-2 text-xs font-extrabold rounded-xl text-center transition-all cursor-pointer ${
                          institutionType === typeVal
                            ? 'bg-[#1565D8] text-white shadow-md shadow-blue-100/50'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {institutionTypeLabels[typeVal]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      City <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
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

                  {config.showSchoolType && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Board / Curriculum <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
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
                  )}

                  {config.showCenterCategory && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Center Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={centerCategory}
                        onChange={(e) => setCenterCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] transition-all text-sm cursor-pointer bg-white"
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
                </div>

                {config.showSchoolType && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      School Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={schoolType}
                      onChange={(e) => setSchoolType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
                      required
                    >
                      {config.schoolTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {config.teacherLabel} <span className="text-slate-400 font-medium">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={totalTeachers}
                    onChange={(e) => setTotalTeachers(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] transition-all text-sm"
                  />
                </div>

                {config.showMediumOfInstruction && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      MEDIUM OF INSTRUCTION
                    </label>
                    <LanguageTagInput
                      value={mediumOfInstruction ?? []}
                      onChange={(vals) => setMediumOfInstruction(vals)}
                      options={INDIAN_LANGUAGES}
                    />
                  </div>
                )}

                {config.showExamFocus && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      EXAM / COURSE FOCUS <span className="text-slate-400 font-normal ml-1">(optional)</span>
                    </label>
                    <ExamFocusTagInput
                      value={examFocus ?? []}
                      onChange={(vals) => setExamFocus(vals)}
                      options={EXAM_FOCUS_OPTIONS}
                    />
                  </div>
                )}

                {config.showGradesOffered && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Grades Offered
                    </label>
                    {config.gradesLocked ? (
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold">
                        {config.lockedGradeLabel}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">From</span>
                          <select
                            value={gradeFrom}
                            onChange={(e) => setGradeFrom(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] text-xs cursor-pointer"
                          >
                            {grades.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        <span className="text-slate-400 font-bold self-end pb-2 text-xs">to</span>
                        <div className="flex-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">To</span>
                          <select
                            value={gradeTo}
                            onChange={(e) => setGradeTo(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] text-xs cursor-pointer"
                          >
                            {grades.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Year Established
                    </label>
                    <input
                      type="number"
                      value={establishedYear}
                      onChange={(e) => setEstablishedYear(e.target.value)}
                      placeholder="e.g. 2005"
                      className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {config.roleLabel} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select your role</option>
                      <option value="Principal">Principal</option>
                      <option value="Vice Principal">Vice Principal</option>
                      <option value="Administrative Head">Administrative Head</option>
                      <option value="IT Manager">IT Manager</option>
                      <option value="Owner/Management">Owner / Management</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center h-[50px] bg-gradient-to-r from-[#1565D8] to-[#1E88E5] hover:from-[#1150ad] hover:to-[#1565D8] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200/40 hover:shadow-blue-300/50 disabled:shadow-none transition-all select-none cursor-pointer disabled:cursor-not-allowed text-base mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Checking records...
                    </>
                  ) : (
                    <>
                      <span>Next Step</span>
                      <ArrowRight className="w-5 h-5 ml-1.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STEP 2 FORM: Admin Account details */
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] transition-all text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-slate-500 font-semibold select-none text-sm border-r border-slate-200 pr-3">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
                      disabled={loading}
                      className="w-full pl-16 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-[#1565D8] transition-all text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center h-[50px] bg-gradient-to-r from-[#1565D8] to-[#1E88E5] hover:from-[#1150ad] hover:to-[#1565D8] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200/40 hover:shadow-blue-300/50 disabled:shadow-none transition-all select-none cursor-pointer disabled:cursor-not-allowed text-base mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Registering Institution...
                    </>
                  ) : (
                    'Create Account & Verify'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 bg-transparent border-none cursor-pointer mt-1"
                >
                  ← Back to Institution Details
                </button>
              </form>
            )}
          </div>

          {/* Bottom trust strip (mobile) */}
          <div className="flex items-center justify-center gap-2 mt-6 text-[10px] text-slate-400 font-medium lg:hidden">
            <Lock className="w-3 h-3" />
            <span>256-bit encrypted · Verified Partner Profiles</span>
          </div>
        </div>
      </div>
    </main>
  )
}
