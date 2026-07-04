'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, Mail, Phone, Calendar, Clock, ArrowRight, 
  ShieldCheck, BarChart, CheckCircle2, ChevronDown, ChevronUp, 
  Users, Send, Settings, Eye, Copy, Sparkles, Filter, 
  HelpCircle, School, GraduationCap, Library, Building2,
  Trash, BookOpen, Layout, CheckCircle, Volume2, User, UserX, AlertTriangle,
  RefreshCw, PlusCircle, Receipt, ArrowRightLeft, FileText, CheckCircle2 as CheckIcon
} from 'lucide-react'

export default function CourseManagementBespokePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [showStickyNav, setShowStickyNav] = useState(false)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowStickyNav(true)
      } else {
        setShowStickyNav(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="w-full bg-white flex flex-col">
      {/* STICKY IN-PAGE NAV */}
      {showStickyNav && (
        <div className="sticky top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 hidden md:block transition-all duration-300 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto px-6 md:px-16 py-3 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest font-poppins">
              Course & Batch Management
            </span>
            <div className="flex gap-8 text-xs font-bold text-slate-500">
              <a href="#overview" className="hover:text-orange-600 transition">Overview</a>
              <a href="#capabilities" className="hover:text-orange-600 transition">Capabilities</a>
              <a href="#how-it-works" className="hover:text-orange-600 transition">How It Works</a>
              <a href="#faq" className="hover:text-orange-600 transition">FAQ</a>
            </div>
          </div>
        </div>
      )}

      {/* BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-8 pb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/" className="hover:text-slate-600 transition">Home</Link>
        <span>&gt;</span>
        <Link href="/products/institution-types" className="hover:text-slate-600 transition">Products</Link>
        <span>&gt;</span>
        <span className="text-slate-600 font-bold">Course & Batch Management</span>
      </div>

      {/* 1. HERO SECTION */}
      <section className="text-center py-16 md:py-20 px-6 md:px-16 space-y-8 bg-gradient-to-b from-orange-50/60 via-orange-50/20 to-white rounded-3xl max-w-7xl mx-auto w-full">
        <span className="inline-flex items-center gap-1.5 border border-orange-200 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-orange-50 text-orange-700 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          BUILT FOR COURSE-BASED LEARNING
        </span>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.15] max-w-5xl mx-auto font-poppins py-1">
          Course & Batch Management for{' '}
          <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-800 bg-clip-text text-transparent px-1">
            Learning Centers & Coaching Institutes
          </span>
        </h1>
        
        <p className="text-slate-600 font-semibold text-base md:text-xl leading-relaxed max-w-3xl mx-auto">
          Course catalogs, one-click enrollment, and automatic recurring billing — built for how learning centers actually operate, not a repurposed school admission system.
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
            className="text-slate-600 hover:text-orange-700 font-extrabold text-sm transition py-2"
          >
            See it in action
          </Link>
        </div>

        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          Free listing forever · Setup in under 15 minutes · No credit card required
        </p>
      </section>

      {/* 2. ENROLLMENT-TO-BILLING PIPELINE CENTERPIECE GRAPHIC */}
      <section id="overview" className="py-16 px-6 md:px-16 max-w-5xl mx-auto text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            Enroll Once, Bill Automatically
          </h2>
          <p className="text-slate-600 font-semibold text-base leading-relaxed max-w-xl mx-auto">
            The first invoice generates the moment a student enrolls — every one after that runs on its own.
          </p>
        </div>

        {/* 3-node horizontal flow centerpiece */}
        <div className="max-w-3xl mx-auto py-10 px-6 bg-slate-50/50 border border-slate-200/70 rounded-3xl shadow-sm relative overflow-hidden">
          {/* SVG arrows and loop connections */}
          <div className="absolute inset-0 pointer-events-none hidden md:block">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Connector line 1 */}
              <line x1="28%" y1="50%" x2="42%" y2="50%" stroke="#E2E8F0" strokeWidth="3" strokeDasharray="6 4" />
              {/* Connector line 2 */}
              <line x1="58%" y1="50%" x2="72%" y2="50%" stroke="#E2E8F0" strokeWidth="3" strokeDasharray="6 4" />
              {/* Loop arrow back from node 3 to node 2 */}
              <path d="M 78% 65% C 78% 90%, 50% 90%, 50% 65%" fill="none" stroke="#F97316" strokeWidth="2.5" strokeDasharray="5 3" />
            </svg>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
            {/* Node 1: Course Catalog */}
            <div className="flex flex-col items-center text-center space-y-3 w-full md:w-1/4">
              <div className="p-4 bg-orange-50 border border-orange-200 text-orange-600 rounded-full shadow-sm">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm font-poppins">1. Course Catalog</h4>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">Specify price & frequency</p>
              </div>
            </div>

            {/* Node 2: Student Enrolls */}
            <div className="flex flex-col items-center text-center space-y-3 w-full md:w-1/4 relative">
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-600 rounded-full shadow-sm">
                <Users className="w-7 h-7" />
              </div>
              {/* Small "recurring" badge near node 2 */}
              <div className="absolute -top-1 md:-top-3 bg-orange-100 text-orange-700 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm border border-orange-200">
                Recurring Loop
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm font-poppins">2. Student Enrolls</h4>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">Directly from profile card</p>
              </div>
            </div>

            {/* Node 3: Auto-Invoice Generated */}
            <div className="flex flex-col items-center text-center space-y-3 w-full md:w-1/4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full shadow-sm">
                <Receipt className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm font-poppins">3. Invoice Auto-Generated</h4>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">Re-bills automatically</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Institution types trust bar */}
        <div className="border-t border-slate-100 pt-8 max-w-4xl mx-auto">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
            Optimized for Specialized Academies
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
            <div className="flex items-center gap-2 text-slate-500 font-extrabold text-sm">
              <School className="w-5 h-5 text-orange-500" />
              <span>Music & Dance Academies</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-extrabold text-sm">
              <GraduationCap className="w-5 h-5 text-amber-500" />
              <span>Coaching Institutes</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-extrabold text-sm">
              <Library className="w-5 h-5 text-blue-500" />
              <span>Test Prep Hubs</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-extrabold text-sm">
              <Building2 className="w-5 h-5 text-emerald-500" />
              <span>Sports & Activity Clubs</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY LEARNING CENTERS SWITCH + INFOGRAPHIC */}
      <section className="py-16 px-6 md:px-16 bg-slate-50 border-y border-slate-200/50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
              Why Learning Centers Switch to Vidhyaan
            </h2>
            <p className="text-slate-600 font-semibold text-base leading-relaxed max-w-xl mx-auto">
              Skip traditional school setup flows. Rebuild custom catalogs instead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            {/* The Old Way Column */}
            <div className="md:col-span-3 border border-red-100 bg-red-50/10 p-6 rounded-2xl flex flex-col items-center justify-center space-y-6 min-h-[260px] relative overflow-hidden">
              <span className="absolute top-3 left-3 bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                The Old Way
              </span>
              <div className="relative p-4 bg-red-50 border border-red-100 text-red-600 rounded-full">
                <UserX className="w-8 h-8" />
              </div>
              <div className="text-center space-y-1 z-10">
                <h4 className="font-extrabold text-slate-800 text-sm font-poppins">School Admission ERP Clutter</h4>
                <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                  Forced admission pipeline stages, manual recurring billing reminders on separate spreadsheets.
                </p>
              </div>

              {/* Scattered spreadsheets & notes */}
              <div className="absolute top-12 right-6 opacity-25 text-red-500 rotate-12">
                <FileText className="w-8 h-8" />
              </div>
              <div className="absolute bottom-6 left-6 opacity-25 text-red-500 -rotate-12">
                <Trash className="w-6 h-6" />
              </div>
              <div className="absolute top-1/2 left-10 opacity-25 text-red-500 rotate-45">
                <AlertTriangle className="w-7 h-7" />
              </div>
            </div>

            {/* Transition Arrow */}
            <div className="md:col-span-1 flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-full border border-orange-100 rotate-90 md:rotate-0">
                <ArrowRight className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                Switch
              </span>
            </div>

            {/* The Vidhyaan Way Column */}
            <div className="md:col-span-3 border border-emerald-100 bg-emerald-50/10 p-6 rounded-2xl flex flex-col items-center justify-center space-y-6 min-h-[260px] relative overflow-hidden">
              <span className="absolute top-3 left-3 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                With Vidhyaan
              </span>
              <div className="relative p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="text-center space-y-1 z-10">
                <h4 className="font-extrabold text-slate-800 text-sm font-poppins">Integrated Course Catalog</h4>
                <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                  One clean course catalog setting, linking enrollment automatically to recurring invoices.
                </p>
              </div>

              {/* Checkmarks */}
              <div className="absolute top-6 right-6 opacity-35 text-emerald-600 rotate-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="absolute bottom-6 left-6 opacity-35 text-emerald-600 -rotate-6">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="absolute top-1/2 right-12 opacity-35 text-emerald-600 rotate-12">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROBLEM SECTION + CHAOS INFOGRAPHIC */}
      <section className="py-16 px-6 md:px-16 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
            The ERP Bottleneck
          </span>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight font-poppins leading-tight">
            Generic school ERPs don't fit how learning centers actually run
          </h3>
          <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
            School management software assumes formal grade levels and complex admission flows. This does not fit how a music studio, coding academy, or tutoring class bills students. In Vidhyaan, the course catalog and billing come first — keeping your administration light.
          </p>
        </div>

        {/* Chaos Infographic */}
        <div className="relative w-full h-[240px] max-w-sm mx-auto bg-amber-50/20 border border-amber-100/50 rounded-3xl overflow-hidden flex items-center justify-center shadow-inner">
          {/* Calendar Icon */}
          <div className="absolute -top-2 left-6 rotate-12 p-3 bg-orange-50 border border-orange-100 text-orange-500 rounded-2xl shadow-md">
            <Calendar className="w-6 h-6" />
          </div>

          {/* Roster Icon */}
          <div className="absolute top-12 left-1/4 -rotate-12 p-4 bg-amber-50 border border-amber-100 text-amber-600 rounded-3xl shadow-lg z-10 flex items-center gap-1.5">
            <FileText className="w-6 h-6 animate-bounce" />
            <span className="text-xs font-black">Class Roster</span>
          </div>

          {/* Cash Icon */}
          <div className="absolute bottom-6 left-12 rotate-6 p-3.5 bg-white border border-slate-200 text-emerald-500 rounded-2xl shadow-sm">
            <Receipt className="w-5 h-5" />
          </div>

          {/* Phone Icon */}
          <div className="absolute top-6 right-6 rotate-45 p-3.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl shadow-md">
            <Phone className="w-6 h-6" />
          </div>

          {/* Alert Icon */}
          <div className="absolute bottom-4 right-10 -rotate-12 p-3 bg-red-50 border border-red-100 text-red-500 rounded-2xl shadow-md">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* 5. NARRATIVE SCREENSHOTS SECTION */}
      <section id="how-it-works" className="py-16 px-6 md:px-16 bg-slate-50 border-t border-slate-200/50">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
              How Course & Batch Management Works
            </h2>
            <p className="text-slate-600 font-semibold text-base leading-relaxed max-w-xl mx-auto">
              Two simple views to coordinate your catalog and enrollments.
            </p>
          </div>

          {/* Screenshot 1 - Course Catalog */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative border border-slate-200 rounded-3xl overflow-hidden shadow-xl bg-white aspect-[4/3] w-full flex items-center justify-center p-2 group hover:border-slate-300 transition-all">
              <Image 
                src="/images/products/course-management-list-screenshot.png"
                alt="Vidhyaan Course catalog interface showing multiple course blocks including music, NEET coaching, and robotics with prices and schedules."
                fill
                className="object-contain p-2"
                sizes="(max-w-1024px) 100vw, 50vw"
              />
            </div>
            <div className="space-y-6">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">
                STEP 1 — SETUP
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                Set up your catalog once
              </h3>
              <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
                Add your classes to the digital catalog, configure custom fee frequencies, and establish standardized pricing guidelines.
              </p>
              <ul className="space-y-3.5">
                {[
                  "Custom course structures with unique titles, descriptions, and durations.",
                  "Flexible pricing setups supporting one-time registration or recurring fees.",
                  "Billing frequency options: monthly, quarterly, half-yearly, or custom schedules."
                ].map((bullet, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-xs md:text-sm font-semibold text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Screenshot 2 - Student Enrollment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-8">
            <div className="space-y-6 order-2 lg:order-1">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">
                STEP 2 — ENROLLMENT
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                Enroll and bill in one click
              </h3>
              <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
                Enroll students directly onto batch schedules from their active profile card. The system handles generation timelines.
              </p>
              <ul className="space-y-3.5">
                {[
                  "One-click student enrollment registers students onto batch schedules instantly.",
                  "First invoice is auto-generated the moment you complete the enrollment.",
                  "Per-course invoice history tracks payment history directly against the catalog."
                ].map((bullet, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-xs md:text-sm font-semibold text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative border border-slate-200 rounded-3xl overflow-hidden shadow-xl bg-white aspect-[4/3] w-full flex items-center justify-center p-2 group hover:border-slate-300 transition-all order-1 lg:order-2">
              <Image 
                src="/images/products/course-management-detail-screenshot.png"
                alt="Vidhyaan Student Profile with Course Enrollments card, displaying active chemistry prep course, next billing date, and invoices table."
                fill
                className="object-contain p-2"
                sizes="(max-w-1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. KEY CAPABILITIES (Row-based, colored icons, 5 items) */}
      <section id="capabilities" className="py-16 px-6 md:px-16 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            Key Capabilities
          </h2>
          <p className="text-slate-600 font-semibold text-base leading-relaxed max-w-xl mx-auto">
            Tools designed specifically for course-based institutions.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {[
            {
              title: "Custom course catalog",
              body: "Set up your courses — Carnatic Vocal, Bharatanatyam, NEET Prep, or Robotics. Each can have its own pricing and billing frequencies (one-time, monthly, or quarterly).",
              icon: BookOpen,
              iconBg: "bg-orange-50",
              iconText: "text-orange-655",
              border: "border-orange-100"
            },
            {
              title: "One-click student enrollment",
              body: "Register a student in a course directly from their student profile. The system triggers the first invoice immediately, without separate billing actions.",
              icon: PlusCircle,
              iconBg: "bg-purple-50",
              iconText: "text-purple-655",
              border: "border-purple-100"
            },
            {
              title: "Automatic recurring billing",
              body: "Set a billing cycle once and invoices generate on schedule going forward. Monthly course fees are processed automatically without manual interventions.",
              icon: RefreshCw,
              iconBg: "bg-teal-50",
              iconText: "text-teal-655",
              border: "border-teal-100"
            },
            {
              title: "Per-course invoice history",
              body: "Review ledger history linked to specific courses. Deep-link from a student's catalog record straight to their outstanding balances.",
              icon: Receipt,
              iconBg: "bg-blue-50",
              iconText: "text-blue-655",
              border: "border-blue-100"
            },
            {
              title: "Default course templates by category",
              body: "Seed your workspace with templates for music, dance, abacus, sports, and prep courses. Start from a functioning database and customise details instantly.",
              icon: Layout,
              iconBg: "bg-rose-50",
              iconText: "text-rose-655",
              border: "border-rose-100"
            }
          ].map((cap, idx) => {
            const CapIcon = cap.icon
            return (
              <div 
                key={idx} 
                className={`bg-white border ${cap.border} p-6 rounded-2xl shadow-sm flex flex-col md:flex-row gap-5 items-start transition-all hover:shadow-md`}
              >
                <div className={`p-4 rounded-xl shrink-0 ${cap.iconBg} ${cap.iconText}`}>
                  <CapIcon className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-800 text-lg font-poppins">
                    {cap.title}
                  </h3>
                  <p className="text-slate-600 font-semibold text-sm leading-relaxed">
                    {cap.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 7. VIDHYAAN VS THE OLD WAY COMPARISON */}
      <section className="py-16 px-6 md:px-16 bg-slate-50 border-t border-slate-200/50">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight font-poppins">
              Vidhyaan vs The Old Way
            </h2>
            <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
              Why spreadsheet tracking doesn't compare to structured catalog billing.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-2 bg-slate-900 text-white font-extrabold text-xs md:text-sm tracking-wide uppercase p-4 font-poppins">
              <div className="px-2">The Old Way</div>
              <div className="px-2 border-l border-slate-700 text-orange-400">With Vidhyaan</div>
            </div>

            {/* Comparison Rows */}
            {[
              {
                old: "Course lists tracked inside manual spreadsheet tabs.",
                new: "Structured catalog list with prices and rules built in."
              },
              {
                old: "Staff checking dates to send manual billing reminders.",
                new: "Automated recurring invoice generation on set frequencies."
              },
              {
                old: "No direct connection between enrollment and invoice creation.",
                new: "First invoice generates automatically upon batch registration."
              },
              {
                old: "Starting from a blank slate with no template guidelines.",
                new: "Seeded templates by category to start instantly."
              }
            ].map((row, idx) => (
              <div 
                key={idx} 
                className="grid grid-cols-2 text-xs md:text-sm font-semibold border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <div className="p-4 text-slate-500 border-r border-slate-100">
                  ❌ {row.old}
                </div>
                <div className="p-4 text-slate-800 font-bold">
                  ✅ {row.new}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. IS THIS RIGHT FOR YOUR INSTITUTION CALLOUT (Split two-column) */}
      <section className="py-16 px-6 md:px-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 border border-slate-200 p-8 md:p-10 rounded-3xl shadow-sm">
          {/* Left Column: LC/Coaching */}
          <div className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 font-poppins tracking-tight flex items-center gap-2">
              <CheckIcon className="w-5 h-5 text-orange-500" />
              Learning Centers & Coaching
            </h3>
            <p className="text-slate-600 font-semibold text-xs md:text-sm leading-relaxed">
              If you operate by registering students into discrete programs, courses, or scheduling batches, this module is built for you. It matches how you bill — linking batch capacities directly to automated, per-enrollment fee lists.
            </p>
          </div>

          {/* Right Column: Schools & JC */}
          <div className="space-y-4 md:border-l md:border-slate-200 md:pl-8">
            <h3 className="text-xl font-black text-slate-700 font-poppins tracking-tight flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-slate-400" />
              Schools & Junior Colleges
            </h3>
            <p className="text-slate-600 font-semibold text-xs md:text-sm leading-relaxed">
              K-12 schools and senior colleges bill using structured, term-based plans (tuition, transport, exams) rather than single course subscriptions. For standard school setups, we recommend using our dedicated Fee Management module.
            </p>
            <Link 
              href="/products/fee-management" 
              className="inline-flex items-center gap-1.5 text-xs font-black text-[#1565D8] hover:text-blue-700 transition"
            >
              Explore School Fee Management
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. HONEST STATS ROW */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="pt-4 md:pt-0">
            <div className="text-4xl font-black text-orange-400 font-poppins">0</div>
            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Manual billing triggers needed</div>
          </div>
          <div className="pt-4 md:pt-0">
            <div className="text-4xl font-black text-amber-400 font-poppins">1</div>
            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Click from enrollment to invoice</div>
          </div>
          <div className="pt-4 md:pt-0">
            <div className="text-4xl font-black text-emerald-400 font-poppins">15m</div>
            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Average setup time</div>
          </div>
        </div>
      </section>

      {/* 10. FAQ SECTION ACCORDION (9 Items) */}
      <section id="faq" className="py-16 px-6 md:px-16 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-poppins">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
            Got questions about billing frequencies, catalog customization, or trial bookings?
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Can I set different billing frequencies for different courses?",
              a: "Yes — each course can be configured with its own frequency (one-time, monthly, quarterly, half-yearly, annual, or custom) independently of other courses."
            },
            {
              q: "Does enrolling a student automatically create an invoice?",
              a: "Yes — the first invoice generates automatically the moment a student is enrolled, and subsequent recurring invoices trigger automatically based on the frequency defined."
            },
            {
              q: "Do I have to build my course catalog from scratch?",
              a: "No — Vidhyaan seeds a starting catalog template based on your category (Music, Dance, Coaching, Art, and more), which you can edit, remove, or add to freely."
            },
            {
              q: "Does this work for schools too, or just learning centers?",
              a: "This is specific to Learning Centers and Coaching Centers. Schools and Junior Colleges typically use term-based Fee Management since school invoicing structures are different."
            },
            {
              q: "Can a student be enrolled in more than one course at a time?",
              a: "Yes. The system supports multiple concurrent enrollments per student, allowing them to participate in and be billed for separate courses simultaneously."
            },
            {
              q: "What happens to billing if a student pauses or cancels a course mid-cycle?",
              a: "When a student enrollment is set to 'PAUSED' or 'CANCELLED', the recurring billing cron will automatically skip it. Invoicing will only resume if the enrollment status is updated back to 'ACTIVE'."
            },
            {
              q: "Can I change a course's price after students are already enrolled?",
              a: "Yes. Changing a course price updates subsequent invoice amounts dynamically. All future invoices generated by the recurring billing cron will use the new price."
            },
            {
              q: "Is there a limit on how many courses I can create?",
              a: "No. Vidhyaan does not place any software limits on the number of courses or batches you can create. You can configure as many programs as your learning center requires."
            },
            {
              q: "Can I run a free trial class before enrolling a student formally?",
              a: "Yes — Vidhyaan supports public Trial Class Bookings for learning centers. Parents can book a trial class directly on your center's public profile, choosing their preferred date and batch schedule. You can manage these trial requests as leads inside your dashboard, and then enroll them with one click once they decide to join."
            }
          ].map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-slate-300"
            >
              <button 
                onClick={() => toggleFaq(idx)}
                aria-expanded={openFaqIndex === idx}
                className="w-full text-left p-5 flex justify-between items-center font-bold text-slate-800 text-sm md:text-base font-poppins focus:outline-none cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaqIndex === idx ? (
                  <ChevronUp className="w-4 h-4 text-orange-600 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-5 pt-1 text-slate-600 font-semibold text-xs md:text-sm leading-relaxed border-t border-slate-100">
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
            <Link href="/products/student-management" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-300 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-orange-655 transition">Student Management</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Track student profiles.</p>
              </div>
            </Link>
            <Link href="/products/fee-management" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-300 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-orange-655 transition">Fee Management</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Online fee pay.</p>
              </div>
            </Link>
            <Link href="/products/lead-management" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-300 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600 shrink-0">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-orange-655 transition">Lead Management</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Streamline applications.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 15. CLOSING CTA */}
      <section className="py-16 px-6 md:px-16 text-center space-y-6 bg-gradient-to-b from-white to-orange-50/50">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
          Ready for software built for how you actually teach?
        </h2>
        <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          Start building your course catalog today. No credit card required, free listing forever, and live in under 15 minutes.
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
