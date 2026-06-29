"use client"

import React from 'react'
import { Shield } from 'lucide-react'

export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white/90 z-[9999] flex flex-col items-center justify-center">
      <Shield className="w-12 h-12 text-[#1565D8]" />
      <div className="w-12 h-[3px] rounded-full bg-slate-200 mt-3 overflow-hidden relative">
        <div className="h-full bg-[#1565D8] rounded-full animate-[loader_1s_ease-in-out_infinite]" />
      </div>
    </div>
  )
}
