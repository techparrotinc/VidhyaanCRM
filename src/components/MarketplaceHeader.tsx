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
  Loader2
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
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[#1565D8] flex items-center justify-center text-white font-black text-sm shadow-md">
              V
            </div>
            <span className="text-base font-black tracking-tight text-slate-900">Vidhyaan</span>
          </Link>

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
            <Link 
              href="/pricing" 
              className={`hover:text-[#1565D8] transition ${pathname === '/pricing' ? 'text-[#1565D8] font-bold' : ''}`}
            >
              Pricing
            </Link>
            <Link 
              href="/about" 
              className={`hover:text-[#1565D8] transition ${pathname === '/about' ? 'text-[#1565D8] font-bold' : ''}`}
            >
              About Us
            </Link>
            <Link 
              href="/contact" 
              className={`hover:text-[#1565D8] transition ${pathname === '/contact' ? 'text-[#1565D8] font-bold' : ''}`}
            >
              Contact Us
            </Link>
          </nav>

          {/* Right Header items (Auth-controlled) */}
          <div className="flex items-center gap-2.5">
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
        </div>

        {/* Mega Menu Dropdown */}
        {isProductsOpen && (
          <div 
            className="absolute left-0 right-0 top-16 w-full bg-white border-t-[3px] border-[#1565D8] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15),0_15px_25px_-10px_rgba(0,0,0,0.1)] z-40 transition-all duration-300 ease-out"
            onMouseEnter={() => setIsProductsOpen(true)}
          >
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 grid grid-cols-2 gap-8 relative">
              <div className="absolute top-8 bottom-8 left-1/2 w-px bg-[#E2E8F0] -translate-x-1/2 hidden md:block" />

              {/* CORE PRODUCTS */}
              <div className="pr-0 md:pr-8">
                <div className="flex items-center gap-2 pb-3 mb-6 border-b border-slate-100">
                  <LayoutGrid className="w-4 h-4 text-[#1565D8] fill-current" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-505">CORE PRODUCTS</h3>
                </div>
                
                <div className="space-y-3">
                  <Link href="/for-schools" className="flex items-start gap-4 p-3 rounded-r-2xl border-l-[3px] border-transparent hover:border-[#1565D8] hover:bg-[#F8FAFF] transition-all duration-300 group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] group-hover:bg-[#DBEAFE] text-[#1565D8] flex items-center justify-center shrink-0 transition-colors duration-300">
                      <Building className="w-5 h-5 fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-[#0F172A] group-hover:text-[#1565D8] transition-colors duration-300">School Profile</span>
                        <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-[#1565D8] group-hover:border-[#1565D8] group-hover:text-white transition-all duration-300">
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">Create and manage school listings and learning institutes online</p>
                    </div>
                  </Link>

                  <Link href="/register-school" className="flex items-start gap-4 p-3 rounded-r-2xl border-l-[3px] border-transparent hover:border-[#1565D8] hover:bg-[#F8FAFF] transition-all duration-300 group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-[#1565D8] flex items-center justify-center shrink-0 transition-colors duration-300">
                      <Building className="w-5 h-5 text-[#1565D8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-[#0F172A] group-hover:text-[#1565D8] transition-colors duration-300">Register School</span>
                        <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-[#1565D8] group-hover:border-[#1565D8] group-hover:text-white transition-all duration-300">
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">Register a new school or learning center on Vidhyaan</p>
                    </div>
                  </Link>

                  <Link href="/for-schools" className="flex items-start gap-4 p-3 rounded-r-2xl border-l-[3px] border-transparent hover:border-[#1565D8] hover:bg-[#F8FAFF] transition-all duration-300 group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-[#FFFBEB] group-hover:bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 transition-colors duration-300">
                      <UserPlus className="w-5 h-5 fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-[#0F172A] group-hover:text-[#1565D8] transition-colors duration-300">Admissions CRM</span>
                        <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-[#1565D8] group-hover:border-[#1565D8] group-hover:text-white transition-all duration-300">
                          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">Manage applications and convert enquiries into enrollments faster</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* PLATFORM MODULES */}
              <div className="pl-0 md:pl-8">
                <div className="flex items-center gap-2 pb-3 mb-6 border-b border-slate-100">
                  <Shield className="w-4 h-4 text-[#1565D8] fill-current" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-505">PLATFORM FEATURES</h3>
                </div>
                
                <div className="space-y-4 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Advanced Analytics</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Track views, inquiry statistics, and school listing conversions dynamically.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Unified Communications</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Direct WhatsApp, Email, and SMS notification alerts built-in.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  )
}
