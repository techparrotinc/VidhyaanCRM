'use client'

import React, { useState } from 'react'
import { Shield } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import ParentRegisterForm from './ParentRegisterForm'
import ParentOtpVerifyForm from './ParentOtpVerifyForm'

interface ParentRegisterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function ParentRegisterModal({
  open,
  onOpenChange,
  onSuccess
}: ParentRegisterModalProps) {
  const [step, setStep] = useState<'register' | 'otp'>('register')
  const [phone, setPhone] = useState('')

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state on close
      setStep('register')
      setPhone('')
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scrollbar-none sm:max-w-[420px] bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-2xl flex flex-col justify-start">
        
        {/* Compact Branding Header */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vidhyaan-logo.svg" alt="Vidhyaan" className="h-7 w-auto" />
        </div>

        {/* Dialog Title for accessibility (Visually hidden if header has similar contents, but let's keep it clean) */}
        <DialogHeader className="sr-only">
          <DialogTitle>Parent Authentication</DialogTitle>
        </DialogHeader>

        {step === 'register' ? (
          <ParentRegisterForm
            showLoginLink={false}
            onRegistered={(p) => {
              setPhone(p)
              setStep('otp')
            }}
          />
        ) : (
          <ParentOtpVerifyForm
            phone={phone}
            onVerified={() => {
              // Successfully complete both steps
              onSuccess()
            }}
            onChangeDetails={() => {
              setStep('register')
            }}
          />
        )}

      </DialogContent>
    </Dialog>
  )
}
