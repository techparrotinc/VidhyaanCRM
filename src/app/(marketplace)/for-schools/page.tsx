'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Check,
  ArrowRight,
  Search,
  CheckCircle2,
  Star,
  Plus,
  Minus,
  ChevronRight,
  TrendingUp,
  Users,
  Shield,
  Layers,
  Wallet,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Sparkles,
  Award
} from 'lucide-react'

// Plan interface
interface Plan {
  name: string
  price: string
  billing: string
  features: string[]
  buttonText: string
  popular?: boolean
  link: string
  trialText?: string
}

export default function ForSchoolsLandingPage() {
  // FAQ state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  // Pricing Plans
  const plans: Plan[] = [
    {
      name: 'Free Plan',
      price: '₹0',
      billing: 'forever',
      features: [
        'School listing on Vidhyaan',
        'Up to 3 gallery photos',
        'Up to 10 student leads/enquiries',
        'Standard email support',
        'Basic facility list & curriculum badges'
      ],
      buttonText: 'Get Started Free',
      link: '/claim-profile'
    },
    {
      name: 'Starter Plan',
      price: '₹2,999',
      billing: 'month',
      features: [
        'Everything in Free Plan',
        'Unlimited student leads/enquiries',
        'Full admissions pipeline tracker',
        'Basic student record management',
        'Priority email & chat support',
        '7-day free trial'
      ],
      buttonText: 'Start Free Trial',
      popular: false,
      trialText: '7-day free trial',
      link: '/claim-profile'
    },
    {
      name: 'Growth Plan',
      price: '₹4,999',
      billing: 'month',
      features: [
        'Everything in Starter Plan',
        'Comprehensive CRM fee management',
        'Marketing campaign management',
        'Advanced performance reports',
        'Automated WhatsApp & Email alerts',
        'Custom subdomain & premium placement',
        '7-day free trial'
      ],
      buttonText: 'Start Free Trial',
      popular: true,
      trialText: 'Most popular',
      link: '/claim-profile'
    }
  ]

  // Testimonials
  const testimonials = [
    {
      quote: "Vidhyaan transformed how we manage admissions. Our counsellors now handle 3x more enquiries with the same team size.",
      author: "Mrs. Kavitha Rajan",
      title: "Principal, Prince Matriculation School",
      city: "Chennai"
    },
    {
      quote: "The parent enquiry system is excellent. We now respond to every enquiry within 2 hours. Our admission rate has improved significantly.",
      author: "Mr. Suresh Nair",
      title: "Admin Head, Baalyaa School",
      city: "Chennai"
    },
    {
      quote: "Setting up our profile was so easy. Within a week we started receiving quality enquiries from parents actively looking for schools.",
      author: "Ms. Priya Venkat",
      title: "Director, Creative Strokes Academy",
      city: "Chennai"
    }
  ]

  // FAQ List
  const faqs = [
    {
      q: "Is the basic listing really free?",
      a: "Yes. Creating and maintaining your school profile on Vidhyaan is completely free forever. You pay only when you want access to the CRM, parent communication, and advanced admissions management features."
    },
    {
      q: "How do I claim my existing profile?",
      a: "If your school is already listed on Vidhyaan, click 'Claim Your Free Profile' and search for your school. We verify ownership (typically using school domain email verification or supporting official documentation) and transfer the profile credentials to you within 24-48 hours."
    },
    {
      q: "What is the 7-day free trial?",
      a: "When you upgrade to any paid plan, you get 7 days of full access to all CRM, invoicing, and messaging capabilities at no charge. You can cancel anytime before the trial ends with no obligation."
    },
    {
      q: "Do parents pay anything?",
      a: "No. Vidhyaan is completely free for parents looking to search, compare, and connect with schools. Only educational institutions and learning centers pay for CRM subscriptions and marketing tools."
    },
    {
      q: "Can I manage multiple branches?",
      a: "Yes. Our Growth and Enterprise plans support managing multiple branches under one unified corporate dashboard with role-based permissions and consolidated performance metrics."
    },
    {
      q: "How are payments processed?",
      a: "We use Razorpay for secure payment transactions. We support all major credit cards, debit cards, UPI, wallets, and internet banking options."
    }
  ]

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      {/* SECTION 1 — STICKY NAVIGATION */}
      <MarketplaceHeader />

      {/* SECTION 2 — HERO */}
      <section className="relative overflow-hidden bg-white pt-12 pb-20 px-4 md:px-8 lg:px-12 border-b border-slate-100">
        {/* Background Decorative Blob */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-50/40 filter blur-3xl opacity-70 pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-slate-50/60 filter blur-2xl opacity-50 pointer-events-none -ml-16 -mb-16" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* Left Column */}
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#1565D8] text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
              <span>🏫 For Schools & Learning Centers</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight tracking-tight font-poppins">
              Grow Your Admissions <br />
              <span className="text-[#1565D8] bg-gradient-to-r from-blue-600 to-indigo-650 bg-clip-text text-transparent">with Vidhyaan</span>
            </h1>

            <p className="text-sm md:text-base text-slate-500 font-semibold leading-relaxed max-w-xl">
              Join 500+ schools already on Vidhyaan. Get a free listing, receive parent enquiries directly, and manage your entire admission process in one place.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {[
                'Free school listing forever',
                'Receive parent enquiries directly',
                'Full admission CRM — 7 day trial',
                'No credit card required'
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/claim-profile" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-xl h-auto shadow-lg shadow-blue-550/20 flex items-center justify-center gap-2 transition cursor-pointer">
                  Claim Your Free Profile
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/register-school" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-[#1565D8] text-[#1565D8] hover:bg-blue-50/30 font-extrabold text-sm px-8 py-3.5 rounded-xl h-auto transition cursor-pointer">
                  Register New School
                </Button>
              </Link>
            </div>

            <div className="pt-2 text-xs font-bold text-slate-450 flex items-center gap-1.5">
              <span>Already have an account?</span>
              <Link href="/login" className="text-[#1565D8] hover:underline flex items-center gap-0.5">
                Login to CRM
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: CRM Preview Card */}
          <div className="relative">
            {/* Background Accent Frame */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-indigo-500/5 rounded-3xl transform rotate-2 scale-[1.02] filter blur-sm pointer-events-none" />
            
            <Card className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative z-10 select-none">
              {/* Mock Browser Header */}
              <div className="bg-slate-50 border-b border-slate-150 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="bg-slate-200/60 text-[10px] text-slate-450 font-bold px-6 py-0.5 rounded-md truncate max-w-xs text-center">
                  school.vidhyaan.com/dashboard
                </div>
                <div className="w-6" /> {/* spacer */}
              </div>

              {/* Mock Dashboard Area */}
              <div className="p-4 bg-slate-50/50 space-y-4">
                
                {/* Stats Bar */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-150 p-3 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Leads this Week</span>
                      <span className="text-lg font-black text-slate-800 font-poppins">7 new leads</span>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-150 p-3 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Active Pipeline</span>
                      <span className="text-lg font-black text-[#1565D8] font-poppins">24 candidates</span>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1565D8] flex items-center justify-center border border-blue-100">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Pipeline Board */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Admissions Pipeline</span>
                    <span className="text-[9px] text-[#1565D8] font-extrabold hover:underline cursor-pointer">Manage Custom Stages &rarr;</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    
                    {/* Column 1: New Enquiries */}
                    <div className="bg-slate-100/80 rounded-xl p-2 space-y-2 border border-slate-200/50">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-black text-slate-600 uppercase">Enquiry (3)</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      </div>
                      
                      {/* Lead Card 1 */}
                      <div className="bg-white p-2 rounded-lg border border-slate-150 shadow-sm space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] font-bold text-slate-800 truncate">Aarav Sharma</span>
                          <span className="bg-red-50 text-red-600 border border-red-100 text-[8px] font-bold px-1 rounded shrink-0">HIGH</span>
                        </div>
                        <div className="text-[8px] text-slate-450 font-bold">Grade 2 · Chennai</div>
                        <div className="text-[7px] text-slate-400">2h ago · Marketplace</div>
                      </div>

                      {/* Lead Card 2 */}
                      <div className="bg-white p-2 rounded-lg border border-slate-150 shadow-sm space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] font-bold text-slate-800 truncate">Meera Patel</span>
                        </div>
                        <div className="text-[8px] text-slate-450 font-bold">Grade 5 · Bangalore</div>
                        <div className="text-[7px] text-slate-400">5h ago · Marketplace</div>
                      </div>
                    </div>

                    {/* Column 2: Scheduled Visit */}
                    <div className="bg-slate-100/80 rounded-xl p-2 space-y-2 border border-slate-200/50">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-black text-slate-600 uppercase">Site Visit (1)</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      </div>

                      {/* Lead Card 3 */}
                      <div className="bg-white p-2 rounded-lg border border-[#1565D8] shadow-md border-l-[3px] space-y-1 relative">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] font-bold text-slate-800 truncate">Rohan Das</span>
                          <span className="bg-emerald-50 text-emerald-600 text-[8px] font-bold px-1 rounded shrink-0">CONFIRMED</span>
                        </div>
                        <div className="text-[8px] text-slate-450 font-bold">Grade 1 · Chennai</div>
                        <div className="text-[7px] text-amber-600 font-extrabold mt-0.5 flex items-center gap-0.5">
                          <span className="inline-block w-1 h-1 rounded-full bg-amber-500 animate-ping" />
                          Today 4:00 PM
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Application */}
                    <div className="bg-slate-100/80 rounded-xl p-2 space-y-2 border border-slate-200/50">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-black text-slate-600 uppercase">Applied (2)</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      </div>

                      {/* Lead Card 4 */}
                      <div className="bg-white p-2 rounded-lg border border-slate-150 shadow-sm opacity-80 space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] font-bold text-slate-850 truncate">Ananya Rao</span>
                        </div>
                        <div className="text-[8px] text-slate-450 font-bold">Grade 8 · Hyderabad</div>
                        <div className="text-[7px] text-slate-400">Yesterday · CRM Import</div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </Card>
          </div>

        </div>
      </section>

      {/* SECTION 3 — STATS BAR */}
      <section className="bg-slate-55 border-y border-slate-100 py-10 px-4 md:px-8 select-none">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '500+', label: 'Schools Listed' },
            { value: '10,000+', label: 'Parent Enquiries' },
            { value: '25+', label: 'Cities covered' },
            { value: '4.8★', label: 'Average User Rating' }
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-[#1565D8] font-poppins">{stat.value}</div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section className="bg-white py-20 px-4 md:px-8 lg:px-12 border-b border-slate-100">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
              Get Started in Minutes
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Claim or list your school in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center space-y-4 text-center group relative z-10">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 text-[#1565D8] flex items-center justify-center font-extrabold text-lg shadow-sm transition group-hover:scale-105">
                🔍
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">Step 1: Find Your School</h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed max-w-xs mx-auto">
                  Search if your school is already listed on Vidhyaan's parent portal.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center space-y-4 text-center group relative z-10">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 text-[#1565D8] flex items-center justify-center font-extrabold text-lg shadow-sm transition group-hover:scale-105">
                ✓
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">Step 2: Claim or Register</h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed max-w-xs mx-auto">
                  Claim existing profile or register your school in under 5 minutes.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center space-y-4 text-center group relative z-10">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 text-[#1565D8] flex items-center justify-center font-extrabold text-lg shadow-sm transition group-hover:scale-105">
                📝
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">Step 3: Complete Profile</h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed max-w-xs mx-auto">
                  Add photos, fees, curriculum, campus facilities and admission guidelines.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center space-y-4 text-center group relative z-10">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 text-[#1565D8] flex items-center justify-center font-extrabold text-lg shadow-sm transition group-hover:scale-105">
                🚀
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">Step 4: Receive Enquiries</h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed max-w-xs mx-auto">
                  Go live and start connecting with parents immediately.
                </p>
              </div>
            </div>

            {/* Desktop Connector Arrows */}
            <div className="hidden md:flex absolute inset-x-0 top-7 justify-between items-center pointer-events-none z-0 px-16">
              <ChevronRight className="w-5 h-5 text-slate-300 ml-auto" />
              <ChevronRight className="w-5 h-5 text-slate-300 ml-auto" />
              <ChevronRight className="w-5 h-5 text-slate-300 ml-auto" />
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5 — FEATURES SHOWCASE */}
      <section className="bg-white py-20 px-4 md:px-8 lg:px-12 border-b border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
              Everything You Need to Manage Admissions
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              A comprehensive toolset tailored for modern administrators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <Card className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#1565D8] hover:shadow-lg transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] flex items-center justify-center mb-4 border border-blue-100 group-hover:scale-105 transition-transform duration-300">
                📋
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Lead Management</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Capture and track every parent enquiry. Record notes, set reminders, and ensure you never miss a potential admission.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#1565D8] hover:shadow-lg transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] flex items-center justify-center mb-4 border border-blue-100 group-hover:scale-105 transition-transform duration-300">
                🔄
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Admission Pipeline</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Move applicants through customized stages from initial enquiry, site visits, and application reviews to direct enrollment.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#1565D8] hover:shadow-lg transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] flex items-center justify-center mb-4 border border-blue-100 group-hover:scale-105 transition-transform duration-300">
                👥
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Student Management</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Maintain complete, centralized student records containing primary guardian details, sibling linkages, and academic years.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#1565D8] hover:shadow-lg transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] flex items-center justify-center mb-4 border border-blue-100 group-hover:scale-105 transition-transform duration-300">
                💰
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Fee Management</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Send professional digital invoices, track partial payments, set automated discount policies, and manage fee collections.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#1565D8] hover:shadow-lg transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] flex items-center justify-center mb-4 border border-blue-100 group-hover:scale-105 transition-transform duration-300">
                📊
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Reports & Analytics</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Understand your conversion funnel with detailed analytics reports. Track sources of leads and counsellor conversion ratios.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-[#1565D8] hover:shadow-lg transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8] flex items-center justify-center mb-4 border border-blue-100 group-hover:scale-105 transition-transform duration-300">
                📱
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">Parent Communication</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Keep parents informed automatically at every single step with integrated, professional WhatsApp notifications and emails.
              </p>
            </Card>

          </div>
        </div>
      </section>

      {/* SECTION 6 — PRICING TEASER */}
      <section className="bg-[#EFF6FF] py-20 px-4 md:px-8 lg:px-12 border-b border-slate-100 select-none">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xs text-[#1565D8] font-bold uppercase tracking-wider">
              Start free. Upgrade when you're ready to grow.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {plans.map((plan, idx) => (
              <Card 
                key={idx}
                className={`bg-white rounded-3xl p-8 flex flex-col justify-between relative shadow-md transition-transform duration-300 hover:-translate-y-1 ${
                  plan.popular 
                    ? 'border-2 border-[#1565D8] shadow-xl shadow-blue-500/5' 
                    : 'border border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-[#1565D8] text-white text-[9px] font-black tracking-widest px-4 py-1 rounded-full uppercase shadow">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-base font-black text-slate-800 uppercase tracking-wide">{plan.name}</h4>
                    <div className="flex items-baseline gap-1 pt-1">
                      <span className="text-3xl md:text-4xl font-black text-slate-900 font-poppins">{plan.price}</span>
                      <span className="text-xs text-slate-450 font-bold">/ {plan.billing}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6 space-y-3.5">
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs font-semibold text-slate-650">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link href={plan.link}>
                    <Button 
                      className={`w-full font-bold text-xs py-3 rounded-xl h-auto transition shadow-sm cursor-pointer ${
                        plan.popular
                          ? 'bg-[#1565D8] hover:bg-blue-700 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                  {plan.trialText && !plan.popular && (
                    <span className="text-[10px] text-slate-400 font-bold text-center block mt-2 uppercase tracking-wide">
                      {plan.trialText}
                    </span>
                  )}
                  {plan.popular && (
                    <span className="text-[10px] text-[#1565D8] font-black text-center block mt-2 uppercase tracking-wide">
                      7-day free trial
                    </span>
                  )}
                </div>

              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
            All paid plans include a 7-day free trial. No credit card required.
          </p>

        </div>
      </section>

      {/* SECTION 7 — TESTIMONIALS */}
      <section className="bg-white py-20 px-4 md:px-8 lg:px-12 border-b border-slate-100 select-none">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
              Trusted by Schools Across India
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              See what admissions leaders are saying about Vidhyaan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <Card key={idx} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current shrink-0" />
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 font-semibold italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1565D8]/10 text-[#1565D8] font-black text-xs flex items-center justify-center uppercase shrink-0 border border-blue-100/50">
                    {t.author.split(' ').pop()?.[0] || 'S'}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">{t.author}</h5>
                    <p className="text-[10px] text-slate-450 font-bold leading-tight">
                      {t.title}, <span className="text-[#1565D8]">{t.city}</span>
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8 — FAQ */}
      <section className="bg-white py-20 px-4 md:px-8 lg:px-12 border-b border-slate-100">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Have questions? We have answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx
              return (
                <div 
                  key={idx}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-colors duration-200 bg-white"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-xs md:text-sm text-slate-850 hover:bg-slate-50 transition cursor-pointer select-none"
                  >
                    <span>{faq.q}</span>
                    <div className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 bg-white">
                      {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                  
                  {/* Expandable answer panel */}
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-40 border-t border-slate-100' : 'max-h-0'
                    }`}
                  >
                    <div className="p-5 text-xs text-slate-500 font-semibold leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* SECTION 9 — FINAL CTA BANNER */}
      <section className="bg-[#1565D8] text-white py-16 px-6 md:px-12 text-center select-none relative overflow-hidden">
        {/* Glowing Circle Ornaments */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full pointer-events-none z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/10 rounded-full pointer-events-none z-0 animate-pulse" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-black font-poppins tracking-tight">
            Ready to Get Started?
          </h2>
          <p className="text-xs md:text-sm text-blue-105 font-bold max-w-md mx-auto uppercase tracking-wide leading-relaxed">
            Join 500+ schools already growing and managing admissions with Vidhyaan.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/claim-profile">
              <Button className="bg-white hover:bg-slate-50 text-[#1565D8] font-extrabold text-xs px-8 py-3.5 rounded-xl h-auto shadow-lg flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto">
                Claim Free Profile
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-white text-white hover:bg-white/10 font-extrabold text-xs px-8 py-3.5 rounded-xl h-auto transition cursor-pointer w-full sm:w-auto">
                Talk to Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 10 — FOOTER */}
      <footer className="bg-slate-900 text-white mt-0 py-12 px-6 md:px-8 select-none">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-slate-700 pb-8">
          
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/vidhyaan-logo-white.svg" alt="Vidhyaan" className="h-8 w-auto" />
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
              <Link href="/register" className="hover:text-white transition">List Your School</Link>
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
              <Link href="/products/role-based-access" className="hover:text-white transition">Role-Based Access</Link>
              <Link href="/products/institution-types" className="hover:text-white transition">Institution Types</Link>
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
