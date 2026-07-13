'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { MoreHorizontal, LogOut, X } from 'lucide-react'
import { parentNavItems } from './parentNav'

/**
 * Mobile bottom tab bar: 4 ranked tabs + a "More" sheet holding the rest.
 * Desktop navigation lives in ParentSidebar.
 */
export default function ParentMobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  // Close the sheet whenever the route changes
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  const tabs = parentNavItems
    .filter((i) => i.mobileRank)
    .sort((a, b) => (a.mobileRank! - b.mobileRank!))
  const moreItems = parentNavItems.filter((i) => !i.mobileRank)
  const moreActive = moreItems.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'))

  return (
    <>
      {/* More sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-4 pb-8 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between px-2 pb-3 border-b border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">More</p>
              <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-4">
              {moreItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 px-1 transition ${
                      isActive ? 'bg-blue-50 text-[#1565D8]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-semibold text-center leading-tight">
                      {item.mobileLabel || item.label}
                    </span>
                  </Link>
                )
              })}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex flex-col items-center gap-1.5 rounded-2xl py-3 px-1 text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/70 z-40 flex md:hidden items-center justify-around px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        {tabs.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? 'text-[#1565D8]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase mt-1 tracking-wider">
                {item.mobileLabel || item.label}
              </span>
            </Link>
          )
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            moreActive || moreOpen ? 'text-[#1565D8]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase mt-1 tracking-wider">More</span>
        </button>
      </nav>
    </>
  )
}
