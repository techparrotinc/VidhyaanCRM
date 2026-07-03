'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  School, Building2, GraduationCap, Library, 
  Globe, Phone, Users, Store, Inbox, UserCheck, 
  Activity, Calendar, Clock, RefreshCw, ArrowRight, 
  CheckCircle, HelpCircle, ChevronDown, ChevronUp,
  Sparkles, MessageSquare, Shield, Award, Send, PieChart
} from 'lucide-react'
import { leadManagementContent } from '@/content/products/lead-management'

export default function LeadManagementBespokePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

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
    <div className="w-full bg-white flex flex-col space-y-24 py-4">
      {/* 1. HERO SECTION */}
      <section className="text-center py-20 px-6 md:px-16 space-y-8 bg-gradient-to-b from-indigo-50/60 via-indigo-50/20 to-white rounded-3xl">
        <span className="inline-flex items-center gap-1.5 border border-indigo-200 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-650 shadow-sm">
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
        
        <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href={leadManagementContent.primaryCta.href} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-base px-8 py-5 rounded-2xl h-auto shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 cursor-pointer">
              {leadManagementContent.primaryCta.text}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          {leadManagementContent.secondaryCta && (
            <Link 
              href={leadManagementContent.secondaryCta.href}
              className="text-slate-650 hover:text-indigo-700 font-extrabold text-sm transition py-2"
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
      <section className="py-16 px-6 md:px-16 space-y-10 flex flex-col items-center bg-slate-50/30 rounded-3xl">
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
      <section className="py-16 px-6 md:px-16">
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

      {/* 360° LIFE-CYCLE TIMELINE INFOGRAPHIC (NEW INFOGRAPHIC B) */}
      <section className="py-16 px-6 md:px-16 bg-slate-50/30 rounded-3xl space-y-12">
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
      <section className="py-16 px-6 md:px-16 space-y-8">
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
      <section className="py-16 px-6 md:px-16 bg-slate-50/30 rounded-3xl space-y-6">
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
                  <div className="px-6 pb-5 pt-1 text-slate-600 text-sm font-medium leading-relaxed border-t border-slate-100 bg-slate-50/20">
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
        <p className="text-slate-600 font-semibold text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          {leadManagementContent.closingCta.body}
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

      {/* 8. RELATED LINKS */}
      {leadManagementContent.relatedLinks.length > 0 && (
        <section className="py-6 px-6 md:px-16 flex flex-col sm:flex-row items-center gap-3 text-xs font-semibold text-slate-500 border-t border-slate-100">
          <span>Explore related features:</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {leadManagementContent.relatedLinks.map((link, idx) => (
              <Link 
                key={idx} 
                href={link.href}
                className="text-[#1565D8] hover:underline transition hover:text-indigo-700"
              >
                {link.text}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
