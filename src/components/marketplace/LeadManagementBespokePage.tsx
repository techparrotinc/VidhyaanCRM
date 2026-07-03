'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  School, Building2, GraduationCap, Library, 
  Globe, Phone, Users, Store, Inbox, UserCheck, 
  Activity, Calendar, Clock, RefreshCw, ArrowRight, 
  CheckCircle, HelpCircle, ChevronDown, ChevronUp 
} from 'lucide-react'
import { leadManagementContent } from '@/content/products/lead-management'

export default function LeadManagementBespokePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  // Define Icon mapping specifically for capabilities in this page
  const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Inbox,
    UserCheck,
    Activity,
    Calendar,
    Clock,
    RefreshCw
  }

  return (
    <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col w-full">
      {/* 1. HERO SECTION */}
      <section className="text-center py-16 md:py-24 px-6 md:px-16 space-y-6 bg-indigo-50/50 border-b border-indigo-200">
        <span className="inline-flex items-center gap-1.5 border border-indigo-200 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
          Feature Spotlight
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight font-poppins">
          {leadManagementContent.h1}
        </h1>
        <p className="text-slate-655 font-medium text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
          {leadManagementContent.subhead}
        </p>
        
        <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href={leadManagementContent.primaryCta.href} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-sm px-8 py-4 rounded-xl h-auto shadow-lg shadow-blue-550/20 flex items-center justify-center gap-2 transition cursor-pointer">
              {leadManagementContent.primaryCta.text}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          {leadManagementContent.secondaryCta && (
            <Link 
              href={leadManagementContent.secondaryCta.href}
              className="text-slate-600 hover:text-indigo-700 font-bold text-sm transition py-2"
            >
              {leadManagementContent.secondaryCta.text}
            </Link>
          )}
        </div>

        <p className="text-xs text-slate-450 font-semibold leading-relaxed pt-2">
          {leadManagementContent.trustLine}
        </p>
      </section>

      {/* TRUST BAR (PART 1) */}
      <section className="bg-white py-8 px-6 md:px-16 border-b border-slate-100 flex flex-col items-center justify-center space-y-4 text-center">
        <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Trusted by schools and learning centers across India
        </span>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 text-slate-350">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-slate-300" />
            <span className="text-sm font-bold text-slate-400">Schools</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-300" />
            <span className="text-sm font-bold text-slate-400">Junior Colleges</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-slate-300" />
            <span className="text-sm font-bold text-slate-400">Coaching Institutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-slate-300" />
            <span className="text-sm font-bold text-slate-400">Learning Centers</span>
          </div>
        </div>
      </section>

      {/* PRODUCT SCREENSHOT SECTION (PART 2) */}
      <section className="bg-slate-50/50 py-16 px-6 md:px-16 border-b border-slate-150/40 space-y-8 flex flex-col items-center">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
            See your leads in one pipeline
          </h2>
          <p className="text-slate-500 font-medium text-sm md:text-base max-w-lg mx-auto">
            The actual Lead Management view your counsellors use every day.
          </p>
        </div>
        <div className="w-full max-w-5xl bg-white border border-slate-200/80 rounded-2xl p-3 md:p-4 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <Image 
            src="/images/products/lead-management-screenshot.png"
            alt="Vidhyaan Lead Management Pipeline Dashboard"
            width={1024}
            height={873}
            className="w-full h-auto rounded-lg border border-slate-100"
            loading="lazy"
          />
        </div>
      </section>

      {/* 2. PROBLEM SECTION WITH FUNNEL GRAPHIC (PART 3) */}
      <section className="bg-white py-16 px-6 md:px-16 border-b border-slate-150/40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Problem Copy */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight font-poppins">
              {leadManagementContent.problem.heading}
            </h2>
            <p className="text-slate-655 font-medium text-base leading-relaxed">
              {leadManagementContent.problem.body}
            </p>
          </div>

          {/* Right Column: Visual Funnel Graphic */}
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden min-h-[300px]">
            {/* Visual convergence of source pills into a pipeline pill */}
            <div className="flex flex-col items-center w-full relative">
              {/* Converging Sources */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-sm mb-12">
                <div className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <Globe className="w-5 h-5 text-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-500">Website</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <Phone className="w-5 h-5 text-green-500" />
                  <span className="text-[10px] font-bold text-slate-500">Phone</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span className="text-[10px] font-bold text-slate-500">Walk-in</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <Store className="w-5 h-5 text-pink-500" />
                  <span className="text-[10px] font-bold text-slate-500">Market</span>
                </div>
              </div>

              {/* Connecting arrows / convergence lines */}
              <div className="hidden sm:flex absolute top-[48px] w-full max-w-sm h-12 justify-center items-center">
                <svg className="w-full h-full text-slate-300" fill="none" viewBox="0 0 200 40">
                  <path d="M15,5 Q100,30 100,38" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M65,5 Q100,30 100,38" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M135,5 Q100,30 100,38" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M185,5 Q100,30 100,38" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3,3" />
                </svg>
              </div>

              {/* Converged Destination: Pipeline Pill */}
              <div className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/25 border border-indigo-500 animate-pulse mt-4 sm:mt-0">
                <Inbox className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider font-poppins">
                  Unified Pipeline
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CAPABILITIES */}
      <section className="bg-white py-12 md:py-16 px-6 md:px-16 border-b border-slate-150/40 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-poppins">
            Key Capabilities
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {leadManagementContent.capabilities.map((cap, idx) => {
            const CapIcon = IconMap[cap.icon]
            return (
              <div 
                key={idx} 
                className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex gap-4 items-start"
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
                  <p className="text-slate-600 font-medium text-sm leading-relaxed">
                    {cap.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="bg-slate-50/50 py-12 md:py-16 px-6 md:px-16 border-b border-slate-150/40 space-y-8">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight font-poppins">
          {leadManagementContent.howItWorks.heading}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connector line for large screens */}
          <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10" />

          {leadManagementContent.howItWorks.steps.map((step, idx) => (
            <div key={idx} className="text-center p-2 space-y-4 flex flex-col items-center relative">
              <div className="w-12 h-12 rounded-full text-white flex items-center justify-center font-black shadow-md border border-white bg-indigo-600">
                {idx + 1}
              </div>
              <p className="text-sm text-slate-655 font-semibold leading-relaxed max-w-xs">
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS ROW (PART 4) */}
      <section className="bg-white py-12 px-6 md:px-16 border-b border-slate-150/40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x divide-slate-200">
          <div className="text-center space-y-1">
            <span className="text-5xl font-black text-[#1565D8] block font-poppins">
              0
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Leads lost to missed follow-ups
            </span>
          </div>
          <div className="text-center space-y-1 pt-6 md:pt-0">
            <span className="text-5xl font-black text-[#1565D8] block font-poppins">
              1
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pipeline, every source
            </span>
          </div>
          <div className="text-center space-y-1 pt-6 md:pt-0">
            <span className="text-5xl font-black text-[#1565D8] block font-poppins">
              15m
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Average setup time
            </span>
          </div>
        </div>
      </section>

      {/* 5. WHO THIS IS FOR */}
      <section className="bg-white py-12 md:py-16 px-6 md:px-16 border-b border-slate-150/40 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-indigo-600" />
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight font-poppins">
            {leadManagementContent.whoThisIsFor.heading}
          </h2>
        </div>
        <p className="text-slate-650 font-medium text-base leading-relaxed">
          {leadManagementContent.whoThisIsFor.body}
        </p>
      </section>

      {/* 6. FAQ */}
      <section className="bg-slate-50/50 py-12 md:py-16 px-6 md:px-16 border-b border-slate-150/40 space-y-6">
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
      <section className="bg-blue-50/50 py-16 md:py-20 px-6 md:px-16 text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
          {leadManagementContent.closingCta.heading}
        </h2>
        <p className="text-slate-655 font-medium text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          {leadManagementContent.closingCta.body}
        </p>
        <div className="pt-2 flex justify-center">
          <Link href={leadManagementContent.closingCta.ctaHref} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-xl h-auto shadow-lg shadow-blue-550/20 flex items-center justify-center gap-2 transition cursor-pointer">
              {leadManagementContent.closingCta.ctaText}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 8. RELATED LINKS */}
      {leadManagementContent.relatedLinks.length > 0 && (
        <section className="bg-white py-6 px-6 md:px-16 flex flex-col sm:flex-row items-center gap-3 text-xs font-semibold text-slate-500">
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
