'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { 
  ShieldCheck, 
  IndianRupee, 
  Lock, 
  Building2, 
  MapPin, 
  Search, 
  LayoutDashboard, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  School,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import CompareBar from '@/components/CompareBar'
import { Card } from '@/components/ui/card'

export default function AboutPage() {
  // Dynamic Metadata
  useEffect(() => {
    document.title = "About Vidhyaan | India's School Discovery & Admission CRM Platform";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Vidhyaan is India\'s premier school discovery and admission CRM platform. We connect parents with verified CBSE, ICSE, and Matriculation schools, preschools, and learning centers while empowering institutions with modern admission management tools.');
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      {/* AboutPage + Organization JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "mainEntity": {
              "@type": "Organization",
              "name": "Vidhyaan",
              "url": "https://vidhyaan.com",
              "logo": "https://vidhyaan.com/favicon.ico",
              "description": "India's premier school discovery platform and admissions CRM provider.",
              "parentOrganization": {
                "@type": "LegalBusiness",
                "name": "TechParrot Innovations LLP",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Chennai",
                  "addressRegion": "Tamil Nadu",
                  "addressCountry": "IN"
                }
              },
              "areaServed": "IN"
            }
          })
        }}
      />

      <MarketplaceHeader />

      <main className="flex-grow">
        
        {/* 1. HERO BAND */}
        <section className="bg-gradient-to-b from-blue-50/50 via-blue-50/10 to-[#F8FAFC] py-20 text-center relative overflow-hidden border-b border-slate-100">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-blue-50/50 opacity-60 filter blur-3xl animate-pulse" />
            <div className="absolute bottom-0 -left-10 w-64 h-64 rounded-full bg-indigo-50/30 opacity-40 filter blur-2xl" />
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 z-10 flex flex-col items-center gap-4">
            <span className="bg-blue-50 text-[#1565D8] text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-blue-100/50 select-none">
              About Vidhyaan
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight font-poppins max-w-2xl">
              Helping Every Parent Find the Right School
            </h1>
            <p className="text-xs md:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed font-semibold">
              Vidhyaan is India's school discovery and admission platform — connecting parents with verified schools, learning centers, and coaching institutes, while giving institutions modern tools to manage admissions.
            </p>
          </div>
        </section>

        {/* 2. MISSION SECTION */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Col: Mission Text */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950 font-poppins">
                Our Mission
              </h2>
              <div className="space-y-4 text-slate-650 text-xs md:text-sm font-medium leading-relaxed">
                <p>
                  School search in India is fragmented. Parents rely on word-of-mouth, scattered directory listings, and outdated brochures, often finding zero verified info on fee structures or academic results.
                </p>
                <p>
                  Vidhyaan makes discovery transparent. We provide verified school profiles, actual fee info, real parent reviews, and direct admission enquiries. At the same time, we give institutions an admission CRM built for how Indian schools actually work.
                </p>
              </div>
            </div>

            {/* Right Col: Stats Card */}
            <div className="lg:col-span-5">
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[#1565D8] to-blue-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden text-left">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
                <h3 className="relative z-10 text-xs font-black uppercase tracking-wider text-blue-100">
                  Trust Indicators
                </h3>
                
                <div className="relative z-10 mt-8 space-y-6">
                  <div>
                    <span className="text-3xl md:text-4xl font-black tracking-tight font-poppins">45+</span>
                    <p className="text-xs font-bold text-blue-100 mt-1">Verified Schools Live</p>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <span className="text-3xl md:text-4xl font-black tracking-tight font-poppins">11</span>
                    <p className="text-xs font-bold text-blue-100 mt-1">Cities & Hubs Covered</p>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <span className="text-3xl md:text-4xl font-black tracking-tight font-poppins">10,000+</span>
                    <p className="text-xs font-bold text-blue-100 mt-1">Parents Assisted Monthly</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 3. WHAT WE DO (Product Pillars) */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-16 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950 font-poppins">
              One Platform, Two Sides
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-semibold mt-2">
              Empowering both sides of the educational ecosystem with verified listing tools and full CRM pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Card 1 — For Parents */}
            <div className="group rounded-3xl bg-blue-50/50 hover:bg-blue-50/80 border border-blue-100/50 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md">
                  <Search className="w-6 h-6" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 font-poppins">Discovery Marketplace</h3>
                  <p className="text-xs font-bold text-[#1565D8] uppercase tracking-wider select-none">For Parents</p>
                </div>

                <div className="space-y-4 pt-2">
                  {[
                    "Search and discover verified school profiles & contact info",
                    "Compare school fees, boards, facilities and offerings side-by-side",
                    "Submit direct admission enquiries and track your application status"
                  ].map((bullet, idx) => (
                    <div key={idx} className="flex gap-3 items-start text-xs font-semibold text-slate-650">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link href="/schools">
                  <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-full h-auto shadow-md hover:shadow-xl transition-all flex items-center gap-1.5 border-0">
                    <span>Find Schools</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Card 2 — For Institutions */}
            <div className="group rounded-3xl bg-amber-50/50 hover:bg-amber-50/80 border border-amber-100/50 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 font-poppins">Admission CRM</h3>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider select-none">For Institutions</p>
                </div>

                <div className="space-y-4 pt-2">
                  {[
                    "Manage lead and admission pipelines through a custom visual board",
                    "Handle student records, invoices, late alerts and online payments",
                    "Broadcast automated updates and campaign updates via WhatsApp or Email"
                  ].map((bullet, idx) => (
                    <div key={idx} className="flex gap-3 items-start text-xs font-semibold text-slate-650">
                      <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link href="/pricing">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-6 py-3 rounded-full h-auto shadow-md hover:shadow-xl transition-all flex items-center gap-1.5 border-0">
                    <span>Explore CRM</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* 4. WHY VIDHYAAN (Values Strip) */}
        <section className="bg-slate-50/50 border-t border-b border-slate-100 py-20">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950 font-poppins">
                What We Stand For
              </h2>
              <p className="text-xs md:text-sm text-slate-500 font-semibold mt-2">
                Our core values outline the framework for transparency, compliance, and platform trust.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: "Verified Information",
                  desc: "Every listed school reviewed before going live",
                  bgClass: "bg-blue-50 text-blue-600 border border-blue-100/50"
                },
                {
                  icon: IndianRupee,
                  title: "Fee Transparency",
                  desc: "Real fee ranges, no hidden costs or surprises",
                  bgClass: "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                },
                {
                  icon: Lock,
                  title: "Data Privacy",
                  desc: "DPDP-compliant handling of parent and student data",
                  bgClass: "bg-indigo-50 text-indigo-600 border border-indigo-100/50"
                },
                {
                  icon: Building2,
                  title: "Built for India",
                  desc: "DLT-compliant messaging, UPI payments, Indian boards",
                  bgClass: "bg-amber-50 text-amber-600 border border-amber-100/50"
                }
              ].map((val, idx) => {
                const ValIcon = val.icon
                return (
                  <Card key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 flex flex-col justify-between gap-4 text-left hover:shadow-md transition-shadow">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${val.bgClass}`}>
                      <ValIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900 font-poppins">{val.title}</h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">{val.desc}</p>
                    </div>
                  </Card>
                )
              })}
            </div>

          </div>
        </section>

        {/* 5. COMPANY BLOCK */}
        <section className="py-10 text-center">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>Vidhyaan is built by TechParrot Innovations LLP, Chennai, India.</span>
          </div>
        </section>

        {/* 6. CTA BANNER */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pb-16">
          <div className="rounded-3xl bg-gradient-to-br from-blue-900 to-[#1565D8] text-white p-8 md:p-12 shadow-2xl relative overflow-hidden text-center flex flex-col items-center gap-6">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.04]" />
            
            <div className="space-y-2 relative z-10 max-w-xl">
              <h2 className="text-2xl md:text-3xl font-black font-poppins tracking-tight">
                Join Vidhyaan Today
              </h2>
              <p className="text-xs md:text-sm text-blue-100 font-medium leading-relaxed">
                Whether you are a parent seeking the right admission, or an school administrator streamlining admissions and fee collection, we have the tools you need.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <Link href="/schools">
                <Button className="bg-white hover:bg-blue-50 text-blue-600 font-bold text-xs px-6 py-3 rounded-full h-auto shadow-md">
                  Find Schools
                </Button>
              </Link>
              <Link href="/register-school">
                <Button variant="outline" className="border-white/40 hover:border-white text-white hover:bg-white/10 font-bold text-xs px-6 py-3 rounded-full h-auto">
                  List Your Institution
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* 4. FOOTER */}
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
              <Link href="/signup" className="hover:text-white transition">List Your School</Link>
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
