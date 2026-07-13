'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Baby,
  Bookmark,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  MapPin,
  MessageSquare,
  Search,
  Star
} from 'lucide-react'

interface SchoolData {
  id: string
  name: string
  slug: string
  media: { url: string }[]
  locations: { city: string; state: string }[]
  affiliations: { board: string }[]
}

interface EnquiryData {
  id: string
  createdAt: string
  status: string
  school: SchoolData
}

export interface DiscoveryStats {
  totalEnquiries: number
  totalBookmarks: number
  activeApplications: number
  kidsCount: number
  admittedApplications: number
}

interface Props {
  parentName: string
  parentCity: string
  stats: DiscoveryStats
  recentEnquiries: EnquiryData[]
  recommendedSchools: SchoolData[]
}

const SCHOOL_GRADIENTS = [
  'from-[#1565D8] to-indigo-700',
  'from-violet-500 to-fuchsia-600',
  'from-teal-500 to-emerald-600',
  'from-orange-500 to-rose-500'
]

export default function DiscoveryDashboard({
  parentName,
  parentCity,
  stats,
  recentEnquiries,
  recommendedSchools
}: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = parentName.split(' ')[0]

  const steps = [
    {
      title: 'Create your account',
      detail: 'Welcome to Vidhyaan!',
      done: true,
      href: '/parent/profile',
      cta: 'Done'
    },
    {
      title: 'Add your child',
      detail: 'Tell us who you’re finding a school for',
      done: stats.kidsCount > 0,
      href: '/parent/profile',
      cta: 'Add child'
    },
    {
      title: 'Explore schools & enquire',
      detail: `Browse verified schools near ${parentCity}`,
      done: stats.totalEnquiries > 0,
      href: '/schools',
      cta: 'Find schools'
    },
    {
      title: 'Submit an application',
      detail: 'Apply online in minutes',
      done: stats.activeApplications > 0 || stats.admittedApplications > 0,
      href: stats.totalEnquiries > 0 ? '/parent/applications' : '/schools',
      cta: 'Apply'
    },
    {
      title: 'Track your admission',
      detail: 'Follow every step until admission',
      done: stats.admittedApplications > 0,
      href: '/parent/applications',
      cta: 'Track'
    }
  ]
  const doneCount = steps.filter((s) => s.done).length
  const nextIdx = steps.findIndex((s) => !s.done)

  return (
    <div className="space-y-7 -mt-2">
      {/* ===== GREETING ===== */}
      <div>
        <p className="text-xs font-semibold text-slate-400">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-[26px] font-black tracking-tight text-slate-900 mt-0.5">
          {greeting}, {firstName} <span className="align-middle">👋</span>
        </h1>
        <p className="text-sm font-semibold text-slate-400 mt-1">
          Let&apos;s find your child a great school
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {/* ================= LEFT ================= */}
        <div className="lg:col-span-2 space-y-7">
          {/* ===== JOURNEY CARD ===== */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <h3 className="text-base font-black text-slate-900">Your admission journey</h3>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {steps.map((s, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        s.done ? 'w-5 bg-[#1565D8]' : i === nextIdx ? 'w-5 bg-blue-200' : 'w-2.5 bg-slate-100'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-black text-slate-400">
                  {doneCount}/{steps.length}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {steps.map((step, i) => {
                const isNext = i === nextIdx
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 px-5 py-4 ${
                      isNext ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
                        step.done
                          ? 'bg-[#1565D8] text-white'
                          : isNext
                            ? 'bg-white text-[#1565D8] border-2 border-[#1565D8]'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {step.done ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-bold ${
                          step.done ? 'text-slate-400 line-through decoration-slate-300' : isNext ? 'text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        {step.title}
                      </p>
                      {!step.done && (
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5 truncate">{step.detail}</p>
                      )}
                    </div>
                    {isNext && (
                      <Link
                        href={step.href}
                        className="shrink-0 flex items-center gap-1.5 bg-[#1565D8] hover:bg-blue-700 text-white text-xs font-black rounded-xl px-4 py-2.5 transition shadow-md shadow-blue-200/60"
                      >
                        {step.cta} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ===== TOP PICKS CAROUSEL ===== */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-slate-900">Top picks near {parentCity}</h3>
              <Link
                href="/schools"
                className="text-[11px] font-bold text-[#1565D8] hover:underline flex items-center gap-0.5"
              >
                See all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {recommendedSchools.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none snap-x">
                {recommendedSchools.map((school, idx) => {
                  const initials = school.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
                  const city = school.locations[0]?.city || parentCity
                  const board = school.affiliations[0]?.board || ''
                  const img = school.media[0]?.url
                  return (
                    <Link
                      key={school.id}
                      href={`/schools/${school.slug}`}
                      className="w-[240px] shrink-0 snap-start rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
                    >
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={school.name} className="h-28 w-full object-cover" />
                      ) : (
                        <div
                          className={`h-28 bg-gradient-to-br ${SCHOOL_GRADIENTS[idx % SCHOOL_GRADIENTS.length]} flex items-center justify-center`}
                        >
                          <span className="text-2xl font-black text-white/90">{initials}</span>
                        </div>
                      )}
                      <div className="p-4">
                        <p className="text-[13px] font-black text-slate-800 line-clamp-1">{school.name}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {board && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#1565D8] bg-blue-50 border border-blue-100 rounded-md px-1.5 py-0.5">
                              {board}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-400 font-bold">
                            <MapPin className="w-3 h-3" /> {city}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
                {/* Browse-more tail card */}
                <Link
                  href="/schools"
                  className="w-[140px] shrink-0 snap-start rounded-3xl border-2 border-dashed border-slate-200 hover:border-[#1565D8]/40 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-[#1565D8] transition"
                >
                  <Search className="w-6 h-6" />
                  <span className="text-[11px] font-black">Browse all</span>
                </Link>
              </div>
            ) : (
              <Link
                href="/schools"
                className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-[#1565D8] to-indigo-600 text-white p-5 shadow-lg shadow-blue-200/50 hover:shadow-blue-300/50 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black">Explore schools &amp; learning centres</p>
                    <p className="text-[11px] text-white/75 font-semibold">Verified profiles, reviews and online applications</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 shrink-0" />
              </Link>
            )}
          </div>

          {/* ===== RECENT ENQUIRIES (only when they exist) ===== */}
          {recentEnquiries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-black text-slate-900">Recent enquiries</h3>
                <Link
                  href="/parent/applications"
                  className="text-[11px] font-bold text-[#1565D8] hover:underline flex items-center gap-0.5"
                >
                  All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
                {recentEnquiries.slice(0, 3).map((enq, idx) => (
                  <Link
                    key={enq.id}
                    href={`/schools/${enq.school.slug}`}
                    className="flex items-center gap-3.5 p-4 hover:bg-slate-50/70 transition"
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${SCHOOL_GRADIENTS[idx % SCHOOL_GRADIENTS.length]} text-white text-xs font-black flex items-center justify-center shrink-0`}
                    >
                      {enq.school.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-800 truncate">{enq.school.name}</p>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        Enquired {new Date(enq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[9px] font-black uppercase tracking-wider rounded-full px-2.5 py-1 ${
                        enq.status === 'RESPONDED'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}
                    >
                      {enq.status === 'RESPONDED' ? 'Responded' : 'Pending'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT RAIL ================= */}
        <div className="space-y-7">
          {/* Activity summary */}
          <div className="rounded-3xl bg-slate-900 text-white p-5 shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">My activity</p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Link href="/parent/applications" className="text-center rounded-2xl bg-white/5 hover:bg-white/10 transition py-3">
                <MessageSquare className="w-4 h-4 mx-auto text-blue-300" />
                <p className="text-xl font-black mt-1.5">{stats.totalEnquiries}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Enquiries</p>
              </Link>
              <Link href="/parent/applications" className="text-center rounded-2xl bg-white/5 hover:bg-white/10 transition py-3">
                <FileText className="w-4 h-4 mx-auto text-violet-300" />
                <p className="text-xl font-black mt-1.5">{stats.activeApplications}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Applied</p>
              </Link>
              <Link href="/parent/bookmarks" className="text-center rounded-2xl bg-white/5 hover:bg-white/10 transition py-3">
                <Bookmark className="w-4 h-4 mx-auto text-amber-300" />
                <p className="text-xl font-black mt-1.5">{stats.totalBookmarks}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Saved</p>
              </Link>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/schools"
              className="group flex flex-col items-center gap-2 rounded-3xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1565D8] flex items-center justify-center group-hover:scale-105 transition">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-600">Find Schools</span>
            </Link>
            <Link
              href="/parent/profile"
              className="group flex flex-col items-center gap-2 rounded-3xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="relative w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-105 transition">
                <Baby className="w-5 h-5" />
                {stats.kidsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {stats.kidsCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-600">My Kids</span>
            </Link>
            <Link
              href="/parent/applications"
              className="group flex flex-col items-center gap-2 rounded-3xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center group-hover:scale-105 transition">
                <ClipboardList className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-600">Applications</span>
            </Link>
            <Link
              href="/parent/reviews"
              className="group flex flex-col items-center gap-2 rounded-3xl bg-white border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center group-hover:scale-105 transition">
                <Star className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-600">My Reviews</span>
            </Link>
          </div>

          {/* Tip card */}
          <div className="rounded-3xl bg-blue-50 border border-blue-100 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1565D8]">Did you know?</p>
            <p className="text-[13px] font-semibold text-slate-600 leading-relaxed mt-2">
              Once your child&apos;s school links them to your account, this page turns into a live
              dashboard — daily schedule, attendance, fees and school updates in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
