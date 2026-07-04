'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Building,
  ChevronDown,
  LayoutGrid,
  UserPlus,
  ArrowRight,
  Shield,
  LayoutDashboard,
  Bookmark,
  FileText,
  User,
  LogOut,
  Settings,
  Bell,
  CheckCircle2,
  X,
  Loader2,
  Menu,
  Users,
  ClipboardList,
  GraduationCap,
  CreditCard,
  BookOpen,
  MessageSquare,
  BarChart3,
  Lock,
  Search,
  GitCompare,
  Activity,
  Award,
  Zap,
  Cloud,
  Store,
  Building2,
  ClipboardCheck,
  Wallet,
  IndianRupee,
  GitBranch,
  MessageCircle,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MarketplaceHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false)
  const [isMobileMarketplaceOpen, setIsMobileMarketplaceOpen] = useState(false)
  const [isMobileCrmOpen, setIsMobileCrmOpen] = useState(false)

  // Escape key down listener to close products mega-menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProductsOpen(false)
      }
    }
    if (isProductsOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProductsOpen])

  // Listen to deletion message query parameter
  useEffect(() => {
    const msg = searchParams.get('message')
    if (msg) {
      setToastMsg(msg)
      // Clean query parameter from URL without page reload
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.pathname + url.search)
      
      const timer = setTimeout(() => {
        setToastMsg(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const parentName = session?.user?.name || 'Parent User'
  const parentInitials = parentName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  const isParent = session?.user?.role === 'PARENT'
  const isAdmin = ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'].includes(session?.user?.role || '')

  return (
    <div onMouseLeave={() => setIsProductsOpen(false)} className="w-full">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl z-50 animate-slide-in max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="hover:text-slate-350 ml-auto shrink-0 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header Container */}
      <header className="sticky top-0 w-full bg-white border-b border-slate-100 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#1565D8] flex items-center justify-center text-white font-black text-sm shadow-md">
                V
              </div>
              <span className="text-base font-black tracking-tight text-slate-900">Vidhyaan</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 h-full">
            <div 
              className="h-full flex items-center"
              onMouseEnter={() => setIsProductsOpen(true)}
            >
              <button 
                onClick={() => setIsProductsOpen(!isProductsOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsProductsOpen(!isProductsOpen)
                  }
                }}
                className="flex items-center gap-1 hover:text-[#1565D8] transition cursor-pointer py-5 focus:outline-none focus:text-[#1565D8] focus:underline"
                aria-expanded={isProductsOpen}
                aria-haspopup="true"
              >
                Products <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isProductsOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <Link 
              href="/schools" 
              className={`hover:text-[#1565D8] transition ${pathname.startsWith('/schools') && !pathname.includes('compare') ? 'text-[#1565D8] font-bold' : ''}`}
            >
              Find Schools
            </Link>
            <Link 
              href="/learning-centers" 
              className={`hover:text-[#1565D8] transition ${pathname.startsWith('/learning-centers') ? 'text-[#1565D8] font-bold' : ''}`}
            >
              Learning Centers
            </Link>
            <Link 
              href="/for-schools" 
              className={`hover:text-[#1565D8] transition ${pathname === '/for-schools' ? 'text-[#1565D8] font-bold' : ''}`}
            >
              For Schools
            </Link>
          </nav>

          {/* Right Header items (Auth-controlled) */}
          <div className="hidden md:flex items-center gap-2.5">
            {status === 'loading' ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#1565D8]" />
            ) : session?.user ? (
              // Authenticated Dropdown
              <div className="relative">
                <button 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow">
                    {parentInitials}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-slate-700">Hi, {parentName.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-550" />
                </button>

                {isUserDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl z-40 py-2 animate-fade-in">
                      <div className="px-4 py-2 border-b border-slate-50">
                        <p className="text-xs font-bold text-slate-800 truncate">{parentName}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{session.user.email}</p>
                      </div>

                      {isParent ? (
                        <>
                          <Link
                            href="/parent/dashboard"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-650 hover:bg-slate-50 hover:text-[#1565D8] transition font-bold"
                          >
                            <LayoutDashboard className="w-4 h-4" /> Dashboard
                          </Link>
                          <Link
                            href="/parent/bookmarks"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-650 hover:bg-slate-50 hover:text-[#1565D8] transition font-bold"
                          >
                            <Bookmark className="w-4 h-4" /> Bookmarks
                          </Link>
                          <Link
                            href="/parent/applications"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-650 hover:bg-slate-50 hover:text-[#1565D8] transition font-bold"
                          >
                            <FileText className="w-4 h-4" /> Applications
                          </Link>
                          <Link
                            href="/parent/profile"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-650 hover:bg-slate-50 hover:text-[#1565D8] transition font-bold"
                          >
                            <User className="w-4 h-4" /> Profile & Settings
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={isAdmin ? '/admin' : '/dashboard'}
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-650 hover:bg-slate-50 hover:text-[#1565D8] transition font-bold"
                        >
                          <LayoutDashboard className="w-4 h-4" /> CRM Dashboard
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false)
                          signOut({ callbackUrl: '/' })
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition font-bold border-t border-slate-50 cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Unauthenticated Actions
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-700 hover:text-[#1565D8] font-bold text-xs px-4 py-2 rounded-xl h-auto">
                    Login
                  </Button>
                </Link>
                <Link href="/for-schools">
                  <Button variant="outline" className="border-blue-200 text-[#1565D8] hover:bg-blue-50 font-bold text-xs px-4 py-2 rounded-xl h-auto shrink-0 shadow-sm">
                    Claim Free Profile
                  </Button>
                </Link>
                <Link href="/parent/register">
                  <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-full h-auto shadow-sm">
                    Register as Parent
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger button on Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition cursor-pointer outline-none"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>

        {/* Mega Menu Dropdown */}
        {isProductsOpen && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 top-[60px] w-[90vw] max-w-[1200px] bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-2xl z-40 overflow-hidden animate-slide-down-fade focus-within:ring-2 focus-within:ring-[#1565D8]/20 focus-within:outline-none"
            onMouseEnter={() => setIsProductsOpen(true)}
            tabIndex={-1}
          >
            <style>{`
              @keyframes slideDownFade {
                from {
                  opacity: 0;
                  transform: translate(-50%, -8px);
                }
                to {
                  opacity: 1;
                  transform: translate(-50%, 0);
                }
              }
              .animate-slide-down-fade {
                animation: slideDownFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
              @media (prefers-reduced-motion: reduce) {
                .animate-slide-down-fade {
                  animation: none !important;
                  transition: none !important;
                }
              }
            `}</style>

            <div className="grid grid-cols-[320px_1fr_340px] w-full">
              
              {/* Column 1 — Curated Shortcuts (What do you want to do?) */}
              <div className="bg-blue-50/10 pt-10 pb-10 pl-10 pr-8 flex flex-col shrink-0 border-r border-slate-200/50">
                <h3 className="text-sm font-black font-poppins text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 mb-6">
                  What do you want to do?
                </h3>
                <div className="flex flex-col gap-y-3">
                  {[
                    {
                      href: "/register-school",
                      icon: Store,
                      label: "List your school for free",
                      bgClass: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 border border-emerald-100/50",
                    },
                    {
                      href: "/products/parent-portal",
                      icon: ClipboardCheck,
                      label: "Track child's application",
                      bgClass: "bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700 border border-blue-100/50",
                    },
                    {
                      href: "/products/fee-management",
                      icon: Wallet,
                      label: "Collect fees online",
                      bgClass: "bg-amber-50 text-amber-600 group-hover:bg-amber-100 group-hover:text-amber-700 border border-amber-100/50",
                    },
                    {
                      href: "/products/admission-management",
                      icon: GitBranch,
                      label: "Manage admissions end-to-end",
                      bgClass: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 border border-indigo-100/50",
                    },
                    {
                      href: "/products/campaign-management",
                      icon: MessageCircle,
                      label: "Send WhatsApp updates",
                      bgClass: "bg-teal-50 text-teal-600 group-hover:bg-teal-100 group-hover:text-teal-700 border border-teal-100/50",
                    }
                  ].map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <Link 
                        key={item.href}
                        href={item.href}
                        className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-100/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:ring-offset-1 focus:rounded-lg"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${item.bgClass}`}>
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[13px] font-bold font-poppins text-slate-700 group-hover:text-[#1565D8] transition-colors leading-snug">
                          {item.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Column 2 — Explore Vidhyaan (Core Product Lists) */}
              <div className="pt-10 pb-10 px-8 bg-white flex flex-col">
                <h3 className="text-sm font-black font-poppins text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 mb-6">
                  Explore Vidhyaan
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  
                  {/* Marketplace Group */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[11px] font-black text-[#1565D8] uppercase tracking-wider mb-1 flex items-center gap-1.5 select-none">
                      <LayoutGrid className="w-3.5 h-3.5 shrink-0 text-[#1565D8]/80" />
                      <span>Marketplace</span>
                    </h4>
                    <div className="flex flex-col gap-y-1">
                      {[
                        {
                          href: "/products/marketplace/free-listing",
                          name: "Free School Listing",
                          desc: "Claim profile and get discovered",
                          icon: Store,
                          tintClass: "bg-cyan-50 text-cyan-600 border border-cyan-100/50"
                        },
                        {
                          href: "/products/marketplace/search-discovery",
                          name: "Search & Discovery",
                          desc: "Enable local parents to search",
                          icon: Search,
                          tintClass: "bg-blue-50 text-blue-600 border border-blue-100/50"
                        },
                        {
                          href: "/products/marketplace/compare",
                          name: "Compare Schools",
                          desc: "Compare boards and facilities",
                          icon: GitCompare,
                          tintClass: "bg-indigo-50 text-indigo-600 border border-indigo-100/50"
                        },
                        {
                          href: "/products/marketplace/verified-badge",
                          name: "Verified Profile Badge",
                          desc: "Gain trust with verification badge",
                          icon: Award,
                          tintClass: "bg-amber-50 text-amber-600 border border-amber-100/50"
                        }
                      ].map((item) => {
                        const ItemIcon = item.icon
                        return (
                          <Link 
                            key={item.href}
                            href={item.href}
                            className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:ring-offset-1 focus:rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.tintClass}`}>
                                <ItemIcon className="w-4 h-4" />
                              </div>
                              <div className="text-left min-w-0">
                                <h5 className="text-[13px] font-bold text-slate-800 group-hover:text-[#1565D8] transition-colors leading-snug">
                                  {item.name}
                                </h5>
                                <p className="text-[10px] text-slate-450 font-semibold group-hover:text-slate-600 transition-colors leading-tight line-clamp-1">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-[#1565D8] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0" />
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Admission CRM Group */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[11px] font-black text-[#1565D8] uppercase tracking-wider mb-1 flex items-center gap-1.5 select-none">
                      <Activity className="w-3.5 h-3.5 shrink-0 text-[#1565D8]/80" />
                      <span>Admission CRM</span>
                    </h4>
                    <div className="flex flex-col gap-y-1">
                      {[
                        {
                          href: "/products/lead-management",
                          name: "Lead Management",
                          desc: "Capture and convert every enquiry",
                          icon: Users,
                          tintClass: "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                        },
                        {
                          href: "/products/admission-management",
                          name: "Admission Management",
                          desc: "Streamline registrations and documents",
                          icon: ClipboardList,
                          tintClass: "bg-violet-50 text-violet-600 border border-violet-100/50"
                        },
                        {
                          href: "/products/student-management",
                          name: "Student Management",
                          desc: "Manage student profiles and rosters",
                          icon: GraduationCap,
                          tintClass: "bg-pink-50 text-pink-600 border border-pink-100/50"
                        },
                        {
                          href: "/products/course-management",
                          name: "Course & Batch Management",
                          desc: "Schedule classes and batch timings",
                          icon: BookOpen,
                          tintClass: "bg-orange-50 text-orange-600 border border-orange-100/50"
                        },
                        {
                          href: "/products/fee-management",
                          name: "Fee & Payment Management",
                          desc: "Invoices, online payments, receipts",
                          icon: CreditCard,
                          tintClass: "bg-rose-50 text-rose-600 border border-rose-100/50"
                        },
                        {
                          href: "/products/campaign-management",
                          name: "Campaign Management",
                          desc: "Broadcasting custom parent updates",
                          icon: MessageSquare,
                          tintClass: "bg-teal-50 text-teal-600 border border-teal-100/50"
                        },
                        {
                          href: "/products/notifications-alerts",
                          name: "Notifications & Alerts",
                          desc: "Instant SMS and email automated alerts",
                          icon: Bell,
                          tintClass: "bg-yellow-50 text-yellow-600 border border-yellow-100/50"
                        },
                        {
                          href: "/products/parent-portal",
                          name: "Parent Portal",
                          desc: "Self-service admissions application tracker",
                          icon: FileText,
                          tintClass: "bg-sky-50 text-sky-600 border border-sky-100/50"
                        },
                        {
                          href: "/products/reporting-analytics",
                          name: "Reports & Analytics",
                          desc: "Actionable insight on lead pipelines",
                          icon: BarChart3,
                          tintClass: "bg-purple-50 text-purple-600 border border-purple-100/50"
                        }
                      ].map((item) => {
                        const ItemIcon = item.icon
                        return (
                          <Link 
                            key={item.href}
                            href={item.href}
                            className="group flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:ring-offset-1 focus:rounded-lg"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.tintClass}`}>
                                <ItemIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-left min-w-0">
                                <h5 className="text-[12px] font-bold text-slate-800 group-hover:text-[#1565D8] transition-colors leading-tight">
                                  {item.name}
                                </h5>
                                <p className="text-[9.5px] text-slate-450 font-semibold group-hover:text-slate-600 transition-colors leading-none truncate max-w-[170px]">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="w-3 h-3 text-[#1565D8] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0" />
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                </div>
              </div>

              {/* Column 3 — Spotlight Promotional Cards */}
              <div className="pt-10 pb-10 pl-8 pr-10 bg-slate-50/20 border-l border-slate-200/50 flex flex-col gap-6 shrink-0 justify-between">
                <div className="space-y-6">
                  <h3 className="text-sm font-black font-poppins text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">
                    Spotlight
                  </h3>
                  
                  {/* Spotlight Card 1 */}
                  <div className="group relative rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-6 text-white overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[150px]">
                    <Store className="absolute -right-6 -bottom-6 w-28 h-28 text-white/10 pointer-events-none transform -rotate-12 select-none" />
                    <div className="relative z-10 space-y-1 text-left">
                      <h4 className="text-[14px] font-black font-poppins tracking-tight">
                        Free Discovery Listing
                      </h4>
                      <p className="text-[10.5px] text-blue-100 font-medium leading-relaxed max-w-[190px]">
                        List your school free and get discovered by local parents.
                      </p>
                    </div>
                    <div className="relative z-10 text-left">
                      <Link href="/register-school">
                        <Button className="bg-white hover:bg-blue-50 text-blue-600 font-bold text-[9.5px] px-3.5 py-1.5 h-auto rounded-full shadow-sm hover:shadow transition-all flex items-center gap-1 border-0">
                          <span>Get started</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Spotlight Card 2 */}
                  <div className="group rounded-2xl border border-slate-200 border-l-4 border-l-[#FFC107] p-5 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[150px] relative overflow-hidden">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100/50 shrink-0">
                          <IndianRupee className="w-3.5 h-3.5" />
                        </div>
                        <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full select-none">
                          NEW
                        </span>
                      </div>
                      
                      <div className="pt-1.5">
                        <h4 className="text-[13px] font-black font-poppins text-slate-900 leading-tight">
                          Razorpay Payments
                        </h4>
                        <p className="text-[10px] text-slate-450 font-semibold leading-relaxed mt-0.5">
                          Collect school fees online directly connected with parent invoices.
                        </p>
                      </div>
                    </div>

                    <div className="text-left">
                      <Link 
                        href="/products/fee-management" 
                        className="inline-flex items-center gap-1 text-[10px] font-black text-[#1565D8] hover:text-blue-700 transition"
                      >
                        <span>Learn more</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white w-full py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-3 font-semibold text-sm text-slate-600">
            {/* Marketplace Accordion */}
            <div>
              <button 
                onClick={() => setIsMobileMarketplaceOpen(!isMobileMarketplaceOpen)}
                className="w-full flex items-center justify-between hover:text-[#1565D8] transition py-1.5 text-left font-semibold text-sm text-slate-600 cursor-pointer"
              >
                Marketplace Platform
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileMarketplaceOpen ? 'rotate-180' : ''}`} />
              </button>
              {isMobileMarketplaceOpen && (
                <div className="pl-4 mt-2 space-y-3 border-l border-slate-100 flex flex-col">
                  <Link 
                    href="/products/marketplace/free-listing" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <Building className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Free School Listing</span>
                  </Link>
                  <Link 
                    href="/products/marketplace/search-discovery" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <Search className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Parent Search & Discovery</span>
                  </Link>
                  <Link 
                    href="/products/marketplace/compare" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <GitCompare className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Compare Schools</span>
                  </Link>
                  <Link 
                    href="/products/marketplace/verified-badge" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <Award className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Verified Profile Badge</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Admission CRM Accordion */}
            <div>
              <button 
                onClick={() => setIsMobileCrmOpen(!isMobileCrmOpen)}
                className="w-full flex items-center justify-between hover:text-[#1565D8] transition py-1.5 text-left font-semibold text-sm text-slate-600 cursor-pointer"
              >
                Admission CRM
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileCrmOpen ? 'rotate-180' : ''}`} />
              </button>
              {isMobileCrmOpen && (
                <div className="pl-4 mt-2 space-y-3 border-l border-slate-100 flex flex-col">
                  <Link 
                    href="/products/lead-management" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <Users className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Lead Management</span>
                  </Link>
                  <Link 
                    href="/products/admission-management" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <ClipboardList className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Admission Management</span>
                  </Link>
                  <Link 
                    href="/products/student-management" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <GraduationCap className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Student Management</span>
                  </Link>
                  <Link 
                    href="/products/course-management" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <BookOpen className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Course & Batch Management</span>
                  </Link>
                  <Link 
                    href="/products/fee-management" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <CreditCard className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Fee & Payment Management</span>
                  </Link>
                  <Link 
                    href="/products/campaign-management" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <MessageSquare className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Campaign Management</span>
                  </Link>
                  <Link 
                    href="/products/notifications-alerts" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <Bell className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Notifications & Alerts</span>
                  </Link>
                  <Link 
                    href="/products/parent-portal" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Parent Portal</span>
                  </Link>
                  <Link 
                    href="/products/reporting-analytics" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <BarChart3 className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Reports & Analytics</span>
                  </Link>
                </div>
              )}
            </div>
            <Link 
              href="/schools" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`hover:text-[#1565D8] transition py-1.5 ${pathname.startsWith('/schools') ? 'text-[#1565D8] font-bold' : ''}`}
            >
              Find Schools
            </Link>
            <Link 
              href="/learning-centers" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`hover:text-[#1565D8] transition py-1.5 ${pathname.startsWith('/learning-centers') ? 'text-[#1565D8] font-bold' : ''}`}
            >
              Learning Centers
            </Link>
            <Link 
              href="/for-schools" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`hover:text-[#1565D8] transition py-1.5 ${pathname === '/for-schools' ? 'text-[#1565D8] font-bold' : ''}`}
            >
              For Schools
            </Link>
          </nav>

          <hr className="border-slate-100" />

          {/* Auth Actions on Mobile */}
          {status !== 'loading' && (
            <div className="flex flex-col gap-2.5">
              {session?.user ? (
                <>
                  <div className="px-1.5 py-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{parentName}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{session.user.email}</p>
                  </div>
                  {isParent ? (
                    <>
                      <Link
                        href="/parent/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-650 hover:bg-slate-50 hover:text-[#1565D8] font-bold rounded-lg"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/parent/bookmarks"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-650 hover:bg-slate-50 hover:text-[#1565D8] font-bold rounded-lg"
                      >
                        Bookmarks
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={isAdmin ? '/admin' : '/dashboard'}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-650 hover:bg-slate-50 hover:text-[#1565D8] font-bold rounded-lg"
                    >
                      CRM Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs text-red-650 hover:bg-red-50 font-bold rounded-lg"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                    <Button variant="ghost" className="w-full text-slate-700 hover:text-[#1565D8] font-bold text-xs py-2.5 rounded-xl h-auto">
                      Login
                    </Button>
                  </Link>
                  <Link href="/for-schools" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                    <Button variant="outline" className="w-full border-blue-200 text-[#1565D8] hover:bg-blue-50 font-bold text-xs py-2.5 rounded-xl h-auto shadow-sm">
                      Claim Free Profile
                    </Button>
                  </Link>
                  <Link href="/parent/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                    <Button className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-full h-auto shadow-sm">
                      Register as Parent
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}


    </div>
  )
}
