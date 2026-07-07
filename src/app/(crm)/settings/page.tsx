"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Lock } from 'lucide-react'
import ProfileCompletionWidget from '@/components/shared/ProfileCompletionWidget'
import { buildSettingsNav } from '@/components/settings/settingsNav'

export default function SettingsLandingPage() {
  const [institutionType, setInstitutionType] = useState<'SCHOOL' | 'LEARNING_CENTER'>('SCHOOL')
  const [isWhatsappActive, setIsWhatsappActive] = useState(false)

  useEffect(() => {
    fetch('/api/v1/settings/org-type')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.data?.institutionType) setInstitutionType(data.data.institutionType)
          if (data.data?.isWhatsappActive !== undefined) setIsWhatsappActive(data.data.isWhatsappActive)
        }
      })
      .catch(err => console.error('Failed to fetch org type:', err))
  }, [])

  const sections = buildSettingsNav({
    isLearningCenter: institutionType === 'LEARNING_CENTER',
    isWhatsappActive
  })

  return (
    <div className="space-y-8 animate-fade-in">
      <ProfileCompletionWidget />

      <div>
        <h3 className="text-lg font-bold text-slate-950">Settings</h3>
        <p className="text-sm text-slate-500">
          Everything that configures your workspace, grouped by area.
        </p>
      </div>

      {sections.map(section => (
        <div key={section.label} className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {section.label}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {section.items.map(item => {
              const Icon = item.icon

              if (item.locked) {
                return (
                  <div
                    key={item.path}
                    className="flex items-start gap-3.5 p-5 bg-slate-50/50 rounded-xl border border-slate-200 opacity-70 cursor-not-allowed select-none"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5">
                        {item.name}
                        <Lock className="w-3 h-3" />
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Enable the WhatsApp add-on to unlock
                      </p>
                    </div>
                  </div>
                )
              }

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="flex items-start gap-3.5 p-5 bg-white rounded-xl border border-slate-200 hover:border-[#1565D8]/40 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon className="w-5 h-5 text-[#1565D8]" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 flex items-center justify-between gap-2">
                      {item.name}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1565D8] transition-colors flex-shrink-0" />
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
