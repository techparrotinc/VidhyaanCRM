"use client"

import React from 'react'
import { Shield } from 'lucide-react'

export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
      <Shield className="w-10 h-10 text-[#1565D8] animate-pulse" />
      <div className="flex gap-1.5 mt-4">
        <div className="w-2 h-2 rounded-full bg-[#1565D8] animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#1565D8] animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#1565D8] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-slate-400 mt-3 font-medium">Loading...</span>
    </div>
  )
}
