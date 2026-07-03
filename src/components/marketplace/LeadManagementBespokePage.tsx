'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  School, Building2, GraduationCap, Library, 
  Globe, Phone, Users, Store, Inbox, UserCheck, 
  Activity, Calendar, Clock, RefreshCw, ArrowRight, 
  CheckCircle, HelpCircle, ChevronDown, ChevronUp,
  Sparkles, MessageSquare, Shield, Award, Send, PieChart,
  Mail
} from 'lucide-react'
import { leadManagementContent } from '@/content/products/lead-management'

export default function LeadManagementBespokePage() {
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

  // Define Icon mapping specifically for capabilities
  const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Inbox,
    UserCheck,
    Activity,
    Calendar,
    Clock,
    RefreshCw
  }

  return (
    <div className="w-full bg-white flex flex-col">
      {/* STICKY IN-PAGE NAV (PART 4) */}
      {showStickyNav && (
        <div className="sticky top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 hidden md:block transition-all duration-300 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto px-6 md:px-16 py-3 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest font-poppins">
              Lead Management
            </span>
            <div className="flex gap-8 text-xs font-bold text-slate-500">
              <a href="#overview" className="hover:text-indigo-650 transition">Overview</a>
              <a href="#capabilities" className="hover:text-indigo-650 transition">Capabilities</a>
              <a href="#journey" className="hover:text-indigo-650 transition">The Journey</a>
              <a href="#faq" className="hover:text-indigo-650 transition">FAQ</a>
            </div>
          </div>
        </div>
      )}

      {/* BREADCRUMB (PART 3) */}
      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-8 pb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Link href="/" className="hover:text-slate-655 transition">Home</Link>
        <span>&gt;</span>
        <Link href="/products/institution-types" className="hover:text-slate-655 transition">Products</Link>
        <span>&gt;</span>
        <span className="text-slate-655 font-bold">Lead Management</span>
      </div>

      {/* 1. HERO SECTION */}
      <section className="text-center py-16 md:py-20 px-6 md:px-16 space-y-8 bg-gradient-to-b from-indigo-50/60 via-indigo-50/20 to-white rounded-3xl">
        <span className="inline-flex items-center gap-1.5 border border-indigo-200 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-655 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Gen Admission CRM
        </span>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] max-w-4xl mx-auto font-poppins">
          Supercharge Your School's{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-[#1565D8] to-purple-600 bg-clip-text text-transparent">
            Lead Management
          </span>
        </h1>
        
        <p className="text-slate-600 font-semibold text-base md:text-xl leading-relaxed max-w-3xl mx-auto">
          {leadManagementContent.subhead}
        </p>

        {/* Intro Paragraph (PART 5) */}
        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-semibold">
          Most institutions switch to Vidhyaan after losing high-intent parent enquiries to manual register typos and fragmented WhatsApp threads. By consolidating all incoming channels into a single live dashboard, counsellors receive instant routing and automated daily follow-up alerts so no student enquiry is ever left cold.
        </p>
        
        <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href={leadManagementContent.primaryCta.href} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-base px-8 py-5 rounded-2xl h-auto shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 cursor-pointer">
              {leadManagementContent.primaryCta.text}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          {leadManagementContent.secondaryCta && (
            <Link 
              href={leadManagementContent.secondaryCta.href}
              className="text-slate-655 hover:text-indigo-700 font-extrabold text-sm transition py-2"
            >
              {leadManagementContent.secondaryCta.text}
            </Link>
          )}
        </div>

        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          {leadManagementContent.trustLine}
        </p>
      </section>

      {/* TRUST BAR (PART 1) */}
      <section className="py-6 px-6 md:px-16 flex flex-col items-center justify-center space-y-6 text-center">
        <span className="text-[11px] font-black text-slate-400 tracking-widest uppercase">
          Trusted by schools and learning centers across India
        </span>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-slate-400">
          <div className="flex items-center gap-2.5 p-3 px-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition hover:border-slate-200">
            <School className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-extrabold text-slate-700">K-12 Schools</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 px-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition hover:border-slate-200">
            <Building2 className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-extrabold text-slate-700">Junior Colleges</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 px-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition hover:border-slate-200">
            <GraduationCap className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-extrabold text-slate-700">Coaching Hubs</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 px-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition hover:border-slate-200">
            <Library className="w-5 h-5 text-pink-500" />
            <span className="text-sm font-extrabold text-slate-700">Learning Centers</span>
          </div>
        </div>
      </section>

      {/* PRODUCT SCREENSHOT SECTION (PART 2) */}
      <section className="py-12 px-6 md:px-16 space-y-10 flex flex-col items-center bg-slate-50/30 rounded-3xl">
        <div className="text-center space-y-2.5">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            See your leads in one pipeline
          </h2>
          <p className="text-slate-500 font-semibold text-sm md:text-base max-w-xl mx-auto">
            The actual Lead Management view your counsellors use every day.
          </p>
        </div>
        <div className="w-full max-w-5xl bg-gradient-to-tr from-slate-100 to-white border border-slate-200 p-4 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-indigo-500/5 hover:border-indigo-100">
          <Image 
            src="/images/products/lead-management-screenshot.png"
            alt="Vidhyaan Lead Management Pipeline Dashboard"
            width={1024}
            height={873}
            className="w-full h-auto rounded-2xl border border-slate-150/70"
            loading="lazy"
          />
        </div>
      </section>

      {/* 2. PROBLEM SECTION WITH ENHANCED GRAPHIC (PART 3) */}
      <section id="overview" className="py-16 px-6 md:px-16 scroll-mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Problem Copy */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight font-poppins">
              {leadManagementContent.problem.heading}
            </h2>
            <p className="text-slate-655 font-semibold text-base leading-relaxed">
              {leadManagementContent.problem.body}
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <span className="text-sm font-bold text-slate-700">Centralized storage removes paper logs and Excel chaos</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <span className="text-sm font-bold text-slate-700">Instant tracking ensures every counsellor is accountable</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Funnel Graphic */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden min-h-[350px] shadow-lg shadow-indigo-500/5">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/30 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-100/30 rounded-full blur-3xl -z-10" />

            <div className="flex flex-col items-center w-full relative">
              <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full mb-6">
                Channel Convergence
              </span>

              {/* Converging Sources */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-150 shadow-sm transition hover:scale-105">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800">Website</span>
                    <span className="text-[9px] text-slate-400 font-bold">Online Form</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-150 shadow-sm transition hover:scale-105">
                  <div className="p-2 bg-green-50 text-green-500 rounded-xl">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800">Phone Calls</span>
                    <span className="text-[9px] text-slate-400 font-bold">Tele-Enquiry</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-150 shadow-sm transition hover:scale-105">
                  <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800">Walk-ins</span>
                    <span className="text-[9px] text-slate-400 font-bold">Front Desk</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-150 shadow-sm transition hover:scale-105">
                  <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800">Marketplace</span>
                    <span className="text-[9px] text-slate-400 font-bold">Vidhyaan Page</span>
                  </div>
                </div>
              </div>

              {/* Connecting arrows */}
              <div className="w-full max-w-sm h-12 flex justify-center items-center my-4 relative">
                <div className="w-0.5 h-full bg-gradient-to-b from-indigo-200 to-indigo-500 animate-pulse" />
                <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-500 rounded-full animate-ping opacity-70" />
              </div>

              {/* Converged Destination: Pipeline Pill */}
              <div className="flex items-center gap-2.5 px-6 py-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/30 border border-indigo-500">
                <Inbox className="w-5 h-5 animate-bounce" />
                <span className="text-xs font-black uppercase tracking-widest font-poppins">
                  Unified Lead Pipeline
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 360° LIFE-CYCLE TIMELINE INFOGRAPHIC */}
      <section id="journey" className="py-16 px-6 md:px-16 bg-slate-50/30 rounded-3xl space-y-12 scroll-mt-28">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
            Engineered for Conversion
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            The 360° Lead-to-Student Journey
          </h2>
          <p className="text-slate-550 font-semibold text-sm md:text-base max-w-xl mx-auto">
            How Vidhyaan automates the pipeline from first contact to fully enrolled student.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">
              1
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">Auto-Capture</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              Leads flow from your website, phone, walk-ins, or your free Vidhyaan marketplace page directly into your pipeline.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-black">
              2
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">Smart Route</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              New enquiries automatically assign to counsellors, trigger instant notification alerts, and set follow-up tasks.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black">
              3
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">Track Timeline</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              Log call outcomes, WhatsApp messages, documents, and counselor notes directly under each student's profile.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
              4
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">1-Click Convert</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              Directly promote to Admissions or create active Student Records without re-entering any duplicate guardian details.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES */}
      <section id="capabilities" className="py-16 px-6 md:px-16 space-y-8 scroll-mt-28">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-poppins">
            Key Capabilities
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {leadManagementContent.capabilities.map((cap, idx) => {
            const CapIcon = IconMap[cap.icon]
            return (
              <div 
                key={idx} 
                className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-250 transition-all duration-200 flex gap-4 items-start"
              >
                <div className="p-3 rounded-xl shrink-0 bg-indigo-50 text-indigo-650">
                  {CapIcon ? <CapIcon className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                </div>
                <div className="space-y-1.5">
                  {cap.heading && (
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-indigo-700">
                      {cap.heading}
                    </span>
                  )}
                  <h3 className="font-extrabold text-slate-800 text-lg font-poppins">
                    {cap.title}
                  </h3>
                  <p className="text-slate-550 font-semibold text-sm leading-relaxed">
                    {cap.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* COMPARISON SECTION (PART 3) */}
      <section className="py-16 px-6 md:px-16 bg-slate-50/30 rounded-3xl space-y-10">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
            Modernize Your Workflow
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            Vidhyaan vs. The Old Way
          </h2>
          <p className="text-slate-500 font-semibold text-sm md:text-base max-w-xl mx-auto">
            See how moving to a unified pipeline compares to manual registers and spreadsheet tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* The Old Way Column */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              Spreadsheets & Registers
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-extrabold shrink-0 mt-0.5">✗</span>
                <span className="text-sm font-semibold text-slate-600">Spreadsheets get cluttered, leading to missed or ignored rows</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-extrabold shrink-0 mt-0.5">✗</span>
                <span className="text-sm font-semibold text-slate-600">Juggling WhatsApp groups and calls to chase follow-ups manually</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-extrabold shrink-0 mt-0.5">✗</span>
                <span className="text-sm font-semibold text-slate-600">Counsellors assigned verbally with zero tracking or history</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-extrabold shrink-0 mt-0.5">✗</span>
                <span className="text-sm font-semibold text-slate-600">No team-wide visibility into stuck leads or cold follow-ups</span>
              </li>
            </ul>
          </div>

          {/* Vidhyaan Column */}
          <div className="bg-gradient-to-b from-indigo-50/30 to-white border border-indigo-150 rounded-3xl p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-indigo-900 border-b border-indigo-100/50 pb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
              Vidhyaan CRM
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-emerald-550 font-black shrink-0 mt-0.5">✓</span>
                <span className="text-sm font-bold text-slate-800">One live, unified pipeline for every single parent enquiry</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-550 font-black shrink-0 mt-0.5">✓</span>
                <span className="text-sm font-bold text-slate-800">Scheduled reminders and WhatsApp notifications per lead</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-550 font-black shrink-0 mt-0.5">✓</span>
                <span className="text-sm font-bold text-slate-800">One-click counsellor assignment with full audit logs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-550 font-black shrink-0 mt-0.5">✓</span>
                <span className="text-sm font-bold text-slate-800">Real-time status dashboards to identify pipeline blockages</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SUB-FEATURE HIGHLIGHTS (PART 4) */}
      <section className="py-16 px-6 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex gap-4 items-start p-6 bg-slate-50 rounded-2xl border border-slate-150/80 shadow-sm">
            <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 text-base">Manage leads from any device</h4>
              <p className="text-slate-550 font-semibold text-xs leading-relaxed">
                Vidhyaan works entirely in your browser with a fully responsive layout. Manage enquiries on the go, with no mobile app install required.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-6 bg-slate-50 rounded-2xl border border-slate-150/80 shadow-sm">
            <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 text-base">Filter and act fast</h4>
              <p className="text-slate-550 font-semibold text-xs leading-relaxed">
                Quickly sort leads by status (New, Contacted, Converted, Rejected, or Follow-up) directly from the dashboard to focus on hot prospects first.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      <section className="py-16 px-6 md:px-16 bg-gradient-to-b from-indigo-50/20 via-white to-slate-50/40 rounded-3xl">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="text-center space-y-2 py-4 md:py-0">
            <span className="text-6xl font-black text-[#1565D8] block font-poppins tracking-tight">
              0
            </span>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto block leading-tight">
              Leads lost to missed follow-ups
            </span>
          </div>
          <div className="text-center space-y-2 pt-6 md:pt-0 py-4 md:py-0">
            <span className="text-6xl font-black text-[#1565D8] block font-poppins tracking-tight">
              1
            </span>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto block leading-tight">
              Pipeline, every source
            </span>
          </div>
          <div className="text-center space-y-2 pt-6 md:pt-0 py-4 md:py-0">
            <span className="text-6xl font-black text-[#1565D8] block font-poppins tracking-tight">
              15m
            </span>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto block leading-tight">
              Average setup time
            </span>
          </div>
        </div>
      </section>

      {/* 5. WHO THIS IS FOR */}
      <section className="py-12 px-6 md:px-16 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-indigo-600" />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-poppins">
            {leadManagementContent.whoThisIsFor.heading}
          </h2>
        </div>
        <p className="text-slate-655 font-semibold text-base leading-relaxed">
          {leadManagementContent.whoThisIsFor.body}
        </p>
      </section>

      {/* 6. FAQ */}
      <section id="faq" className="py-16 px-6 md:px-16 bg-slate-50/30 rounded-3xl space-y-6 scroll-mt-28">
        <div className="border-b border-slate-200 pb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-slate-500" />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-poppins">
            {leadManagementContent.faq.heading}
          </h2>
        </div>
        <div className="space-y-3">
          {leadManagementContent.faq.items.map((item, idx) => {
            const isOpen = openFaqIndex === idx
            return (
              <div 
                key={idx} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-slate-50/50 transition cursor-pointer"
                >
                  <span className="font-extrabold text-slate-800 text-sm md:text-base font-poppins">
                    {item.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-slate-650 text-sm font-medium leading-relaxed border-t border-slate-100 bg-slate-50/20">
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 7. CLOSING CTA */}
      <section className="bg-gradient-to-tr from-blue-50/80 to-indigo-50/30 py-20 px-6 md:px-16 text-center space-y-6 rounded-3xl">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
          {leadManagementContent.closingCta.heading}
        </h2>
        <p className="text-slate-605 font-semibold text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          {leadManagementContent.closingCta.body}
        </p>

        {/* Closing CTA Supporting Wording (PART 5) */}
        <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
          Start instantly with no credit card, no complex IT setup, and get your dashboard live on the same day.
        </p>

        <div className="pt-4 flex justify-center">
          <Link href={leadManagementContent.closingCta.ctaHref} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-base px-8 py-4.5 rounded-2xl h-auto shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 cursor-pointer">
              {leadManagementContent.closingCta.ctaText}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 8. RELATED LINKS (REDESIGNED CARDS - PART 1) */}
      <section className="bg-slate-50/20 py-12 px-6 md:px-16 border-t border-slate-100 space-y-6">
        <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest text-center">
          Explore Related CRM Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link href="/products/admission-management" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex items-center gap-4 group">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-650 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm md:text-base group-hover:text-purple-700 transition">
                Admission Management
              </h4>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                Schools & Junior Colleges
              </span>
            </div>
          </Link>

          <Link href="/products/student-management" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex items-center gap-4 group">
            <div className="p-3 rounded-xl bg-teal-50 text-teal-650 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm md:text-base group-hover:text-teal-700 transition">
                Student Management
              </h4>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">
                All Institution Types
              </span>
            </div>
          </Link>

          <Link href="/products/campaign-management" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-pink-300 transition-all flex items-center gap-4 group">
            <div className="p-3 rounded-xl bg-pink-50 text-pink-650 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm md:text-base group-hover:text-pink-700 transition">
                Campaign Management
              </h4>
              <span className="text-[10px] font-bold text-pink-600 uppercase tracking-wider block">
                WhatsApp & Email Drives
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* DPDP Trust line (PART 5) */}
      <div className="w-full text-center py-4 bg-slate-50 border-t border-slate-100 text-[10px] font-bold text-slate-400">
        🔒 ISO 27001 Certified &bull; 100% compliant with India's Digital Personal Data Protection (DPDP) Act, 2023. All parent PII is protected.
      </div>
    </div>
  )
}
