'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  School,
  Loader2,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import CompareBar from '@/components/CompareBar'
import { Card } from '@/components/ui/card'

// Zod Validation Schema matching API
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().refine((val) => {
    const cleaned = val.replace(/\D/g, '')
    return /^[6-9]\d{9}$/.test(cleaned)
  }, 'Please enter a valid 10-digit mobile number starting with 6-9'),
  role: z.enum(['PARENT', 'SCHOOL', 'LEARNING_CENTER', 'OTHER']),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

export default function ContactUsPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'PARENT',
      subject: '',
      message: '',
    }
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Dynamic Metadata & JSON-LD
  useEffect(() => {
    document.title = "Contact Vidhyaan | School Discovery & Admission CRM Support";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Need help with your school listing, parent account, or the admission CRM? Contact Vidhyaan support. Located in Chennai, serving organizations and parents pan-India.');
  }, []);

  const onSubmit = async (data: ContactFormValues) => {
    setLoading(true)
    setServerError(null)
    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (result.success) {
        setSubmitted(true)
        reset()
      } else {
        setServerError(result.error || 'Something went wrong')
      }
    } catch (err: any) {
      setServerError('Failed to submit form. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      {/* ContactPage Organization contactPoint JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Vidhyaan",
            "url": "https://vidhyaan.com",
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "support@vidhyaan.com",
              "contactType": "customer support",
              "areaServed": "IN",
              "availableLanguage": ["en", "ta", "hi"]
            }
          })
        }}
      />

      <MarketplaceHeader />

      <main className="flex-grow">
        
        {/* 1. HERO BAND */}
        <section className="bg-gradient-to-b from-blue-50/50 via-blue-50/10 to-[#F8FAFC] py-16 text-center relative overflow-hidden border-b border-slate-100">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-blue-50/50 opacity-60 filter blur-3xl" />
            <div className="absolute bottom-0 -left-10 w-64 h-64 rounded-full bg-indigo-50/30 opacity-40 filter blur-2xl" />
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 z-10 flex flex-col items-center gap-3">
            <span className="bg-blue-50 text-[#1565D8] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-100/50 select-none">
              We're here to help
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight font-poppins">
              Contact Vidhyaan
            </h1>
            <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed font-semibold">
              Questions about listing your school, using the CRM, or finding the right school for your child — reach us anytime.
            </p>
          </div>
        </section>

        {/* 2. MAIN GRID */}
        <section className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT — Contact form card */}
            <div className="lg:col-span-7">
              <Card className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200/80">
                {submitted ? (
                  <div className="text-center py-12 space-y-6">
                    <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-slate-900">Message Sent Successfully!</h3>
                      <p className="text-xs font-bold text-slate-500 max-w-sm mx-auto leading-relaxed">
                        We'll get back within 24 hours. A confirmation email has been sent to your inbox.
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      onClick={() => setSubmitted(false)}
                      className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-full h-auto shadow-md cursor-pointer mt-4"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {serverError && (
                      <div className="bg-red-50 text-red-650 border border-red-100 p-4 rounded-xl text-xs font-semibold text-left">
                        {serverError}
                      </div>
                    )}

                    <div className="space-y-1.5 text-left">
                      <label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        {...register('name')}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#1565D8] focus:bg-white rounded-xl px-4 py-3.5 text-xs font-medium placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-[#1565D8]/20 focus:ring-offset-0"
                      />
                      {errors.name && (
                        <p className="text-[11px] text-red-655 font-bold mt-1 text-left">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          placeholder="yourname@example.com"
                          {...register('email')}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#1565D8] focus:bg-white rounded-xl px-4 py-3.5 text-xs font-medium placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-[#1565D8]/20 focus:ring-offset-0"
                        />
                        {errors.email && (
                          <p className="text-[11px] text-red-655 font-bold mt-1 text-left">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label htmlFor="phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          placeholder="10-digit mobile number"
                          {...register('phone')}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#1565D8] focus:bg-white rounded-xl px-4 py-3.5 text-xs font-medium placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-[#1565D8]/20 focus:ring-offset-0"
                        />
                        {errors.phone && (
                          <p className="text-[11px] text-red-655 font-bold mt-1 text-left">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label htmlFor="role" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          I am a... <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="role"
                            {...register('role')}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-[#1565D8] focus:bg-white rounded-xl pl-4 pr-10 py-3.5 text-xs font-medium outline-none transition-all focus:ring-2 focus:ring-[#1565D8]/20 focus:ring-offset-0 appearance-none cursor-pointer"
                          >
                            <option value="PARENT">Parent</option>
                            <option value="SCHOOL">School Administrator</option>
                            <option value="LEARNING_CENTER">Learning Center Manager</option>
                            <option value="OTHER">Other Partner</option>
                          </select>
                          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                        {errors.role && (
                          <p className="text-[11px] text-red-655 font-bold mt-1 text-left">{errors.role.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label htmlFor="subject" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Subject
                        </label>
                        <input
                          id="subject"
                          type="text"
                          placeholder="How can we help?"
                          {...register('subject')}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-[#1565D8] focus:bg-white rounded-xl px-4 py-3.5 text-xs font-medium placeholder-slate-400 outline-none transition-all focus:ring-2 focus:ring-[#1565D8]/20 focus:ring-offset-0"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label htmlFor="message" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        rows={5}
                        placeholder="Please describe your enquiry in detail..."
                        {...register('message')}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#1565D8] focus:bg-white rounded-xl px-4 py-3.5 text-xs font-medium placeholder-slate-400 outline-none transition-all resize-none focus:ring-2 focus:ring-[#1565D8]/20 focus:ring-offset-0"
                      />
                      {errors.message && (
                        <p className="text-[11px] text-red-655 font-bold mt-1 text-left">{errors.message.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-black text-xs py-4 rounded-full h-auto shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <span>Sending Message...</span>
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </Card>
            </div>

            {/* RIGHT — Contact info rail */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200/80 space-y-8">
                
                {/* Mail block */}
                <div className="flex gap-4 items-start text-left">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0 border border-blue-100/50">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Email us</h4>
                    <a href="mailto:support@vidhyaan.com" className="text-sm font-bold text-[#1565D8] hover:underline block mt-1">
                      support@vidhyaan.com
                    </a>
                  </div>
                </div>

                {/* Office block */}
                <div className="flex gap-4 items-start text-left">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0 border border-blue-100/50">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Office</h4>
                    <p className="text-sm font-bold text-slate-800 mt-1 leading-relaxed">
                      Chennai, Tamil Nadu, India
                    </p>
                  </div>
                </div>

                {/* Response time block */}
                <div className="flex gap-4 items-start text-left">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1565D8] flex items-center justify-center shrink-0 border border-blue-100/50">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Response time</h4>
                    <p className="text-sm font-bold text-slate-800 mt-1 leading-relaxed">
                      Within 24 hours, Mon-Sat
                    </p>
                  </div>
                </div>

              </Card>

              {/* Promo Tile: For Schools */}
              <div className="group relative rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-6 text-white overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[170px] text-left">
                <School className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 pointer-events-none transform -rotate-12 select-none" />
                <div className="relative z-10 space-y-1">
                  <h4 className="text-[16px] font-black font-poppins tracking-tight">
                    Want to list your school?
                  </h4>
                  <p className="text-[11px] text-blue-100 font-medium leading-relaxed max-w-[220px]">
                    Claim your profile for free and get discovered by local parents seeking admissions.
                  </p>
                </div>
                <div className="relative z-10 mt-3">
                  <Link href="/register-school">
                    <Button className="bg-white hover:bg-blue-50 text-blue-600 font-bold text-[10px] px-4.5 py-2.5 h-auto rounded-full shadow-sm hover:shadow transition-all flex items-center gap-1 border-0">
                      <span>Claim Free Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform animate-pulse" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Social row */}
              <div className="flex items-center gap-3.5 justify-start pt-2">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white hover:bg-[#1565D8] text-slate-500 hover:text-white flex items-center justify-center transition-all duration-200 border border-slate-200 shadow-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white hover:bg-[#1565D8] text-slate-500 hover:text-white flex items-center justify-center transition-all duration-200 border border-slate-200 shadow-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white hover:bg-[#1565D8] text-slate-500 hover:text-white flex items-center justify-center transition-all duration-200 border border-slate-200 shadow-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white hover:bg-[#1565D8] text-slate-500 hover:text-white flex items-center justify-center transition-all duration-200 border border-slate-200 shadow-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              </div>

            </div>

          </div>
        </section>

        {/* 3. FAQ CROSS-LINK STRIP */}
        <section className="bg-white border-t border-slate-100 py-10 text-center">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="text-xs font-bold text-slate-550">
              Looking for quick answers about listings or registrations?
            </span>
            <Link href="/#faq">
              <Button variant="outline" className="border-blue-200 text-[#1565D8] hover:bg-blue-50 font-black text-xs px-5 py-2.5 rounded-full h-auto shadow-sm flex items-center gap-1.5 cursor-pointer">
                <span>View Homepage FAQs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
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
