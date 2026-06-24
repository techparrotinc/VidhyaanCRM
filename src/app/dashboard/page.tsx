"use client"

import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import {
  Globe,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Users,
  CreditCard,
  Shield,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Menu,
  Crown,
  X,
  Eye,
  IndianRupee,
  BarChart2,
  GraduationCap,
  ArrowUpRight,
  CheckCircle2,
  TriangleAlert,
  Plus,
  UserPlus,
  UserCheck,
  Receipt,
  Megaphone,
  MessageSquare,
  GitBranch,
  Calendar,
  CalendarDays,
  CalendarOff,
  LayoutList,
  Info,
  XCircle
} from 'lucide-react'

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// ===================================================================
// INSTITUTION TYPE CONTEXT VARIABLE & CONSTANTS
// ===================================================================
const institutionConfig = {
  type: 'school', // options: 'school' | 'institute' | 'learning_center'
  name: 'Prince Matriculation School',
  pipelineTitle: {
    school: 'Admission Pipeline',
    institute: 'Enrolment Pipeline',
    learning_center: 'Enquiry Pipeline',
  },
  moduleTitle: {
    school: 'Admission Management',
    institute: 'Enrolment Management',
    learning_center: 'Enquiry Management',
  },
  pipelineStages: {
    school: [
      'Enquiry', 'Contacted', 'Application',
      'Docs', 'Interview', 'Payment', 'Enrolled',
      'Rejected'
    ],
    institute: [
      'Enquiry', 'Contacted', 'Enrolled', 'Rejected'
    ],
    learning_center: [
      'Enquiry', 'Trial Class', 'Enrolled', 'Rejected'
    ],
  },
}

const profileCompletion: number = 100
// Change to 100 to see completed state
// Change to 80 to see almost-complete state

const leadsUsed: number = 18
const leadsMax: number = 25
const unassignedLeads: number = 2

const feeData = {
  collected: 0,
  collectedLastMonth: 45000,
  overdue: 12221,
  overdueAccumulated: true,
  overdueOldestDays: 45,
  upcoming: 3000,
  upcomingInvoiceCount: 3,
  ytdCollected: 245000,
  academicYear: 'AY 2026-27',
  lastPayment: {
    studentName: 'Karthi S',
    amount: 2110,
    date: '15 May 2026',
  },
  students: {
    total: 23,
    paidOnTime: 12,
    overdue: 3,
    upcomingDues: 8,
  },
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)

import Link from 'next/link'

