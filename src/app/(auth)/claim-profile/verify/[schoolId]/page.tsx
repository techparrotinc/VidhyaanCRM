'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Shield, Mail, Phone, FileText, CheckCircle2, Loader2, Upload, AlertCircle, ArrowRight, MapPin, Building, Award } from 'lucide-react'

interface SchoolContact {
  id: string
  type: 'email' | 'phone' | 'website' | 'other'
  value: string
}

interface SchoolDetails {
  id: string
  name: string
  slug: string
  institutionType: string
  locations: Array<{
    address: string
    city: string
  }>
  contacts: SchoolContact[]
  affiliations: Array<{
    board: string
  }>
}

export default function ClaimVerifyPage() {
  const router = useRouter()
  const params = useParams()
  const schoolId = params.schoolId as string

  const [school, setSchool] = useState<SchoolDetails | null>(null)
  const [loadingSchool, setLoadingSchool] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verification options state
  const [selectedMethod, setSelectedMethod] = useState<'EMAIL' | 'PHONE' | 'DOCUMENT' | null>(null)
  
  // Method states
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  // Phone state
  const [phoneInput, setPhoneInput] = useState('')
  
  // Document state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [documentConfirmed, setDocumentConfirmed] = useState(false)
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Masking helpers
  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@')
    if (!local || !domain) return email
    if (local.length <= 2) return `${local[0]}*@${domain}`
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`
  }

  // Fetch school details
  useEffect(() => {
    if (!schoolId) return

    const fetchSchool = async () => {
      try {
        const res = await fetch(`/api/public/schools/${schoolId}?claim=true`)
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load school details')
        }
        setSchool(data.data)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Failed to fetch school details')
      } finally {
        setLoadingSchool(false)
      }
    }

    fetchSchool()
  }, [schoolId])

  // OTP box auto-focus helper
  useEffect(() => {
    if (otpSent) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 50)
    }
  }, [otpSent])

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.slice(0, 6).split('')
      const newOtp = [...otp]
      pasted.forEach((char, idx) => {
        if (idx < 6) newOtp[idx] = char
      })
      setOtp(newOtp)
      const targetIdx = Math.min(pasted.length, 5)
      otpInputRefs.current[targetIdx]?.focus()
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  // OPTION A: Email OTP send
  const sendEmailOtp = async () => {
    if (!school) return
    setOtpLoading(true)
    setOtpError(null)

    try {
      const res = await fetch('/api/auth/school/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: school.id })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send verification email')
      }

      setOtpSent(true)
    } catch (err: any) {
      console.error(err)
      setOtpError(err.message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  // OPTION B: Phone OTP send
  const sendPhoneOtp = async () => {
    if (!school) return
    
    // Check if phone number is listed in school contacts
    const formattedInput = phoneInput.replace(/\s+/g, '')
    const matches = school.contacts.some(
      c => c.type === 'phone' && c.value.replace(/\s+/g, '') === formattedInput
    )

    if (!matches) {
      setOtpError('Phone number does not match registered school phone number')
      return
    }

    setOtpLoading(true)
    setOtpError(null)

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: phoneInput, purpose: 'SIGNUP' })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP SMS')
      }

      setOtpSent(true)
    } catch (err: any) {
      console.error(err)
      setOtpError(err.message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  // Verify code (handles both EMAIL and PHONE)
  const verifyCode = async () => {
    if (!school || !selectedMethod) return
    const code = otp.join('')
    if (code.length < 6) {
      setOtpError('Please fill in all 6 OTP digits')
      return
    }

    setOtpLoading(true)
    setOtpError(null)

    try {
      const payload: any = {
        schoolId: school.id,
        verificationType: selectedMethod,
        verificationCode: code
      }

      if (selectedMethod === 'PHONE') {
        payload.phone = phoneInput
      }

      const res = await fetch('/api/auth/school/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid or expired code')
      }

      // Success, route to step 3 account creation
      router.push(`/claim-profile/account?schoolId=${school.id}`)
    } catch (err: any) {
      console.error(err)
      setOtpError(err.message || 'Verification failed')
      setOtp(['', '', '', '', '', ''])
      otpInputRefs.current[0]?.focus()
    } finally {
      setOtpLoading(false)
    }
  }

  // OPTION C: Document upload (mock S3 upload)
  const handleDocumentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !school) return

    setUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + 15
      })
    }, 150)

    setTimeout(async () => {
      clearInterval(interval)
      setUploadProgress(100)
      
      const simulatedUrl = `https://vidhyaan-documents.sfo3.digitaloceanspaces.com/claims/${school.id}-${Date.now()}-${file.name}`
      setUploadedUrl(simulatedUrl)
      
      try {
        const res = await fetch('/api/auth/school/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId: school.id,
            verificationType: 'DOCUMENT',
            documentUrl: simulatedUrl
          })
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to submit document claim')
        }
        
        setUploading(false)
        setDocumentConfirmed(true)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Failed to register document claim')
        setUploading(false)
      }
    }, 1500)
  }

  const steps = [
    { number: 1, label: 'Find School' },
    { number: 2, label: 'Verify' },
    { number: 3, label: 'Create Account' },
    { number: 4, label: 'Verify Phone' }
  ]

  if (loadingSchool) {
    return (
      <main className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center font-sans antialiased px-4">
        <Loader2 className="w-10 h-10 text-[#1565D8] animate-spin mb-3" />
        <p className="text-slate-500 font-semibold">Loading school profile...</p>
      </main>
    )
  }

  if (error || !school) {
    return (
      <main className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center font-sans antialiased px-4">
        <div className="max-w-[420px] bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-slate-800">Error Loading School</h2>
          <p className="text-slate-500 mt-2 text-sm">{error || 'The school details could not be found.'}</p>
          <button
            onClick={() => router.push('/claim-profile')}
            className="mt-6 w-full py-3.5 px-4 bg-[#1565D8] text-white font-bold rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </main>
    )
  }

  const schoolEmail = school.contacts.find(c => c.type === 'email')?.value
  const schoolPhone = school.contacts.find(c => c.type === 'phone')?.value
  const schoolAddress = school.locations[0]
  const schoolBoard = school.affiliations[0]?.board

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] font-sans antialiased py-12 px-4">
      <div className="max-w-[720px] mx-auto">
        
        {/* Navigation & Progress */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-full flex items-center justify-between mb-8">
            <button
              onClick={() => {
                if (otpSent || selectedMethod) {
                  setOtpSent(false)
                  setSelectedMethod(null)
                  setOtp(['', '', '', '', '', ''])
                  setOtpError(null)
                } else {
                  router.push('/claim-profile')
                }
              }}
              className="text-sm font-semibold text-slate-500 hover:text-[#1565D8] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>←</span> Back to Search
            </button>
            
            <div className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shadow-sm">
                <Shield className="text-[#1565D8] w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-800 tracking-tight">Vidhyaan</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between max-w-[500px] mx-auto">
              {steps.map((s, idx) => (
                <div key={s.number} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      s.number === 2
                        ? 'bg-[#1565D8] text-white shadow-md shadow-[#1565D8]/20 ring-4 ring-blue-50'
                        : s.number < 2
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {s.number < 2 ? '✓' : s.number}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      s.number === 2 ? 'text-[#1565D8]' : s.number < 2 ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 -mt-5 ${s.number < 2 ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Verify Ownership
            </h1>
            <p className="text-slate-500 mt-2 text-base">
              Prove that you represent this institution.
            </p>
          </div>
        </div>

        {/* School Preview Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 mb-6">
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Selected Institution
          </span>
          <h2 className="text-2xl font-extrabold text-slate-800 mt-3">{school.name}</h2>
          
          <div className="flex flex-col gap-2 text-slate-500 text-sm mt-3 border-t border-slate-100 pt-3">
            {schoolAddress && (
              <div className="flex items-start gap-1.5">
                <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                <span>{schoolAddress.address}, {schoolAddress.city}</span>
              </div>
            )}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="capitalize">{school.institutionType.toLowerCase().replace('_', ' ')}</span>
              </div>
              {schoolBoard && (
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{schoolBoard}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ownership Verification Options Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
          
          {/* Confirmation panel for Option C (Document Claim Complete) */}
          {documentConfirmed ? (
            <div className="text-center py-8 space-y-6 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="text-emerald-500 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-800">Request Received</h3>
                <p className="text-slate-500 text-base max-w-[480px] mx-auto">
                  Our operations team will verify your uploaded documents within 24–48 hours and activate your dashboard.
                </p>
              </div>
              <button
                onClick={() => router.push(`/claim-profile/account?schoolId=${school.id}`)}
                className="mx-auto px-6 py-3.5 bg-[#1565D8] hover:bg-[#1150ad] text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Setup Profile</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : otpSent ? (
            /* OTP Code Verification Form */
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1 text-center">
                <h3 className="text-2xl font-bold text-slate-800">Enter Verification Code</h3>
                <p className="text-sm text-slate-500">
                  We've sent a 6-digit code to{' '}
                  <span className="font-bold text-slate-800">
                    {selectedMethod === 'EMAIL' && schoolEmail ? maskEmail(schoolEmail) : phoneInput}
                  </span>
                </p>
              </div>

              {otpError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600">
                  {otpError}
                </div>
              )}

              <div className="flex items-center justify-center gap-2.5 max-w-[360px] mx-auto py-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el }}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    maxLength={6} // support pasting
                    className="w-12 h-14 bg-slate-50 border border-slate-200 rounded-xl text-center font-extrabold text-slate-800 text-xl focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all"
                  />
                ))}
              </div>

              <div className="space-y-3 max-w-[360px] mx-auto">
                <button
                  onClick={verifyCode}
                  disabled={otpLoading || otp.join('').length < 6}
                  className="w-full py-3.5 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed select-none text-base"
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify OTP Code</span>
                  )}
                </button>

                <button
                  onClick={() => {
                    if (selectedMethod === 'EMAIL') sendEmailOtp()
                    else sendPhoneOtp()
                  }}
                  disabled={otpLoading}
                  className="w-full text-center text-sm font-semibold text-[#1565D8] hover:underline bg-transparent border-none cursor-pointer"
                >
                  Resend OTP Code
                </button>
              </div>
            </div>
          ) : (
            /* Option Selector Grid */
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Select a verification method:
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* OPTION A: Email OTP */}
                {schoolEmail ? (
                  <button
                    onClick={() => setSelectedMethod('EMAIL')}
                    className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                      selectedMethod === 'EMAIL'
                        ? 'border-[#1565D8] bg-blue-50/20 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="text-[#1565D8] w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-bold text-slate-800 text-base">Send Code to Registered Email</div>
                      <div className="text-slate-500 text-sm">
                        Verification code will be sent to the school contact: {maskEmail(schoolEmail)}
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 opacity-60 flex items-start gap-4 select-none">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="text-slate-400 w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-bold text-slate-400 text-base">Email Verification (Unavailable)</div>
                      <div className="text-slate-400 text-sm">
                        No contact email exists on file for this school.
                      </div>
                    </div>
                  </div>
                )}

                {/* OPTION B: Phone OTP */}
                {schoolPhone ? (
                  <button
                    onClick={() => setSelectedMethod('PHONE')}
                    className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                      selectedMethod === 'PHONE'
                        ? 'border-[#1565D8] bg-blue-50/20 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="text-emerald-600 w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-bold text-slate-800 text-base">Verify via Phone Call / SMS</div>
                      <div className="text-slate-500 text-sm">
                        Verify using the registered admin phone number.
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 opacity-60 flex items-start gap-4 select-none">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="text-slate-400 w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-bold text-slate-400 text-base">Phone Verification (Unavailable)</div>
                      <div className="text-slate-400 text-sm">
                        No registered phone number exists on file for this school.
                      </div>
                    </div>
                  </div>
                )}

                {/* OPTION C: Document Upload */}
                <button
                  onClick={() => setSelectedMethod('DOCUMENT')}
                  className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                    selectedMethod === 'DOCUMENT'
                      ? 'border-[#1565D8] bg-blue-50/20 shadow-sm'
                      : 'border-slate-100 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="text-amber-600 w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-bold text-slate-800 text-base">Upload Official Document</div>
                    <div className="text-slate-500 text-sm">
                      Upload school registration certificate, affiliation letter, or GST certificate. Verified in 24-48 hours.
                    </div>
                  </div>
                </button>
              </div>

              {/* Interactive forms depending on selected option */}
              {selectedMethod && (
                <div className="border-t border-slate-100 pt-6 mt-6 animate-slideDown">
                  {selectedMethod === 'EMAIL' && (
                    <div className="space-y-4 max-w-[400px]">
                      <h4 className="font-bold text-slate-800">Email Verification</h4>
                      <p className="text-sm text-slate-500">
                        Click below to receive a 6-digit confirmation code at the school email.
                      </p>
                      <button
                        onClick={sendEmailOtp}
                        disabled={otpLoading}
                        className="py-3 px-6 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-sm"
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Sending Code...</span>
                          </>
                        ) : (
                          'Send Verification Code'
                        )}
                      </button>
                    </div>
                  )}

                  {selectedMethod === 'PHONE' && (
                    <div className="space-y-4 max-w-[400px]">
                      <h4 className="font-bold text-slate-800">Phone Verification</h4>
                      <p className="text-sm text-slate-500">
                        Enter the registered school admin phone number to receive an SMS OTP.
                      </p>
                      {otpError && (
                        <div className="p-3 bg-red-50 border border-red-100 text-xs font-semibold text-red-600 rounded-xl">
                          {otpError}
                        </div>
                      )}
                      <div className="space-y-3">
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                          maxLength={10}
                          placeholder="Enter school phone number"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-sm"
                        />
                        <button
                          onClick={sendPhoneOtp}
                          disabled={otpLoading || phoneInput.length < 10}
                          className="py-3 px-6 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-sm"
                        >
                          {otpLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Sending OTP...</span>
                            </>
                          ) : (
                            'Send OTP'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'DOCUMENT' && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800">Document Upload</h4>
                      <p className="text-sm text-slate-500">
                        Please upload one of the following: School registration certificate, Affiliation letter, or GST certificate.
                      </p>

                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all relative">
                        {uploading ? (
                          <div className="space-y-3">
                            <Loader2 className="w-8 h-8 text-[#1565D8] animate-spin mx-auto" />
                            <div className="max-w-[200px] mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#1565D8] h-1.5 transition-all duration-150"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-600">Uploading to Spaces... {uploadProgress}%</span>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center gap-2.5 cursor-pointer">
                            <Upload className="w-10 h-10 text-slate-400" />
                            <span className="text-sm font-bold text-slate-700">Select file to upload</span>
                            <span className="text-slate-400 text-xs">PDF, JPG, PNG (Max 5MB)</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleDocumentSelect}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
