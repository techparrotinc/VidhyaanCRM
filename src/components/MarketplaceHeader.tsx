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
  Cloud
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
              <button className="flex items-center gap-1 hover:text-[#1565D8] transition cursor-pointer py-5">
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
            className="absolute left-0 right-0 top-16 w-full bg-white border-t-[3px] border-[#1565D8] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15),0_15px_25px_-10px_rgba(0,0,0,0.1)] z-40 transition-all duration-300 ease-out"
            onMouseEnter={() => setIsProductsOpen(true)}
          >
            <div className="max-w-5xl mx-auto">
              <div className="px-6 md:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                  
                  {/* Column 1 - Marketplace */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1565D8]" />
                      <h3 className="text-xs font-black font-poppins uppercase tracking-wider text-[#1565D8]">
                        Marketplace Platform
                      </h3>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Link 
                        href="/products/marketplace/free-listing" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-emerald-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <Building className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Free School Listing
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Claim your listing and get discovered by parents.
                          </p>
                        </div>
                      </Link>
                      <Link 
                        href="/products/marketplace/search-discovery" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-blue-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(37,99,235,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <Search className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Parent Search & Discovery
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Advanced filtering by location, fees, and board.
                          </p>
                        </div>
                      </Link>
                      <Link 
                        href="/products/marketplace/compare" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-purple-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(139,92,246,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <GitCompare className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Compare Schools
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Compare academic records, fees, and reviews side-by-side.
                          </p>
                        </div>
                      </Link>
                      <Link 
                        href="/products/marketplace/track-application" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-amber-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(245,158,11,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Track Your Application
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Real-time progress updates on child school applications.
                          </p>
                        </div>
                      </Link>
                      <Link 
                        href="/products/marketplace/verified-badge" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-indigo-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(99,102,241,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <Award className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Verified Profile Badge
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Build instant trust and highlight your official profile.
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Columns 2 & 3 - Admission CRM */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-650" />
                      <h3 className="text-xs font-black font-poppins uppercase tracking-wider text-indigo-600">
                        Admission CRM Solutions
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                      <Link 
                        href="/products/lead-management" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-rose-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(244,63,94,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Lead Management
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Capture and nurture inquiries across all channels.
                          </p>
                        </div>
                      </Link>
                      <Link 
                        href="/products/admission-management" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-sky-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(14,165,233,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Admission Management
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Automate student application flows and seat vetting.
                          </p>
                        </div>
                      </Link>
                      <Link 
                        href="/products/student-management" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-violet-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(109,40,217,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Student Management
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Track student profiles, documents, and academic history.
                          </p>
                        </div>
                      </Link>
                      <Link 
                        href="/products/course-management" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-teal-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(13,148,136,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Course & Batch Management
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Organize classes, batches, subjects, and timetables.
                          </p>
                        </div>
                      </Link>
                      <Link 
                        href="/products/fee-management" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-emerald-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Fee & Payment Management
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Process online payments and issue automated receipts.
                          </p>
                        </div>
                      </Link>
                      <Link 
                        href="/products/campaign-management" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-pink-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(236,72,153,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 group-hover:bg-pink-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Campaign Management
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Run targeted WhatsApp, SMS, and email marketing.
                          </p>
                        </div>
                      </Link>
                      <Link 
                        href="/products/notifications-alerts" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-orange-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(249,115,22,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Notifications & Alerts
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Instant transactional updates for parents and teachers.
                          </p>
                        </div>
                      </Link>
                      <Link 
                        href="/products/parent-portal" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-blue-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(37,99,235,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Parent Portal
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Dedicated parent hub for fee payments and application tracking.
                          </p>
                        </div>
                      </Link>
                      <Link 
                        href="/products/reporting-analytics" 
                        className="group flex items-start gap-3.5 p-3 rounded-2xl border border-transparent hover:border-fuchsia-100/50 hover:bg-slate-50/40 hover:shadow-[0_8px_30px_rgba(217,70,239,0.06)] transition-all duration-300"
                      >
                        <div className="w-10 h-10 rounded-xl bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-100 flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-extrabold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                            Reports & Analytics
                          </span>
                          <p className="text-[11px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-normal">
                            Deep insights on admission conversion rates and cash flows.
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom features row */}
              <div className="bg-slate-50 border-t border-slate-100 px-6 md:px-8 py-5 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                    <Shield className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Secure & Reliable</h4>
                    <p className="text-[10px] font-bold text-slate-400">Enterprise grade security you can trust</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Zap className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Quick To Launch</h4>
                    <p className="text-[10px] font-bold text-slate-400">Go live in minutes, no IT support needed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Cloud className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Cloud Based</h4>
                    <p className="text-[10px] font-bold text-slate-400">Access anywhere, anytime from any device</p>
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
            <div>
              <button 
                onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                className="w-full flex items-center justify-between hover:text-[#1565D8] transition py-1.5 text-left font-semibold text-sm text-slate-600 cursor-pointer"
              >
                Products
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileProductsOpen ? 'rotate-180' : ''}`} />
              </button>
              {isMobileProductsOpen && (
                <div className="pl-4 mt-2 space-y-2.5 border-l border-slate-100 flex flex-col">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1.5 mb-0.5">Marketplace</div>
                  <Link href="/products/marketplace/free-listing" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Free School & Learning Center Listing</Link>
                  <Link href="/products/marketplace/search-discovery" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Parent Search & Discovery</Link>
                  <Link href="/products/marketplace/compare" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Compare Schools Side-by-Side</Link>
                  <Link href="/products/marketplace/track-application" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Track Your Application</Link>
                  <Link href="/products/marketplace/verified-badge" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Verified Profile Badge</Link>
                  
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-2.5 mb-0.5">Admission CRM</div>
                  <Link href="/products/lead-management" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Lead Management</Link>
                  <Link href="/products/admission-management" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Admission Management</Link>
                  <Link href="/products/student-management" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Student Management</Link>
                  <Link href="/products/course-management" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Course & Batch Management</Link>
                  <Link href="/products/fee-management" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Fee Management & Payments</Link>
                  <Link href="/products/campaign-management" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Campaign Management</Link>
                  <Link href="/products/notifications-alerts" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Notifications & Alerts</Link>
                  <Link href="/products/parent-portal" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Parent Portal</Link>
                  <Link href="/products/reporting-analytics" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Reports & Analytics</Link>
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
