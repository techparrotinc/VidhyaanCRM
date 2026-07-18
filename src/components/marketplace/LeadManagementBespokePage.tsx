'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Clock,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Phone,
  Users,
  Globe,
  Store,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'
import { leadManagementContent } from '@/content/products/lead-management'

export default function LeadManagementBespokePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const [activeStep, setActiveStep] = useState<number>(0)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  // Pre-cropped screenshot regions for how-it-works details
  const stepCrops = [
    {
      src: "/images/products/lead-management-crop-capture.png",
      label: "Enquiry Capture — Add-Lead Sources",
    },
    {
      src: "/images/products/lead-management-crop-assign.png",
      label: "Counsellor Assignment",
    },
    {
      src: "/images/products/lead-management-crop-followup.png",
      label: "Follow-up & Activity Timeline",
    },
    {
      src: "/images/products/lead-management-crop-convert.png",
      label: "1-Click Convert to Admission",
    }
  ]

  return (
    <div className="w-full bg-[#F8FAFC] text-slate-800 font-sans flex flex-col items-center">
      {/* 1. HERO SECTION */}
      <section className="relative w-full max-w-7xl mx-auto pt-16 pb-24 px-6 md:px-16 flex flex-col items-center text-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#1565D8]/5 via-[#1565D8]/0 to-transparent blur-3xl -z-10 rounded-full" />
        
        {/* Eyebrow */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold uppercase tracking-widest text-[#1565D8] mb-6 shadow-sm animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Gen Admission CRM
        </span>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] max-w-4xl font-poppins mb-6">
          {leadManagementContent.h1.split("Software").map((part, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-[#1565D8]"> Software </span>}
              {part}
            </React.Fragment>
          ))}
        </h1>

        {/* Subhead */}
        <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-3xl mb-8 font-normal">
          {leadManagementContent.subhead}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full justify-center">
          <Link href={leadManagementContent.primaryCta.href} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-[#1150ad] text-white text-sm font-semibold px-8 py-5 h-auto rounded-xl shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer">
              {leadManagementContent.primaryCta.text}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          {leadManagementContent.secondaryCta && (
            <Link href={leadManagementContent.secondaryCta.href} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-8 py-5 h-auto rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer">
                {leadManagementContent.secondaryCta.text}
              </Button>
            </Link>
          )}
        </div>

        {/* Trust Line */}
        <p className="text-xs font-semibold text-slate-400 tracking-wider mb-16 uppercase">
          {leadManagementContent.trustLine}
        </p>

        {/* Hero Visual Mockup with Floating Stats */}
        <div className="relative w-full max-w-5xl mx-auto group select-none">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden">
            {/* Browser Chrome Header */}
            <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 max-w-md mx-auto bg-slate-100 rounded-md py-1 px-3 text-[11px] text-slate-400 text-center font-medium truncate">
                app.vidhyaan.com/lead-management
              </div>
            </div>
            {/* Screenshot — container matches the 2880x1574 capture so nothing is cropped */}
            <div className="relative aspect-[2880/1574] w-full overflow-hidden bg-slate-900/5">
              <Image
                src="/images/products/lead-management-dashboard.png"
                alt="Vidhyaan Lead Management Dashboard"
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.01]"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* Floating Stat Chips — straddle the frame edges so they never cover app UI */}
          <div className="absolute -bottom-4 -left-2 sm:-left-4 transition-all duration-300 hover:translate-x-1">
            <div className="flex items-center gap-3 p-3 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/70 shadow-lg">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Status</p>
                <p className="text-xs font-bold text-slate-800">0 leads lost to follow-ups</p>
              </div>
            </div>
          </div>

          <div className="absolute -top-4 -right-2 sm:-right-4 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 p-3 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/70 shadow-lg">
              <div className="p-1.5 bg-blue-50 text-[#1565D8] rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Setup</p>
                <p className="text-xs font-bold text-slate-800">15-minute express start</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS INFOGRAPHIC */}
      <section id="how-it-works" className="w-full bg-white border-y border-slate-100 py-24 scroll-mt-12">
        <div className="max-w-7xl mx-auto px-6 md:px-16 flex flex-col items-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            EASY WORKFLOW
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-poppins text-center mb-16">
            From First Enquiry to Student Conversion
          </h2>

          {/* Interactive Steps Flow Container */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Steps Controls */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {leadManagementContent.howItWorks.steps.map((step, idx) => {
                const isActive = activeStep === idx
                const stepNames = ["Capture", "Assign", "Follow Up", "Convert"]
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex gap-4 ${
                      isActive
                        ? "border-blue-200 bg-blue-50/50 shadow-md shadow-blue-500/5"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    } cursor-pointer`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                      isActive ? "bg-[#1565D8] text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 leading-none">
                        {stepNames[idx]}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-normal">
                        {step}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Right Crop Detail Visual Mockup */}
            <div className="lg:col-span-7 flex flex-col items-center w-full">
              <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200/60 shadow-inner flex flex-col">
                <div className="flex items-center justify-between mb-3 px-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Step {activeStep + 1} Detail: {stepCrops[activeStep].label}
                  </span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                  </div>
                </div>
                
                {/* Crop Container */}
                <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-md flex items-center justify-center p-3">
                  <Image
                    src={stepCrops[activeStep].src}
                    alt={stepCrops[activeStep].label}
                    fill
                    className="object-contain p-3 transition-opacity duration-500"
                    unoptimized
                  />
                </div>
              </div>
            </div>

          </div>

          {/* SVGs Connected Dot-Line indicator below flow */}
          <div className="w-full max-w-4xl mt-16 hidden md:flex items-center justify-between relative px-12">
            <div className="absolute top-1/2 left-12 right-12 h-0.5 border-t-2 border-dashed border-slate-200 -translate-y-1/2 -z-10" />
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  activeStep === i
                    ? "border-[#1565D8] bg-white text-[#1565D8] shadow-md shadow-blue-500/10 scale-110 font-bold"
                    : "border-slate-300 bg-slate-100 text-slate-400"
                } cursor-pointer text-xs`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURE DEEP-DIVES */}
      <section className="w-full py-24 flex flex-col gap-28 max-w-7xl mx-auto px-6 md:px-16">
        
        {/* Deep Dive 1: Drawer details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block">
              360° VISIBILITY
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-poppins">
              Complete parent communication history at your fingertips
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed font-normal">
              Click any lead from the list to pull up a full sliding activity drawer. No more scrolling through personal WhatsApp threads to see what was promised. View counselor remarks, set call logs, schedule follow-ups, and verify previous touchpoints instantly.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#1565D8] shrink-0 mt-1" />
                <span className="text-xs font-semibold text-slate-700">Chronological activity logs (Calls, SMS, Emails)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#1565D8] shrink-0 mt-1" />
                <span className="text-xs font-semibold text-slate-700">Assign priority tags and custom categories</span>
              </div>
            </div>
          </div>
          
          {/* Image visual: Drawer open */}
          <div className="w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden relative">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="relative aspect-[1550/1120] w-full overflow-hidden bg-slate-50">
              <Image
                src="/images/products/lead-management-drawer-activity.png"
                alt="Lead detail — follow-up card, activity feed and quick actions"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Deep Dive 2: Dedup warning */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
          <div className="lg:order-2 space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block">
              DEDUPLICATION ENGINE
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-poppins">
              Stop counselor conflicts before they happen
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed font-normal">
              Duplicate leads create confusion and look unprofessional when multiple team members call the same parent. Vidhyaan automatically checks the database by mobile and email whenever an enquiry enters, flagging matches instantly.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#1565D8] shrink-0 mt-1" />
                <span className="text-xs font-semibold text-slate-700">Real-time alerts on manual and import duplicate inputs</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#1565D8] shrink-0 mt-1" />
                <span className="text-xs font-semibold text-slate-700">Audit logs pointing back to the original assigned lead owner</span>
              </div>
            </div>
          </div>
          
          {/* Visual: Dedicated mockup of a warning card */}
          <div className="lg:order-1 w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">DEDUP CONFLICT DETECTED</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-xl space-y-2.5">
              <p className="text-xs font-semibold text-amber-800 leading-normal">
                An active lead with this phone number (+91 98765 43210) already exists in the system.
              </p>
              <div className="flex justify-between text-[11px] text-amber-700 font-medium">
                <span>Existing Lead: Rohan Verma</span>
                <span>Owner: Preeti Sen</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                RV
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-bold text-slate-800">Rohan Verma (Class 4 Enquiry)</h5>
                <span className="text-[10px] text-slate-400 font-semibold">Logged 2 days ago via Website</span>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-[#1565D8] text-[9px] font-bold rounded-full">Active</span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button size="sm" variant="ghost" className="text-slate-500 text-[11px] font-bold h-8 cursor-pointer">
                Discard
              </Button>
              <Button size="sm" className="bg-[#1565D8] hover:bg-[#1150ad] text-white text-[11px] font-bold h-8 cursor-pointer">
                Merge Records
              </Button>
            </div>
          </div>
        </div>

        {/* Deep Dive 3: WhatsApp Outreach */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block">
              OUTREACH CHANNELS
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-poppins">
              Connect via WhatsApp & SMS with one click
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed font-normal">
              Quickly send templates or customized check-ins directly via WhatsApp or standard text without having to save numbers to personal phone books. Track all communications directly back to the timeline.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#1565D8] shrink-0 mt-1" />
                <span className="text-xs font-semibold text-slate-700">Pre-approved template quick-replies for admissions</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#1565D8] shrink-0 mt-1" />
                <span className="text-xs font-semibold text-slate-700">Instant routing logs generated after message trigger</span>
              </div>
            </div>
          </div>
          
          {/* Visual: Phone Screen Mockup with WhatsApp template message */}
          <div className="w-full max-w-sm mx-auto bg-slate-900 rounded-[36px] p-3 border-4 border-slate-800 shadow-2xl relative">
            {/* Phone Speaker & Camera cutouts */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-20 flex justify-center items-center">
              <div className="w-8 h-1 bg-slate-750 rounded-full" />
            </div>
            
            <div className="bg-[#E5DDD5] w-full rounded-[28px] overflow-hidden pt-8 pb-4 px-3 flex flex-col gap-3 aspect-[3/4] relative z-10">

              {/* WhatsApp Header bar */}
              <div className="bg-[#075E54] text-white px-3 py-2 -mt-4 -mx-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200/50 flex items-center justify-center font-bold text-[10px] text-slate-900">LC</div>
                <div>
                  <h6 className="text-[10px] font-bold">Little Cubs Preschool</h6>
                  <span className="text-[7px] opacity-75 font-semibold">Online</span>
                </div>
              </div>

              {/* Chat Message Bubble */}
              <div className="self-end bg-[#DCF8C6] border border-[#d2f3b9] p-3 rounded-lg text-slate-800 max-w-[85%] text-[10px] font-normal leading-relaxed shadow-sm">
                <p>Hello Dr. Verma,</p>
                <p className="mt-1">Thanks for inquiring about pre-school admissions at Little Cubs. Here is our brochure and visit schedule. We look forward to meeting you on Saturday!</p>
                <div className="flex justify-end mt-1 text-[7px] text-slate-400 font-semibold">
                  <span>14:32 ✓✓</span>
                </div>
              </div>

              {/* Parent Reply Message Bubble */}
              <div className="self-start bg-white border border-slate-100 p-3 rounded-lg text-slate-800 max-w-[85%] text-[10px] font-normal leading-relaxed shadow-sm">
                <p>Thank you! Confirming our visit for Saturday at 10 AM. See you there.</p>
                <div className="flex justify-end mt-1 text-[7px] text-slate-400 font-semibold">
                  <span>14:35</span>
                </div>
              </div>

              {/* Follow-up Reminder Bubble */}
              <div className="self-end bg-[#DCF8C6] border border-[#d2f3b9] p-3 rounded-lg text-slate-800 max-w-[85%] text-[10px] font-normal leading-relaxed shadow-sm">
                <p>Perfect! We&apos;ve reserved your slot. A confirmation with directions is on its way. 📍</p>
                <div className="flex justify-end mt-1 text-[7px] text-slate-400 font-semibold">
                  <span>14:36 ✓✓</span>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="mt-auto flex items-center gap-2">
                <div className="flex-1 bg-white rounded-full px-3 py-2 text-[9px] text-slate-400 font-normal shadow-sm">
                  Type a message
                </div>
                <div className="w-7 h-7 rounded-full bg-[#075E54] flex items-center justify-center shrink-0 shadow-sm">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Dive 4: Source Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center lg:flex-row-reverse">
          <div className="lg:order-2 space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block">
              CAMPAIGN METRICS
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-poppins">
              Analyze sources to optimize marketing spend
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed font-normal">
              Every lead includes a tracked marketing source—whether direct phone calls, Google search, Facebook ads, or organic walk-ins. Identify exactly where your leads come from, letting you focus budget on highest converting channels.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#1565D8] shrink-0 mt-1" />
                <span className="text-xs font-semibold text-slate-700">Source filters to isolate campaign specific pipelines</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#1565D8] shrink-0 mt-1" />
                <span className="text-xs font-semibold text-slate-700">Real-time channel breakdown dashboards</span>
              </div>
            </div>
          </div>
          
          {/* Visual: Source breakdown graphic card */}
          <div className="lg:order-1 w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ENQUIRY SOURCE BREAKDOWN</span>
              <span className="text-[10px] bg-blue-50 text-[#1565D8] font-bold px-2 py-0.5 rounded-full">This Term</span>
            </div>

            <div className="space-y-3">
              {/* Source Item 1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-blue-500" /> Website Form</span>
                  <span>42% (84 leads)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '42%' }} />
                </div>
              </div>

              {/* Source Item 2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5 text-purple-500" /> Vidhyaan Marketplace</span>
                  <span>28% (56 leads)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '28%' }} />
                </div>
              </div>

              {/* Source Item 3 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-500" /> Phone Calls</span>
                  <span>18% (36 leads)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '18%' }} />
                </div>
              </div>

              {/* Source Item 4 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-amber-500" /> Walk-in / Referrals</span>
                  <span>12% (24 leads)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 4. FUNNEL INFOGRAPHIC */}
      <section className="w-full bg-[#1E293B] text-white py-24 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-16 flex flex-col items-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            ADMISSION PIPELINE
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-poppins text-center mb-6">
            The enquiry-to-admission conversion funnel
          </h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-2xl text-center mb-16 font-normal">
            Move parents systematically from initial interest to a fully enrolled student record, ensuring clear milestones along the way.
          </p>

          {/* SVG Funnel Visual (Hidden on Mobile) */}
          <div className="w-full max-w-3xl hidden md:flex flex-col items-center">
            <svg viewBox="0 0 600 360" className="w-full h-auto select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Funnel Tier 1: New (Top) */}
              <path d="M 40,20 L 560,20 L 510,95 L 90,95 Z" className="fill-blue-600/20 stroke-blue-500 stroke-2 hover:fill-blue-600/30 transition-all duration-300 cursor-pointer" />
              <text x="300" y="58" className="fill-white font-poppins font-bold text-sm" textAnchor="middle">
                NEW ENQUIRY (100%)
              </text>
              <text x="300" y="76" className="fill-slate-400 font-sans text-xs" textAnchor="middle">
                Website form, phone, walk-in or marketplace
              </text>

              {/* Funnel Tier 2: Contacted */}
              <path d="M 90,105 L 510,105 L 460,180 L 140,180 Z" className="fill-indigo-600/20 stroke-indigo-500 stroke-2 hover:fill-indigo-600/30 transition-all duration-300 cursor-pointer" />
              <text x="300" y="143" className="fill-white font-poppins font-bold text-sm" textAnchor="middle">
                CONTACTED (65%)
              </text>
              <text x="300" y="161" className="fill-slate-400 font-sans text-xs" textAnchor="middle">
                Counsellor assigned &amp; call logged
              </text>

              {/* Funnel Tier 3: Visit Scheduled */}
              <path d="M 140,190 L 460,190 L 410,265 L 190,265 Z" className="fill-cyan-600/20 stroke-cyan-500 stroke-2 hover:fill-cyan-600/30 transition-all duration-300 cursor-pointer" />
              <text x="300" y="228" className="fill-white font-poppins font-bold text-sm" textAnchor="middle">
                VISIT SCHEDULED (35%)
              </text>
              <text x="300" y="246" className="fill-slate-400 font-sans text-xs" textAnchor="middle">
                Campus visit or trial slot booked
              </text>

              {/* Funnel Tier 4: Admitted (Bottom) */}
              <path d="M 190,275 L 410,275 L 370,340 L 230,340 Z" className="fill-emerald-600/20 stroke-emerald-500 stroke-2 hover:fill-emerald-600/30 transition-all duration-300 cursor-pointer animate-pulse" />
              <text x="300" y="306" className="fill-white font-poppins font-bold text-sm" textAnchor="middle">
                ADMITTED (15%)
              </text>
              <text x="300" y="324" className="fill-emerald-400 font-sans font-bold text-[11px]" textAnchor="middle">
                1-Click student conversion
              </text>
            </svg>
          </div>

          {/* Mobile Funnel Stack (Hidden on Desktop) */}
          <div className="w-full max-w-md flex flex-col items-center gap-3 md:hidden">
            {/* Step 1 */}
            <div className="w-full p-5 bg-slate-800/40 border border-slate-700/60 border-l-4 border-l-blue-500 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest leading-none">Stage 1</h4>
              <h3 className="text-sm font-extrabold text-white">NEW ENQUIRY (100%)</h3>
              <p className="text-xs text-slate-400 font-normal leading-relaxed">
                Captured via website form, phone, walk-in, or marketplace
              </p>
            </div>
            
            <div className="w-1.5 h-6 bg-slate-700 rounded-full my-0.5 animate-pulse" />

            {/* Step 2 */}
            <div className="w-full p-5 bg-slate-800/40 border border-slate-700/60 border-l-4 border-l-indigo-500 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest leading-none">Stage 2</h4>
              <h3 className="text-sm font-extrabold text-white">CONTACTED (65%)</h3>
              <p className="text-xs text-slate-400 font-normal leading-relaxed">
                Counsellor assigned, details validated, call logged
              </p>
            </div>

            <div className="w-1.5 h-6 bg-slate-700 rounded-full my-0.5 animate-pulse" />

            {/* Step 3 */}
            <div className="w-full p-5 bg-slate-800/40 border border-slate-700/60 border-l-4 border-l-cyan-500 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest leading-none">Stage 3</h4>
              <h3 className="text-sm font-extrabold text-white">VISIT SCHEDULED (35%)</h3>
              <p className="text-xs text-slate-400 font-normal leading-relaxed">
                Campus walk-in scheduled or trial slot booked
              </p>
            </div>

            <div className="w-1.5 h-6 bg-slate-700 rounded-full my-0.5 animate-pulse" />

            {/* Step 4 */}
            <div className="w-full p-5 bg-slate-800/40 border border-slate-700/60 border-l-4 border-l-emerald-500 rounded-xl space-y-1 animate-pulse">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest leading-none">Stage 4</h4>
              <h3 className="text-sm font-extrabold text-white">ADMITTED (15%)</h3>
              <p className="text-xs text-slate-400 font-normal leading-relaxed">
                1-Click conversion to Student Profile
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMPARISON STRIP */}
      <section className="w-full py-24 max-w-5xl mx-auto px-6 md:px-16 flex flex-col items-center">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
          COMPARE WORKFLOW
        </span>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-poppins text-center mb-16">
          How Vidhyaan Compares to the Old Way
        </h2>

        {/* Comparison grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column: Spreadsheets */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-3.5 h-3.5 rounded-full bg-red-400" />
              <h4 className="text-base font-bold text-slate-900">Spreadsheets & Registers</h4>
            </div>
            
            <div className="space-y-5 flex-1">
              <div className="space-y-1">
                <span className="text-xs font-bold text-red-500">✗ Fragmented Capture</span>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Staff copy forms manually, sticky notes get misplaced, and sources are rarely tracked accurately.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-red-500">✗ Blind Assignments</span>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  No automated alerts; staff hand off leads verbally, resulting in delays or duplicate follow-up calls.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-red-500">✗ Missing Activity Records</span>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Each counsellor maintains their own notes on personal notebooks, offering zero history when they leave.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-red-500">✗ Loose Privacy Standards</span>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Excel files are downloaded on personal laptops, making parent data highly vulnerable to leaks.
                </p>
              </div>
            </div>
          </div>

          {/* Column: Vidhyaan CRM */}
          <div className="bg-white border border-blue-200 rounded-2xl p-8 space-y-6 shadow-md shadow-blue-500/5 flex flex-col relative overflow-hidden">
            {/* Soft accent top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#1565D8]" />
            
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-pulse" />
              <h4 className="text-base font-bold text-slate-900">Vidhyaan CRM</h4>
            </div>

            <div className="space-y-5 flex-1">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-600">✓ Unified Centralized Inbox</span>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Form submissions, calls, walk-ins, and marketplace leads auto-populate one database.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-600">✓ Instant Automatic Assignment</span>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Smart routing assigns leads to counsellors with immediate notification alerts and reminders.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-600">✓ Complete Activity Timeline</span>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  All call notes, status changes, and message history reside under the parent profile permanently.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-600">✓ Strict DPDP & ISO Compliance</span>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  PII is protected. Role-based controls limit exports and keep parent details secure.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. SOCIAL PROOF / STATS BAND */}
      <section className="w-full py-16 bg-slate-50 border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          <div className="space-y-2 py-4 md:py-0">
            <span className="text-4xl md:text-5xl font-extrabold text-[#1565D8] block tracking-tight font-poppins">
              100%
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto block leading-tight">
              DPDP Act & PII security compliant
            </span>
          </div>

          <div className="space-y-2 pt-6 md:pt-0 py-4 md:py-0">
            <span className="text-4xl md:text-5xl font-extrabold text-[#1565D8] block tracking-tight font-poppins">
              &lt; 15 min
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto block leading-tight">
              Average setup time to capture first lead
            </span>
          </div>

          <div className="space-y-2 pt-6 md:pt-0 py-4 md:py-0">
            <span className="text-4xl md:text-5xl font-extrabold text-[#1565D8] block tracking-tight font-poppins">
              0
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto block leading-tight">
              Admissions leads lost to manual registers
            </span>
          </div>

        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="w-full py-24 bg-white scroll-mt-12">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block">
              COMMON QUESTIONS
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-poppins">
              {leadManagementContent.faq.heading}
            </h2>
          </div>

          <div className="space-y-4">
            {leadManagementContent.faq.items.map((item, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-white transition-all duration-350"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4.5 flex justify-between items-center text-left hover:bg-slate-50/50 transition cursor-pointer"
                  >
                    <span className="font-bold text-slate-800 text-sm font-poppins pr-6">
                      {item.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-slate-500 text-xs font-normal leading-relaxed border-t border-slate-100 bg-[#F8FAFC]/50 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 8. CLOSING CTA */}
      <section className="w-full bg-[#F8FAFC] py-24 border-t border-slate-100 flex flex-col items-center">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-poppins">
            {leadManagementContent.closingCta.heading}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xl mx-auto font-normal">
            {leadManagementContent.closingCta.body}
          </p>

          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-md mx-auto">
            ⚡ Claims profile instantly, setup in under 15 minutes
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-2">
            <Link href={leadManagementContent.closingCta.ctaHref} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-[#1150ad] text-white text-sm font-semibold px-8 py-5 h-auto rounded-xl shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer">
                {leadManagementContent.closingCta.ctaText}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Related Links band */}
      <div className="w-full bg-white border-t border-slate-100 py-12">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Related CRM Modules
          </span>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {leadManagementContent.relatedLinks.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                className="text-xs font-semibold text-[#1565D8] hover:underline flex items-center gap-1"
              >
                {link.text}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
