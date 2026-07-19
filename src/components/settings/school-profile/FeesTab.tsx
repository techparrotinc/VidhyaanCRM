"use client"

import React from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GRADE_LABEL_OPTIONS } from '@/constants/grades'
import { AppSelect } from '@/components/ui/app-select'

type FeeRange = {
  id: string
  gradeLabel: string
  frequency?: string | null
  minAmount: number | string
  maxAmount: number | string
}

type FeesTabProps = {
  isLc: boolean
  feeRanges: FeeRange[]
  saving: boolean
  onAddRow: () => void
  onDeleteFee: (id: string) => void
  // school fee inputs
  newFeeGrade: string
  onNewFeeGradeChange: (v: string) => void
  newFeeMin: string
  onNewFeeMinChange: (v: string) => void
  newFeeMax: string
  onNewFeeMaxChange: (v: string) => void
  // learning-center fee inputs
  newLcActivity: string
  onNewLcActivityChange: (v: string) => void
  newLcDuration: string
  onNewLcDurationChange: (v: string) => void
  newLcMonthly: string
  onNewLcMonthlyChange: (v: string) => void
  newLcRegistration: string
  onNewLcRegistrationChange: (v: string) => void
}

export default function FeesTab({
  isLc,
  feeRanges,
  saving,
  onAddRow,
  onDeleteFee,
  newFeeGrade,
  onNewFeeGradeChange,
  newFeeMin,
  onNewFeeMinChange,
  newFeeMax,
  onNewFeeMaxChange,
  newLcActivity,
  onNewLcActivityChange,
  newLcDuration,
  onNewLcDurationChange,
  newLcMonthly,
  onNewLcMonthlyChange,
  newLcRegistration,
  onNewLcRegistrationChange,
}: FeesTabProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4 mb-4">
        <h3 className="text-base font-bold text-slate-800">Fee Structure Config</h3>
        <p className="text-xs text-slate-400">
          {isLc
            ? 'Define duration-specific activity fees and registration costs.'
            : 'Manage annual tuition and one-time admissions fee structure bounds.'}
        </p>
      </div>

      {/* Existing Fees Table */}
      <div className="overflow-hidden border border-slate-200 rounded-xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {isLc ? 'Activity Name' : 'Grade Level'}
              </th>
              <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {isLc ? 'Duration' : 'Annual Fee (INR)'}
              </th>
              <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {isLc ? 'Monthly Fee (INR)' : 'One-time Admission Fee (INR)'}
              </th>
              <th className="p-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {feeRanges.map((fr) => (
              <tr key={fr.id} className="hover:bg-slate-50/50">
                <td className="p-3 font-semibold text-slate-800">{fr.gradeLabel}</td>
                <td className="p-3 font-medium text-slate-600">
                  {isLc ? fr.frequency : `₹${Number(fr.minAmount).toLocaleString()}`}
                </td>
                <td className="p-3 font-medium text-slate-600">
                  ₹{Number(isLc ? fr.minAmount : fr.maxAmount).toLocaleString()}
                  {isLc && fr.maxAmount && ` (+ ₹${Number(fr.maxAmount).toLocaleString()} Reg)`}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => onDeleteFee(fr.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-md cursor-pointer transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {feeRanges.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400 font-medium">
                  No fee structure rows defined yet. Add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Row form */}
      <div className="p-4 border border-slate-200 bg-slate-50/50 rounded-2xl space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Add New Fee Record</h4>

        {!isLc ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Grade / Class</label>
              <AppSelect
                value={newFeeGrade}
                onChange={(e) => onNewFeeGradeChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none h-[38px]"
              >
                <option value="">Select grade…</option>
                {GRADE_LABEL_OPTIONS.map((label) => (
                  <option
                    key={label}
                    value={label}
                    disabled={feeRanges.some((fr) => fr.gradeLabel === label)}
                  >
                    {label}
                  </option>
                ))}
              </AppSelect>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Annual Fee (₹)</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={newFeeMin}
                onChange={(e) => onNewFeeMinChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">One-time Fee (₹)</label>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={newFeeMax}
                onChange={(e) => onNewFeeMaxChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
              />
            </div>
            <Button
              onClick={onAddRow}
              disabled={saving}
              className="bg-[#1565D8] hover:bg-blue-750 text-white font-semibold py-2 px-4 rounded-lg h-10 w-full"
            >
              Add Row
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Activity Name</label>
              <input
                type="text"
                placeholder="e.g. Piano Lesson"
                value={newLcActivity}
                onChange={(e) => onNewLcActivityChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Duration</label>
              <input
                type="text"
                placeholder="e.g. Monthly, 3 Months"
                value={newLcDuration}
                onChange={(e) => onNewLcDurationChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Monthly Fee (₹)</label>
              <input
                type="number"
                placeholder="e.g. 2500"
                value={newLcMonthly}
                onChange={(e) => onNewLcMonthlyChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Registration Fee (₹)</label>
              <input
                type="number"
                placeholder="e.g. 1000"
                value={newLcRegistration}
                onChange={(e) => onNewLcRegistrationChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
              />
            </div>
            <Button
              onClick={onAddRow}
              disabled={saving}
              className="bg-[#1565D8] hover:bg-blue-750 text-white font-semibold py-2 px-4 rounded-lg h-10 w-full"
            >
              Add Activity
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
