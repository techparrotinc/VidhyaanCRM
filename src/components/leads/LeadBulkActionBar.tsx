"use client"

import React from 'react'
import { CheckSquare, UserPlus, ClipboardList, Download, Trash2, X } from 'lucide-react'

type LeadBulkActionBarProps = {
  selectedCount: number
  onClear: () => void
}

export default function LeadBulkActionBar({ selectedCount, onClear }: LeadBulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 shadow-2xl flex items-center gap-3 sm:gap-4 z-50 animate-fade-in max-w-[95%] sm:max-w-none">
      <div className="flex items-center gap-2">
        <CheckSquare className="size-4 text-blue-400" />
        <span className="text-sm font-semibold">{selectedCount} selected</span>
      </div>
      <div className="w-px h-5 bg-slate-600" />

      <div className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
        <button className="hover:text-blue-300 cursor-pointer transition flex items-center" title="Assign Counsellor">
          <UserPlus size={16} className="sm:hidden" />
          <span className="hidden sm:inline">Assign Counsellor</span>
        </button>
        <button className="hover:text-blue-300 cursor-pointer transition flex items-center" title="Change Status">
          <ClipboardList size={16} className="sm:hidden" />
          <span className="hidden sm:inline">Change Status</span>
        </button>
        <button className="hover:text-blue-300 cursor-pointer transition flex items-center" title="Export Selected">
          <Download size={16} className="sm:hidden" />
          <span className="hidden sm:inline">Export Selected</span>
        </button>
      </div>
      <div className="w-px h-5 bg-slate-600" />

      <button className="flex items-center gap-1 text-red-400 hover:text-red-300 transition cursor-pointer text-sm font-medium" title="Delete">
        <Trash2 className="size-4" />
        <span className="hidden sm:inline">Delete</span>
      </button>

      <button
        onClick={onClear}
        className="ml-1 sm:ml-2 text-slate-400 hover:text-slate-200 cursor-pointer"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
