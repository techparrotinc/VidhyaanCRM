'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
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
    <main className="min-h-screen w-full flex font-sans antialiased bg-[#F8FAFC]">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up {
          animation: fadeSlideUp 0.5s ease-out forwards;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }
      `}} />

      {/* ========== LEFT BRANDED PANEL (hidden on mobile) ========== */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-[#0D47A1] via-[#1565D8] to-[#1E88E5] animate-gradient">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/[0.04]" />
        <div className="absolute top-1/3 -right-16 w-56 h-56 rounded-full bg-white/[0.06]" />
        <div className="absolute -bottom-12 left-1/4 w-40 h-40 rounded-full bg-white/[0.05]" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vidhyaan-icon-white.svg" alt="Vidhyaan" className="w-10 h-10" />
            <span className="text-xl font-extrabold text-white tracking-tight">Vidhyaan for Parents</span>
          </div>

          {/* Hero text */}
          <div className="space-y-6 animate-fade-slide-up">
            <div className="space-y-3">
              <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
                Find the Best School<br />For Your Child,<br />
                <span className="text-blue-100">Stress-Free.</span>
              </h2>
              <p className="text-white/90 text-base leading-relaxed max-w-[360px]">
                Explore top-rated schools, compare fees & facilities, and apply online directly from your phone.
              </p>
            </div>

            {/* Floating stat cards */}
            <div className="flex gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/15 animate-float" style={{ animationDelay: '0s' }}>
                <div className="text-2xl font-extrabold text-white">1,000+</div>
                <div className="text-xs font-medium text-white/70 mt-0.5">Top Schools</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/15 animate-float" style={{ animationDelay: '1s' }}>
                <div className="text-2xl font-extrabold text-white">Direct</div>
                <div className="text-xs font-medium text-white/70 mt-0.5">Admissions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/15 animate-float" style={{ animationDelay: '2s' }}>
                <div className="text-2xl font-extrabold text-white">100%</div>
                <div className="text-xs font-medium text-white/70 mt-0.5">Verified Info</div>
              </div>
            </div>
          </div>

          {/* Bottom trust strip */}
          <div className="flex items-center gap-2 text-xs text-blue-200/60 font-medium">
            <Lock className="w-3.5 h-3.5 text-white/50" />
            <span className="text-white/50">256-bit encrypted · Direct parent support · Zero charges</span>
          </div>
        </div>
      </div>

      {/* ========== RIGHT VERIFY PANEL ========== */}
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] px-5 py-8 lg:px-12">
        <div className="w-full max-w-[440px] animate-fade-slide-up">
          
          {/* Mobile logo (hidden on desktop) */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vidhyaan-icon.svg" alt="Vidhyaan" className="w-12 h-12 mb-2.5" />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Vidhyaan
            </h1>
          </div>

          {/* Card Container */}
          <div className="bg-white rounded-[24px] border border-slate-100/80 shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-8 lg:p-10">
            
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

          {/* Bottom trust strip (mobile) */}
          <div className="flex items-center justify-center gap-2 mt-6 text-[10px] text-slate-400 font-medium lg:hidden">
            <Lock className="w-3 h-3" />
            <span>256-bit encrypted · Verified details</span>
          </div>
        </div>
      </div>
    </main>
  )
}
