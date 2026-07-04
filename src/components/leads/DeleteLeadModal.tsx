"use client"

import React from 'react'
import { Trash2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { getGradeLabel } from '@/constants/grades'
import { institutionType } from './leadConfig'

type DeleteLeadModalProps = {
  lead: any | null
  onClose: () => void
  onConfirm: (leadId: string) => Promise<void> | void
}

export default function DeleteLeadModal({ lead, onClose, onConfirm }: DeleteLeadModalProps) {
  return (
    <Dialog open={lead !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-3">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <Trash2 size={22} className="text-red-500" strokeWidth={1.5} />
            </div>
            <div>
              <DialogTitle style={{ fontFamily: "'Poppins', sans-serif" }}>Delete Lead?</DialogTitle>
              <DialogDescription className="mt-0.5">This action cannot be undone.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {lead && (
          <>
            {/* LEAD INFO BOX */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center font-sans">
                {lead.avatar}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 font-sans">{lead.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  {(institutionType === 'school' ? getGradeLabel(lead.applyingFor) : lead.applyingFor)} · {lead.id}
                </p>
              </div>
            </div>

            {/* WARNING TEXT */}
            <div className="text-xs text-slate-500 leading-relaxed font-sans mb-1">
              Deleting {lead.name} will permanently remove:
              <ul className="mt-2 space-y-1">
                <li className="flex items-center gap-2 text-xs text-slate-500">
                  <X size={12} className="text-red-400" strokeWidth={1.5} />
                  <span>The lead record and all details</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-500">
                  <X size={12} className="text-red-400" strokeWidth={1.5} />
                  <span>All activity history and notes</span>
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-500">
                  <X size={12} className="text-red-400" strokeWidth={1.5} />
                  <span>Associated follow-up reminders</span>
                </li>
              </ul>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-slate-200 bg-white text-slate-600 text-sm font-semibold h-11 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center justify-center font-sans"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onConfirm(lead.id)
                }}
                className="flex-1 bg-red-500 text-white text-sm font-bold h-11 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition cursor-pointer font-sans"
              >
                <Trash2 size={16} strokeWidth={1.5} />
                <span>Delete Lead</span>
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
