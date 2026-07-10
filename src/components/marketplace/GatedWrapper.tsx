"use client"

import React from 'react'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GatedWrapperProps {
  children: React.ReactNode
  isGated: boolean
  onRegister: () => void
  showOverlay?: boolean
  title?: string
  subtext?: string
}

export default function GatedWrapper({
  children,
  isGated,
  onRegister,
  showOverlay = true,
  title = 'Register to view full details',
  subtext = 'Create a free parent account to see admissions, fees, facilities, and contact this school directly.'
}: GatedWrapperProps) {
  if (!isGated) return <>{children}</>

  return (
    <div className="relative overflow-hidden">
      <div className="filter blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>
      {showOverlay && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/10 p-6 text-center">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-slate-200/50 max-w-sm w-full space-y-4 animate-fade-in sticky top-[150px]">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#1565D8] mx-auto shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">{title}</h4>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">{subtext}</p>
            </div>
            <Button
              onClick={onRegister}
              className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl h-auto shadow-md"
            >
              Register Now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
