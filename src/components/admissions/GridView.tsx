"use client"

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getGradeLabel } from '@/constants/grades'
import { pipeline as configPipeline } from '@/lib/admission-settings-config'

type GridViewProps = {
  loading: boolean
  applicants: any[]
  getStatusBadge: (dbStatus: string) => React.ReactNode
  formatDate: (dateString: any) => string
  onOpen: (id: string) => void
  onPrefetch: (id: string) => void
}

export default function GridView({
  loading,
  applicants,
  getStatusBadge,
  formatDate,
  onOpen,
  onPrefetch,
}: GridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {loading ? (
        Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={`skeleton-grid-${idx}`}
            className="bg-white rounded-xl border border-slate-200 shadow-md p-5 relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5 flex-1 min-w-[120px]">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <Skeleton className="h-6 w-16 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="border-t border-slate-200 my-3" />
            <div className="flex items-center justify-between mt-3.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))
      ) : (
        applicants.map((a: any) => {
          const stageData = configPipeline.find(s => s.id === a.stageId) || configPipeline[0]

          return (
            <div
              key={a.id}
              onMouseEnter={() => onPrefetch(a.id)}
              onClick={() => onOpen(a.id)}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-[#1565D8] cursor-pointer transition-all flex flex-col gap-3 justify-between"
            >
              {/* TOP ROW */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {a.avatar}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 truncate block font-sans">
                    {a.fullName}
                  </span>
                </div>
                {/* Status Badge */}
                <div className="shrink-0">
                  {getStatusBadge(a.dbStatus)}
                </div>
              </div>

              {/* MIDDLE ROW */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-slate-400">
                  {a.admissionCode}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                  {a.applyingFor ? getGradeLabel(a.applyingFor) : '—'}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${stageData.bgClass} ${stageData.textClass} border ${stageData.borderClass}`}>
                  {stageData.label}
                </span>
              </div>

              {/* BOTTOM ROW */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {a.counsellor ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-750 text-[8px] font-bold flex items-center justify-center shrink-0">
                        {a.counsellorAvatar}
                      </div>
                      <span className="text-xs text-slate-655 truncate max-w-[100px] font-sans">
                        {a.counsellor}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-sans">Unassigned</span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-sans">
                  {formatDate(a.createdAt)}
                </span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
