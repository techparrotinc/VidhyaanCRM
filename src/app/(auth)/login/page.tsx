'use client'

import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Shield, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Timers for Step 2
  const [expiresIn, setExpiresIn] = useState(600)
  const [resendCooldown, setResendCooldown] = useState(30)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Only allow digits in phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    setPhone(value)
  }

  // Manage timer countdowns in Step 2
  useEffect(() => {
    if (step !== 2) return

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
  }, [step])

  // Focus first OTP box on mount to Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 50)
    }
  }, [step])

  // Format countdown time as mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number starting with 6-9')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: phone, purpose: 'LOGIN' })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send OTP')
        return
      }

      setExpiresIn(data.expiresIn || 600)
      setResendCooldown(30)
      setOtp(['', '', '', '', '', ''])
      setStep(2)
    } catch (err) {
      console.error(err)
      setError('Network connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const otpCode = otp.join('')
    if (otpCode.length < 6) {
      setError('Please fill in all 6 OTP digits')
      return
    }

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
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }

      const session = await getSession()
      const role = session?.user?.role

      if (role === 'PARENT') {
        router.push('/parent/dashboard')
      } else if (['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(role || '')) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error(err)
      setError('Authentication failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, val: string) => {
    // Only accept digits
    const digit = val.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp]
      if (otp[index]) {
        // Clear current box content
        newOtp[index] = ''
        setOtp(newOtp)
      } else if (index > 0) {
        // Focus previous box and clear it
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
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

    const focusIndex = Math.min(pastedData.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  const handleResend = () => {
    setStep(1)
    setOtp(['', '', '', '', '', ''])
    setError(null)
  }

  const handleChangeNumber = () => {
    setStep(1)
    setPhone('')
    setOtp(['', '', '', '', '', ''])
    setError(null)
  }

  const otpIsComplete = otp.join('').length === 6

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#F1F5F9] font-sans antialiased px-4">
      <div className="w-full max-w-[420px] transition-all duration-300">
        
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm mb-3">
            <Shield className="text-[#1565D8] w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            Vidhyaan
          </h1>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 animate-fadeIn">
              {error}
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Phone Entry */
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                  Welcome back
                </h2>
                <p className="text-sm text-slate-500">
                  Sign in to your account
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Phone Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-600 font-semibold select-none text-base border-r border-slate-200 pr-3">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    disabled={loading}
                    className="w-full pl-16 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-base"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full flex items-center justify-center py-3.5 px-4 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-semibold rounded-xl shadow-md shadow-[#1565D8]/10 hover:shadow-lg hover:shadow-[#1565D8]/25 transition-all cursor-pointer disabled:cursor-not-allowed select-none text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>

              <div className="pt-2 text-center space-y-4">
                <Link
                  href="/signup"
                  className="block text-xs font-semibold text-slate-500 hover:text-[#1565D8] transition-colors"
                >
                  New school? Register on Vidhyaan
                </Link>

                <div className="flex items-center gap-3 my-4">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OR</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-400">New to Vidhyaan?</p>
                  <Link
                    href="/parent/register"
                    className="inline-block text-sm font-bold text-[#1565D8] hover:underline"
                  >
                    Create Parent Account
                  </Link>
                </div>
              </div>
            </form>
          ) : (
            /* STEP 2: OTP Verification */
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                  Enter OTP
                </h2>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Sent to +91 XXXXXX{phone.slice(-4)}
                  </p>
                  <button
                    type="button"
                    onClick={handleChangeNumber}
                    className="text-xs font-bold text-[#1565D8] hover:underline"
                  >
                    Change number
                  </button>
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
                      className="text-[#1565D8] font-semibold hover:underline"
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

              <button
                type="button"
                onClick={handleChangeNumber}
                className="w-full py-1 text-center text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                ← Change number
              </button>
            </form>
          )}

        </div>
      </div>
    </main>
  )
}
