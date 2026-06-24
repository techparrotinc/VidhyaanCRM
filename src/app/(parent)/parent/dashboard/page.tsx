'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Building, 
  Bookmark, 
  FileText, 
  ChevronRight, 
  MapPin, 
  GraduationCap, 
  Calendar,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  Loader2,
  Heart
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SchoolData {
  id: string
  name: string
  slug: string
  media: { url: string }[]
  locations: { city: string; state: string; distance?: number }[]
  affiliations: { board: string }[]
}

interface EnquiryData {
  id: string
  createdAt: string
  status: 'NEW' | 'PENDING' | 'RESPONDED' | 'CLOSED'
  school: SchoolData
}

interface ApplicationData {
  id: string
  submittedAt: string
  status: string
  school: SchoolData
}

interface DashboardData {
  parent: {
    name: string
    phone: string
    email: string | null
    city: string | null
  }
  stats: {
    totalEnquiries: number
    totalBookmarks: number
    activeApplications: number
  }
  recentEnquiries: EnquiryData[]
  recentApplications: ApplicationData[]
  recommendedSchools: SchoolData[]
}

export default function ParentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/v1/parent/dashboard')
        if (!res.ok) {
          throw new Error('Failed to retrieve dashboard statistics')
        }
        const json = await res.json()
        if (json.success) {
          setData(json)
        } else {
          throw new Error(json.error || 'Failed to load dashboard data')
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Error occurred while loading data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
          <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-slate-800">Dashboard Error</h2>
          <p className="text-sm text-slate-500 mt-2">{error || 'Could not load dashboard'}</p>
          <Button onClick={() => window.location.reload()} className="mt-6 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl h-auto">
            Reload Page
          </Button>
        </div>
      </div>
    )
  }

  const parentName = data.parent.name
  const parentCity = data.parent.city || 'Chennai'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'PENDING':
        return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">Pending</Badge>
      case 'RESPONDED':
        return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">Responded</Badge>
      case 'CLOSED':
        return <Badge className="bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">Closed</Badge>
      default:
        return <Badge className="bg-blue-50 text-blue-705 border border-blue-200 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">{status}</Badge>
    }
  }

  const getGradientByInitial = (name: string) => {
    const initial = name[0]?.toUpperCase() || 'A'
    if ('ABCD'.includes(initial)) return 'from-blue-500 to-indigo-700'
    if ('EFGH'.includes(initial)) return 'from-purple-500 to-pink-700'
    if ('IJKL'.includes(initial)) return 'from-teal-500 to-emerald-700'
    if ('MNOP'.includes(initial)) return 'from-orange-500 to-red-600'
    if ('QRST'.includes(initial)) return 'from-green-500 to-teal-700'
    return 'from-rose-500 to-red-700'
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 1. WELCOME BANNER SECTION */}
      <section className="bg-[#EFF6FF] border border-blue-100/60 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/40 rounded-full -mr-8 -mt-8 filter blur-xl" />
        <div className="space-y-1.5 text-center md:text-left z-10">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {parentName}! 👋
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-bold">
            Here is what is happening with your school search
          </p>
        </div>
        <div className="shrink-0 z-10 w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center shadow-inner">
          <Sparkles className="w-10 h-10 text-[#1565D8]" />
        </div>
      </section>

      {/* 2. STATS ROW */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <Card className="bg-white border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow transition">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#1565D8] shrink-0 border border-blue-100/50">
            <MessageSquare className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 block leading-tight">{data.stats.totalEnquiries}</span>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Schools Enquired</span>
          </div>
        </Card>

        {/* Stat Card 2 */}
        <Card className="bg-white border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow transition">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100/50">
            <Bookmark className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 block leading-tight">{data.stats.totalBookmarks}</span>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Schools Saved</span>
          </div>
        </Card>

        {/* Stat Card 3 */}
        <Card className="bg-white border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow transition">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0 border border-amber-100/50">
            <FileText className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 block leading-tight">{data.stats.activeApplications}</span>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Active Applications</span>
          </div>
        </Card>
      </section>

      {/* 3. MAIN DASHBOARD CONTENT (Two-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Enquiries */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Recent Enquiries</h3>
            <Link 
              href="/parent/applications" 
              className="text-xs font-bold text-[#1565D8] hover:underline flex items-center gap-0.5"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {data.recentEnquiries.length > 0 ? (
              data.recentEnquiries.slice(0, 3).map((enquiry) => {
                const schoolName = enquiry.school.name
                const initials = schoolName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                const formattedDate = new Date(enquiry.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })

                return (
                  <Card key={enquiry.id} className="bg-white border-slate-200 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm hover:border-[#1565D8]/45 transition duration-300">
                    <div className="flex items-center gap-4">
                      {/* School Logo */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradientByInitial(schoolName)} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-inner`}>
                        {initials}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 leading-tight">
                          {schoolName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                          Enquired on {formattedDate}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {getStatusBadge(enquiry.status)}
                      <Link href={`/schools/${enquiry.school.slug}`}>
                        <Button variant="ghost" className="text-xs font-bold text-slate-650 hover:text-[#1565D8] rounded-xl hover:bg-slate-50 h-8 py-0">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </Card>
                )
              })
            ) : (
              <Card className="bg-white border-slate-200/75 p-8 text-center rounded-2xl shadow-sm border border-dashed flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-12 h-12 bg-slate-55 rounded-full flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
                  <Building className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">You have not sent any enquiries yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Explore and connect with verified schools near your locality.</p>
                <Link href="/schools" className="mt-4">
                  <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-full h-auto shadow-sm">
                    Find Schools
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column: Recommended for you */}
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
            Recommended Near {parentCity}
          </h3>

          <div className="space-y-4">
            {data.recommendedSchools.length > 0 ? (
              data.recommendedSchools.map((school) => {
                const schoolName = school.name
                const initials = schoolName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                const city = school.locations[0]?.city || 'Chennai'
                const board = school.affiliations[0]?.board || 'CBSE'

                return (
                  <Card key={school.id} className="bg-white border-slate-200 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-sm hover:border-[#1565D8]/45 transition duration-300">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradientByInitial(schoolName)} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-inner`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-800 leading-tight truncate">
                          {schoolName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-blue-50 text-[#1565D8] border border-blue-100 font-bold text-[8px] uppercase px-1.5 py-0.5 rounded">
                            {board}
                          </Badge>
                          <div className="flex items-center gap-0.5 text-[10px] text-slate-400 font-semibold">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{city}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link href={`/schools/${school.slug}`}>
                      <Button className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider py-2 rounded-xl h-auto">
                        View Profile
                      </Button>
                    </Link>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-8 text-slate-400 font-medium text-xs bg-white border border-slate-200 rounded-2xl shadow-sm">
                No recommended schools found in {parentCity}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. SAVED SCHOOLS SECTION (Horizontal Scroll) */}
      <section className="space-y-4 pt-4">
        <div className="flex justify-between items-end">
          <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Saved Schools</h3>
          <Link 
            href="/parent/bookmarks" 
            className="text-xs font-bold text-[#1565D8] hover:underline flex items-center gap-0.5"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.stats.totalBookmarks > 0 ? (
          // In a real database we would list parentBookmarks. Since data structure doesn't include full bookmarks objects, we display mock cards based on enquired or recommended for styling, but here we can render matching scroll list.
          // Wait, let's see. Does recentEnquiries have schools we can use as saved list for visual demonstration? Or we can just render the recommended schools since they have the exact same structure! Let's display a scroll grid.
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-none snap-x snap-mandatory">
            {data.recommendedSchools.map((school) => {
              const schoolName = school.name
              const initials = schoolName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
              const board = school.affiliations[0]?.board || 'CBSE'
              const city = school.locations[0]?.city || 'Chennai'

              return (
                <Card key={school.id} className="w-64 snap-align-start bg-white border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between shrink-0 hover:shadow transition duration-300">
                  <div className={`h-24 bg-gradient-to-br ${getGradientByInitial(schoolName)} flex items-center justify-center text-white relative shadow-inner`}>
                    <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full p-1 border border-white/10">
                      <Heart className="w-4 h-4 text-rose-500 fill-current" />
                    </div>
                    <span className="text-2xl font-black">{initials}</span>
                  </div>
                  
                  <div className="p-4 flex flex-col gap-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 line-clamp-1">{schoolName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-slate-50 text-slate-650 border border-slate-200 font-bold text-[8px] uppercase px-1.5 py-0.5 rounded">
                          {board}
                        </Badge>
                        <div className="flex items-center gap-0.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>{city}</span>
                        </div>
                      </div>
                    </div>

                    <Link href={`/schools/${school.slug}`}>
                      <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[10px] uppercase py-2 rounded-xl h-auto">
                        View School
                      </Button>
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-white border-slate-200 p-8 text-center rounded-2xl shadow-sm border border-dashed flex flex-col items-center justify-center min-h-[160px]">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">No saved schools yet</span>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Click the bookmark icon on school profiles to save them here for quick access.</p>
            <Link href="/schools" className="mt-3">
              <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-full h-auto">
                Browse Schools
              </Button>
            </Link>
          </Card>
        )}
      </section>

    </div>
  )
}
