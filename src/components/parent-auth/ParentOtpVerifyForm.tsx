'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { signIn } from 'next-auth/react'

interface ParentOtpVerifyFormProps {
  phone: string
  onVerified: () => void
  onChangeDetails?: () => void
}

export default function ParentOtpVerifyForm({
  phone,
  onVerified,
  onChangeDetails
}: ParentOtpVerifyFormProps) {
  const [otp, setOtp] = useState<string[]>(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Timers
  const [expiresIn, setExpiresIn] = useState(600)
  const [resendCooldown, setResendCooldown] = useState(30)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Timer countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })

      setResendCooldown((prev) => {
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Auto focus first OTP input box on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 50)
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (index: number, val: string) => {
    // Spread multi-digit input across boxes (fast typing beats focus advance)
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
    inputRefs.current[Math.min(cursor, 3)]?.focus()

    // Auto-verify on the 4th digit — same behaviour as the unified login page
    const otpCode = newOtp.join('')
    if (otpCode.length === 4) {
      submitCode(otpCode)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp]
      if (otp[index]) {
        newOtp[index] = ''
        setOtp(newOtp)
      } else if (index > 0) {
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
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

    const focusIndex = Math.min(pastedData.length, 3)
    inputRefs.current[focusIndex]?.focus()

    if (pastedData.length === 4) {
      submitCode(pastedData)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
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
        setError(data.error || 'Failed to resend OTP')
        return
      }

      setSuccess('OTP resent successfully!')
      setExpiresIn(data.expiresIn || 600)
      setResendCooldown(30)
      setOtp(['', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } catch (err) {
      console.error(err)
      setError('Failed to resend OTP. Check connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const otpCode = otp.join('')
    if (otpCode.length < 4) {
      setError('Please fill in all 4 OTP digits')
      return
    }
    await submitCode(otpCode)
  }

  const submitCode = async (otpCode: string) => {
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        contact: phone,
        code: otpCode,
        purpose: 'LOGIN',
        redirect: false
      })

      if (res?.error) {
        setError('Invalid or expired OTP')
        setOtp(['', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }

      onVerified()

    } catch (err) {
      console.error(err)
      setError('Verification failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const otpIsComplete = otp.join('').length === 4

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 animate-fadeIn">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-xs font-semibold text-green-600 animate-fadeIn">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Enter OTP
          </h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-505">
              Sent to +91 XXXXXX{phone.slice(-4)}
            </p>
            {onChangeDetails && (
              <button
                type="button"
                onClick={onChangeDetails}
                className="text-xs font-bold text-[#1565D8] hover:underline flex items-center gap-0.5"
              >
                <ArrowLeft className="w-3 h-3" /> Change details
              </button>
            )}
          </div>
        </div>

        {/* OTP Inputs Group */}
        <div className="space-y-2">
          <div className="flex justify-between gap-2.5">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el
                }}
                type="tel"
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                maxLength={1}
                disabled={loading}
                className="w-12 h-12 text-center text-xl font-extrabold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-slate-800"
              />
            ))}
          </div>

          {/* Expiry Countdown */}
          <div className="flex justify-between items-center text-xs font-medium text-slate-400 mt-2">
            <span>
              Expires in:{' '}
              <span className={expiresIn < 60 ? 'text-red-500 font-semibold' : 'text-slate-600'}>
                {formatTime(expiresIn)}
              </span>
            </span>
            
            {resendCooldown > 0 ? (
              <span>Resend in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-[#1565D8] font-semibold hover:underline cursor-pointer"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !otpIsComplete || expiresIn === 0}
          className="w-full flex items-center justify-center py-3.5 px-4 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-semibold rounded-xl shadow-md shadow-[#1565D8]/10 hover:shadow-lg hover:shadow-[#1565D8]/25 transition-all cursor-pointer disabled:cursor-not-allowed select-none text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify & Sign In'
          )}
        </button>
      </form>
    </div>
  )
}
