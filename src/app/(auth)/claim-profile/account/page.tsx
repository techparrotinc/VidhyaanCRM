'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, User, Phone, Mail, Award, AlertCircle } from 'lucide-react'

export default function ClaimAccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const schoolId = searchParams.get('schoolId')
  const verifiedPhone = searchParams.get('phone') || ''
  const verifiedEmail = searchParams.get('email') || ''

  const [name, setName] = useState('')
  const [phone, setPhone] = useState(verifiedPhone)
  const [email, setEmail] = useState(verifiedEmail)
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-populate using details fetch if query parameters are missing
  useEffect(() => {
    if (!schoolId || (verifiedPhone && verifiedEmail)) return

    const fetchSchoolDetails = async () => {
      try {
        const res = await fetch(`/api/public/schools/${schoolId}`)
        const data = await res.json()
        if (res.ok && data.success && data.data) {
          const emailContact = data.data.contacts?.find((c: any) => c.type === 'email')?.value || ''
          const phoneContact = data.data.contacts?.find((c: any) => c.type === 'phone')?.value || ''
          
          if (emailContact && !email) setEmail(emailContact)
          if (phoneContact && !phone) {
            let cleanedPhone = phoneContact.replace(/\D/g, '')
            if (cleanedPhone.length > 10 && cleanedPhone.startsWith('91')) {
              cleanedPhone = cleanedPhone.slice(2)
            } else if (cleanedPhone.length > 10 && cleanedPhone.startsWith('0')) {
              cleanedPhone = cleanedPhone.slice(1)
            }
            setPhone(cleanedPhone.slice(0, 10))
          }
        }
      } catch (err) {
        console.error('Failed to pre-populate contacts:', err)
      }
    }
    fetchSchoolDetails()
  }, [schoolId, verifiedPhone, verifiedEmail])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    setPhone(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || !phone || !email || !role) {
      setError('Please fill in all fields')
      return
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number starting with 6-9')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/school/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          role,
          schoolId: schoolId || null
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create admin account')
      }

      // Store phone number in sessionStorage for Step 4
      sessionStorage.setItem('claim_register_phone', phone)

      router.push('/claim-profile/verify-phone')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, label: 'Find Institution' },
    { number: 2, label: 'Verify' },
    { number: 3, label: 'Create Account' },
    { number: 4, label: 'Verify Phone' }
  ]

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] font-sans antialiased py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-[500px]">
        
        {/* Logo and Progress Bar */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 select-none mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vidhyaan-logo.svg" alt="Vidhyaan" className="h-7 w-auto" />
          </div>

          <div className="w-full bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between max-w-[360px] mx-auto">
              {steps.map((s, idx) => (
                <div key={s.number} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      s.number === 3
                        ? 'bg-[#1565D8] text-white shadow-md shadow-[#1565D8]/20 ring-4 ring-blue-50'
                        : s.number < 3
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {s.number < 3 ? '✓' : s.number}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                      s.number === 3 ? 'text-[#1565D8]' : s.number < 3 ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                      {s.label.split(' ')[0]}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 -mt-4 ${s.number < 3 ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Create Your Admin Account
            </h1>
            <p className="text-slate-500 mt-2 text-sm max-w-[400px]">
              This will be the primary account for managing your school or learning center on Vidhyaan.
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-4 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Phone Number
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
                  className="w-full pl-16 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Role at School
              </label>
              <div className="relative flex items-center">
                <Award className="absolute left-4 text-slate-400 w-5 h-5 pointer-events-none" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm appearance-none cursor-pointer"
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
              className="w-full flex items-center justify-center py-3.5 px-4 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-xl shadow-md shadow-[#1565D8]/10 hover:shadow-lg hover:shadow-[#1565D8]/25 transition-all cursor-pointer disabled:cursor-not-allowed select-none text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account & Verify Phone'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
