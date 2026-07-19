"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Globe,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Users,
  CreditCard,
  ChevronRight,
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
  Star,
  GitBranch,
  Calendar,
  CalendarDays,
  Info,
  XCircle
} from 'lucide-react'

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SetupBanner } from "@/components/dashboard/SetupBanner"
import { AttentionStrip } from "@/components/reports/AttentionStrip"
import { useAcademicYearStore } from "@/stores/academic-year.store"

// ===================================================================
// INSTITUTION-TYPE ADAPTIVE COPY
// ===================================================================
type InstKey = 'school' | 'institute' | 'learning_center'

const LC_TYPES = ['LEARNING_CENTER', 'COACHING_CENTER', 'SKILL_DEVELOPMENT', 'SPORTS_ACADEMY']

// Map the DB InstitutionType enum → the copy variant used across this page
const toInstKey = (t?: string): InstKey => {
  if (!t) return 'school'
  if (LC_TYPES.includes(t)) return 'learning_center'
  return 'school'
}

const COPY = {
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
  createLabel: {
    school: 'Admission',
    institute: 'Enrolment',
    learning_center: 'Enquiry',
  },
} as const

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)

export default function DashboardPage() {
  const [contextStripDismissed, setContextStripDismissed] = useState(false)
  const [dashData, setDashData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState('')
  // Same field the School Profile Manager shows — never hardcode this.
  // null = not loaded yet; the page skeleton stays up until this resolves so
  // the header/strip never flash a wrong state before the real value lands.
  const [profileCompletion, setProfileCompletion] = useState<number | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const selectedYearId = useAcademicYearStore((s) => s.selectedYearId)
  const selectedYearName = useAcademicYearStore((s) => s.selectedYearName)

  // ---- Plan / institution meta (real, from summary API) --------------
  const meta = dashData?.meta
  const instType = toInstKey(meta?.institutionType)
  const isPaid: boolean = meta?.isPaid ?? false
  const isTrial: boolean = meta?.isTrial ?? false
  const trialDaysLeft: number | null = meta?.trialDaysLeft ?? null
  const trialExpired: boolean = meta?.trialExpired ?? false
  const inGrace: boolean = meta?.inGrace ?? false
  const graceEndsAt: string | null = meta?.graceEndsAt ?? null
  const graceEndsLabel = graceEndsAt
    ? new Date(graceEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null
  const planName: string = meta?.planName ?? 'Free'
  const enabledModules: string[] = meta?.enabledModules ?? []
  const hasModule = (slug: string) => enabledModules.includes(slug)
  // Show premium framing only when the org is NOT on a paid plan
  const showUpsell = !isPaid
  const moduleTitle = COPY.moduleTitle[instType]
  const pipelineTitle = COPY.pipelineTitle[instType]
  const createLabel = COPY.createLabel[instType]

  // Fee overview card data — real per-year numbers from the summary API
  const fo = dashData?.feeOverview
  const feeData = {
    overdue: fo?.overdueOutstanding ?? 0,
    overdueOldestDays: fo?.overdueOldestDays ?? null,
    upcomingInvoiceCount: fo?.upcomingInvoiceCount ?? 0,
    ytdCollected: fo?.ytdCollected ?? 0,
    academicYear: selectedYearName ?? '',
    lastPayment: fo?.lastPayment
      ? {
          studentName: fo.lastPayment.studentName,
          amount: fo.lastPayment.amount,
          date: fo.lastPayment.date
            ? new Date(fo.lastPayment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : ''
        }
      : null,
    students: {
      total: fo?.students?.total ?? 0,
      paidOnTime: fo?.students?.paidOnTime ?? 0,
      overdue: fo?.students?.overdue ?? 0,
      upcomingDues: fo?.students?.upcomingDues ?? 0
    }
  }
  const feeStatusPct = (n: number) =>
    feeData.students.total > 0 ? Math.round((n / feeData.students.total) * 100) : 0

  useEffect(() => {
    fetch('/api/v1/school-profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.school?.name) setSchoolName(data.school.name)
        if (data.success && typeof data.school?.profileCompletion === 'number') {
          setProfileCompletion(data.school.profileCompletion)
        }
      })
      .catch((err) => console.error('Error fetching school profile in dashboard:', err))
      .finally(() => setProfileLoading(false))
  }, [])

  useEffect(() => {
    // Stale-response guard: on hard refresh this effect fires once before the
    // persisted year hydrates (unscoped) and again after (scoped). The slow
    // unscoped response can land last and overwrite the scoped data — ignore
    // any response from a superseded run.
    let cancelled = false
    async function fetchDashboard() {
      try {
        const res = await fetch(`/api/v1/dashboard/summary${selectedYearId ? `?academicYearId=${selectedYearId}` : ''}`)
        if (!res.ok) throw new Error('Failed to fetch dashboard data')
        const json = await res.json()
        if (!cancelled) setDashData(json.data)
      } catch (err) {
        if (!cancelled) setError('Failed to load dashboard')
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDashboard()
    return () => { cancelled = true }
  }, [selectedYearId])

  // Toast notifications state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    show: boolean
  }>({ message: '', type: 'success', show: false })

  const getCurrentMonth = () =>
    new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  const getShortMonth = () =>
    new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' })
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, show: true })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

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
    ? Math.min(100, Math.round((dashData.leads.capUsed / dashData.leads.cap) * 100))
    : 0
  const collectedThisMonth = Number(dashData?.fees?.collectedThisMonth ?? 0)
  const collectedLastMonth = Number(dashData?.fees?.collectedLastMonth ?? 0)
  const collectedTrend = collectedThisMonth >= collectedLastMonth ? 'up' : 'down'

  const cmp = dashData?.comparisons
  const pctDelta = (current: number, previous: number) =>
    previous > 0 ? Math.round(((current - previous) / previous) * 100) : null

  // KPI configurations — accent drives the per-metric colour rhythm.
  // Operational "today/this week" numbers only; analytical trends (conversion,
  // monthly collections, YoY) live on /reports/executive so the two surfaces
  // never show the same metric.
  const kpis = [
    { title: "LEADS TODAY", value: String(dashData?.leads?.createdToday ?? 0), icon: Users, trend: (dashData?.leads?.createdThisWeek ?? 0) > 0 ? `+${dashData.leads.createdThisWeek} this week` : "No leads this week", isPremium: false, link: "/lead-management", accent: "blue" },
    { title: "FOLLOW-UPS DUE", value: String(dashData?.leads?.followUpsDueToday ?? 0), icon: CalendarDays, trend: (dashData?.leads?.followUpsDueToday ?? 0) > 0 ? "Due or overdue today" : "No follow-ups pending", isPremium: false, link: "/lead-management", accent: "amber" },
    { title: "UNASSIGNED LEADS", value: String(dashData?.leads?.unassigned ?? 0), icon: UserPlus, trend: (dashData?.leads?.unassigned ?? 0) > 0 ? "Assign to a counsellor" : "No change — all assigned", isPremium: false, link: "/lead-management", accent: "cyan" },
    { title: "COLLECTED TODAY", value: formatINR(Number(dashData?.fees?.collectedToday ?? 0)), icon: IndianRupee, trend: `${formatINR(collectedThisMonth)} this month`, isPremium: true, link: "/fee-management", accent: "emerald" },
    { title: "PROFILE VIEWS", value: String(dashData?.profile?.views ?? 0), icon: Eye, trend: (dashData?.profile?.viewsThisWeek ?? 0) > 0 ? `+${dashData.profile.viewsThisWeek} this week` : "No change", isPremium: false, link: "/settings/school-profile", accent: "violet" },
    {
      title: instType === 'learning_center' ? "ACTIVE LEARNERS" : "ACTIVE STUDENTS",
      value: String(dashData?.admissions?.admitted ?? 0),
      icon: GraduationCap,
      trend: "No change",
      isPremium: true,
      link: "/student-management",
      accent: "indigo"
    }
  ]

  const accentMap: Record<string, { icon: string; ring: string }> = {
    blue: { icon: "bg-blue-50 text-blue-600", ring: "group-hover:border-blue-200" },
    violet: { icon: "bg-violet-50 text-violet-600", ring: "group-hover:border-violet-200" },
    cyan: { icon: "bg-cyan-50 text-cyan-600", ring: "group-hover:border-cyan-200" },
    emerald: { icon: "bg-emerald-50 text-emerald-600", ring: "group-hover:border-emerald-200" },
    amber: { icon: "bg-amber-50 text-amber-600", ring: "group-hover:border-amber-200" },
    indigo: { icon: "bg-indigo-50 text-indigo-600", ring: "group-hover:border-indigo-200" },
  }

  // Premium features config — gated by real module entitlement
  const premiumFeatures = [
    { title: "Advanced Reports", desc: "In-depth analytics on admissions, fees, and leads", icon: BarChart2, module: "advanced_reports", link: "/reports" },
    { title: "Campaign Management", desc: "Send SMS, Email & WhatsApp campaigns to leads and parents", icon: Megaphone, module: "campaign_management", link: "/campaign-management" },
    { title: "Student Lifecycle", desc: "Full student history from enquiry to alumni", icon: UserCheck, module: null, link: "/student-management" },
    { title: "Payment Gateway", desc: "Collect fees online via UPI, cards & net banking", icon: CreditCard, module: null, link: "/settings/billing" },
    { title: "WhatsApp, Email & SMS", desc: "Automated communication for leads and admissions", icon: MessageSquare, module: "whatsapp_addon", link: "/settings/whatsapp-templates" },
    { title: "Forms & Requests", desc: "Custom admission and enquiry forms with e-signatures", icon: ClipboardList, module: null, link: "/settings" },
    {
      title: instType === 'learning_center' ? "Enquiry Workflow" : "Admission Workflow",
      desc: "Configurable multi-stage pipeline for admissions",
      icon: GitBranch,
      module: null,
      link: "/admission-management",
      isWorkflow: true
    }
  ]

  // ------- Full-page skeleton while summary + school profile load -------
  // Both fetches must resolve before first paint, otherwise the header and
  // the profile-completion strip render a wrong default and then flash.
  if (loading || profileLoading) {
    return (
      <div className="flex-1 p-5 md:p-8 space-y-6 max-w-7xl mx-auto w-full select-none">
        <div className="space-y-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-3 w-96" />
        </div>
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 xl:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[128px] w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  const displayName = schoolName || 'your dashboard'

  return (
    <div className="flex-1 p-5 md:p-8 space-y-8 max-w-7xl mx-auto w-full select-none">
      {/* ============ PAGE HEADER ============ */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {greeting}{schoolName ? `, ${schoolName}` : ''}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {instType === 'learning_center'
              ? "Here's what's happening at your centre today."
              : "Here's what's happening at your institution today."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Plan-state pill — always present so the org's plan is visible at
              a glance in every state (paid / trial / trial-ended grace / free). */}
          {isPaid && !isTrial ? (
            <Link href="/settings/billing" className="hidden sm:inline-flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-green-100 transition">
              <CheckCircle2 size={13} strokeWidth={2} />
              {planName} plan active
            </Link>
          ) : isTrial && !trialExpired ? (
            <Link href="/settings/billing" className="hidden sm:inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-amber-100 transition">
              <Crown size={13} strokeWidth={2} className="fill-amber-500 text-amber-600" />
              Trial{trialDaysLeft != null ? ` · ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left` : ''}
            </Link>
          ) : inGrace || (isTrial && trialExpired) ? (
            <Link href="/settings/billing/upgrade" className="hidden sm:inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-red-100 transition">
              <Crown size={13} strokeWidth={2} />
              Trial ended
            </Link>
          ) : (
            <Link href="/settings/billing" className="hidden sm:inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-slate-200 transition">
              {planName} plan
            </Link>
          )}
          <Link href="/settings/school-profile">
            <Button variant="outline" className="text-sm font-semibold px-4 py-2 h-9 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50">
              Manage listing
            </Button>
          </Link>
          <Link href="/lead-management/add-lead">
            <Button className="bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 h-9 rounded-lg flex items-center gap-1.5">
              <Plus size={15} strokeWidth={2} /> Add Lead
            </Button>
          </Link>
        </div>
      </header>

      {/* ============ ONE-TIME SETUP CHECKLIST (paid orgs) ============ */}
      <SetupBanner />

      {error ? (
        <div className="text-center py-20">
          <p className="text-red-500">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-[#1565D8] underline text-sm">
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* ============ CONTEXT STRIP (single, priority-picked) ============ */}
          {/* Trial countdown — always shown during a trial (time-sensitive, so it
              is NOT suppressed by the profile-completion strip below). */}
          {(isTrial || inGrace) && !contextStripDismissed && (
            <div className={`${inGrace || trialExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} border rounded-2xl px-5 py-3.5 md:px-6 flex flex-col md:flex-row gap-3 md:items-center`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-8 h-8 rounded-lg ${inGrace || trialExpired ? 'bg-red-100' : 'bg-amber-100'} flex items-center justify-center shrink-0`}>
                  <Crown className={`w-4 h-4 ${inGrace || trialExpired ? 'text-red-600' : 'text-amber-600 fill-amber-500'}`} strokeWidth={1.5} />
                </span>
                <p className={`text-sm ${inGrace || trialExpired ? 'text-red-900' : 'text-amber-900'} font-medium leading-snug`}>
                  {inGrace || trialExpired ? 'Premium trial ended.' : 'Premium trial active.'}{" "}
                  <span className="font-bold">
                    {inGrace
                      ? (graceEndsLabel
                          ? `Premium access until ${graceEndsLabel} — upgrade to keep it.`
                          : 'Upgrade to keep premium features.')
                      : trialExpired
                        ? 'Upgrade to keep premium features.'
                        : trialDaysLeft != null
                          ? (trialDaysLeft === 0 ? 'Ends today.' : `${trialDaysLeft} day${trialDaysLeft > 1 ? 's' : ''} left.`)
                          : 'Enjoy full access.'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3 md:ml-auto shrink-0">
                <Link href="/settings/billing" className="text-sm font-semibold text-[#1565D8] hover:underline whitespace-nowrap">
                  See plans
                </Link>
                <Link href="/settings/billing/upgrade">
                  <Button className="bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-semibold px-4 h-9 rounded-lg whitespace-nowrap">
                    Upgrade
                  </Button>
                </Link>
                <button onClick={() => setContextStripDismissed(true)} className="p-1 rounded text-amber-500 hover:text-amber-700 transition shrink-0" title="Dismiss">
                  <X className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}

          {/* Secondary strip — profile completion, else plan status (only when
              there's no separate trial strip already carrying the plan message). */}
          {profileCompletion !== null && profileCompletion < 100 ? (
            <Card className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 border-l-4 ${profileCompletion >= 50 ? 'border-l-amber-500' : 'border-l-red-500'}`}>
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-8">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                    Finish setting up {displayName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-lg">
                    Complete your profile to get discovered by parents and unlock your public listing.
                  </p>
                </div>
                <div className="w-full md:w-72 shrink-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-500">Profile completion</span>
                    <span className={`text-sm font-bold ${profileCompletion >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{profileCompletion}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`rounded-full h-2 transition-all duration-500 ${profileCompletion >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <Link href="/settings/school-profile" className="text-sm font-semibold text-[#1565D8] mt-2 inline-flex items-center gap-1 hover:underline">
                    Complete profile <ChevronRight size={14} strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </Card>
          ) : isTrial || isPaid || inGrace ? null : (
            /* Paid/trial state lives in the header (plan pill + Manage listing) —
               only free orgs still get an upsell strip here. */
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3.5 md:px-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="text-blue-500 shrink-0" size={18} strokeWidth={2} />
                <span className="text-sm font-medium text-slate-700">
                  You&rsquo;re on the <span className="font-semibold">{planName}</span> plan. Upgrade to unlock campaigns, reports &amp; more.
                </span>
              </div>
              <Link href="/settings/billing" className="text-sm font-semibold text-[#1565D8] hover:underline whitespace-nowrap sm:ml-auto shrink-0">
                View plans →
              </Link>
            </div>
          )}

          {/* ============ ATTENTION STRIP ============ */}
          {(dashData?.attention?.length ?? 0) > 0 && (
            <AttentionStrip items={dashData.attention} />
          )}

          {/* ============ KPI STRIP ============ */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 xl:gap-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon
              const ac = accentMap[kpi.accent] ?? accentMap.blue
              const showBadge = kpi.isPremium && showUpsell
              return (
                <Link
                  key={kpi.title}
                  href={kpi.link}
                  className={`group relative min-w-0 w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 lg:p-5 cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col ${ac.ring}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${ac.icon}`}>
                      <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    </span>
                    {showBadge ? (
                      <span className="bg-amber-100 text-amber-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" strokeWidth={1.5} />
                        Premium
                      </span>
                    ) : (
                      <ArrowUpRight size={15} className="text-slate-300 group-hover:text-slate-500 transition-colors" strokeWidth={1.75} />
                    )}
                  </div>

                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-4 block truncate">
                    {kpi.title}
                  </span>
                  <h3 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight leading-none mt-1.5" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {kpi.value}
                  </h3>
                  <p className={`text-xs font-medium mt-2 truncate ${kpi.trend.includes('No') ? 'text-slate-400' : 'text-green-600'}`}>
                    {kpi.trend}
                  </p>
                </Link>
              )
            })}
          </section>

          {/* ============ PRIMARY ROW: Pipeline + Leads ============ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Pipeline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{pipelineTitle}</h3>
                  {selectedYearName && <span className="text-xs text-slate-400">{selectedYearName}</span>}
                </div>
                {showUpsell && (
                  <span className="bg-amber-100 text-amber-700 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                    <Crown className="w-3 h-3 fill-amber-500 text-amber-500" strokeWidth={1.5} /> Premium
                  </span>
                )}
              </div>

              {/* Stat quads */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                {[
                  { label: 'Enquiries', value: totalAdmissions, tone: 'text-slate-400', sub: null },
                  { label: 'In Process', value: inProcessAdmissions, tone: 'text-blue-500', sub: null },
                  { label: 'Enrolled', value: enrolledAdmissions, tone: 'text-green-600', sub: `${conversionRate}%` },
                  { label: 'Rejected', value: rejectedAdmissions, tone: 'text-red-500', sub: `${dropOffRate}%` },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider block ${s.tone}`}>{s.label}</span>
                    <h4 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{s.value}</h4>
                    {s.sub && <span className={`text-[10px] font-semibold mt-0.5 block ${s.tone}`}>{s.sub}</span>}
                  </div>
                ))}
              </div>

              {/* Stage funnel */}
              {(dashData?.admissions?.byStage ?? []).length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Pipeline Stages</p>
                  <div className="flex items-end gap-3 w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
                    {(dashData?.admissions?.byStage ?? []).map((item: any, idx: number, arr: any[]) => {
                      const stageName = item.stage?.label ?? 'Unknown'
                      const count = item.count ?? 0
                      const colorClass = getStageColorClass(item.stage?.color)
                      const maxCount = Math.max(...arr.map((a: any) => a.count ?? 1)) || 1
                      return (
                        <React.Fragment key={item.stageId ?? idx}>
                          <div className="flex flex-col items-center min-w-[64px] md:min-w-0 md:flex-1 shrink-0">
                            <span className="text-[11px] font-bold text-slate-700 mb-1">{count}</span>
                            <div className={`w-full rounded-t-md ${colorClass} opacity-85`} style={{ height: `${(count / maxCount) * 48}px`, minHeight: '6px' }} />
                            <span className="text-[9px] font-medium text-slate-400 mt-1.5 text-center leading-tight w-full truncate px-0.5">{stageName}</span>
                          </div>
                          {idx < arr.length - 1 && <ChevronRight size={10} className="text-slate-200 mb-4 shrink-0" strokeWidth={2} />}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* MoM comparison chips */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">This Month vs Last</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Enquiries', cur: cmp?.enquiries?.current ?? 0, delta: pctDelta(cmp?.enquiries?.current ?? 0, cmp?.enquiries?.previous ?? 0) },
                    { label: 'Converted', cur: cmp?.converted?.current ?? 0, delta: pctDelta(cmp?.converted?.current ?? 0, cmp?.converted?.previous ?? 0) },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{c.label}</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">{c.cur}</div>
                        <div className="flex items-center justify-end mt-0.5">
                          {c.delta === null ? (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">—</span>
                          ) : (
                            <>
                              {c.delta >= 0 && <TrendingUp size={10} className="text-green-600 mr-1" />}
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.delta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {c.delta >= 0 ? '+' : ''}{c.delta}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Avg convert */}
                  <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Avg. Convert</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {cmp?.avgConvertDays?.current != null ? `${cmp.avgConvertDays.current}d` : '—'}
                      </div>
                      <div className="flex items-center justify-end mt-0.5">
                        {cmp?.avgConvertDays?.current != null && cmp?.avgConvertDays?.previous != null ? (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cmp.avgConvertDays.current <= cmp.avgConvertDays.previous ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {cmp.avgConvertDays.current <= cmp.avgConvertDays.previous ? '↓' : '↑'} {Math.abs(cmp.avgConvertDays.current - cmp.avgConvertDays.previous)}d
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100">
                <Link href="/admission-management" className="text-sm font-semibold text-[#1565D8] hover:underline inline-flex items-center gap-1">
                  View {moduleTitle} <ChevronRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>

            {/* Lead Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Lead Overview</h3>
                <span className="bg-slate-100 text-slate-500 text-[11px] font-semibold px-2.5 py-1 rounded-full">Free</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: 'Today', value: dashData?.leads?.createdToday ?? 0 },
                  { label: 'This Week', value: dashData?.leads?.createdThisWeek ?? 0 },
                  { label: 'This Month', value: dashData?.leads?.createdThisMonth ?? 0 },
                ].map((s) => (
                  <div key={s.label} className="text-center bg-slate-50 rounded-xl p-3">
                    <h4 className="text-lg md:text-2xl font-bold text-slate-900">{s.value}</h4>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 block">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Lead cap (only meaningful when a cap applies — free plans) */}
              {!isPaid && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-500">Free Lead Limit</span>
                    <span className="text-xs font-bold text-slate-700">{(dashData?.leads?.capUsed ?? 0)} / {(dashData?.leads?.cap ?? 10)}</span>
                  </div>
                  <Progress value={capPct} className="h-2 w-full bg-slate-100" indicatorClassName="bg-amber-400" />
                  {(dashData?.leads?.capUsed ?? 0) >= ((dashData?.leads?.cap ?? 10) - 5) && (dashData?.leads?.capUsed ?? 0) < (dashData?.leads?.cap ?? 10) && (
                    <p className="text-xs text-amber-700 font-medium mt-1.5">
                      ⚠ {(dashData?.leads?.capUsed ?? 0)} of {(dashData?.leads?.cap ?? 10)} free leads used. Upgrade for unlimited.
                    </p>
                  )}
                  {(dashData?.leads?.capUsed ?? 0) >= (dashData?.leads?.cap ?? 10) && (
                    <div className="flex justify-between items-center mt-1.5">
                      <p className="text-xs text-red-600 font-semibold">🔒 Free lead limit reached.</p>
                      <Link href="/settings/billing" className="text-xs text-[#1565D8] font-bold underline">Upgrade →</Link>
                    </div>
                  )}
                </div>
              )}

              {/* Status breakdown */}
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
              {(dashData?.leads?.bySource?.length ?? 0) > 0 && (
                <div className="mt-4 flex gap-1.5 flex-wrap">
                  {(dashData?.leads?.bySource ?? []).slice(0, 4).map((s: any, i: number) => {
                    const dotColors = ['bg-blue-500', 'bg-slate-400', 'bg-purple-500', 'bg-amber-400']
                    const label = String(s.source || 'Other').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
                    return (
                      <span key={s.source} className="text-[10px] font-medium border border-slate-200 bg-slate-50 rounded-full px-3 py-1 flex items-center gap-1.5 text-slate-600">
                        <span className={`w-1.5 h-1.5 ${dotColors[i]} rounded-full`} /> {label} · {s.count}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Unassigned nudge */}
              {(dashData?.leads?.unassigned ?? 0) > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                  <div className="flex items-center text-amber-800 font-semibold min-w-0">
                    <TriangleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mr-2" strokeWidth={1.5} />
                    <span className="truncate">{dashData?.leads?.unassigned} leads need assignment</span>
                  </div>
                  <Link href="/lead-management" className="font-bold text-amber-700 shrink-0 hover:underline">Assign now →</Link>
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-slate-100">
                <Link href="/lead-management" className="text-sm font-semibold text-[#1565D8] hover:underline inline-flex items-center gap-1">
                  Go to Lead Management <ChevronRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>
          </section>

          {/* ============ MARKETPLACE ROW: Fresh Enquiries + Latest Reviews ============ */}
          {(((dashData?.marketplace?.enquiries?.recent?.length ?? 0) > 0) ||
            ((dashData?.marketplace?.reviews?.latest?.length ?? 0) > 0)) && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
              {/* Fresh enquiries from marketplace */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">NEW ENQUIRIES</span>
                  {((dashData?.marketplace?.enquiries?.unactioned ?? 0) + (dashData?.marketplace?.enquiries?.pendingTrials ?? 0)) > 0 && (
                    <span className="bg-blue-50 text-[#1565D8] text-[11px] font-semibold px-2.5 py-1 rounded-full border border-blue-100">
                      {(dashData?.marketplace?.enquiries?.unactioned ?? 0) + (dashData?.marketplace?.enquiries?.pendingTrials ?? 0)} awaiting action
                    </span>
                  )}
                </div>
                {(dashData?.marketplace?.enquiries?.recent?.length ?? 0) === 0 ? (
                  <p className="text-sm font-normal text-slate-400 py-6 text-center">No enquiries from your Vidhyaan profile yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(dashData?.marketplace?.enquiries?.recent ?? []).map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between gap-3 border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">
                            {e.parent?.name || 'Parent'}{e.kidName ? ` — for ${e.kidName}` : ''}
                          </p>
                          <p className="text-xs font-normal text-slate-400">
                            {e.type === 'VISIT_REQUEST' ? 'Visit request' : 'Enquiry'}{e.gradeSought ? ` · ${e.gradeSought}` : ''} · {new Date(e.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                          e.status === 'NEW' ? 'bg-blue-50 text-[#1565D8]' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {e.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <Link href="/lead-management" className="text-sm font-semibold text-[#1565D8] hover:underline inline-flex items-center gap-1">
                    Open Lead Management <ChevronRight size={14} strokeWidth={2} />
                  </Link>
                </div>
              </div>

              {/* Latest parent reviews */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">LATEST PARENT REVIEWS</span>
                  {(dashData?.marketplace?.reviews?.newThisWeek ?? 0) > 0 && (
                    <span className="bg-amber-50 text-amber-600 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-amber-100">
                      +{dashData.marketplace.reviews.newThisWeek} this week
                    </span>
                  )}
                </div>
                {(dashData?.marketplace?.reviews?.latest?.length ?? 0) === 0 ? (
                  <p className="text-sm font-normal text-slate-400 py-6 text-center">No parent reviews yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(dashData?.marketplace?.reviews?.latest ?? []).map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 border-b border-slate-50 pb-2.5 last:border-b-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-700 truncate">
                            {r.title || 'Review'}{r.parent?.name ? ` — ${r.parent.name}` : ''}
                          </p>
                          <p className="text-xs font-normal text-slate-400">
                            {new Date(r.createdAt).toLocaleDateString()}
                            {r.status !== 'PUBLISHED' ? ` · ${r.status.toLowerCase()}` : ''}
                          </p>
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded shrink-0 border ${
                          r.rating <= 2
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          <Star className="w-3 h-3 fill-current" /> {r.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <Link href="/settings/reviews" className="text-sm font-semibold text-[#1565D8] hover:underline inline-flex items-center gap-1">
                    Manage Reviews <ChevronRight size={14} strokeWidth={2} />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* ============ SECONDARY ROW: Fee Overview + Upcoming Events ============ */}
          <section className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 items-stretch">
            {/* Fee Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">FEE OVERVIEW</span>
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0">
                    <CalendarDays size={11} className="text-slate-400" strokeWidth={1.5} />
                    {getCurrentMonth()}
                  </span>
                </div>
                {showUpsell && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0">
                    <Crown size={12} className="text-amber-500 fill-amber-500" strokeWidth={1.5} /> Premium
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:gap-0 flex-1">
                {/* Left: 3 stats */}
                <div className="lg:min-w-[170px] lg:pr-5 grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-0 lg:space-y-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">RECEIVED</span>
                    <span className="text-[10px] text-slate-400 mb-1.5">{getShortMonth()}</span>
                    <span className="text-lg md:text-2xl font-bold text-slate-900 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {formatINR(dashData?.fees?.collectedThisMonth ?? 0)}
                    </span>
                    <div className="hidden md:flex items-center gap-1 mt-1.5">
                      {collectedTrend === 'down' ? (
                        <><TrendingDown size={12} className="text-red-400 shrink-0" strokeWidth={1.5} /><span className="text-[10px] text-red-400 font-medium">vs {formatINR(collectedLastMonth)} last mo.</span></>
                      ) : (dashData?.fees?.collectedThisMonth ?? 0) > 0 ? (
                        <><TrendingUp size={12} className="text-green-500 shrink-0" strokeWidth={1.5} /><span className="text-[10px] text-green-500 font-medium">vs {formatINR(collectedLastMonth)} last mo.</span></>
                      ) : (
                        <span className="text-[10px] text-slate-400">No collections yet</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-0.5">OVERDUE</span>
                    <span className="text-[10px] text-red-400 font-medium mb-1.5 flex items-center gap-1"><TriangleAlert size={10} strokeWidth={1.5} /> Action needed</span>
                    <span className="text-lg md:text-2xl font-bold text-red-600 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {formatINR(dashData?.fees?.overdue ?? 0)}
                    </span>
                    <span className="hidden md:block text-[10px] text-red-400 font-medium mt-1.5">
                      {feeData.overdueOldestDays != null ? `Oldest: ${feeData.overdueOldestDays} days ago` : 'No overdue invoices'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">UPCOMING</span>
                    <span className="text-[10px] text-slate-400 mb-1.5">Next 7 days</span>
                    <span className="text-lg md:text-2xl font-bold text-slate-900 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {formatINR(dashData?.fees?.upcoming ?? 0)}
                    </span>
                    <span className="hidden md:flex items-center gap-1 mt-1.5 text-[10px] text-slate-500 font-medium">
                      <Receipt size={11} className="text-slate-400" strokeWidth={1.5} /> {feeData.upcomingInvoiceCount} invoices due
                    </span>
                  </div>
                </div>

                <div className="hidden lg:block w-px bg-slate-100 self-stretch shrink-0" />

                {/* Right: student fee status */}
                <div className="flex-1 lg:pl-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">STUDENT FEE STATUS</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Paid on time', n: feeData.students.paidOnTime, color: 'bg-green-500' },
                        { label: 'Overdue', n: feeData.students.overdue, color: 'bg-red-500' },
                        { label: 'Due in 7 days', n: feeData.students.upcomingDues, color: 'bg-amber-400' },
                      ].map((r) => (
                        <div key={r.label} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${r.color}`} />
                              <span className="text-sm font-medium text-slate-600">{r.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-900">{r.n}</span>
                              <span className="text-xs text-slate-400">students</span>
                              <span className="text-[11px] text-slate-400 font-medium">({feeStatusPct(r.n)}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className={`${r.color} rounded-full h-1.5 transition-all duration-500`} style={{ width: `${feeStatusPct(r.n)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 my-3" />

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <TrendingUp size={13} className="text-green-500" strokeWidth={1.5} /> YTD Collected
                      </span>
                      <span>
                        <span className="text-xs font-bold text-green-600">{formatINR(feeData.ytdCollected)}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">{feeData.academicYear}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <CheckCircle2 size={13} className="text-slate-400" strokeWidth={1.5} /> Last Payment
                      </span>
                      {feeData.lastPayment ? (
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-semibold text-slate-700 truncate max-w-[110px]">{feeData.lastPayment.studentName}</span>
                          <span className="text-slate-400 text-xs">·</span>
                          <span className="text-xs font-bold text-slate-700">{formatINR(feeData.lastPayment.amount)}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">No payments this month</span>
                      )}
                    </div>
                  </div>

                  {feeData.students.overdue > 0 ? (
                    <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TriangleAlert size={15} className="text-red-500 shrink-0" strokeWidth={1.5} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-red-700">{feeData.students.overdue} students overdue</p>
                          <p className="text-xs text-red-400 font-medium mt-0.5">Outstanding: {formatINR(feeData.overdue)}</p>
                        </div>
                      </div>
                      <Link href="/fee-management" className="text-xs font-bold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition shrink-0">
                        Review →
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-2.5">
                      <CheckCircle2 size={15} className="text-green-500 shrink-0" strokeWidth={1.5} />
                      <span className="text-sm font-semibold text-green-700">All student fees are up to date</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link href="/fee-management" className="text-sm font-semibold text-[#1565D8] hover:underline inline-flex items-center gap-1">
                  Go to Fee Management <ChevronRight size={14} strokeWidth={2} />
                </Link>
                <span className="text-xs text-slate-400 font-medium">{feeData.students.total} students enrolled</span>
              </div>
            </div>

            {/* Upcoming Events — REAL data */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">UPCOMING EVENTS</h3>
                <Link href="/event-management" className="text-slate-400 hover:text-[#1565D8] transition" title="Add event">
                  <Plus size={16} />
                </Link>
              </div>

              {(dashData?.upcomingEvents ?? []).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                  <Calendar className="w-8 h-8 text-slate-200 mb-2" strokeWidth={1.5} />
                  <p className="text-sm text-slate-400">No upcoming events.</p>
                  <Link href="/event-management" className="text-sm font-semibold text-[#1565D8] hover:underline mt-1">Schedule one →</Link>
                </div>
              ) : (
                <div className="flex-1 divide-y divide-slate-50">
                  {(dashData?.upcomingEvents ?? []).map((ev: any) => {
                    const d = new Date(ev.startsAt)
                    return (
                      <Link key={ev.id} href="/event-management" className="flex items-center gap-4 py-3 first:pt-0 group">
                        <div className="bg-slate-900 rounded-xl w-12 h-12 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
                            {d.toLocaleString('en-IN', { month: 'short' })}
                          </span>
                          <span className="text-lg font-bold text-white leading-none mt-0.5">{d.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-800 truncate leading-tight group-hover:text-[#1565D8] transition-colors">{ev.title}</h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-medium text-slate-400">
                              {d.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                            {ev.location && <><span className="text-slate-300 text-[10px]">·</span><span className="text-[10px] text-slate-400 truncate">{ev.location}</span></>}
                            <span className="text-[10px] text-slate-400">· {ev._count?.rsvps ?? 0} RSVPs</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              {(() => {
                const shown = dashData?.upcomingEvents?.length ?? 0
                const more = Math.max(0, (dashData?.eventsThisMonth ?? 0) - shown)
                return more > 0 ? (
                  <Link href="/event-management" className="text-xs text-slate-400 font-medium text-center mt-3 hover:text-[#1565D8] block">
                    +{more} more event{more > 1 ? 's' : ''} this month
                  </Link>
                ) : null
              })()}

              <div className="mt-auto pt-4 border-t border-slate-100">
                <Link href="/event-management?view=calendar" className="text-sm font-semibold text-[#1565D8] hover:underline inline-flex items-center gap-1">
                  View Calendar <ChevronRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>
          </section>

          {/* ============ QUICK ACTIONS ============ */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:px-6 md:py-4">
            <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 shrink-0 hidden md:inline">QUICK ACTIONS</span>
              <div className="w-px h-5 bg-slate-200 shrink-0 hidden md:block" />
              <div className="grid grid-cols-3 gap-2 w-full md:flex md:w-auto md:flex-wrap md:gap-2">
                <QuickAction href="/lead-management/add-lead" icon={Plus} label="Add Lead" />
                <QuickAction href="/admission-management/create" icon={UserPlus} label={createLabel} />
                {instType !== 'learning_center' && (
                  <QuickAction href="/student-management/create" icon={UserCheck} label="Student" />
                )}
                <QuickAction href="/fee-management/create" icon={Receipt} label="Invoice" />
                <QuickAction href="/campaign-management/new" icon={Megaphone} label="Campaign" premium={showUpsell} />
                <QuickAction href="/settings/school-profile" icon={Globe} label="Listing" />
              </div>
              <Link href="/settings" className="hidden md:inline-flex text-sm font-semibold text-[#1565D8] hover:underline ml-auto shrink-0 items-center">
                Manage all →
              </Link>
            </div>
          </section>

          {/* ============ RECENT ACTIVITY ============ */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">RECENT ACTIVITY</h3>
              <Link href="/lead-management" className="text-sm font-semibold text-[#1565D8] hover:underline">View all →</Link>
            </div>
            {(dashData?.recentActivity ?? []).length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No recent activity.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {(dashData?.recentActivity ?? []).map((act: any, idx: number) => {
                  const leadName = act.lead?.parentName ?? 'Lead'
                  const actorName = act.performedBy?.name ?? 'System'
                  const action = act.summary ?? ''
                  const time = new Date(act.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  const letter = actorName.charAt(0) || 'S'
                  return (
                    <div key={act.id ?? idx} className="flex items-start gap-4 py-3 first:pt-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">{letter}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          <span className="font-semibold text-slate-800">{actorName}</span> {action} <span className="text-slate-400">(Lead: {leadName})</span>
                        </p>
                        <span className="text-xs text-slate-400 mt-1 block">{time}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* ============ UPSELL (only when NOT on a paid plan) ============ */}
          {showUpsell && (
            <section className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1565D8] via-[#1E40AF] to-[#1E3A8A] p-6 md:p-8 relative">
              <div className="hidden sm:block absolute right-6 bottom-0 opacity-10 pointer-events-none translate-y-1/6">
                <GraduationCap className="w-56 h-56 text-white" strokeWidth={1} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-amber-300">
                  <Crown className="w-4 h-4 fill-amber-300 text-amber-300" strokeWidth={1.5} />
                  <span className="text-xs font-bold uppercase tracking-[0.15em]">
                    {isTrial && !trialExpired && trialDaysLeft != null ? `${trialDaysLeft} DAY${trialDaysLeft === 1 ? '' : 'S'} LEFT IN TRIAL` : 'UPGRADE TO PREMIUM'}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug max-w-lg mt-3">
                  Unlock everything Vidhyaan offers.
                </h3>
                <p className="text-sm text-blue-200 leading-relaxed max-w-lg mt-2">
                  Campaigns, advanced reports, online payments and more — one plan for your whole team.
                </p>

                {/* Feature chips — gated by real entitlement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6 max-w-4xl">
                  {premiumFeatures
                    .filter((f) => !(instType === 'learning_center' && f.isWorkflow))
                    .map((f) => {
                      const active = f.module ? hasModule(f.module) : false
                      const FeatIcon = f.icon
                      return (
                        <Link
                          key={f.title}
                          href={f.link}
                          className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl p-4 flex items-start gap-3 transition group backdrop-blur-sm"
                        >
                          <span className="bg-white/15 rounded-lg w-9 h-9 flex items-center justify-center shrink-0">
                            <FeatIcon className="w-[18px] h-[18px] text-white" strokeWidth={1.75} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-white truncate">{f.title}</h4>
                              {active && <span className="text-[9px] font-bold bg-green-400/20 text-green-200 px-1.5 py-0.5 rounded-full shrink-0">Active</span>}
                            </div>
                            <p className="text-[11px] text-blue-200 mt-0.5 leading-snug line-clamp-2">{f.desc}</p>
                          </div>
                        </Link>
                      )
                    })}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-7">
                  <Link href="/settings/billing/upgrade" className="w-full sm:w-auto">
                    <Button className="w-full bg-white hover:bg-blue-50 text-[#1565D8] text-sm font-bold px-7 h-12 rounded-xl shadow-md border-0 flex items-center justify-center gap-2">
                      Upgrade to Premium <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={2} />
                    </Button>
                  </Link>
                  <Link href="/settings/billing" className="w-full sm:w-auto">
                    <button className="w-full bg-transparent hover:bg-white/10 text-white border-2 border-white/40 text-sm font-semibold px-7 h-12 rounded-xl transition flex items-center justify-center">
                      See Pricing Plans
                    </button>
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* ============ TOAST ============ */}
          <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 transform transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-3 bg-slate-800 text-white rounded-xl px-5 py-3 shadow-2xl min-w-[280px]">
              {toast.type === 'success' && <CheckCircle2 size={16} className="text-green-400" strokeWidth={1.5} />}
              {toast.type === 'info' && <Info size={16} className="text-blue-400" strokeWidth={1.5} />}
              {toast.type === 'error' && <XCircle size={16} className="text-red-400" strokeWidth={1.5} />}
              <span className="text-sm font-semibold">{toast.message}</span>
              <button onClick={() => setToast(t => ({ ...t, show: false }))} className="ml-auto text-slate-400 hover:text-slate-200">
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ---- Quick-action button (shared desktop + mobile) ----
function QuickAction({
  href, icon: Icon, label, premium = false,
}: { href: string; icon: React.ComponentType<any>; label: string; premium?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-2 px-2 py-3 md:px-3 md:py-2 rounded-xl border text-[11px] md:text-xs font-semibold transition min-h-[68px] md:min-h-0 whitespace-nowrap ${
        premium
          ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon size={16} className={premium ? 'text-amber-500' : 'text-slate-500'} strokeWidth={1.75} />
      <span className="text-center leading-tight">{label}</span>
      {premium && <Crown size={11} className="text-amber-500 fill-amber-500 shrink-0" />}
    </Link>
  )
}
