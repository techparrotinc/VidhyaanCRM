'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { 
  Shield, 
  LayoutDashboard, 
  FileText, 
  Bookmark, 
  User, 
  Bell, 
  LogOut, 
  Settings, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'

import { SessionProvider } from 'next-auth/react'

interface ParentLayoutProps {
  children: React.ReactNode
}

export default function ParentLayoutWrapper({ children }: ParentLayoutProps) {
  return (
    <SessionProvider>
      <ParentLayout>{children}</ParentLayout>
    </SessionProvider>
  )
}

function ParentLayout({ children }: ParentLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }, [status, pathname, router])

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Session...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  // Ensure role is PARENT
  if (session?.user?.role !== 'PARENT') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-2">This portal is reserved for parents. Please sign in with a parent account.</p>
          <Button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="mt-6 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl h-auto"
          >
            Log Out & Re-login
          </Button>
        </div>
      </div>
    )
  }

  const parentName = session?.user?.name || 'Parent User'
  const parentInitials = parentName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  const navLinks = [
    { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
    { label: 'My Applications', href: '/parent/applications', icon: FileText },
    { label: 'Saved Schools', href: '/parent/bookmarks', icon: Bookmark },
    { label: 'My Profile', href: '/parent/profile', icon: User }
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col pb-16 md:pb-0 select-none">
      
      {/* 1. TOP NAV (Desktop) */}
      <header className="sticky top-0 bg-white border-b border-slate-100 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[#1565D8] flex items-center justify-center text-white font-black text-sm shadow-md">
              V
            </div>
            <span className="text-base font-black tracking-tight text-slate-900">Vidhyaan</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-600 h-full">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    isActive 
                      ? 'text-[#1565D8] bg-blue-50 font-bold' 
                      : 'hover:text-[#1565D8] hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            
            {/* Notification Bell */}
            <button className="text-slate-400 hover:text-[#1565D8] p-1.5 hover:bg-slate-50 rounded-xl transition relative cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Avatar & Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow">
                  {parentInitials}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-slate-700">{parentName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-40 py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-50">
                      <p className="text-xs font-bold text-slate-800 truncate">{parentName}</p>
                      <p className="text-[10px] text-slate-450 font-medium truncate mt-0.5">{session?.user?.email}</p>
                    </div>
                    <Link
                      href="/parent/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-650 hover:bg-slate-50 hover:text-[#1565D8] transition font-bold"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <Link
                      href="/parent/profile#settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-650 hover:bg-slate-50 hover:text-[#1565D8] transition font-bold"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        signOut({ callbackUrl: '/login' })
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition font-bold border-t border-slate-50 cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* 3. MOBILE NAV TAB BAR (Sticky Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-150/70 z-40 flex md:hidden items-center justify-around px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        {navLinks.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive 
                  ? 'text-[#1565D8]' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase mt-1 tracking-wider">{link.label.replace('My ', '')}</span>
            </Link>
          )
        })}
      </nav>

    </div>
  )
}
