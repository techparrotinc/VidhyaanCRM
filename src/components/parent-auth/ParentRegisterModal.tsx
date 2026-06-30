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
      <DialogContent className="w-full h-full max-h-screen sm:h-auto sm:max-h-[90vh] overflow-y-auto sm:max-w-[460px] bg-white p-6 sm:p-8 rounded-none sm:rounded-3xl border border-slate-200 shadow-xl flex flex-col justify-center sm:justify-start">
        
        {/* Compact Branding Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm mb-2.5">
            <Shield className="text-[#1565D8] w-6 h-6" />
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 font-sans">
            Vidhyaan
          </h1>
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
