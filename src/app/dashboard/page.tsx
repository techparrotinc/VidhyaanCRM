"use client"

import React, { useState } from 'react'
import {
  LayoutDashboard,
  Globe,
  TrendingUp,
  LineChart,
  ClipboardList,
  Users,
  CreditCard,
  UserCog,
  Shield,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
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
  CalendarOff,
  Settings,
  LayoutList
} from 'lucide-react'

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

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
  target: 50000,
  overdue: 12221,
  upcoming: 3000,
  students: {
    paidOnTime: 12,
    overdue: 3,
    upcomingDues: 8,
  }
}

export default function DashboardPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [salesMarketingOpen, setSalesMarketingOpen] = useState(true)
  const [trialBannerVisible, setTrialBannerVisible] = useState(true)
  const [activeNav, setActiveNav] = useState("Dashboard")

  const moduleTitle = institutionConfig.moduleTitle[institutionConfig.type as keyof typeof institutionConfig.moduleTitle]
  const pipelineTitle = institutionConfig.pipelineTitle[institutionConfig.type as keyof typeof institutionConfig.pipelineTitle]

  // KPI configurations
  const kpis = [
    { title: "TOTAL ENQUIRIES", value: "26", icon: Users, trend: "+8 this month", isPremium: false, link: "/enquiries" },
    { title: "PROFILE VIEWS", value: "142", icon: Eye, trend: "+23 this week", isPremium: false, link: "/site-manager/analytics" },
    { title: "LEADS THIS MONTH", value: "14", icon: TrendingUp, trend: "+3 today", isPremium: true, link: "/leads" },
    { title: "FEE COLLECTION", value: "₹1,24,500", icon: IndianRupee, trend: "+8% vs last month", isPremium: true, link: "/fee-management" },
    { title: "CONVERSION RATE", value: "34%", icon: BarChart2, trend: "+5% this month", isPremium: true, link: "/reports" },
    {
      title: institutionConfig.type === 'institute' ? "ACTIVE ENROLLMENTS" : "ACTIVE STUDENTS",
      value: "48",
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

  // Sidebar navigation render component
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Top Brand Section */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-[#1565D8]">
          <Shield className="w-8 h-8 fill-[#1565D8]" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="text-[15px] font-bold text-slate-800 truncate leading-tight">
            Prince Matriculation
          </h1>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">School Admin Portal</span>
        </div>
      </div>
      <div className="border-b border-slate-100 mt-4 mb-4 mx-4" />

      {/* Navigation list */}
      <div className="flex-1 px-2 overflow-y-auto space-y-1">
        {/* Dashboard */}
        <button
          onClick={() => setActiveNav("Dashboard")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeNav === "Dashboard"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
          <LayoutDashboard className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span>Dashboard</span>
        </button>

        {/* Site Manager */}
        <button
          onClick={() => setActiveNav("Site Manager")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeNav === "Site Manager"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
          <Globe className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span>Site Manager</span>
        </button>

        {/* Sales & Marketing (Collapsible) */}
        <div>
          <button
            onClick={() => setSalesMarketingOpen(!salesMarketingOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="size-[18px] shrink-0" strokeWidth={1.5} />
              <span>Sales & Marketing</span>
            </div>
            <ChevronDown className={`size-[14px] transition-transform duration-200 ${salesMarketingOpen ? 'rotate-180' : ''}`} />
          </button>

          {salesMarketingOpen && (
            <div className="pl-8 pr-2 py-1">
              <button
                onClick={() => setActiveNav("Lead Management")}
                className={`w-full flex items-center gap-3 py-2 text-sm font-medium text-left transition-all ${activeNav === "Lead Management" ? 'text-[#1565D8] font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <LineChart className="size-[16px] shrink-0" strokeWidth={1.5} />
                <span>Lead Management</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Admission/Enrolment/Enquiry module */}
        <button
          onClick={() => setActiveNav("Module Management")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeNav === "Module Management"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
          <ClipboardList className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span className="truncate">{moduleTitle}</span>
        </button>

        {/* Student Management */}
        <button
          onClick={() => setActiveNav("Student Management")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeNav === "Student Management"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
          <Users className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span>Student Management</span>
        </button>

        {/* Fee Management */}
        <button
          onClick={() => setActiveNav("Fee Management")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeNav === "Fee Management"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
          <CreditCard className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span>Fee Management</span>
        </button>

        {/* User & Role Management */}
        <button
          onClick={() => setActiveNav("User & Role Management")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeNav === "User & Role Management"
              ? 'bg-blue-50 text-[#1565D8] font-semibold'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
        >
          <UserCog className="size-[18px] shrink-0" strokeWidth={1.5} />
          <span>User & Role Management</span>
        </button>
      </div>

      {/* Sidebar Footer - Plan Status */}
      <div className="mt-auto pt-4 border-t border-slate-100 p-4 bg-slate-50/50 flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">PLAN STATUS</span>
        <Badge className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full w-fit hover:bg-amber-100 border-0 shadow-none">
          Free Plan
        </Badge>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Unlock all premium features like Lead automation & fee collections.
        </p>
        <Button className="w-full bg-[#1565D8] text-white text-sm font-semibold py-2.5 h-auto rounded-lg mt-2 hover:bg-blue-700 transition duration-200">
          Upgrade to Premium
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex relative font-sans antialiased select-none">
      {/* 1. FIXED LEFT SIDEBAR (Desktop) */}
      <aside className="hidden md:flex w-64 fixed inset-y-0 left-0 border-r border-slate-100 bg-white z-30 shadow-sm flex-col">
        <SidebarContent />
      </aside>

      {/* MOBILE SIDEBAR MODAL OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 max-w-xs bg-white h-full shadow-2xl flex flex-col">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* TOP HEADER BAR */}
        <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 md:hidden"
            >
              <X className="w-5 h-5 hidden" />
              <Plus className="w-5 h-5 rotate-45 transform" /> {/* Acts as Menu indicator */}
            </button>
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight truncate">
                Welcome to {institutionConfig.name}!
              </h2>
              <p className="text-xs text-slate-400 truncate leading-relaxed">
                {institutionConfig.type === 'school' && "Here's what's happening at your school today."}
                {institutionConfig.type === 'institute' && "Here's what's happening at your institute today."}
                {institutionConfig.type === 'learning_center' && "Here's what's happening today."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Pill Links (Profile Completed State) */}
            {profileCompletion === 100 && (
              <div className="hidden lg:flex items-center gap-2">
                <button className="text-xs font-medium text-slate-500 border border-slate-200 rounded-full px-3 py-1 hover:bg-slate-50 transition">
                  ⚙ Manage Profile
                </button>
                <button className="text-xs font-medium text-slate-500 border border-slate-200 rounded-full px-3 py-1 hover:bg-slate-50 transition">
                  📋 Update Listing
                </button>
              </div>
            )}

            {/* Global Search Bar */}
            <div className="relative hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 w-64">
              <Search className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-400 w-full"
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

        {/* TRIAL BANNER */}
        {trialBannerVisible && (
          <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex items-center justify-between gap-4 animate-fade-in w-full">
            <div className="flex items-center min-w-0">
              <Crown className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={1.5} />
              <p className="text-sm text-amber-800 font-medium ml-2 truncate leading-relaxed">
                🎉 7-Day Free Trial of Vidhyaan Premium is active! Unlock advanced campaigns, invoicing, and reports.{" "}
                <span className="text-[#92400E] font-bold">Trial ends in 7 days.</span>
              </p>
            </div>
            <div className="flex items-center shrink-0">
              <span className="text-sm font-semibold text-[#1565D8] underline cursor-pointer mr-4 hover:text-blue-700">
                See features
              </span>
              <Button className="bg-[#1565D8] text-white text-sm font-semibold px-5 py-2 h-9 rounded-lg hover:bg-blue-700 transition duration-200">
                Activate Premium
              </Button>
              <button
                onClick={() => setTrialBannerVisible(false)}
                className="p-1 rounded text-amber-500 hover:text-amber-700 ml-4 transition"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* MAIN CONTAINER CONTENT */}
        <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* WELCOME / PROFILE COMPLETION BLOCK — two-state */}

          {/* STATE 1: Onboarding (profileCompletion < 100) */}
          {profileCompletion < 100 && (
            <Card className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 border-l-4 border-l-[#1565D8]">
              <div className="flex items-start justify-between gap-8">
                {/* LEFT: Heading + Subtext */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Welcome to Vidhyaan, {institutionConfig.name}!
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-500 leading-relaxed max-w-lg">
                    {"Here's your Premium dashboard. Everything is live during your 7-day trial. Complete your profile to get discovered by parents."}
                  </p>
                </div>

                {/* RIGHT: Progress bar */}
                <div className="min-w-[300px] shrink-0">
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
            <div className="bg-green-50 border border-green-100 rounded-xl px-6 py-3 flex items-center justify-between h-[52px]">
              {/* LEFT: icon + school name + divider + badge */}
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className="text-green-600 flex-shrink-0"
                  size={18}
                  strokeWidth={2}
                />
                <span className="text-sm font-semibold text-slate-700">
                  {institutionConfig.name}
                </span>
                <span className="text-slate-300 mx-1">·</span>
                <span className="bg-green-100 text-green-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  ✓ Profile 100% Complete
                </span>
              </div>

              {/* RIGHT: action pill buttons */}
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 cursor-pointer">
                  <Settings size={12} strokeWidth={2} />
                  Manage Profile
                </button>
                <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 cursor-pointer">
                  <LayoutList size={12} strokeWidth={2} />
                  Update Listing
                </button>
                <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-[#1565D8] bg-white text-[#1565D8] hover:bg-blue-50 transition-all duration-200 cursor-pointer">
                  <Eye size={12} strokeWidth={2} />
                  Preview Listing →
                </button>
              </div>
            </div>
          )}

          {/* KPI CARDS ROW */}
          <section className="grid grid-cols-6 gap-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div
                  key={kpi.title}
                  className="min-w-0 w-full min-h-[160px] bg-white rounded-xl border border-slate-100 shadow-sm p-5 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all duration-200 relative group flex flex-col justify-between"
                >
                  {/* Icon top-left */}
                  <div className="text-slate-400 group-hover:text-[#1565D8] transition-colors">
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>

                  {/* Badge + Arrow co-located top-right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {kpi.isPremium ? (
                      <div className="bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" strokeWidth={1.5} />
                        <span>Premium</span>
                      </div>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Free
                      </span>
                    )}
                    <ArrowUpRight
                      size={14}
                      className="text-slate-300 group-hover:text-[#1565D8] transition-colors"
                      strokeWidth={1.5}
                    />
                  </div>

                  <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mt-4 block">
                    {kpi.title}
                  </span>

                  <h3
                    className="text-[32px] font-bold text-slate-800 tracking-tight leading-tight mt-1"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {kpi.value}
                  </h3>

                  <p className={`text-sm font-medium mt-2 ${kpi.trend.includes('No') ? 'text-slate-400' : 'text-green-600'}`}>
                    {kpi.trend}
                  </p>
                </div>
              )
            })}
          </section>

          {/* COMPACT PIPELINE ROW */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT Column: Enquiry & Enrolment Pipeline */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold text-slate-800 tracking-tight">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Enquiries</span>
                    <h4 className="text-2xl font-bold text-slate-800 mt-1">26</h4>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 block">In Process</span>
                    <h4 className="text-2xl font-bold text-slate-800 mt-1">19</h4>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 block">Enrolled</span>
                    <h4 className="text-2xl font-bold text-slate-800 mt-1">17</h4>
                    <span className="text-xs text-green-600 font-semibold mt-0.5 block">65%</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500 block">Rejected</span>
                    <h4 className="text-2xl font-bold text-slate-800 mt-1">10</h4>
                    <span className="text-xs text-red-500 font-semibold mt-0.5 block">27%</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 text-center mt-4">
                  Conversion Rate: 65% · Drop-off: 27% · Active in Pipeline: 19
                </p>

                {/* SECTION A — PIPELINE STAGES BAR */}
                <div className="mt-4 px-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Pipeline Stages
                  </p>
                  <div className="flex items-end gap-1.5 w-full">
                    {[
                      { name: 'Enquiry',     count: 26, color: 'bg-slate-400'   },
                      { name: 'Contacted',   count: 8,  color: 'bg-blue-400'    },
                      { name: 'Application', count: 7,  color: 'bg-blue-500'    },
                      { name: 'Docs',        count: 4,  color: 'bg-indigo-500'  },
                      { name: 'Interview',   count: 2,  color: 'bg-violet-500'  },
                      { name: 'Payment',     count: 6,  color: 'bg-amber-500'   },
                      { name: 'Enrolled',    count: 17, color: 'bg-green-500'   },
                    ].map((stage, idx, arr) => (
                      <React.Fragment key={stage.name}>
                        <div className="flex flex-col items-center flex-1">
                          <span className="text-[11px] font-bold text-slate-700 mb-1">
                            {stage.count}
                          </span>
                          <div
                            className={`w-full rounded-t-sm ${stage.color} opacity-80`}
                            style={{ height: `${(stage.count / 26) * 48}px`, minHeight: '6px' }}
                          />
                          <span className="text-[9px] font-medium text-slate-400 mt-1.5 text-center leading-tight w-full truncate px-0.5">
                            {stage.name}
                          </span>
                        </div>
                        {idx < arr.length - 1 && (
                          <ChevronRight size={10} className="text-slate-200 mb-4 shrink-0" strokeWidth={2} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* SECTION B — MINI COMPARISON ROW */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">
                    This Month vs Last Month
                  </p>
                  <div className="flex items-center gap-2">
                    {/* Chip 1 — Enquiries */}
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 flex-1">
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
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 flex-1">
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
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 flex-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Avg. Convert</span>
                      <div className="ml-auto text-right">
                        <div className="text-sm font-bold text-slate-800">12 days</div>
                        <div className="flex items-center justify-end mt-0.5">
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                            ↓ 3 days faster
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between items-center">
                  <span className="text-sm font-semibold text-[#1565D8] cursor-pointer hover:underline">
                    View {moduleTitle} →
                  </span>

                  {institutionConfig.type === 'school' && (
                    <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-full">
                      Interview pending: 2
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT Column: Lead Overview */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-slate-800 tracking-tight">
                    Lead Overview
                  </h3>
                  <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-3 py-1 rounded-full">
                    Free
                  </span>
                </div>

                {/* Temporal stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center bg-slate-50 rounded-lg p-3">
                    <h4 className="text-2xl font-bold text-slate-800">3</h4>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 block">Today</span>
                  </div>
                  <div className="text-center bg-slate-50 rounded-lg p-3">
                    <h4 className="text-2xl font-bold text-slate-800">8</h4>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 block">This Week</span>
                  </div>
                  <div className="text-center bg-slate-50 rounded-lg p-3">
                    <h4 className="text-2xl font-bold text-slate-800">14</h4>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 mt-1 block">This Month</span>
                  </div>
                </div>

                {/* Lead limit cap */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-500">Free Lead Limit</span>
                    <span className="text-xs font-bold text-slate-700">{leadsUsed} / {leadsMax}</span>
                  </div>
                  <Progress value={(leadsUsed / leadsMax) * 100} className="h-2 w-full bg-slate-100" indicatorClassName="bg-amber-400" />

                  {leadsUsed >= 20 && leadsUsed < 25 && (
                    <p className="text-xs text-amber-700 font-medium mt-1.5 leading-relaxed">
                      ⚠ {leadsUsed} of 25 free leads used. Upgrade for unlimited leads.
                    </p>
                  )}
                  {leadsUsed === 25 && (
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
                  {[
                    { label: "New", color: "bg-blue-500", pct: 14, count: "2 (14%)" },
                    { label: "Contacted", color: "bg-amber-400", pct: 14, count: "2 (14%)" },
                    { label: "Converted", color: "bg-green-500", pct: 55, count: "17 (55%)" },
                    { label: "Rejected", color: "bg-red-400", pct: 32, count: "10 (32%)" }
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="w-20 text-xs font-medium text-slate-600 shrink-0">{row.label}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className={`${row.color} rounded-full h-full`} style={{ width: `${row.pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-16 text-right shrink-0">{row.count}</span>
                    </div>
                  ))}
                </div>

                {/* Source chips */}
                <div className="mt-4 flex gap-2 flex-wrap">
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
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex justify-between items-center text-xs">
                    <div className="flex items-center text-amber-800 font-semibold min-w-0">
                      <TriangleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mr-2" strokeWidth={1.5} />
                      <span className="truncate">{unassignedLeads} leads need counsellor assignment</span>
                    </div>
                    <span className="font-bold text-amber-700 cursor-pointer shrink-0 hover:underline">
                      Assign Now →
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 mt-4 pt-4">
                <span className="text-sm font-semibold text-[#1565D8] cursor-pointer hover:underline">
                  Go to Lead Management →
                </span>
              </div>
            </div>
          </section>

          {/* SECTION A — 2-COLUMN ROW */}
          <section className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-stretch">
            {/* Column 1: Fee Overview */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow duration-300 h-full">
              {/* Header — full width */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  FEE OVERVIEW
                </span>
                <div className="bg-amber-100 text-amber-700 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <Crown size={12} className="text-amber-500 fill-amber-500 mr-1" strokeWidth={1.5} />
                  <span>Premium</span>
                </div>
              </div>

              {/* Two column content */}
              <div className="flex gap-0 flex-1">
                {/* Left: money stats */}
                <div className="flex flex-col justify-between min-w-[160px]">
                  <div className="space-y-3">
                    {/* Stat 1 — COLLECTED */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">COLLECTED</span>
                      <span className="text-[10px] font-medium text-slate-400 mb-2">This Month</span>
                      <span className="text-2xl font-bold text-slate-800 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        ₹{feeData.collected.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Stat 2 — OVERDUE */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">OVERDUE</span>
                      <div className="flex items-center gap-1 mb-2 text-[10px] font-medium text-red-400">
                        <TriangleAlert size={10} className="text-red-400" />
                        <span>Action Needed</span>
                      </div>
                      <span className="text-2xl font-bold text-red-600 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        ₹{feeData.overdue.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Stat 3 — UPCOMING */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">UPCOMING</span>
                      <span className="text-[10px] font-medium text-slate-400 mb-2">Next 7 Days</span>
                      <span className="text-2xl font-bold text-slate-800 leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        ₹{feeData.upcoming.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px bg-slate-100 self-stretch mx-5 flex-shrink-0" />

                {/* Right: student status */}
                <div className="flex-1 flex flex-col justify-between pl-2">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                      STUDENT FEE STATUS
                    </h4>

                    <div className="space-y-4">
                      {/* ROW 1 — Paid on time */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-green-500" />
                            <span className="text-sm font-medium text-slate-600">Paid on time</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{feeData.students.paidOnTime} students</span>
                            <span className="text-[11px] text-slate-400 font-medium">(52%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-green-500 rounded-full h-2 transition-all duration-500" style={{ width: '52%', minWidth: '4px' }} />
                        </div>
                      </div>

                      {/* ROW 2 — Overdue */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-red-500" />
                            <span className="text-sm font-medium text-slate-600">Overdue</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{feeData.students.overdue} students</span>
                            <span className="text-[11px] text-slate-400 font-medium">(13%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-red-500 rounded-full h-2 transition-all duration-500" style={{ width: '13%', minWidth: '4px' }} />
                        </div>
                      </div>

                      {/* ROW 3 — Due in 7 days */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-amber-400" />
                            <span className="text-sm font-medium text-slate-600">Due in 7 days</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{feeData.students.upcomingDues} students</span>
                            <span className="text-[11px] text-slate-400 font-medium">(35%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-amber-400 rounded-full h-2 transition-all duration-500" style={{ width: '35%', minWidth: '4px' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NUDGE CARD */}
                  {feeData.students.overdue > 0 && (
                    <div className="mt-auto bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <TriangleAlert size={16} className="text-red-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-red-700">
                            {feeData.students.overdue} students have overdue fees
                          </p>
                          <p className="text-xs text-red-400 font-medium mt-0.5">
                            Total outstanding: ₹{feeData.overdue.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <button className="bg-white border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer flex-shrink-0">
                        Send Reminder →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer — full width */}
              <div className="mt-auto pt-4 border-t border-slate-100">
                <span className="text-sm font-semibold text-[#1565D8] hover:underline cursor-pointer">
                  Go to Fee Management →
                </span>
              </div>
            </div>

            {/* Column 2: Upcoming Events */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow duration-300 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
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
                    <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="bg-slate-800 rounded-xl w-12 h-12 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
                          {ev.date.split(" ")[0]}
                        </span>
                        <span className="text-lg font-bold text-white leading-none mt-0.5">
                          {ev.date.split(" ")[1]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-700 truncate leading-tight">
                          {ev.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${ev.color}`}>
                            {ev.type}
                          </span>
                          {'time' in ev && ev.time && (
                            <span className="text-[10px] text-slate-400 font-medium">
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
                +2 more events this month
              </p>

              <div className="mt-auto pt-4 border-t border-slate-100">
                <span className="text-sm font-semibold text-[#1565D8] hover:underline cursor-pointer">
                  View Calendar →
                </span>
              </div>
            </div>
          </section>

          {/* SECTION B — QUICK ACTIONS SLIM BAR */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 px-6 py-3 mt-6 w-full overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex-shrink-0 whitespace-nowrap">
              QUICK ACTIONS
            </span>

            <div className="w-px h-5 bg-slate-200 mx-1 flex-shrink-0" />

            {/* Button 1 */}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap flex-shrink-0 cursor-pointer">
              <Plus size={13} className="text-slate-500" />
              <span>Add Lead</span>
            </button>

            {/* Button 2 */}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap flex-shrink-0 cursor-pointer">
              <UserPlus size={13} className="text-slate-500" />
              <span>
                {institutionConfig.type === 'school' && "Admission"}
                {institutionConfig.type === 'institute' && "Enrolment"}
                {institutionConfig.type === 'learning_center' && "Enquiry"}
              </span>
            </button>

            {/* Button 3 */}
            {institutionConfig.type !== 'learning_center' && (
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap flex-shrink-0 cursor-pointer">
                <UserCheck size={13} className="text-slate-500" />
                <span>Student</span>
              </button>
            )}

            {/* Button 4 */}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap flex-shrink-0 cursor-pointer">
              <Receipt size={13} className="text-slate-500" />
              <span>Invoice</span>
            </button>

            {/* Button 5 */}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs font-bold text-amber-800 hover:bg-amber-100 transition whitespace-nowrap flex-shrink-0 cursor-pointer">
              <Megaphone size={13} className="text-amber-500" />
              <span>Campaign</span>
              <Crown size={11} className="text-amber-500 ml-0.5" />
            </button>

            {/* Button 6 */}
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap flex-shrink-0 cursor-pointer">
              <Globe size={13} className="text-slate-500" />
              <span>Listing</span>
            </button>

            <div className="w-px h-5 bg-slate-200 ml-auto mr-3 flex-shrink-0" />

            <span className="text-sm font-semibold text-[#1565D8] hover:underline cursor-pointer whitespace-nowrap flex-shrink-0">
              Manage all actions →
            </span>
          </div>

          {/* PREMIUM FEATURES SECTION */}
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-500" strokeWidth={1.5} />
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  Premium Features (Active in 7-Day Trial)
                </h3>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Upgrade before your trial expires to maintain uninterrupted access.
              </p>
            </div>

            {/* Grid of features */}
            <div>
              {/* Row 1: 4 cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                {premiumFeatures.slice(0, 4).map((feat) => {
                  const FeatIcon = feat.icon
                  return (
                    <div
                      key={feat.title}
                      className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition cursor-pointer relative h-full flex flex-col justify-between min-h-[200px] group"
                    >
                      <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" strokeWidth={1.5} />
                        <span>Premium</span>
                      </div>

                      <div>
                        <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                          <FeatIcon className="w-6 h-6 text-[#1565D8]" strokeWidth={1.5} />
                        </div>
                        <h4 className="text-base font-bold text-slate-800">{feat.title}</h4>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{feat.desc}</p>
                      </div>

                      <span className="text-sm font-semibold text-[#1565D8] mt-4 block group-hover:underline">
                        Explore →
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Row 2: centered cards (Last 3 cards, or 2 if learning center hides workflow) */}
              {!(institutionConfig.type === 'learning_center') ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5 max-w-[75%] mx-auto">
                  {premiumFeatures.slice(4).map((feat) => {
                    const FeatIcon = feat.icon
                    return (
                      <div
                        key={feat.title}
                        className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition cursor-pointer relative h-full flex flex-col justify-between min-h-[200px] group"
                      >
                        <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" strokeWidth={1.5} />
                          <span>Premium</span>
                        </div>

                        <div>
                          <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                            <FeatIcon className="w-6 h-6 text-[#1565D8]" strokeWidth={1.5} />
                          </div>
                          <h4 className="text-base font-bold text-slate-800">{feat.title}</h4>
                          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{feat.desc}</p>
                        </div>

                        <span className="text-sm font-semibold text-[#1565D8] mt-4 block group-hover:underline">
                          Explore →
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 max-w-[50%] mx-auto">
                  {premiumFeatures.slice(4).filter(f => !f.isWorkflow).map((feat) => {
                    const FeatIcon = feat.icon
                    return (
                      <div
                        key={feat.title}
                        className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition cursor-pointer relative h-full flex flex-col justify-between min-h-[200px] group"
                      >
                        <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" strokeWidth={1.5} />
                          <span>Premium</span>
                        </div>

                        <div>
                          <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                            <FeatIcon className="w-6 h-6 text-[#1565D8]" strokeWidth={1.5} />
                          </div>
                          <h4 className="text-base font-bold text-slate-800">{feat.title}</h4>
                          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{feat.desc}</p>
                        </div>

                        <span className="text-sm font-semibold text-[#1565D8] mt-4 block group-hover:underline">
                          Explore →
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Upgrade Strip banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-sm font-medium text-slate-700">
                Upgrade to Premium before your trial ends to keep these features.
              </span>
              <Button className="border border-[#1565D8] text-[#1565D8] text-sm font-semibold px-5 py-2 h-auto rounded-lg bg-transparent hover:bg-blue-50 transition duration-200">
                View Premium Plans
              </Button>
            </div>
          </section>

          {/* NOTIFICATIONS + ACTIVITY ROW */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Recent Notifications */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    RECENT NOTIFICATIONS
                  </h3>
                  <span className="text-sm font-semibold text-[#1565D8] cursor-pointer hover:underline">
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
                      <div key={idx} className="flex items-start gap-4 py-4 relative">
                        <div className="bg-blue-50 rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0">
                          <NotifIcon className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="text-sm font-semibold text-slate-800 truncate leading-tight">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {notif.desc}
                          </p>
                          <span className="text-xs text-slate-400 mt-1 inline-block font-normal">
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
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    RECENT ACTIVITY
                  </h3>
                  <span className="text-sm font-semibold text-[#1565D8] cursor-pointer hover:underline">
                    View Full Activity →
                  </span>
                </div>

                <div className="divide-y divide-slate-50">
                  {[
                    { actor: "Saran Kumar", action: "moved Vimal Das to Contacted stage", time: "2 hours ago", letter: "S" },
                    { actor: "Pradeep Kumar", action: "created new admission AT-00020", time: "5 hours ago", letter: "P" },
                    { actor: "Vimal Das", action: "updated fee plan Recurring Fee Plan", time: "1 day ago", letter: "V" }
                  ].map((act, idx) => (
                    <div key={idx} className="flex items-start gap-4 py-4">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {act.letter}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          <span className="font-semibold text-slate-800">{act.actor}</span> {act.action}
                        </p>
                        <span className="text-xs text-slate-400 mt-1 block">
                          {act.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER UPGRADE CTA BLOCK */}
          <section className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1565D8] via-[#1E40AF] to-[#1E3A8A] p-10 relative">
            {/* Decorative Cap Watermark */}
            <div className="absolute right-8 bottom-0 opacity-15 pointer-events-none transform translate-y-1/6 translate-x-1/6">
              <GraduationCap className="w-64 h-64 text-white" strokeWidth={1.0} />
            </div>

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Crown className="w-4 h-4 fill-amber-400 text-amber-400" strokeWidth={1.5} />
                <span className="text-xs font-bold uppercase tracking-[0.15em]">7-DAY FREE TRIAL</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug max-w-lg">
                Premium Trial is Active — Make the most of your 7 days.
              </h3>

              <p className="text-sm text-blue-200 leading-relaxed max-w-lg">
                Access Campaigns, Advanced Reports, Fee Management, Payment Gateway, and more. Upgrade before your trial ends to maintain full access.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Button className="bg-white hover:bg-blue-50 text-[#1565D8] text-sm font-bold px-7 py-6 h-auto rounded-xl shadow-md border-0 flex items-center gap-2">
                  <span>Upgrade to Premium</span>
                  <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={2.0} />
                </Button>
                <button className="bg-transparent hover:bg-white/10 text-white border-2 border-white/40 text-sm font-semibold px-7 py-3 rounded-xl transition">
                  See Pricing Plans
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
