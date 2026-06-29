"use client"

import React from 'react'
import { CheckCircle, ChevronRight, XCircle } from 'lucide-react'

interface LeadProgressStripProps {
  status: string
  onStatusChange: (status: string) => void
}

const stepOrder = ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP_PENDING']

const stepLabels: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  FOLLOW_UP_PENDING: 'Follow-up'
}

export default function LeadProgressStrip({
  status,
  onStatusChange
}: LeadProgressStripProps) {
  const currentIdx = stepOrder.indexOf(status)

  return (
    <div className="bg-white border-b border-[#F1F5F9] h-[44px] px-5 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 select-none">
      {stepOrder.map((step, idx) => {
        const stepIdx = idx
        const isCompleted = stepIdx < currentIdx
        const isActive = stepIdx === currentIdx
        const isUpcoming = stepIdx > currentIdx
        const label = stepLabels[step] || step

        return (
          <React.Fragment key={step}>
            {idx > 0 && (
              <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
            )}

            {isCompleted && (
              <button
                type="button"
                onClick={() => onStatusChange(step)}
                className="h-7 px-3 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer hover:bg-blue-100"
              >
                <CheckCircle size={11} className="text-blue-600" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            )}

            {isActive && (
              <div
                className="h-7 px-3 rounded-full bg-[#1565D8] text-white flex items-center gap-1.5 flex-shrink-0 transition-all select-none"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-semibold">{label}</span>
              </div>
            )}

            {isUpcoming && (
              <button
                type="button"
                onClick={() => onStatusChange(step)}
                className="h-7 px-3 rounded-full bg-slate-50 text-slate-400 border border-slate-200 flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer hover:bg-slate-100 hover:text-slate-650"
              >
                <span className="text-xs">{label}</span>
              </button>
            )}
          </React.Fragment>
        )
      })}

      <div className="flex-1" />

      {status !== 'NOT_INTERESTED' && (
        <button
          type="button"
          onClick={() => onStatusChange('NOT_INTERESTED')}
          className="h-7 px-3 rounded-full border-2 border-red-200 text-red-600 text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer hover:bg-red-50"
        >
          <XCircle size={11} className="text-red-500" />
          <span>Not Interested</span>
        </button>
      )}

      {status !== 'CONVERTED' && (
        <button
          type="button"
          onClick={() => onStatusChange('CONVERTED')}
          className="h-7 px-3 rounded-full bg-green-600 text-white text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer hover:bg-green-700"
        >
          <CheckCircle size={11} className="text-white" />
          <span>Mark Converted</span>
        </button>
      )}
    </div>
  )
}
