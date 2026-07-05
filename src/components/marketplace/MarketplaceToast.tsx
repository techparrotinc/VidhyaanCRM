"use client"

import React from 'react'
import { CheckCircle2, X } from 'lucide-react'

type MarketplaceToastProps = {
  message: string | null
  onClose: () => void
}

export default function MarketplaceToast({ message, onClose }: MarketplaceToastProps) {
  if (!message) return null

  return (
    <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl z-50 animate-slide-in">
      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      <span>{message}</span>
      <button onClick={onClose} className="hover:text-slate-300 ml-2">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
