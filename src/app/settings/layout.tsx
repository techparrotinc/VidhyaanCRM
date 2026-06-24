"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import {
  Bell,
  Menu,
  X,
  Settings,
  Calendar,
  GitBranch,
  MessageSquare,
  Users,
  CreditCard,
  Lock
} from 'lucide-react'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = [
    { name: 'General', path: '/settings', icon: Settings },
    { name: 'Security Settings', path: '/settings/security', icon: Lock },
    { name: 'Academic Year', path: '/settings/academic-year', icon: Calendar },
    { name: 'Admission Pipeline', path: '/settings/pipeline', icon: GitBranch },
    { name: 'Notification Preferences', path: '/settings/notifications', icon: MessageSquare },
    { name: 'User Management', path: '/settings/users', icon: Users },
    { name: 'Billing & Subscription', path: '/settings/billing', icon: CreditCard }
  ]

  const isActive = (path: string) => {
    if (!pathname) return false
    if (path === '/settings') {
      return pathname === '/settings'
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex relative font-sans antialiased select-none">
      {/* 1. MAIN SYSTEM SIDEBAR */}
      <aside className="hidden md:flex w-16 lg:w-64 fixed inset-y-0 left-0 border-r border-slate-200 bg-white z-30 shadow-sm flex-col">
        <Sidebar />
      </aside>

      {/* MOBILE TOP NAV BAR */}
      <header className="flex md:hidden h-14 bg-white border-b border-slate-200 px-4 items-center justify-between fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer animate-fade-in"
          >
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <span className="text-sm font-bold text-slate-800">Settings</span>
        </div>
      </header>

      {/* MOBILE SIDEBAR DRAWERS */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl transform transition-transform duration-300 translate-x-0 md:hidden flex flex-col">
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Sidebar isMobile onCloseMobileMenu={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-16 lg:pl-64 pt-14 md:pt-0 flex flex-col min-w-0">
        {/* DESKTOP/TABLET HEADER BAR */}
        <header className="hidden md:flex h-16 border-b border-slate-200 bg-white items-center justify-between px-8 sticky top-0 z-20 shadow-sm animate-fade-in">
          <h2 className="text-lg font-bold text-slate-950">Settings</h2>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg text-slate-500 hover:text-slate-950 hover:bg-slate-50 relative shrink-0">
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2 text-left">
              <div className="w-9 h-9 rounded-full bg-[#1565D8] text-white text-sm font-bold flex items-center justify-center shrink-0">
                UA
              </div>
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-700 leading-tight truncate">User Admin</span>
                <span className="text-xs text-slate-400 leading-none truncate font-medium">School Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* SETTINGS SUB-LAYOUT WITH SIDEBAR */}
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-6">
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
        </main>
      </div>
    </div>
  )
}
