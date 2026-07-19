"use client"

import React from 'react'
import { Plus, Inbox } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { getGradeLabel } from '@/constants/grades'
import { config, type, pipeline as configPipeline } from '@/lib/admission-settings-config'
import { AppSelect } from '@/components/ui/app-select'

type KanbanViewProps = {
  loading: boolean
  applicants: any[]
  formatDate: (dateString: any) => string
  onOpen: (id: string) => void
  onPrefetch: (id: string) => void
  onAddToStage: (stageId: string) => void
  onMoveStage: (applicantId: string, stageId: string) => void
}

export default function KanbanView({
  loading,
  applicants,
  formatDate,
  onOpen,
  onPrefetch,
  onAddToStage,
  onMoveStage,
}: KanbanViewProps) {
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300">
        {configPipeline.map(stage => {
          const stageApplicants = applicants.filter((a: any) => a.stageId === stage.id)

          return (
            <div key={stage.id} className="w-[280px] flex-shrink-0 bg-slate-50 rounded-xl p-3 flex flex-col gap-3">
              {/* COLUMN HEADER */}
              <div className="flex items-center justify-between select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.dotClass}`} />
                  <span className="text-sm font-bold text-slate-800 truncate font-sans">
                    {stage.label}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${stage.bgClass} ${stage.textClass}`}>
                    {stageApplicants.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddToStage(stage.id)}
                  className="p-1 rounded text-slate-400 hover:text-slate-655 hover:bg-slate-200 cursor-pointer"
                  title={`Add to ${stage.label}`}
                >
                  <Plus size={14} strokeWidth={2} />
                </button>
              </div>

              {/* COLUMN BODY */}
              <div className="space-y-3 min-h-[300px] flex-1 overflow-y-auto">
                {loading ? (
                  Array.from({ length: 2 }).map((_, idx) => (
                    <div
                      key={`skeleton-kanban-${stage.id}-${idx}`}
                      className="bg-white rounded-xl border border-slate-200 p-4 relative overflow-hidden"
                    >
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))
                ) : stageApplicants.length === 0 ? (
                  <div className="bg-white/50 rounded-xl border border-dashed border-slate-200 py-8 text-center flex flex-col items-center justify-center">
                    <Inbox size={24} className="text-slate-350" strokeWidth={1.5} />
                    <span className="text-[11px] text-slate-400 font-bold mt-2 font-sans">
                      No {config.applicantLabel[type]}s
                    </span>
                  </div>
                ) : (
                  stageApplicants.map((a: any) => {
                    return (
                      <div
                        key={a.id}
                        onMouseEnter={() => onPrefetch(a.id)}
                        onClick={() => onOpen(a.id)}
                        className="bg-white border border-slate-200 rounded-xl p-3 mb-2 hover:shadow-sm cursor-pointer transition-all flex flex-col gap-2.5"
                      >
                        <div>
                          <span className="text-sm font-semibold text-slate-800 block font-sans truncate">
                            {a.fullName}
                          </span>
                          <span className="text-xs font-mono text-slate-400 block mt-0.5">
                            {a.admissionCode}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                            {a.applyingFor ? getGradeLabel(a.applyingFor) : '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {a.counsellor ? (
                              <>
                                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 text-[8px] font-bold flex items-center justify-center shrink-0">
                                  {a.counsellorAvatar}
                                </div>
                                <span className="text-xs text-slate-655 truncate max-w-[80px] font-sans">
                                  {a.counsellor.split(' ')[0]}
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

                        <div className="mt-1 pt-2 border-t border-slate-100 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Stage</span>
                          <AppSelect
                            value={a.stageId}
                            onChange={(e) => onMoveStage(a.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                          >
                            {configPipeline.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </AppSelect>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
