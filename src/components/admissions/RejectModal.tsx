"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Applicant } from './shared'

const COMMON_REASONS = [
  'Documents incomplete',
  'Seats full',
  'Grade not available',
  'No response from parent'
]

type RejectModalProps = {
  applicant: Applicant | null
  onClose: () => void
  onConfirm: (reason: string) => void | Promise<void>
}

export default function RejectModal({
  applicant,
  onClose,
  onConfirm,
}: RejectModalProps) {
  const [reason, setReason] = useState('')

  const close = () => {
    setReason('')
    onClose()
  }

  const confirm = async () => {
    const value = reason
    setReason('')
    await onConfirm(value)
  }

  return (
    <Dialog
      open={applicant !== null}
      onOpenChange={(open) => { if (!open) close() }}
    >
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white text-left">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-sans text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Reject Application
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-slate-500 mb-4 font-sans">
          Please provide a reason for rejecting the application of <span className="font-semibold text-slate-700">{applicant?.fullName}</span>.
        </p>

        <div className="space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2 font-sans">
              Common Reasons
            </span>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_REASONS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setReason(pill)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                    reason === pill
                      ? 'bg-red-50 border-red-200 text-red-700 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5 font-sans">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 bg-white font-sans outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 h-24 resize-none"
              placeholder="Enter details..."
            />
          </div>
        </div>

        <div className="flex w-full gap-3 mt-6 select-none">
          <button
            onClick={close}
            className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold cursor-pointer font-sans text-center transition"
          >
            Cancel
          </button>
          <button
            disabled={!reason.trim()}
            onClick={confirm}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold cursor-pointer font-sans text-center transition"
          >
            Confirm Rejection
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
