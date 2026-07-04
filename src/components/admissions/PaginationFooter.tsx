"use client"

import React from 'react'

type PaginationFooterProps = {
  loading: boolean
  page: number
  totalPages: number
  showingStart: number
  showingEnd: number
  totalCount: number
  itemLabel: string
  onPrev: () => void
  onNext: () => void
  /** 'embedded' renders inside the list card; 'card' is the standalone grid-view footer */
  variant?: 'embedded' | 'card'
}

export default function PaginationFooter({
  loading,
  page,
  totalPages,
  showingStart,
  showingEnd,
  totalCount,
  itemLabel,
  onPrev,
  onNext,
  variant = 'embedded',
}: PaginationFooterProps) {
  const wrapperClass =
    variant === 'card'
      ? 'bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm mx-4 mb-4'
      : 'flex items-center justify-between px-4 py-3 border-t border-slate-100'

  return (
    <div className={wrapperClass}>
      <span className="text-sm text-slate-500 font-sans">
        Showing {loading ? '...' : `${showingStart}–${showingEnd}`} of {totalCount} {itemLabel}
      </span>

      <div className="flex items-center gap-2 select-none">
        <button
          onClick={onPrev}
          disabled={loading || page <= 1}
          className={`px-3 py-1.5 border rounded-lg text-xs font-semibold font-sans transition ${
            loading || page <= 1
              ? 'border-slate-200 text-slate-400 bg-slate-50/50 cursor-not-allowed'
              : 'border-slate-200 hover:bg-slate-50 text-slate-750 cursor-pointer'
          }`}
        >
          Previous
        </button>
        <button className="hidden sm:flex px-3 py-1.5 border border-[#1565D8] rounded-lg text-xs font-bold text-white bg-[#1565D8] font-sans">
          {page}
        </button>
        <button
          onClick={onNext}
          disabled={loading || page >= totalPages}
          className={`px-3 py-1.5 border rounded-lg text-xs font-semibold font-sans transition ${
            loading || page >= totalPages
              ? 'border-slate-200 text-slate-400 bg-slate-50/50 cursor-not-allowed'
              : 'border-slate-200 hover:bg-slate-50 text-slate-750 cursor-pointer'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  )
}
