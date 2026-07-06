'use client'

import { Check } from 'lucide-react'

const STEPS = ['Details', 'Fee Items', 'Preview & Schedule']

export default function Stepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 select-none">
      {STEPS.map((label, i) => {
        const stepNum = i + 1
        const isDone = stepNum < currentStep
        const isActive = stepNum === currentStep

        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`w-8 sm:w-12 h-px ${isDone || isActive ? 'bg-[#1565D8]' : 'bg-slate-200'}`} />
            )}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                  isDone
                    ? 'bg-[#1565D8] text-white'
                    : isActive
                    ? 'bg-white text-[#1565D8] ring-2 ring-[#1565D8]'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </span>
              <span
                className={`text-xs font-semibold whitespace-nowrap hidden sm:inline ${
                  isActive ? 'text-[#1565D8]' : isDone ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
