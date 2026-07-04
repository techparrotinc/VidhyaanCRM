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
  Mail, FileText, Settings, BarChart, ChevronRight
} from 'lucide-react'
import { admissionManagementContent } from '@/content/products/admission-management'

export default function AdmissionManagementBespokePage() {
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

  // Icon mapping for capabilities
  const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Settings,
    FileText,
    Clock,
    UserCheck,
    BarChart,
    Phone,
    Activity
  }

  return (
    <div className="w-full bg-white flex flex-col">
      {/* STICKY IN-PAGE NAV */}
      {showStickyNav && (
        <div className="sticky top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-30 hidden md:block transition-all duration-300 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto px-6 md:px-16 py-3 flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest font-poppins">
              Admission Management
            </span>
            <div className="flex gap-8 text-xs font-bold text-slate-500">
              <a href="#overview" className="hover:text-purple-700 transition">Overview</a>
              <a href="#capabilities" className="hover:text-purple-700 transition">Capabilities</a>
              <a href="#journey" className="hover:text-purple-700 transition">The Journey</a>
              <a href="#faq" className="hover:text-purple-700 transition">FAQ</a>
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
        <span className="text-slate-600 font-bold">Admission Management</span>
      </div>

      {/* 1. HERO SECTION */}
      <section className="text-center py-16 md:py-20 px-6 md:px-16 space-y-8 bg-gradient-to-b from-purple-50/60 via-purple-50/20 to-white rounded-3xl">
        <span className="inline-flex items-center gap-1.5 border border-purple-200 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Structured Admission CRM
        </span>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.15] max-w-5xl mx-auto font-poppins py-1">
          Admission Management System for{' '}
          <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 bg-clip-text text-transparent px-1">
            Schools & Junior Colleges
          </span>
        </h1>
        
        <p className="text-slate-600 font-semibold text-base md:text-xl leading-relaxed max-w-3xl mx-auto">
          Replace registers and spreadsheets with a real admission management system, built for how Indian schools and junior colleges actually admit students — from application received to admitted, waitlisted, or rejected, with nothing falling through the cracks.
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
            className="text-slate-600 hover:text-purple-700 font-extrabold text-sm transition py-2"
          >
            See it in action
          </Link>
        </div>

        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          Free listing forever · Setup in under 15 minutes · No credit card required
        </p>
      </section>

      {/* 2. STAGE-STEPPER CENTERPIECE */}
      <section className="py-16 px-6 md:px-16 bg-slate-50/50 rounded-3xl space-y-12 max-w-6xl mx-auto border border-slate-100 shadow-sm">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full">
            Pipeline Visualizer
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            Admissions Flow, Visualized
          </h2>
          <p className="text-slate-500 font-semibold text-sm md:text-base max-w-xl mx-auto">
            From the initial application to the final decision. Move applicants through custom stages with zero friction.
          </p>
        </div>

        {/* Stepper Grid/Flex Container */}
        <div className="flex flex-col lg:flex-row items-center lg:justify-between gap-6 lg:gap-4 p-8 bg-white border border-slate-150 rounded-3xl shadow-sm relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50/40 rounded-full blur-3xl -z-10" />

          {/* Stage 1 */}
          <div className="flex flex-col items-center text-center p-4 min-w-[140px] relative space-y-3 group">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-md border border-blue-100 transition group-hover:scale-105">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 font-poppins">Applied</h3>
              <p className="text-[10px] font-bold text-slate-400">Application Received</p>
            </div>
          </div>

          {/* Connector 1 */}
          <div className="hidden lg:block text-slate-300">
            <ArrowRight className="w-6 h-6 animate-pulse" />
          </div>
          <div className="lg:hidden text-slate-300">↓</div>

          {/* Stage 2 */}
          <div className="flex flex-col items-center text-center p-4 min-w-[140px] relative space-y-3 group">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-md border border-amber-100 transition group-hover:scale-105">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 font-poppins">Verification</h3>
              <p className="text-[10px] font-bold text-slate-400">Documents Collected</p>
            </div>
          </div>

          {/* Connector 2 */}
          <div className="hidden lg:block text-slate-300">
            <ArrowRight className="w-6 h-6 animate-pulse" />
          </div>
          <div className="lg:hidden text-slate-300">↓</div>

          {/* Stage 3 */}
          <div className="flex flex-col items-center text-center p-4 min-w-[140px] relative space-y-3 group">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-md border border-indigo-100 transition group-hover:scale-105">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 font-poppins">Interview</h3>
              <p className="text-[10px] font-bold text-slate-400">Meeting Scheduled</p>
            </div>
          </div>

          {/* Connector 3 */}
          <div className="hidden lg:block text-slate-300">
            <ArrowRight className="w-6 h-6 animate-pulse" />
          </div>
          <div className="lg:hidden text-slate-300">↓</div>

          {/* Stage 4: Decision (Branches out) */}
          <div className="flex flex-col lg:flex-row items-center gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-200/60 shadow-inner">
            <div className="flex flex-col items-center text-center space-y-3 min-w-[120px] group">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-md border border-purple-100 transition group-hover:scale-105">
                <Settings className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 font-poppins">Decision</h3>
                <p className="text-[10px] font-bold text-slate-400">Final Outcome</p>
              </div>
            </div>

            {/* Connecting lines branching out on desktop, simple flex columns on mobile */}
            <div className="hidden lg:block w-8 h-16 relative">
              <svg className="absolute inset-0 w-full h-full text-slate-300" viewBox="0 0 30 60" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M0,30 L15,30 M15,30 L30,5 M15,30 L30,30 M15,30 L30,55" strokeLinecap="round" />
              </svg>
            </div>

            {/* Outcome branching cards */}
            <div className="flex flex-col gap-2.5 min-w-[130px]">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl shadow-sm text-xs font-extrabold justify-center transition hover:scale-102">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                Admitted
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl shadow-sm text-xs font-extrabold justify-center transition hover:scale-102">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                Waitlisted
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl shadow-sm text-xs font-extrabold justify-center transition hover:scale-102">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Rejected
              </div>
            </div>
          </div>
        </div>

        {/* Quiet trust bar placed directly below the stepper centerpiece */}
        <div className="pt-2 flex flex-col items-center justify-center space-y-4 text-center">
          <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
            Trusted by schools and junior colleges across India
          </span>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 text-slate-400 opacity-80">
            <div className="flex items-center gap-2 p-2 px-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <School className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-600">K-12 Schools</span>
            </div>
            <div className="flex items-center gap-2 p-2 px-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <Building2 className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-slate-600">Junior Colleges</span>
            </div>
            <div className="flex items-center gap-2 p-2 px-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <GraduationCap className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-600">Coaching Hubs</span>
            </div>
            <div className="flex items-center gap-2 p-2 px-4 bg-white rounded-xl border border-slate-100 shadow-sm">
              <Library className="w-4 h-4 text-pink-500" />
              <span className="text-xs font-bold text-slate-600">Learning Centers</span>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: WHY SCHOOLS SWITCH TO VIDHYAAN */}
      <section className="py-16 px-6 md:px-16 max-w-5xl mx-auto scroll-mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 text-left space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
              Why Schools Switch to Vidhyaan
            </h2>
            <p className="text-slate-600 font-semibold text-base leading-relaxed">
              Manual applicant logs get lost between counsellor handoffs and document updates. By routing documents, scheduling interviews, and recording fee payments in a single visual pipeline, your administration has total transparency on seats and classes.
            </p>
          </div>
          <div className="lg:col-span-5 flex items-center justify-center p-6 bg-slate-50/50 border border-slate-200 rounded-3xl shadow-sm relative overflow-hidden h-64">
            {/* Background design pattern */}
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))]" />
            
            <div className="flex items-center justify-between w-full max-w-sm relative z-10">
              {/* Scattered Chaos Left Side */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Paper/Doc */}
                <div className="absolute top-2 left-2 p-2 bg-white rounded-xl border border-slate-200 shadow-sm rotate-[-12deg]">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">×</span>
                </div>
                
                {/* WhatsApp */}
                <div className="absolute top-4 right-2 p-2 bg-white rounded-xl border border-slate-200 shadow-sm rotate-[15deg]">
                  <MessageSquare className="w-5 h-5 text-slate-400" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">×</span>
                </div>
                
                {/* Excel/Spreadsheet */}
                <div className="absolute bottom-4 left-4 p-2 bg-white rounded-xl border border-slate-200 shadow-sm rotate-[6deg]">
                  <BarChart className="w-5 h-5 text-slate-400" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">×</span>
                </div>
                
                {/* Phone */}
                <div className="absolute bottom-2 right-6 p-2 bg-white rounded-xl border border-slate-200 shadow-sm rotate-[-8deg]">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">×</span>
                </div>
              </div>

              {/* Transition Arrow Center */}
              <div className="flex-1 flex justify-center">
                <ArrowRight className="w-6 h-6 text-purple-600 animate-pulse shrink-0" />
              </div>

              {/* Vidhyaan Unified Right Side */}
              <div className="relative p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl shadow-md flex items-center justify-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-white p-2 rounded-lg border border-purple-100 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <div className="w-4 h-1.5 rounded-full bg-purple-200" />
                    <div className="w-2 h-2 rounded-full bg-purple-300" />
                  </div>
                  <span className="text-[9px] font-black uppercase text-purple-700 tracking-wider font-poppins">Pipeline</span>
                </div>
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-sm">✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION (PART 3) */}
      <section id="overview" className="py-16 px-6 md:px-16 scroll-mt-28 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 lg:order-1 flex items-center justify-center p-6 bg-amber-50/20 border border-amber-100/70 rounded-3xl shadow-sm relative overflow-hidden h-64">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
            
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Overlapping, messy chaos icons */}
              {/* Document 1 */}
              <div className="absolute top-6 left-12 p-3 bg-red-50 border border-red-100 text-red-500 rounded-xl shadow-sm rotate-[-25deg] z-10">
                <FileText className="w-6 h-6" />
              </div>
              
              {/* Chat bubble */}
              <div className="absolute top-10 right-10 p-3 bg-amber-50 border border-amber-150 text-amber-600 rounded-xl shadow-sm rotate-[18deg] z-20">
                <MessageSquare className="w-7 h-7" />
              </div>
              
              {/* Phone */}
              <div className="absolute bottom-6 left-10 p-3.5 bg-red-50 border border-red-150 text-red-600 rounded-full shadow-md rotate-[-15deg] z-30 animate-bounce">
                <Phone className="w-6 h-6" />
              </div>
              
              {/* Spreadsheet */}
              <div className="absolute bottom-8 right-12 p-3.5 bg-amber-50 border border-amber-100 text-amber-500 rounded-xl shadow-sm rotate-[32deg] z-10">
                <BarChart className="w-6 h-6" />
              </div>

              {/* Warning/Alert badge inside chaos */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-red-500 text-white rounded-full shadow-lg z-40 rotate-[12deg]">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5">Where is the TC?</span>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-7 lg:order-2 text-left space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight font-poppins">
              Admission season shouldn't mean chaos
            </h2>
            <p className="text-slate-600 font-semibold text-base leading-relaxed">
              Every admission cycle, counsellors juggle paper applications, WhatsApp threads, and Excel trackers. Applicants get lost between desks and follow-ups get missed. Vidhyaan's admission management system puts every applicant in one pipeline your whole team can see — so nothing depends on one counsellor's memory.
            </p>
          </div>
        </div>
      </section>

      {/* THE COMPLETE ADMISSION JOURNEY */}
      <section id="journey" className="py-16 px-6 md:px-16 bg-slate-50/30 rounded-3xl space-y-12 scroll-mt-28">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full">
            Complete Visibility
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            The Complete Admission Journey
          </h2>
          <p className="text-slate-555 font-semibold text-sm md:text-base max-w-xl mx-auto">
            How Vidhyaan streamlines the applicant lifecycle from lead conversion to active enrollment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">
              1
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">Convert Enquiry</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              Leads convert to applications instantly — enquiries from your marketplace listing or other sources enter your admissions funnel in one click.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-black">
              2
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">Move Through Stages</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              Drag and drop applicants through custom status columns — document verification, schedule interviews, and log decisions in real-time.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black">
              3
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">Collect Documents</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              Collect certificates, mark sheets, and transfers directly inside the app, attaching them to each student's permanent profile.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
              4
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">Enroll Instantly</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed">
              Roll over admitted applicants into active students records in a single click, automatically creating accounts and invoice structures.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES */}
      <section id="capabilities" className="py-16 px-6 md:px-16 space-y-12 scroll-mt-28 max-w-5xl mx-auto">
        <div className="border-b border-slate-200 pb-6 text-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-poppins">
            Key Capabilities
          </h2>
          <p className="text-slate-500 font-semibold text-sm mt-2 max-w-xl mx-auto">
            Everything your team needs to manage admissions end-to-end.
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            {
              title: "Fully customizable admission stages",
              body: "Define the exact stages your school uses — application received, document verification, interview scheduled, admitted, waitlisted, rejected — and move applicants through them with a simple stage change. This gives your admin team real-time clarity on seats.",
              icon: "Settings",
              color: "bg-purple-50 text-purple-700 border-purple-100 shadow-purple-100/50"
            },
            {
              title: "Document collection, built in",
              body: "Parents and counsellors upload required documents directly against each applicant's record — no more chasing certificates over email or WhatsApp with no central place to store them.",
              icon: "FileText",
              color: "bg-amber-50 text-amber-700 border-amber-100 shadow-amber-100/50"
            },
            {
              title: "Complete activity timeline",
              body: "Every call, note, WhatsApp message, and email tied to an applicant is logged in one place — any counsellor can pick up where another left off without asking \"what's the status on this one?\"",
              icon: "Clock",
              color: "bg-indigo-50 text-indigo-750 border-indigo-100 shadow-indigo-100/50"
            },
            {
              title: "One-click conversion to enrolled student",
              body: "Once an applicant is admitted, convert them directly into a full student record — no re-entering the same name, grade, and guardian details a second time.",
              icon: "UserCheck",
              color: "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-100/50"
            },
            {
              title: "Pipeline visibility for leadership",
              body: "See conversion rates and pipeline health at a glance — how many applications are stuck at document verification, how many are ready for interview, how many convert to admitted — without asking your admissions team for a manual count.",
              icon: "BarChart",
              color: "bg-violet-50 text-violet-750 border-violet-100 shadow-violet-100/50"
            },
            {
              title: "Works on any device",
              body: "Vidhyaan works entirely in your browser with a fully responsive layout. Manage enquiries on the go, with no mobile app install required.",
              icon: "Phone",
              color: "bg-sky-50 text-sky-700 border-sky-100 shadow-sky-100/50"
            },
            {
              title: "Filter and act fast",
              body: "Quickly sort applicants by status directly from the dashboard to focus on document verification, interview calls, or approvals.",
              icon: "Activity",
              color: "bg-rose-50 text-rose-700 border-rose-100 shadow-rose-100/50"
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

      {/* 4. HOW IT WORKS NARRATIVE FLOW */}
      <section id="how-it-works" className="py-16 px-6 md:px-16 space-y-16 bg-slate-50/30 rounded-3xl w-full scroll-mt-28">
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            How Admission Management Works
          </h2>
          <p className="text-slate-500 font-semibold text-sm md:text-base leading-relaxed">
            A structured workflow designed for speed, clarity, and control — from applicant entry to active enrollment.
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-20">
          {/* Sub-block A: List view screenshot LEFT, text RIGHT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col space-y-3 bg-gradient-to-tr from-slate-100 to-white border border-slate-200 p-4 rounded-3xl shadow-xl">
              <div className="overflow-hidden rounded-2xl border border-slate-150/75 shadow-sm">
                <Image 
                  src="/images/products/admission-management-list-screenshot.png"
                  alt="Vidhyaan Admission Management pipeline list dashboard showing stage status tabs, KPIs, search fields, and counsellor assignments."
                  width={1024}
                  height={572}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-poppins">
                Every applicant, one pipeline
              </h3>
              <p className="text-slate-500 font-semibold text-sm leading-relaxed">
                Admissions teams get a single visual workspace to track all candidate flows. No more scanning disconnected sheets or files to understand where an application stands.
              </p>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-slate-700">Stage tabs for clear categorization</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-slate-700">Applicant counts at each funnel stage</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-slate-700">Quick status view with counselor assignments</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sub-block B: Detail view screenshot RIGHT, text LEFT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* On mobile, this renders first. On desktop, lg:order-2 moves it to the right */}
            <div className="lg:col-span-7 lg:order-2 flex flex-col space-y-3 bg-gradient-to-tr from-slate-100 to-white border border-slate-200 p-4 rounded-3xl shadow-xl">
              <div className="overflow-hidden rounded-2xl border border-slate-150/75 shadow-sm">
                <Image 
                  src="/images/products/admission-management-detail-screenshot.png"
                  alt="Vidhyaan Admission Management manual entry form for student applications showing student information and enrollment configurations."
                  width={1024}
                  height={585}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
            {/* On mobile, this renders second. On desktop, lg:order-1 moves it to the left */}
            <div className="lg:col-span-5 lg:order-1 space-y-6">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-poppins">
                Full history, one click away
              </h3>
              <p className="text-slate-500 font-semibold text-sm leading-relaxed">
                Dive deep into each candidate profile. Check interaction details, verification status, and notes left by other staff members instantly.
              </p>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-slate-700">Interactive stage dropdown for quick updates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-slate-700">Activity timeline tracking every interaction</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-bold text-slate-700">Direct document access and verification checklist</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON SECTION */}
      <section className="py-16 px-6 md:px-16 bg-slate-50/30 rounded-3xl space-y-10">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black text-purple-750 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full">
            Modernize Your Workflow
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            Vidhyaan vs. The Old Way
          </h2>
          <p className="text-slate-500 font-semibold text-sm md:text-base max-w-xl mx-auto">
            See how moving to a structured CRM compares to paper forms and WhatsApp updates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* The Old Way Column */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              Paper & Spreadsheets
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-extrabold shrink-0 mt-0.5">✗</span>
                <span className="text-sm font-semibold text-slate-600">Paper applications and registers get lost across desks and branches</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-extrabold shrink-0 mt-0.5">✗</span>
                <span className="text-sm font-semibold text-slate-600">WhatsApp and email threads for certificate and mark sheet verification</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-extrabold shrink-0 mt-0.5">✗</span>
                <span className="text-sm font-semibold text-slate-600">No visibility into which applicants are stuck at interviews or document stages</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-extrabold shrink-0 mt-0.5">✗</span>
                <span className="text-sm font-semibold text-slate-600">Manual transcription from entry forms into new student record databases</span>
              </li>
            </ul>
          </div>

          {/* Vidhyaan Column */}
          <div className="bg-gradient-to-b from-purple-50/30 to-white border border-purple-150 rounded-3xl p-8 space-y-6 shadow-sm">
            <h3 className="text-lg font-black text-purple-900 border-b border-purple-100/50 pb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-purple-600 rounded-full" />
              Vidhyaan CRM
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-black shrink-0 mt-0.5">✓</span>
                <span className="text-sm font-bold text-slate-800">One live, unified pipeline from application to decision</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-black shrink-0 mt-0.5">✓</span>
                <span className="text-sm font-bold text-slate-800">Integrated document collection directly linked to student record</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-black shrink-0 mt-0.5">✓</span>
                <span className="text-sm font-bold text-slate-800">Real-time pipeline dashboards and seat metrics visible instantly</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 font-black shrink-0 mt-0.5">✓</span>
                <span className="text-sm font-bold text-slate-800">One-click student enrollment rollover, eliminating double entry</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. INSTITUTION FIT CALLOUT */}
      <section className="py-16 px-6 md:px-16 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-3xl p-8 md:p-12 space-y-8 shadow-sm">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full border border-purple-100 shadow-sm">
              Institution Type Fit
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
              Is This Right for Your Institution?
            </h2>
            <p className="text-slate-500 font-semibold text-sm max-w-xl mx-auto">
              Vidhyaan adapts to your specific enrollment workflows automatically based on your setup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:divide-x md:divide-slate-200">
            {/* Left Column: Schools & Junior Colleges */}
            <div className="space-y-4">
              <h3 className="text-lg font-black flex items-center gap-2 font-poppins text-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Schools & Junior Colleges
              </h3>
              <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                Perfect for institutions with structured, multi-stage enrollment criteria, parent interviews, and board eligibility checks.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-black shrink-0 mt-0.5">✓</span>
                  <span className="text-xs font-bold text-slate-700">Customizable pipelines match multi-stage admission workflows</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-black shrink-0 mt-0.5">✓</span>
                  <span className="text-xs font-bold text-slate-700">Integrated document collection handles certificates and mark sheets</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-black shrink-0 mt-0.5">✓</span>
                  <span className="text-xs font-bold text-slate-700">One-click conversion syncs admitted lists directly to student rosters</span>
                </li>
              </ul>
            </div>

            {/* Right Column: Learning Centers & Coaching Centers */}
            <div className="space-y-4 md:pl-8">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 font-poppins">
                <ArrowRight className="w-5 h-5 text-slate-500" />
                Learning & Coaching Centers
              </h3>
              <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                Typically skip the formal admission pipeline. Enquiries convert directly to enrolled students once a batch or course is selected.
              </p>
              <div className="p-4 bg-white rounded-2xl border border-slate-150/75 space-y-3">
                <p className="text-xs font-semibold text-slate-650 leading-relaxed">
                  Need direct course enrollments, batch management, and fee installments? Check out our Course Management module instead.
                </p>
                <Link href="/products/course-management" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1565D8] hover:text-blue-700 transition">
                  Explore Course Management
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section id="faq" className="py-16 px-6 md:px-16 bg-slate-50/30 rounded-3xl space-y-6 scroll-mt-28">
        <div className="border-b border-slate-200 pb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-slate-500" />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-poppins">
            {admissionManagementContent.faq.heading}
          </h2>
        </div>
        <div className="space-y-3">
          {admissionManagementContent.faq.items.map((item, idx) => {
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
          {admissionManagementContent.closingCta.heading}
        </h2>
        <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          {admissionManagementContent.closingCta.body}
        </p>

        {/* Closing CTA Supporting Wording */}
        <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
          Start instantly with no credit card, no complex IT setup, and get your dashboard live on the same day.
        </p>

        <div className="pt-4 flex justify-center">
          <Link href={admissionManagementContent.closingCta.ctaHref} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-base px-8 py-4.5 rounded-2xl h-auto shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 cursor-pointer">
              {admissionManagementContent.closingCta.ctaText}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 8. RELATED LINKS (REDESIGNED CARDS) */}
      <section className="bg-slate-50/20 py-12 px-6 md:px-16 border-t border-slate-100 space-y-6">
        <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest text-center">
          Explore Related CRM Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link href="/products/lead-management" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex items-center gap-4 group">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm md:text-base group-hover:text-indigo-700 transition">
                Lead Management
              </h4>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                Schools & Learning Centers
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

          <Link href="/products/reporting-analytics" className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-violet-300 transition-all flex items-center gap-4 group">
            <div className="p-3 rounded-xl bg-violet-50 text-violet-650 shrink-0">
              <BarChart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm md:text-base group-hover:text-violet-700 transition">
                Reports & Analytics
              </h4>
              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider block">
                Leadership Dashboards
              </span>
            </div>
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
