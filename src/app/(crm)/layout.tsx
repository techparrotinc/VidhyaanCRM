"use client"

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'
import { useUIStore } from '@/stores/ui.store'
import { Menu, LogOut, User, ShieldAlert } from 'lucide-react'

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, mobileSidebarOpen, toggleMobileSidebar, setMobileSidebarOpen } = useUIStore()
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname, setMobileSidebarOpen])

  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard'
    if (pathname.startsWith('/lead-management')) return 'Lead Management'
    if (pathname.startsWith('/admission-management')) return 'Admission Management'
    if (pathname.startsWith('/student-management')) return 'Student Management'
    if (pathname.startsWith('/fee-management')) return 'Fee Management'
    if (pathname.startsWith('/campaign-management')) return 'Campaigns'
    if (pathname.startsWith('/event-management')) return 'Events'
    if (pathname.startsWith('/reports')) return 'Reports'
    if (pathname.startsWith('/users')) return 'Users'
    if (pathname.startsWith('/roles')) return 'Roles & Permissions'
    if (pathname.startsWith('/settings')) return 'Settings'
    return 'CRM Portal'
  }

  // User details for initials
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
      {/* Dark overlay behind sidebar on mobile */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[90] md:hidden transition-opacity duration-200" 
          onClick={toggleMobileSidebar} 
        />
      )}

      {/* Sidebar container (Desktop fixed, Mobile drawer) */}
      <aside 
        className={`fixed top-0 bottom-0 z-50 h-screen transition-all duration-200 ease-in-out md:block border-r border-[#E2E8F0] bg-white ${
          mobileSidebarOpen ? 'left-0 w-64' : '-left-64 md:left-0'
        }`}
        style={{ width: mobileSidebarOpen ? '256px' : (sidebarCollapsed ? '64px' : '256px') }}
      >
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out min-h-screen ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        } ml-0`}
      >
        {/* Dynamic Top Bar */}
        <header className="h-[60px] bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between sticky top-0 z-40 transition-all duration-200 ease-in-out">
          <div className="flex items-center gap-3">
            {/* Hamburger menu on mobile */}
            <button
              onClick={toggleMobileSidebar}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 md:hidden cursor-pointer focus:outline-none"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 truncate leading-none">
              {getPageTitle()}
            </h2>
          </div>

          {/* Right items: Notification bell + avatar dropdown */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            
            {/* User Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
                className="w-8 h-8 rounded-full bg-[#1565D8] text-white flex items-center justify-center font-bold text-xs shadow-sm hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
              >
                {initials}
              </button>

              {avatarDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAvatarDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100 select-none">
                      <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setAvatarDropdownOpen(false)
                          router.push('/settings/school-profile')
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left focus:outline-none cursor-pointer"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          setAvatarDropdownOpen(false)
                          router.push('/settings/security')
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left focus:outline-none cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-slate-500" />
                        Change PIN
                      </button>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={() => {
                          setAvatarDropdownOpen(false)
                          signOut()
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left focus:outline-none cursor-pointer"
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
          {children}
        </main>
      </div>
    </div>
  )
}
