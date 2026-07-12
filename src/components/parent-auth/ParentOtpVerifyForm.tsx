'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { signIn } from 'next-auth/react'
import OtpInput from '@/components/ui/otp-input'

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

  // OTP box focus is handled inside <OtpInput /> (autoFocus on mount).

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // OTP entry UI lives in the shared <OtpInput />; auto-verify on the 4th
  // digit comes from its onComplete callback.
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
      setOtp(['', '', '', '']) // OtpInput refocuses box 1 on clear
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
        setOtp(['', '', '', '']) // OtpInput refocuses box 1 on clear
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
          <OtpInput
            values={otp}
            onChange={setOtp}
            onComplete={submitCode}
            error={!!error}
            disabled={loading}
            boxClassName="w-12 h-12 text-center text-xl font-extrabold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-slate-800 disabled:opacity-50"
          />

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
