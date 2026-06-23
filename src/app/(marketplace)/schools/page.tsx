"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  Star,
  Bookmark,
  Award,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Building,
  BookOpen,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface School {
  id: string
  name: string
  slug: string
  institutionType: string
  avgRating: number
  reviewCount: number
  admissionOpen: boolean
  avgResponseHours: number | null
  isFeatured?: boolean
  _count?: {
    enquiries: number
  }
  locations: Array<{
    city: string
    state: string
    addressLine: string
  }>
  media: Array<{
    url: string
  }>
  affiliations: Array<{
    affiliationNo: string
    board: string
  }>
}

export default function SchoolsSearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })

  // Read initial filters from URL params
  const [filters, setFilters] = useState({
    search: searchParams.get('search') ?? '',
    city: searchParams.get('city') ?? '',
    board: searchParams.get('board') ?? '',
    admissionOpen: searchParams.get('admissionOpen') ?? ''
  })

  const [sortOrder, setSortOrder] = useState('relevance')
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const fetchSchools = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.city) params.append('city', filters.city)
      if (filters.board) params.append('board', filters.board)
      if (filters.admissionOpen === 'true') params.append('admissionOpen', 'true')
      if (sortOrder) params.append('sort', sortOrder)
      params.append('page', String(pagination.page))

      const res = await fetch(`/api/public/schools?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to search schools')
      const json = await res.json()
      
      setSchools(json.data ?? [])
      if (json.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: json.pagination.total,
          totalPages: json.pagination.totalPages
        }))
      }
    } catch (err) {
      console.error('Error fetching schools:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [filters.board, filters.admissionOpen, pagination.page, sortOrder])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchSchools()
    
    // Sync url
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.city) params.append('city', filters.city)
    if (filters.board) params.append('board', filters.board)
    if (filters.admissionOpen) params.append('admissionOpen', filters.admissionOpen)
    if (sortOrder) params.append('sort', sortOrder)
    router.push(`/schools?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setFilters({ search: '', city: '', board: '', admissionOpen: '' })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    )
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const getPastelColor = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const gradients = [
      'from-rose-100 to-red-155 text-rose-700 border-rose-200/50',
      'from-amber-100 to-orange-155 text-amber-850 border-amber-200/50',
      'from-emerald-100 to-green-155 text-emerald-850 border-emerald-200/50',
      'from-cyan-100 to-blue-155 text-cyan-800 border-cyan-200/50',
      'from-indigo-100 to-blue-155 text-indigo-800 border-indigo-200/50',
      'from-fuchsia-100 to-purple-155 text-fuchsia-800 border-fuchsia-200/50',
      'from-violet-100 to-indigo-155 text-violet-800 border-violet-200/50'
    ]
    return gradients[hash % gradients.length]
  }

  const cities = ['Chennai', 'Bangalore', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune']
  const boards = ['CBSE', 'ICSE', 'State', 'IB']

  // Result Counter Boundaries
  const startItem = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 pb-16 animate-fade-in select-none">
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-16 px-6 md:px-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Find the Best School for Your Child
          </h1>
          <p className="text-sm md:text-lg text-blue-100 font-medium max-w-xl mx-auto leading-relaxed">
            Search verified listings, compare curriculum, track admissions status, and apply directly.
          </p>

          {/* Large search bar input */}
          <form onSubmit={handleSearchSubmit} className="bg-white rounded-2xl p-2 md:p-3 shadow-2xl flex flex-col md:flex-row items-stretch gap-2 max-w-3xl mx-auto border border-white/20">
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="Search school name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="bg-transparent border-0 outline-none text-slate-700 text-sm placeholder-slate-400 w-full font-medium"
              />
            </div>

            <div className="md:w-48 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
              <select
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="bg-transparent border-0 outline-none text-slate-700 text-sm w-full font-medium cursor-pointer"
              >
                <option value="">Select City</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-8 py-3 rounded-xl h-auto shrink-0 shadow-md">
              Search Schools
            </Button>
          </form>
        </div>
      </section>

      {/* 2. FILTER BAR */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm py-4 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-auto">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0 hidden sm:inline">Sort By:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="text-xs font-bold text-slate-650 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 outline-none cursor-pointer hover:bg-slate-100"
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Rating: High to Low</option>
              <option value="distance">Distance: Nearest first</option>
              <option value="newest">Newest listed</option>
              <option value="enquiries">Most enquiries</option>
            </select>
          </div>

          <div className="flex gap-2 items-center w-auto">
            {/* Desktop-only Quick Board filters */}
            <div className="hidden md:flex gap-2 items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1.5">Curriculum:</span>
              {boards.map((b) => (
                <button
                  key={b}
                  onClick={() => setFilters({ ...filters, board: filters.board === b ? '' : b })}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full border transition cursor-pointer shrink-0 ${
                    filters.board === b
                      ? 'bg-blue-50 border-blue-200 text-[#1565D8]'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Mobile Filter Sheet Trigger */}
            <Button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden bg-slate-100 hover:bg-blue-50 hover:text-[#1565D8] border border-slate-200 text-slate-700 text-xs font-bold px-4 py-1.5 rounded-full h-auto"
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              Filters
            </Button>
          </div>
        </div>
      </section>

      {/* 3. RESULTS & SIDEBAR */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Filter Panel (Hidden on Mobile) */}
        <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-slate-200 h-fit shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              Search Filters
            </h3>
            <span
              onClick={handleClearFilters}
              className="text-xs font-bold text-slate-400 hover:text-red-500 cursor-pointer underline"
            >
              Clear all
            </span>
          </div>

          {/* Curriculum Selectors */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Board Board</h4>
            <div className="space-y-1">
              {boards.map((b) => (
                <button
                  key={b}
                  onClick={() => setFilters({ ...filters, board: filters.board === b ? '' : b })}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                    filters.board === b
                      ? 'bg-blue-50 border-blue-200 text-[#1565D8]'
                      : 'bg-slate-50 border-slate-100 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  {b} Curriculum
                </button>
              ))}
            </div>
          </div>

          {/* Admission Status */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Admission Open</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, admissionOpen: 'true' })}
                className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg border transition ${
                  filters.admissionOpen === 'true'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Open Status
              </button>
              <button
                onClick={() => setFilters({ ...filters, admissionOpen: '' })}
                className={`flex-1 text-center py-2.5 text-xs font-bold rounded-lg border transition ${
                  filters.admissionOpen === ''
                    ? 'bg-blue-50 border-blue-200 text-[#1565D8]'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Show All
              </button>
            </div>
          </div>
        </aside>

        {/* Right Columns: School listing cards */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Result count line */}
          <div className="flex justify-between items-center bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold text-slate-500">
            <span>
              Showing {startItem}-{endItem} of {pagination.total} schools
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white rounded-2xl border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between h-[450px] p-5 space-y-4">
                  <Skeleton className="h-48 w-full rounded-xl bg-slate-100" />
                  <div className="space-y-3 flex-1 py-2">
                    <Skeleton className="h-6 w-3/4 bg-slate-150" />
                    <Skeleton className="h-4 w-1/2 bg-slate-150" />
                    <Skeleton className="h-4 w-1/4 bg-slate-150" />
                  </div>
                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                    <Skeleton className="h-4 w-1/3 bg-slate-150" />
                    <Skeleton className="h-8 w-24 bg-slate-150" />
                  </div>
                </Card>
              ))}
            </div>
          ) : schools.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm px-6 space-y-5">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto" strokeWidth={1.2} />
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-800">No schools found</h4>
                <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed">
                  Try adjusting your filters or search in a different area
                </p>
              </div>
              <Button 
                onClick={handleClearFilters}
                className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs h-auto px-6 py-2.5 rounded-xl shadow-md border border-blue-500 cursor-pointer"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {schools.map((school) => {
                  const city = school.locations[0]?.city ?? 'City Not Listed'
                  const board = school.affiliations[0]?.board ?? 'State Board'
                  const primaryPhoto = school.media[0]?.url
                  const isBookmarked = bookmarkedIds.includes(school.id)

                  return (
                    <Card key={school.id} className="bg-white rounded-2xl border-slate-200 hover:shadow-lg hover:border-blue-200 transition duration-300 overflow-hidden flex flex-col justify-between shadow-sm relative group">
                      
                      {/* Photo Header */}
                      <div className="h-48 bg-slate-100 relative overflow-hidden shrink-0">
                        {primaryPhoto ? (
                          <img
                            src={primaryPhoto}
                            alt={school.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${getPastelColor(school.name)} flex items-center justify-center border-b`}>
                            <span className="text-5xl font-black uppercase tracking-tight">
                              {school.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        
                        {/* Bookmark Button */}
                        <button
                          onClick={(e) => toggleBookmark(school.id, e)}
                          className={`absolute top-4 right-4 p-2 rounded-full border shadow-md backdrop-blur-md transition cursor-pointer z-10 ${
                            isBookmarked
                              ? 'bg-red-500 border-red-500 text-white'
                              : 'bg-white/80 border-white/20 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>

                        {/* Featured Ribbon Overlay */}
                        {school.isFeatured && (
                          <span className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-250/30 shadow-md z-10 flex items-center gap-1">
                            ⭐ Featured
                          </span>
                        )}

                        {/* Admission Status Overlay */}
                        <span className={`absolute bottom-4 left-4 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-md ${
                          school.admissionOpen 
                            ? 'bg-green-500 text-white' 
                            : 'bg-slate-600 text-white'
                        }`}>
                          {school.admissionOpen ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Admissions Open
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              Admissions Closed
                            </>
                          )}
                        </span>
                      </div>

                      {/* Content Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-[#1565D8] transition-colors leading-tight truncate">
                              {school.name}
                            </h4>
                          </div>

                          {/* Enh 1: Ratings directly below school name */}
                          <div className="mt-1 flex items-center gap-1 text-xs">
                            {school.reviewCount > 0 ? (
                              <div className="flex items-center gap-1 font-bold text-amber-500">
                                <span>⭐</span>
                                <span>{school.avgRating > 0 ? school.avgRating : 'New'}</span>
                                <span className="text-slate-400 font-medium text-xs">({school.reviewCount} reviews)</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-semibold">No reviews yet</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <span className="bg-blue-50 text-[#1565D8] text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">
                              {board}
                            </span>
                            <div className="flex items-center text-xs text-slate-400 font-semibold gap-1 ml-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-300" />
                              <span>{city}</span>
                            </div>
                          </div>

                          {/* Enh 2: Enquiries Count + Response Badge */}
                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                              <span className="flex items-center gap-1">
                                <Building className="w-3.5 h-3.5 text-slate-300" />
                                Enquiries Count:
                              </span>
                              <span className="font-bold text-slate-800">{school._count?.enquiries ?? 0}</span>
                            </div>

                            {school.avgResponseHours !== null && (
                              <div className="flex">
                                <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1 shadow-sm">
                                  ⚡ Responds in ~{school.avgResponseHours} hrs
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-slate-100 mt-5 pt-4 flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            {school.institutionType}
                          </span>

                          <Link href={`/schools/${school.slug}`}>
                            <Button className="bg-slate-100 hover:bg-blue-50 hover:text-[#1565D8] text-slate-700 text-xs font-bold px-4 py-2 h-auto rounded-lg">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* 4. PAGINATION */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-6">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-500 px-3">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* 5. MOBILE SLIDEOUT FILTER DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          {/* Drawer Content */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl p-6 flex flex-col justify-between z-10 animate-slide-in-right overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  Search Filters
                </h3>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Curriculum Selection */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Board Board</h4>
                <div className="space-y-1">
                  {boards.map((b) => (
                    <button
                      key={b}
                      onClick={() => setFilters({ ...filters, board: filters.board === b ? '' : b })}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg border transition ${
                        filters.board === b
                          ? 'bg-blue-50 border-blue-200 text-[#1565D8]'
                          : 'bg-slate-50 border-slate-100 text-slate-605 hover:bg-slate-100'
                      }`}
                    >
                      {b} Curriculum
                    </button>
                  ))}
                </div>
              </div>

              {/* Admission Status */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Admission Open</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, admissionOpen: 'true' })}
                    className={`flex-1 text-center py-2 text-xs font-bold rounded-lg border transition ${
                      filters.admissionOpen === 'true'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, admissionOpen: '' })}
                    className={`flex-1 text-center py-2 text-xs font-bold rounded-lg border transition ${
                      filters.admissionOpen === ''
                        ? 'bg-blue-50 border-blue-200 text-[#1565D8]'
                        : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-2">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex-1 font-bold text-xs py-2.5 rounded-xl h-auto border-slate-200"
              >
                Reset
              </Button>
              <Button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl h-auto"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
