'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Shield, Loader2, ArrowLeft, CheckCircle2, Lock, AlertCircle, Users, Building2 } from 'lucide-react'
import { signIn } from 'next-auth/react'
import PinInput from '@/components/ui/PinInput'
import { institutionNoun } from '@/lib/institution'

type LoginState = 'phone' | 'workspace' | 'pin' | 'otp' | 'twofa'

type RoleAssignment = {
  id: string
  role: string
  orgName: string | null
  institutionType: string | null
}

const roleLabel = (role: string, institutionType?: string | null) => {
  if (role === 'PARENT') return 'Parent'
  if (['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role)) return 'Platform Admin'
  return `${institutionNoun(institutionType)} Admin`
}

export default function LoginPage() {
  // General state
  const [state, setState] = useState<LoginState>('phone')
  const [phone, setPhone] = useState('')
  const [userName, setUserName] = useState('')
  const [hasPin, setHasPin] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [institutionType, setInstitutionType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Multi-role workspace selection (parent AND org roles on one number)
  const [assignments, setAssignments] = useState<RoleAssignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<RoleAssignment | null>(null)

  // Account check helpers
  const [accountExists, setAccountExists] = useState(true)

  // Step 2: PIN Login
  const [pinKey, setPinKey] = useState(0)
  const [pinError, setPinError] = useState(false)
  const [pinSuccess, setPinSuccess] = useState(false)
  const [pinAttemptsLeft, setPinAttemptsLeft] = useState<number | null>(null)
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0)

  // Step 3: OTP Fallback Login
  const [otp, setOtp] = useState<string[]>(['', '', '', ''])
  const [otpError, setOtpError] = useState(false)
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(600) // 10 mins expiry
  const [resendCooldown, setResendCooldown] = useState(30) // 30s resend cooldown
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Step 4: Second factor (2FA) challenge
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [twofaMethod, setTwofaMethod] = useState<'TOTP' | 'SMS' | null>(null)
  const [twofaMaskedPhone, setTwofaMaskedPhone] = useState<string | undefined>(undefined)
  const [twofaCode, setTwofaCode] = useState('')
  const [twofaError, setTwofaError] = useState<string | null>(null)

  // Inline PIN Setup (For no-pin users after OTP verify)
  const [showInlinePinSetup, setShowInlinePinSetup] = useState(false)
  const [setupPin, setSetupPin] = useState('')
  const [setupPinKey, setSetupPinKey] = useState(0)
  const [setupPinError, setSetupPinError] = useState(false)
  const [setupPinSuccess, setSetupPinSuccess] = useState(false)

  // Timers for OTP and PIN lockouts
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (state === 'otp') {
      interval = setInterval(() => {
        setOtpSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1))
        setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [state])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (lockSecondsLeft > 0) {
      interval = setInterval(() => {
        setLockSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [lockSecondsLeft])

  // Focus managers
  useEffect(() => {
    if (state === 'otp' && !showInlinePinSetup) {
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    }
  }, [state, showInlinePinSetup])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const maskPhone = (num: string) => {
    if (num.length < 10) return num
    return `${num.slice(0, 2)}XXXXXX${num.slice(-2)}`
  }

  const handleRoleRedirect = (roleStr: string) => {
    // A chosen workspace wins over the pre-detected role
    const effectiveRole = selectedAssignment?.role ?? roleStr
    if (effectiveRole === 'PARENT') {
      window.location.href = '/parent/dashboard'
    } else if (['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(effectiveRole)) {
      window.location.href = '/admin'
    } else {
      window.location.href = '/dashboard'
    }
  }

  // Runs the primary-factor gate, then either finalizes the session (no 2FA)
  // or transitions to the second-factor step. `primary` carries whichever
  // primary credential was just verified. Returns true on full success.
  const runChallenge = async (
    primary: { phone?: string; pin?: string; contact?: string; code?: string }
  ): Promise<'done' | '2fa' | 'error'> => {
    const res = await fetch('/api/auth/2fa/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...primary,
        ...(selectedAssignment ? { assignmentId: selectedAssignment.id } : {})
      })
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      setApiError(data.message || 'Verification failed.')
      return 'error'
    }

    if (!data.requires2fa) {
      const ok = await finalizeSignIn(data.challengeToken)
      return ok ? 'done' : 'error'
    }

    // Second factor required — hand off to the 2FA step.
    setChallengeToken(data.challengeToken)
    setTwofaMethod(data.method)
    setTwofaMaskedPhone(data.maskedPhone)
    setTwofaCode('')
    setTwofaError(null)
    setState('twofa')
    return '2fa'
  }

  // The single session-minting call. Uses the challenge token (+ optional
  // second factor); NextAuth issues a JWT only when both factors pass.
  const finalizeSignIn = async (token: string, secondFactor?: string): Promise<boolean> => {
    const authRes = await signIn('credentials', {
      challengeToken: token,
      ...(secondFactor ? { secondFactor } : {}),
      redirect: false
    })
    if (authRes?.error) return false
    return true
  }

  const handleTwofaSubmit = async () => {
    if (!challengeToken || twofaCode.trim().length < 4) return
    setLoading(true)
    setTwofaError(null)
    try {
      const ok = await finalizeSignIn(challengeToken, twofaCode.trim())
      if (!ok) {
        setTwofaError('Incorrect or expired code. Try again.')
        setTwofaCode('')
        return
      }
      handleRoleRedirect(selectedAssignment?.role ?? userRole)
    } catch (err) {
      console.error(err)
      setTwofaError('Verification failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // After phone check (and workspace choice, when needed): PIN or auto-OTP
  const proceedToCredentials = async (pinAvailable: boolean) => {
    if (pinAvailable) {
      setState('pin')
      setPinKey(prev => prev + 1)
    } else {
      await triggerSendOtp()
      setState('otp')
    }
  }

  // --- STATE 1: PHONE SUBMIT ---
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length < 10) return

    setApiError(null)
    setLoading(true)
    setAccountExists(true)

    try {
      const res = await fetch(`/api/auth/check-phone?phone=${phone}`)
      const data = await res.json()

      if (!res.ok) {
        setApiError(data.message || 'Error checking phone number')
        return
      }

      if (!data.exists) {
        setAccountExists(false)
        setApiError('No account found with this number.')
        return
      }

      setUserName(data.name || 'User')
      setUserRole(data.role || '')
      setInstitutionType(data.institutionType ?? null)
      setHasPin(data.hasPin)

      const roleAssignments: RoleAssignment[] = data.assignments ?? []
      setAssignments(roleAssignments)
      setSelectedAssignment(null)

      if (roleAssignments.length > 1) {
        // Multiple workspaces on one number — user must pick BEFORE the
        // signIn call (OTP codes are single-use, no retry after error).
        setState('workspace')
      } else {
        await proceedToCredentials(data.hasPin)
      }

    } catch (err) {
      console.error(err)
      setApiError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const triggerSendOtp = async () => {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: phone, purpose: 'LOGIN' })
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to send OTP')
    }
    setOtpSecondsLeft(data.expiresIn || 600)
    setResendCooldown(30)
    setOtp(['', '', '', ''])
  }

  // --- STATE 2: PIN LOGIN ---
  const handlePinSubmit = async (pin: string) => {
    setLoading(true)
    setApiError(null)
    setPinError(false)

    try {
      // 1. Verify credentials via verify API first to check for locks/errors
      const res = await fetch('/api/auth/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setPinError(true)
        setPinKey((prev) => prev + 1)
        
        if (data.error === 'PIN_LOCKED') {
          setLockSecondsLeft(data.retryAfter || 900)
          setApiError('Account locked due to multiple wrong attempts.')
        } else if (data.error === 'INVALID_PIN') {
          setPinAttemptsLeft(data.attemptsLeft)
          setApiError(`Wrong PIN. ${data.attemptsLeft} attempts remaining.`)
        } else if (data.error === 'PIN_NOT_SET') {
          // Send OTP automatically and go to OTP
          await triggerSendOtp()
          setState('otp')
        } else {
          setApiError(data.message || 'Incorrect PIN')
        }
        return
      }

      setPinSuccess(true)

      // 2. Primary factor verified — run the 2FA gate, then finalize.
      const outcome = await runChallenge({ phone, pin })
      if (outcome === 'error') {
        setPinSuccess(false)
        setPinKey((prev) => prev + 1)
        setApiError((prev) => prev || 'Session creation failed. Try again.')
        return
      }
      if (outcome === '2fa') return // 2FA step now drives redirect

      // No 2FA -> Redirect based on role
      handleRoleRedirect(userRole)

    } catch (err) {
      console.error(err)
      setPinError(true)
      setPinKey((prev) => prev + 1)
      setApiError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPin = async () => {
    setApiError(null)
    setLoading(true)
    try {
      await triggerSendOtp()
      setState('otp')
    } catch (err: any) {
      setApiError(err.message || 'Failed to send OTP.')
    } finally {
      setLoading(false)
    }
  }

  // --- STATE 3: OTP LOGIN ---
  const handleOtpChange = (index: number, val: string) => {
    // Fast typing can land several digits in one box before focus advances —
    // spread them across the following boxes instead of keeping only the last.
    const digits = val.replace(/\D/g, '')
    const newOtp = [...otp]
    if (digits === '') {
      newOtp[index] = ''
      setOtp(newOtp)
      return
    }
    let cursor = index
    for (const d of digits) {
      if (cursor >= 4) break
      newOtp[cursor] = d
      cursor++
    }
    setOtp(newOtp)
    otpRefs.current[Math.min(cursor, 3)]?.focus()

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
      // Verify OTP + run the 2FA gate via the challenge endpoint. The OTP is
      // consumed here; the session is minted from the returned challenge token.
      const outcome = await runChallenge({ contact: phone, code })

      if (outcome === 'error') {
        setOtpError(true)
        setOtp(['', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
        setApiError((prev) => prev || 'Incorrect OTP or session expired.')
        return
      }
      if (outcome === '2fa') return // 2FA step now drives redirect

      // Success (no 2FA)
      if (!hasPin) {
        // Prompt to set a PIN
        setShowInlinePinSetup(true)
      } else {
        // Direct redirect
        handleRoleRedirect(userRole)
      }

    } catch (err) {
      console.error(err)
      setApiError('Verification failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setApiError(null)
    setLoading(true)
    try {
      await triggerSendOtp()
    } catch (err: any) {
      setApiError(err.message || 'Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  // --- INLINE PIN SETUP HANDLERS ---
  const handleInlinePinComplete = async (pin: string) => {
    setSetupPin(pin)
  }

  const handleInlinePinSave = async () => {
    if (setupPin.length !== 4) return
    setLoading(true)
    setSetupPinError(false)
    setApiError(null)

    try {
      const res = await fetch('/api/auth/pin/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: setupPin, confirmPin: setupPin })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setSetupPinError(true)
        setSetupPinKey(prev => prev + 1)
        setSetupPin('')
        setApiError(data.error || 'Failed to save PIN')
        return
      }

      setSetupPinSuccess(true)
      setTimeout(() => {
        handleRoleRedirect(userRole)
      }, 1500)

    } catch (err) {
      console.error(err)
      setSetupPinError(true)
      setSetupPinKey(prev => prev + 1)
      setApiError('Failed to save PIN. Connection error.')
    } finally {
      setLoading(false)
    }
  }

  // Progress steps
  const steps = [1, 2]

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
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-[#0D47A1] via-[#1565D8] to-[#1E88E5] animate-gradient">
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
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vidhyaan-logo-white.svg" alt="Vidhyaan" className="h-9 w-auto" />
          </div>

          {/* Hero text */}
          <div className="space-y-6 animate-fade-slide-up">
            <div className="space-y-3">
              <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
                One Login for<br />Everything
                <span className="text-blue-100"> Vidhyaan.</span>
              </h2>
              <p className="text-white/90 text-base leading-relaxed max-w-[360px]">
                Parents, schools and learning centers — same door. Enter your phone number and we take you to the right place.
              </p>
            </div>

            {/* Floating stat cards */}
            <div className="flex gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/15 animate-float" style={{ animationDelay: '0s' }}>
                <div className="text-2xl font-extrabold text-white">1,000+</div>
                <div className="text-xs font-medium text-white/70 mt-0.5">Institutions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/15 animate-float" style={{ animationDelay: '1s' }}>
                <div className="text-2xl font-extrabold text-white">50K+</div>
                <div className="text-xs font-medium text-white/70 mt-0.5">Students</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/15 animate-float" style={{ animationDelay: '2s' }}>
                <div className="text-2xl font-extrabold text-white">100%</div>
                <div className="text-xs font-medium text-white/70 mt-0.5">Verified Info</div>
              </div>
            </div>
          </div>

          {/* Bottom trust strip */}
          <div className="flex items-center gap-2 text-xs text-blue-200/60 font-medium">
            <Lock className="w-3.5 h-3.5 text-white/50" />
            <span className="text-white/50">
              256-bit encrypted · SOC 2 compliant · Zero charges for parents
            </span>
          </div>
        </div>
      </div>

      {/* ========== RIGHT LOGIN PANEL ========== */}
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] px-5 py-8 lg:px-12">
        <div className="w-full max-w-[420px] animate-fade-slide-up">
          
          {/* Mobile logo (hidden on desktop) */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vidhyaan-logo.svg" alt="Vidhyaan" className="h-10 w-auto" />
          </div>

          {/* Card Container */}
          <div className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-8 lg:p-10">
            
            {/* API Error Box */}
            {apiError && !showInlinePinSetup && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2.5 animate-fade-slide-up">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{apiError}</span>
                  {lockSecondsLeft > 0 && (
                    <span className="block font-bold mt-1 text-red-700">
                      Try again in {formatTime(lockSecondsLeft)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ===== STATE 1: PHONE ===== */}
            {state === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    Welcome Back
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    One login for parents, schools and learning centers
                  </p>
                </div>

                {/* Phone input */}
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
                      autoFocus
                      placeholder="Enter 10-digit number"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-full px-3.5 text-base font-sans text-slate-800 font-semibold placeholder-slate-400 bg-transparent outline-none border-none focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>

                {!accountExists ? (
                  <div className="space-y-3 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                      No account found for this number. New to Vidhyaan?
                    </p>
                    <Link
                      href="/parent/register"
                      className="w-full flex items-center justify-center gap-2 h-[48px] bg-blue-50 hover:bg-blue-100 text-[#1565D8] font-bold rounded-2xl transition-all text-sm"
                    >
                      <Users className="w-4 h-4" />
                      Register as Parent →
                    </Link>
                    <Link
                      href="/for-schools"
                      className="w-full flex items-center justify-center gap-2 h-[48px] bg-white border-2 border-slate-200 hover:border-[#1565D8] text-slate-600 hover:text-[#1565D8] font-bold rounded-2xl transition-all text-sm"
                    >
                      <Building2 className="w-4 h-4" />
                      List your School — Free
                    </Link>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="w-full flex items-center justify-center h-[52px] bg-gradient-to-r from-[#1565D8] to-[#1E88E5] hover:from-[#1150ad] hover:to-[#1565D8] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200/40 hover:shadow-blue-300/50 disabled:shadow-none transition-all select-none cursor-pointer disabled:cursor-not-allowed text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Checking account...
                      </>
                    ) : (
                      'Continue →'
                    )}
                  </button>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Footer links */}
                <div className="flex flex-col items-center gap-2.5 text-xs font-medium">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="text-slate-400">New to Vidhyaan?</span>
                    <Link href="/parent/register" className="hover:text-[#1565D8] transition-colors font-semibold">
                      Register as Parent
                    </Link>
                    <span className="text-slate-200">|</span>
                    <Link href="/for-schools" className="hover:text-[#1565D8] transition-colors font-semibold">
                      List your School
                    </Link>
                  </div>
                  <Link
                    href="/"
                    className="text-[#1565D8] font-semibold hover:underline transition-colors"
                  >
                    ← Back to Home
                  </Link>
                </div>
              </form>
            )}

            {/* ===== STATE 1.5: WORKSPACE PICKER (multi-role users) ===== */}
            {state === 'workspace' && (
              <div className="space-y-6">
                {/* Back Arrow */}
                <button
                  onClick={() => {
                    setState('phone')
                    setSelectedAssignment(null)
                    setApiError(null)
                  }}
                  className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-500 block">
                    Welcome back,
                  </span>
                  <span className="text-2xl font-extrabold tracking-tight text-slate-900 block truncate">
                    {userName}!
                  </span>
                  <p className="text-sm text-slate-500 font-medium pt-0.5">
                    This number is linked to more than one account. Where would you like to go?
                  </p>
                </div>

                <div className="space-y-3">
                  {assignments.map(a => {
                    const isParentRole = a.role === 'PARENT'
                    return (
                      <button
                        key={a.id}
                        disabled={loading}
                        onClick={async () => {
                          setSelectedAssignment(a)
                          setApiError(null)
                          setLoading(true)
                          try {
                            await proceedToCredentials(hasPin)
                          } catch (err: any) {
                            setApiError(err.message || 'Failed to send OTP.')
                          } finally {
                            setLoading(false)
                          }
                        }}
                        className="w-full flex items-center gap-3.5 p-4 bg-slate-50/50 border-2 border-slate-200 hover:border-[#1565D8] hover:bg-blue-50/30 rounded-2xl transition-all text-left cursor-pointer disabled:opacity-50 group"
                      >
                        <div className="w-11 h-11 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                          {isParentRole
                            ? <Users className="w-5 h-5 text-[#1565D8]" />
                            : <Building2 className="w-5 h-5 text-[#1565D8]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {isParentRole ? 'Parent Portal' : a.orgName ?? 'Institution'}
                          </p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {roleLabel(a.role, a.institutionType)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {loading && (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Preparing login...
                  </div>
                )}
              </div>
            )}

            {/* ===== STATE 2: PIN LOGIN ===== */}
            {state === 'pin' && (
              <div className="space-y-6">
                {/* Back Arrow */}
                <button
                  onClick={() => {
                    setState(assignments.length > 1 ? 'workspace' : 'phone')
                    setApiError(null)
                  }}
                  className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Greeting */}
                <div className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-500 block">
                    Welcome back,
                  </span>
                  <span className="text-2xl font-extrabold tracking-tight text-slate-900 block truncate">
                    {userName}!
                  </span>
                  <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                      +91 {maskPhone(phone)}
                    </span>
                    <span className="text-xs font-semibold text-[#1565D8] bg-blue-50 px-2.5 py-1 rounded-lg">
                      {selectedAssignment
                        ? (selectedAssignment.role === 'PARENT'
                            ? 'Parent Portal'
                            : selectedAssignment.orgName ?? roleLabel(selectedAssignment.role, selectedAssignment.institutionType))
                        : roleLabel(userRole, institutionType)}
                    </span>
                    <button
                      onClick={() => {
                        setState('phone')
                        setPhone('')
                        setAssignments([])
                        setSelectedAssignment(null)
                        setApiError(null)
                      }}
                      className="text-[10px] font-bold text-[#1565D8] hover:underline"
                    >
                      Not you?
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-800">
                    Enter your PIN
                  </h3>

                  <div className="relative">
                    {loading && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20 rounded-xl">
                        <Loader2 className="w-6 h-6 text-[#1565D8] animate-spin" />
                      </div>
                    )}

                    <PinInput
                      key={pinKey}
                      length={4}
                      onComplete={handlePinSubmit}
                      error={pinError}
                      success={pinSuccess}
                      disabled={lockSecondsLeft > 0 || loading || pinSuccess}
                      autoFocus={true}
                    />
                  </div>

                  <div className="space-y-3 pt-2 text-center">
                    {lockSecondsLeft > 0 ? (
                      <button
                        onClick={handleForgotPin}
                        className="text-xs font-bold text-[#1565D8] hover:underline cursor-pointer"
                      >
                        Login with OTP instead
                      </button>
                    ) : (
                      <button
                        onClick={handleForgotPin}
                        className="text-xs font-bold text-slate-500 hover:text-[#1565D8] transition-all hover:underline cursor-pointer"
                      >
                        Forgot PIN? Use OTP
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== STATE 3: OTP LOGIN ===== */}
            {state === 'otp' && (
              <div className="space-y-6">
                
                {showInlinePinSetup ? (
                  setupPinSuccess ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-bounce-in">
                      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-extrabold text-[#16A34A] tracking-tight text-center">
                        PIN Set Successfully!
                      </h2>
                      <p className="text-sm text-slate-500 text-center">
                        Redirecting to dashboard...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5 animate-fade-slide-up">
                      <div className="space-y-1.5">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                          Set a PIN for faster login?
                        </h2>
                        <p className="text-sm text-slate-500">
                          Secure your account and skip OTP codes on this device
                        </p>
                      </div>

                      <div className="space-y-4">
                        <PinInput
                          key={setupPinKey}
                          length={4}
                          onComplete={handleInlinePinComplete}
                          error={setupPinError}
                          success={setupPinSuccess}
                          disabled={loading}
                          autoFocus={true}
                        />

                        {apiError && (
                          <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2 animate-fade-slide-up">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <span>{apiError}</span>
                          </div>
                        )}

                        <button
                          onClick={handleInlinePinSave}
                          disabled={loading || setupPin.length < 4}
                          className="w-full flex items-center justify-center h-[48px] bg-gradient-to-r from-[#1565D8] to-[#1E88E5] hover:from-[#1150ad] hover:to-[#1565D8] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200/40 disabled:shadow-none transition-all cursor-pointer text-sm"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Set PIN
                        </button>

                        <button
                          onClick={() => handleRoleRedirect(userRole)}
                          className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Skip for now
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    {/* Back arrow */}
                    <button
                      onClick={() => {
                        if (hasPin) {
                          setState('pin')
                        } else {
                          setState(assignments.length > 1 ? 'workspace' : 'phone')
                        }
                        setApiError(null)
                      }}
                      className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="space-y-1.5">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                        Enter OTP
                      </h2>
                      <p className="text-sm text-slate-500">
                        Sent to +91 {maskPhone(phone)}
                      </p>
                    </div>

                    <div className="relative">
                      {loading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20 rounded-xl">
                          <Loader2 className="w-6 h-6 text-[#1565D8] animate-spin" />
                        </div>
                      )}
                      
                      <div className={`flex justify-between gap-2.5 ${otpError ? 'animate-shake' : ''}`}>
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

                    <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                      <span>
                        Expires in: <span className="text-slate-600 font-semibold">{formatTime(otpSecondsLeft)}</span>
                      </span>
                      
                      {resendCooldown === 0 ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="text-[#1565D8] font-bold hover:underline cursor-pointer"
                        >
                          Resend OTP
                        </button>
                      ) : (
                        <span>Resend in {resendCooldown}s</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {state === 'twofa' && (
              <div className="space-y-6 animate-fade-slide-up">
                <button
                  onClick={() => {
                    setState(hasPin ? 'pin' : 'otp')
                    setChallengeToken(null)
                    setTwofaError(null)
                    setApiError(null)
                  }}
                  className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="space-y-1.5">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 mb-2">
                    <Shield className="w-6 h-6 text-[#1565D8]" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                    Two-factor authentication
                  </h2>
                  <p className="text-sm text-slate-500">
                    {twofaMethod === 'SMS'
                      ? `Enter the code sent to ${twofaMaskedPhone ?? 'your phone'}`
                      : 'Enter the 6-digit code from your authenticator app'}
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={11}
                    value={twofaCode}
                    onChange={(e) => {
                      // digits for TOTP/SMS; allow hyphen for backup codes
                      setTwofaCode(e.target.value.replace(/[^0-9A-Za-z-]/g, '').toUpperCase())
                      setTwofaError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTwofaSubmit()
                    }}
                    placeholder="000000"
                    className={`w-full h-14 text-center text-2xl font-extrabold tracking-[0.3em] bg-slate-50 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50/60 focus:bg-white transition-all text-slate-800 ${
                      twofaError ? 'border-red-300 animate-shake' : 'border-slate-200 focus:border-[#1565D8]'
                    }`}
                  />

                  {twofaError && (
                    <div className="flex items-center gap-2 text-xs font-medium text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      {twofaError}
                    </div>
                  )}

                  <button
                    onClick={handleTwofaSubmit}
                    disabled={loading || twofaCode.trim().length < 4}
                    className="w-full flex items-center justify-center h-[48px] bg-gradient-to-r from-[#1565D8] to-[#1E88E5] hover:from-[#1150ad] hover:to-[#1565D8] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-200/40 disabled:shadow-none transition-all cursor-pointer text-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Verify
                  </button>

                  <p className="text-center text-xs text-slate-400">
                    Lost your device? Use one of your backup codes.
                  </p>
                </div>
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

