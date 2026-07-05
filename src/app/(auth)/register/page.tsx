'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Loader2, ArrowLeft, CheckCircle2, Lock, AlertCircle } from 'lucide-react'
import { signIn } from 'next-auth/react'
import PinInput from '@/components/ui/PinInput'

type Step = 1 | 2 | 3 | 4

export default function RegisterPage() {
  const router = useRouter()

  // General wizard state
  const [step, setStep] = useState<Step>(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Step 1: Phone
  const [phone, setPhone] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  const [otp, setOtp] = useState<string[]>(['', '', '', ''])
  const [otpError, setOtpError] = useState(false)
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState<number | null>(null)
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(600) // 10 minutes countdown
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Step 3: Account Details
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [role, setRole] = useState('')
  const [institutionType, setInstitutionType] = useState<'SCHOOL' | 'LEARNING_CENTER'>('SCHOOL')

  // Step 4: Set PIN
  const [firstPin, setFirstPin] = useState('')
  const [confirmPinKey, setConfirmPinKey] = useState(0)
  const [pinSuccess, setPinSuccess] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [pinMsg, setPinMsg] = useState<string | null>(null)
  const [showSkipMsg, setShowSkipMsg] = useState(false)

  // Timer countdown for Step 2
  useEffect(() => {
    if (step !== 2) return
    const timer = setInterval(() => {
      setOtpSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

  // Focus managers
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    }
  }, [step])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // --- STEP 1 HANDLERS ---
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length < 10 || !agreeTerms) return

    setApiError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: phone, purpose: 'SIGNUP' })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setApiError(data.error || 'Failed to send OTP')
        return
      }

      setOtpSecondsLeft(data.expiresIn || 600)
      setStep(2)
    } catch (err) {
      console.error(err)
      setApiError('Network error. Check connection.')
    } finally {
      setLoading(false)
    }
  }

  // --- STEP 2 HANDLERS ---
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (digit && index < 3) {
      otpRefs.current[index + 1]?.focus()
    }

    // Check if fully filled
    const otpCode = newOtp.join('')
    if (otpCode.length === 4) {
      triggerOtpVerify(otpCode)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp]
      if (otp[index]) {
        newOtp[index] = ''
        setOtp(newOtp)
      } else if (index > 0) {
        newOtp[index - 1] = ''
        setOtp(newOtp)
        otpRefs.current[index - 1]?.focus()
      }
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (!pastedData) return

    const newOtp = [...otp]
    for (let j = 0; j < 4; j++) {
      if (j < pastedData.length) {
        newOtp[j] = pastedData[j]
      }
    }
    setOtp(newOtp)

    if (pastedData.length === 4) {
      triggerOtpVerify(pastedData)
    } else {
      const focusIndex = Math.min(pastedData.length, 3)
      otpRefs.current[focusIndex]?.focus()
    }
  }

  const triggerOtpVerify = async (code: string) => {
    setLoading(true)
    setApiError(null)
    setOtpError(false)

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: phone, code })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setOtpError(true)
        setOtp(['', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
        
        if (data.attemptsLeft !== undefined) {
          setOtpAttemptsLeft(data.attemptsLeft)
          setApiError(`Incorrect OTP. ${data.attemptsLeft} attempts remaining.`)
        } else {
          setApiError(data.message || 'OTP verification failed.')
        }
        return
      }

      setStep(3)
    } catch (err) {
      console.error(err)
      setApiError('Verification failed. Check connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (otpSecondsLeft > 0) return
    setApiError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: phone, purpose: 'SIGNUP' })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setApiError(data.error || 'Failed to resend OTP')
        return
      }

      setOtpSecondsLeft(data.expiresIn || 600)
      setOtp(['', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } catch (err) {
      console.error(err)
      setApiError('Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  // --- STEP 3 HANDLERS ---
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !schoolName || !role) return

    setApiError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/school/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          schoolName,
          role,
          institutionType
        })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setApiError(data.error || 'Failed to create account')
        return
      }

      setUserId(data.userId)

      // Authenticate NextAuth session immediately using token
      const authRes = await signIn('credentials', {
        token: data.token,
        redirect: false
      })

      if (authRes?.error) {
        setApiError('Session creation failed. Please retry.')
        return
      }

      setStep(4)
    } catch (err) {
      console.error(err)
      setApiError('Failed to register school.')
    } finally {
      setLoading(false)
    }
  }

  // --- STEP 4 HANDLERS ---
  const handleConfirmPinComplete = async (confirmPin: string) => {
    if (confirmPin !== firstPin) {
      setPinError(true)
      setPinMsg("PINs don't match. Please try again.")
      
      // Wait for shake animation, then reset only confirm pin input
      setTimeout(() => {
        setPinError(false)
        setConfirmPinKey(prev => prev + 1)
      }, 1000)
      return
    }

    // Success
    setPinSuccess(true)
    setPinError(false)
    setPinMsg(null)

    try {
      const res = await fetch('/api/auth/pin/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: firstPin, confirmPin })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setPinSuccess(false)
        setPinError(true)
        setPinMsg(data.error || 'Failed to save PIN')
        return
      }

      // Success redirect
      setTimeout(() => {
        router.push('/onboarding')
      }, 1500)

    } catch (err) {
      console.error(err)
      setPinSuccess(false)
      setPinError(true)
      setPinMsg('Failed to save PIN. Connection error.')
    }
  }

  const handleSkipPin = () => {
    setShowSkipMsg(true)
    setTimeout(() => {
      router.push('/onboarding')
    }, 1500)
  }

  // Step Indicators
  const steps = [1, 2, 3, 4]

  return (
    <main className="min-h-screen w-full flex font-sans antialiased">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 0.8; }
          70% { transform: scale(0.9); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
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
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#60A5FA] animate-gradient">
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
            <span className="text-xl font-extrabold text-white tracking-tight animate-pulse">Vidhyaan for Partners</span>
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
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] px-5 py-8 lg:px-12">
        <div className="w-full max-w-[440px] animate-fade-slide-up">
          
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
          <div className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-8 lg:p-10">
            
            {/* Animated Progress Dots */}
            <div className="relative flex items-center justify-between w-full max-w-[240px] mx-auto mb-8">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-100 rounded-full z-0" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#1565D8] rounded-full transition-all duration-500 z-0" 
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
              {steps.map((s) => {
                const isCompleted = s < step
                const isActive = s === step
                return (
                  <div 
                    key={s} 
                    className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'w-6 h-6 bg-[#1565D8] ring-4 ring-blue-100 text-white font-bold text-xs animate-pulse' 
                        : isCompleted 
                          ? 'w-4 h-4 bg-[#1565D8] text-white flex items-center justify-center' 
                          : 'w-4 h-4 bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isActive ? (
                      s
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* API and Generic Errors */}
            {apiError && step !== 2 && step !== 4 && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {/* STEP 1: PHONE */}
            {step === 1 && (
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    Get Started
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    Enter your mobile number to create your school account
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative flex items-center h-[54px] border-2 border-slate-200 rounded-2xl bg-slate-50/50 focus-within:border-[#1565D8] focus-within:ring-4 focus-within:ring-blue-50/60 focus-within:bg-white transition-all">
                    <div className="pl-4 pr-3 text-base font-bold text-slate-500 border-r border-slate-200 h-full flex items-center select-none">
                      +91
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="Enter 10-digit number"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-full px-3.5 text-base font-sans text-slate-800 font-semibold placeholder-slate-400 bg-transparent outline-none border-none focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-[#1565D8] focus:ring-[#1565D8]"
                  />
                  <span className="text-xs text-slate-500 leading-normal">
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#1565D8] font-bold hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#1565D8] font-bold hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading || phone.length < 10 || !agreeTerms}
                  className="w-full flex items-center justify-center h-[52px] bg-gradient-to-r from-[#1565D8] to-[#1E88E5] hover:from-[#1150ad] hover:to-[#1565D8] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200/40 hover:shadow-blue-300/50 disabled:shadow-none transition-all select-none cursor-pointer disabled:cursor-not-allowed text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP →'
                  )}
                </button>

                <div className="text-center text-xs text-slate-500 mt-2 font-medium">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#1565D8] font-bold hover:underline">
                    Login
                  </Link>
                </div>
              </form>
            )}

            {/* STEP 2: VERIFY OTP */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    Verify Your Number
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    We sent a 6-digit code to{' '}
                    <span className="font-semibold text-slate-700">
                      +91 {phone.slice(0, 2)}XXXXXX{phone.slice(-2)}
                    </span>
                  </p>
                </div>

                {apiError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{apiError}</span>
                  </div>
                )}

                {/* 6 Digit Box Container */}
                <div className="relative">
                  {loading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20 rounded-xl">
                      <Loader2 className="w-6 h-6 text-[#1565D8] animate-spin" />
                    </div>
                  )}
                  
                  <div className={`flex justify-between gap-2 ${otpError ? 'animate-shake' : ''}`}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        disabled={loading}
                        className="w-14 h-14 text-center text-xl font-extrabold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#1565D8] focus:ring-4 focus:ring-blue-50/60 focus:bg-white transition-all text-slate-800 disabled:opacity-50"
                      />
                    ))}
                  </div>
                </div>

                {/* Timer / Resend Links */}
                <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                  <span>
                    Resend OTP in:{' '}
                    <span className={otpSecondsLeft < 60 ? 'text-red-500 font-semibold' : 'text-slate-600'}>
                      {formatTime(otpSecondsLeft)}
                    </span>
                  </span>
                  
                  {otpSecondsLeft === 0 ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-[#1565D8] font-bold hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  ) : null}
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1)
                      setPhone('')
                      setOtp(['', '', '', ''])
                      setApiError(null)
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change Number
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DETAILS */}
            {step === 3 && (
              <form onSubmit={handleDetailsSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    Tell us about yourself
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    Help us set up your school account
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Principal or Admin name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-[50px] px-4 border-2 border-slate-200 rounded-2xl font-semibold bg-slate-50/50 focus-within:border-[#1565D8] focus-within:ring-4 focus-within:ring-blue-50/60 focus-within:bg-white transition-all text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="your@school.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-[50px] px-4 border-2 border-slate-200 rounded-2xl font-semibold bg-slate-50/50 focus-within:border-[#1565D8] focus-within:ring-4 focus-within:ring-blue-50/60 focus-within:bg-white transition-all text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      School / Center Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your school name"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full h-[50px] px-4 border-2 border-slate-200 rounded-2xl font-semibold bg-slate-50/50 focus-within:border-[#1565D8] focus-within:ring-4 focus-within:ring-blue-50/60 focus-within:bg-white transition-all text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Your Role
                    </label>
                    <select
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-[50px] px-4 border-2 border-slate-200 rounded-2xl font-semibold bg-white focus-within:border-[#1565D8] focus-within:ring-4 focus-within:ring-blue-50/60 transition-all text-slate-800 cursor-pointer"
                    >
                      <option value="" disabled>Select your designation</option>
                      <option value="Principal">Principal</option>
                      <option value="Vice Principal">Vice Principal</option>
                      <option value="Administrative Head">Administrative Head</option>
                      <option value="IT Manager">IT Manager</option>
                      <option value="Owner / Management">Owner / Management</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Institution Type cards */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Institution Type
                    </label>
                    <div className="grid grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setInstitutionType('SCHOOL')}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                          institutionType === 'SCHOOL'
                            ? 'border-[#1565D8] bg-blue-50/50 text-[#1565D8] shadow-md shadow-blue-100/50'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-3xl mb-1 select-none">🏫</span>
                        <span className="font-extrabold text-sm block">School</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block leading-normal">
                          CBSE, ICSE, State Board etc.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInstitutionType('LEARNING_CENTER')}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                          institutionType === 'LEARNING_CENTER'
                            ? 'border-[#1565D8] bg-blue-50/50 text-[#1565D8] shadow-md shadow-blue-100/50'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-3xl mb-1 select-none">🎨</span>
                        <span className="font-extrabold text-sm block">Center</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block leading-normal">
                          Coaching, Arts, Music etc.
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !fullName || !email || !schoolName || !role}
                  className="w-full flex items-center justify-center h-[52px] bg-gradient-to-r from-[#1565D8] to-[#1E88E5] hover:from-[#1150ad] hover:to-[#1565D8] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200/40 hover:shadow-blue-300/50 disabled:shadow-none transition-all select-none cursor-pointer disabled:cursor-not-allowed text-base mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Setting up account...
                    </>
                  ) : (
                    'Continue →'
                  )}
                </button>
              </form>
            )}

            {/* STEP 4: SET PIN */}
            {step === 4 && (
              <div className="space-y-6">
                {pinSuccess ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-bounce-in">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-[#16A34A] tracking-tight text-center">
                      PIN Set Successfully!
                    </h2>
                    <p className="text-sm text-slate-500 text-center">
                      Redirecting to onboarding...
                    </p>
                  </div>
                ) : showSkipMsg ? (
                  <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-bounce-in">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 animate-pulse">
                      <Lock className="w-8 h-8 text-[#1565D8]" />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight text-center px-4">
                      Skipping PIN Setup
                    </h2>
                    <p className="text-xs text-slate-500 text-center leading-normal px-2">
                      You can set your PIN later from your account settings
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                        Set Your Login PIN
                      </h2>
                      <p className="text-sm text-slate-500">
                        You will use this 4-digit PIN to login quickly every day
                      </p>
                    </div>

                    {/* Secure info card */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 text-left">
                      <span className="text-xs font-bold text-blue-900 block mb-0.5">
                        🔒 Your PIN is secure
                      </span>
                      <span className="text-[11px] text-slate-500 leading-normal block">
                        We use bank-grade encryption. Never share your PIN with anyone.
                      </span>
                    </div>

                    {pinMsg && (
                      <div className={`p-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5 ${
                        pinError 
                          ? 'bg-red-50 border border-red-100 text-red-600' 
                          : 'bg-green-50 border border-green-100 text-green-600'
                      }`}>
                        <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${pinError ? 'text-red-500' : 'text-green-500'}`} />
                        <span>{pinMsg}</span>
                      </div>
                    )}

                    {/* First PIN Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                        Enter PIN
                      </label>
                      <PinInput
                        length={4}
                        onComplete={(val) => setFirstPin(val)}
                        error={pinError}
                        success={pinSuccess}
                        disabled={pinSuccess}
                        autoFocus={true}
                      />
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Avoid easy patterns like 1234, 0000, or repeating digits
                      </p>
                    </div>

                    {/* Confirm PIN Input (shows only when first completed) */}
                    {firstPin.length === 4 && (
                      <div className="space-y-2 pt-2 border-t border-slate-55 animate-fadeIn">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                          Confirm PIN
                        </label>
                        <PinInput
                          key={confirmPinKey}
                          length={4}
                          onComplete={handleConfirmPinComplete}
                          error={pinError}
                          success={pinSuccess}
                          disabled={pinSuccess}
                          autoFocus={true}
                        />
                      </div>
                    )}

                    {/* Skip PIN Option */}
                    <div className="text-center pt-2 select-none">
                      <button
                        type="button"
                        onClick={handleSkipPin}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Set up PIN later
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Bottom trust strip (mobile) */}
          <div className="flex items-center justify-center gap-2 mt-6 text-[10px] text-slate-400 font-medium lg:hidden">
            <Lock className="w-3 h-3" />
            <span>256-bit encrypted · Secure login</span>
          </div>
        </div>
      </div>
    </main>
  )
}
