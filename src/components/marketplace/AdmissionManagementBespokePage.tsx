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
    BarChart
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
        <Link href="/" className="hover:text-slate-655 transition">Home</Link>
        <span>&gt;</span>
        <Link href="/products/institution-types" className="hover:text-slate-655 transition">Products</Link>
        <span>&gt;</span>
        <span className="text-slate-655 font-bold">Admission Management</span>
      </div>

      {/* 1. HERO SECTION */}
      <section className="text-center py-16 md:py-20 px-6 md:px-16 space-y-8 bg-gradient-to-b from-purple-50/60 via-purple-50/20 to-white rounded-3xl">
        <span className="inline-flex items-center gap-1.5 border border-purple-200 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Structured Admission CRM
        </span>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] max-w-4xl mx-auto font-poppins">
          Admission Management System for{' '}
          <span className="bg-gradient-to-r from-purple-650 via-indigo-650 to-purple-850 bg-clip-text text-transparent">
            Schools & Junior Colleges
          </span>
        </h1>
        
        <p className="text-slate-600 font-semibold text-base md:text-xl leading-relaxed max-w-3xl mx-auto">
          {admissionManagementContent.subhead}
        </p>

        {/* Intro Paragraph */}
        <p className="text-slate-550 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-semibold">
          Admission desks transition to Vidhyaan when manual applicant logs get lost between counsellor handoffs and document updates. By routing documents, scheduling interviews, and recording fee payments in a single visual pipeline, your administration has total transparency on seats and classes.
        </p>
        
        <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href={admissionManagementContent.primaryCta.href} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-base px-8 py-5 rounded-2xl h-auto shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 cursor-pointer">
              {admissionManagementContent.primaryCta.text}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          {admissionManagementContent.secondaryCta && (
            <Link 
              href={admissionManagementContent.secondaryCta.href}
              className="text-slate-655 hover:text-purple-700 font-extrabold text-sm transition py-2"
            >
              {admissionManagementContent.secondaryCta.text}
            </Link>
          )}
        </div>

        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          {admissionManagementContent.trustLine}
        </p>
      </section>

      {/* 2. STAGE-STEPPER CENTERPIECE (PART 2) */}
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
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-650 flex items-center justify-center shadow-md border border-blue-100 transition group-hover:scale-105">
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
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-655 flex items-center justify-center shadow-md border border-amber-100 transition group-hover:scale-105">
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
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-655 flex items-center justify-center shadow-md border border-indigo-100 transition group-hover:scale-105">
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
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-650 flex items-center justify-center shadow-md border border-purple-100 transition group-hover:scale-105">
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

      {/* 2. PROBLEM SECTION WITH PROCESS FLOW GRAPHIC */}
      <section id="overview" className="py-16 px-6 md:px-16 scroll-mt-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Problem Copy */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight font-poppins">
              {admissionManagementContent.problem.heading}
            </h2>
            <p className="text-slate-655 font-semibold text-base leading-relaxed">
              {admissionManagementContent.problem.body}
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-purple-650 shrink-0 mt-0.5" />
                <span className="text-sm font-bold text-slate-700">Digital verification of certificates speeds up eligibility logs</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-purple-655 shrink-0 mt-0.5" />
                <span className="text-sm font-bold text-slate-700">Central audit trail tracks every stage upgrade automatically</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Stage Flow Graphic */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 via-white to-purple-50/20 border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden min-h-[350px] shadow-lg shadow-purple-500/5">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/30 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100/30 rounded-full blur-3xl -z-10" />

            <div className="flex flex-col items-center w-full space-y-5">
              <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full mb-2">
                Workflow Progression
              </span>

              {/* Application Received */}
              <div className="flex items-center gap-3 w-full max-w-xs p-3 bg-white rounded-2xl border border-slate-150 shadow-sm transition hover:scale-105">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">
                  1
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-800">Applied</span>
                  <span className="text-[9px] text-slate-400 font-bold">Details & Contact Locked</span>
                </div>
              </div>

              <div className="text-purple-300">↓</div>

              {/* Document Verification */}
              <div className="flex items-center gap-3 w-full max-w-xs p-3 bg-white rounded-2xl border border-slate-150 shadow-sm transition hover:scale-105">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xs shrink-0">
                  2
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-800">Verify Docs</span>
                  <span className="text-[9px] text-slate-400 font-bold">TC & Certificates Uploaded</span>
                </div>
              </div>

              <div className="text-purple-300">↓</div>

              {/* Interview */}
              <div className="flex items-center gap-3 w-full max-w-xs p-3 bg-white rounded-2xl border border-slate-150 shadow-sm transition hover:scale-105">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center font-black text-xs shrink-0">
                  3
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-800">Interview</span>
                  <span className="text-[9px] text-slate-400 font-bold">Meeting & Ratings Recorded</span>
                </div>
              </div>

              <div className="text-purple-300">↓</div>

              {/* Decision */}
              <div className="flex items-center gap-3 w-full max-w-xs p-3 bg-gradient-to-r from-purple-650 to-indigo-650 text-white rounded-2xl shadow-md transition hover:scale-105">
                <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-xs shrink-0">
                  4
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black">Decision</span>
                  <span className="text-[9px] text-purple-100 font-bold">Admitted / Waitlisted</span>
                </div>
              </div>
            </div>
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
            <div className="w-10 h-10 bg-purple-50 text-purple-650 rounded-xl flex items-center justify-center font-black">
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
      <section id="capabilities" className="py-16 px-6 md:px-16 space-y-8 scroll-mt-28">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-poppins">
            Key Capabilities
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {admissionManagementContent.capabilities.map((cap, idx) => {
            const CapIcon = IconMap[cap.icon]
            return (
              <div 
                key={idx} 
                className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-250 transition-all duration-200 flex gap-4 items-start"
              >
                <div className="p-3 rounded-xl shrink-0 bg-purple-50 text-purple-650">
                  {CapIcon ? <CapIcon className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-extrabold text-slate-800 text-lg font-poppins">
                    {cap.title}
                  </h3>
                  <p className="text-slate-555 font-semibold text-sm leading-relaxed">
                    {cap.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* PRODUCT SCREENSHOT SECTION (MOVED DOWN - PART 2) */}
      <section className="py-16 px-6 md:px-16 space-y-10 flex flex-col items-center bg-slate-50/30 rounded-3xl w-full">
        <div className="text-center space-y-2.5 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-poppins">
            See it in action
          </h2>
          <p className="text-slate-555 font-semibold text-sm md:text-base leading-relaxed">
            The real Admission Management pipeline your team uses every day — from list view to individual applicant tracking.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
          {/* List screenshot card */}
          <div className="flex flex-col space-y-3 bg-gradient-to-tr from-slate-100 to-white border border-slate-200 p-4 rounded-3xl shadow-xl transition-all duration-300 hover:shadow-purple-500/5 hover:border-purple-100">
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
            <p className="text-xs font-bold text-slate-500 text-center">
              Pipeline view — every applicant, every stage, at a glance
            </p>
          </div>

          {/* Detail screenshot card */}
          <div className="flex flex-col space-y-3 bg-gradient-to-tr from-slate-100 to-white border border-slate-200 p-4 rounded-3xl shadow-xl transition-all duration-300 hover:shadow-purple-500/5 hover:border-purple-100">
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
            <p className="text-xs font-bold text-slate-500 text-center">
              Applicant detail — stage history and activity timeline in one place
            </p>
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
              <span className="w-2.5 h-2.5 bg-purple-650 rounded-full" />
              Vidhyaan CRM
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-emerald-555 font-black shrink-0 mt-0.5">✓</span>
                <span className="text-sm font-bold text-slate-800">One live, unified pipeline from application to decision</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-555 font-black shrink-0 mt-0.5">✓</span>
                <span className="text-sm font-bold text-slate-800">Integrated document collection directly linked to student record</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-555 font-black shrink-0 mt-0.5">✓</span>
                <span className="text-sm font-bold text-slate-800">Real-time pipeline dashboards and seat metrics visible instantly</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-555 font-black shrink-0 mt-0.5">✓</span>
                <span className="text-sm font-bold text-slate-800">One-click student enrollment rollover, eliminating double entry</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SUB-FEATURE HIGHLIGHTS */}
      <section className="py-16 px-6 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex gap-4 items-start p-6 bg-slate-50 rounded-2xl border border-slate-150/80 shadow-sm">
            <div className="p-3 bg-purple-50 text-purple-650 rounded-xl shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 text-base">Works on any device</h4>
              <p className="text-slate-550 font-semibold text-xs leading-relaxed">
                Vidhyaan works entirely in your browser with a fully responsive layout. Manage enquiries on the go, with no mobile app install required.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-6 bg-slate-50 rounded-2xl border border-slate-150/80 shadow-sm">
            <div className="p-3 bg-purple-50 text-purple-650 rounded-xl shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 text-base">Filter and act fast</h4>
              <p className="text-slate-550 font-semibold text-xs leading-relaxed">
                Quickly sort applicants by status directly from the dashboard to focus on document verification, interview calls, or approvals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      <section className="py-16 px-6 md:px-16 bg-gradient-to-b from-purple-50/20 via-white to-slate-50/40 rounded-3xl">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="text-center space-y-2 py-4 md:py-0">
            <span className="text-6xl font-black text-[#1565D8] block font-poppins tracking-tight">
              0
            </span>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto block leading-tight">
              Applications lost between desks
            </span>
          </div>
          <div className="text-center space-y-2 pt-6 md:pt-0 py-4 md:py-0">
            <span className="text-6xl font-black text-[#1565D8] block font-poppins tracking-tight">
              1
            </span>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto block leading-tight">
              Pipeline, every stage visible
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
          <CheckCircle className="w-5 h-5 shrink-0 text-purple-650" />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-poppins">
            {admissionManagementContent.whoThisIsFor.heading}
          </h2>
        </div>
        <p className="text-slate-655 font-semibold text-base leading-relaxed">
          {admissionManagementContent.whoThisIsFor.body}
        </p>
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
        <p className="text-slate-605 font-semibold text-sm md:text-base leading-relaxed max-w-xl mx-auto">
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
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-655 shrink-0">
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
        🔒 ISO 27001 Certified &bull; 100% compliant with India's Digital Personal Data Protection (DPDP) Act, 2023. All parent PII is protected.
      </div>
    </div>
  )
}
