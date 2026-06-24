"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  Building2,
  GitMerge,
  CalendarDays,
  Key,
  Receipt
} from 'lucide-react'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const menuItems = [
    { name: 'School Profile', path: '/settings/school-profile', icon: Building2 },
    { name: 'Admission Pipeline', path: '/settings/pipeline', icon: GitMerge },
    { name: 'Academic Year', path: '/settings/academic-year', icon: CalendarDays },
    { name: 'Notification Preferences', path: '/settings/notifications', icon: Bell },
    { name: 'API Keys', path: '/settings/api-keys', icon: Key },
    { name: 'Billing & Subscription', path: '/settings/billing', icon: Receipt }
  ]

  const isActive = (path: string) => {
    if (!pathname) return false
    return pathname === path || pathname.startsWith(path)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-6 select-none">
      {/* Settings Left Navigation Sidebar */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-1 bg-white p-4 rounded-xl border border-slate-200 h-fit shadow-sm">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
          System Settings
        </div>
        {menuItems.map((item) => {
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
