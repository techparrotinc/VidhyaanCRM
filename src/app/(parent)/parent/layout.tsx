'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Shield,
  User,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SessionProvider } from 'next-auth/react'
import { useUIStore } from '@/stores/ui.store'
import ParentSidebar from '@/components/parent/ParentSidebar'
import ParentMobileNav from '@/components/parent/ParentMobileNav'
import ParentNotificationBell from '@/components/parent/ParentNotificationBell'
import { ParentAccessProvider, useParentAccess } from '@/components/parent/ParentAccessContext'
import { enrollmentOnlyHrefs } from '@/components/parent/parentNav'
import { ConfirmProvider } from '@/components/ui/confirm-dialog'

interface ParentLayoutProps {
  children: React.ReactNode
}

export default function ParentLayoutWrapper({ children }: ParentLayoutProps) {
  return (
    <SessionProvider>
      <ParentAccessProvider>
        <ConfirmProvider>
          <ParentLayout>{children}</ParentLayout>
        </ConfirmProvider>
      </ParentAccessProvider>
    </SessionProvider>
  )
}

function ParentLayout({ children }: ParentLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const sidebarCollapsed = useUIStore((s) => s.parentSidebarCollapsed)
  const { hasLinkedStudent } = useParentAccess()

  const onEnrollmentOnlyRoute = enrollmentOnlyHrefs.some(
    (h) => pathname === h || pathname.startsWith(h + '/')
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  // Direct-URL guard: discovery parents (no linked ward) can't reach
  // student-data pages even by typing the URL — bounce to dashboard.
  useEffect(() => {
    if (hasLinkedStudent === false && onEnrollmentOnlyRoute) {
      router.replace('/parent/dashboard')
    }
  }, [hasLinkedStudent, onEnrollmentOnlyRoute, router])

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

  return (
    <div
      className={`min-h-screen bg-slate-50 font-sans flex flex-col pb-16 md:pb-0 select-none overflow-x-clip transition-[padding] duration-200 ${
        sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
      }`}
    >

      {/* 1. DESKTOP SIDEBAR (fixed, outside the padded flow) */}
      <ParentSidebar />

      {/* 2. TOP BAR */}
      <header className="sticky top-0 bg-white border-b border-slate-100 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Mobile logo (sidebar hidden on mobile) */}
          <Link href="/" className="flex items-center cursor-pointer md:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vidhyaan-logo.svg" alt="Vidhyaan" className="h-8 w-auto" />
          </Link>
          <div className="hidden md:block" />

          {/* Right Header items */}
          <div className="flex items-center gap-4">

            <ParentNotificationBell />

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

      {/* 3. BODY CONTENT */}
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {onEnrollmentOnlyRoute && hasLinkedStudent !== true ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      {/* 4. MOBILE NAV TAB BAR */}
      <ParentMobileNav />

    </div>
  )
}
