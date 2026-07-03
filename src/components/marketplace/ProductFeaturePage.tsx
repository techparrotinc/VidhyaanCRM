'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronDown, ChevronUp, CheckCircle, HelpCircle } from 'lucide-react'

export interface ProductFeaturePageContent {
  h1: string
  subhead: string
  primaryCta: { text: string; href: string }
  secondaryCta?: { text: string; href: string }
  trustLine: string
  problem: { heading: string; body: string }
  capabilities: { heading?: string; title: string; body: string }[]
  howItWorks: { heading: string; steps: string[] }
  whoThisIsFor: { heading: string; body: string }
  faq: { heading: string; items: { q: string; a: string }[] }
  closingCta: { heading: string; body: string; ctaText: string; ctaHref: string }
  relatedLinks: { text: string; href: string }[]
}

interface ProductFeaturePageProps {
  content: ProductFeaturePageContent
}

export default function ProductFeaturePage({ content }: ProductFeaturePageProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  return (
    <div className="space-y-16 max-w-4xl mx-auto">
      {/* 1. HERO SECTION */}
      <section className="text-center bg-white rounded-3xl border border-slate-200 p-8 md:p-16 shadow-xl space-y-6">
        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-[#1565D8] border border-blue-150 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full">
          Feature Spotlight
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight font-poppins">
          {content.h1}
        </h1>
        <p className="text-slate-650 font-medium text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
          {content.subhead}
        </p>
        
        <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href={content.primaryCta.href} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-sm px-8 py-4 rounded-xl h-auto shadow-lg shadow-blue-550/20 flex items-center justify-center gap-2 transition cursor-pointer">
              {content.primaryCta.text}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          {content.secondaryCta && (
            <Link 
              href={content.secondaryCta.href}
              className="text-slate-600 hover:text-[#1565D8] font-bold text-sm transition py-2"
            >
              {content.secondaryCta.text}
            </Link>
          )}
        </div>

        <p className="text-xs text-slate-450 font-semibold leading-relaxed pt-2">
          {content.trustLine}
        </p>
      </section>

      {/* 2. PROBLEM SECTION */}
      <section className="bg-slate-50 border border-slate-200/60 rounded-3xl p-8 md:p-12 space-y-4">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-poppins">
          {content.problem.heading}
        </h2>
        <p className="text-slate-650 font-medium text-base leading-relaxed">
          {content.problem.body}
        </p>
      </section>

      {/* 3. CAPABILITIES (Card Grid) */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-poppins">
            Key Capabilities
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {content.capabilities.map((cap, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-2">
                {cap.heading && (
                  <span className="text-[10px] font-bold text-[#1565D8] uppercase tracking-wider block">
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
          ))}
        </div>
      </section>

      {/* 4. HOW IT WORKS (Numbered steps) */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 space-y-8">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight font-poppins">
          {content.howItWorks.heading}
        </h2>

        <div className={`grid grid-cols-1 gap-8 relative ${
          content.howItWorks.steps.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'
        }`}>
          {/* Connector line for large screens */}
          <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10" />

          {content.howItWorks.steps.map((step, idx) => (
            <div key={idx} className="text-center p-2 space-y-4 flex flex-col items-center relative">
              <div className="w-12 h-12 rounded-full bg-[#1565D8] text-white flex items-center justify-center font-black shadow-md border border-white">
                {idx + 1}
              </div>
              <p className="text-sm text-slate-650 font-semibold leading-relaxed max-w-xs">
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. WHO THIS IS FOR */}
      <section className="bg-slate-50 border border-slate-200/60 rounded-3xl p-8 md:p-12 space-y-4">
        <div className="flex items-center gap-2 text-[#1565D8]">
          <CheckCircle className="w-5 h-5" />
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight font-poppins">
            {content.whoThisIsFor.heading}
          </h2>
        </div>
        <p className="text-slate-650 font-medium text-base leading-relaxed">
          {content.whoThisIsFor.body}
        </p>
      </section>

      {/* 6. FAQ (Accordion) */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-slate-500" />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-poppins">
            {content.faq.heading}
          </h2>
        </div>
        <div className="space-y-3">
          {content.faq.items.map((item, idx) => {
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
      <section className="bg-blue-50/50 rounded-3xl p-8 md:p-16 border border-blue-100/50 text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
          {content.closingCta.heading}
        </h2>
        <p className="text-slate-650 font-medium text-sm md:text-base leading-relaxed max-w-xl mx-auto">
          {content.closingCta.body}
        </p>
        <div className="pt-2 flex justify-center">
          <Link href={content.closingCta.ctaHref} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-xl h-auto shadow-lg shadow-blue-550/20 flex items-center justify-center gap-2 transition cursor-pointer">
              {content.closingCta.ctaText}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 8. RELATED LINKS */}
      {content.relatedLinks.length > 0 && (
        <section className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3 text-xs font-semibold text-slate-500">
          <span>Explore related features:</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {content.relatedLinks.map((link, idx) => (
              <Link 
                key={idx} 
                href={link.href}
                className="text-[#1565D8] hover:text-blue-700 hover:underline transition"
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
