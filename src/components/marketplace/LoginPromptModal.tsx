"use client"

import React from 'react'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'

type LoginPromptModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
}

export default function LoginPromptModal({
  open,
  onClose,
  title = 'Save this School',
  description = 'Login to bookmark schools and track your admission enquiries. New here? Register as a parent in under a minute.',
}: LoginPromptModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-fade-in">
        <Bookmark className="w-12 h-12 text-[#1565D8] mx-auto mb-4" strokeWidth={1.5} />
        <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider mb-2">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">{description}</p>
        <div className="flex gap-3">
          <Link href="/login" className="flex-1">
            <Button className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl h-auto">
              Login
            </Button>
          </Link>
          <Link href="/parent/register" className="flex-1">
            <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs py-2.5 rounded-xl h-auto">
              Register as Parent
            </Button>
          </Link>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 mt-4 underline cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
