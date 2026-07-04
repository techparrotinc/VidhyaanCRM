'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  Calendar, Clock, Inbox, UserCheck, CheckSquare, 
  ListTodo, Activity, RefreshCw, BarChart, Settings, 
  Database, PlusCircle, CreditCard, Receipt, FileText, 
  Share2, Shield, Users, Mail, MessageSquare, 
  ShieldCheck, PieChart, ShieldAlert, KeyRound, HelpCircle,
  ChevronDown, ChevronUp, ArrowRight, Award, Trash, BookOpen,
  Layout, Filter, CheckCircle, Link as LinkIcon, School, 
  GraduationCap, Sparkles, Building, CheckCircle2, User, Layers
} from 'lucide-react'

// Map of supported icons to render dynamically
const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar, Clock, Inbox, UserCheck, CheckSquare, 
  ListTodo, Activity, RefreshCw, BarChart, Settings, 
  Database, PlusCircle, CreditCard, Receipt, FileText, 
  Share2, Shield, Users, Mail, MessageSquare, 
  ShieldCheck, PieChart, ShieldAlert, KeyRound, HelpCircle,
  ChevronDown, ChevronUp, ArrowRight, Award, Trash, BookOpen,
  Layout, Filter, CheckCircle, Link: LinkIcon, School,
  GraduationCap, Sparkles, Building, User, Layers
}

