'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AlertCircle, CheckCircle2, Lock, Shield, Loader2, ArrowLeft, ShieldCheck, Smartphone, QrCode, KeyRound, Copy } from 'lucide-react'
import { useSession } from 'next-auth/react'
import PinInput from '@/components/ui/PinInput'

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Status
  const [hasPin, setHasPin] = useState(false)
  const [pinSetAt, setPinSetAt] = useState<string | null>(null)
  const [phone, setPhone] = useState('')

  // Modes: 'idle' | 'set' | 'change' | 'remove'
  const [mode, setMode] = useState<'idle' | 'set' | 'change' | 'remove'>('idle')

  // Set PIN Flow
  const [setPin, setSetPin] = useState('')
  const [confirmKey, setConfirmKey] = useState(0)
  const [setPinError, setSetPinError] = useState(false)
  const [setPinSuccess, setSetPinSuccess] = useState(false)

  // Change PIN Flow
  const [changeStep, setChangeStep] = useState<1 | 2>(1) // 1: verify current, 2: set new
  const [currentPin, setCurrentPin] = useState('')
  const [currentPinKey, setCurrentPinKey] = useState(0)
  const [currentPinError, setCurrentPinError] = useState(false)
  const [changeNewPin, setChangeNewPin] = useState('')
  const [changeConfirmKey, setChangeConfirmKey] = useState(0)
  const [changePinError, setChangePinError] = useState(false)
  const [changePinSuccess, setChangePinSuccess] = useState(false)

  // Remove PIN Flow
  const [otp, setOtp] = useState<string[]>(['', '', '', ''])
  const [otpError, setOtpError] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    fetchSecurityStatus()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendCooldown])

  useEffect(() => {
    if (mode === 'remove' && otpSent) {
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    }
  }, [mode, otpSent])

  const fetchSecurityStatus = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch('/api/v1/settings/security')
      const data = await res.json()
      if (res.ok) {
        setHasPin(data.hasPin)
        setPinSetAt(data.pinSetAt ? new Date(data.pinSetAt).toLocaleDateString() : null)
        setPhone(data.phone || '')
      } else {
        setApiError(data.error || 'Failed to fetch security status.')
      }
    } catch (err) {
      console.error(err)
      setApiError('Connection error.')
    } finally {
      setLoading(false)
    }
  }

  // --- SET PIN FLOW ---
  const handleSetPinComplete = async (confirmVal: string) => {
    if (confirmVal !== setPin) {
      setSetPinError(true)
      setApiError("PINs don't match. Try again.")
      setTimeout(() => {
        setSetPinError(false)
        setConfirmKey(prev => prev + 1)
      }, 1000)
      return
    }

    setSetPinError(false)
    setSetPinSuccess(true)
    setLoading(true)

    try {
      const res = await fetch('/api/v1/settings/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set', pin: setPin, confirmPin: confirmVal })
      })
      const data = await res.json()

      if (res.ok) {
        setSuccessMsg('PIN set successfully!')
        setTimeout(() => {
          setSuccessMsg(null)
          setMode('idle')
          setSetPin('')
          setSetPinSuccess(false)
          fetchSecurityStatus()
        }, 1500)
      } else {
        setSetPinSuccess(false)
        setSetPinError(true)
        setApiError(data.error || 'Failed to save PIN')
      }
    } catch (err) {
      console.error(err)
      setSetPinSuccess(false)
      setSetPinError(true)
      setApiError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  // --- CHANGE PIN FLOW ---
  const handleVerifyCurrentPin = async (val: string) => {
    setCurrentPin(val)
    setLoading(true)
    setApiError(null)
    setCurrentPinError(false)

    try {
      const res = await fetch('/api/auth/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin: val })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setChangeStep(2)
      } else {
        setCurrentPinError(true)
        setCurrentPinKey(prev => prev + 1)
        setApiError(data.message || 'Incorrect current PIN')
      }
    } catch (err) {
      console.error(err)
      setCurrentPinError(true)
      setCurrentPinKey(prev => prev + 1)
      setApiError('Failed to verify PIN. Connection error.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePinComplete = async (confirmVal: string) => {
    if (confirmVal !== changeNewPin) {
      setChangePinError(true)
      setApiError("PINs don't match. Try again.")
      setTimeout(() => {
        setChangePinError(false)
        setChangeConfirmKey(prev => prev + 1)
      }, 1000)
      return
    }

    setChangePinError(false)
    setChangePinSuccess(true)
    setLoading(true)

    try {
      const res = await fetch('/api/v1/settings/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change',
          currentPin,
          newPin: changeNewPin,
          confirmPin: confirmVal
        })
      })
      const data = await res.json()

      if (res.ok) {
        setSuccessMsg('PIN changed successfully!')
        setTimeout(() => {
          setSuccessMsg(null)
          setMode('idle')
          setChangeStep(1)
          setCurrentPin('')
          setChangeNewPin('')
          setChangePinSuccess(false)
          fetchSecurityStatus()
        }, 1500)
      } else {
        setChangePinSuccess(false)
        setChangePinError(true)
        setApiError(data.error || 'Failed to change PIN')
      }
    } catch (err) {
      console.error(err)
      setChangePinSuccess(false)
      setChangePinError(true)
      setApiError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  // --- REMOVE PIN FLOW ---
  const sendRemoveOtp = async () => {
    setApiError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: phone, purpose: 'LOGIN' })
      })
      const data = await res.json()
      if (res.ok) {
        setOtpSent(true)
        setResendCooldown(30)
        setOtp(['', '', '', ''])
      } else {
        setApiError(data.error || 'Failed to send OTP code.')
      }
    } catch (err) {
      console.error(err)
      setApiError('Failed to send verification OTP.')
    } finally {
      setLoading(false)
    }
  }

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
      triggerRemovePin(otpCode)
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
      triggerRemovePin(pastedData)
    } else {
      const focusIndex = Math.min(pastedData.length, 3)
      otpRefs.current[focusIndex]?.focus()
    }
  }

  const triggerRemovePin = async (otpCode: string) => {
    setLoading(true)
    setApiError(null)
    setOtpError(false)

    try {
      const res = await fetch('/api/v1/settings/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', otpCode })
      })
      const data = await res.json()

      if (res.ok) {
        setSuccessMsg('PIN removed successfully!')
        setTimeout(() => {
          setSuccessMsg(null)
          setMode('idle')
          setOtpSent(false)
          fetchSecurityStatus()
        }, 1500)
      } else {
        setOtpError(true)
        setOtp(['', '', '', ''])
        setTimeout(() => otpRefs.current[0]?.focus(), 50)
        setApiError(data.error || 'Incorrect OTP or verification expired.')
      }
    } catch (err) {
      console.error(err)
      setApiError('Verification failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}} />

      <div>
        <h3 className="text-lg font-bold text-slate-950">Security Settings</h3>
        <p className="text-sm text-slate-500">Configure login credentials, PIN preferences, and session controls.</p>
      </div>

      {loading && mode === 'idle' ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-8 h-8 text-[#1565D8] animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Error and Success Banners */}
          {apiError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-xs font-semibold text-green-600 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'idle' && (
            <div className="space-y-6">
              {!hasPin ? (
                /* Card with Amber Border: Set Login PIN */
                <div className="p-6 bg-amber-50/30 border-2 border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-lg select-none">🔒</span> Set Login PIN
                    </h4>
                    <p className="text-sm text-slate-500">
                      Set a 4-digit PIN for faster daily login on this device.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setMode('set')
                      setApiError(null)
                    }}
                    className="h-10 px-4 bg-[#1565D8] hover:bg-[#1150ad] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer select-none shrink-0"
                  >
                    Set PIN
                  </button>
                </div>
              ) : (
                /* Badge: PIN Active */
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-800">
                          Account PIN Lock
                        </h4>
                        <span className="px-2 py-0.5 bg-green-50 border border-green-100 text-[10px] font-bold text-green-600 rounded-full flex items-center gap-1 select-none">
                          <CheckCircle2 className="w-3 h-3 text-green-500" /> PIN Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Your account has a secure PIN set.{' '}
                        {pinSetAt && `Last updated: ${pinSetAt}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setMode('change')
                          setChangeStep(1)
                          setApiError(null)
                        }}
                        className="h-9 px-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Change PIN
                      </button>

                      <button
                        onClick={() => {
                          setMode('remove')
                          setApiError(null)
                          sendRemoveOtp()
                        }}
                        className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                      >
                        Remove PIN
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE: SET PIN */}
          {mode === 'set' && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setMode('idle')}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-sm font-bold text-slate-800">Set Login PIN</span>
              </div>

              <div className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Enter PIN
                  </label>
                  <PinInput
                    length={4}
                    onComplete={(val) => setSetPin(val)}
                    error={setPinError}
                    success={setPinSuccess}
                    disabled={setPinSuccess}
                    autoFocus={true}
                  />
                </div>

                {setPin.length === 4 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 animate-fadeIn">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Confirm PIN
                    </label>
                    <PinInput
                      key={confirmKey}
                      length={4}
                      onComplete={handleSetPinComplete}
                      error={setPinError}
                      success={setPinSuccess}
                      disabled={setPinSuccess}
                      autoFocus={true}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE: CHANGE PIN */}
          {mode === 'change' && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setMode('idle')
                    setChangeStep(1)
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-sm font-bold text-slate-800">Change PIN</span>
              </div>

              <div className="space-y-4 max-w-sm">
                {changeStep === 1 ? (
                  <div className="space-y-2 animate-fadeIn">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Verify Current PIN
                    </label>
                    <PinInput
                      key={currentPinKey}
                      length={4}
                      onComplete={handleVerifyCurrentPin}
                      error={currentPinError}
                      disabled={loading}
                      autoFocus={true}
                    />
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Enter New PIN
                      </label>
                      <PinInput
                        length={4}
                        onComplete={(val) => setChangeNewPin(val)}
                        error={changePinError}
                        success={changePinSuccess}
                        disabled={changePinSuccess}
                        autoFocus={true}
                      />
                    </div>

                    {changeNewPin.length === 4 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100 animate-fadeIn">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          Confirm New PIN
                        </label>
                        <PinInput
                          key={changeConfirmKey}
                          length={4}
                          onComplete={handleChangePinComplete}
                          error={changePinError}
                          success={changePinSuccess}
                          disabled={changePinSuccess}
                          autoFocus={true}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE: REMOVE PIN */}
          {mode === 'remove' && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setMode('idle')
                    setOtpSent(false)
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-sm font-bold text-slate-800 font-sans">Remove PIN</span>
              </div>

              {otpSent ? (
                <div className="space-y-4 max-w-sm animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans">
                      Verify OTP to Remove PIN
                    </label>
                    <p className="text-xs text-slate-400">
                      We sent a 6-digit verification code to your phone
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
                          className="w-12 h-12 text-center text-xl font-extrabold bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#1565D8] focus:ring-4 focus:ring-blue-50/50 transition-all text-slate-800 disabled:opacity-50 font-sans"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-medium text-slate-400 font-sans">
                    {resendCooldown === 0 ? (
                      <button
                        type="button"
                        onClick={sendRemoveOtp}
                        className="text-[#1565D8] font-bold hover:underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <span>Resend in {resendCooldown}s</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 text-[#1565D8] animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Two-factor authentication */}
          <TwoFactorSection />

          {/* Org-wide 2FA policy (ORG_ADMIN only) */}
          <OrgTwoFaPolicy />

        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Two-factor authentication — self-contained enrol / manage / disable flow.
// ---------------------------------------------------------------------------

type TwoFaStatus = {
  enrolled: boolean
  method: 'TOTP' | 'SMS' | null
  backupCodesRemaining: number
  policyRequired: boolean
  mustEnrol: boolean
}

type EnrolStep = 'idle' | 'pick' | 'totp' | 'sms' | 'backup'

function TwoFactorSection() {
  const { update } = useSession()
  const [forced, setForced] = useState(false)

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<TwoFaStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [step, setStep] = useState<EnrolStep>('idle')
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [maskedPhone, setMaskedPhone] = useState<string | undefined>(undefined)
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  // Disable
  const [disabling, setDisabling] = useState(false)
  const [disableCode, setDisableCode] = useState('')

  useEffect(() => {
    fetchStatus()
    if (typeof window !== 'undefined') {
      setForced(new URLSearchParams(window.location.search).get('enrol') === 'required')
    }
  }, [])

  async function fetchStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/status')
      const data = await res.json()
      if (res.ok && data.success) {
        setStatus(data)
        // Session flag stale after enrolment resolves — clear the middleware gate.
        if (data.enrolled) await update({ mustEnrol2fa: false })
      }
    } catch {
      setError('Failed to load 2FA status.')
    } finally {
      setLoading(false)
    }
  }

  async function startEnrol(method: 'TOTP' | 'SMS') {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/2fa/enroll/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Could not start enrolment.')
        return
      }
      setCode('')
      if (method === 'TOTP') {
        setQr(data.qrDataUri)
        setSecret(data.secret)
        setStep('totp')
      } else {
        setMaskedPhone(data.maskedPhone)
        setStep('sms')
      }
    } finally {
      setBusy(false)
    }
  }

  async function confirmEnrol() {
    if (code.trim().length < 4) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/2fa/enroll/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Incorrect code.')
        return
      }
      setBackupCodes(data.backupCodes || [])
      setStep('backup')
      await update({ mustEnrol2fa: false })
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    if (disableCode.trim().length < 4) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode.trim() })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'Could not disable 2FA.')
        return
      }
      setDisabling(false)
      setDisableCode('')
      await fetchStatus()
    } finally {
      setBusy(false)
    }
  }

  function finishEnrol() {
    setStep('idle')
    setQr(null)
    setSecret(null)
    setBackupCodes([])
    fetchStatus()
  }

  if (loading) {
    return (
      <div className="border border-slate-100 rounded-2xl p-6 flex items-center gap-3 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading two-factor status…</span>
      </div>
    )
  }

  return (
    <div className="border border-slate-200 rounded-2xl p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
          <ShieldCheck className="w-5 h-5 text-[#1565D8]" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold text-slate-800">Two-Factor Authentication</h4>
          <p className="text-xs text-slate-400">
            Add a second step at login using an authenticator app or SMS.
          </p>
        </div>
        {status?.enrolled && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
            Enabled · {status.method}
          </span>
        )}
      </div>

      {forced && !status?.enrolled && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs font-medium text-amber-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          Your organization requires two-factor authentication. Set it up to continue.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* ---- Enrolled: manage / disable ---- */}
      {status?.enrolled && step === 'idle' && (
        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            {status.backupCodesRemaining} backup code{status.backupCodesRemaining === 1 ? '' : 's'} remaining.
          </div>
          {!disabling ? (
            <button
              onClick={() => setDisabling(true)}
              disabled={status.policyRequired}
              title={status.policyRequired ? 'Your organization requires 2FA' : undefined}
              className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:text-slate-300 cursor-pointer disabled:cursor-not-allowed"
            >
              Disable 2FA
            </button>
          ) : (
            <div className="space-y-3 max-w-xs">
              <p className="text-xs text-slate-500">Enter a current code to disable.</p>
              <input
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/[^0-9A-Za-z-]/g, '').toUpperCase())}
                placeholder="000000"
                inputMode="numeric"
                className="w-full h-11 text-center text-lg font-bold tracking-widest bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-red-400"
              />
              <div className="flex gap-2">
                <button onClick={disable} disabled={busy} className="flex-1 h-10 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 text-white text-sm font-semibold rounded-xl cursor-pointer">
                  {busy ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : 'Confirm disable'}
                </button>
                <button onClick={() => { setDisabling(false); setDisableCode(''); setError(null) }} className="h-10 px-4 text-sm font-semibold text-slate-500 cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- Not enrolled: pick method ---- */}
      {!status?.enrolled && step === 'idle' && (
        <button
          onClick={() => setStep('pick')}
          className="inline-flex items-center gap-2 h-10 px-4 bg-[#1565D8] hover:bg-[#1150ad] text-white text-sm font-semibold rounded-xl cursor-pointer"
        >
          <Shield className="w-4 h-4" /> Enable 2FA
        </button>
      )}

      {step === 'pick' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <button onClick={() => startEnrol('TOTP')} disabled={busy} className="text-left p-4 rounded-xl border-2 border-slate-200 hover:border-[#1565D8] transition-all cursor-pointer">
            <QrCode className="w-6 h-6 text-[#1565D8] mb-2" />
            <div className="text-sm font-bold text-slate-800">Authenticator app</div>
            <div className="text-xs text-slate-400">Google Authenticator, Authy, 1Password. Free, works offline. Recommended.</div>
          </button>
          <button onClick={() => startEnrol('SMS')} disabled={busy} className="text-left p-4 rounded-xl border-2 border-slate-200 hover:border-[#1565D8] transition-all cursor-pointer">
            <Smartphone className="w-6 h-6 text-[#1565D8] mb-2" />
            <div className="text-sm font-bold text-slate-800">SMS code</div>
            <div className="text-xs text-slate-400">A code texted to your phone at each login.</div>
          </button>
        </div>
      )}

      {/* ---- TOTP enrol ---- */}
      {step === 'totp' && (
        <div className="space-y-4 max-w-sm">
          <p className="text-sm text-slate-600">Scan with your authenticator app, then enter the 6-digit code.</p>
          {qr && <img src={qr} alt="2FA QR code" className="w-44 h-44 border border-slate-200 rounded-xl" />}
          {secret && (
            <button
              onClick={() => navigator.clipboard?.writeText(secret)}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> {secret}
            </button>
          )}
          <TwoFaCodeConfirm code={code} setCode={setCode} onConfirm={confirmEnrol} busy={busy} />
          <button onClick={() => setStep('pick')} className="text-xs font-semibold text-slate-400 cursor-pointer">Back</button>
        </div>
      )}

      {/* ---- SMS enrol ---- */}
      {step === 'sms' && (
        <div className="space-y-4 max-w-sm">
          <p className="text-sm text-slate-600">Enter the code sent to {maskedPhone ?? 'your phone'}.</p>
          <TwoFaCodeConfirm code={code} setCode={setCode} onConfirm={confirmEnrol} busy={busy} />
          <button onClick={() => setStep('pick')} className="text-xs font-semibold text-slate-400 cursor-pointer">Back</button>
        </div>
      )}

      {/* ---- Backup codes (shown once) ---- */}
      {step === 'backup' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-xs font-semibold text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> 2FA enabled. Save these backup codes — shown only once.
          </div>
          <div className="grid grid-cols-2 gap-2 max-w-sm">
            {backupCodes.map((c) => (
              <code key={c} className="text-sm font-mono font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">{c}</code>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(backupCodes.join('\n'))}
              className="inline-flex items-center gap-2 h-10 px-4 border border-slate-200 text-sm font-semibold text-slate-600 rounded-xl cursor-pointer"
            >
              <Copy className="w-4 h-4" /> Copy codes
            </button>
            <button onClick={finishEnrol} className="h-10 px-4 bg-[#1565D8] hover:bg-[#1150ad] text-white text-sm font-semibold rounded-xl cursor-pointer">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function OrgTwoFaPolicy() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [require2fa, setRequire2fa] = useState(false)
  const [saved, setSaved] = useState(false)

  const isOrgAdmin = session?.user?.role === 'ORG_ADMIN'

  useEffect(() => {
    if (!isOrgAdmin) { setLoading(false); return }
    ;(async () => {
      try {
        const res = await fetch('/api/auth/2fa/policy')
        const data = await res.json()
        if (res.ok && data.success) setRequire2fa(!!data.require2fa)
      } finally {
        setLoading(false)
      }
    })()
  }, [isOrgAdmin])

  async function save(next: boolean) {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/auth/2fa/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ require2fa: next })
      })
      if (res.ok) {
        setRequire2fa(next)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!isOrgAdmin || loading) return null

  return (
    <div className="border border-slate-200 rounded-2xl p-6 flex items-start gap-4">
      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
        <Lock className="w-5 h-5 text-amber-600" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-base font-bold text-slate-800">Require 2FA for all staff</h4>
          {saved && <span className="text-[11px] font-semibold text-green-600">Saved</span>}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          When on, every staff member must set up two-factor authentication before accessing the CRM.
        </p>
      </div>
      <button
        role="switch"
        aria-checked={require2fa}
        disabled={saving}
        onClick={() => save(!require2fa)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${require2fa ? 'bg-[#1565D8]' : 'bg-slate-300'} ${saving ? 'opacity-60' : ''}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${require2fa ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function TwoFaCodeConfirm({
  code, setCode, onConfirm, busy
}: {
  code: string
  setCode: (v: string) => void
  onConfirm: () => void
  busy: boolean
}) {
  return (
    <div className="flex gap-2">
      <input
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
        onKeyDown={(e) => { if (e.key === 'Enter') onConfirm() }}
        placeholder="000000"
        inputMode="numeric"
        className="flex-1 h-11 text-center text-lg font-bold tracking-[0.3em] bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#1565D8]"
      />
      <button onClick={onConfirm} disabled={busy || code.trim().length < 4} className="h-11 px-5 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-slate-200 text-white text-sm font-semibold rounded-xl cursor-pointer">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
      </button>
    </div>
  )
}
