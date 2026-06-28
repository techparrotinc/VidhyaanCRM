import React from 'react'
import { X, AlertCircle } from 'lucide-react'

export interface FeeHead {
  id: string
  name: string
  amount: number
  appliesTo: string
  assignedTermOrder?: number | null
  originalTermText?: string // For warning warning badge
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
    <tr className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors group">
      <td className="py-2.5 pr-2">
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={head.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Enter head name..."
            className="w-full text-sm text-slate-700 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-[#1565D8] focus:ring-0 focus:outline-none py-0.5 px-0 transition-all font-medium"
          />
          {head.originalTermText && (
            <div className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 w-fit select-none">
              <AlertCircle size={10} className="shrink-0" />
              <span>Originally assigned to {head.originalTermText} (not selected)</span>
            </div>
          )}
        </div>
      </td>
      <td className="py-2.5 px-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-block max-w-[120px] truncate select-none">
          {APPLIES_TO_LABELS[head.appliesTo] || head.appliesTo}
        </span>
      </td>
      <td className="py-2.5 px-2">
        <div className="relative flex items-center justify-end">
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
      </td>
      <td className="py-2.5 pl-2 text-right">
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  )
}
