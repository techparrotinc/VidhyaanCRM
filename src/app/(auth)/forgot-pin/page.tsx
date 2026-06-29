'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import PinInput from '@/components/ui/PinInput'

type Step = 1 | 2 | 3

export default function ForgotPinPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [phone, setPhone] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Step 2 OTP States
  const [otp, setOtp] = useState<string[]>(['', '', '', ''])
  const [otpError, setOtpError] = useState(false)
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(600)
  const [resendCooldown, setResendCooldown] = useState(30)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Step 3 PIN States
  const [newPin, setNewPin] = useState('')
  const [confirmPinKey, setConfirmPinKey] = useState(0)
  const [pinError, setPinError] = useState(false)
  const [pinSuccess, setPinSuccess] = useState(false)

  // Timer countdowns
  useEffect(() => {
    if (step !== 2) return
    const timer = setInterval(() => {
      setOtpSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1))
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

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

  const maskPhone = (num: string) => {
    if (num.length < 10) return num
    return `${num.slice(0, 2)}XXXXXX${num.slice(-2)}`
  }

  // --- STEP 1: PHONE SUBMIT ---
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length < 10) return

    setApiError(null)
    setLoading(true)

    try {
      // 1. Verify user exists first
      const checkRes = await fetch(`/api/auth/check-phone?phone=${phone}`)
      const checkData = await checkRes.json()
      if (!checkRes.ok || !checkData.exists) {
        setApiError('No account found with this number.')
        return
      }

      // 2. Send OTP
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: phone, purpose: 'RECOVERY' })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setApiError(data.error || 'Failed to send OTP')
        return
      }

      setOtpSecondsLeft(data.expiresIn || 600)
      setResendCooldown(30)
      setStep(2)

    } catch (err) {
      console.error(err)
      setApiError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // --- STEP 2: OTP VERIFICATION ---
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (digit && index < 3) {
      otpRefs.current[index + 1]?.focus()
    }

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
      const res = await fetch('/api/auth/pin/generate-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otpCode: code })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setOtpError(true)
        setOtp(['', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
        setApiError(data.message || 'OTP verification failed.')
        return
      }

      setResetToken(data.resetToken)
      setStep(3)
    } catch (err) {
      console.error(err)
      setApiError('Verification failed. Check connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setApiError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: phone, purpose: 'RECOVERY' })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setApiError(data.error || 'Failed to send OTP')
        return
      }
      setOtpSecondsLeft(data.expiresIn || 600)
      setResendCooldown(30)
      setOtp(['', '', '', ''])
    } catch (err) {
      console.error(err)
      setApiError('Failed to resend OTP.')
    } finally {
      setLoading(false)
    }
  }

  // --- STEP 3: RESET PIN ---
  const handleConfirmPinComplete = async (confirmPin: string) => {
    if (confirmPin !== newPin) {
      setPinError(true)
      setApiError("PINs don't match. Please try again.")
      setTimeout(() => {
        setPinError(false)
        setConfirmPinKey(prev => prev + 1)
      }, 1000)
      return
    }

    setPinSuccess(true)
    setPinError(false)
    setApiError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/pin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otpToken: resetToken,
          newPin,
          confirmPin
        })
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setPinSuccess(false)
        setPinError(true)
        setApiError(data.error || 'Failed to reset PIN')
        return
      }

      setSuccessMsg('PIN reset successful. Please login with your new PIN.')
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (err) {
      console.error(err)
      setPinSuccess(false)
      setPinError(true)
      setApiError('Failed to reset PIN. Connection error.')
    } finally {
      setLoading(false)
    }
  }

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
          
          {/* Back button (on steps 2/3) */}
          {step > 1 && !successMsg && (
            <div className="flex items-center mb-4">
              <button
                onClick={() => {
                  setStep((prev) => (prev - 1) as Step)
                  setApiError(null)
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Success screen */}
          {successMsg ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-bounce-in">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-extrabold text-[#16A34A] tracking-tight text-center px-4">
                PIN Reset Successful
              </h2>
              <p className="text-xs text-slate-500 text-center leading-normal px-2">
                Please login with your new PIN. Redirecting...
              </p>
            </div>
          ) : (
            <>
              {/* API Errors */}
              {apiError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* STEP 1: PHONE INPUT */}
              {step === 1 && (
                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-sans">
                      Forgot PIN?
                    </h2>
                    <p className="text-sm text-slate-500 font-sans">
                      Enter your mobile number to reset your login PIN
                    </p>
                  </div>

                  <div className="relative flex items-center h-[56px] border-2 border-slate-200 rounded-xl bg-white focus-within:border-[#1565D8] focus-within:ring-4 focus-within:ring-blue-50/50 transition-all">
                    <div className="pl-4 pr-3 text-lg font-semibold text-slate-500 border-r border-slate-200 h-full flex items-center select-none font-sans">
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

                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="w-full flex items-center justify-center h-[52px] bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all select-none cursor-pointer disabled:cursor-not-allowed text-base font-sans"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending OTP...
                      </                     >
                    ) : (
                      'Send OTP to Reset PIN →'
                    )}
                  </button>

                  <div className="text-center text-xs text-slate-500 mt-2 font-sans">
                    Remembered PIN?{' '}
                    <Link href="/login" className="text-[#1565D8] font-bold hover:underline">
                      Login here
                    </Link>
                  </div>
                </form>
              )}

              {/* STEP 2: VERIFY OTP */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-sans">
                      Verify OTP
                    </h2>
                    <p className="text-sm text-slate-500 font-sans">
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
                          className="w-12 h-12 text-center text-xl font-extrabold bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#1565D8] focus:ring-4 focus:ring-blue-50/50 transition-all text-slate-800 disabled:opacity-50 font-sans"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-medium text-slate-400 font-sans">
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
                </div>
              )}

              {/* STEP 3: SET NEW PIN */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-sans">
                      Set New PIN
                    </h2>
                    <p className="text-sm text-slate-500 font-sans">
                      Choose a secure 4-digit PIN for your account
                    </p>
                  </div>

                  {/* New PIN Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block font-sans">
                      Enter PIN
                    </label>
                    <PinInput
                      length={4}
                      onComplete={(val) => setNewPin(val)}
                      error={pinError}
                      success={pinSuccess}
                      disabled={loading || pinSuccess}
                      autoFocus={true}
                    />
                  </div>

                  {/* Confirm PIN Input */}
                  {newPin.length === 4 && (
                    <div className="space-y-2 pt-2 border-t border-slate-50 animate-fadeIn">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block font-sans">
                        Confirm PIN
                      </label>
                      <PinInput
                        key={confirmPinKey}
                        length={4}
                        onComplete={handleConfirmPinComplete}
                        error={pinError}
                        success={pinSuccess}
                        disabled={loading || pinSuccess}
                        autoFocus={true}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </main>
  )
}
