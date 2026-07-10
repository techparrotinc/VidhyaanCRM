'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Shield, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ClaimVerifyPhonePage() {
  const router = useRouter()
  const [phone, setPhone] = useState<string | null>(null)
  const [otp, setOtp] = useState<string[]>(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [expiresIn, setExpiresIn] = useState(600)
  const [resendCooldown, setResendCooldown] = useState(30)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Retrieve phone from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('claim_register_phone')
    if (!stored) {
      setError('Phone registration details not found. Please start over.')
      return
    }
    setPhone(stored)
  }, [])

  // Timer cooldowns
  useEffect(() => {
    if (!phone) return

    const timer = setInterval(() => {
      setExpiresIn((prev) => (prev <= 1 ? 0 : prev - 1))
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [phone])

  // Focus first input on mount
  useEffect(() => {
    if (phone) {
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    }
  }, [phone])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const pasted = value.slice(0, 4).split('')
      const newOtp = [...otp]
      pasted.forEach((char, idx) => {
        if (idx < 4) newOtp[idx] = char
      })
      setOtp(newOtp)
      const targetIdx = Math.min(pasted.length, 3)
      inputRefs.current[targetIdx]?.focus()
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleResend = async () => {
    if (!phone || resendCooldown > 0) return
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: phone, purpose: 'SIGNUP' })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend OTP')
      }

      setSuccess('OTP code resent successfully!')
      setExpiresIn(data.expiresIn || 600)
      setResendCooldown(30)
      setOtp(['', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return
    setError(null)
    setSuccess(null)

    const otpCode = otp.join('')
    if (otpCode.length < 4) {
      setError('Please fill in all 4 OTP digits')
      return
    }

    setLoading(true)
    try {
      const res = await signIn('credentials', {
        contact: phone,
        code: otpCode,
        redirect: false
      })

      if (res?.error) {
        setError('Invalid or expired OTP')
        setOtp(['', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }

      sessionStorage.removeItem('claim_register_phone')
      window.location.href = '/onboarding'
    } catch (err) {
      console.error(err)
      setError('Verification failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, label: 'Find School' },
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
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="text-[#1565D8] w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">Vidhyaan</span>
          </div>

          <div className="w-full bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between max-w-[360px] mx-auto">
              {steps.map((s, idx) => (
                <div key={s.number} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      s.number === 4
                        ? 'bg-[#1565D8] text-white shadow-md shadow-[#1565D8]/20 ring-4 ring-blue-50'
                        : s.number < 4
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {s.number < 4 ? '✓' : s.number}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                      s.number === 4 ? 'text-[#1565D8]' : s.number < 4 ? 'text-emerald-500' : 'text-slate-400'
                    }`}>
                      {s.label.split(' ')[0]}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 -mt-4 ${s.number < 4 ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Verify Phone Number
            </h1>
            <p className="text-slate-500 mt-2 text-sm max-w-[400px]">
              {phone ? `We've sent a 4-digit verification code to +91 ${phone}` : 'Loading details...'}
            </p>
          </div>
        </div>

        {/* OTP Input Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-600 flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {!phone ? (
            <div className="text-center py-6">
              <button
                onClick={() => router.push('/claim-profile')}
                className="px-6 py-3 bg-[#1565D8] text-white font-semibold rounded-xl text-sm transition-all"
              >
                Go Back to Find School
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-center gap-2.5 max-w-[360px] mx-auto py-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el }}
                    type="text"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    maxLength={4}
                    disabled={loading}
                    className="w-12 h-14 bg-slate-50 border border-slate-200 rounded-xl text-center font-extrabold text-slate-800 text-xl focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 max-w-[360px] mx-auto">
                <span>Code expires in: <span className="text-slate-800">{formatTime(expiresIn)}</span></span>
                {resendCooldown > 0 ? (
                  <span>Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-[#1565D8] hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length < 4}
                className="w-full flex items-center justify-center py-3.5 px-4 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-xl shadow-md shadow-[#1565D8]/10 hover:shadow-lg hover:shadow-[#1565D8]/25 transition-all cursor-pointer disabled:cursor-not-allowed select-none text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Log In'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
