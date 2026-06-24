'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  Building,
  GraduationCap,
  Sparkles,
  ChevronDown,
  LayoutGrid,
  Layers,
  Wallet,
  MessageSquare,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
  Cloud,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function ContactUsPage() {
  // Navigation mega-menu state
  const [isProductsOpen, setIsProductsOpen] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      <div onMouseLeave={() => setIsProductsOpen(false)}>
        {/* 1. STICKY NAV HEADER */}
        <header className="sticky top-0 w-full bg-white border-b border-slate-100 z-50 shadow-sm transition-all">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#1565D8] flex items-center justify-center text-white font-black text-sm shadow-md">
                V
              </div>
              <span className="text-base font-black tracking-tight text-slate-900">Vidhyaan</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 h-full">
              <div 
                className="h-full flex items-center"
                onMouseEnter={() => setIsProductsOpen(true)}
              >
                <button className="flex items-center gap-1 hover:text-[#1565D8] transition cursor-pointer py-5">
                  Products <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isProductsOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <Link href="/schools" className="hover:text-[#1565D8] transition">Find Schools</Link>
              <Link href="/learning-centers" className="hover:text-[#1565D8] transition">Learning Centers</Link>
              <Link href="/pricing" className="hover:text-[#1565D8] transition">Pricing</Link>
              <Link href="/about" className="hover:text-[#1565D8] transition">About Us</Link>
              <Link href="/contact" className="text-[#1565D8] hover:text-blue-700 transition">Contact Us</Link>
            </nav>

            <div className="flex items-center gap-2.5">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-700 hover:text-blue-700 font-bold text-xs px-4 py-2 rounded-xl h-auto">
                  Log in
                </Button>
              </Link>
              <Link href="/schools">
                <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-4 py-2.5 rounded-full h-auto">
                  Search Schools Nearby
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-full h-auto shadow-sm">
                  Claim Free Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Products Mega Menu Dropdown */}
          {isProductsOpen && (
            <div 
              className="absolute left-0 right-0 top-16 w-full bg-white border-t-[3px] border-[#1565D8] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15),0_15px_25px_-10px_rgba(0,0,0,0.1),0_0_30px_rgba(0,0,0,0.05)] z-40 transition-all duration-300 ease-out"
              onMouseEnter={() => setIsProductsOpen(true)}
            >
              <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 grid grid-cols-2 gap-8 relative">
                {/* Column Divider */}
                <div className="absolute top-8 bottom-8 left-1/2 w-px bg-[#E2E8F0] -translate-x-1/2 hidden md:block" />

                {/* Left Column: CORE PRODUCTS */}
                <div className="pr-0 md:pr-8">
                  <div className="flex items-center gap-2 pb-3 mb-6 border-b border-slate-100">
                    <LayoutGrid className="w-4 h-4 text-[#1565D8] fill-current" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">CORE PRODUCTS</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Product 1: School Profile */}
                    <Link href="/signup" className="flex items-start gap-4 p-3 rounded-r-2xl border-l-[3px] border-transparent hover:border-[#1565D8] hover:bg-[#F8FAFF] transition-all duration-300 group cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] group-hover:bg-[#DBEAFE] text-[#1565D8] flex items-center justify-center shrink-0 transition-colors duration-300">
                        <Building className="w-5 h-5 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-[#0F172A] group-hover:text-[#1565D8] transition-colors duration-300">School Profile</span>
                          <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-[#1565D8] group-hover:border-[#1565D8] group-hover:text-white transition-all duration-300">
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">Create and manage school listings and learning institutes online</p>
                      </div>
                    </Link>

                    {/* Product 2: Admissions CRM */}
                    <Link href="/signup" className="flex items-start gap-4 p-3 rounded-r-2xl border-l-[3px] border-transparent hover:border-[#1565D8] hover:bg-[#F8FAFF] transition-all duration-300 group cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-[#FFFBEB] group-hover:bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 transition-colors duration-300">
                        <UserPlus className="w-5 h-5 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-[#0F172A] group-hover:text-[#1565D8] transition-colors duration-300">Admissions CRM</span>
                          <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-[#1565D8] group-hover:border-[#1565D8] group-hover:text-white transition-all duration-300">
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">Manage applications and convert enquiries into enrollments faster</p>
                      </div>
                    </Link>

                    {/* Product 3: Centralized Communications */}
                    <Link href="/signup" className="flex items-start gap-4 p-3 rounded-r-2xl border-l-[3px] border-transparent hover:border-[#1565D8] hover:bg-[#F8FAFF] transition-all duration-300 group cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-[#FFF1F2] group-hover:bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0 transition-colors duration-300">
                        <MessageSquare className="w-5 h-5 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-[#0F172A] group-hover:text-[#1565D8] transition-colors duration-300">Centralized Communications</span>
                          <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-[#1565D8] group-hover:border-[#1565D8] group-hover:text-white transition-all duration-300">
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">Engage parents, students and staff seamlessly in one place</p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Right Column: ACADEMIC & OPERATIONS */}
                <div className="pl-0 md:pl-8">
                  <div className="flex items-center gap-2 pb-3 mb-6 border-b border-slate-100">
                    <Layers className="w-4 h-4 text-[#1565D8] fill-current" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">ACADEMIC & OPERATIONS</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Product 4: Fees & Payments */}
                    <Link href="/signup" className="flex items-start gap-4 p-3 rounded-2xl border-l-[3px] border-transparent hover:border-[#1565D8] hover:bg-[#F8FAFF] transition-all duration-300 group cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-[#F0FDF4] group-hover:bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 transition-colors duration-300">
                        <Wallet className="w-5 h-5 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-[#0F172A] group-hover:text-[#1565D8] transition-colors duration-300">Fees & Payments</span>
                          <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-[#1565D8] group-hover:border-[#1565D8] group-hover:text-white transition-all duration-300">
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">Collect payments, track dues and share invoices with ease</p>
                      </div>
                    </Link>

                    {/* Product 5: Education ERP */}
                    <Link href="/signup" className="flex items-start gap-4 p-3 rounded-2xl border-l-[3px] border-transparent hover:border-[#1565D8] hover:bg-[#F8FAFF] transition-all duration-300 group cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-[#F5F3FF] group-hover:bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0 transition-colors duration-300">
                        <BookOpen className="w-5 h-5 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-[#0F172A] group-hover:text-[#1565D8] transition-colors duration-300">Education ERP</span>
                          <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-[#1565D8] group-hover:border-[#1565D8] group-hover:text-white transition-all duration-300">
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">Manage academics, staff, students and communication efficiently</p>
                      </div>
                    </Link>

                    {/* Product 6: Student Hub */}
                    <Link href="/signup" className="flex items-start gap-4 p-3 rounded-r-2xl border-l-[3px] border-transparent hover:border-[#1565D8] hover:bg-[#F8FAFF] transition-all duration-300 group cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] group-hover:bg-[#CCFBF1] text-[#0D9488] flex items-center justify-center shrink-0 transition-colors duration-300">
                        <GraduationCap className="w-5 h-5 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-[#0F172A] group-hover:text-[#1565D8] transition-colors duration-300">Student Hub</span>
                          <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-[#1565D8] group-hover:border-[#1565D8] group-hover:text-white transition-all duration-300">
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">Maintain one student record from enquiry to alumni</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Enhanced Dropdown Bottom Bar */}
              <div className="bg-[#F8FAFC] border-t border-[#E2E8F0]">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#1565D8] flex items-center justify-center shrink-0 border border-blue-100/50">
                      <ShieldCheck className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#0F172A] block">Secure & Reliable</span>
                      <span className="text-xs text-slate-500 font-medium">Enterprise-grade security</span>
                    </div>
                  </div>
                  
                  <div className="w-px h-8 bg-slate-200 hidden md:block" />
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shrink-0 border border-amber-100/50">
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#0F172A] block">Quick To Launch</span>
                      <span className="text-xs text-slate-500 font-medium">Go live in 3 minutes. No IT support needed</span>
                    </div>
                  </div>
                  
                  <div className="w-px h-8 bg-slate-200 hidden md:block" />
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0 border border-emerald-100/50">
                      <Cloud className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#0F172A] block">Cloud Based</span>
                      <span className="text-xs text-slate-500 font-medium">Access anywhere, anytime from any device</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Contact Page Header Section */}
        <section className="bg-white py-12 border-b border-slate-100 text-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-blue-50/50 opacity-60 filter blur-3xl" />
            <div className="absolute bottom-0 -left-10 w-64 h-64 rounded-full bg-indigo-50/30 opacity-40 filter blur-2xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 z-10">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight font-poppins">
              Contact Us
            </h1>
            <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto mt-2 leading-relaxed font-semibold">
              We'd love to hear from you
            </p>
          </div>
        </section>

        {/* Contact Page Body Grid */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Contact Form */}
            <div className="md:col-span-7">
              <Card className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200/80">
                {submitted ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-black text-slate-850">Message Sent Successfully!</h3>
                    <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                      Thank you for contacting us. Our support team will get in touch with you shortly.
                    </p>
                    <Button 
                      type="button" 
                      onClick={() => setSubmitted(false)}
                      className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl h-auto shadow-sm cursor-pointer mt-4"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
                      <input
                        id="name"
                        type="text"
                        required
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium placeholder-slate-400 outline-none focus:border-[#1565D8] focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="yourname@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium placeholder-slate-400 outline-none focus:border-[#1565D8] focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium placeholder-slate-400 outline-none focus:border-[#1565D8] focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="message" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message</label>
                      <textarea
                        id="message"
                        required
                        rows={4}
                        placeholder="How can we help you?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium placeholder-slate-400 outline-none focus:border-[#1565D8] focus:bg-white transition-all resize-none"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-black text-xs py-4 rounded-xl h-auto shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                )}
              </Card>
            </div>

            {/* Right Column: Contact Details */}
            <div className="md:col-span-5 space-y-6">
              <Card className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200/80 space-y-8">
                
                {/* Address Block */}
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0 border border-blue-100/50">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Address</h4>
                    <p className="text-xs font-bold text-slate-800 mt-2 leading-relaxed">
                      TechParrot Innovations LLP <br />
                      No. B4, Balakrishna Street <br />
                      Nanmangalam, Chennai <br />
                      Tamil Nadu, India
                    </p>
                  </div>
                </div>

                {/* Email Block */}
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0 border border-blue-100/50">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Email</h4>
                    <a href="mailto:support@vidhyaan.com" className="text-xs font-bold text-[#1565D8] hover:underline block mt-2">
                      support@vidhyaan.com
                    </a>
                  </div>
                </div>

                {/* Phone Block */}
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0 border border-blue-100/50">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Phone</h4>
                    <a href="tel:+919884185362" className="text-xs font-bold text-slate-800 hover:text-[#1565D8] block mt-2">
                      +91 98841 85362
                    </a>
                  </div>
                </div>

                {/* Business Hours Block */}
                <div className="flex gap-4 items-start border-t border-slate-100 pt-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-100">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Business hours</h4>
                    <p className="text-xs font-bold text-slate-800 mt-2">
                      Mon-Sat: 9 AM to 6 PM IST
                    </p>
                  </div>
                </div>

              </Card>
            </div>

          </div>
        </section>

      </div>

      {/* 10. FOOTER */}
      <footer className="bg-slate-900 text-white mt-12 py-12 px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-slate-700 pb-8">
          
          {/* Brand column */}
          <div className="space-y-4">
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
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">For Parents</h4>
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-350">
              <Link href="/schools" className="hover:text-white transition">Find Schools</Link>
              <Link href="/learning-centers" className="hover:text-white transition">Learning Centers</Link>
              <Link href="/schools?sort=rating" className="hover:text-white transition">Compare Schools</Link>
              <Link href="/login" className="hover:text-white transition">Parent Login</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">For Schools</h4>
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-355">
              <Link href="/signup" className="hover:text-white transition">List Your School</Link>
              <Link href="/dashboard" className="hover:text-white transition">CRM Features</Link>
              <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
              <Link href="/login" className="hover:text-white transition">School Login</Link>
            </div>
          </div>

          <div className="space-y-3">
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
