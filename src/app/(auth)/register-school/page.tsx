'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Loader2, AlertCircle, ArrowRight, MapPin, Building, Award, CheckCircle2 } from 'lucide-react'

interface SimilarSchool {
  id: string
  name: string
  slug: string
  institutionType: string
  locations: Array<{ address: string; city: string }>
  affiliations: Array<{ board: string }>
}

export default function RegisterSchoolPage() {
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

    if (!schoolName || !institutionType || !city || !board || !role) {
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
        // No similar school, proceed directly to Step 2
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
          board,
          establishedYear: establishedYear ? parseInt(establishedYear) : null
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
    { number: 1, label: 'School Details' },
    { number: 2, label: 'Admin Account' }
  ]

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] font-sans antialiased py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-[500px]">
        
        {/* Logo and Progress Indicator */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 select-none mb-6">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="text-[#1565D8] w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">Vidhyaan</span>
          </div>

          {/* Simple 2-Step Progress Bar */}
          <div className="w-full bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between max-w-[280px] mx-auto">
              {progressSteps.map((s, idx) => (
                <div key={s.number} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      s.number === step
                        ? 'bg-[#1565D8] text-white shadow-md shadow-[#1565D8]/20 ring-4 ring-blue-50'
                        : s.number < step
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {s.number < step ? '✓' : s.number}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                      s.number === step ? 'text-[#1565D8]' : s.number < step ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < progressSteps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-4 -mt-5 ${s.number < step ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Register Your School
            </h1>
            <p className="text-slate-500 mt-2 text-sm max-w-[400px]">
              Create your free profile on Vidhyaan in minutes.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* WARNING MODAL/CARD FOR SIMILAR SCHOOLS */}
          {showWarning && similarSchool ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 text-xs leading-relaxed">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-800 block text-sm">We found a similar school on file:</span>
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
                  <span className="font-bold text-slate-700 block">Is this your school?</span>
                  <p className="text-slate-500">
                    If this is your school, claiming it is faster than registering a duplicate listing.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push(`/claim-profile/verify/${similarSchool.id}`)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Yes, Claim This School</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleContinueRegistering}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all cursor-pointer text-center"
                >
                  No, Continue Registering New School
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1 FORM: School Details */
            <form onSubmit={handleNext} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  School / Center Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Enter school or center name"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Institution Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl">
                  {['SCHOOL', 'LEARNING_CENTER'].map((typeVal) => (
                    <button
                      key={typeVal}
                      type="button"
                      onClick={() => setInstitutionType(typeVal)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl text-center transition-all cursor-pointer ${
                        institutionType === typeVal
                          ? 'bg-[#1565D8] text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {typeVal === 'SCHOOL' ? 'School' : 'Learning Center'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
                    required
                  >
                    <option value="Chennai">Chennai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                    <option value="Kolkata">Kolkata</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Board / Curriculum <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
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
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Year Established
                </label>
                <input
                  type="number"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(e.target.value)}
                  placeholder="e.g. 2005"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Your Role at School <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm cursor-pointer"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 px-4 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed select-none text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking records...
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2 FORM: Admin Account details */
            <form onSubmit={handleCreateAccount} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
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
                    className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 px-4 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed select-none text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering School...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 bg-transparent border-none cursor-pointer"
              >
                ← Back to School Details
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
