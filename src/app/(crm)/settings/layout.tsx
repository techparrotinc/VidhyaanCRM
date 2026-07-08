"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Lock, ChevronLeft } from 'lucide-react'
import { buildSettingsNav } from '@/components/settings/settingsNav'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [institutionType, setInstitutionType] = useState<'SCHOOL' | 'LEARNING_CENTER'>('SCHOOL')
  const [isWhatsappActive, setIsWhatsappActive] = useState(false)

  useEffect(() => {
    fetch('/api/v1/settings/org-type')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.data?.institutionType) {
            setInstitutionType(data.data.institutionType)
          }
          if (data.data?.isWhatsappActive !== undefined) {
            setIsWhatsappActive(data.data.isWhatsappActive)
          }
        }
      })
      .catch((err) => console.error('Failed to fetch org type:', err))
  }, [])

  const sections = buildSettingsNav({
    isLearningCenter: institutionType === 'LEARNING_CENTER',
    isWhatsappActive
  })

  const isActive = (path: string) => {
    if (!pathname) return false
    return pathname === path || pathname.startsWith(path + '/')
  }

  // The settings index is itself the navigation (card grid + search) — the
  // sidebar would duplicate it item-for-item, so it only renders on subpages.
  if (pathname === '/settings') {
    return <div className="w-full p-6 select-none">{children}</div>
  }

  return (
    <div className="w-full p-6 flex flex-col md:flex-row gap-6 items-start select-none">
      {/* Settings Left Navigation Sidebar */}
      <aside className="w-full md:w-[230px] shrink-0 sticky top-24 h-fit flex flex-col bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 px-3 py-2 mb-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
          All Settings
        </Link>

        {sections.map(section => (
          <div key={section.label} className="mb-3 last:mb-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
              {section.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {section.items.map(item => {
                const Icon = item.icon

                if (item.locked) {
                  return (
                    <span
                      key={item.path}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 cursor-not-allowed rounded-lg select-none group relative"
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                      <span className="flex-1">{item.name}</span>
                      <Lock className="w-3 h-3 flex-shrink-0" />
                      <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                        Upgrade to unlock WhatsApp
                      </span>
                    </span>
                  )
                }

                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-blue-50 text-[#1565D8] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.5} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </aside>

      {/* Settings Content Area */}
      <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 min-w-0 flex flex-col shadow-sm">
        {children}
      </div>
    </div>
  )
}
