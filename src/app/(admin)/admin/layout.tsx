"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Building2,
  School,
  Users,
  TrendingUp,
  CreditCard,
  BadgeIndianRupee,
  Sparkles,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  MessageCircle,
  Megaphone,
  Flag,
  Gauge,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  UserCircle,
  Building
} from 'lucide-react'

interface SearchResults {
  organizations: Array<{ id: string; name: string; email: string; institutionType: string; status: string }>
  listings: Array<{ id: string; name: string; institutionType: string; verificationStatus: string; organization: { id: string } | null }>
  parents: Array<{ id: string; name: string | null; email: string | null; phone: string | null }>
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Global search
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Profile menu
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Notification feed
  const [notifOpen, setNotifOpen] = useState(false)
  const [feed, setFeed] = useState<Array<{ id: string; type: string; title: string; subtitle: string; at: string; link: string }>>([])
  const notifRef = useRef<HTMLDivElement>(null)

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

  // Restore collapse preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adminNavCollapsed')
      if (saved === '1') setCollapsed(true)
    } catch {}
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c
      try { localStorage.setItem('adminNavCollapsed', next ? '1' : '0') } catch {}
      return next
    })
  }

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [])

  // Load the activity feed (on mount + every 2 min)
  useEffect(() => {
    let active = true
    const load = () => fetch('/api/admin/activity-feed')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (active && j?.items) setFeed(j.items) })
      .catch(() => {})
    load()
    const t = setInterval(load, 120_000)
    return () => { active = false; clearInterval(t) }
  }, [])

  const feedIcon = (type: string) => {
    switch (type) {
      case 'signup': return '🆕'
      case 'verification': return '📋'
      case 'failed_payment': return '⚠️'
      case 'trial': return '⏳'
      default: return '•'
    }
  }
  const feedAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(Math.abs(diff) / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null)
      setSearching(false)
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          setResults(await res.json())
          setSearchOpen(true)
        }
      } catch {
        setResults(null)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const goto = useCallback((href: string) => {
    setSearchOpen(false)
    setQuery('')
    setResults(null)
    router.push(href)
  }, [router])

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length >= 1) goto(`/admin/orgs?search=${encodeURIComponent(query.trim())}`)
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Organizations', href: '/admin/orgs', icon: Building2 },
    { label: 'Listings', href: '/admin/schools', icon: School },
    { label: 'Parents', href: '/admin/parents', icon: Users },
    { label: 'Reviews', href: '/admin/reviews', icon: Flag },
    { label: 'Usage & Health', href: '/admin/usage', icon: Gauge },
    { label: 'Revenue', href: '/admin/revenue', icon: TrendingUp },
    { label: 'Plans', href: '/admin/plans', icon: CreditCard },
    { label: 'Pricing', href: '/admin/pricing', icon: BadgeIndianRupee },
    { label: 'AI Copilot', href: '/admin/ai', icon: Sparkles },
    { label: 'WhatsApp Templates', href: '/admin/whatsapp-templates', icon: MessageCircle },
    { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  const getPageTitle = () => {
    const item = navItems.find((item) =>
      item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
    )
    return item ? item.label : 'Admin Control'
  }

  const renderSidebar = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full min-h-0 bg-slate-950 text-slate-100 select-none">
      <style>{`
        .admin-nav-scroll::-webkit-scrollbar { width: 4px; }
        .admin-nav-scroll::-webkit-scrollbar-track { background: transparent; }
        .admin-nav-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        .admin-nav-scroll { scrollbar-width: thin; scrollbar-color: #1e293b transparent; }
      `}</style>
      {/* Header / Logo */}
      <div className={`shrink-0 border-b border-slate-800 ${isCollapsed ? 'p-4' : 'p-6'}`}>
        <Link href="/admin" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 shrink-0">
            V
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-bold text-lg tracking-tight block text-white leading-none font-sans">Vidhyaan</span>
              <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase font-sans">Platform</span>
            </div>
          )}
        </Link>

        {!isCollapsed && (
          <div className="mt-5 flex flex-col gap-1.5">
            <div className="inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950 text-red-400 border border-red-900/50">
              <ShieldAlert className="w-3 h-3" />
              ADMIN PANEL
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">
              {role.replace('_', ' ')}
            </div>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className={`admin-nav-scroll flex-1 min-h-0 py-4 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {navItems.map((item) => {
          const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              title={isCollapsed ? item.label : undefined}
              className={`relative flex items-center rounded-xl text-sm font-semibold transition-all duration-150 group/nav ${
                isCollapsed ? 'justify-center px-2.5 py-2.5' : 'justify-between px-3.5 py-2.5'
              } ${
                isActive
                  ? 'bg-slate-800/80 text-white shadow-sm shadow-black/10'
                  : 'text-slate-400 hover:text-slate-150 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover/nav:text-slate-300'}`} strokeWidth={2} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
              {!isCollapsed && isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}

              {/* Tooltip when collapsed */}
              {isCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg ring-1 ring-slate-700 transition-opacity duration-150 group-hover/nav:opacity-100">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={toggleCollapsed}
        className={`shrink-0 hidden lg:flex items-center gap-2 border-t border-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 transition ${
          isCollapsed ? 'justify-center py-3' : 'px-5 py-3'
        }`}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <PanelLeftOpen className="w-4.5 h-4.5" /> : <><PanelLeftClose className="w-4.5 h-4.5" /><span className="text-xs font-bold">Collapse</span></>}
      </button>

      {/* Bottom Profile Info */}
      <div className={`shrink-0 border-t border-slate-900 bg-slate-950/60 flex items-center ${isCollapsed ? 'justify-center p-3' : 'justify-between p-4'}`}>
        {isCollapsed ? (
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign Out"
            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-200"
          >
            {initials}
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )

  const hasResults =
    results && (results.organizations.length > 0 || results.listings.length > 0 || results.parents.length > 0)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Desktop Sidebar (Fixed) */}
      <aside className={`hidden lg:block h-screen shrink-0 border-r border-slate-900 shadow-xl shadow-slate-950/30 z-20 transition-[width] duration-200 ${collapsed ? 'w-[76px]' : 'w-60'}`}>
        {renderSidebar(collapsed)}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 max-w-xs flex flex-col h-full bg-slate-950 shadow-2xl animate-slide-in-left">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-y-auto">{renderSidebar(false)}</div>
          </div>
        </div>
      )}

      {/* Right side layout */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top Header */}
        <header className="shrink-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 select-none shadow-xs">
          {/* Left Title / Hamburger */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Desktop sidebar collapse toggle — always visible */}
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex p-2 -ml-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-bold text-slate-900 leading-none tracking-tight font-sans">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div ref={searchRef} className="hidden sm:relative sm:block">
              <form onSubmit={onSearchSubmit}>
                <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (results) setSearchOpen(true) }}
                  placeholder="Search orgs, listings, parents..."
                  className="w-64 rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-8 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition duration-150"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-slate-400 animate-spin" />}
              </form>

              {/* Results dropdown */}
              {searchOpen && query.trim().length >= 2 && (
                <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50 py-2 animate-slide-in-up">
                  {!hasResults ? (
                    <div className="px-4 py-6 text-center text-xs font-semibold text-slate-400">
                      {searching ? 'Searching…' : 'No matches found'}
                    </div>
                  ) : (
                    <>
                      {results!.organizations.length > 0 && (
                        <div>
                          <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Organizations</div>
                          {results!.organizations.map((o) => (
                            <button key={o.id} onClick={() => goto(`/admin/orgs/${o.id}`)} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 transition">
                              <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="min-w-0">
                                <span className="block text-xs font-bold text-slate-800 truncate">{o.name}</span>
                                <span className="block text-[10px] text-slate-400 truncate">{o.email}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {results!.listings.length > 0 && (
                        <div>
                          <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Listings</div>
                          {results!.listings.map((s) => (
                            <button key={s.id} onClick={() => goto(s.organization ? `/admin/orgs/${s.organization.id}` : '/admin/schools')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 transition">
                              <Building className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="min-w-0">
                                <span className="block text-xs font-bold text-slate-800 truncate">{s.name}</span>
                                <span className="block text-[10px] text-slate-400 truncate">{s.verificationStatus}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {results!.parents.length > 0 && (
                        <div>
                          <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Parents</div>
                          {results!.parents.map((p) => (
                            <button key={p.id} onClick={() => goto('/admin/parents')} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 transition">
                              <Users className="w-4 h-4 text-purple-500 shrink-0" />
                              <span className="min-w-0">
                                <span className="block text-xs font-bold text-slate-800 truncate">{p.name || p.phone || 'Parent'}</span>
                                <span className="block text-[10px] text-slate-400 truncate">{p.email || p.phone}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition duration-150"
                title="Platform activity"
              >
                <Bell className="w-4.5 h-4.5" />
                {feed.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white">
                    {feed.length > 9 ? '9+' : feed.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50 py-1.5 animate-slide-in-up">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Platform Activity</span>
                    <span className="text-[10px] font-bold text-slate-400">{feed.length}</span>
                  </div>
                  {feed.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs font-semibold text-slate-400">All caught up 🎉</div>
                  ) : (
                    feed.map((it) => (
                      <button
                        key={it.id}
                        onClick={() => { setNotifOpen(false); router.push(it.link) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-start gap-2.5 transition"
                      >
                        <span className="text-sm leading-none mt-0.5">{feedIcon(it.type)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold text-slate-800 truncate">{it.title}</span>
                          <span className="block text-[10px] text-slate-400 truncate">{it.subtitle}</span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0 mt-0.5">{feedAgo(it.at)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative pl-2 border-l border-slate-200">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-3 rounded-full hover:bg-slate-100 pr-1 pl-1 py-1 transition"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-sm shadow-blue-500/20">
                  {initials}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-none font-sans">{name}</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 font-sans truncate max-w-[100px]">
                    {email}
                  </div>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl z-50 py-1.5 animate-slide-in-up">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="text-sm font-bold text-slate-900 truncate">{name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{email}</div>
                    <div className="mt-1 inline-flex text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {role.replace('_', ' ')}
                    </div>
                  </div>
                  <Link href="/admin/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                    <Settings className="w-4 h-4 text-slate-400" /> Platform Settings
                  </Link>
                  <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                    <UserCircle className="w-4 h-4 text-slate-400" /> Dashboard
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
