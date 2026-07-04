"use client"

import React, { useState } from 'react'
import { CheckSquare, Trash2, X } from 'lucide-react'

type PipelineStage = {
  id: string
  label: string
  dotClass: string
}

type BulkActionBarProps = {
  selectedCount: number
  pipeline: PipelineStage[]
  counsellors: { id: string; name: string }[]
  onMoveStage: (stageId: string) => void
  onAssignCounsellor: (counsellorName: string | null) => void
  onSendCommunication: () => void
  onExport: () => void
  onDelete: () => void
  onClear: () => void
}

export default function BulkActionBar({
  selectedCount,
  pipeline,
  counsellors,
  onMoveStage,
  onAssignCounsellor,
  onSendCommunication,
  onExport,
  onDelete,
  onClear,
}: BulkActionBarProps) {
  const [showStageDropdown, setShowStageDropdown] = useState(false)
  const [showCounsellorDropdown, setShowCounsellorDropdown] = useState(false)

  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-2xl px-6 py-3 shadow-2xl flex items-center gap-4 z-50 select-none animate-fade-in whitespace-nowrap">
      <CheckSquare size={16} className="text-blue-400 shrink-0" strokeWidth={2} />
      <span className="text-sm font-semibold font-sans">{selectedCount} selected</span>

      <div className="w-px h-5 bg-slate-600 shrink-0" />

      {/* Bulk Move Stage Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setShowStageDropdown(!showStageDropdown)
            setShowCounsellorDropdown(false)
          }}
          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer font-sans"
        >
          Move Stage ▾
        </button>
        {showStageDropdown && (
          <div className="absolute bottom-full left-0 mb-2.5 z-20 bg-slate-700 text-white rounded-xl border border-slate-650 shadow-lg p-1.5 min-w-[160px] max-h-48 overflow-y-auto">
            {pipeline.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setShowStageDropdown(false)
                  onMoveStage(s.id)
                }}
                className="px-3 py-1.5 text-xs font-semibold hover:bg-slate-600 rounded-lg cursor-pointer flex items-center gap-2 font-sans"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s.dotClass}`} />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Assign Counsellor Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setShowCounsellorDropdown(!showCounsellorDropdown)
            setShowStageDropdown(false)
          }}
          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer font-sans"
        >
          Assign Counsellor
        </button>
        {showCounsellorDropdown && (
          <div className="absolute bottom-full left-0 mb-2.5 z-20 bg-slate-700 text-white rounded-xl border border-slate-650 shadow-lg p-1.5 min-w-[160px]">
            {counsellors.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setShowCounsellorDropdown(false)
                  onAssignCounsellor(c.name)
                }}
                className="px-3 py-1.5 text-xs font-semibold hover:bg-slate-600 rounded-lg cursor-pointer flex items-center gap-2 font-sans"
              >
                <span>{c.name}</span>
              </div>
            ))}
            <div className="border-t border-slate-600 my-1" />
            <div
              onClick={() => {
                setShowCounsellorDropdown(false)
                onAssignCounsellor(null)
              }}
              className="px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-slate-600 rounded-lg cursor-pointer font-sans"
            >
              Unassign
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onSendCommunication}
        className="text-xs font-semibold text-slate-300 hover:text-white cursor-pointer font-sans"
      >
        Send Communication
      </button>

      <button
        onClick={onExport}
        className="text-xs font-semibold text-slate-300 hover:text-white cursor-pointer font-sans"
      >
        Export
      </button>

      <div className="w-px h-5 bg-slate-600 shrink-0" />

      <button
        onClick={onDelete}
        className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer font-sans"
      >
        <Trash2 size={14} strokeWidth={1.5} />
        <span>Delete</span>
      </button>

      <button
        onClick={() => {
          setShowStageDropdown(false)
          setShowCounsellorDropdown(false)
          onClear()
        }}
        className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
      >
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  )
}
