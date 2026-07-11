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
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false)
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

  // Click outside to close products mega-menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.products-trigger') || target.closest('.products-dropdown')) {
        return
      }
      setIsProductsOpen(false)
    }
    if (isProductsOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isProductsOpen])

  // Click outside to close Get Started dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.getstarted-trigger') || target.closest('.getstarted-dropdown')) {
        return
      }
      setIsGetStartedOpen(false)
    }
    if (isGetStartedOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isGetStartedOpen])

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
            <Link href="/" className="flex items-center cursor-pointer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/vidhyaan-logo.svg" alt="Vidhyaan" className="h-8 w-auto" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 h-full">
            <div 
              className="h-full flex items-center products-trigger"
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
                <div className="relative">
                  <button
                    onClick={() => setIsGetStartedOpen(!isGetStartedOpen)}
                    className="getstarted-trigger flex items-center gap-1.5 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-sm transition cursor-pointer"
                    aria-expanded={isGetStartedOpen}
                    aria-haspopup="true"
                  >
                    Get Started
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isGetStartedOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isGetStartedOpen && (
                    <div className="getstarted-dropdown absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden py-2">
                      <Link
                        href="/parent/register"
                        onClick={() => setIsGetStartedOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition">
                          <Users className="w-[18px] h-[18px] text-[#1565D8]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Register as Parent</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Find schools, track applications & fees
                          </p>
                        </div>
                      </Link>
                      <Link
                        href="/for-schools"
                        onClick={() => setIsGetStartedOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition">
                          <Building2 className="w-[18px] h-[18px] text-[#1565D8]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">List your School — Free</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Claim your profile & manage admissions
                          </p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
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
            className="absolute left-0 right-0 top-[64px] w-full bg-white border-t-3 border-t-[#1565D8] rounded-b-2xl shadow-2xl z-40 overflow-hidden animate-slide-down-fade focus-within:ring-2 focus-within:ring-[#1565D8]/20 focus-within:outline-none products-dropdown"
            onMouseEnter={() => setIsProductsOpen(true)}
            tabIndex={-1}
          >
            <style>{`
              @keyframes slideDownFade {
                from {
                  opacity: 0;
                  transform: translateY(-8px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .animate-slide-down-fade {
                animation: slideDownFade 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
              @media (prefers-reduced-motion: reduce) {
                .animate-slide-down-fade {
                  animation: none !important;
                  transition: none !important;
                }
              }
            `}</style>

            <div className="grid grid-cols-[210px_1fr_1fr_230px] w-full max-w-screen-2xl mx-auto divide-x divide-slate-100/80 bg-white">
              
              {/* ZONE A — INTRO PANEL */}
              <div className="bg-slate-50/50 p-6 flex flex-col text-left select-none justify-start">
                <div>
                  <h4 className="text-[13px] font-black text-slate-800 leading-snug font-poppins">
                    One platform for schools, learning centers and parents
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-2 font-semibold leading-relaxed">
                    Discovery marketplace plus a full admission CRM.
                  </p>
                </div>
                <Link 
                  href="/pricing" 
                  onClick={() => setIsProductsOpen(false)}
                  className="text-xs font-black text-[#1565D8] hover:text-blue-700 transition flex items-center gap-1 mt-5 hover:underline w-fit"
                >
                  <span>See all products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* ZONE B — MARKETPLACE GROUP */}
              <div className="p-6 bg-white flex flex-col gap-4 text-left">
                <div className="pb-1 text-left select-none">
                  <span className="text-[10px] font-black text-[#1565D8] uppercase tracking-wider pb-1 border-b-2 border-[#FFC107] inline-block font-poppins">
                    MARKETPLACE — FOR PARENTS
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 mt-1">
                  {[
                    {
                      href: "/schools",
                      name: "Find Schools",
                      icon: Search,
                      tintClass: "bg-blue-50 text-blue-600 border border-blue-100/50"
                    },
                    {
                      href: "/learning-centers",
                      name: "Find Learning Centers",
                      icon: Sparkles,
                      tintClass: "bg-teal-50 text-teal-600 border border-teal-100/50"
                    },
                    {
                      href: "/schools/compare",
                      name: "Compare Schools",
                      icon: GitCompare,
                      tintClass: "bg-violet-50 text-violet-600 border border-violet-100/50"
                    },
                    {
                      href: "/parent/applications",
                      name: "Track Application",
                      icon: ClipboardCheck,
                      tintClass: "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                    },
                    {
                      href: "/products/parent-portal",
                      name: "Parent Portal",
                      icon: FileText,
                      tintClass: "bg-cyan-50 text-cyan-600 border border-cyan-100/50"
                    },
                    {
                      href: "/products/marketplace/verified-badge",
                      name: "Verified Schools",
                      icon: Award,
                      tintClass: "bg-amber-50 text-amber-600 border border-amber-100/50"
                    },
                    {
                      href: "/register-school",
                      name: "Free Listing",
                      icon: Store,
                      tintClass: "bg-[#1565D8] text-white",
                    }
                  ].map((item, idx) => {
                    const ItemIcon = item.icon
                    return (
                      <Link 
                        key={idx}
                        href={item.href}
                        onClick={() => setIsProductsOpen(false)}
                        className="group flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:ring-offset-1"
                      >
                        <div className={`w-[30px] h-[30px] rounded-md flex items-center justify-center shrink-0 transition-colors duration-200 ${item.tintClass}`}>
                          <ItemIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[13px] font-medium text-slate-705 group-hover:text-[#1565D8] transition-colors leading-none whitespace-nowrap font-poppins">
                          {item.name}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* ZONE C — ADMISSION CRM GROUP */}
              <div className="p-6 bg-white flex flex-col gap-4 text-left">
                <div className="pb-1 text-left select-none">
                  <span className="text-[10px] font-black text-[#1565D8] uppercase tracking-wider pb-1 border-b-2 border-[#FFC107] inline-block font-poppins">
                    ADMISSION CRM — FOR INSTITUTIONS
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 mt-1">
                  {[
                    {
                      href: "/products/lead-management",
                      name: "Lead Management",
                      icon: Users,
                      tintClass: "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                    },
                    {
                      href: "/products/admission-management",
                      name: "Admissions",
                      icon: ClipboardList,
                      tintClass: "bg-violet-50 text-violet-600 border border-violet-100/50"
                    },
                    {
                      href: "/products/student-management",
                      name: "Students",
                      icon: GraduationCap,
                      tintClass: "bg-pink-50 text-pink-600 border border-pink-100/50"
                    },
                    {
                      href: "/products/course-management",
                      name: "Courses & Batches",
                      icon: BookOpen,
                      tintClass: "bg-orange-50 text-orange-600 border border-orange-100/50"
                    },
                    {
                      href: "/products/fee-management",
                      name: "Fees & Payments",
                      icon: CreditCard,
                      tintClass: "bg-rose-50 text-rose-600 border border-rose-100/50"
                    },
                    {
                      href: "/products/campaign-management",
                      name: "Campaigns",
                      icon: MessageSquare,
                      tintClass: "bg-blue-50 text-blue-600 border border-blue-100/50"
                    },
                    {
                      href: "/products/notifications-alerts",
                      name: "Notifications",
                      icon: Bell,
                      tintClass: "bg-amber-50 text-amber-600 border border-amber-100/50"
                    },
                    {
                      href: "/products/parent-portal",
                      name: "Parent Portal",
                      icon: FileText,
                      tintClass: "bg-cyan-50 text-cyan-600 border border-cyan-100/50"
                    },
                    {
                      href: "/products/reporting-analytics",
                      name: "Reports & Analytics",
                      icon: BarChart3,
                      tintClass: "bg-purple-50 text-purple-600 border border-purple-100/50"
                    }
                  ].map((item, idx) => {
                    const ItemIcon = item.icon
                    return (
                      <Link 
                        key={idx}
                        href={item.href}
                        onClick={() => setIsProductsOpen(false)}
                        className="group flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:ring-offset-1"
                      >
                        <div className={`w-[30px] h-[30px] rounded-md flex items-center justify-center shrink-0 transition-colors duration-200 ${item.tintClass}`}>
                          <ItemIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[13px] font-medium text-slate-705 group-hover:text-[#1565D8] transition-colors leading-none whitespace-nowrap font-poppins">
                          {item.name}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* ZONE D — PROMO RAIL */}
              <div className="bg-slate-50/50 p-6 flex flex-col gap-4 text-left justify-center shrink-0 select-none">
                
                {/* Tile 1 */}
                <div className="group relative rounded-xl bg-[#1565D8] p-4 text-white shadow-sm flex flex-col justify-between h-[105px] text-left">
                  <div>
                    <h4 className="text-[12px] font-black font-poppins tracking-tight">List your school free</h4>
                    <p className="text-[10px] text-blue-100 mt-1 font-semibold leading-tight">Get discovered by local parents.</p>
                  </div>
                  <Link href="/register-school" onClick={() => setIsProductsOpen(false)} className="text-[10px] font-bold text-white hover:text-blue-100 underline mt-2 block w-fit">
                    Get started
                  </Link>
                </div>

                {/* Tile 2 */}
                <div className="group rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm flex flex-col justify-between h-[105px] text-left">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-[12px] font-black font-poppins text-slate-900 leading-tight">Razorpay payments</h4>
                      <span className="bg-amber-500 text-white text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full select-none">
                        NEW
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium leading-tight">Collect fees online.</p>
                  </div>
                  <Link href="/products/fee-management" onClick={() => setIsProductsOpen(false)} className="text-[10px] font-black text-[#1565D8] hover:text-blue-700 transition mt-2 block w-fit hover:underline">
                    Learn more
                  </Link>
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
                    <Button className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-full h-auto shadow-sm">
                      Login
                    </Button>
                  </Link>

                  <p className="px-2.5 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none">
                    New to Vidhyaan?
                  </p>
                  <Link
                    href="/parent/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#1565D8] rounded-lg"
                  >
                    <Users className="w-4 h-4 text-[#1565D8]" />
                    Register as Parent
                  </Link>
                  <Link
                    href="/for-schools"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#1565D8] rounded-lg"
                  >
                    <Building2 className="w-4 h-4 text-[#1565D8]" />
                    List your School — Free
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
