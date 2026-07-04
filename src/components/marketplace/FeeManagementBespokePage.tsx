'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  Calendar, Clock, PlusCircle, CreditCard, Receipt, Activity, 
  HelpCircle, ChevronDown, ChevronUp, ArrowRight, ShieldCheck, 
  School, GraduationCap, BookOpen, Building, CheckCircle2, 
  FileText, MessageSquare, Phone, BarChart, Settings, Check, 
  AlertTriangle, RefreshCw
} from 'lucide-react'

// Map of supported icons to render dynamically
const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar, Clock, PlusCircle, CreditCard, Receipt, Activity, Settings
}

export default function FeeManagementBespokePage() {
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
              Fee Management
            </span>
            <div className="flex gap-6 items-center text-xs font-bold text-slate-500">
              <Link href="#overview" className="hover:text-emerald-600 transition">Overview</Link>
              <Link href="#capabilities" className="hover:text-emerald-600 transition">Capabilities</Link>
              <Link href="#how-it-works" className="hover:text-emerald-600 transition">How It Works</Link>
              <Link href="#faq" className="hover:text-emerald-600 transition">FAQ</Link>
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
      <div className="max-w-7xl mx-auto w-full px-6 md:px-16 pt-8 pb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/" className="hover:text-slate-600">Home</Link>
        <span>&gt;</span>
        <Link href="/products" className="hover:text-slate-600">Products</Link>
        <span>&gt;</span>
        <span className="text-slate-600">Fee Management</span>
      </div>

      {/* 1. HERO SECTION */}
      <section className="text-center py-16 md:py-20 px-6 md:px-16 space-y-8 bg-gradient-to-b from-emerald-50/60 via-emerald-50/20 to-white rounded-3xl max-w-7xl mx-auto w-full">
        <span className="inline-flex items-center gap-1.5 border border-emerald-200 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 shadow-sm">
          AUTOMATED FEE COLLECTION
        </span>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.15] max-w-5xl mx-auto font-poppins py-1">
          Fee Management Software for Schools —{' '}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 bg-clip-text text-transparent px-1">
            With Integrated Razorpay Payments
          </span>
        </h1>
        
        <p className="text-slate-605 font-semibold text-base md:text-xl leading-relaxed max-w-3xl mx-auto">
          Stop chasing fee payments manually. Vidhyaan's fee management software automates invoicing, sends payment reminders, and now lets parents pay online directly through Razorpay — with every payment automatically reconciled against the right invoice.
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
            className="text-slate-605 hover:text-emerald-755 font-extrabold text-sm transition py-2"
          >
            See it in action
          </Link>
        </div>

        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          Free listing forever · Setup in under 15 minutes · No credit card required
        </p>
      </section>

      {/* 2. BILLING CYCLE CENTERPIECE GRAPHIC */}
      <section className="py-16 px-6 md:px-16 max-w-5xl mx-auto text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            Seamless Automated Billing Cycle
          </h2>
          <p className="text-slate-605 font-semibold text-base leading-relaxed max-w-xl mx-auto">
            From invoice to reconciled payment, without a spreadsheet in between.
          </p>
        </div>

        {/* Circular loop graphic */}
        <div className="relative w-full h-[400px] max-w-xl mx-auto flex items-center justify-center bg-slate-50/50 border border-slate-200/70 rounded-3xl shadow-sm p-4 overflow-hidden">
          {/* Loop paths representing flow */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            {/* Curved paths joining nodes in a circle */}
            {/* Top -> Right */}
            <path d="M 50% 12% A 38% 38% 0 0 1 88% 50%" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6,4" className="opacity-75" />
            {/* Right -> Bottom */}
            <path d="M 88% 50% A 38% 38% 0 0 1 50% 88%" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6,4" className="opacity-75" />
            {/* Bottom -> Left */}
            <path d="M 50% 88% A 38% 38% 0 0 1 12% 50%" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6,4" className="opacity-75" />
            {/* Left -> Top */}
            <path d="M 12% 50% A 38% 38% 0 0 1 50% 12%" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6,4" className="opacity-75" />
          </svg>

          {/* Central Logo Node */}
          <div className="absolute z-20 w-32 h-32 bg-gradient-to-tr from-emerald-600 to-teal-700 rounded-full flex flex-col items-center justify-center text-white border-4 border-white shadow-xl hover:scale-105 transition duration-300">
            <CreditCard className="w-8 h-8 mb-1.5" />
            <span className="text-xs font-black tracking-wide text-center leading-tight uppercase font-poppins">Razorpay<br/>Integrated</span>
          </div>

          {/* Node 1: Generate (Top) */}
          <div className="absolute top-[3%] left-1/2 -translate-x-1/2 z-10 w-[145px] bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm flex items-center gap-2 hover:shadow-md transition">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-700 text-left leading-tight">Generate Invoice</span>
          </div>

          {/* Node 2: Send (Right) */}
          <div className="absolute top-[44%] right-[2%] z-10 w-[145px] bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm flex items-center gap-2 hover:shadow-md transition">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-700 text-left leading-tight">Send to Parent</span>
          </div>

          {/* Node 3: Collect (Bottom) */}
          <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 z-10 w-[145px] bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm flex items-center gap-2 hover:shadow-md transition">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-700 text-left leading-tight">Collect (Online/UPI)</span>
          </div>

          {/* Node 4: Reconcile (Left) */}
          <div className="absolute top-[44%] left-[2%] z-10 w-[145px] bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm flex items-center gap-2 hover:shadow-md transition">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-700 text-left leading-tight">Auto Reconcile</span>
          </div>
        </div>

        {/* Institution types trust bar */}
        <div className="pt-6 border-t border-slate-100 max-w-3xl mx-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            Supports All Education Business Formats
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            <div className="flex items-center gap-2 grayscale opacity-75">
              <School className="w-4 h-4 text-emerald-650" />
              <span className="text-xs font-black text-slate-600 tracking-tight">K-12 Schools</span>
            </div>
            <div className="flex items-center gap-2 grayscale opacity-75">
              <GraduationCap className="w-4 h-4 text-teal-500" />
              <span className="text-xs font-black text-slate-600 tracking-tight">Junior Colleges</span>
            </div>
            <div className="flex items-center gap-2 grayscale opacity-75">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-black text-slate-600 tracking-tight">Coaching Institutes</span>
            </div>
            <div className="flex items-center gap-2 grayscale opacity-75">
              <Building className="w-4 h-4 text-rose-500" />
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
            <p className="text-slate-650 font-semibold text-base leading-relaxed">
              Managing fee collection shouldn't cost you hours of chasing parents and digging through bank statements. Vidhyaan consolidates all payments, reminders, and invoicing workflows into a single visual platform, bringing complete transparency to your school's accounts department.
            </p>
          </div>
          <div className="lg:col-span-5 flex items-center justify-center p-6 bg-slate-50/40 border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden h-64">
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
            
            <div className="flex items-center justify-between w-full max-w-sm relative z-10">
              {/* Scattered Chaos Left Side */}
              <div className="relative w-36 h-36">
                <div className="absolute top-1 left-2 p-2 bg-white rounded-xl border border-slate-200 shadow-sm rotate-[-8deg] flex items-center gap-1">
                  <BarChart className="w-4 h-4 text-red-500" />
                  <span className="text-[8px] font-bold text-slate-400">Excel</span>
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">×</span>
                </div>
                <div className="absolute top-10 right-4 p-2 bg-white rounded-xl border border-slate-200 shadow-sm rotate-[12deg] flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-red-500" />
                  <span className="text-[8px] font-bold text-slate-400">Chats</span>
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">×</span>
                </div>
                <div className="absolute bottom-2 left-6 p-2 bg-white rounded-xl border border-slate-200 shadow-sm rotate-[-15deg] flex items-center gap-1">
                  <FileText className="w-4 h-4 text-red-500" />
                  <span className="text-[8px] font-bold text-slate-400">Checks</span>
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">×</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-1 flex justify-center">
                <ArrowRight className="w-6 h-6 text-emerald-600 animate-pulse shrink-0" />
              </div>

              {/* Unified Razorpay checkmarked invoice */}
              <div className="relative p-5 bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl shadow-md flex flex-col items-center justify-center gap-1">
                <Receipt className="w-8 h-8 text-emerald-600" />
                <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider font-poppins font-bold">Auto Paid</span>
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
            <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-5" />
            
            {/* Chaos Overlay Cluster */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Cash element */}
              <div className="absolute top-6 left-6 p-3 bg-red-50 border border-red-100 text-red-500 rounded-xl shadow-sm rotate-[-15deg] z-10 flex items-center gap-1.5">
                <Receipt className="w-5 h-5" />
                <span className="text-[9px] font-bold">Unpaid Slip</span>
              </div>

              {/* WhatsApp Thread */}
              <div className="absolute top-8 right-6 p-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg shadow-sm rotate-[18deg] z-20 flex flex-col gap-0.5">
                <span className="text-[8px] font-black uppercase tracking-wide">WhatsApp</span>
                <span className="text-[7px] font-semibold text-slate-500">Chasing fee due...</span>
              </div>

              {/* Excel Spreadsheet */}
              <div className="absolute bottom-6 left-12 p-3 bg-red-50 border border-red-100 text-red-500 rounded-xl shadow-sm rotate-[8deg] z-10 flex items-center gap-1.5">
                <FileText className="w-5 h-5" />
                <span className="text-[9px] font-bold">Bank Statement</span>
              </div>

              {/* Calculator */}
              <div className="absolute bottom-4 right-10 p-3 bg-amber-50 border border-amber-100 text-amber-500 rounded-xl shadow-sm rotate-[-22deg] z-30 flex items-center gap-1.5">
                <BarChart className="w-5 h-5" />
                <span className="text-[9px] font-bold">Calculator</span>
              </div>

              {/* Chaos badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-red-500 text-white rounded-full shadow-lg z-40 rotate-[-5deg]">
                <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5">Billing Chaos</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 lg:order-2 text-left space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight font-poppins">
              Manual fee collection is costing you time you don't have
            </h2>
            <p className="text-slate-600 font-semibold text-base leading-relaxed">
              Indian schools and learning centers still lose hours every month to fee collection: generating invoices by hand, following up on WhatsApp for overdue payments, manually reconciling cash and bank transfers against the right student. Vidhyaan's school fee collection software replaces that entire manual cycle with one automated system — from invoice generation to payment to receipt, without your accounts team touching a spreadsheet.
            </p>
          </div>
        </div>
      </section>

      {/* 5. NARRATIVE SCREENSHOTS */}
      <section id="how-it-works" className="py-16 px-6 md:px-16 bg-slate-50/30 rounded-3xl space-y-16 scroll-mt-28 max-w-7xl mx-auto">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
            NARRATIVE WORKFLOW
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            Experience Seamless Billing Control
          </h2>
          <p className="text-slate-555 font-semibold text-sm md:text-base max-w-xl mx-auto">
            Take a look at how Vidhyaan turns manual billing into a simple, automated dashboard experience.
          </p>
        </div>

        <div className="space-y-16 max-w-6xl mx-auto">
          {/* Pair 1: List View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-4 text-left">
              <h3 className="text-2xl font-black text-slate-800 font-poppins">
                Every invoice, one dashboard
              </h3>
              <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
                Scan, search, and manage your entire school's billing ledger from a single view. Generate batch invoices for entire grades or courses instantly.
              </p>
              <ul className="space-y-2.5 pt-2">
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Color-coded status tabs tracking Paid, Unpaid, Overdue, and Waived invoices.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Batch invoice generation tools for class sections and programs.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Academic year and term filters to keep records clean.</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-tr from-slate-100 to-white border border-slate-200 p-4 rounded-3xl shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-100 transition-all duration-300">
              <div className="overflow-hidden rounded-2xl border border-slate-150/75 shadow-sm">
                <Image 
                  src="/images/products/fee-management-list-screenshot.png"
                  alt="Vidhyaan Fee Management list dashboard showing fee statistics, search utilities, invoice details, due dates, amount, and status indicators."
                  width={1024}
                  height={572}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 text-center pt-2">
                Unified fee management control board with batch generation capability.
              </p>
            </div>
          </div>

          {/* Pair 2: Detail View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="lg:order-2 space-y-4 text-left">
              <h3 className="text-2xl font-black text-slate-800 font-poppins">
                Payment to receipt, automatic
              </h3>
              <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
                Click any invoice to view payment schedules, digital receipt outputs, and custom payment splits. Enable direct Razorpay online payments with real-time sync.
              </p>
              <ul className="space-y-2.5 pt-2">
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Razorpay direct checkout integration (UPI, Netbanking, Cards).</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Instant digital receipt generation after any successful transaction.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Support for offline records tracking (Cash, Cheque, Bank Transfer).</span>
                </li>
              </ul>
            </div>
            <div className="lg:order-1 bg-gradient-to-tr from-slate-100 to-white border border-slate-200 p-4 rounded-3xl shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-100 transition-all duration-300">
              <div className="overflow-hidden rounded-2xl border border-slate-150/75 shadow-sm">
                <Image 
                  src="/images/products/fee-management-detail-screenshot.png"
                  alt="Vidhyaan Student Invoice detail dashboard showing invoice items, taxes, payment transaction logs, status history, and receipt download buttons."
                  width={1024}
                  height={585}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 text-center pt-2">
                Detailed student invoice statement screen with automated transactions log.
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
            Everything your finance team needs to manage school invoices end-to-end.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            {
              title: "Flexible fee plans, built for how Indian schools actually bill",
              body: "Create term-wise fee plans for schools and junior colleges, or course-wise recurring plans for learning centers and coaching centers — with flexible fee heads (tuition, transport, activity fees, and more) that can apply to all terms, a specific term, or a custom schedule you define.",
              icon: "Calendar",
              color: "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-100/50"
            },
            {
              title: "Batch invoice generation",
              body: "Generate invoices for an entire grade, an entire course, or your whole institution in a single click — instead of creating them one student at a time.",
              icon: "PlusCircle",
              color: "bg-blue-50 text-blue-700 border-blue-100 shadow-blue-100/50"
            },
            {
              title: "Scheduled & automatic billing",
              body: "Set up recurring course invoices that generate automatically on a fixed billing cycle, with no manual trigger needed each month.",
              icon: "Clock",
              color: "bg-amber-50 text-amber-700 border-amber-100 shadow-amber-100/50"
            },
            {
              title: "Integrated Razorpay payments — New",
              body: "Parents can now pay fees online directly from their portal — UPI, credit/debit cards, net banking, or wallets — with the payment automatically matched and reconciled against the correct invoice. No more manually marking invoices as paid after checking your bank statement.",
              icon: "CreditCard",
              color: "bg-indigo-50 text-indigo-750 border-indigo-100 shadow-indigo-100/50"
            },
            {
              title: "Real-time payment status tracking",
              body: "Every invoice shows a live status — Unpaid, Partially Paid, Paid, Overdue, or Waived — so your accounts team always has an accurate, up-to-date view without needing to ask.",
              icon: "Activity",
              color: "bg-rose-50 text-rose-700 border-rose-100 shadow-rose-100/50"
            },
            {
              title: "Automated payment receipts",
              body: "Once a payment is recorded (online or offline), a receipt generates automatically — no manual paperwork.",
              icon: "Settings",
              color: "bg-violet-50 text-violet-755 border-violet-100 shadow-violet-100/50"
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
                  {CapIcon ? <CapIcon className="w-8 h-8 md:w-9 md:h-9" /> : <CheckCircle2 className="w-8 h-8 md:w-9 md:h-9" />}
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-extrabold text-slate-800 text-lg md:text-xl font-poppins">
                    {cap.title}
                  </h3>
                  <p className="text-slate-555 font-semibold text-sm md:text-base leading-relaxed">
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
          <p className="text-slate-655 font-semibold text-base leading-relaxed max-w-xl mx-auto">
            A visual comparison of traditional school billing vs automated cloud invoicing.
          </p>
        </div>

        <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 md:p-6 text-sm font-black text-slate-800 uppercase tracking-wider font-poppins">The Old Way</th>
                <th className="p-4 md:p-6 text-sm font-black text-emerald-700 uppercase tracking-wider font-poppins">With Vidhyaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-4 md:p-6 text-xs md:text-sm font-semibold text-slate-500">
                  Manual WhatsApp chats and SMS reminders sent to parents one by one.
                </td>
                <td className="p-4 md:p-6 text-xs md:text-sm font-bold text-slate-800 bg-emerald-50/10">
                  Automated email, WhatsApp, and portal reminders scheduled automatically before due dates.
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-4 md:p-6 text-xs md:text-sm font-semibold text-slate-500">
                  Manual Excel tracking for terminal fees, extra activities, and custom transport charges.
                </td>
                <td className="p-4 md:p-6 text-xs md:text-sm font-bold text-slate-800 bg-emerald-50/10">
                  Batch generation engines that compile standard and custom invoice headers in seconds.
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-4 md:p-6 text-xs md:text-sm font-semibold text-slate-500">
                  Checking bank account portals and cash registers daily to match transfers manually.
                </td>
                <td className="p-4 md:p-6 text-xs md:text-sm font-bold text-slate-800 bg-emerald-50/10">
                  Instant Razorpay online payments gateway reconciliation with real-time status updates.
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-4 md:p-6 text-xs md:text-sm font-semibold text-slate-500">
                  Hand-written paper receipts or manually typed PDF receipt files sent via email.
                </td>
                <td className="p-4 md:p-6 text-xs md:text-sm font-bold text-slate-800 bg-emerald-50/10">
                  Auto-generated instant PDF digital receipts available to download on the Parent Portal.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 8. IS THIS RIGHT FOR YOUR INSTITUTION? */}
      <section className="py-12 px-6 md:px-16 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-8 md:p-10 space-y-4 shadow-sm">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
            Flexible Invoicing for Every Business Format
          </h2>
          <p className="text-slate-600 font-semibold text-base leading-relaxed">
            Vidhyaan adapts to how your institution operates. K-12 schools and Junior Colleges can utilize structured, academic-year term plans to auto-invoice on terminal schedules. Meanwhile, Learning Centers, Activity Hubs, and Coaching Classes can run recurring, course-based schedules that charge parents on a fixed weekly or monthly frequency automatically.
          </p>
        </div>
      </section>

      {/* 9. HONEST STATS ROW */}
      <section className="py-12 bg-slate-50 border-y border-slate-100 w-full">
        <div className="max-w-5xl mx-auto px-6 md:px-16">
          <div className="grid grid-cols-3 gap-4 md:gap-8 text-center">
            <div className="space-y-1">
              <span className="block text-3xl md:text-5xl font-black text-emerald-700 font-poppins">0</span>
              <span className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Manual Reconciliation Errors</span>
            </div>
            <div className="space-y-1">
              <span className="block text-3xl md:text-5xl font-black text-emerald-700 font-poppins">1</span>
              <span className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Click to generate batch</span>
            </div>
            <div className="space-y-1">
              <span className="block text-3xl md:text-5xl font-black text-emerald-700 font-poppins">15m</span>
              <span className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Average Setup Time</span>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FAQ SECTION */}
      <section id="faq" className="py-16 px-6 md:px-16 max-w-4xl mx-auto space-y-12 scroll-mt-28">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
            FAQS
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 font-semibold text-sm md:text-base max-w-xl mx-auto">
            Find answers to common questions about fee setups, reminders, and online transactions.
          </p>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {[
            {
              q: "Does Vidhyaan support online fee payment via Razorpay?",
              a: "Yes. Vidhyaan integrates directly with Razorpay, so parents can pay school fees online using UPI, cards, net banking, or wallets — with payments automatically reconciled against the correct invoice."
            },
            {
              q: "Can I still record offline payments (cash, cheque, bank transfer)?",
              a: "Yes. Online Razorpay payment is in addition to, not a replacement for, manual payment recording — your accounts team can log any offline payment method directly against an invoice."
            },
            {
              q: "Does this work for both schools and learning centers?",
              a: "Yes. Schools and junior colleges get term-based fee plans; learning centers and coaching centers get course-based recurring billing — the system adapts to your institution type automatically."
            },
            {
              q: "How long does it take to set up?",
              a: "Under 15 minutes — set up your fee structure once and you're ready to start generating invoices the same day."
            },
            {
              q: "What happens if a parent's Razorpay payment fails partway?",
              a: "If a payment attempt fails or is declined by the bank, Razorpay does not charge the parent. The invoice status in Vidhyaan remains 'Unpaid'. If the parent's account is debited but the payment is not marked as paid, Razorpay auto-refunds the amount within 3-5 business days."
            },
            {
              q: "Can we configure custom partial payment plans?",
              a: "Yes. You can split any terminal or course invoice into custom installments with unique due dates. The invoice will update to 'Partially Paid' when an installment is recorded, and automatically switch to 'Paid' only when the final balance reaches zero."
            },
            {
              q: "Are parents notified automatically when an invoice is generated?",
              a: "Yes. Once an invoice is generated or scheduled, parents receive automated email notifications and updates in their Parent Portal. You can also toggle SMS and WhatsApp integrations to send automated payment reminders before due dates."
            },
            {
              q: "How do we handle waiving or discounting fees for specific students?",
              a: "Admins can apply dynamic waivers or discounts to specific student invoices. You can select to waive specific fee heads completely or specify a custom discount value, which will update the total outstanding amount and log the action in the invoice timeline."
            },
            {
              q: "Is there a single transaction limit for Razorpay payments?",
              a: "By default, Razorpay supports transactions up to ₹10,00,000 per attempt for cards and net banking, while UPI limits are typically capped at ₹1,00,000 per day depending on the parent's bank. Custom transaction limits can be negotiated directly on your Razorpay dashboard."
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
                  <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-5 pt-1 text-slate-655 font-semibold text-xs md:text-sm leading-relaxed border-t border-slate-100">
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
            <Link href="/products/admission-management" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-emerald-650 transition">Admission CRM</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Streamline applications.</p>
              </div>
            </Link>
            <Link href="/products/parent-portal" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-emerald-650 transition">Parent Portal</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Online fee pay.</p>
              </div>
            </Link>
            <Link href="/products/reporting-analytics" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <BarChart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-emerald-650 transition">Reports & Analytics</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Track collections.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 13. CLOSING CTA */}
      <section className="py-16 px-6 md:px-16 text-center space-y-6 bg-gradient-to-b from-white to-emerald-50/50 animate-fade-in">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
          Ready to stop chasing fee payments?
        </h2>
        <p className="text-slate-655 font-semibold text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          Join schools already running their fee collection on Vidhyaan — free to list, live in under 15 minutes.
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
