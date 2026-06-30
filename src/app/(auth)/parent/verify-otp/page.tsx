'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import ParentOtpVerifyForm from '@/components/parent-auth/ParentOtpVerifyForm'

export default function ParentVerifyOtpPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load phone from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPhone = sessionStorage.getItem('parent_verify_phone')
      if (!savedPhone) {
        setError('No pending verification phone found. Redirecting to register...')
        setTimeout(() => {
          router.push('/parent/register')
        }, 2000)
      } else {
        setPhone(savedPhone)
      }
    }
  }, [router])

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#F1F5F9] font-sans antialiased px-4">
      <div className="w-full max-w-[420px] transition-all duration-300">
        
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm mb-3">
            <Shield className="text-[#1565D8] w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            Vidhyaan
          </h1>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 animate-fadeIn">
              {error}
            </div>
          )}

          {phone && !error && (
            <ParentOtpVerifyForm
              phone={phone}
              onVerified={() => {
                sessionStorage.removeItem('parent_verify_phone')
                window.location.href = '/parent/dashboard'
              }}
              onChangeDetails={() => router.push('/parent/register')}
            />
          )}

        </div>
      </div>
    </main>
  )
}