export default function StudentManagementBespokePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [showStickyNav, setShowStickyNav] = useState(false)

  // Track scroll position to toggle sticky navigation
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 450) {
        setShowStickyNav(true)
      } else {
        setShowStickyNav(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  return (
    <div className="w-full bg-white flex flex-col">
      {/* STICKY IN-PAGE NAV */}
      {showStickyNav && (
        <div className="sticky top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 hidden md:block transition-all duration-300 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto px-6 md:px-16 py-3 flex justify-between items-center">
            <span className="font-extrabold text-slate-800 text-sm font-poppins">
              Student Management
            </span>
            <div className="flex gap-6 items-center text-xs font-bold text-slate-500">
              <Link href="#overview" className="hover:text-purple-600 transition">Overview</Link>
              <Link href="#capabilities" className="hover:text-purple-600 transition">Capabilities</Link>
              <Link href="#how-it-works" className="hover:text-purple-600 transition">How It Works</Link>
              <Link href="#faq" className="hover:text-purple-600 transition">FAQ</Link>
              <Link href="/register-school">
                <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-[11px] px-4 py-2 rounded-lg h-auto transition shadow-md shadow-blue-500/10 cursor-pointer">
                  Claim Free Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-8 pb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/" className="hover:text-slate-600">Home</Link>
        <span>&gt;</span>
        <Link href="/products" className="hover:text-slate-600">Products</Link>
        <span>&gt;</span>
        <span className="text-slate-600">Student Management</span>
      </div>

      {/* 1. HERO SECTION */}
      <section className="text-center py-16 md:py-20 px-6 md:px-16 space-y-8 bg-gradient-to-b from-purple-50/60 via-purple-50/20 to-white rounded-3xl">
        <span className="inline-flex items-center gap-1.5 border border-purple-200 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          UNIFIED STUDENT RECORDS
        </span>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.15] max-w-5xl mx-auto font-poppins py-1">
          Student Management System —{' '}
          <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 bg-clip-text text-transparent px-1">
            One Record, Every Detail, Enrollment to Alumni
          </span>
        </h1>
        
        <p className="text-slate-600 font-semibold text-base md:text-xl leading-relaxed max-w-3xl mx-auto">
          A searchable, filterable student database that links directly to admissions and fees — so your team always has the full picture on any student, without digging through separate files or spreadsheets.
        </p>
        
        <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/register-school" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-base px-8 py-5 rounded-2xl h-auto shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 cursor-pointer">
              Claim Your Free Profile
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link 
            href="#how-it-works"
            className="text-slate-650 hover:text-purple-700 font-extrabold text-sm transition py-2"
          >
            See it in action
          </Link>
        </div>

        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          Free listing forever · Setup in under 15 minutes · No credit card required
        </p>
      </section>

      {/* 2. HUB-AND-SPOKE CENTERPIECE GRAPHIC */}
      <section className="py-12 px-6 md:px-16 max-w-5xl mx-auto text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            Every Detail, One Record
          </h2>
          <p className="text-slate-600 font-semibold text-base leading-relaxed max-w-xl mx-auto">
            Student data that used to live in five places now lives in one.
          </p>
        </div>

        {/* Hub-and-Spoke diagram container */}
        <div className="relative w-full h-[380px] max-w-xl mx-auto flex items-center justify-center bg-slate-50/50 border border-slate-200/70 rounded-3xl shadow-sm p-4 overflow-hidden">
          {/* Spoke lines connecting central node to satellites */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <line x1="50%" y1="50%" x2="16%" y2="16%" stroke="#c084fc" strokeWidth="2.5" strokeDasharray="6,4" className="opacity-80" />
            <line x1="50%" y1="50%" x2="84%" y2="16%" stroke="#c084fc" strokeWidth="2.5" strokeDasharray="6,4" className="opacity-80" />
            <line x1="50%" y1="50%" x2="16%" y2="84%" stroke="#c084fc" strokeWidth="2.5" strokeDasharray="6,4" className="opacity-80" />
            <line x1="50%" y1="50%" x2="84%" y2="84%" stroke="#c084fc" strokeWidth="2.5" strokeDasharray="6,4" className="opacity-80" />
            <line x1="50%" y1="50%" x2="50%" y2="90%" stroke="#c084fc" strokeWidth="2.5" strokeDasharray="6,4" className="opacity-80" />
          </svg>

          {/* Central Hub Node */}
          <div className="absolute z-20 w-32 h-32 bg-gradient-to-tr from-purple-600 to-indigo-700 rounded-full flex flex-col items-center justify-center text-white border-4 border-white shadow-xl hover:scale-105 transition duration-300">
            <Database className="w-8 h-8 mb-1.5" />
            <span className="text-xs font-black tracking-wide text-center leading-tight uppercase font-poppins">Student<br/>Record</span>
          </div>

          {/* Satellite Spoke 1: Admission History (Top-Left) */}
          <div className="absolute top-[8%] left-[4%] z-10 w-[140px] bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm flex items-center gap-2 hover:shadow-md transition">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Inbox className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-700 text-left leading-tight">Admission History</span>
          </div>

          {/* Satellite Spoke 2: Fee & Payments (Top-Right) */}
          <div className="absolute top-[8%] right-[4%] z-10 w-[140px] bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm flex items-center gap-2 hover:shadow-md transition">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-700 text-left leading-tight">Fee & Payments</span>
          </div>

          {/* Satellite Spoke 3: Guardian Details (Bottom-Left) */}
          <div className="absolute bottom-[8%] left-[4%] z-10 w-[140px] bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm flex items-center gap-2 hover:shadow-md transition">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-700 text-left leading-tight">Guardian Details</span>
          </div>

          {/* Satellite Spoke 4: Course Enrollment (LC) (Bottom-Right) */}
          <div className="absolute bottom-[8%] right-[4%] z-10 w-[140px] bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm flex items-center gap-2 hover:shadow-md transition">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-700 text-left leading-tight">Course Enrollment</span>
          </div>

          {/* Satellite Spoke 5: Status & Lifecycle (Bottom-Center) */}
          <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 z-10 w-[150px] bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm flex items-center justify-center gap-2 hover:shadow-md transition">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-700 text-left leading-tight">Status & Lifecycle</span>
          </div>
        </div>

        {/* Institution types trust bar */}
        <div className="pt-6 border-t border-slate-100 max-w-3xl mx-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            Supports All Education Business Formats
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            <div className="flex items-center gap-2 grayscale opacity-75">
              <School className="w-4 h-4 text-purple-650" />
              <span className="text-xs font-black text-slate-600 tracking-tight">K-12 Schools</span>
            </div>
            <div className="flex items-center gap-2 grayscale opacity-75">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-black text-slate-600 tracking-tight">Junior Colleges</span>
            </div>
            <div className="flex items-center gap-2 grayscale opacity-75">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-black text-slate-600 tracking-tight">Coaching Institutes</span>
            </div>
            <div className="flex items-center gap-2 grayscale opacity-75">
              <Building className="w-4 h-4 text-pink-500" />
              <span className="text-xs font-black text-slate-600 tracking-tight">Learning Centers</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY SCHOOLS SWITCH SECTION + INFOGRAPHIC */}
      <section className="py-16 px-6 md:px-16 max-w-5xl mx-auto scroll-mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 text-left space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
              Why Schools Switch to Vidhyaan
            </h2>
            <p className="text-slate-600 font-semibold text-base leading-relaxed">
              When student data is scattered across physical registers, Excel spreadsheets, paper admission forms, and offline fee ledgers, there is no single source of truth. Staff waste hours resolving basic details. Vidhyaan consolidates all records into one unified digital workspace, ensuring every teacher and admin sees correct, real-time data.
            </p>
          </div>
          <div className="lg:col-span-5 flex items-center justify-center p-6 bg-slate-50/40 border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden h-64">
            {/* Unique circular nodes layout for distinct visual comparison */}
            <div className="absolute inset-0 bg-[radial-gradient(#c084fc_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
            
            <div className="flex items-center justify-between w-full max-w-sm relative z-10">
              {/* Scattered papers and registers */}
              <div className="relative w-36 h-36">
                <div className="absolute top-1 left-2 p-2 bg-red-50 border border-red-100 text-red-500 rounded-xl shadow-sm rotate-[-8deg]">
                  <Database className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">×</span>
                </div>
                <div className="absolute top-10 right-4 p-2 bg-red-50 border border-red-100 text-red-500 rounded-xl shadow-sm rotate-[12deg]">
                  <FileText className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">×</span>
                </div>
                <div className="absolute bottom-2 left-6 p-2 bg-red-50 border border-red-100 text-red-500 rounded-xl shadow-sm rotate-[-15deg]">
                  <Layers className="w-5 h-5" />
                  <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">×</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-1 flex justify-center">
                <ArrowRight className="w-6 h-6 text-purple-600 animate-pulse shrink-0" />
              </div>

              {/* Unified Student Record folder */}
              <div className="relative p-5 bg-gradient-to-tr from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl shadow-md flex flex-col items-center justify-center gap-1">
                <User className="w-8 h-8 text-purple-600" />
                <span className="text-[9px] font-black uppercase text-purple-700 tracking-wider font-poppins">One Profile</span>
                <span className="absolute -top-2 -right-2 w-5.5 h-5.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-sm">✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROBLEM SECTION + CHAOS INFOGRAPHIC */}
      <section id="overview" className="py-16 px-6 md:px-16 scroll-mt-28 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 lg:order-1 flex items-center justify-center p-6 bg-red-50/20 border border-red-100/70 rounded-3xl shadow-sm relative overflow-hidden h-64">
            <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-5" />
            
            {/* Overlapping, messy stack representation */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Paper registers */}
              <div className="absolute top-6 left-6 p-3 bg-red-50 border border-red-100 text-red-500 rounded-xl shadow-sm rotate-[-15deg] z-10 flex items-center gap-1.5">
                <Database className="w-5 h-5" />
                <span className="text-[9px] font-bold">Register</span>
              </div>

              {/* Sticky note */}
              <div className="absolute top-8 right-6 p-3 bg-amber-50 border border-amber-100 text-amber-605 rounded-lg shadow-sm rotate-[18deg] z-20 flex flex-col gap-0.5">
                <span className="text-[8px] font-black uppercase tracking-wide">Sticky Note</span>
                <span className="text-[7px] font-semibold text-slate-500">Contact update?</span>
              </div>

              {/* Excel Spreadsheet */}
              <div className="absolute bottom-6 left-12 p-3 bg-red-50 border border-red-100 text-red-500 rounded-xl shadow-sm rotate-[8deg] z-10 flex items-center gap-1.5">
                <FileText className="w-5 h-5" />
                <span className="text-[9px] font-bold">Spreadsheet</span>
              </div>

              {/* Fee Slips */}
              <div className="absolute bottom-4 right-10 p-3 bg-amber-50 border border-amber-100 text-amber-550 rounded-xl shadow-sm rotate-[-22deg] z-30 flex items-center gap-1.5">
                <Receipt className="w-5 h-5" />
                <span className="text-[9px] font-bold">Fee Slip</span>
              </div>

              {/* Chaos indicator badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-red-500 text-white rounded-full shadow-lg z-40 rotate-[-5deg]">
                <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5">Scattered Info</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 lg:order-2 text-left space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight font-poppins">
              Student records shouldn't live in three different places
            </h2>
            <p className="text-slate-600 font-semibold text-base leading-relaxed">
              When admission details, contact numbers, and fee histories are divided between paper logs, Google Sheets, and personal contact lists, your staff operate in the dark. Miscommunication is guaranteed. Vidhyaan gathers all student touchpoints into a single visual log, so nothing depends on your team's memory.
            </p>
          </div>
        </div>
      </section>

      {/* 5. HOW STUDENT MANAGEMENT WORKS — NARRATIVE SCREENSHOTS */}
      <section id="how-it-works" className="py-16 px-6 md:px-16 bg-slate-50/30 rounded-3xl space-y-16 scroll-mt-28 max-w-7xl mx-auto">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full">
            NARRATIVE DEMO
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            How Student Management Works
          </h2>
          <p className="text-slate-500 font-semibold text-sm md:text-base max-w-xl mx-auto">
            Experience a system built around a clean, searchable database and comprehensive profile files.
          </p>
        </div>

        <div className="space-y-16 max-w-6xl mx-auto">
          {/* Pair 1: List View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-4 text-left">
              <h3 className="text-2xl font-black text-slate-800 font-poppins">
                Find any student instantly
              </h3>
              <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
                Our clean grid interface lets you search and organize your entire student body instantly. Filter by grade, status, or gender with tabs, and verify credentials instantly.
              </p>
              <ul className="space-y-2.5 pt-2">
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>Search by name, guardian, code, or roll number instantly.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>Filter tabs for Active, Alumni, and Transferred students.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>Color-coded status pills showing real-time lifecycle states.</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-tr from-slate-100 to-white border border-slate-200 p-4 rounded-3xl shadow-xl hover:shadow-purple-500/5 hover:border-purple-100 transition-all duration-300">
              <div className="overflow-hidden rounded-2xl border border-slate-150/75 shadow-sm">
                <Image 
                  src="/images/products/student-management-list-screenshot.png"
                  alt="Vidhyaan Student Management dashboard list view showing filter tabs, search criteria, student codes, names, grades, and lifecycle status pills."
                  width={1024}
                  height={572}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 text-center pt-2">
                Fully responsive student database list dashboard with real-time status tabs.
              </p>
            </div>
          </div>

          {/* Pair 2: Detail View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="lg:order-2 space-y-4 text-left">
              <h3 className="text-2xl font-black text-slate-800 font-poppins">
                The complete student story
              </h3>
              <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
                Click into any student profile to find their entire lifecycle log. See contact numbers, linked fee histories, parent credentials, and batch assignments in one visual page.
              </p>
              <ul className="space-y-2.5 pt-2">
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Linked admission files including original documents and forms.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Full payment history, outstanding invoices, and receipt history.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Guardian contact cards containing email, phone, and address details.</span>
                </li>
              </ul>
            </div>
            <div className="lg:order-1 bg-gradient-to-tr from-slate-100 to-white border border-slate-200 p-4 rounded-3xl shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all duration-300">
              <div className="overflow-hidden rounded-2xl border border-slate-150/75 shadow-sm">
                <Image 
                  src="/images/products/student-management-detail-screenshot.png"
                  alt="Vidhyaan Student Management profile detail dashboard showing demographic fields, contact options, academic history, and fee status."
                  width={1024}
                  height={585}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 text-center pt-2">
                Individual student file panel displaying lifecycle stages, fees log, and contacts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. KEY CAPABILITIES */}
      <section id="capabilities" className="py-16 px-6 md:px-16 space-y-12 scroll-mt-28 max-w-5xl mx-auto">
        <div className="border-b border-slate-200 pb-6 text-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-poppins">
            Key Capabilities
          </h2>
          <p className="text-slate-500 font-semibold text-sm mt-2 max-w-xl mx-auto">
            Everything your team needs to manage student records end-to-end.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            {
              title: "Searchable, filterable student database",
              body: "Quickly scan your entire student body by name, grade, or status directly from the control dashboard. This eliminates the need to dig through multiple binders or spread logs when looking up a record.",
              icon: "Database",
              color: "bg-purple-50 text-purple-700 border-purple-100 shadow-purple-100/50"
            },
            {
              title: "Guardian contact management",
              body: "Store primary guardian mobile numbers, emergency backups, and physical addresses right on the profile page. This ensures staff can reach parents instantly during emergencies without error.",
              icon: "Users",
              color: "bg-amber-50 text-amber-700 border-amber-100 shadow-amber-100/50"
            },
            {
              title: "Full lifecycle status tracking",
              body: "Track status updates dynamically as students move from Active to Alumni, Transferred, Suspended, or Dropped Out states. This keeps your active roster count clean and reports accurate.",
              icon: "Activity",
              color: "bg-indigo-50 text-indigo-750 border-indigo-100 shadow-indigo-100/50"
            },
            {
              title: "Linked admission and fee history",
              body: "Review original admission documents and fee invoices directly from a student's card. This allows counsellors and accountants to view a student's complete ledger history on one screen.",
              icon: "Receipt",
              color: "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-100/50"
            },
            {
              title: "Auto-generated student codes",
              body: "Generate unique format-standard student codes (STU-YYYY-XXXXX) automatically upon successful enrollment. This removes human keying mistakes and simplifies database structure.",
              icon: "Settings",
              color: "bg-violet-50 text-violet-750 border-violet-100 shadow-violet-100/50"
            },
            {
              title: "Course enrollment tracking",
              body: "Assign and track batch enrollments and class schedules for schools, coaching centers, and learning centers. This lets coordinators track who is assigned to which room at any hour.",
              icon: "Layers",
              color: "bg-sky-50 text-sky-700 border-sky-100 shadow-sky-100/50"
            }
          ].map((cap, idx) => {
            const CapIcon = IconMap[cap.icon]
            const isEven = idx % 2 === 0
            return (
              <div 
                key={idx} 
                className={`py-8 flex flex-col md:flex-row gap-6 items-start md:items-center ${
                  isEven ? '' : 'md:flex-row-reverse'
                }`}
              >
                <div className={`p-5 md:p-6 rounded-3xl shrink-0 shadow-md border ${cap.color}`}>
                  {CapIcon ? <CapIcon className="w-8 h-8 md:w-9 md:h-9" /> : <CheckCircle className="w-8 h-8 md:w-9 md:h-9" />}
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-extrabold text-slate-800 text-lg md:text-xl font-poppins">
                    {cap.title}
                  </h3>
                  <p className="text-slate-500 font-semibold text-sm md:text-base leading-relaxed">
                    {cap.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 7. VIDHYAAN VS THE OLD WAY */}
      <section className="py-16 px-6 md:px-16 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            Vidhyaan vs The Old Way
          </h2>
          <p className="text-slate-600 font-semibold text-base leading-relaxed max-w-xl mx-auto">
            A visual breakdown of how Vidhyaan replaces traditional paper logs and offline spreadsheets.
          </p>
        </div>

        <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 md:p-6 text-sm font-black text-slate-800 uppercase tracking-wider font-poppins">The Old Way</th>
                <th className="p-4 md:p-6 text-sm font-black text-purple-700 uppercase tracking-wider font-poppins">With Vidhyaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-4 md:p-6 text-xs md:text-sm font-semibold text-slate-500">
                  Paper registers or separate spreadsheets that require manual lookups and updates.
                </td>
                <td className="p-4 md:p-6 text-xs md:text-sm font-bold text-slate-800 bg-purple-50/30">
                  One searchable, filterable student database that any authorized staff can access in real-time.
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-4 md:p-6 text-xs md:text-sm font-semibold text-slate-500">
                  Fee records and admission documentation stored in isolated files or billing systems.
                </td>
                <td className="p-4 md:p-6 text-xs md:text-sm font-bold text-slate-800 bg-purple-50/30">
                  Linked automatically on every profile, displaying payment and admission files side-by-side.
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-4 md:p-6 text-xs md:text-sm font-semibold text-slate-500">
                  Manual data re-entry required across multiple platforms when a student's status changes.
                </td>
                <td className="p-4 md:p-6 text-xs md:text-sm font-bold text-slate-800 bg-purple-50/30">
                  One single status toggle update; the database record stays clean and active history is preserved.
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-4 md:p-6 text-xs md:text-sm font-semibold text-slate-500">
                  No visual history of past phone calls, counselor updates, or enrollment updates.
                </td>
                <td className="p-4 md:p-6 text-xs md:text-sm font-bold text-slate-800 bg-purple-50/30">
                  A complete chronological lifecycle log displayed on a single, easy-to-read screen.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 8. IS THIS RIGHT FOR YOUR INSTITUTION? */}
      <section className="py-12 px-6 md:px-16 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-3xl p-8 md:p-10 space-y-4 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
            One Record Format, Every Institution Type
          </h2>
          <p className="text-slate-600 font-semibold text-base leading-relaxed">
            Whether you operate a K-12 school, a junior college, a vocational learning academy, or a multi-branch coaching center, student records remain the core of your operation. Vidhyaan's unified record schema adapts to your structure automatically. K-12 schools use standardized roll numbers, while coaching centers and activity clubs take advantage of modular course enrollment tracking. This provides tailored fields without changing the core records framework.
          </p>
        </div>
      </section>

      {/* 9. HONEST STATS ROW */}
      <section className="py-12 bg-slate-50 border-y border-slate-100 w-full">
        <div className="max-w-5xl mx-auto px-6 md:px-16">
          <div className="grid grid-cols-3 gap-4 md:gap-8 text-center">
            <div className="space-y-1">
              <span className="block text-3xl md:text-5xl font-black text-purple-700 font-poppins">0</span>
              <span className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Duplicate Records</span>
            </div>
            <div className="space-y-1">
              <span className="block text-3xl md:text-5xl font-black text-purple-700 font-poppins">1</span>
              <span className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Unified Student Profile</span>
            </div>
            <div className="space-y-1">
              <span className="block text-3xl md:text-5xl font-black text-purple-700 font-poppins">15m</span>
              <span className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Average Setup Time</span>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FAQ SECTION */}
      <section id="faq" className="py-16 px-6 md:px-16 max-w-4xl mx-auto space-y-12 scroll-mt-28">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full">
            FAQS
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 font-semibold text-sm md:text-base max-w-xl mx-auto">
            Everything you need to know about setting up and using student profiles.
          </p>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {[
            {
              q: "Can I bulk-import existing student records?",
              a: "Yes. You can import your entire roster at once by uploading an Excel or CSV file. Standard formatting templates are provided in the student panel, allowing you to match names, roll numbers, and parent contacts in under 5 minutes."
            },
            {
              q: "What happens to a student's record if they're re-admitted after leaving?",
              a: "When a student is marked as Transferred or Alumni, their record is preserved in the database. If they return, you can search for their historic code and toggle their status back to Active. This avoids duplicate profile creation while maintaining their original timeline."
            },
            {
              q: "Can guardians update their own contact details?",
              a: "Yes. Once guardians are granted access to the Parent Portal, they can update their phone numbers and emails. Any modifications trigger a counsellor dashboard alert, and update the student profile log automatically."
            },
            {
              q: "Is there an audit log of changes to a student's record?",
              a: "Yes. Every profile edit — including counsellor notes, document attachments, and status modifications — is recorded chronologically in the Activity Log tab. It tracks the username of the staff member who made the modification."
            },
            {
              q: "Can I export student data?",
              a: "Yes. Staff with ORG_ADMIN credentials can export the student database to standard CSV or Excel files. You can choose to export the entire list or apply filter queries to isolate specific grades or statuses."
            },
            {
              q: "How secure is parent and student PII?",
              a: "PII is protected in compliance with India's Digital Personal Data Protection (DPDP) Act, 2023. Student databases are isolated by organization, and user access is governed by strict role-based controls."
            },
            {
              q: "Can teachers edit student profiles?",
              a: "Only staff with ORG_ADMIN or BRANCH_ADMIN roles can modify core profile parameters, student codes, or status fields. Staff with the TEACHER role are restricted to viewing student rosters and marking attendance logs."
            },
            {
              q: "Does the system support custom fields for school-specific data?",
              a: "Yes. Admins can define custom fields in Settings — such as blood group, bus route ID, or medical conditions. These parameters appear automatically as additional fields on every student profile form."
            },
            {
              q: "Are student codes generated per branch or organization-wide?",
              a: "Student codes are generated organization-wide to ensure global uniqueness. Each code uses standard format STU-YYYY-XXXXX, where YYYY represents the entry academic year, followed by an auto-incrementing integer."
            }
          ].map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-slate-300"
            >
              <button 
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-5 flex justify-between items-center font-bold text-slate-800 text-sm md:text-base font-poppins focus:outline-none cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaqIndex === idx ? (
                  <ChevronUp className="w-4 h-4 text-purple-600 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-5 pt-1 text-slate-650 font-semibold text-xs md:text-sm leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 11. RELATED FEATURES / RELATED LINKS */}
      <section className="py-16 px-6 md:px-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto space-y-8">
          <h3 className="text-center font-black text-slate-800 text-lg uppercase tracking-wider font-poppins">
            Explore Related Products
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link href="/products/admission-management" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-indigo-650 transition">Admission CRM</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Streamline applications.</p>
              </div>
            </Link>
            <Link href="/products/fee-management" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-indigo-650 transition">Fee Management</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Auto-generate invoices.</p>
              </div>
            </Link>
            <Link href="/products/course-management" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-indigo-650 transition">Course & Batch</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage schedules.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 13. CLOSING CTA */}
      <section className="py-16 px-6 md:px-16 text-center space-y-6 bg-gradient-to-b from-white to-purple-50/50">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
          Ready for one student record instead of three?
        </h2>
        <p className="text-slate-650 font-semibold text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          Start setting up your unified database today. No credit card required, free listing forever, and live in under 15 minutes.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/register-school" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-base px-8 py-5 rounded-2xl h-auto shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 cursor-pointer">
              Claim Your Free Profile
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* DPDP Trust line */}
      <div className="w-full text-center py-4 bg-slate-50 border-t border-slate-100 text-[10px] font-bold text-slate-400">
        🔒 100% compliant with India's Digital Personal Data Protection (DPDP) Act, 2023. All parent PII is protected.
      </div>
    </div>
  )
}
