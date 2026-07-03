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
  Lock
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
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                
                {/* Column 1 */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Admissions & Leads</h3>
                  <div className="space-y-4">
                    <Link href="/products/lead-management" className="group flex items-start gap-3 hover:text-[#1565D8] transition">
                      <Users className="w-5 h-5 text-slate-400 group-hover:text-[#1565D8] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1565D8]">Lead Management</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-normal font-medium">Manage every parent enquiry in one pipeline.</p>
                      </div>
                    </Link>
                    <Link href="/products/admission-management" className="group flex items-start gap-3 hover:text-[#1565D8] transition">
                      <ClipboardList className="w-5 h-5 text-slate-400 group-hover:text-[#1565D8] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1565D8]">Admission Management</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-normal font-medium">Convert enquiries to enrollments with structured workflows.</p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Students, Fees & Courses</h3>
                  <div className="space-y-4">
                    <Link href="/products/student-management" className="group flex items-start gap-3 hover:text-[#1565D8] transition">
                      <GraduationCap className="w-5 h-5 text-slate-400 group-hover:text-[#1565D8] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1565D8]">Student Management</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-normal font-medium">Maintain comprehensive digital records for every student.</p>
                      </div>
                    </Link>
                    <Link href="/products/fee-management" className="group flex items-start gap-3 hover:text-[#1565D8] transition">
                      <CreditCard className="w-5 h-5 text-slate-400 group-hover:text-[#1565D8] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1565D8]">Fee Management & Payments</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-normal font-medium">Automate fee collections, invoices, and payment tracking.</p>
                      </div>
                    </Link>
                    <Link href="/products/course-management" className="group flex items-start gap-3 hover:text-[#1565D8] transition">
                      <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-[#1565D8] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1565D8]">Course & Batch Management</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-normal font-medium">Organize academic terms, courses, and class sections.</p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Engagement & Insights</h3>
                  <div className="space-y-4">
                    <Link href="/products/campaign-management" className="group flex items-start gap-3 hover:text-[#1565D8] transition">
                      <MessageSquare className="w-5 h-5 text-slate-400 group-hover:text-[#1565D8] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1565D8]">Campaign Management</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-normal font-medium">Reach parents instantly with targeted broadcast campaigns.</p>
                      </div>
                    </Link>
                    <Link href="/products/reporting-analytics" className="group flex items-start gap-3 hover:text-[#1565D8] transition">
                      <BarChart3 className="w-5 h-5 text-slate-400 group-hover:text-[#1565D8] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1565D8]">Reporting & Analytics</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-normal font-medium">Track admission metrics and school performance trends.</p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Column 4 */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Access & Platform</h3>
                  <div className="space-y-4">
                    <Link href="/products/role-based-access" className="group flex items-start gap-3 hover:text-[#1565D8] transition">
                      <Lock className="w-5 h-5 text-slate-400 group-hover:text-[#1565D8] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1565D8]">Role-Based Access</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-normal font-medium">Secure access control for administrators, staff, and parents.</p>
                      </div>
                    </Link>
                    <Link href="/products/institution-types" className="group flex items-start gap-3 hover:text-[#1565D8] transition">
                      <Building className="w-5 h-5 text-slate-400 group-hover:text-[#1565D8] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1565D8]">Institution Types</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-normal font-medium">Tailored portals for K-12 schools, colleges, and academies.</p>
                      </div>
                    </Link>
                  </div>
                </div>

              </div>

              {/* Bottom banner row */}
              <Link 
                href="/register-school" 
                className="mt-2 p-4 bg-blue-50/60 hover:bg-blue-50 rounded-2xl flex items-center justify-between border border-blue-100/50 transition duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-[#1565D8] uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded shrink-0">Listing offer</span>
                  <p className="text-xs font-bold text-slate-700">
                    Free Discovery Listing — List your school free and get discovered by parents
                  </p>
                </div>
                <div className="text-xs font-extrabold text-[#1565D8] flex items-center gap-1 shrink-0">
                  Get Started <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>

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
                  <Link href="/products/lead-management" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Lead Management</Link>
                  <Link href="/products/admission-management" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Admission Management</Link>
                  <Link href="/products/student-management" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Student Management</Link>
                  <Link href="/products/fee-management" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Fee Management & Payments</Link>
                  <Link href="/products/course-management" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Course & Batch Management</Link>
                  <Link href="/products/campaign-management" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Campaign Management</Link>
                  <Link href="/products/reporting-analytics" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Reporting & Analytics</Link>
                  <Link href="/products/role-based-access" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Role-Based Access</Link>
                  <Link href="/products/institution-types" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-semibold text-slate-500 hover:text-[#1565D8]">Institution Types</Link>
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
