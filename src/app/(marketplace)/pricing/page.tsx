'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Check, 
  Minus, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  School,
  ChevronDown,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import CompareBar from '@/components/CompareBar'
import { Card } from '@/components/ui/card'

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Dynamic Metadata
  useEffect(() => {
    document.title = "Vidhyaan Pricing | Free School Listing & Admission CRM Plans";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Vidhyaan is free forever for school discovery listings. Explore our premium admissions CRM Starter and Growth plans. Streamline lead tracking, fee invoicing, and campaigns today.');
  }, []);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  const faqs = [
    {
      q: "Is the free listing really free forever?",
      a: "Yes, profile + discovery + enquiries never expire, no credit card needed."
    },
    {
      q: "What happens after the 7-day trial?",
      a: "Choose a plan to continue CRM access; your free listing and profile stay active either way."
    },
    {
      q: "Do I need a credit card to start?",
      a: "No — trial starts without any payment details."
    },
    {
      q: "What is the WhatsApp addon?",
      a: "DLT-compliant WhatsApp campaign sending, available as a paid addon on CRM plans — contact us to enable."
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes, cancel anytime; your listing remains free and live."
    }
  ]

  // Compare Table Features definition
  const comparisonFeatures = [
    { name: "Free School Profile", free: "Check", starter: "Check", growth: "Check" },
    { name: "Parent Enquiries", free: "Check", starter: "Check", growth: "Check" },
    { name: "Lead Management", free: "Dash", starter: "Check", growth: "Check" },
    { name: "Admission Management", free: "Dash", starter: "Check", growth: "Check" },
    { name: "Student Management", free: "Dash", starter: "Check", growth: "Check" },
    { name: "Fee Management", free: "Dash", starter: "Check", growth: "Check" },
    { name: "Online Payments (Razorpay)", free: "Dash", starter: "Check", growth: "Check" },
    { name: "Campaign Management", free: "Dash", starter: "500 / mo", growth: "5,000 / mo" },
    { name: "Reports & Analytics", free: "Dash", starter: "Check", growth: "Check" },
    { name: "Parent Portal", free: "Dash", starter: "Check", growth: "Check" },
    { name: "WhatsApp Addon", free: "Dash", starter: "Add-on", growth: "Add-on" }
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      {/* FAQPage Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
              }
            }))
          })
        }}
      />

      {/* TODO: add Offer schema when real prices set */}

      <MarketplaceHeader />

      <main className="flex-grow">
        
        {/* 1. HERO BAND */}
        <section className="bg-gradient-to-b from-blue-50/50 via-blue-50/10 to-[#F8FAFC] py-20 text-center relative overflow-hidden border-b border-slate-100">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-blue-50/50 opacity-60 filter blur-3xl" />
            <div className="absolute bottom-0 -left-10 w-64 h-64 rounded-full bg-indigo-50/30 opacity-40 filter blur-2xl" />
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 z-10 flex flex-col items-center gap-3">
            <span className="bg-blue-50 text-[#1565D8] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-100/50 select-none">
              Pricing
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight font-poppins">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed font-semibold">
              Free forever for discovery. Pay only when you're ready to run your admissions on Vidhyaan.
            </p>
          </div>
        </section>

        {/* 2. TIER CARDS */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-6">
            
            {/* CARD 1 — Free Listing */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-poppins">Free Listing</h3>
                  <p className="text-[11px] text-slate-450 font-bold mt-1 leading-relaxed">
                    Get discovered by parents
                  </p>
                </div>
                
                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight text-slate-900 font-poppins">₹0</span>
                    <span className="text-xs text-slate-400 font-bold">/ forever</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">No credit card required</p>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-4">
                  {[
                    "Public school profile",
                    "Verified badge eligibility",
                    "Parent enquiries → lead inbox",
                    "Marketplace search visibility"
                  ].map((feat, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs font-semibold text-slate-650">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <Link href="/register">
                  <Button variant="outline" className="w-full border-blue-200 text-[#1565D8] hover:bg-blue-50 font-bold text-xs py-3.5 rounded-full h-auto shadow-sm">
                    Claim Free Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* CARD 2 — Starter */}
            {/* TODO: real Starter price */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-poppins">Starter</h3>
                  <p className="text-[11px] text-slate-450 font-bold mt-1 leading-relaxed">
                    Full CRM for growing institutions
                  </p>
                </div>
                
                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight text-slate-900 font-poppins">₹—</span>
                    <span className="text-xs text-slate-400 font-bold">/ month</span>
                  </div>
                  <p className="text-[10px] text-[#1565D8] font-bold mt-1">Launch pricing coming soon</p>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex gap-2.5 items-start text-xs font-bold text-slate-800">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Everything in Free</span>
                  </div>
                  {[
                    "Lead Management",
                    "Admission Management",
                    "Student Management",
                    "Fee Management & online payments",
                    "Campaigns (500 recipients/mo)",
                    "Reports & Analytics"
                  ].map((feat, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs font-semibold text-slate-650">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <Link href="/register-school?plan=starter">
                  <Button className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-full h-auto shadow-md">
                    Start 7-Day Free Trial
                  </Button>
                </Link>
              </div>
            </div>

            {/* CARD 3 — Growth (HIGHLIGHTED) */}
            {/* TODO: real Growth price */}
            <div className="bg-white rounded-3xl border-2 border-[#1565D8] p-8 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-left relative overflow-hidden scale-105 z-10 ring-8 ring-blue-50/50">
              <div className="absolute top-4 right-4 bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full select-none shadow-sm">
                Most Popular
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-poppins mt-2">Growth</h3>
                  <p className="text-[11px] text-slate-450 font-bold mt-1 leading-relaxed">
                    Multi-branch and high-volume admissions
                  </p>
                </div>
                
                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tight text-slate-900 font-poppins">₹—</span>
                    <span className="text-xs text-slate-400 font-bold">/ month</span>
                  </div>
                  <p className="text-[10px] text-amber-600 font-bold mt-1">Launch pricing coming soon</p>
                </div>

                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex gap-2.5 items-start text-xs font-bold text-slate-800">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>Everything in Starter</span>
                  </div>
                  {[
                    "Campaigns (5,000 recipients/mo)",
                    "Priority CRM support",
                    "WhatsApp addon eligible"
                  ].map((feat, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs font-semibold text-slate-650">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <Link href="/register-school?plan=growth">
                  <Button className="w-full bg-[#FFC107] hover:bg-yellow-500 text-slate-950 font-black text-xs py-3.5 rounded-full h-auto shadow-md">
                    Start 7-Day Free Trial
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* 3. COMPARISON TABLE */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-12 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-black tracking-tight text-slate-950 font-poppins">
              Plan Comparison
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Compare CRM features, payments, and messaging capacities.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-md bg-white">
            <table className="w-full min-width-[800px] border-collapse text-left text-xs font-medium text-slate-700">
              
              {/* Sticky Table Header */}
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 sticky top-0 backdrop-blur z-20">
                  <th className="py-4.5 px-6 font-bold text-slate-900 w-1/3">Feature</th>
                  <th className="py-4.5 px-6 font-bold text-slate-900 text-center w-2/9">Free</th>
                  <th className="py-4.5 px-6 font-bold text-[#1565D8] text-center w-2/9">Starter</th>
                  <th className="py-4.5 px-6 font-bold text-slate-900 text-center w-2/9">Growth</th>
                </tr>
              </thead>

              {/* Table Rows */}
              <tbody>
                {comparisonFeatures.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors odd:bg-slate-50/20">
                    <td className="py-4 px-6 font-bold text-slate-800">{row.name}</td>
                    
                    {/* Free Column */}
                    <td className="py-4 px-6 text-center">
                      {row.free === "Check" ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : (
                        <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>

                    {/* Starter Column */}
                    <td className="py-4 px-6 text-center font-bold text-slate-950">
                      {row.starter === "Check" ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : row.starter === "Dash" ? (
                        <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                      ) : (
                        <span>{row.starter}</span>
                      )}
                    </td>

                    {/* Growth Column */}
                    <td className="py-4 px-6 text-center font-bold text-slate-950">
                      {row.growth === "Check" ? (
                        <Check className="w-4 h-4 text-green-500 mx-auto" />
                      ) : row.growth === "Dash" ? (
                        <Minus className="w-4 h-4 text-slate-300 mx-auto" />
                      ) : (
                        <span>{row.growth}</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. INSTITUTION NOTE STRIP */}
        <section className="bg-blue-50/40 border-t border-b border-blue-100/20 py-8 text-center">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <Info className="w-4 h-4 text-[#1565D8]" />
            <span>Same simple pricing for Schools, Junior Colleges, Learning Centers and Coaching Centers.</span>
          </div>
        </section>

        {/* 5. PRICING FAQ (Accordion) */}
        <section className="max-w-4xl mx-auto px-4 md:px-6 py-20 text-center">
          <div className="max-w-2xl mx-auto mb-14 text-center">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950 font-poppins">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Have questions about billing, setup, or features? Read answers below.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full py-5 px-6 flex items-center justify-between text-left font-bold text-xs md:text-sm text-slate-800 hover:text-[#1565D8] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-[#1565D8] transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden text-left ${
                      isOpen ? 'max-h-[140px] border-t border-slate-100 bg-slate-50/40' : 'max-h-0'
                    }`}
                  >
                    <p className="p-6 text-xs text-slate-500 font-medium leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 6. CTA BANNER */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pb-16">
          <div className="rounded-3xl bg-gradient-to-br from-blue-900 to-[#1565D8] text-white p-8 md:p-12 shadow-2xl relative overflow-hidden text-center flex flex-col items-center gap-6">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.04]" />
            
            <div className="space-y-2 relative z-10 max-w-xl">
              <h2 className="text-2xl md:text-3xl font-black font-poppins tracking-tight">
                Start growing your admissions today
              </h2>
              <p className="text-xs md:text-sm text-blue-100 font-medium leading-relaxed">
                Claim your free directory listing or start a risk-free 7-day trial of our advanced Admissions CRM.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <Link href="/register">
                <Button className="bg-white hover:bg-blue-50 text-blue-600 font-bold text-xs px-6 py-3 rounded-full h-auto shadow-md">
                  Claim Free Profile
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="border-white/40 hover:border-white text-white hover:bg-white/10 font-bold text-xs px-6 py-3 rounded-full h-auto">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* 7. FOOTER */}
      <CompareBar />
      <footer className="bg-slate-900 text-white py-12 px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-slate-700 pb-8">
          
          {/* Brand column */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1565D8] flex items-center justify-center text-white font-black text-xs shadow-md">
                V
              </div>
              <span className="text-base font-black tracking-tight text-white">Vidhyaan</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 font-medium max-w-xs">
              India's trusted school discovery platform
            </p>
            <div className="flex gap-4 pt-1 text-slate-400">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition text-xs font-semibold">LinkedIn</a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition text-xs font-semibold">Twitter</a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition text-xs font-semibold">Instagram</a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition text-xs font-semibold">Facebook</a>
            </div>
          </div>

          {/* Links columns */}
          <div className="space-y-3 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">For Parents</h4>
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-350">
              <Link href="/schools" className="hover:text-white transition">Find Schools</Link>
              <Link href="/learning-centers" className="hover:text-white transition">Learning Centers</Link>
              <Link href="/schools?sort=rating" className="hover:text-white transition">Compare Schools</Link>
              <Link href="/login" className="hover:text-white transition">Parent Login</Link>
            </div>
          </div>

          <div className="space-y-3 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">For Schools</h4>
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-355">
              <Link href="/register" className="hover:text-white transition">List Your School</Link>
              <Link href="/dashboard" className="hover:text-white transition">CRM Features</Link>
              <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
              <Link href="/login" className="hover:text-white transition">School Login</Link>
            </div>
          </div>

          <div className="space-y-3 text-left">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Company</h4>
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-355">
              <Link href="/about" className="hover:text-white transition">About Us</Link>
              <Link href="/contact" className="hover:text-white transition">Contact Us</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
              <Link href="/refunds" className="hover:text-white transition">Refund Policy</Link>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
          <span>&copy; 2026 TechParrot Innovations LLP. All rights reserved.</span>
        </div>
      </footer>

    </div>
  )
}
