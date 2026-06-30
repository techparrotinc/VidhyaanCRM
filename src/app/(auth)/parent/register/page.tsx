'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import ParentRegisterForm from '@/components/parent-auth/ParentRegisterForm'

export default function ParentRegisterPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#F1F5F9] font-sans antialiased px-4 py-8">
      <div className="w-full max-w-[440px] transition-all duration-300">
        
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-sm mb-3">
            <Shield className="text-[#1565D8] w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            Vidhyaan
          </h1>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          <ParentRegisterForm
            onRegistered={(phone) => {
              sessionStorage.setItem('parent_verify_phone', phone)
              router.push('/parent/verify-otp')
            }}
          />
        </div>
      </div>
    </main>
  )
}
