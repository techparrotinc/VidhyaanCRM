'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check } from 'lucide-react'

const steps = [
  { number: 1, label: 'Basic Info', path: '/onboarding/step/1' },
  { number: 2, label: 'Location', path: '/onboarding/step/2' },
  { number: 3, label: 'Academics', path: '/onboarding/step/3' },
  { number: 4, label: 'Photos', path: '/onboarding/step/4' },
  { number: 5, label: 'Go Live', path: '/onboarding/step/5' }
]

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  // Determine current active step from pathname
  const stepMatch = pathname?.match(/\/onboarding\/step\/(\d+)/)
  const currentStep = stepMatch ? parseInt(stepMatch[1]) : 1

  useEffect(() => {
    // Fetch current onboarding status to see which steps are complete
    fetch('/api/v1/onboarding/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.completedSteps) {
          setCompletedSteps(data.completedSteps)
        }
      })
      .catch((err) => console.error('Error fetching onboarding status:', err))
  }, [pathname])

  const handleSaveAndExit = async () => {
    // Save progress and go to CRM
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased flex flex-col">
      {/* TOP BAR */}
      <header className="h-20 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vidhyaan-logo.svg" alt="Vidhyaan" className="h-8 w-auto" />
        </div>

        {/* Center: Step progress bar */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-[580px] mx-8">
          {steps.map((s, idx) => {
            const isActive = currentStep === s.number
            const isCompleted = completedSteps.includes(s.number) || currentStep > s.number
            
            return (
              <div key={s.number} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center gap-1.5 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#1565D8] text-white shadow-md shadow-[#1565D8]/20 ring-4 ring-blue-50'
                      : isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-400 border border-slate-200'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : s.number}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider absolute top-9 whitespace-nowrap transition-colors ${
                    isActive ? 'text-[#1565D8]' : isCompleted ? 'text-emerald-500' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-3 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-100'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Save & Exit */}
        <div>
          <button
            onClick={handleSaveAndExit}
            className="text-sm font-bold text-slate-500 hover:text-red-500 hover:bg-slate-50 px-4 py-2 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-100"
          >
            Save & Exit
          </button>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 py-14 px-4 flex justify-center items-start overflow-y-auto">
        <div className="w-full max-w-[680px]">
          {/* Centered card with comfortable padding */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 min-h-[450px] flex flex-col">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
