"use client"

import React from 'react'
import Link from 'next/link'
import { Mail, MessageCircle, Phone } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getGradeLabel } from '@/constants/grades'
import { institutionType, statusLabels, statusConfig } from './leadConfig'

type LeadGridViewProps = {
  leads: any[]
  onOpen: (id: string) => void
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void
}

export default function LeadGridView({ leads, onOpen, showToast }: LeadGridViewProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map((lead: any) => (
        <Card
          key={lead.id}
          onClick={() => onOpen(lead.id)}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[220px]"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                  {lead.avatar}
                </div>
                <div>
                  <Link
                    href={`/lead-management/${lead.id}`}
                    className="text-sm font-semibold text-[#1565D8] hover:underline truncate max-w-[150px] block"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onOpen(lead.id)
                    }}
                  >
                    {lead.name}
                  </Link>
                  <span className="text-xs text-slate-400 block mt-0.5">Parent: {lead.parentName}</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{lead.leadCode}</span>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConfig[lead.status as keyof typeof statusConfig]?.bg} ${statusConfig[lead.status as keyof typeof statusConfig]?.text}`}>
                <span>{statusLabels[lead.status] || lead.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Applying For</span>
                <span className="text-slate-700 font-medium">{institutionType === 'school' ? getGradeLabel(lead.applyingFor) : lead.applyingFor}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Source</span>
                <span className="text-slate-700 font-medium">{lead.source}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-semibold">Counsellor</span>
                <span className="text-slate-700 font-medium">{lead.counsellor || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-4">
            <span className="text-xs text-slate-400 font-medium">{lead.createdDate}</span>
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  showToast(`Email initiated for ${lead.name}`)
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <Mail className="size-3.5 text-slate-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  showToast(`WhatsApp opened for ${lead.name}`)
                  window.open(
                    `https://wa.me/91${lead.phone}`,
                    '_blank'
                  )
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <MessageCircle className="size-3.5 text-green-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  showToast(`Call initiated for ${lead.name}`)
                  window.open(`tel:${lead.phone}`)
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <Phone className="size-3.5 text-blue-500" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </section>
  )
}
