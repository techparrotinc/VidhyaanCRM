"use client"

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DAYS_OF_WEEK } from './constants'

export type OperatingHour = {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

type HoursTabProps = {
  hours: OperatingHour[]
  onChange: (hours: OperatingHour[]) => void
  onSave: () => void
  saving: boolean
}

export default function HoursTab({ hours, onChange, onSave, saving }: HoursTabProps) {
  const update = (index: number, patch: Partial<OperatingHour>) => {
    const next = [...hours]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4 mb-4">
        <h3 className="text-base font-bold text-slate-800">Weekly Operating Hours</h3>
        <p className="text-xs text-slate-400">Specify open/close times or closed schedules for your campus.</p>
      </div>

      <div className="space-y-3.5">
        {hours.map((item, index) => (
          <div
            key={item.dayOfWeek}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border border-slate-150 rounded-xl bg-slate-50/20"
          >
            <span className="w-24 font-bold text-slate-705 text-sm">{DAYS_OF_WEEK[item.dayOfWeek]}</span>

            <div className="flex items-center gap-3">
              <input
                type="time"
                disabled={item.isClosed}
                value={item.openTime}
                onChange={(e) => update(index, { openTime: e.target.value })}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs focus:outline-none disabled:opacity-40"
              />
              <span className="text-slate-400 text-xs font-semibold">to</span>
              <input
                type="time"
                disabled={item.isClosed}
                value={item.closeTime}
                onChange={(e) => update(index, { closeTime: e.target.value })}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs focus:outline-none disabled:opacity-40"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={item.isClosed}
                onChange={(e) => update(index, { isClosed: e.target.checked })}
                className="accent-[#1565D8]"
              />
              <span>Closed</span>
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button
          onClick={onSave}
          disabled={saving}
          className={`bg-[#1565D8] hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin size-4 mr-2" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Operating Hours</span>
          )}
        </Button>
      </div>
    </div>
  )
}
