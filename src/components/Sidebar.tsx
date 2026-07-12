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
  CalendarCheck,
  BarChart2,
  UserCog,
  ShieldCheck,
  Settings,
  ListChecks,
  ChevronLeft,
  ChevronRight,
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
    toggleMobileSidebar,
    closeMobileSidebar
  } = useUIStore()

  const [profileCompletion, setProfileCompletion] = useState<number | null>(null)
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [orgName, setOrgName] = useState('')
  const [unreadLeadsCount, setUnreadLeadsCount] = useState(0)
  const [setupPct, setSetupPct] = useState<number | null>(null)

  // Upgrade Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModuleName, setUpgradeModuleName] = useState('')

  // Profile Popover state
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false)

  // Effectively collapsed only when collapsed is true AND we are not on mobile
  const isCollapsed = collapsed && !isMobile

  // Sync document root CSS variable width for layout transition on desktop
  useEffect(() => {
    if (!isMobile) {
      document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '64px' : '256px')
    }
  }, [isCollapsed, isMobile])

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
      .catch(() => { })
  }, [])

  // Fetch setup checklist progress (admins only; API 403s for other roles)
  useEffect(() => {
    fetch('/api/v1/setup/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data && typeof data.data.pct === 'number') {
          setSetupPct(data.data.pct)
        }
      })
      .catch(() => { })
  }, [])

  // Fetch unread leads count
  useEffect(() => {
    fetch('/api/v1/dashboard/summary')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.leads && typeof data.leads.new === 'number') {
          setUnreadLeadsCount(data.leads.new)
        }
      })
      .catch(() => { })
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
    { name: 'Attendance', href: '/attendance', icon: CalendarCheck, module: 'attendance', section: 'Main', roles: ['ORG_ADMIN', 'BRANCH_ADMIN', 'TEACHER'] },

    // Section 2: Engagement
    { name: 'Campaigns', href: '/campaign-management', icon: Megaphone, module: 'campaign_management', section: 'Engagement' },
    { name: 'Events', href: '/event-management', icon: CalendarDays, section: 'Engagement' },

    // Section 3: Analytics
    { name: 'Reports', href: '/reports', icon: BarChart2, module: 'advanced_reports', section: 'Analytics' },

    // Section 4: Team
    { name: 'Users', href: '/users', icon: UserCog, section: 'Team', roles: ['ORG_ADMIN', 'BRANCH_ADMIN'] },
    { name: 'Roles', href: '/roles', icon: ShieldCheck, section: 'Team', roles: ['ORG_ADMIN'] },

    // Section 5: Configuration
    // Setup checklist link shows for admins until every step is done
    ...(setupPct !== null && setupPct < 100
      ? [{ name: 'Setup', href: '/setup', icon: ListChecks, section: 'Configuration', roles: ['ORG_ADMIN', 'BRANCH_ADMIN'] }]
      : []),
    { name: 'Settings', href: '/settings', icon: Settings, section: 'Configuration' }
  ]

  const userRole = session?.user?.role || 'SCHOOL_ADMIN'

  // Filter items based on user roles
  const filteredItems = menuItems.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(userRole)
  })

  // User details
  const user = session?.user
  const name = user?.name || "Admin"
  const email = user?.email || "admin@vidhyaan.com"
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const renderSectionHeader = (sectionName: string) => {
    if (sectionName === 'Main') return null

    // Collapsed divider
    if (isCollapsed) {
      return (
        <div
          className="h-[1px] bg-[#334155] mx-auto my-2"
          style={{ width: '32px' }}
        />
      )
    }

    // Color-coded section labels
    let color = '#60A5FA'
    if (sectionName === 'Engagement') color = '#FBBF24'
    else if (sectionName === 'Analytics') color = '#A78BFA'
    else if (sectionName === 'Team') color = '#34D399'

    const marginTop = sectionName === 'Engagement' ? '8px' : '16px'

    return (
      <div
        className="text-[10px] font-bold uppercase tracking-[0.1em] select-none"
        style={{ color, marginTop, padding: '8px 16px 4px' }}
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
      closeMobileSidebar()
      if (onCloseMobileMenu) {
        onCloseMobileMenu()
      }
    }

    if (isCollapsed) {
      // Collapsed design (64px sidebar icons only)
      let collapsedItemClass = "w-10 h-10 rounded-[10px] flex items-center justify-center mx-auto transition-all duration-150 ease-in-out cursor-pointer group my-[2px]"
      let collapsedIconClass = "w-5 h-5 shrink-0 transition-colors duration-150"

      if (active) {
        collapsedItemClass += " bg-[#1565D8] text-white"
        collapsedIconClass += " text-white"
      } else if (locked) {
        collapsedItemClass += " text-[#475569] cursor-not-allowed"
        collapsedIconClass += " text-[#475569]"
      } else {
        collapsedItemClass += " bg-transparent text-[#94A3B8] hover:bg-[#334155] hover:text-[#E2E8F0]"
        collapsedIconClass += " text-[#94A3B8] group-hover:text-[#E2E8F0]"
      }

      return (
        <div className="relative group my-0.5" key={item.href}>
          <Link
            href={item.href}
            onClick={handleClick}
            className={collapsedItemClass}
          >
            <div className="relative">
              <Icon className={collapsedIconClass} strokeWidth={1.5} />
              {/* Notification Badge on Lead Management only */}
              {item.href === '/lead-management' && unreadLeadsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border border-[#1E293B]">
                  {unreadLeadsCount > 99 ? '99+' : unreadLeadsCount}
                </span>
              )}
              {/* Profile Completion Badge on Site Manager */}
              {item.href === '/settings/school-profile' && profileCompletion !== null && (
                <span className="absolute -top-1.5 -right-3 px-1 py-0.5 bg-blue-600 rounded text-[8px] text-white font-bold border border-[#1E293B]">
                  {profileCompletion}%
                </span>
              )}
            </div>
          </Link>

          {/* Tooltip on right side */}
          <div className="absolute left-[56px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-[100] pointer-events-none ml-1">
            <div className="w-1.5 h-1.5 bg-[#0F172A] border-l border-b border-[#334155] rotate-45 -mr-[4px] z-10" />
            <div className="bg-[#0F172A] border border-[#334155] text-[#F1F5F9] text-[13px] font-medium rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap flex items-center gap-1.5">
              {item.name}
              {item.href === '/settings/school-profile' && profileCompletion !== null && (
                <span className="text-[#60A5FA] font-bold text-xs ml-1">({profileCompletion}%)</span>
              )}
              {locked && <Lock className="w-3.5 h-3.5 text-[#475569] shrink-0" />}
            </div>
          </div>
        </div>
      )
    }

    // Expanded design
    let itemClass = "flex items-center gap-[10px] h-[40px] px-3 my-[1px] mx-2 rounded-lg cursor-pointer transition-all duration-150 ease-in-out group"
    let iconClass = "w-[18px] h-[18px] shrink-0 transition-colors duration-150"

    if (active) {
      itemClass += " bg-[#1565D8] text-white font-semibold"
      iconClass += " text-white"
    } else if (locked) {
      itemClass += " text-[#475569] cursor-not-allowed"
      iconClass += " text-[#475569]"
    } else {
      itemClass += " bg-transparent text-[#CBD5E1] font-medium hover:bg-[#334155] hover:text-[#F1F5F9]"
      iconClass += " text-[#94A3B8] group-hover:text-[#E2E8F0]"
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleClick}
        className={itemClass}
        style={{ fontSize: '13.5px' }}
      >
        <div className="relative flex-shrink-0">
          <Icon className={iconClass} strokeWidth={1.5} />
          {/* Notification Badge on Lead Management only */}
          {item.href === '/lead-management' && unreadLeadsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border border-[#1E293B]">
              {unreadLeadsCount > 99 ? '99+' : unreadLeadsCount}
            </span>
          )}
        </div>
        <span className="truncate flex-1">{item.name}</span>
        {item.href === '/settings/school-profile' && profileCompletion !== null && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
            active 
              ? 'bg-white/20 text-white border-white/30' 
              : 'bg-[#1565D8]/20 text-[#60A5FA] border-[#1565D8]/30'
          }`}>
            {profileCompletion}%
          </span>
        )}
        {locked && <Lock className="w-3 h-3 text-[#475569] shrink-0" />}
      </Link>
    )
  }

  // Render navigation group logically ordered
  const renderedGroups: React.ReactNode[] = []
  const sections = ['Main', 'Engagement', 'Analytics', 'Team', 'Configuration']

  sections.forEach((sec) => {
    const secItems = filteredItems.filter((item) => item.section === sec)
    if (secItems.length > 0) {
      renderedGroups.push(
        <div key={sec} className="space-y-0.5">
          {renderSectionHeader(sec)}
          {secItems.map((item) => renderNavItem(item))}
        </div>
      )
    }
  })

  return (
    <div className="flex flex-col h-full bg-[#1E293B] select-none relative w-full border-r border-[#334155]">
      {/* Self-contained scrollbar styles */}
      <style>{`
        .sidebar-nav-container::-webkit-scrollbar {
          width: 3px;
        }
        .sidebar-nav-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-nav-container::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 1.5px;
        }
      `}</style>

      {/* Header Section */}
      <div className="h-16 px-4 border-b border-[#334155] flex items-center justify-between shrink-0 bg-[#1E293B] relative">
        {isCollapsed ? (
          <div className="w-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vidhyaan-icon-white.svg" alt="Vidhyaan" className="w-7 h-7 shrink-0" />
          </div>
        ) : (
          <div className="flex items-center min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/vidhyaan-logo-white.svg" alt="Vidhyaan" className="h-7 w-auto" />
          </div>
        )}

        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center cursor-pointer transition-colors duration-150 focus:outline-none group/toggle hover:border-[#60A5FA] z-50 shadow-md"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover/toggle:text-[#60A5FA] transition-colors" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 text-[#94A3B8] group-hover/toggle:text-[#60A5FA] transition-colors" />
            )}
          </button>
        )}
      </div>

      {/* School Name row (Expanded Only) */}
      {!isCollapsed && orgName && (
        <div className="px-4 py-2 text-xs text-[#94A3B8] truncate bg-[#1E293B] border-b border-[#334155] w-full select-none shrink-0 font-medium">
          {orgName}
        </div>
      )}

      {/* Navigation Middle Container (Scrollable) */}
      <div className="flex-1 overflow-y-auto sidebar-nav-container p-2 space-y-0.5">
        {renderedGroups}
      </div>

      {/* Bottom User Section */}
      <div className="border-t border-[#334155] bg-[#0F172A] py-3 px-4 shrink-0 relative">
        {isCollapsed ? (
          // Collapsed state footer
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={() => setProfilePopoverOpen(!profilePopoverOpen)}
              className="relative w-9 h-9 rounded-full bg-[#1565D8] hover:opacity-90 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-all focus:outline-none cursor-pointer group/avatar"
            >
              {initials}

              {/* Tooltip on hover */}
              {!profilePopoverOpen && (
                <div className="absolute left-14 top-1/2 -translate-y-1/2 hidden group-hover/avatar:flex items-center z-50 ml-1 pointer-events-none">
                  <div className="w-1.5 h-1.5 bg-[#0F172A] border-l border-b border-[#334155] rotate-45 -mr-[4px] z-10" />
                  <div className="bg-[#0F172A] border border-[#334155] text-[#F1F5F9] text-[13px] font-medium rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
                    {name}
                  </div>
                </div>
              )}
            </button>

            {/* Popup Menu */}
            {profilePopoverOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfilePopoverOpen(false)} />
                <div className="absolute left-[56px] bottom-0 w-56 bg-[#1E293B] border border-[#334155] rounded-xl shadow-xl py-3 z-50 animate-fade-in text-left">
                  <div className="px-4 pb-2 border-b border-[#334155] select-none">
                    <p className="text-sm font-semibold text-white truncate">{name}</p>
                    <p className="text-xs text-[#94A3B8] truncate mt-0.5">{email}</p>
                  </div>
                  <div className="py-1 text-left">
                    <Link
                      href="/settings/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-[#60A5FA] hover:bg-[#334155] transition-colors"
                      onClick={() => setProfilePopoverOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        setProfilePopoverOpen(false)
                        signOut()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#F87171] hover:bg-[#334155] transition-colors text-left focus:outline-none cursor-pointer font-medium"
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
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-[#1565D8] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {initials}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-[#F1F5F9] truncate leading-tight">{name}</span>
                  <span className="text-xs text-[#64748B] truncate mt-0.5">{email}</span>
                </div>
              </div>

              <button
                onClick={() => setProfilePopoverOpen(!profilePopoverOpen)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#94A3B8] transition-colors cursor-pointer focus:outline-none shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown Menu */}
            {profilePopoverOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfilePopoverOpen(false)} />
                <div className="absolute right-4 bottom-14 w-48 bg-[#1E293B] border border-[#334155] rounded-xl shadow-xl py-2 z-50 animate-fade-in text-left">
                  <Link
                    href="/settings/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#60A5FA] hover:bg-[#334155] transition-colors"
                    onClick={() => setProfilePopoverOpen(false)}
                  >
                    View Profile
                  </Link>
                  <Link
                    href="/settings/security"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#CBD5E1] hover:bg-[#334155] transition-colors"
                    onClick={() => setProfilePopoverOpen(false)}
                  >
                    Change PIN
                  </Link>
                  <div className="border-t border-[#334155] my-1" />
                  <button
                    onClick={() => {
                      setProfilePopoverOpen(false)
                      signOut()
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#F87171] hover:bg-[#334155] transition-colors text-left focus:outline-none cursor-pointer font-medium"
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
