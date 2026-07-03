'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import { Check, X, HelpCircle, CheckCircle2 } from 'lucide-react'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'annual'>('monthly')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  // FAQ List (derived from for-schools FAQs)
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

  // Pricing calculations
  const prices = {
    free: { monthly: 0, quarterly: 0, annual: 0 },
    starter: { monthly: 2999, quarterly: 2699, annual: 2249 },
    growth: { monthly: 4999, quarterly: 4499, annual: 3749 }
  }

  const billText = {
    monthly: '/month',
    quarterly: '/month (billed quarterly)',
    annual: '/month (billed annually)'
  }

  const billTotal = {
    monthly: (p: number) => `₹${p.toLocaleString()}/mo`,
    quarterly: (p: number) => `₹${(p * 3).toLocaleString()} billed every 3 mos`,
    annual: (p: number) => `₹${(p * 12).toLocaleString()} billed every year`
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      {/* HEADER */}
      <MarketplaceHeader />

      {/* HERO SECTION */}
      <section className="text-center pt-20 pb-16 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-slate-600 font-medium">
          Start free. Upgrade when ready. No hidden fees or onboarding costs.
        </p>

        {/* BILLING TOGGLE */}
        <div className="mt-10 flex justify-center items-center">
          <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#1565D8] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                billingCycle === 'quarterly'
                  ? 'bg-[#1565D8] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quarterly
              <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-green-150 text-green-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-green-200 bg-green-50 shadow-sm">
                Save 10%
              </span>
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                billingCycle === 'annual'
                  ? 'bg-[#1565D8] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual
              <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-blue-150 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-blue-200 bg-blue-50 shadow-sm">
                Save 25%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="px-4 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        
        {/* FREE PLAN */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Free</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">For basic visibility and listings</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">₹0</span>
              <span className="text-xs text-slate-400 font-bold">forever</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-semibold">No credit card required</p>

            <ul className="mt-8 space-y-4">
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>School listing on Vidhyaan</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Receive up to 10 leads</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Basic profile management</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Email support</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-400">
                <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                <span>Admission management</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-400">
                <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                <span>Student management</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-400">
                <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                <span>Fee management</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <Link href="/register" className="block text-center w-full py-2.5 rounded-lg border border-[#1565D8] text-[#1565D8] hover:bg-blue-50 transition text-sm font-bold">
              Get Started Free
            </Link>
          </div>
        </div>

        {/* STARTER PLAN */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative">
          <div className="absolute top-4 right-4 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
            7-day free trial
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Starter</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">For growing institutions & academies</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">₹{prices.starter[billingCycle].toLocaleString()}</span>
              <span className="text-xs text-slate-400 font-bold">{billText[billingCycle]}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">{billTotal[billingCycle](prices.starter[billingCycle])}</p>

            <ul className="mt-8 space-y-4">
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span className="font-bold text-slate-700">Everything in Free</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Unlimited leads</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Admission management</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Student management</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Basic reports</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Priority support</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-400">
                <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                <span>Fee management</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <Link href="/register?plan=starter" className="block text-center w-full py-2.5 rounded-lg bg-[#1565D8] text-white hover:bg-blue-700 transition text-sm font-bold shadow-sm">
              Start Free Trial
            </Link>
          </div>
        </div>

        {/* GROWTH PLAN */}
        <div className="bg-white rounded-2xl border-2 border-[#1565D8] p-6 flex flex-col justify-between shadow-md relative ring-4 ring-blue-50">
          <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-[#1565D8] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            Most Popular
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mt-2">Growth</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Full-scale CRM automation</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">₹{prices.growth[billingCycle].toLocaleString()}</span>
              <span className="text-xs text-slate-400 font-bold">{billText[billingCycle]}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">{billTotal[billingCycle](prices.growth[billingCycle])}</p>

            <ul className="mt-8 space-y-4">
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span className="font-bold text-slate-700">Everything in Starter</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Fee management</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Campaign management</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Advanced reports</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>WhatsApp notifications</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Custom subdomain</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>API access</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <Link href="/register?plan=growth" className="block text-center w-full py-2.5 rounded-lg bg-[#1565D8] text-white hover:bg-blue-700 transition text-sm font-bold shadow-sm">
              Start Free Trial
            </Link>
          </div>
        </div>

        {/* ENTERPRISE PLAN */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Enterprise</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">For schools with complex multi-branch needs</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900">Custom</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Tailored deployment options</p>

            <ul className="mt-8 space-y-4">
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span className="font-bold text-slate-700">Everything in Growth</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Multiple branches dashboard</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Custom domain support</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>White label option</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Dedicated account manager</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>SLA guarantee</span>
              </li>
              <li className="flex gap-2 text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>On-premises option</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <Link href="/contact" className="block text-center w-full py-2.5 rounded-lg border border-slate-350 text-slate-700 hover:bg-slate-50 transition text-sm font-bold">
              Contact Sales
            </Link>
          </div>
        </div>

      </section>

      {/* FEATURE COMPARISON TABLE */}
      <section className="max-w-7xl mx-auto w-full px-4 mb-24">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-8 text-center">Compare Plan Features</h2>
        
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            {/* Sticky Header */}
            <thead className="sticky top-0 bg-slate-900 text-white z-10 shadow-md">
              <tr>
                <th className="p-4 text-sm font-bold">Core Features</th>
                <th className="p-4 text-sm font-bold text-center">Free</th>
                <th className="p-4 text-sm font-bold text-center">Starter</th>
                <th className="p-4 text-sm font-bold text-center">Growth</th>
                <th className="p-4 text-sm font-bold text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <tr>
                <td className="p-4 font-semibold text-slate-700">Marketplace Listing</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-700">Lead Capture Cap</td>
                <td className="p-4 text-center text-slate-600 font-medium">Up to 10</td>
                <td className="p-4 text-center text-slate-600 font-medium">Unlimited</td>
                <td className="p-4 text-center text-slate-600 font-medium">Unlimited</td>
                <td className="p-4 text-center text-slate-600 font-medium">Unlimited</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-700">Admissions Pipeline Manager</td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-700">Student & Batch Profiles</td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-700">Fee Invoices & Payments</td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-700">Admissions Campaign Engine</td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-700">SMS & WhatsApp Alerts</td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-700">API Access & Webhooks</td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-700">Multi-Branch Dashboard</td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-700">Custom Domain Mapping</td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center text-xs text-slate-600 font-semibold">Subdomain</td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-700">White-Label Branding</td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="bg-slate-100 py-20 px-4">
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx
              return (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <span className="font-bold text-slate-800 md:text-base text-sm">{faq.q}</span>
                    <span className="text-slate-400 shrink-0 font-bold text-lg">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-150 bg-slate-50/50 animate-slide-down">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white pt-16 pb-8 px-4 md:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-slate-800 pb-12 mb-8">
          
          <div className="space-y-4">
            <span className="text-xl font-black tracking-tight text-white">Vidhyaan</span>
            <p className="text-xs font-semibold text-slate-400 leading-relaxed">
              India's premier marketplace for discoverability, trust, and operations. Helping thousands of nursery schools, preschools, and learning academies capture admissions and automate fee invoicing securely.
            </p>
            <div className="flex gap-4 text-slate-400">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition text-xs font-semibold">Twitter</a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition text-xs font-semibold">Facebook</a>
            </div>
          </div>

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

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
          <span>&copy; 2026 TechParrot Innovations LLP. All rights reserved.</span>
        </div>
      </footer>

    </div>
  )
}
