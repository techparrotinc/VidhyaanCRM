"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Globe,
  TrendingUp,
  LineChart,
  ClipboardList,
  Users,
  CreditCard,
  UserCog,
  ChevronDown,
  Shield
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { config } from '@/lib/admission-settings-config'

interface SidebarProps {
  isMobile?: boolean
  onCloseMobileMenu?: () => void
}

export default function Sidebar({ isMobile = false, onCloseMobileMenu }: SidebarProps) {
  const pathname = usePathname()
  const type = config.institutionType

  const [salesExpanded, setSalesExpanded] = useState(
    pathname ? (pathname.startsWith('/lead-management') || pathname.startsWith('/admission-management')) : false
  )

  React.useEffect(() => {
    if (pathname && (pathname.startsWith('/lead-management') || pathname.startsWith('/admission-management'))) {
      setSalesExpanded(true)
    }
  }, [pathname])

  const isActive = (path: string) => {
    if (!pathname) return false
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const handleLinkClick = () => {
    if (isMobile && onCloseMobileMenu) {
      onCloseMobileMenu()
    }
  }

  const navLinkClass = (path: string) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
      !isMobile ? 'md:px-0 md:justify-center lg:px-4 lg:justify-start' : ''
    } ${
      isActive(path)
        ? 'bg-blue-50 text-[#1565D8] font-semibold'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
    }`

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Top Brand Section */}
      <div className={`flex items-center gap-3 px-6 pt-6 pb-2 ${!isMobile ? "md:px-3 lg:px-6 md:justify-center lg:justify-start" : ""}`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] shrink-0">
          <Shield className="w-8 h-8 fill-[#1565D8]" strokeWidth={1.5} />
        </div>
        <div className={`flex flex-col min-w-0 ${!isMobile ? "md:hidden lg:flex" : ""}`}>
          <h1 className="text-[15px] font-bold text-slate-800 truncate leading-tight font-sans">
            Prince Matriculation
          </h1>
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold font-sans">School Admin Portal</span>
        </div>
      </div>
      <div className={`border-b border-slate-200 mt-4 mb-4 mx-4 ${!isMobile ? "md:mx-2 lg:mx-4" : ""}`} />

      {/* Navigation list */}
      <div className="flex-1 px-2 overflow-y-auto space-y-1">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={navLinkClass('/dashboard')}
          onClick={handleLinkClick}
          title="Dashboard"
        >
          <LayoutDashboard className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Dashboard</span>
        </Link>

        {/* Site Manager */}
        <Link
          href="/site-manager"
          className={navLinkClass('/site-manager')}
          onClick={handleLinkClick}
          title="Site Manager"
        >
          <Globe className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Site Manager</span>
        </Link>

        {/* Sales & Marketing (Collapsible) */}
        <div>
          <button
            onClick={() => setSalesExpanded(!salesExpanded)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              !isMobile ? "md:px-0 md:justify-center lg:px-4 lg:justify-start" : ""
            } ${
              salesExpanded || isActive('/lead-management') || isActive('/admission-management')
                ? 'text-[#1565D8] font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Sales & Marketing"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="size-[18px] shrink-0" strokeWidth={1.5} />
              <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Sales & Marketing</span>
            </div>
            <ChevronDown className={`size-[14px] transition-transform duration-200 ${salesExpanded ? 'rotate-180' : ''} ${!isMobile ? "md:hidden lg:block" : ""}`} />
          </button>

          {salesExpanded && (
            <div className={`mt-1 space-y-1 ${!isMobile ? "md:pl-0 md:pr-0 md:flex md:flex-col md:items-center lg:pl-6 lg:pr-2 lg:block" : "pl-6 pr-2"}`}>
              {/* Lead Management */}
              <Link
                href="/lead-management"
                className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  !isMobile ? "md:justify-center lg:pl-4 lg:justify-start" : "pl-4"
                } ${
                  isActive('/lead-management')
                    ? 'bg-blue-50 text-[#1565D8] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={handleLinkClick}
                title="Lead Management"
              >
                <LineChart className="size-[16px] shrink-0" strokeWidth={1.5} />
                <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Lead Management</span>
              </Link>

              {/* Admission Management */}
              <Link
                href="/admission-management"
                className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  !isMobile ? "md:justify-center lg:pl-4 lg:justify-start" : "pl-4"
                } ${
                  isActive('/admission-management')
                    ? 'bg-blue-50 text-[#1565D8] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={handleLinkClick}
                title={config.moduleLabel[type]}
              >
                <ClipboardList className="size-[16px] shrink-0" strokeWidth={1.5} />
                <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>{config.moduleLabel[type]}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Student Management */}
        <Link
          href="/student-management"
          className={navLinkClass('/student-management')}
          onClick={handleLinkClick}
          title="Student Management"
        >
          <Users className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Student Management</span>
        </Link>

        {/* Fee Management */}
        <Link
          href="/fee-management"
          className={navLinkClass('/fee-management')}
          onClick={handleLinkClick}
          title="Fee Management"
        >
          <CreditCard className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>Fee Management</span>
        </Link>

        {/* User & Role Management */}
        <Link
          href="/user-role-management"
          className={navLinkClass('/user-role-management')}
          onClick={handleLinkClick}
          title="User & Role Management"
        >
          <UserCog className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className={`${!isMobile ? "md:hidden lg:inline" : ""}`}>User & Role Management</span>
        </Link>
      </div>

      {/* Sidebar Footer - Plan Status */}
      <div className={`mt-auto pt-4 border-t border-slate-200 p-4 bg-slate-50/50 flex flex-col gap-2 ${!isMobile ? "md:p-1 md:items-center lg:p-4 lg:items-start" : ""}`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest text-slate-500 ${!isMobile ? "md:hidden lg:block" : ""}`}>PLAN STATUS</span>
        <Badge className={`bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full w-fit hover:bg-amber-100 border-0 shadow-none ${!isMobile ? "md:hidden lg:flex" : ""}`}>
          Free Plan
        </Badge>
        <p className={`text-xs text-slate-500 mt-1 leading-relaxed ${!isMobile ? "md:hidden lg:block" : ""}`}>
          Unlock all premium features like Lead automation & fee collections.
        </p>
        <Button className={`w-full bg-[#1565D8] text-white text-sm font-semibold py-2.5 h-auto rounded-lg mt-2 hover:bg-blue-700 transition duration-200 ${!isMobile ? "md:hidden lg:flex" : ""}`}>
          Upgrade to Premium
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return sidebarContent
  }

  return (
    <aside className="hidden md:flex w-16 lg:w-64 fixed inset-y-0 left-0 border-r border-slate-200 bg-white z-30 shadow-sm flex-col">
      {sidebarContent}
    </aside>
  )
}
