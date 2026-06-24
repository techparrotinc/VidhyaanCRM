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
import MarketplaceHeader from '@/components/MarketplaceHeader'
import CompareBar from '@/components/CompareBar'
import { Card } from '@/components/ui/card'

export default function ContactUsPage() {
  // Navigation mega-menu state


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
      
      <MarketplaceHeader />

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

      {/* 10. FOOTER */}
      <CompareBar />
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
