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
  const [activeCategory, setActiveCategory] = useState<'marketplace' | 'crm'>('marketplace')
  const [isMobileMarketplaceOpen, setIsMobileMarketplaceOpen] = useState(false)
  const [isMobileCrmOpen, setIsMobileCrmOpen] = useState(false)

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

  // Reset category selector to 'marketplace' whenever dropdown opens
  useEffect(() => {
    if (isProductsOpen) {
      setActiveCategory('marketplace')
    }
  }, [isProductsOpen])

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
            className="absolute left-1/2 -translate-x-1/2 top-[60px] w-[calc(100vw-32px)] max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] z-40 transition-all duration-300 ease-out overflow-hidden"
            onMouseEnter={() => setIsProductsOpen(true)}
          >
            {/* Local Stylesheet for scrollbar */}
            <style dangerouslySetInnerHTML={{ __html: `
              .custom-menu-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-menu-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-menu-scrollbar::-webkit-scrollbar-thumb {
                background-color: #CBD5E1;
                border-radius: 9999px;
              }
              .custom-menu-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: #94A3B8;
              }
              .custom-menu-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: #CBD5E1 transparent;
              }
            `}} />

            <div className="flex flex-col">
              
              {/* Main content pane (Sidebar + Detail Panel) */}
              <div className="flex border-b border-slate-100 h-[420px]">
                
                {/* Left Sidebar */}
                <div className="w-[200px] border-r border-slate-100 bg-blue-50/70 p-4 flex flex-col gap-2 shrink-0 h-fit self-start">
                  <button 
                    onClick={() => setActiveCategory('marketplace')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all cursor-pointer ${
                      activeCategory === 'marketplace' 
                        ? 'bg-[#1565D8] text-white shadow-md' 
                        : 'text-slate-600 hover:bg-blue-100/50 hover:text-slate-900'
                    }`}
                  >
                    <span className="block font-bold font-poppins text-sm">Marketplace</span>
                    <span className={`block text-[10px] mt-0.5 leading-tight ${activeCategory === 'marketplace' ? 'text-blue-100 font-medium' : 'text-slate-400 font-medium'}`}>
                      Get discovered by parents
                    </span>
                  </button>
                  <button 
                    onClick={() => setActiveCategory('crm')}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all cursor-pointer ${
                      activeCategory === 'crm' 
                        ? 'bg-[#1565D8] text-white shadow-md' 
                        : 'text-slate-600 hover:bg-blue-100/50 hover:text-slate-900'
                    }`}
                  >
                    <span className="block font-bold font-poppins text-sm">Admission CRM</span>
                    <span className={`block text-[10px] mt-0.5 leading-tight ${activeCategory === 'crm' ? 'text-blue-100 font-medium' : 'text-slate-400 font-medium'}`}>
                      Run admissions end-to-end
                    </span>
                  </button>
                </div>

                {/* Right Detail Panel */}
                <div className="flex-1 p-6 md:p-8 bg-white overflow-y-auto h-full custom-menu-scrollbar">
                  {activeCategory === 'marketplace' && (
                    <div className="space-y-4">
                      <div className="pb-2 flex items-center gap-2 border-b border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1565D8]" />
                        <h3 className="text-xs font-black font-poppins uppercase tracking-wider text-[#1565D8]">
                          Marketplace Platform
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-1 max-w-xl">
                        <Link 
                          href="/products/marketplace/free-listing" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <Building className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Free School Listing
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Claim your listing and get discovered by parents.
                            </p>
                          </div>
                        </Link>
                        <Link 
                          href="/products/marketplace/search-discovery" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <Search className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Parent Search & Discovery
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Advanced filtering by location, fees, and board.
                            </p>
                          </div>
                        </Link>
                        <Link 
                          href="/products/marketplace/compare" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <GitCompare className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Compare Schools
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Compare academic records, fees, and reviews side-by-side.
                            </p>
                          </div>
                        </Link>
                        <Link 
                          href="/products/marketplace/track-application" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <Activity className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Track Your Application
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Real-time progress updates on child school applications.
                            </p>
                          </div>
                        </Link>
                        <Link 
                          href="/products/marketplace/verified-badge" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <Award className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Verified Profile Badge
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Build instant trust and highlight your official profile.
                            </p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'crm' && (
                    <div className="space-y-4">
                      <div className="pb-2 flex items-center gap-2 border-b border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1565D8]" />
                        <h3 className="text-xs font-black font-poppins uppercase tracking-wider text-[#1565D8]">
                          Admission CRM Solutions
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                        <Link 
                          href="/products/lead-management" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Lead Management
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Capture and nurture inquiries across all channels.
                            </p>
                          </div>
                        </Link>
                        <Link 
                          href="/products/admission-management" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <ClipboardList className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Admission Management
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Automate student application flows and seat vetting.
                            </p>
                          </div>
                        </Link>
                        <Link 
                          href="/products/student-management" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <GraduationCap className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Student Management
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Track student profiles, documents, and academic history.
                            </p>
                          </div>
                        </Link>
                        <Link 
                          href="/products/course-management" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Course & Batch Management
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Organize classes, batches, subjects, and timetables.
                            </p>
                          </div>
                        </Link>
                        <Link 
                          href="/products/fee-management" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Fee & Payment Management
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Process online fees and issue automated receipts.
                            </p>
                          </div>
                        </Link>
                        <Link 
                          href="/products/campaign-management" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Campaign Management
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Run targeted WhatsApp, SMS, and email marketing.
                            </p>
                          </div>
                        </Link>
                        <Link 
                          href="/products/notifications-alerts" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Notifications & Alerts
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Instant transactional updates for parents and teachers.
                            </p>
                          </div>
                        </Link>
                        <Link 
                          href="/products/parent-portal" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Parent Portal
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Dedicated parent hub for fee payments and application tracking.
                            </p>
                          </div>
                        </Link>
                        <Link 
                          href="/products/reporting-analytics" 
                          className="group flex items-start gap-3 p-2.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-all duration-200"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#1565D8] text-white group-hover:bg-blue-700 flex items-center justify-center shrink-0 transition-colors duration-200">
                            <BarChart3 className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold font-poppins text-slate-800 group-hover:text-[#1565D8] transition-colors duration-200 block">
                              Reports & Analytics
                            </span>
                            <p className="text-[11px] font-normal text-slate-400 leading-normal">
                              Deep insights on admission conversion rates and cash flows.
                            </p>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom banner row */}
              <div className="bg-blue-50/50 border-t border-blue-100/50 px-6 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-extrabold text-[#1565D8] uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded shrink-0">
                    Listing offer
                  </span>
                  <p className="text-xs font-bold text-slate-700">
                    Free Discovery Listing &mdash; List your school free and get discovered by parents
                  </p>
                </div>
                <Link 
                  href="/register-school" 
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1565D8] hover:text-blue-700 transition group cursor-pointer"
                >
                  Get Started 
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
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
                    href="/products/marketplace/track-application" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="group flex items-center gap-2.5 py-1 hover:text-[#1565D8] transition"
                  >
                    <div className="w-6 h-6 rounded bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0">
                      <Activity className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-[#1565D8] transition-colors">Track Your Application</span>
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
