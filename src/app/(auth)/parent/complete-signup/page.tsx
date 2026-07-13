'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { CheckCircle2, Loader2, ShieldX, Smartphone } from 'lucide-react'
import OtpInput from '@/components/ui/otp-input'

/**
 * One-time completion step after a first Google sign-in: the verified Google
 * identity is parked in Redis; we collect the parent's phone, verify it via
 * SMS OTP, then the server creates the phone-keyed account + Google link and
 * hands back a challenge token to mint the session.
 */
function CompleteSignup() {
  const params = useSearchParams()
  const token = params.get('t')

  const [pending, setPending] = useState<{ email: string; name: string } | null>(null)
  const [fatal, setFatal] = useState<string | null>(null)
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setFatal('Missing sign-in token. Please try Google sign-in again.')
      return
    }
    const init = async () => {
      try {
        // An already-signed-in parent reaching here is LINKING Google from
        // settings — no phone/OTP needed, the session is the proof.
        const sess = await fetch('/api/auth/session').then((r) => r.json()).catch(() => null)
        if (sess?.user?.role === 'PARENT') {
          const res = await fetch('/api/auth/google/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ t: token, mode: 'link' })
          })
          const json = await res.json()
          if (res.ok) {
            window.location.href = '/parent/profile?linked=1'
          } else {
            setFatal(json.error || 'Could not link your Google account.')
          }
          return
        }

        const json = await fetch(`/api/auth/google/pending?t=${token}`).then((r) => r.json())
        if (json.success) setPending(json.data)
        else setFatal(json.error || 'This sign-in link has expired.')
      } catch {
        setFatal('Could not load your sign-in details.')
      }
    }
    init()
  }, [token])

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const clean = phone.replace(/\D/g, '').slice(-10)
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }
    setLoading(true)
    try {
      // Existing phone (returning parent linking Google) needs purpose LOGIN;
      // a brand-new phone needs SIGNUP.
      const check = await fetch(`/api/auth/check-phone?phone=${clean}`).then((r) => r.json())
      const purpose = check?.exists ? 'LOGIN' : 'SIGNUP'
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: clean, purpose })
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message || json.error || 'Could not send OTP. Please try again.')
        return
      }
      setPhone(clean)
      setStep('otp')
    } catch {
      setError('Could not send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitOtp = async (code: string) => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/google/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: token, phone, code })
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Verification failed. Please try again.')
        setOtp(['', '', '', ''])
        if (res.status === 410) setFatal(json.error)
        return
      }
      const signInRes = await signIn('credentials', {
        challengeToken: json.challengeToken,
        redirect: false
      })
      if (signInRes?.error) {
        setError('Could not sign you in. Please try again from the login page.')
        return
      }
      window.location.href = '/parent/dashboard'
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fatal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
          <ShieldX className="w-12 h-12 text-red-500 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-slate-800">Link expired</h2>
          <p className="text-sm text-slate-500 mt-2">{fatal}</p>
          <Link
            href="/login"
            className="inline-block mt-6 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl"
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  if (!pending) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm w-full max-w-md">
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 mb-6">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <p className="text-xs font-semibold truncate">
            Signed in with Google as <span className="font-bold">{pending.email}</span>
          </p>
        </div>

        {step === 'phone' ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Almost there</h1>
            <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1.5">
              {pending.name ? `Hi ${pending.name.split(' ')[0]}! ` : ''}
              Add your mobile number to finish setting up your parent account. Schools use it to
              reach you, and it&apos;s your backup way to sign in.
            </p>
            <form onSubmit={sendOtp} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Mobile number</label>
                <div className="flex items-center gap-2 border-2 border-slate-200 rounded-2xl px-4 h-13 py-3 focus-within:border-[#1565D8] transition">
                  <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-bold text-slate-500">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    className="flex-1 text-sm font-semibold text-slate-800 outline-none bg-transparent"
                    autoFocus
                  />
                </div>
              </div>
              {error && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1565D8] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-2xl py-3.5 transition cursor-pointer"
              >
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify your number</h1>
            <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1.5">
              Enter the 4-digit code sent to <span className="font-bold text-slate-700">+91 {phone}</span>
            </p>
            <div className="mt-6 space-y-4">
              <OtpInput values={otp} onChange={setOtp} onComplete={submitOtp} disabled={loading} error={!!error} />
              {error && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
              )}
              {loading && (
                <p className="text-xs text-slate-400 font-semibold flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying…
                </p>
              )}
              <button
                onClick={() => {
                  setStep('phone')
                  setOtp(['', '', '', ''])
                  setError(null)
                }}
                className="text-sm font-semibold text-[#1565D8] hover:underline cursor-pointer"
              >
                Change number
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function CompleteSignupPage() {
  return (
    <Suspense fallback={null}>
      <CompleteSignup />
    </Suspense>
  )
}
