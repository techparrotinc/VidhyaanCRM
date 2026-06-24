'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AlertCircle, CheckCircle2, Lock, Shield, Loader2, ArrowLeft } from 'lucide-react'
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
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
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
        setOtp(['', '', '', '', '', ''])
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

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    const otpCode = newOtp.join('')
    if (otpCode.length === 6) {
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
      triggerRemovePin(pastedData)
    } else {
      const focusIndex = Math.min(pastedData.length, 5)
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
        setOtp(['', '', '', '', '', ''])
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

        </div>
      )}
    </div>
  )
}
