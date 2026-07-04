"use client"

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type LeadPaginationProps = {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
}

function PageButton({
  page,
  isCurrent,
  onClick,
}: {
  page: number
  isCurrent: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors cursor-pointer ${
        isCurrent
          ? 'bg-[#1565D8] text-white'
          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {page}
    </button>
  )
}

export default function LeadPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
}: LeadPaginationProps) {
  return (
    <section className="bg-white border border-slate-200 shadow-sm rounded-xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-slate-500 font-medium">
        Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} leads
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={`flex items-center gap-1.5 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium transition ${
            page <= 1
              ? 'text-slate-400 opacity-50 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-50 cursor-pointer'
          }`}
        >
          <ChevronLeft className="size-4" />
          <span>Prev</span>
        </button>

        {totalPages <= 5 ? (
          Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <PageButton key={p} page={p} isCurrent={p === page} onClick={() => onPageChange(p)} />
          ))
        ) : (
          Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
            if (
              p === 1 ||
              p === totalPages ||
              Math.abs(p - page) <= 1
            ) {
              return (
                <PageButton key={p} page={p} isCurrent={p === page} onClick={() => onPageChange(p)} />
              )
            }

            if (
              (p === 2 && page > 3) ||
              (p === totalPages - 1 && page < totalPages - 2)
            ) {
              return (
                <span key={p} className="text-slate-400 px-1 font-bold">...</span>
              )
            }

            return null
          })
        )}

        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`flex items-center gap-1.5 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium transition ${
            page >= totalPages
              ? 'text-slate-400 opacity-50 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-50 cursor-pointer'
          }`}
        >
          <span>Next</span>
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  )
}
