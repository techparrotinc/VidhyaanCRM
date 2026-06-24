"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  GraduationCap,
  CreditCard,
  Megaphone,
  CalendarDays,
  BarChart2,
  UserCog,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Lock,
  MoreVertical,
  X,
  Crown
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui.store'

interface SidebarProps {
  isMobile?: boolean
  onCloseMobileMenu?: () => void
}

export default function Sidebar({ isMobile = false, onCloseMobileMenu }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const {
    sidebarCollapsed: collapsed,
    toggleSidebar,
    mobileSidebarOpen,
    toggleMobileSidebar
  } = useUIStore()

  const [profileCompletion, setProfileCompletion] = useState<number | null>(null)
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [orgName, setOrgName] = useState('Prince Matriculation')
  const [unreadLeadsCount, setUnreadLeadsCount] = useState(0)

  // Upgrade Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModuleName, setUpgradeModuleName] = useState('')

  // Profile Popover state
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false)

  // Sync document root CSS variable width for layout transition
  useEffect(() => {
    if (!isMobile) {
      document.documentElement.style.setProperty('--sidebar-width', collapsed ? '64px' : '256px')
    }
  }, [collapsed, isMobile])

  // Fetch school details & enabled modules
  useEffect(() => {
    fetch('/api/v1/school-profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.school && typeof data.school.profileCompletion === 'number') {
            setProfileCompletion(data.school.profileCompletion)
          }
          if (data.enabledModules) {
            setEnabledModules(data.enabledModules)
          }
          if (data.orgName) {
            setOrgName(data.orgName)
          }
        }
      })
      .catch(() => {})
  }, [])

  // Fetch unread leads count
  useEffect(() => {
    fetch('/api/v1/dashboard/summary')
      .then(res => res.json())
      .then(data => {
        if (data && data.leads && typeof data.leads.new === 'number') {
          setUnreadLeadsCount(data.leads.new)
        }
      })
      .catch(() => {})
  }, [])

  const isActive = (path: string) => {
    if (!pathname) return false
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname.startsWith(path)
  }

  // Gated module check
  const isModuleLocked = (moduleName?: string) => {
    if (!moduleName) return false
    if (enabledModules.length === 0) return false
    return !enabledModules.includes(moduleName)
  }

  // Navigation Items Specification (11 items)
  const menuItems = [
    // Section 1: Main (No label)
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'Main' },
    { name: 'Lead Management', href: '/lead-management', icon: Users, module: 'lead_management', section: 'Main' },
    { name: 'Admission Management', href: '/admission-management', icon: ClipboardList, module: 'admission_management', section: 'Main' },
    { name: 'Student Management', href: '/student-management', icon: GraduationCap, module: 'student_management', section: 'Main' },
    { name: 'Fee Management', href: '/fee-management', icon: CreditCard, module: 'fee_management', section: 'Main' },
    
    // Section 2: Engagement
    { name: 'Campaigns', href: '/campaign-management', icon: Megaphone, module: 'campaign_management', section: 'Engagement' },
    { name: 'Events', href: '/event-management', icon: CalendarDays, section: 'Engagement' },
    
    // Section 3: Analytics
    { name: 'Reports', href: '/reports', icon: BarChart2, module: 'advanced_reports', section: 'Analytics' },
    
    // Section 4: Team
    { name: 'Users', href: '/users', icon: UserCog, section: 'Team', roles: ['ORG_ADMIN', 'BRANCH_ADMIN'] },
    { name: 'Roles', href: '/roles', icon: ShieldCheck, section: 'Team', roles: ['ORG_ADMIN'] },
    
    // Section 5: Configuration
    { name: 'Settings', href: '/settings', icon: Settings, section: 'Configuration' }
  ]

  const userRole = session?.user?.role || 'SCHOOL_ADMIN'

  // Filter items based on user roles
  const filteredItems = menuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(userRole)
  })

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

  const renderSectionHeader = (sectionName: string) => {
    if (sectionName === 'Main') return null
    if (collapsed && !isMobile) return <div className="border-t border-slate-100 my-3 mx-2" />

    let color = '#1565D8'
    if (sectionName === 'Engagement') color = '#D97706'
    else if (sectionName === 'Analytics') color = '#7C3AED'
    else if (sectionName === 'Team') color = '#059669'

    return (
      <div 
        className="text-[10px] font-bold uppercase tracking-[0.08em] px-4 pt-4 pb-1 select-none"
        style={{ color }}
      >
        {sectionName}
      </div>
    )
  }

  const renderNavItem = (item: typeof menuItems[0]) => {
    const active = isActive(item.href)
    const locked = isModuleLocked(item.module)

    const Icon = item.icon

    const handleClick = (e: React.MouseEvent) => {
      if (locked) {
        e.preventDefault()
        setUpgradeModuleName(item.name)
        setShowUpgradeModal(true)
        return
      }
      if (isMobile && onCloseMobileMenu) {
        onCloseMobileMenu()
      }
    }

    if (collapsed && !isMobile) {
      // Collapsed state designs (64px wide sidebar layout)
      return (
        <div className="relative group my-0.5" key={item.href}>
          <Link
            href={item.href}
            onClick={handleClick}
            className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all duration-150 ${
              active
                ? 'bg-[#EFF6FF] text-[#1565D8] border-l-[3px] border-[#1565D8] rounded-l-none rounded-r-[10px]'
                : locked
                ? 'text-[#CBD5E1] cursor-not-allowed'
                : 'text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#1565D8]'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
              {/* Notification Badge on Lead Management only */}
              {item.href === '/lead-management' && unreadLeadsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border border-white">
                  {unreadLeadsCount > 99 ? '99+' : unreadLeadsCount}
                </span>
              )}
            </div>
          </Link>

          {/* Tooltip on right side */}
          <div className="absolute left-16 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 ml-1">
            <div className="w-1.5 h-1.5 bg-white border-l border-b border-[#E2E8F0] rotate-45 -mr-[4px] z-10" />
            <div className="bg-white border border-[#E2E8F0] text-slate-700 text-[13px] font-medium rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap flex items-center gap-1.5">
              {item.name}
              {locked && <Lock className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0" />}
            </div>
          </div>
        </div>
      )
    }

    // Expanded state nav item design
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleClick}
        className={`flex items-center gap-3 h-[42px] transition-all duration-150 relative ${
          active
            ? 'bg-[#EFF6FF] text-[#1565D8] border-l-[3px] border-[#1565D8] rounded-l-none rounded-r-lg pl-[15px] pr-2 ml-0 mr-2 w-[calc(100%-8px)] font-semibold'
            : locked
            ? 'text-[#94A3B8] cursor-not-allowed pl-3 pr-2 mx-2 rounded-lg'
            : 'text-[#475569] hover:bg-[#EFF6FF] hover:text-[#1565D8] pl-3 pr-2 mx-2 rounded-lg font-medium'
        }`}
        style={{ fontSize: '13.5px' }}
      >
        <div className="relative flex-shrink-0">
          <Icon 
            className={`w-[18px] h-[18px] shrink-0 transition-colors duration-150 ${
              active
                ? 'text-[#1565D8]'
                : locked
                ? 'text-[#CBD5E1]'
                : 'text-[#64748B] hover:text-[#1565D8]'
            }`} 
            strokeWidth={1.5}
          />
          {/* Notification Badge on Lead Management only */}
          {item.href === '/lead-management' && unreadLeadsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border border-white">
              {unreadLeadsCount > 99 ? '99+' : unreadLeadsCount}
            </span>
          )}
        </div>
        <span className="truncate flex-1">{item.name}</span>
        {locked && <Lock className="w-3 h-3 text-[#CBD5E1] shrink-0" />}
      </Link>
    )
  }

  // Render navigation group logically ordered
  const renderedGroups: React.ReactNode[] = []
  const sections = ['Main', 'Engagement', 'Analytics', 'Team', 'Configuration']
  
  sections.forEach(sec => {
    const secItems = filteredItems.filter(item => item.section === sec)
    if (secItems.length > 0) {
      renderedGroups.push(
        <div key={sec} className="space-y-0.5">
          {renderSectionHeader(sec)}
          {secItems.map(item => renderNavItem(item))}
        </div>
      )
    }
  })

  return (
    <div className="flex flex-col h-full bg-white select-none relative w-full border-r border-[#E2E8F0]">
      {/* Self-contained scrollbar styles */}
      <style>{`
        .sidebar-nav-container::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-nav-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-nav-container::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 2px;
        }
        .sidebar-nav-container::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}</style>

      {/* Toggle Button - Absolute right edge of sidebar */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center cursor-pointer transition-all z-50 focus:outline-none group/toggle hover:border-[#1565D8] hover:shadow-md"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <ChevronLeft 
            className={`w-3.5 h-3.5 text-[#64748B] group-hover/toggle:text-[#1565D8] transition-transform duration-200 ${
              collapsed ? 'rotate-180' : 'rotate-0'
            }`} 
          />
        </button>
      )}

      {/* Sidebar Header */}
      <div className="bg-white p-4 border-b border-[#F1F5F9] shrink-0">
        <div className={`flex items-center gap-3 ${!isMobile && collapsed ? "justify-center" : ""}`}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[#1565D8] shrink-0">
            <Shield className="w-7 h-7 fill-[#1565D8]" strokeWidth={1.5} />
          </div>
          <span className={`text-[15px] font-bold text-slate-900 transition-opacity duration-200 ${!isMobile && collapsed ? "hidden" : "inline"}`}>
            Vidhyaan
          </span>
        </div>
        {(!isMobile && collapsed) ? null : (
          <div className="text-xs text-slate-400 mt-2 truncate w-full max-w-[220px]">
            {orgName}
          </div>
        )}
      </div>

      {/* Navigation Middle Container (Scrollable) */}
      <div className="flex-1 overflow-y-auto sidebar-nav-container py-4 space-y-4 px-2">
        {renderedGroups}
      </div>

      {/* Bottom User Profile Section */}
      <div className="border-t border-[#F1F5F9] bg-[#FAFAFA] py-3 px-4 shrink-0 relative">
        {!isMobile && collapsed ? (
          // Collapsed state footer
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={() => setProfilePopoverOpen(!profilePopoverOpen)}
              className="relative w-9 h-9 rounded-full bg-[#1565D8] hover:bg-blue-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-all focus:outline-none cursor-pointer group/avatar"
              title={name}
            >
              {initials}
              
              {/* Tooltip on hover */}
              <div className="absolute left-14 top-1/2 -translate-y-1/2 hidden group-hover/avatar:flex items-center z-50 ml-1">
                <div className="w-1.5 h-1.5 bg-white border-l border-b border-[#E2E8F0] rotate-45 -mr-[4px] z-10" />
                <div className="bg-white border border-[#E2E8F0] text-slate-700 text-[13px] font-medium rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
                  {name}
                </div>
              </div>
            </button>

            {/* Popup Menu */}
            {profilePopoverOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfilePopoverOpen(false)} />
                <div className="absolute left-[64px] bottom-0 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-3 z-50 animate-fade-in">
                  <div className="px-4 pb-2 border-b border-slate-100 select-none">
                    <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{email}</p>
                  </div>
                  <div className="py-1 text-left">
                    <Link
                      href="/settings/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setProfilePopoverOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        setProfilePopoverOpen(false)
                        signOut()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left focus:outline-none cursor-pointer font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          // Expanded state footer
          <>
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#1565D8] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-slate-800 truncate leading-tight">{name}</span>
                  <span className="text-xs text-slate-400 truncate mt-0.5">{email}</span>
                </div>
              </div>
              
              <button
                onClick={() => setProfilePopoverOpen(!profilePopoverOpen)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer focus:outline-none"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown Menu */}
            {profilePopoverOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfilePopoverOpen(false)} />
                <div className="absolute right-4 bottom-14 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                  <Link
                    href="/settings/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-none border-0"
                    onClick={() => setProfilePopoverOpen(false)}
                  >
                    View Profile
                  </Link>
                  <Link
                    href="/settings/security"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setProfilePopoverOpen(false)}
                  >
                    Change PIN
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => {
                      setProfilePopoverOpen(false)
                      signOut()
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left focus:outline-none cursor-pointer font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Upgrade Premium Gated Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-left">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 mb-4 animate-bounce">
              <Crown className="w-6 h-6" />
            </div>

            <h4 className="text-lg font-bold text-slate-900 mb-1">Upgrade to Premium</h4>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              The <span className="font-semibold text-slate-800">{upgradeModuleName}</span> module is only available on our Premium Plan. Upgrade now to unlock automated management, fee collections, event features, campaign marketing, and advanced reporting.
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 focus:ring-0"
              >
                Cancel
              </Button>
              <Link href="/settings/billing" onClick={() => setShowUpgradeModal(false)}>
                <Button className="bg-[#1565D8] text-white hover:bg-blue-700 focus:ring-0">
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
