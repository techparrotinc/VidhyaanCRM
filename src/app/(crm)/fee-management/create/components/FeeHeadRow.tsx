import React from 'react'
import { X, AlertCircle } from 'lucide-react'

export interface FeeHead {
  id: string
  name: string
  amount: number
  appliesTo: string
  assignedTermOrder?: number | null
  originalTermText?: string // For warning badge
}

interface FeeHeadRowProps {
  head: FeeHead
  onUpdate: (updated: Partial<FeeHead>) => void
  onRemove: () => void
}

export default function FeeHeadRow({
  head,
  onUpdate,
  onRemove
}: FeeHeadRowProps) {
  const APPLIES_TO_LABELS: Record<string, string> = {
    ALL_TERMS: 'All Terms',
    FIRST_TERM: 'First Term Only',
    LAST_TERM: 'Last Term Only',
    CUSTOM: 'Custom'
  }

  return (
    <div className="flex items-center gap-2 py-2 border-t border-slate-100 hover:bg-slate-50/50 transition-colors group first:border-t-0">
      {/* Name input — flex-1 */}
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={head.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Enter item name..."
          className="w-full text-sm text-slate-700 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-[#1565D8] focus:ring-0 focus:outline-none py-0.5 px-0 transition-all font-medium"
        />
        {head.originalTermText && (
          <div className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 w-fit select-none">
            <AlertCircle size={10} className="shrink-0" />
            <span>
              Originally assigned to {head.originalTermText} (not selected)
            </span>
          </div>
        )}
      </div>

      {/* Applies To badge — fixed width */}
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0 max-w-[100px] truncate select-none">
        {APPLIES_TO_LABELS[head.appliesTo] || head.appliesTo}
      </span>

      {/* Amount input — fixed width */}
      <div className="relative flex items-center flex-shrink-0">
        <span className="absolute left-1.5 text-sm text-slate-400 select-none">₹</span>
        <input
          type="number"
          value={head.amount === 0 ? '' : head.amount}
          onChange={(e) => onUpdate({ amount: Number(e.target.value) })}
          placeholder="0"
          min={0}
          className="w-24 text-right text-sm font-semibold text-slate-800 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-[#1565D8] focus:ring-0 focus:outline-none py-0.5 pl-5 pr-1 transition-all"
        />
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
