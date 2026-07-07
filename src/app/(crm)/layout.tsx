"use client"

import React, { useState, useEffect } from 'react'
import { SWRConfig } from 'swr'
import { fetcher } from '@/lib/fetcher'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'
import { RouteLoader } from '@/components/shared/RouteLoader'
import { ConfirmProvider } from '@/components/ui/confirm-dialog'
import { useUIStore } from '@/stores/ui.store'
import { useAcademicYearStore } from '@/stores/academic-year.store'
import { useAcademicYears } from '@/hooks/useAcademicYears'
import { Menu, LogOut, User, Settings, Calendar, ChevronDown } from 'lucide-react'

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, mobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar } = useUIStore()
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false)
  const [ayDropdownOpen, setAyDropdownOpen] = useState(false)
  const { years } = useAcademicYears()
  const { selectedYearId, selectedYearName, setYear } = useAcademicYearStore()

  // Default the switcher to the org's active year; heal stale selections
  // (e.g. a year deleted in settings)
  useEffect(() => {
    if (years.length === 0) return
    const selectionValid = selectedYearId && years.some((y: any) => y.id === selectedYearId)
    if (!selectionValid) {
      const active = years.find((y: any) => y.status === 'ACTIVE') ?? years[0]
      setYear(active.id, active.name)
    }
  }, [years, selectedYearId, setYear])

  const academicYear = selectedYearName ?? 'Academic Year'
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobileSidebar()
  }, [pathname, closeMobileSidebar])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getPageTitle = () => {
    if (!pathname) return 'CRM Portal'
    if (pathname.startsWith('/dashboard')) return 'Dashboard'
    if (pathname.startsWith('/lead-management')) return 'Lead Management'
    if (pathname.startsWith('/admission-management')) return 'Admission Management'
    if (pathname.startsWith('/student-management')) return 'Student Management'
    if (pathname.startsWith('/fee-management')) return 'Fee Management'
    if (pathname.startsWith('/campaign-management')) return 'Campaigns'
    if (pathname.startsWith('/event-management')) return 'Events'
    if (pathname.startsWith('/reports')) return 'Reports'
    if (pathname.startsWith('/users')) return 'Team Members'
    if (pathname.startsWith('/roles')) return 'Roles & Permissions'
    if (pathname.startsWith('/settings')) return 'Settings'
    return 'CRM Portal'
  }

  // User details
  const user = session?.user
  const name = user?.name || "School Admin"
  const email = user?.email || "admin@vidhyaan.com"
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex relative font-sans antialiased">
      <RouteLoader />
      {/* Dark overlay behind sidebar on mobile */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-200" 
          onClick={closeMobileSidebar} 
        />
      )}

      {/* Sidebar container (Desktop fixed, Mobile drawer) */}
      <aside 
        className={`fixed top-0 bottom-0 z-50 h-screen transition-all duration-300 md:duration-200 ease-in-out md:block border-r border-[#334155] bg-[#1E293B] ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ width: mobileSidebarOpen ? '256px' : (sidebarCollapsed ? '64px' : '256px') }}
      >
        <Sidebar isMobile={isMobile} />
      </aside>

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out min-h-screen ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        } ml-0`}
      >
        {/* Dynamic Top Bar */}
        <header className="h-[60px] bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger menu on mobile */}
            <button
              onClick={toggleMobileSidebar}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 md:hidden cursor-pointer focus:outline-none"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col text-left">
              <span className="text-sm text-slate-600">
                {getGreeting()}, {session?.user?.name ? session.user.name.split(' ')[0] : 'Admin'} 👋
              </span>
            </div>
          </div>

          {/* Right items: Academic year switcher + Notification bell + avatar dropdown */}
          <div className="flex items-center gap-4">
            
            {/* Academic Year Switcher */}
            <div className="relative">
              <button
                onClick={() => setAyDropdownOpen(!ayDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{academicYear}</span>
                <ChevronDown className="w-3 h-3 text-slate-500 transition-transform duration-200" style={{ transform: ayDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {ayDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAyDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-36 bg-white border border-[#E2E8F0] rounded-lg shadow-lg py-1 z-50 text-left animate-fade-in">
                    {years.length === 0 && (
                      <p className="px-3 py-1.5 text-xs text-slate-400">No academic years</p>
                    )}
                    {years.map((year: any) => (
                      <button
                        key={year.id}
                        onClick={() => {
                          setYear(year.id, year.name)
                          setAyDropdownOpen(false)
                        }}
                        className={`w-full px-3 py-1.5 text-xs text-left transition-colors hover:bg-slate-50 ${
                          selectedYearId === year.id ? 'text-[#1565D8] font-bold bg-blue-50/50' : 'text-slate-600'
                        }`}
                      >
                        {year.name}
                        {year.status === 'ACTIVE' && <span className="ml-1 text-[10px] text-green-600">●</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <NotificationBell />
            
            {/* User Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                className="w-9 h-9 rounded-full bg-[#1565D8] text-white flex items-center justify-center font-bold text-xs shadow-sm hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
              >
                {initials}
              </button>

              {avatarDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAvatarDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-2 z-50 animate-fade-in text-left">
                    <div className="px-4 py-2 border-b border-slate-100 select-none flex flex-col gap-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
                      <div>
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-[#1565D8] rounded-full uppercase tracking-wider">
                          {session?.user?.role || 'Admin'}
                        </span>
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setAvatarDropdownOpen(false)
                          router.push('/settings/profile')
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left focus:outline-none cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          setAvatarDropdownOpen(false)
                          router.push('/settings')
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left focus:outline-none cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        Settings
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={() => {
                          setAvatarDropdownOpen(false)
                          signOut()
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left focus:outline-none cursor-pointer font-medium"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content View */}
        <main className="flex-1 relative z-10 overflow-y-auto">
          <SWRConfig
            value={{
              fetcher,
              revalidateOnFocus: false,
              revalidateOnReconnect: false,
              shouldRetryOnError: false,
              dedupingInterval: 30000,
            }}
          >
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </SWRConfig>
        </main>
      </div>
    </div>
  )
}
