'use client'

import React, { useEffect, useRef } from 'react'

/**
 * Shared OTP box row — the single home for the digit-entry behaviour that
 * was previously copy-pasted across login, forgot-pin, security and the
 * parent OTP form (each copy had the fast-typing dropped-digit bug).
 *
 * Controlled: the page owns the `values` array, so existing flows
 * (clear-on-error, resend) keep working by simply resetting state.
 * Unmasked by design — for masked PIN entry use `PinInput`.
 */
interface OtpInputProps {
  values: string[]
  onChange: (values: string[]) => void
  /** fired with the joined code when every box is filled */
  onComplete?: (code: string) => void
  error?: boolean
  disabled?: boolean
  autoFocus?: boolean
  /** styling of each digit box; defaults match the auth pages */
  boxClassName?: string
  className?: string
}

const DEFAULT_BOX =
  'w-14 h-14 text-center text-xl font-extrabold bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#1565D8] focus:ring-4 focus:ring-blue-50/60 focus:bg-white transition-all text-slate-800 disabled:opacity-50'

export default function OtpInput({
  values,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = true,
  boxClassName = DEFAULT_BOX,
  className = 'flex justify-between gap-2.5',
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const length = values.length

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus])

  // When the page clears the code (wrong OTP, resend), pull focus back to
  // the first box so the user can just retype.
  const wasFilled = useRef(false)
  useEffect(() => {
    const isEmpty = values.every((v) => v === '')
    if (isEmpty && wasFilled.current && !disabled) refs.current[0]?.focus()
    wasFilled.current = !isEmpty
  }, [values, disabled])

  const commit = (next: string[]) => {
    onChange(next)
    const code = next.join('')
    if (code.length === length) onComplete?.(code)
  }

  const handleChange = (index: number, val: string) => {
    // Fast typing can land several digits in one box before focus advances —
    // spread them across the following boxes instead of keeping only the last.
    const digits = val.replace(/\D/g, '')
    const next = [...values]
    if (digits === '') {
      next[index] = ''
      onChange(next)
      return
    }
    let cursor = index
    for (const d of digits) {
      if (cursor >= length) break
      next[cursor] = d
      cursor++
    }
    refs.current[Math.min(cursor, length - 1)]?.focus()
    commit(next)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...values]
      if (values[index]) {
        next[index] = ''
        onChange(next)
      } else if (index > 0) {
        next[index - 1] = ''
        onChange(next)
        refs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      refs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!digits) return
    const next = [...values]
    for (let i = 0; i < digits.length; i++) next[i] = digits[i]
    refs.current[Math.min(digits.length, length - 1)]?.focus()
    commit(next)
  }

  return (
    <div className={`${className} ${error ? 'animate-shake' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}} />
      {values.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          className={boxClassName}
        />
      ))}
    </div>
  )
}
