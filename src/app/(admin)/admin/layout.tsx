"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Building2,
  School,
  Users,
  TrendingUp,
  CreditCard,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  ShieldAlert,
  MessageCircle
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const user = session?.user
  const role = user?.role || 'SUPER_ADMIN'
  const name = user?.name || 'Admin User'
  const email = user?.email || 'admin@vidhyaan.com'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Organizations', href: '/admin/orgs', icon: Building2 },
    { label: 'Schools', href: '/admin/schools', icon: School },
    { label: 'Parents', href: '/admin/parents', icon: Users },
    { label: 'Revenue', href: '/admin/revenue', icon: TrendingUp },
    { label: 'Plans', href: '/admin/plans', icon: CreditCard },
    { label: 'WhatsApp Templates', href: '/admin/whatsapp-templates', icon: MessageCircle },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  const getPageTitle = () => {
    const item = navItems.find((item) =>
      item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
    )
    return item ? item.label : 'Admin Control'
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none">
      {/* Header / Logo */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            V
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight block text-white leading-none font-sans">Vidhyaan</span>
            <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase font-sans">Platform</span>
          </div>
        </Link>

        {/* Roles Badges */}
        <div className="mt-5 flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950 text-red-400 border border-red-900/50">
            <ShieldAlert className="w-3 h-3" />
            ADMIN PANEL
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">
            {role.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                isActive
                  ? 'bg-slate-800/80 text-white shadow-sm shadow-black/10'
                  : 'text-slate-400 hover:text-slate-150 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`} strokeWidth={2} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Profile Info */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-200 shrink-0 select-none">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate leading-tight font-sans">{name}</div>
            <div className="text-[10px] font-bold text-blue-400 tracking-wider uppercase font-sans mt-0.5">
              {role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : role === 'OPERATIONS_ADMIN' ? 'OPS ADMIN' : 'SUPPORT ADMIN'}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-xl transition duration-150"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden lg:block w-60 h-screen sticky top-0 shrink-0 border-r border-slate-900 shadow-xl shadow-slate-950/30 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setMobileMenuOpen(false)} />

          {/* Drawer container */}
          <div className="relative w-64 max-w-xs flex flex-col h-full bg-slate-950 shadow-2xl animate-slide-in-left">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
          </div>
        </div>
      )}

      {/* Right side layout */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 select-none shadow-xs">
          {/* Left Title / Hamburger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 leading-none tracking-tight font-sans">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="hidden sm:relative sm:block">
              <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Global admin search..."
                className="w-56 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition duration-150"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition duration-150">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* Mini User Profile Card */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-sm shadow-blue-500/20">
                {initials}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-slate-900 leading-none font-sans">{name}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 font-sans truncate max-w-[100px]">
                  {email}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
