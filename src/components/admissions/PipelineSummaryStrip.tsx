"use client"

import React from 'react'
import { BarChart2, ChevronDown, ChevronUp } from 'lucide-react'
import { config } from '@/lib/admission-settings-config'

type PipelineSummaryStripProps = {
  expanded: boolean
  onToggle: (expanded: boolean) => void
  totalApplicants: number
  headerTotal: number
  conversionRate: number
  admittedCount: number
  avgDaysToAdmit: number
  pendingActionCount: number
}

export default function PipelineSummaryStrip({
  expanded,
  onToggle,
  totalApplicants,
  headerTotal,
  conversionRate,
  admittedCount,
  avgDaysToAdmit,
  pendingActionCount,
}: PipelineSummaryStripProps) {
  if (!expanded) {
    return (
      <div className="mx-4 mb-3">
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-[#1565D8]/30 hover:bg-blue-50/20 transition-colors gap-3 min-w-0"
          onClick={() => onToggle(true)}
        >
          {/* TOP LINE ON MOBILE / LEFT ON DESKTOP */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#1565D8] flex-shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                Admission Pipeline
              </span>
            </div>
            {/* View Pipeline mobile toggle */}
            <div className="flex items-center gap-1 text-sm font-medium text-[#1565D8] hover:underline whitespace-nowrap sm:hidden">
              <span>View</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>

          {/* BOTTOM LINE ON MOBILE / CENTER ON DESKTOP */}
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 border-t border-slate-100 sm:border-0 pt-2.5 sm:pt-0 w-full sm:w-auto">
            <span className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">
              Total:{' '}
              <span className="font-bold text-slate-900">
                {headerTotal}
              </span>
            </span>

            <span className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">
              Conversion:{' '}
              <span className="font-bold text-green-600">
                {conversionRate}%
              </span>
            </span>

            <span className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">
              Admitted:{' '}
              <span className="font-bold text-blue-600">
                {admittedCount}
              </span>
            </span>
          </div>

          {/* RIGHT BUTTON — DESKTOP ONLY */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(true); }}
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-[#1565D8] hover:underline flex-shrink-0 whitespace-nowrap ml-auto cursor-pointer"
          >
            View Pipeline
            <ChevronDown size={14} className="text-slate-400" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-4 mb-3">
      <div className="bg-white rounded-xl border border-slate-200 shadow-md px-5 py-4 border-t-4 border-t-[#1565D8] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-slate-500">
              ADMISSION MANAGEMENT PIPELINE
            </span>
            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full">
              {config.academicYear}
            </span>
          </div>
          <button
            onClick={() => onToggle(false)}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer font-sans transition-colors"
          >
            <span>Collapse</span>
            <ChevronUp size={12} />
          </button>
        </div>

        {/* STATS CARDS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
          {/* Card 1: Total */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
            <div className="text-xs text-slate-500 font-medium mb-1">Total Applicants</div>
            <div className="text-2xl font-bold text-slate-900">{totalApplicants}</div>
          </div>
          {/* Card 2: Conversion */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
            <div className="text-xs text-slate-500 font-medium mb-1">Conversion Rate</div>
            <div className="text-2xl font-bold text-green-600">{conversionRate}%</div>
          </div>
          {/* Card 3: Avg. to admit */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
            <div className="text-xs text-slate-500 font-medium mb-1">Avg. to Admit</div>
            <div className="text-2xl font-bold text-[#1565D8]">{avgDaysToAdmit || 0} days</div>
          </div>
          {/* Card 4: Pending Action */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
            <div className="text-xs text-slate-500 font-medium mb-1">Pending Action</div>
            <div className="text-2xl font-bold text-red-600">{pendingActionCount}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