export default function DashboardPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [trialBannerVisible, setTrialBannerVisible] = useState(true)
  const [welcomeBannerVisible, setWelcomeBannerVisible] = useState(false)
  const [profileCompletePct, setProfileCompletePct] = useState(0)
  const [schoolSlug, setSchoolSlug] = useState('')
  const [isLC, setIsLC] = useState(false)
  const [dashData, setDashData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const bannerDismissed = localStorage.getItem('vidhyaan_welcome_banner_dismissed')
    const sessionSeen = sessionStorage.getItem('vidhyaan_welcome_banner_seen')

    if (!bannerDismissed && !sessionSeen) {
      fetch('/api/v1/onboarding/status')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.isComplete) {
            setWelcomeBannerVisible(true)
            setProfileCompletePct(data.profileCompletePct || 0)
            setSchoolSlug(data.schoolSlug || '')
            setIsLC(data.school?.institutionType === 'LEARNING_CENTER' || data.school?.institutionType === 'COACHING_CENTER')
            sessionStorage.setItem('vidhyaan_welcome_banner_seen', 'true')
          }
        })
        .catch((err) => console.error('Error fetching onboarding status in dashboard:', err))
    }
  }, [])

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/v1/dashboard/summary')
        if (!res.ok) throw new Error('Failed to fetch dashboard data')
        const json = await res.json()
        setDashData(json.data)
      } catch (err) {
        setError('Failed to load dashboard')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  // Toast notifications state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    show: boolean
  }>({ message: '', type: 'success', show: false })

  // Helper functions
  const getCurrentMonth = () => {
    return new Date().toLocaleString('en-IN', {
      month: 'long',
      year: 'numeric',
    })
  }

  const getShortMonth = () => {
    return new Date().toLocaleString('en-IN', {
      month: 'short',
    })
  }

  const showToast = (
    message: string, 
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    setToast({ message, type, show: true })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  const moduleTitle = institutionConfig.moduleTitle[institutionConfig.type as keyof typeof institutionConfig.moduleTitle]
  const pipelineTitle = institutionConfig.pipelineTitle[institutionConfig.type as keyof typeof institutionConfig.pipelineTitle]

  const getStageColorClass = (colorName: string | null | undefined) => {
    switch (colorName) {
      case 'blue': return 'bg-blue-500'
      case 'amber': return 'bg-amber-500'
      case 'orange': return 'bg-orange-500'
      case 'green': return 'bg-green-500'
      case 'red': return 'bg-red-500'
      case 'violet': return 'bg-violet-500'
      case 'indigo': return 'bg-indigo-500'
      case 'cyan': return 'bg-cyan-500'
      default: return 'bg-slate-500'
    }
  }

  const getStageCount = (stageName: string) => {
    const stageData = (dashData?.admissions?.byStage ?? []).find(
      (s: any) => s.stage?.label?.toLowerCase() === stageName.toLowerCase()
    )
    return stageData?.count ?? 0
  }

  const totalAdmissions = dashData?.admissions?.total ?? 0
  const enrolledAdmissions = getStageCount('Admitted')
  const rejectedAdmissions = getStageCount('Rejected')
  const inProcessAdmissions = Math.max(0, totalAdmissions - enrolledAdmissions - rejectedAdmissions)
  const conversionRate = dashData?.admissions?.conversionRate ?? 0
  const dropOffRate = totalAdmissions > 0 ? Math.round((rejectedAdmissions / totalAdmissions) * 100) : 0

  const capPct = dashData?.leads?.cap
    ? Math.min(
        100,
        Math.round(
          (dashData.leads.capUsed /
           dashData.leads.cap) * 100
        )
      )
    : 0
  const collectedTrend = (dashData?.fees?.collectedThisMonth ?? 0) < 45000 ? 'down' : 'up'

  // KPI configurations
  const kpis = [
    { title: "TOTAL ENQUIRIES", value: String(dashData?.leads?.total ?? 0), icon: Users, trend: `+${dashData?.leads?.new ?? 0} this month`, isPremium: false, link: "/enquiries" },
    { title: "PROFILE VIEWS", value: "142", icon: Eye, trend: "+23 this week", isPremium: false, link: "/site-manager/analytics" },
    { title: "LEADS THIS MONTH", value: String(dashData?.leads?.new ?? 0), icon: TrendingUp, trend: "+3 today", isPremium: true, link: "/leads" },
    { title: "FEE COLLECTION", value: formatINR(dashData?.fees?.collectedThisMonth ?? 0), icon: IndianRupee, trend: "+8% vs last month", isPremium: true, link: "/fee-management" },
    { title: "CONVERSION RATE", value: `${dashData?.admissions?.conversionRate ?? 0}%`, icon: BarChart2, trend: "+5% this month", isPremium: true, link: "/reports" },
    {
      title: institutionConfig.type === 'institute' ? "ACTIVE ENROLLMENTS" : "ACTIVE STUDENTS",
      value: String(dashData?.admissions?.admitted ?? 0),
      icon: GraduationCap,
      trend: "No change",
      isPremium: true,
      link: "/students"
    }
  ]

  // Premium features config
  const premiumFeatures = [
    { title: "Advanced Reports", desc: "In-depth analytics on admissions, fees, and leads", icon: BarChart2 },
    { title: "Campaign Management", desc: "Send SMS, Email & WhatsApp campaigns to leads and parents", icon: Megaphone },
    { title: "Student Lifecycle", desc: "Full student history from enquiry to alumni", icon: UserCheck },
    { title: "Payment Gateway", desc: "Collect fees online via UPI, cards & net banking", icon: CreditCard },
    { title: "WhatsApp, Email & SMS", desc: "Automated communication templates for leads and admissions", icon: MessageSquare },
    { title: "Forms & Requests", desc: "Custom admission and enquiry forms with e-signatures", icon: ClipboardList },
    {
      title: institutionConfig.type === 'school' ? "Admission Workflow" : (institutionConfig.type === 'institute' ? "Enrolment Workflow" : "Enquiry Workflow"),
      desc: "Configurable multi-stage pipeline for admissions",
      icon: GitBranch,
      isWorkflow: true
    }
  ]

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex relative font-sans antialiased select-none">
      {/* 1. FIXED LEFT SIDEBAR (Desktop w-64, Tablet slim w-16) */}
      <aside className="hidden md:flex w-16 lg:w-64 fixed inset-y-0 left-0 border-r border-slate-200 bg-white z-30 shadow-sm flex-col">
        <Sidebar />
      </aside>

      {/* MOBILE TOP NAV BAR */}
      <header className="flex md:hidden h-14 bg-white border-b border-slate-200 px-2 min-[375px]:px-4 items-center justify-between fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-1.5 min-[375px]:gap-2 min-w-0 flex-shrink">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-[#1565D8] shrink-0">
            <Shield className="w-5 h-5 fill-[#1565D8]" strokeWidth={1.5} />
          </div>
          <span className="text-xs min-[375px]:text-sm font-bold text-slate-800 tracking-tight truncate max-w-[60px] min-[375px]:max-w-[100px] min-[400px]:max-w-[120px] shrink-0">
            {institutionConfig.name}
          </span>
        </div>
        <span className="text-xs min-[375px]:text-sm font-bold text-slate-800 shrink-0">Dashboard</span>
        <div className="flex items-center gap-1.5 min-[375px]:gap-3 shrink-0">
          {/* Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>
          {/* Notifications */}
          <button className="p-1 rounded-lg text-slate-500 hover:text-slate-900 relative">
            <Bell className="w-5 h-5" strokeWidth={1.5} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* MOBILE SIDEBAR DRAWERS */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
          
          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl transform transition-transform duration-300 translate-x-0 md:hidden flex flex-col">
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Sidebar isMobile onCloseMobileMenu={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-16 lg:pl-64 pt-14 md:pt-0 flex flex-col min-w-0">
        {/* DESKTOP/TABLET HEADER BAR */}
        <header className="hidden md:flex h-16 border-b border-slate-200 bg-white items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm lg:text-lg font-bold text-slate-800 tracking-tight leading-tight truncate">
                Welcome to {institutionConfig.name}!
              </h2>
              <p className="hidden xl:block text-xs text-slate-400 truncate leading-relaxed">
                {institutionConfig.type === 'school' && "Here's what's happening at your school today."}
                {institutionConfig.type === 'institute' && "Here's what's happening at your institute today."}
                {institutionConfig.type === 'learning_center' && "Here's what's happening today."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">

            {/* Global Search Bar */}
            <div className="relative hidden lg:flex items-center gap-2 bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 w-48 lg:w-64">
              <Search className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-500 w-full"
                readOnly
              />
              <span className="bg-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-mono select-none">
                ⌘K
              </span>
            </div>

            {/* Notification Bell */}
            <button className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 relative shrink-0">
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 text-left">
              <div className="w-9 h-9 rounded-full bg-[#1565D8] text-white text-sm font-bold flex items-center justify-center shrink-0">
                UA
              </div>
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-700 leading-tight truncate">User Admin</span>
                <span className="text-xs text-slate-400 leading-none truncate">School Admin</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
            </div>
          </div>
        </header>

        {/* WELCOME BANNER */}
        {welcomeBannerVisible && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3.5 md:px-8 flex flex-col md:flex-row gap-3 md:gap-4 items-center w-full">
            <div className="flex items-start md:items-center gap-2.5 w-full md:w-auto">
              <span className="text-xl">🎉</span>
              <div className="space-y-0.5">
                <p className="text-xs md:text-sm text-emerald-800 font-bold leading-none">
                  Welcome to Vidhyaan CRM!
                </p>
                <p className="text-[11px] md:text-xs text-emerald-600 font-medium">
                  Your school profile is live. Your 7-day free trial has started.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto md:ml-auto shrink-0 mt-2 md:mt-0">
              {profileCompletePct < 80 && (
                <Link
                  href="/onboarding/step/1"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition duration-200 text-center"
                >
                  Complete Your Profile ({profileCompletePct}%)
                </Link>
              )}
              {schoolSlug && (
                <a
                  href={isLC ? `/learning-centers/${schoolSlug}` : `/schools/${schoolSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#1565D8] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  View My Listing
                </a>
              )}
              <button
                onClick={() => {
                  setWelcomeBannerVisible(false)
                  localStorage.setItem('vidhyaan_welcome_banner_dismissed', 'true')
                }}
                className="p-1 rounded text-emerald-500 hover:text-emerald-700 ml-auto md:ml-0 transition shrink-0 cursor-pointer"
                title="Dismiss Welcome Banner"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* TRIAL BANNER */}
        {trialBannerVisible && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 md:px-8 flex flex-col md:flex-row gap-2 md:gap-4 animate-fade-in w-full">
            {/* Mobile Row 1 / Desktop Left */}
            <div className="flex items-start md:items-center gap-2 w-full md:w-auto">
              <Crown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 md:mt-0" strokeWidth={1.5} />
              <p className="text-xs md:text-sm text-amber-800 font-medium leading-relaxed">
                🎉 7-Day Free Trial of Vidhyaan Premium is active!{" "}
                <span className="text-[#92400E] font-bold">Trial ends in 7 days.</span>
              </p>
              <button
                onClick={() => setTrialBannerVisible(false)}
                className="p-1 rounded text-amber-500 hover:text-amber-700 ml-auto md:hidden transition shrink-0"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Mobile Row 2 / Desktop Right */}
            <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto md:ml-auto shrink-0">
              <span className="text-xs md:text-sm font-semibold text-[#1565D8] underline cursor-pointer hover:text-blue-700 whitespace-nowrap">
                See features
              </span>
              <Button className="bg-[#1565D8] text-white text-xs md:text-sm font-semibold px-4 md:px-5 py-2 h-8 md:h-9 flex-1 md:flex-initial rounded-lg hover:bg-blue-700 transition duration-200 whitespace-nowrap">
                Activate Premium
              </Button>
              <button
                onClick={() => setTrialBannerVisible(false)}
                className="p-1 rounded text-amber-500 hover:text-amber-700 hidden md:block transition"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* MAIN CONTAINER CONTENT */}
        <main className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-5 lg:space-y-6 max-w-7xl mx-auto w-full">
          {error ? (
            <div className="text-center py-20">
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-[#1565D8] underline text-sm"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
          {/* WELCOME / PROFILE COMPLETION BLOCK — two-state */}

          {/* STATE 1: Onboarding (profileCompletion < 100) */}
          {profileCompletion < 100 && (
            <Card className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 border-l-4 border-l-[#1565D8]">
              <div className="flex flex-col md:flex-row items-stretch md:items-start justify-between gap-4 md:gap-8">
                {/* LEFT: Heading + Subtext */}
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Welcome to Vidhyaan, {institutionConfig.name}!
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-500 leading-relaxed max-w-lg">
                    {"Here's your Premium dashboard. Everything is live during your 7-day trial. Complete your profile to get discovered by parents."}
                  </p>
                </div>

                {/* RIGHT: Progress bar */}
                <div className="w-full md:min-w-[300px] md:w-auto shrink-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-600">Profile Completion</span>
                    <span className="text-sm font-bold text-[#1565D8]">{profileCompletion}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-[#1565D8] rounded-full h-2 transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Listing is {profileCompletion}% complete.
                  </p>
                  <span className="text-sm font-semibold text-[#1565D8] mt-2 block hover:underline cursor-pointer">
                    Complete profile →
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* STATE 2: Operational (profileCompletion === 100) — slim green completion bar */}
          {profileCompletion === 100 && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 sm:h-[52px]">
              {/* LEFT: icon + school name + divider + badge */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <CheckCircle2
                  className="text-green-600 flex-shrink-0"
                  size={18}
                  strokeWidth={2}
                />
                <span className="text-sm font-semibold text-slate-700">
                  {institutionConfig.name}
                </span>
                <span className="text-slate-300 mx-1 hidden sm:inline">·</span>
                <span className="bg-green-100 text-green-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  ✓ Profile 100% Complete
                </span>
              </div>

              {/* RIGHT: single Manage Listing button */}
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-xs font-semibold border border-[#1565D8] bg-white text-[#1565D8] px-4 py-1.5 rounded-full hover:bg-blue-50 transition cursor-pointer">
                  <LayoutList size={12} strokeWidth={2} />
                  Manage Listing
                </button>
              </div>
            </div>
          )}

          {/* KPI CARDS ROW */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-6 xl:gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))
            ) : (
              kpis.map((kpi) => {
                const Icon = kpi.icon
                return (
                  <div
                    key={kpi.title}
                    className="min-w-0 w-full min-h-[160px] bg-white rounded-xl border border-slate-200 shadow-sm p-4 lg:p-5 xl:p-6 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all duration-200 relative group flex flex-col justify-between"
                  >
                    {/* Icon top-left */}
                    <div className="text-slate-400 group-hover:text-[#1565D8] transition-colors">
                      <Icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
                    </div>

                    {/* Badge + Arrow co-located top-right */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {kpi.isPremium ? (
                        <div className="bg-amber-100 text-amber-700 text-[9px] md:text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" strokeWidth={1.5} />
                          <span>Premium</span>
                        </div>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 text-[9px] md:text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Free
                        </span>
                      )}
                      <ArrowUpRight
                        size={14}
                        className="text-slate-300 group-hover:text-[#1565D8] transition-colors"
                        strokeWidth={1.5}
                      />
                    </div>

                    <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-slate-400 mt-4 block">
                      {kpi.title}
                    </span>

                    <h3
                      className="text-xl md:text-2xl xl:text-[32px] font-bold text-slate-800 tracking-tight leading-tight mt-1"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {kpi.value}
                    </h3>

                    <p className={`text-xs md:text-sm font-medium mt-2 ${kpi.trend.includes('No') ? 'text-slate-400' : 'text-green-600'}`}>
                      {kpi.trend}
                    </p>
                  </div>
                )
              })
            )}
          </section>

          {/* COMPACT PIPELINE ROW */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* LEFT Column: Enquiry & Enrolment Pipeline */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 lg:p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <h3 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">
                      {pipelineTitle}
                    </h3>
                    {institutionConfig.type === 'school' && (
                      <span className="text-xs text-slate-400 mt-0.5">AY 2026-27</span>
                    )}
                  </div>
                  <div className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-0.5 shrink-0">
                    <Crown className="w-3 h-3 fill-amber-500 text-amber-500" strokeWidth={1.5} />
                    <span>Premium</span>
                  </div>
                </div>

                {/* Grid boxes */}
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 mt-5">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Enquiries</span>
                    <h4 className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{totalAdmissions}</h4>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 block">In Process</span>
                    <h4 className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{inProcessAdmissions}</h4>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 block">Enrolled</span>
                    <h4 className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{enrolledAdmissions}</h4>
                    <span className="text-[10px] text-green-600 font-semibold mt-0.5 block">{conversionRate}%</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500 block">Rejected</span>
                    <h4 className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{rejectedAdmissions}</h4>
                    <span className="text-[10px] text-red-500 font-semibold mt-0.5 block">{dropOffRate}%</span>
                  </div>
                </div>

                <p className="text-[10px] md:text-xs text-slate-400 text-center mt-4">
                  Conversion Rate: {conversionRate}% · Drop-off: {dropOffRate}% · Active in Pipeline: {inProcessAdmissions}
                </p>

                {/* SECTION A — PIPELINE STAGES BAR */}
                <div className="mt-4 px-1">
                  <p className="text-[9px] md:text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                    Pipeline Stages
                  </p>
                  <div className="flex items-end gap-3 w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                    {(dashData?.admissions?.byStage ?? []).map((item: any, idx: number, arr: any[]) => {
                      const stageName = item.stage?.label ?? 'Unknown'
                      const count = item.count ?? 0
                      const colorClass = getStageColorClass(item.stage?.color)
                      const maxCount = Math.max(...arr.map((a: any) => a.count ?? 1)) || 1
                      return (
                        <React.Fragment key={item.stageId ?? idx}>
                          <div className="flex flex-col items-center min-w-[80px] md:min-w-[60px] md:flex-1 shrink-0">
                            <span className="text-[11px] font-bold text-slate-700 mb-1">
                              {count}
                            </span>
                            <div
                              className={`w-full rounded-t-sm ${colorClass} opacity-80`}
                              style={{ height: `${(count / maxCount) * 48}px`, minHeight: '6px' }}
                            />
                            <span className="text-[9px] font-medium text-slate-400 mt-1.5 text-center leading-tight w-full truncate px-0.5">
                              {stageName}
                            </span>
                          </div>
                          {idx < arr.length - 1 && (
                            <ChevronRight size={10} className="text-slate-200 mb-4 shrink-0" strokeWidth={2} />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>

                {/* SECTION B — MINI COMPARISON ROW */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-[9px] md:text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
                    This Month vs Last Month
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Chip 1 — Enquiries */}
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Enquiries</span>
                      <div className="ml-auto text-right">
                        <div className="text-sm font-bold text-slate-800">26</div>
                        <div className="flex items-center justify-end mt-0.5">
                          <TrendingUp size={10} className="text-green-600 mr-1" />
                          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                            +44%
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Chip 2 — Converted */}
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Converted</span>
                      <div className="ml-auto text-right">
                        <div className="text-sm font-bold text-slate-800">17</div>
                        <div className="flex items-center justify-end mt-0.5">
                          <TrendingUp size={10} className="text-green-600 mr-1" />
                          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                            +54%
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Chip 3 — Avg. Convert Time */}
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Avg. Convert</span>
                      <div className="ml-auto text-right">
                        <div className="text-sm font-bold text-slate-800">12 days</div>
                        <div className="flex items-center justify-end mt-0.5">
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                            ↓ 3 days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between items-center">
                  <span className="text-xs md:text-sm font-semibold text-[#1565D8] cursor-pointer hover:underline min-h-[44px] sm:min-h-0 flex items-center">
                    View {moduleTitle} →
                  </span>

                  {institutionConfig.type === 'school' && (
                    <span className="text-[10px] md:text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-full">
                      Interview pending: 2
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT Column: Lead Overview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 lg:p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">
                    Lead Overview
                  </h3>
                  <span className="bg-slate-100 text-slate-500 text-[10px] md:text-xs font-semibold px-3 py-1 rounded-full">
                    Free
                  </span>
                </div>

                {/* Temporal stats */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center bg-slate-50 rounded-lg p-2 md:p-3">
                    <h4 className="text-lg md:text-2xl font-bold text-slate-800">3</h4>
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-400 mt-1 block">Today</span>
                  </div>
                  <div className="text-center bg-slate-50 rounded-lg p-2 md:p-3">
                    <h4 className="text-lg md:text-2xl font-bold text-slate-800">8</h4>
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-400 mt-1 block">This Week</span>
                  </div>
                  <div className="text-center bg-slate-50 rounded-lg p-2 md:p-3">
                    <h4 className="text-lg md:text-2xl font-bold text-slate-800">14</h4>
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-400 mt-1 block">This Month</span>
                  </div>
                </div>

                {/* Lead limit cap */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-500">Free Lead Limit</span>
                    <span className="text-xs font-bold text-slate-700">{(dashData?.leads?.capUsed ?? 0)} / {(dashData?.leads?.cap ?? 10)}</span>
                  </div>
                  <Progress value={capPct} className="h-2 w-full bg-slate-100" indicatorClassName="bg-amber-400" />

                  {(dashData?.leads?.capUsed ?? 0) >= ((dashData?.leads?.cap ?? 10) - 5) && (dashData?.leads?.capUsed ?? 0) < (dashData?.leads?.cap ?? 10) && (
                    <p className="text-xs text-amber-700 font-medium mt-1.5 leading-relaxed">
                      ⚠ {(dashData?.leads?.capUsed ?? 0)} of {(dashData?.leads?.cap ?? 10)} free leads used. Upgrade for unlimited leads.
                    </p>
                  )}
                  {(dashData?.leads?.capUsed ?? 0) >= (dashData?.leads?.cap ?? 10) && (
                    <div className="flex justify-between items-center mt-1.5">
                      <p className="text-xs text-red-600 font-semibold">
                        🔒 Free lead limit reached. New leads are paused.
                      </p>
                      <span className="text-xs text-[#1565D8] font-bold underline cursor-pointer">
                        Upgrade to Continue →
                      </span>
                    </div>
                  )}
                </div>

                {/* Status breakdown list */}
                <div className="mt-4 space-y-2.5">
                  {(dashData?.leads?.byStatus ?? []).map((row: any) => {
                    const total = dashData?.leads?.total || 1
                    const pct = Math.round((row.count / total) * 100)
                    let color = "bg-slate-500"
                    if (row.status === 'NEW') color = "bg-blue-500"
                    else if (row.status === 'CONTACTED') color = "bg-amber-400"
                    else if (row.status === 'CONVERTED') color = "bg-green-500"
                    else if (row.status === 'NOT_INTERESTED') color = "bg-red-400"

                    let label = row.status
                    if (row.status === 'FOLLOW_UP_PENDING') label = 'Follow Up'
                    else if (row.status === 'NOT_INTERESTED') label = 'Not Interested'
                    else if (row.status === 'NEW') label = 'New'
                    else if (row.status === 'CONTACTED') label = 'Contacted'
                    else if (row.status === 'CONVERTED') label = 'Converted'
                    else if (row.status === 'INTERESTED') label = 'Interested'

                    return (
                      <div key={row.status} className="flex items-center gap-3">
                        <span className="w-20 text-xs font-medium text-slate-600 shrink-0">{label}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div className={`${color} rounded-full h-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-16 text-right shrink-0">{row.count} ({pct}%)</span>
                      </div>
                    )
                  })}
                </div>

                {/* Source chips */}
                <div className="mt-4 flex gap-1 flex-wrap">
                  <span className="text-[10px] font-medium border border-slate-200 bg-slate-50 rounded-full px-3 py-1 flex items-center gap-1.5 text-slate-600">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Vidhyaan · 18
                  </span>
                  <span className="text-[10px] font-medium border border-slate-200 bg-slate-50 rounded-full px-3 py-1 flex items-center gap-1.5 text-slate-600">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" /> Web · 9
                  </span>
                  <span className="text-[10px] font-medium border border-slate-200 bg-slate-50 rounded-full px-3 py-1 flex items-center gap-1.5 text-slate-600">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Phone · 4
                  </span>
                </div>

                {/* Counsellor nudge */}
                {unassignedLeads > 0 && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div className="flex items-center text-amber-800 font-semibold min-w-0">
                      <TriangleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mr-2" strokeWidth={1.5} />
                      <span className="truncate">{unassignedLeads} leads need counsellor assignment</span>
                    </div>
                    <span className="font-bold text-amber-700 cursor-pointer shrink-0 hover:underline min-h-[44px] sm:min-h-0 flex items-center justify-center w-full sm:w-auto text-center bg-amber-100/50 sm:bg-transparent py-2 sm:py-0 rounded-md sm:rounded-none">
                      Assign Now →
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 mt-4 pt-4">
                <span className="text-xs md:text-sm font-semibold text-[#1565D8] cursor-pointer hover:underline min-h-[44px] sm:min-h-0 flex items-center">
                  Go to Lead Management →
                </span>
              </div>
            </div>
          </section>

          {/* SECTION A — 2-COLUMN ROW */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[3fr_2fr] gap-4 md:gap-5 lg:gap-6 items-stretch">
            {/* Column 1: Fee Overview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
              {/* HEADER ROW */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    FEE OVERVIEW
                  </span>
                  <div className="w-px h-3.5 bg-slate-200 flex-shrink-0" />
                  <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    <CalendarDays size={11} className="text-slate-400 flex-shrink-0" strokeWidth={1.5} />
                    <span>{getCurrentMonth()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                  <Crown size={12} className="text-amber-500 fill-amber-500 mr-1" strokeWidth={1.5} />
                  <span>Premium</span>
                </div>
              </div>

              {/* CONTENT ROW */}
              <div className="flex flex-col gap-4 lg:flex-row lg:gap-0 flex-1">
                {/* LEFT HALF */}
                <div className="lg:min-w-[165px] lg:pr-5 grid grid-cols-3 gap-2 md:gap-3 lg:grid-cols-1 lg:gap-0 lg:space-y-4">
                  {/* STAT 1 — COLLECTED */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                      COLLECTED
                    </span>
                    <span className="text-[10px] text-slate-400 mb-1.5">
                      {getShortMonth()} 2026
                    </span>
                    <span className="text-lg md:text-2xl font-bold text-slate-800 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {formatINR(dashData?.fees?.collectedThisMonth ?? 0)}
                    </span>
                    <div className="hidden md:flex items-center gap-1 mt-1.5">
                      {collectedTrend === 'down' ? (
                        <>
                          <TrendingDown size={12} className="text-red-400 flex-shrink-0" strokeWidth={1.5} />
                          <span className="text-[10px] text-red-400 font-medium">
                            vs {formatINR(feeData.collectedLastMonth)} last month
                          </span>
                        </>
                      ) : collectedTrend === 'up' && (dashData?.fees?.collectedThisMonth ?? 0) > 0 ? (
                        <>
                          <TrendingUp size={12} className="text-green-500 flex-shrink-0" strokeWidth={1.5} />
                          <span className="text-[10px] text-green-500 font-medium">
                            vs {formatINR(feeData.collectedLastMonth)} last month
                          </span>
                        </>
                      ) : (dashData?.fees?.collectedThisMonth ?? 0) === 0 && feeData.collectedLastMonth === 0 ? (
                        <span className="text-[10px] text-slate-400">
                          No collections yet
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* STAT 2 — OVERDUE */}
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-red-400 mb-0.5">
                      OVERDUE
                    </span>
                    <div className="flex items-center gap-1 mb-1.5">
                      <TriangleAlert size={10} className="text-red-400 flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-[9px] md:text-[10px] text-red-400 font-medium">
                        Action Needed
                      </span>
                    </div>
                    <span className="text-lg md:text-2xl font-bold text-red-600 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {formatINR(dashData?.fees?.overdue ?? 0)}
                    </span>
                    <div className="hidden md:block mt-1.5">
                      <span className="text-[10px] text-red-400 font-medium">
                        Accumulated · Oldest: {feeData.overdueOldestDays} days ago
                      </span>
                    </div>
                  </div>

                  {/* STAT 3 — UPCOMING */}
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                      UPCOMING
                    </span>
                    <span className="text-[9px] md:text-[10px] text-slate-400 mb-1.5">
                      Next 7 Days
                    </span>
                    <span className="text-lg md:text-2xl font-bold text-slate-800 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {formatINR(dashData?.fees?.upcoming ?? 0)}
                    </span>
                    <div className="hidden md:flex items-center gap-1 mt-1.5">
                      <Receipt size={11} className="text-slate-400 flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-[10px] text-slate-500 font-medium">
                        {feeData.upcomingInvoiceCount} invoices due
                      </span>
                    </div>
                  </div>
                </div>

                {/* DIVIDER */}
                <div className="hidden lg:block w-px bg-slate-100 self-stretch mx-0 flex-shrink-0" />

                {/* RIGHT HALF */}
                <div className="flex-1 lg:pl-5 flex flex-col justify-between mt-4 lg:mt-0">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                      STUDENT FEE STATUS
                    </h4>

                    <div className="space-y-3">
                      {/* ROW 1 — Paid on time */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-green-500" />
                            <span className="text-sm font-medium text-slate-600">Paid on time</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-800">
                              {feeData.students.paidOnTime}
                            </span>
                            <span className="text-xs text-slate-400">
                              students
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              (52%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-green-500 rounded-full h-1.5 transition-all duration-500" style={{ width: '52%' }} />
                        </div>
                      </div>

                      {/* ROW 2 — Overdue */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-red-500" />
                            <span className="text-sm font-medium text-slate-600">Overdue</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-800">
                              {feeData.students.overdue}
                            </span>
                            <span className="text-xs text-slate-400">
                              students
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              (13%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-red-500 rounded-full h-1.5 transition-all duration-500" style={{ width: '13%' }} />
                        </div>
                      </div>

                      {/* ROW 3 — Due in 7 days */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-amber-400" />
                            <span className="text-sm font-medium text-slate-600">Due in 7 days</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-800">
                              {feeData.students.upcomingDues}
                            </span>
                            <span className="text-xs text-slate-400">
                              students
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              (35%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-amber-400 rounded-full h-1.5 transition-all duration-500" style={{ width: '35%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DIVIDER LINE */}
                  <div className="border-t border-slate-200 my-3" />

                  {/* CONTEXT ROWS */}
                  <div className="space-y-2.5">
                    {/* ROW A — YTD COLLECTED */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={13} className="text-green-500" strokeWidth={1.5} />
                        <span className="text-xs font-medium text-slate-500">
                          YTD Collected
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-green-600">
                          {formatINR(feeData.ytdCollected)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1.5">
                          {feeData.academicYear}
                        </span>
                      </div>
                    </div>

                    {/* ROW B — LAST PAYMENT */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-slate-400" strokeWidth={1.5} />
                        <span className="text-xs font-medium text-slate-500">
                          Last Payment
                        </span>
                      </div>
                      {feeData.lastPayment ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-700">
                            {feeData.lastPayment.studentName}
                          </span>
                          <span className="text-slate-400 text-xs">·</span>
                          <span className="text-xs font-bold text-slate-700">
                            {formatINR(feeData.lastPayment.amount)}
                          </span>
                          <span className="text-slate-400 text-xs">·</span>
                          <span className="text-[10px] text-slate-400">
                            {feeData.lastPayment.date}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          No payments this month
                        </span>
                      )}
                    </div>
                  </div>

                  {/* NUDGE CARD */}
                  {feeData.students.overdue > 0 ? (
                    <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <TriangleAlert size={15} className="text-red-500 flex-shrink-0" strokeWidth={1.5} />
                        <div>
                          <p className="text-sm font-semibold text-red-700">
                            {feeData.students.overdue} students have overdue fees
                          </p>
                          <p className="text-xs text-red-400 font-medium mt-0.5">
                            Total outstanding: {formatINR(feeData.overdue)}
                          </p>
                        </div>
                      </div>
                      <button
                        className="text-xs font-bold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer flex-shrink-0"
                        onClick={() => showToast("Reminders sent to 3 students")}
                      >
                        Send Reminder →
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-2.5">
                      <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-sm font-semibold text-green-700">
                        All student fees are up to date
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* FOOTER */}
              <div className="mt-auto pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1565D8] hover:underline cursor-pointer" onClick={() => {}}>
                  Go to Fee Management →
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {feeData.students.total} students enrolled
                </span>
              </div>
            </div>

            {/* Column 2: Upcoming Events */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 lg:p-6 flex flex-col hover:shadow-md transition-shadow duration-300 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[9px] md:text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  UPCOMING EVENTS
                </h3>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                    Free
                  </span>
                  <Plus
                    size={16}
                    className="text-slate-400 hover:text-[#1565D8] cursor-pointer p-1 rounded-md hover:bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-0 divide-y divide-slate-50">
                {[
                  { date: "MAY 20", title: "School Holiday", type: "Holiday", color: "bg-slate-100 text-slate-500", icon: CalendarOff },
                  { date: "MAY 25", title: "Parent-Teacher Meeting", type: "Event", time: "9:00 AM", color: "bg-blue-50 text-blue-600", icon: Calendar },
                  { date: "MAY 28", title: "Annual Sports Day", type: "Event", color: "bg-blue-50 text-blue-600", icon: Calendar },
                  { date: "JUN 01", title: "Board Exam Results", type: "Results", color: "bg-purple-50 text-purple-600", icon: Calendar }
                ].map((ev, idx) => {
                  return (
                    <div key={idx} className={`items-center gap-4 py-3 first:pt-0 last:pb-0 ${idx === 3 ? "hidden sm:flex" : "flex"}`}>
                      <div className="bg-slate-800 rounded-xl w-10 h-10 md:w-12 md:h-12 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-slate-400">
                          {ev.date.split(" ")[0]}
                        </span>
                        <span className="text-sm md:text-lg font-bold text-white leading-none mt-0.5">
                          {ev.date.split(" ")[1]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs md:text-sm font-semibold text-slate-700 truncate leading-tight">
                          {ev.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 md:mt-1.5">
                          <span className={`inline-block text-[9px] md:text-[10px] font-semibold px-2 py-0.5 rounded-full ${ev.color}`}>
                            {ev.type}
                          </span>
                          {'time' in ev && ev.time && (
                            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">
                              {ev.time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-xs text-slate-400 font-medium text-center mt-3 cursor-pointer hover:text-[#1565D8]">
                <span className="inline sm:hidden">+3 more events this month</span>
                <span className="hidden sm:inline">+2 more events this month</span>
              </p>

              <div className="mt-auto pt-4 border-t border-slate-200">
                <span className="text-xs md:text-sm font-semibold text-[#1565D8] hover:underline cursor-pointer min-h-[44px] sm:min-h-0 flex items-center">
                  View Calendar →
                </span>
              </div>
            </div>
          </section>

          {/* DESKTOP / TABLET QUICK ACTIONS SLIM BAR */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-3 mt-6 w-full flex-wrap bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[9px] md:text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500 flex-shrink-0 whitespace-nowrap">
              QUICK ACTIONS
            </span>

            <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />

            {/* Button 1 */}
            <button className="flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap flex-shrink-0 cursor-pointer min-h-[44px] md:min-h-0">
              <Plus size={13} className="text-slate-500" />
              <span>Add Lead</span>
            </button>

            {/* Button 2 */}
            <button className="flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap flex-shrink-0 cursor-pointer min-h-[44px] md:min-h-0">
              <UserPlus size={13} className="text-slate-500" />
              <span>
                {institutionConfig.type === 'school' && "Admission"}
                {institutionConfig.type === 'institute' && "Enrolment"}
                {institutionConfig.type === 'learning_center' && "Enquiry"}
              </span>
            </button>

            {/* Button 3 */}
            {institutionConfig.type !== 'learning_center' && (
              <button className="flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap flex-shrink-0 cursor-pointer min-h-[44px] md:min-h-0">
                <UserCheck size={13} className="text-slate-500" />
                <span>Student</span>
              </button>
            )}

            {/* Button 4 */}
            <button className="flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap flex-shrink-0 cursor-pointer min-h-[44px] md:min-h-0">
              <Receipt size={13} className="text-slate-500" />
              <span>Invoice</span>
            </button>

            {/* Button 5 */}
            <button className="flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs font-bold text-amber-800 hover:bg-amber-100 transition whitespace-nowrap flex-shrink-0 cursor-pointer min-h-[44px] md:min-h-0">
              <Megaphone size={13} className="text-amber-500" />
              <span>Campaign</span>
              <Crown size={11} className="text-amber-500 ml-0.5" />
            </button>

            {/* Button 6 */}
            <button className="flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap flex-shrink-0 cursor-pointer min-h-[44px] md:min-h-0">
              <Globe size={13} className="text-slate-500" />
              <span>Listing</span>
            </button>

            <div className="w-px h-5 bg-slate-200 ml-auto mr-3 flex-shrink-0 hidden lg:block" />

            <span className="text-sm font-semibold text-[#1565D8] hover:underline cursor-pointer whitespace-nowrap flex-shrink-0 ml-auto lg:ml-0 min-h-[44px] md:min-h-0 flex items-center">
              Manage all actions →
            </span>
          </div>

          {/* MOBILE QUICK ACTIONS GRID */}
          <div className="md:hidden mt-4">
            <div className="grid grid-cols-3 gap-2 px-1">
              {/* Button 1: Add Lead */}
              <button className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 min-h-[80px] active:bg-slate-50 cursor-pointer">
                <Plus size={18} className="text-slate-500" />
                <span className="text-center leading-tight">Add Lead</span>
              </button>

              {/* Button 2: Admission/Enrolment/Enquiry */}
              <button className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 min-h-[80px] active:bg-slate-50 cursor-pointer">
                <UserPlus size={18} className="text-slate-500" />
                <span className="text-center leading-tight">
                  {institutionConfig.type === 'school' && "Admission"}
                  {institutionConfig.type === 'institute' && "Enrolment"}
                  {institutionConfig.type === 'learning_center' && "Enquiry"}
                </span>
              </button>

              {/* Button 3: Student */}
              <button className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 min-h-[80px] active:bg-slate-50 cursor-pointer">
                <UserCheck size={18} className="text-slate-500" />
                <span className="text-center leading-tight">Student</span>
              </button>

              {/* Button 4: Invoice */}
              <button className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 min-h-[80px] active:bg-slate-50 cursor-pointer">
                <Receipt size={18} className="text-slate-500" />
                <span className="text-center leading-tight">Invoice</span>
              </button>

              {/* Button 5: Campaign */}
              <button className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-800 min-h-[80px] active:bg-amber-100 cursor-pointer relative">
                <Megaphone size={18} className="text-amber-500" />
                <span className="text-center leading-tight flex items-center justify-center">
                  Campaign
                  <Crown size={10} className="text-amber-500 fill-amber-500 ml-0.5 shrink-0" />
                </span>
              </button>

              {/* Button 6: Listing */}
              <button className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 min-h-[80px] active:bg-slate-50 cursor-pointer">
                <Globe size={18} className="text-slate-500" />
                <span className="text-center leading-tight">Listing</span>
              </button>
            </div>
            
            <div className="text-center mt-3">
              <span className="text-xs font-semibold text-[#1565D8] hover:underline cursor-pointer min-h-[44px] inline-flex items-center justify-center px-4">
                Manage all actions →
              </span>
            </div>
          </div>

          {/* PREMIUM FEATURES SECTION */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-500" strokeWidth={1.5} />
                <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
                  Premium Features (Active in 7-Day Trial)
                </h3>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                Upgrade before your trial expires to maintain uninterrupted access.
              </p>
            </div>

            {/* Grid of features */}
            <div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
                {premiumFeatures.filter(feat => {
                  if (institutionConfig.type === 'learning_center' && feat.isWorkflow) {
                    return false
                  }
                  return true
                }).map((feat) => {
                  const FeatIcon = feat.icon
                  return (
                    <div
                      key={feat.title}
                      className="bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-sm transition cursor-pointer relative flex flex-row items-start gap-4 p-4 sm:flex-col sm:p-5 lg:p-6 group"
                    >
                      <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" strokeWidth={1.5} />
                        <span>Premium</span>
                      </div>

                      <div className="bg-blue-100 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0 sm:mb-2">
                        <FeatIcon className="w-5 h-5 text-[#1565D8]" strokeWidth={1.5} />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                        <div>
                          <h4 className="text-sm lg:text-base font-bold text-slate-800">{feat.title}</h4>
                          <p className="text-xs lg:text-sm text-slate-500 mt-1 leading-relaxed">{feat.desc}</p>
                        </div>
                        <span className="text-xs lg:text-sm font-semibold text-[#1565D8] mt-2 block group-hover:underline">
                          Explore →
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Upgrade Strip banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-center sm:text-left">
              <span className="text-xs md:text-sm font-medium text-slate-700">
                Upgrade to Premium before your trial ends to keep these features.
              </span>
              <Button className="w-full sm:w-auto border border-[#1565D8] text-[#1565D8] text-xs md:text-sm font-semibold px-5 py-2 h-auto rounded-lg bg-transparent hover:bg-blue-50 transition duration-200 min-h-[44px] sm:min-h-0 flex items-center justify-center">
                View Premium Plans
              </Button>
            </div>
          </section>

          {/* NOTIFICATIONS + ACTIVITY ROW */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* LEFT: Recent Notifications */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[9px] md:text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    RECENT NOTIFICATIONS
                  </h3>
                  <span className="text-xs md:text-sm font-semibold text-[#1565D8] cursor-pointer hover:underline min-h-[44px] sm:min-h-0 flex items-center">
                    View All →
                  </span>
                </div>

                <div className="divide-y divide-slate-50">
                  {[
                    { title: "Parent-Teacher Meeting", desc: "PTM scheduled for Class 10A on May 25", time: "2 hours ago", icon: Calendar, unread: true },
                    { title: "Fee Pay Reminder", desc: "Reminder for pending fee payment", time: "1 day ago", icon: CreditCard, unread: false },
                    { title: "School Holiday", desc: "School will remain closed on May 20", time: "2 days ago", icon: CalendarOff, unread: false }
                  ].map((notif, idx) => {
                    const NotifIcon = notif.icon
                    return (
                      <div key={idx} className="flex items-start gap-4 py-3 relative">
                        <div className="bg-blue-50 rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0">
                          <NotifIcon className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="text-xs md:text-sm font-semibold text-slate-800 truncate leading-tight">
                            {notif.title}
                          </h4>
                          <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {notif.desc}
                          </p>
                          <span className="text-[10px] md:text-xs text-slate-400 mt-1 inline-block font-normal">
                            {notif.time}
                          </span>
                        </div>
                        {notif.unread && (
                          <span className="ml-auto w-2 h-2 bg-[#1565D8] rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Recent Activity */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[9px] md:text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    RECENT ACTIVITY
                  </h3>
                  <span className="text-xs md:text-sm font-semibold text-[#1565D8] cursor-pointer hover:underline min-h-[44px] sm:min-h-0 flex items-center">
                    View Full Activity →
                  </span>
                </div>

                <div className="divide-y divide-slate-50">
                  {(dashData?.recentActivity ?? []).map((act: any, idx: number) => {
                    const leadName = act.lead?.parentName ?? 'Lead'
                    const actorName = act.performedBy?.name ?? 'System'
                    const action = act.summary ?? ''
                    const time = new Date(act.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    const letter = actorName.charAt(0) || 'S'
                    return (
                      <div key={act.id ?? idx} className="flex items-start gap-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs md:text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {letter}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                            <span className="font-semibold text-slate-800">{actorName}</span> {action} (Lead: {leadName})
                          </p>
                          <span className="text-[10px] md:text-xs text-slate-400 mt-1 block">
                            {time}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER UPGRADE CTA BLOCK */}
          <section className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1565D8] via-[#1E40AF] to-[#1E3A8A] p-6 md:p-8 lg:p-10 relative">
            {/* Decorative Cap Watermark */}
            <div className="hidden sm:block absolute right-8 bottom-0 opacity-15 pointer-events-none transform translate-y-1/6 translate-x-1/6">
              <GraduationCap className="w-64 h-64 text-white" strokeWidth={1.0} />
            </div>

            <div className="relative z-10 max-w-2xl flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Crown className="w-4 h-4 fill-amber-400 text-amber-400" strokeWidth={1.5} />
                <span className="text-xs font-bold uppercase tracking-[0.15em]">7-DAY FREE TRIAL</span>
              </div>

              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white tracking-tight leading-snug max-w-lg">
                Premium Trial is Active — Make the most of your 7 days.
              </h3>

              <p className="text-sm text-blue-200 leading-relaxed max-w-none sm:max-w-lg">
                Access Campaigns, Advanced Reports, Fee Management, Payment Gateway, and more. Upgrade before your trial ends to maintain full access.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-4">
                <Button className="w-full sm:w-auto bg-white hover:bg-blue-50 text-[#1565D8] text-sm font-bold px-7 py-3 h-12 rounded-xl shadow-md border-0 flex items-center justify-center gap-2">
                  <span>Upgrade to Premium</span>
                  <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={2.0} />
                </Button>
                <button className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white border-2 border-white/40 text-sm font-semibold px-7 py-3 h-12 rounded-xl transition flex items-center justify-center">
                  See Pricing Plans
                </button>
              </div>
            </div>
          </section>

          {/* TOAST NOTIFICATION */}
          <div 
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 transform transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'}`}
          >
            <div className="flex items-center gap-3 bg-slate-800 text-white rounded-xl px-5 py-3 shadow-2xl min-w-[280px]">
              {toast.type === 'success' && <CheckCircle2 size={16} className="text-green-400" strokeWidth={1.5} />}
              {toast.type === 'info' && <Info size={16} className="text-blue-400" strokeWidth={1.5} />}
              {toast.type === 'error' && <XCircle size={16} className="text-red-400" strokeWidth={1.5} />}
              
              <span className="text-sm font-semibold font-sans">{toast.message}</span>
              
              <button 
                onClick={() => setToast(t => ({ ...t, show: false }))} 
                className="ml-auto text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  </div>
</div>
)
}
