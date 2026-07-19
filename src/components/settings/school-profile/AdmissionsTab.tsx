"use client"

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/datetime-picker'

type AdmissionsTabProps = {
  admissionOpen: boolean
  onAdmissionOpenChange: (open: boolean) => void
  academicYear: string
  onAcademicYearChange: (value: string) => void
  admissionDeadline: string
  onAdmissionDeadlineChange: (value: string) => void
  admissionFormLink: string
  onAdmissionFormLinkChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  saving: boolean
}

export default function AdmissionsTab({
  admissionOpen,
  onAdmissionOpenChange,
  academicYear,
  onAcademicYearChange,
  admissionDeadline,
  onAdmissionDeadlineChange,
  admissionFormLink,
  onAdmissionFormLinkChange,
  onSubmit,
  saving,
}: AdmissionsTabProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="border-b border-slate-100 pb-4 mb-4">
        <h3 className="text-base font-bold text-slate-800">Admission Campaign Settings</h3>
        <p className="text-xs text-slate-400">Configure online applications status, deadlines, and registration links.</p>
      </div>

      <div className="space-y-6">
        {/* Status open/close toggle */}
        <div className="flex items-center justify-between p-4 border border-slate-200 bg-slate-50/50 rounded-2xl">
          <div className="space-y-1">
            <span className="text-sm font-bold text-slate-800">Admission Open Status</span>
            <p className="text-xs text-slate-400 font-normal">Toggle whether your school is actively accepting enquiries.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={admissionOpen}
              onChange={(e) => onAdmissionOpenChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1565D8]" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Academic Intake Year</label>
            <input
              type="text"
              required={admissionOpen}
              value={academicYear}
              onChange={(e) => onAcademicYearChange(e.target.value)}
              placeholder="e.g. 2026-2027"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1565D8]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Intake Deadline</label>
            <DatePicker
              value={admissionDeadline}
              onChange={onAdmissionDeadlineChange}
              placeholder="Pick a deadline"
            />
          </div>

          <div className="space-y-1.5 col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">External Admission Form Link (Optional)</label>
            <input
              type="url"
              value={admissionFormLink}
              onChange={(e) => onAdmissionFormLinkChange(e.target.value)}
              placeholder="https://form.jotform.com/..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1565D8]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button
          type="submit"
          disabled={saving}
          className={`bg-[#1565D8] hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin size-4 mr-2" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Admission Settings</span>
          )}
        </Button>
      </div>
    </form>
  )
}
