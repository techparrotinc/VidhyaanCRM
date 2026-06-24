'use client'

import React from 'react'
import { Calendar, Mail } from 'lucide-react'

export default function EventManagementPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col items-center justify-center min-h-[75vh] select-none">
      {/* COMING SOON CARD */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 text-center max-w-md w-full space-y-6">
        <div className="w-16 h-16 bg-blue-50 text-[#1565D8] rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
          <Calendar className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1565D8] px-2.5 py-0.5 rounded bg-blue-50/50 border border-blue-100/50">
            Coming Soon
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Event Management</h1>
          <p className="text-xs text-slate-500 font-normal leading-relaxed pt-2">
            Manage school events, holidays and open days. Set parent interaction drives, view agendas, and sync Google calendars. Available in the next update.
          </p>
        </div>

        <div className="pt-2">
          <a
            href="mailto:support@vidhyaan.com?subject=Notify%20me%20about%20Event%20Management%20module"
            className="bg-[#1565D8] hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider px-6 py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Get Notified
          </a>
        </div>
      </div>
    </div>
  )
}
