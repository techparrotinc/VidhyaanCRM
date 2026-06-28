"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  Building2,
  GitMerge,
  CalendarDays,
  Key,
  Receipt,
  BookOpen,
  MessageCircle,
  Lock
} from 'lucide-react'

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

  const isLearningCenter = institutionType === 'LEARNING_CENTER'

  const menuItems = [
    { name: 'School Profile', path: '/settings/school-profile', icon: Building2 },
    
    // Schools only
    ...(!isLearningCenter ? [
      { name: 'Admission Pipeline', path: '/settings/pipeline', icon: GitMerge }
    ] : []),

    // Learning Centers only
    ...(isLearningCenter ? [
      { name: 'Courses', path: '/settings/courses', icon: BookOpen }
    ] : []),

    { name: 'Academic Year', path: '/settings/academic-year', icon: CalendarDays },
    { name: 'Fee Plans', path: '/settings/fee-plans', icon: Receipt },

    // Schools only — Terms
    ...(!isLearningCenter ? [
      { name: 'Terms', path: '/settings/terms', icon: CalendarDays }
    ] : []),

    { name: 'Notification Preferences', path: '/settings/notifications', icon: Bell },
    { name: 'WhatsApp Templates', path: '/settings/whatsapp-templates', icon: MessageCircle },
    { name: 'API Keys', path: '/settings/api-keys', icon: Key },
    { name: 'Billing & Subscription', path: '/settings/billing', icon: Receipt }
  ]

  const isActive = (path: string) => {
    if (!pathname) return false
    return pathname === path || pathname.startsWith(path)
  }

  return (
    <div className="w-full p-6 flex flex-col md:flex-row gap-6 items-start select-none">
      {/* Settings Left Navigation Sidebar */}
      <aside className="w-full md:w-[220px] shrink-0 sticky top-24 h-fit flex flex-col gap-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
          System Settings
        </div>
        {menuItems.map((item) => {
          if (item.path === '/settings/whatsapp-templates' && !isWhatsappActive) {
            return (
              <span
                key={item.path}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 cursor-not-allowed rounded-lg select-none group relative"
              >
                <MessageCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                <span className="flex-1">WhatsApp Templates</span>
                <Lock className="w-3 h-3 flex-shrink-0" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                  Upgrade to unlock WhatsApp
                </span>
              </span>
            )
          }

          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
      </aside>

      {/* Settings Content Area */}
      <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 min-w-0 flex flex-col shadow-sm">
        {children}
      </div>
    </div>
  )
}
