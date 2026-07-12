"use client"

import React from 'react'
import {
  ChevronLeft,
  ExternalLink,
  Pencil,
  MoreVertical,
  Phone,
  Mail,
  MessageCircle,
  Check,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getGradeLabel } from '@/constants/grades'
import {
  institutionType,
  applyingForLabel,
  statusLabels,
  statusConfig,
  sourceConfig,
} from './leadConfig'

type LeadDetailDrawerProps = {
  lead: any | null
  open: boolean
  onClose: () => void
  onViewFullPage: (id: string) => void
  noteText: string
  onNoteChange: (text: string) => void
  onSaveNote: () => void
  onConvert: (lead: any) => void
}

export default function LeadDetailDrawer({
  lead,
  open,
  onClose,
  onViewFullPage,
  noteText,
  onNoteChange,
  onSaveNote,
  onConvert,
}: LeadDetailDrawerProps) {
  if (!open || !lead) return null

  return (
    <>
      {/* Drawer backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Sliding drawer panel */}
      <div role="dialog" aria-modal="true" className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transform transition-transform duration-300 translate-x-0">

        {/* DRAWER HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 transition flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="size-[18px] text-slate-500" />
            </button>
            <div>
              <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {lead.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {(institutionType === 'school' ? getGradeLabel(lead.applyingFor) : lead.applyingFor)} · {lead.source}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Lead ID
                </span>
                <span className="text-xs font-bold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                  {lead.leadCode}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewFullPage(lead.id)}
              className="flex items-center gap-1.5 border border-[#1565D8] bg-blue-50 text-[#1565D8] text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-blue-100 transition cursor-pointer"
              title="View Full Page"
            >
              <ExternalLink size={13} strokeWidth={1.5} className="flex-shrink-0" />
              <span className="hidden sm:inline">View Full Page</span>
            </button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition cursor-pointer">
              <Pencil className="size-3.5 text-slate-500" />
            </button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition cursor-pointer">
              <MoreVertical className="size-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* DRAWER BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* CONTACT SECTION */}
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              CONTACT
            </h5>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
                  <Phone className="size-3.5 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-slate-700">{lead.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-50 rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
                  <Mail className="size-3.5 text-slate-500" />
                </div>
                <span className="text-sm font-medium text-slate-700">{lead.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-50 rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
                  <MessageCircle className="size-3.5 text-green-500" />
                </div>
                <a
                  href={`https://wa.me/${lead.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-green-600 hover:underline cursor-pointer"
                >
                  Send WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 my-5" />

          {/* LEAD DETAILS SECTION */}
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              LEAD DETAILS
            </h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Source</span>
                <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${sourceConfig[lead.source as keyof typeof sourceConfig]?.bg || 'bg-slate-100'} ${sourceConfig[lead.source as keyof typeof sourceConfig]?.text || 'text-slate-600'}`}>
                  <span>{lead.source}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                  {applyingForLabel[institutionType as keyof typeof applyingForLabel]}
                </span>
                <span className="text-sm font-semibold text-slate-700">{institutionType === 'school' ? getGradeLabel(lead.applyingFor) : lead.applyingFor}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Counsellor</span>
                <span className="text-sm font-semibold text-slate-700">{lead.counsellor || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Created</span>
                <span className="text-sm font-semibold text-slate-700">{lead.createdDate}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Status</span>
                <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit ${statusConfig[lead.status as keyof typeof statusConfig]?.bg} ${statusConfig[lead.status as keyof typeof statusConfig]?.text}`}>
                  <span>{statusLabels[lead.status] || lead.status}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Lead ID</span>
                <span className="text-sm font-semibold text-slate-400">{lead.leadCode}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 my-5" />

          {/* ACTIVITY TIMELINE */}
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              ACTIVITY TIMELINE
            </h5>
            <div className="space-y-0">
              {[
                { title: `Lead created from ${lead.source}`, date: lead.createdDate },
                { title: 'Contacted via phone', date: '19 May 2026' },
                { title: `Status changed to ${lead.status}`, date: '20 May 2026' }
              ].map((item, idx, arr) => (
                <div key={idx} className="flex gap-3 pb-4 relative">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1565D8] flex-shrink-0 mt-1.5" />
                    {idx < arr.length - 1 && (
                      <div className="w-px flex-grow bg-slate-100 mt-1" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 leading-tight">{item.title}</p>
                    <span className="text-xs text-slate-400 mt-0.5 block">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 my-5" />

          {/* ADD NOTE SECTION */}
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              ADD NOTE
            </h5>
            <textarea
              placeholder="Type a note about this lead..."
              value={noteText}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:border-[#1565D8] focus:ring-1 focus:ring-[#1565D8]"
            />
            <Button
              onClick={onSaveNote}
              className="mt-2 bg-slate-800 text-white text-sm font-semibold px-4 py-2 h-auto rounded-lg hover:bg-slate-700 transition"
            >
              Save Note
            </Button>
          </div>
        </div>

        {/* DRAWER FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          {institutionType === 'school' ? (
            lead?.status === 'CONVERTED' ? (
              <Button
                disabled
                className="w-full bg-slate-100 text-slate-400 border border-slate-200 text-sm font-bold py-3 h-auto rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
              >
                <span>Already Converted</span>
                <Check className="size-4 text-green-500" strokeWidth={2.5} />
              </Button>
            ) : (
              <Button
                onClick={() => onConvert(lead)}
                className="w-full bg-[#1565D8] text-white text-sm font-bold py-3 h-auto rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition"
              >
                <span>Convert to Admission</span>
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </Button>
            )
          ) : (
            <Button className="w-full bg-green-600 text-white text-sm font-bold py-3 h-auto rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition">
              <span>Mark as Enrolled</span>
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
