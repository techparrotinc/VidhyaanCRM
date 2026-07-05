"use client"

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AVAILABLE_FACILITIES } from './constants'

type FacilitiesTabProps = {
  selectedFacilities: string[]
  onChange: (facilities: string[]) => void
  onSave: () => void
  saving: boolean
}

export default function FacilitiesTab({
  selectedFacilities,
  onChange,
  onSave,
  saving,
}: FacilitiesTabProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4 mb-4">
        <h3 className="text-base font-bold text-slate-800">Facilities & Amenities</h3>
        <p className="text-xs text-slate-400">Toggle public amenities present inside your school campus.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {AVAILABLE_FACILITIES.map((facility) => {
          const isChecked = selectedFacilities.includes(facility)
          return (
            <label
              key={facility}
              className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition cursor-pointer select-none ${
                isChecked
                  ? 'bg-blue-50/55 border-blue-200 text-[#1565D8]'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedFacilities, facility])
                  } else {
                    onChange(selectedFacilities.filter((f) => f !== facility))
                  }
                }}
                className="accent-[#1565D8]"
              />
              <span>{facility}</span>
            </label>
          )
        })}
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
            <span>Save Facilities</span>
          )}
        </Button>
      </div>
    </div>
  )
}
