"use client"

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1565D8]'
const labelCls = 'text-xs font-bold uppercase tracking-wider text-slate-500'

export const BOARDS_LIST = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE']

type AcademicsTabProps = {
  isLc: boolean
  selectedBoards: string[]
  onBoardsChange: (boards: string[]) => void
  affiliationNo: string
  onAffiliationNoChange: (value: string) => void
  lcActivityTypes: string[]
  onLcActivityTypesChange: (types: string[]) => void
  lcAgeMin: string
  onLcAgeMinChange: (value: string) => void
  lcAgeMax: string
  onLcAgeMaxChange: (value: string) => void
  lcTrialAvailable: boolean
  onLcTrialAvailableChange: (value: boolean) => void
  onSave: (e: React.FormEvent) => void
  saving: boolean
}

export default function AcademicsTab({
  isLc,
  selectedBoards,
  onBoardsChange,
  affiliationNo,
  onAffiliationNoChange,
  lcActivityTypes,
  onLcActivityTypesChange,
  lcAgeMin,
  onLcAgeMinChange,
  lcAgeMax,
  onLcAgeMaxChange,
  lcTrialAvailable,
  onLcTrialAvailableChange,
  onSave,
  saving
}: AcademicsTabProps) {
  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="border-b border-slate-100 pb-4 mb-4">
        <h3 className="text-base font-bold text-slate-800">Academics & Board Affiliations</h3>
        <p className="text-xs text-slate-400">Configure academic systems, board connections, or activities.</p>
      </div>

      {!isLc ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className={labelCls}>Boards Offered</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BOARDS_LIST.map((board) => {
                const isChecked = selectedBoards.includes(board)
                return (
                  <label
                    key={board}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition cursor-pointer select-none ${
                      isChecked
                        ? 'bg-blue-50/55 border-blue-200 text-[#1565D8]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onBoardsChange([...selectedBoards, board])
                        } else {
                          onBoardsChange(selectedBoards.filter((b) => b !== board))
                        }
                      }}
                      className="accent-[#1565D8]"
                    />
                    <span>{board}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Affiliation Number</label>
            <input type="text" value={affiliationNo}
              onChange={(e) => onAffiliationNoChange(e.target.value)} placeholder="e.g. CBSE 123456" className={inputCls} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Activity Types</label>
            <input
              type="text"
              placeholder="e.g. Robotics, Coding, Ballet, Yoga (comma separated)"
              value={lcActivityTypes.join(', ')}
              onChange={(e) =>
                onLcActivityTypesChange(e.target.value.split(',').map((item) => item.trim()).filter(Boolean))
              }
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Min Age Group</label>
              <input type="number" value={lcAgeMin}
                onChange={(e) => onLcAgeMinChange(e.target.value)} placeholder="e.g. 4 years" className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Max Age Group</label>
              <input type="number" value={lcAgeMax}
                onChange={(e) => onLcAgeMaxChange(e.target.value)} placeholder="e.g. 15 years" className={inputCls} />
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
            <input
              type="checkbox"
              id="lcTrialAvailable"
              checked={lcTrialAvailable}
              onChange={(e) => onLcTrialAvailableChange(e.target.checked)}
              className="accent-[#1565D8]"
            />
            <label htmlFor="lcTrialAvailable" className="text-sm font-semibold text-slate-700 cursor-pointer">
              Free / Paid trial class available for students
            </label>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button type="submit" disabled={saving}
          className={`bg-[#1565D8] hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {saving ? (
            <>
              <Loader2 className="animate-spin size-4 mr-2" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Academics Settings</span>
          )}
        </Button>
      </div>
    </form>
  )
}
