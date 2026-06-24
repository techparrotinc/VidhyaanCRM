'use client'

import React, { useRef, useState, useEffect } from 'react'

interface PinInputProps {
  length?: number
  onComplete: (pin: string) => void
  error?: boolean
  success?: boolean
  disabled?: boolean
  autoFocus?: boolean
}

export default function PinInput({
  length = 4,
  onComplete,
  error = false,
  success = false,
  disabled = false,
  autoFocus = true,
}: PinInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''))
  const inputsRef = useRef<HTMLInputElement[]>([])

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus()
    }
  }, [autoFocus])

  // If the error state is activated, trigger shake effect
  const [shouldShake, setShouldShake] = useState(false)
  useEffect(() => {
    if (error) {
      setShouldShake(true)
      const timer = setTimeout(() => setShouldShake(false), 300)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value
    // Block non-numeric characters
    if (!/^\d*$/.test(val)) return

    const newValues = [...values]
    // Use only the last character entered
    const digit = val.slice(-1)
    newValues[index] = digit
    setValues(newValues)

    if (digit !== '') {
      // Auto-advance to next box
      if (index < length - 1 && inputsRef.current[index + 1]) {
        inputsRef.current[index + 1].focus()
      }
      
      // If all values are filled, trigger completion
      const completedPin = newValues.join('')
      if (completedPin.length === length) {
        onComplete(completedPin)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newValues = [...values]
      
      if (values[index] !== '') {
        // Clear current value
        newValues[index] = ''
        setValues(newValues)
      } else if (index > 0) {
        // Clear previous value and move focus there
        newValues[index - 1] = ''
        setValues(newValues)
        if (inputsRef.current[index - 1]) {
          inputsRef.current[index - 1].focus()
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (index > 0 && inputsRef.current[index - 1]) {
        inputsRef.current[index - 1].focus()
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (index < length - 1 && inputsRef.current[index + 1]) {
        inputsRef.current[index + 1].focus()
      }
    } else if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
      // Block common scientific characters in numeric inputs
      e.preventDefault()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    // Filter out non-numeric characters and slice to correct length
    const numericData = pastedData.replace(/\D/g, '').slice(0, length)
    if (!numericData) return

    const newValues = [...values]
    for (let i = 0; i < length; i++) {
      if (i < numericData.length) {
        newValues[i] = numericData[i]
      }
    }
    setValues(newValues)

    // Trigger complete if filled
    if (numericData.length === length) {
      onComplete(numericData)
      // Focus last box
      if (inputsRef.current[length - 1]) {
        inputsRef.current[length - 1].focus()
      }
    } else {
      // Focus next empty box
      const nextIndex = numericData.length
      if (inputsRef.current[nextIndex]) {
        inputsRef.current[nextIndex].focus()
      }
    }
  }

  return (
    <div className={`flex gap-3 items-center justify-center ${shouldShake ? 'animate-shake' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .pin-input-box {
          -webkit-text-security: disc !important;
          text-security: disc !important;
        }
      `}} />

      {values.map((val, index) => {
        const isFilled = val !== ''
        
        let borderClass = 'border-slate-200'
        let bgClass = 'bg-white'
        
        if (error) {
          borderClass = 'border-[#EF4444]'
          bgClass = 'bg-[#FFF5F5]'
        } else if (success) {
          borderClass = 'border-[#16A34A]'
          bgClass = 'bg-[#F0FDF4]'
        } else if (isFilled) {
          borderClass = 'border-[#1565D8]'
          bgClass = 'bg-[#EFF6FF]'
        }

        return (
          <input
            key={index}
            ref={(el) => {
              if (el) inputsRef.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={val}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={`
              pin-input-box
              w-14 h-14 md:w-16 md:h-16
              border-2 ${borderClass} ${bgClass}
              rounded-xl text-center text-2xl font-bold font-sans
              focus:outline-none focus:border-[#1565D8] focus:ring-4 focus:ring-blue-50/70
              transition-all duration-150 select-none
            `}
          />
        )
      })}
    </div>
  )
}
