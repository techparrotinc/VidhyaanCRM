"use client"

import React from 'react'

export default function SettingsGeneralPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-slate-950">General Settings</h3>
        <p className="text-sm text-slate-500">Configure your institution's profile and default workspace properties.</p>
      </div>

      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Institution Name</label>
            <input
              type="text"
              value="Prince Matriculation School"
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Workspace Slug</label>
            <input
              type="text"
              value="princematric"
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  )
}
