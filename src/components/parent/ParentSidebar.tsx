'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { useUIStore } from '@/stores/ui.store'
import { visibleParentNav } from './parentNav'
import { useParentAccess } from './ParentAccessContext'

/**
 * Desktop-only collapsible left sidebar for the parent portal.
 * Light theme (white / brand blue) — intentionally distinct from the
 * dark CRM staff sidebar.
 */
export default function ParentSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const collapsed = useUIStore((s) => s.parentSidebarCollapsed)
  const toggle = useUIStore((s) => s.toggleParentSidebar)
  const { hasLinkedStudent } = useParentAccess()
  // Default to the minimal (discovery) nav until the scope probe resolves.
  const navItems = visibleParentNav(hasLinkedStudent === true)

  const parentName = session?.user?.name || 'Parent User'
  const parentInitials = parentName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <aside
      className={`hidden md:flex fixed inset-y-0 left-0 z-40 flex-col bg-white border-r border-slate-200 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-slate-100 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        <Link href="/" className="flex items-center cursor-pointer">
          {collapsed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/brand/vidhyaan-icon.svg" alt="Vidhyaan" className="h-8 w-8" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/brand/vidhyaan-logo.svg" alt="Vidhyaan" className="h-8 w-auto" />
          )}
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-blue-50 text-[#1565D8] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#1565D8]'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.2 : 2} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle — floating chevron on the sidebar edge */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-[72px] z-50 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-400 hover:text-[#1565D8] hover:border-blue-200 transition cursor-pointer"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
        )}
      </button>

      {/* Profile block */}
      <div className={`border-t border-slate-100 p-3 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow shrink-0">
          {parentInitials}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">{parentName}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">{session?.user?.email || session?.user?.phone || ''}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
