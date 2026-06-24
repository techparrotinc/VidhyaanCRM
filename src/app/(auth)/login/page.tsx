'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Loader2, ArrowLeft, CheckCircle2, Lock, AlertCircle } from 'lucide-react'
import { signIn } from 'next-auth/react'
import PinInput from '@/components/ui/PinInput'

type LoginState = 'phone' | 'pin' | 'otp'

export default function LoginPage() {
  const router = useRouter()

  // General state
  const [state, setState] = useState<LoginState>('phone')
  const [phone, setPhone] = useState('')
  const [userName, setUserName] = useState('')
  const [hasPin, setHasPin] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Account check helpers
  const [accountExists, setAccountExists] = useState(true)

  // Step 2: PIN Login
  const [pinKey, setPinKey] = useState(0)
  const [pinError, setPinError] = useState(false)
  const [pinSuccess, setPinSuccess] = useState(false)
  const [pinAttemptsLeft, setPinAttemptsLeft] = useState<number | null>(null)
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0)

  // Step 3: OTP Fallback Login
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState(false)
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(600) // 10 mins expiry
  const [resendCooldown, setResendCooldown] = useState(30) // 30s resend cooldown
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

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
    if (roleStr === 'PARENT') {
      window.location.href = '/parent/dashboard'
    } else if (['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(roleStr)) {
      window.location.href = '/admin'
    } else {
      window.location.href = '/dashboard'
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
      setHasPin(data.hasPin)

      if (data.hasPin) {
        setState('pin')
        setPinKey(prev => prev + 1)
      } else {
        // No PIN -> automatically send OTP and switch to OTP state
        await triggerSendOtp()
        setState('otp')
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
    setOtp(['', '', '', '', '', ''])
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

      // 2. Perform NextAuth Sign In
      const authRes = await signIn('credentials', {
        phone,
        pin,
        redirect: false
      })

      if (authRes?.error) {
        setPinSuccess(false)
        setPinKey((prev) => prev + 1)
        setApiError('Session creation failed. Try again.')
        return
      }

      // Success -> Redirect based on role
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
    const digit = val.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    const otpCode = newOtp.join('')
    if (otpCode.length === 6) {
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
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedData) return

    const newOtp = [...otp]
    for (let j = 0; j < 6; j++) {
      if (j < pastedData.length) {
        newOtp[j] = pastedData[j]
      }
    }
    setOtp(newOtp)

    if (pastedData.length === 6) {
      triggerOtpVerify(pastedData)
    } else {
      const focusIndex = Math.min(pastedData.length, 5)
      otpRefs.current[focusIndex]?.focus()
    }
  }

  const triggerOtpVerify = async (code: string) => {
    setLoading(true)
    setApiError(null)
    setOtpError(false)

    try {
      // Direct NextAuth credentials provider call which also verifies OTP code
      const authRes = await signIn('credentials', {
        contact: phone,
        code,
        redirect: false
      })

      if (authRes?.error) {
        setOtpError(true)
        setOtp(['', '', '', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
        setApiError('Incorrect OTP or session expired.')
        return
      }

      // Success
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
    <main className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] font-sans antialiased px-4 py-8">
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
      `}} />

      <div className="w-full max-w-[420px]">
        {/* Logo Branding */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm mb-2">
            <Shield className="text-[#1565D8] w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Vidhyaan
          </h1>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
          
          {/* Progress Indicator (only on phone/login step) */}
          {state === 'phone' && (
            <div className="relative flex items-center justify-between w-full max-w-[120px] mx-auto mb-8">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-100 rounded-full z-0" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#1565D8] rounded-full transition-all duration-500 z-0" 
                style={{ width: `${((state === 'phone' ? 1 : 2) - 1) * 100}%` }}
              />
              {steps.map((s) => {
                const isActive = s === 1
                return (
                  <div 
                    key={s} 
                    className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'w-6 h-6 bg-[#1565D8] ring-4 ring-blue-100 text-white font-bold text-xs' 
                        : 'w-4 h-4 bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {s}
                  </div>
                )
              })}
            </div>
          )}

          {/* API Error Box */}
          {apiError && !showInlinePinSetup && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2">
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

          {/* STATE 1: PHONE */}
          {state === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                  Welcome Back
                </h2>
                <p className="text-sm text-slate-500">
                  Login to your Vidhyaan account
                </p>
              </div>

              <div className="relative flex items-center h-[56px] border-2 border-slate-200 rounded-xl bg-white focus-within:border-[#1565D8] focus-within:ring-4 focus-within:ring-blue-50/50 transition-all">
                <div className="pl-4 pr-3 text-lg font-semibold text-slate-500 border-r border-slate-200 h-full flex items-center select-none">
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
                  className="w-full h-full px-3 text-lg font-sans text-slate-800 font-medium placeholder-slate-400 bg-transparent outline-none border-none focus:outline-none focus:ring-0"
                />
              </div>

              {!accountExists ? (
                /* Registration option when phone doesn't exist */
                <div className="space-y-3 pt-2 text-center">
                  <p className="text-xs text-slate-500 font-medium">New to Vidhyaan?</p>
                  <Link
                    href="/register"
                    className="w-full flex items-center justify-center h-[48px] bg-blue-50 hover:bg-blue-100 text-[#1565D8] font-bold rounded-xl transition-all text-sm"
                  >
                    Create Account
                  </Link>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className="w-full flex items-center justify-center h-[52px] bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all select-none cursor-pointer disabled:cursor-not-allowed text-base"
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

              {/* Footer links */}
              <div className="flex justify-center items-center gap-2 text-xs text-slate-500 mt-2">
                <Link href="/parent/login" className="hover:text-[#1565D8] hover:underline font-medium">
                  Parent? Login here
                </Link>
                <span className="text-slate-300">•</span>
                <Link href="/register" className="hover:text-[#1565D8] hover:underline font-medium">
                  New school? Register
                </Link>
              </div>
            </form>
          )}

          {/* STATE 2: PIN LOGIN */}
          {state === 'pin' && (
            <div className="space-y-6">
              {/* Back Arrow */}
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setState('phone')
                    setApiError(null)
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Greeting */}
              <div className="space-y-1 text-left">
                <span className="text-sm font-medium text-slate-500 block">
                  Welcome back,
                </span>
                <span className="text-2xl font-bold tracking-tight text-slate-900 block truncate">
                  {userName}!
                </span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-xs font-semibold text-slate-500">
                    +91 {maskPhone(phone)}
                  </span>
                  <button
                    onClick={() => {
                      setState('phone')
                      setPhone('')
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

                {/* Lockout countdown / triggers */}
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

          {/* STATE 3: OTP LOGIN */}
          {state === 'otp' && (
            <div className="space-y-6">
              
              {/* Inline PIN Setup inside OTP screen if user just authenticated and has no PIN */}
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
                  <div className="space-y-5 animate-fadeIn">
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

                      <button
                        onClick={handleInlinePinSave}
                        disabled={loading || setupPin.length < 4}
                        className="w-full flex items-center justify-center h-[48px] bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-all cursor-pointer text-sm"
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
                /* Regular OTP boxes */
                <>
                  {/* Back arrow */}
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        if (hasPin) {
                          setState('pin')
                        } else {
                          setState('phone')
                        }
                        setApiError(null)
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  </div>

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
                          className="w-12 h-12 text-center text-xl font-extrabold bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#1565D8] focus:ring-4 focus:ring-blue-50/50 transition-all text-slate-800 disabled:opacity-50"
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

        </div>
      </div>
    </main>
  )
}
