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
  Trash, BookOpen, Layout, CheckCircle, Volume2, User, UserX, AlertTriangle
} from 'lucide-react'

export default function CampaignManagementBespokePage() {
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
              Campaign Management
            </span>
            <div className="flex gap-8 text-xs font-bold text-slate-500">
              <a href="#overview" className="hover:text-rose-600 transition">Overview</a>
              <a href="#capabilities" className="hover:text-rose-600 transition">Capabilities</a>
              <a href="#how-it-works" className="hover:text-rose-600 transition">How It Works</a>
              <a href="#faq" className="hover:text-rose-600 transition">FAQ</a>
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
        <span className="text-slate-600 font-bold">Campaign Management</span>
      </div>

      {/* 1. HERO SECTION */}
      <section className="text-center py-16 md:py-20 px-6 md:px-16 space-y-8 bg-gradient-to-b from-rose-50/60 via-rose-50/20 to-white rounded-3xl max-w-7xl mx-auto w-full">
        <span className="inline-flex items-center gap-1.5 border border-rose-200 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-rose-50 text-rose-700 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          MULTI-CHANNEL PARENT COMMUNICATION
        </span>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.15] max-w-5xl mx-auto font-poppins py-1">
          WhatsApp & Email Campaign Software for{' '}
          <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-800 bg-clip-text text-transparent px-1">
            Schools & Learning Centers
          </span>
        </h1>
        
        <p className="text-slate-600 font-semibold text-base md:text-xl leading-relaxed max-w-3xl mx-auto">
          Reach parents where they already are. Send admission reminders, fee notices, or event announcements across WhatsApp, email, and SMS — DLT-compliant, delivery tracked, from one dashboard.
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
            className="text-slate-600 hover:text-rose-700 font-extrabold text-sm transition py-2"
          >
            See it in action
          </Link>
        </div>

        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          Free listing forever · Setup in under 15 minutes · No credit card required
        </p>
      </section>

      {/* 2. DELIVERY FUNNEL CENTERPIECE GRAPHIC */}
      <section id="overview" className="py-16 px-6 md:px-16 max-w-5xl mx-auto text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            See Every Message Land
          </h2>
          <p className="text-slate-600 font-semibold text-base leading-relaxed max-w-xl mx-auto">
            Real delivery and engagement tracking, not just a "sent" confirmation.
          </p>
        </div>

        {/* Funnel bars narrowing top to bottom */}
        <div className="max-w-xl mx-auto flex flex-col gap-3 py-6 bg-slate-50/50 border border-slate-200/70 rounded-3xl p-6 shadow-sm">
          {/* Sent bar - 100% width */}
          <div className="w-full bg-slate-800 text-white flex justify-between items-center px-5 h-12 rounded-xl shadow-sm font-extrabold text-sm transition duration-300 hover:scale-[1.02]">
            <span className="flex items-center gap-2">📤 Sent</span>
            <span>100% (1,200 Messages)</span>
          </div>

          {/* Delivered bar - 92% width */}
          <div className="w-[92%] bg-rose-600 text-white flex justify-between items-center px-5 h-12 rounded-xl shadow-sm font-extrabold text-sm transition duration-300 hover:scale-[1.02]">
            <span className="flex items-center gap-2">📩 Delivered</span>
            <span>92% (1,104)</span>
          </div>

          {/* Opened bar - 74% width */}
          <div className="w-[74%] bg-purple-600 text-white flex justify-between items-center px-5 h-12 rounded-xl shadow-sm font-extrabold text-sm transition duration-300 hover:scale-[1.02]">
            <span className="flex items-center gap-2">👁️ Opened</span>
            <span>74% (888)</span>
          </div>

          {/* Engaged bar - 48% width */}
          <div className="w-[48%] bg-emerald-600 text-white flex justify-between items-center px-5 h-12 rounded-xl shadow-sm font-extrabold text-sm transition duration-300 hover:scale-[1.02]">
            <span className="flex items-center gap-2">🎯 Engaged</span>
            <span>48% (576)</span>
          </div>
        </div>

        {/* 4 Institution types trust bar */}
        <div className="border-t border-slate-100 pt-8 max-w-4xl mx-auto">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
            Supports All Educational Formats
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
            <div className="flex items-center gap-2 text-slate-500 font-extrabold text-sm">
              <School className="w-5 h-5 text-rose-500" />
              <span>Schools</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-extrabold text-sm">
              <GraduationCap className="w-5 h-5 text-purple-500" />
              <span>Junior Colleges</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-extrabold text-sm">
              <Library className="w-5 h-5 text-blue-500" />
              <span>Coaching Hubs</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-extrabold text-sm">
              <Building2 className="w-5 h-5 text-emerald-500" />
              <span>Learning Centers</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY SCHOOLS SWITCH + BROADCAST INFOGRAPHIC */}
      <section className="py-16 px-6 md:px-16 bg-slate-50 border-y border-slate-200/50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
              Why Schools Switch to Vidhyaan
            </h2>
            <p className="text-slate-600 font-semibold text-base leading-relaxed max-w-xl mx-auto">
              Replace tedious manual tasks with structured parent broadcasts.
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
                <h4 className="font-extrabold text-slate-800 text-sm font-poppins">Manual One-By-One Messages</h4>
                <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                  No delivery tracking, staff time lost sending announcements individually.
                </p>
              </div>

              {/* Scattered message bubbles with X marks */}
              <div className="absolute -top-1 -right-1 opacity-20 text-red-600 rotate-12">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="absolute bottom-4 left-6 opacity-20 text-red-600 -rotate-12">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="absolute top-1/2 right-4 opacity-20 text-red-600 rotate-[45deg]">
                <MessageSquare className="w-7 h-7" />
              </div>
            </div>

            {/* Transition Arrow */}
            <div className="md:col-span-1 flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-full border border-rose-100 rotate-90 md:rotate-0">
                <ArrowRight className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                Switch
              </span>
            </div>

            {/* The Vidhyaan Way Column */}
            <div className="md:col-span-3 border border-emerald-100 bg-emerald-50/10 p-6 rounded-2xl flex flex-col items-center justify-center space-y-6 min-h-[260px] relative overflow-hidden">
              <span className="absolute top-3 left-3 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                With Vidhyaan
              </span>
              <div className="relative p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full animate-pulse">
                <Volume2 className="w-8 h-8" />
              </div>
              <div className="text-center space-y-1 z-10">
                <h4 className="font-extrabold text-slate-800 text-sm font-poppins">Single Broadcast, Multi-Channel</h4>
                <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                  One template fanning out instantly with automated checkmarks.
                </p>
              </div>

              {/* Fanning clean checkmarked message bubbles */}
              <div className="absolute top-6 right-6 opacity-30 text-emerald-600 rotate-6">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="absolute bottom-4 left-4 opacity-30 text-emerald-600 -rotate-6">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="absolute top-1/2 left-10 opacity-30 text-emerald-600 rotate-12">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROBLEM SECTION + CHAOS INFOGRAPHIC */}
      <section className="py-16 px-6 md:px-16 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
            The Communication Gap
          </span>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight font-poppins leading-tight">
            Reaching parents shouldn't mean a hundred individual messages
          </h3>
          <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
            Staff manually messaging parents one by one creates administrative bottleneck. Without audience targeting or delivery tracking, institutions waste hours sending identical notices while missing critical parent updates.
          </p>
        </div>

        {/* Chaos Infographic */}
        <div className="relative w-full h-[240px] max-w-sm mx-auto bg-amber-50/20 border border-amber-100/50 rounded-3xl overflow-hidden flex items-center justify-center shadow-inner">
          {/* Email Icon */}
          <div className="absolute -top-2 left-6 rotate-12 p-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl shadow-md">
            <Mail className="w-6 h-6" />
          </div>

          {/* Phone Icon */}
          <div className="absolute top-12 left-1/4 -rotate-12 p-4 bg-amber-50 border border-amber-100 text-amber-600 rounded-3xl shadow-lg z-10 flex items-center gap-1.5">
            <Phone className="w-6 h-6 animate-bounce" />
            <span className="text-xs font-black">Call List</span>
          </div>

          {/* Contacts List Icon */}
          <div className="absolute bottom-6 left-12 rotate-6 p-3.5 bg-white border border-slate-200 text-slate-400 rounded-2xl shadow-sm">
            <Users className="w-5 h-5" />
          </div>

          {/* WhatsApp Icon */}
          <div className="absolute top-6 right-6 rotate-45 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-2xl shadow-md">
            <MessageSquare className="w-6 h-6" />
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
              How Campaign Management Works
            </h2>
            <p className="text-slate-600 font-semibold text-base leading-relaxed max-w-xl mx-auto">
              Three simple steps to coordinate targeted messages.
            </p>
          </div>

          {/* Screenshot 1 - Audience Builder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative border border-slate-200 rounded-3xl overflow-hidden shadow-xl bg-white aspect-[4/3] w-full flex items-center justify-center p-2 group hover:border-slate-300 transition-all">
              <Image 
                src="/images/products/campaign-management-detail-screenshot.png"
                alt="Vidhyaan Campaign creation and audience builder screen showing grades and admission status filters with live parent count logs."
                fill
                className="object-contain p-2"
                sizes="(max-w-1024px) 100vw, 50vw"
              />
            </div>
            <div className="space-y-6">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">
                STEP 1 — TARGETING
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                Build your exact audience
              </h3>
              <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
                No generic blasts. Target the exact parents you need to reach based on live academic and financial indicators.
              </p>
              <ul className="space-y-3.5">
                {[
                  "Filter by grade, admission status, or custom criteria to isolate recipients.",
                  "Live audience count preview updates automatically as filters are toggled.",
                  "Saved segment reuse lets you re-trigger notifications in a single tap."
                ].map((bullet, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-xs md:text-sm font-semibold text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Screenshot 2 - Campaign List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-8">
            <div className="space-y-6 order-2 lg:order-1">
              <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest block">
                STEP 2 — ENGAGEMENT
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                Track delivery, not just sends
              </h3>
              <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
                Follow your messages through the lifecycle. Review visual analytics summaries showing precise recipient behavior.
              </p>
              <ul className="space-y-3.5">
                {[
                  "Per-campaign delivery status tracking logs precise timeline details.",
                  "Open and engagement metrics reveal exactly who read your messages.",
                  "Scheduled vs sent history logs all communication ledger logs."
                ].map((bullet, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-xs md:text-sm font-semibold text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-purple-650 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative border border-slate-200 rounded-3xl overflow-hidden shadow-xl bg-white aspect-[4/3] w-full flex items-center justify-center p-2 group hover:border-slate-300 transition-all order-1 lg:order-2">
              <Image 
                src="/images/products/campaign-management-list-screenshot.png"
                alt="Vidhyaan Campaign management page listing past messages with channel type, sent date, and delivery/engagement analytics bars."
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
            Everything you need to orchestrate compliant parent campaigns.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {[
            {
              title: "DLT-registered WhatsApp templates",
              body: "Send WhatsApp campaigns using templates registered and approved under India's DLT guidelines. Every message template complies automatically with TRAI guidelines to prevent spam.",
              icon: ShieldCheck,
              iconBg: "bg-rose-50",
              iconText: "text-rose-600",
              border: "border-rose-100"
            },
            {
              title: "Email and SMS, same platform",
              body: "Run campaigns across WhatsApp, email, or SMS from the same audience list. No need to export CSVs or juggle multiple external SaaS subscriptions.",
              icon: Mail,
              iconBg: "bg-purple-50",
              iconText: "text-purple-650",
              border: "border-purple-100"
            },
            {
              title: "Audience filtering that actually targets",
              body: "Filter your audience by grade, admission status, lead status, or custom criteria. Ensure fee notices only go to unpaid invoices without emailing active student lists.",
              icon: Filter,
              iconBg: "bg-blue-50",
              iconText: "text-blue-600",
              border: "border-blue-100"
            },
            {
              title: "Delivery and engagement tracking",
              body: "See exactly what was sent, delivered, and opened for every campaign. Stop wondering if messages were read, and identify inactive parents immediately.",
              icon: BarChart,
              iconBg: "bg-amber-50",
              iconText: "text-amber-600",
              border: "border-amber-100"
            },
            {
              title: "Scheduled campaigns",
              body: "Schedule campaigns in advance to trigger automatically at the perfect parental coordinate. Set up fee announcements or holiday notices and let the queue run itself.",
              icon: Calendar,
              iconBg: "bg-emerald-50",
              iconText: "text-emerald-600",
              border: "border-emerald-100"
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
              Why manual messaging doesn't compare to an integrated campaign tool.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-2 bg-slate-900 text-white font-extrabold text-xs md:text-sm tracking-wide uppercase p-4 font-poppins">
              <div className="px-2">The Old Way</div>
              <div className="px-2 border-l border-slate-700 text-rose-400">With Vidhyaan</div>
            </div>

            {/* Comparison Rows */}
            {[
              {
                old: "One-by-one manual WhatsApp sending.",
                new: "One campaign, sent to the entire filtered audience."
              },
              {
                old: "No idea who actually received or opened the message.",
                new: "Real delivery and open/engagement tracking."
              },
              {
                old: "Manual list-building for each announcement.",
                new: "Reusable saved segments based on database filters."
              },
              {
                old: "No DLT compliance visibility or carrier templates.",
                new: "DLT-registered, compliant templates by default."
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

      {/* 8. IS THIS RIGHT FOR YOUR INSTITUTION CALLOUT */}
      <section className="py-16 px-6 md:px-16 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-rose-500/10 via-purple-500/5 to-white border border-rose-200/60 p-8 md:p-10 rounded-3xl shadow-sm space-y-6">
          <h3 className="text-2xl md:text-3xl font-black text-slate-955 font-poppins tracking-tight">
            Same Tool, Every Institution Type
          </h3>
          <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed">
            Whether you operate a K-12 school, junior college, learning center, or tutoring academy, parent communication works identically. While K-12 admins filter by grade levels and admission schedules, learning centers filter by course rosters and batch groups — the core broadcast mechanisms stay unified.
          </p>
        </div>
      </section>

      {/* 9. HONEST STATS ROW */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="pt-4 md:pt-0">
            <div className="text-4xl font-black text-rose-400 font-poppins">0</div>
            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Manual one-by-one messages</div>
          </div>
          <div className="pt-4 md:pt-0">
            <div className="text-4xl font-black text-purple-400 font-poppins">1</div>
            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Dashboard, every channel</div>
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
            Got questions about DLT compliance, campaign quotas, or deliverability?
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Is WhatsApp campaign sending DLT-compliant?",
              a: "Yes — all WhatsApp templates go through DLT (Distributed Ledger Technology) registration and approval before use, keeping you compliant with Indian telecom regulations."
            },
            {
              q: "Can I filter my audience before sending?",
              a: "Yes — by grade, admission or lead status, or custom criteria, so every campaign reaches exactly the right people."
            },
            {
              q: "Can I track whether parents actually received or opened a campaign?",
              a: "Yes — delivery and engagement tracking is built in for every campaign you send, showing live delivery logs and read receipts."
            },
            {
              q: "How long does it take to set up?",
              a: "Under 15 minutes — connect your audience filters and send your first campaign the same day."
            },
            {
              q: "Is there a limit on how many recipients I can message per campaign?",
              a: "Yes. Monthly campaign sending limits depend on your Vidhyaan plan: the Starter Plan supports up to 500 recipients per month, and the Growth Plan supports up to 5,00,0 recipients per month. Campaign sending is not available on the Free tier. Additionally, WhatsApp campaigns require the WhatsApp Add-on to be enabled."
            },
            {
              q: "Can I preview a campaign before sending it?",
              a: "Yes. The platform provides a live preview rendering exactly how your WhatsApp, SMS, or email message will appear on parent devices, including dynamic template parameters."
            },
            {
              q: "What happens if a WhatsApp template gets rejected during DLT registration?",
              a: "If a template is rejected by the carrier, Vidhyaan provides the rejection reason and templates editor to modify and resubmit. Our support team can assist in aligning copy to meet DLT/TRAI guidelines."
            },
            {
              q: "Can I reuse a previous campaign as a template for a new one?",
              a: "Yes. You can clone any previous draft, scheduled, or sent campaign with a single click, preserving the audience filters and message template."
            },
            {
              q: "Do parents need to opt in to receive campaigns?",
              a: "Yes. To maintain high deliverability and comply with telecom guidelines, parents must have an active relationship with your institution and not have opted out of communications."
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
                  <ChevronUp className="w-4 h-4 text-rose-600 shrink-0" />
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
            <Link href="/products/lead-management" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-300 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-rose-655 transition">Lead Management</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Streamline applications.</p>
              </div>
            </Link>
            <Link href="/products/notifications-alerts" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-300 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-rose-655 transition">Notifications & Alerts</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Automated updates.</p>
              </div>
            </Link>
            <Link href="/products/reporting-analytics" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-300 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <BarChart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm group-hover:text-rose-655 transition">Reports & Analytics</h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Track delivery logs.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 15. CLOSING CTA */}
      <section className="py-16 px-6 md:px-16 text-center space-y-6 bg-gradient-to-b from-white to-rose-50/50">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
          Ready to reach parents without the manual work?
        </h2>
        <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          Start setting up your campaigns today. No credit card required, free listing forever, and live in under 15 minutes.
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
