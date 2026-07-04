"use client"

import React from 'react'
import { CheckCircle2, XCircle, Info } from 'lucide-react'

export type ToastState = {
  msg: string
  type: 'success' | 'info' | 'error'
  show: boolean
}

export default function Toast({ toast }: { toast: ToastState }) {
  if (!toast.show) return null

  return (
    <div className="fixed bottom-6 right-6 md:bottom-6 md:right-6 left-4 right-4 md:left-auto z-50 animate-fade-in select-none">
      <div className={`p-4 rounded-xl shadow-xl border flex items-center gap-3 bg-white ${
        toast.type === 'success' ? 'border-green-200 text-green-800' :
        toast.type === 'error' ? 'border-red-200 text-red-800' :
        'border-blue-200 text-blue-800'
      }`}>
        {toast.type === 'success' && <CheckCircle2 className="size-5 text-green-500" strokeWidth={2.5} />}
        {toast.type === 'error' && <XCircle className="size-5 text-red-500" strokeWidth={2.5} />}
        {toast.type === 'info' && <Info className="size-5 text-blue-500" strokeWidth={2.5} />}
        <span className="text-sm font-semibold font-sans">{toast.msg}</span>
      </div>
    </div>
  )
}
