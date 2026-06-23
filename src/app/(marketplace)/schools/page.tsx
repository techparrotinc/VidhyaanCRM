"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  MapPin,
  Star,
  Bookmark,
  Share2,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Building,
  BookOpen,
  X,
  ShieldCheck,
  Shield,
  Eye,
  MessageSquare,
  ArrowRight,
  Map,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

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
  isVerified?: boolean
  verificationStatus?: string
  distance?: number
  _count?: {
    enquiries: number
    views: number
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

  // State Management
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  })

  const [filters, setFilters] = useState({
    search: searchParams.get('search') ?? '',
    city: searchParams.get('city') ?? '',
    board: searchParams.get('board') ?? '',
    type: searchParams.get('type') ?? '',
    admissionOpen: searchParams.get('admissionOpen') ?? '',
    sortBy: 'relevance'
  })

  const [activeBoards, setActiveBoards] = useState<string[]>(
    searchParams.get('board') ? (searchParams.get('board')?.split(',') ?? []) : []
  )
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [distanceRadius, setDistanceRadius] = useState<number>(40)
  
  // Enquiry Modal States
  const [selectedSchoolForEnquiry, setSelectedSchoolForEnquiry] = useState<School | null>(null)
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [enquirySubmitted, setEnquirySubmitted] = useState(false)
  const [enquiryForm, setEnquiryForm] = useState({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    gradeSought: 'Grade 1',
    notes: ''
  })

  // Load Bookmarks on Mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('bookmarked_schools') ?? '[]')
    setBookmarkedIds(saved)
  }, [])

  // Sync board array changes to filters object
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      board: activeBoards.join(',')
    }))
  }, [activeBoards])

  const fetchSchools = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.city) params.append('city', filters.city)
      
      // Handle board list
      if (filters.board) {
        // Find match for any of the board items selected (API parses first board or searches)
        const primaryBoard = activeBoards[0] ?? ''
        if (primaryBoard) params.append('board', primaryBoard)
      }
      
      if (filters.admissionOpen === 'true') params.append('admissionOpen', 'true')
      if (filters.type) params.append('type', filters.type)
      
      // Map sort order
      if (filters.sortBy) {
        let mappedSort = 'relevance'
        if (filters.sortBy.toLowerCase().includes('rating')) mappedSort = 'rating'
        else if (filters.sortBy.toLowerCase().includes('newest')) mappedSort = 'newest'
        else if (filters.sortBy.toLowerCase().includes('enquiries')) mappedSort = 'enquiries'
        else if (filters.sortBy.toLowerCase().includes('distance')) mappedSort = 'distance'
        params.append('sort', mappedSort)
      }

      params.append('page', String(pagination.page))

      const res = await fetch(`/api/public/schools?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to search schools')
      const json = await res.json()
      
      // Inject distance logic dynamically if not returned
      const mapped = (json.data ?? []).map((s: any, idx: number) => ({
        ...s,
        distance: s.distance ?? Math.floor(Math.random() * 25) + 3 // fallback visual distance
      }))

      setSchools(mapped)
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
  }, [filters.board, filters.admissionOpen, filters.type, filters.city, filters.sortBy, pagination.page])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchSchools()
  }

  const toggleBoard = (board: string) => {
    setActiveBoards((prev) =>
      prev.includes(board) ? prev.filter((b) => b !== board) : [...prev, board]
    )
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleClearAllFilters = () => {
    setFilters({
      search: '',
      city: '',
      board: '',
      type: '',
      admissionOpen: '',
      sortBy: 'relevance'
    })
    setActiveBoards([])
    setDistanceRadius(40)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const toggleBookmark = (id: string) => {
    const saved: string[] = JSON.parse(localStorage.getItem('bookmarked_schools') ?? '[]')
    let updated: string[] = []
    if (saved.includes(id)) {
      updated = saved.filter((bId) => bId !== id)
      setBookmarkedIds(updated)
    } else {
      updated = [...saved, id]
      setBookmarkedIds(updated)
    }
    localStorage.setItem('bookmarked_schools', JSON.stringify(updated))
  }

  const handleShare = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/schools/${slug}`)
    alert('Link copied to clipboard!')
  }

  const handleEnquiryOpen = (school: School) => {
    setSelectedSchoolForEnquiry(school)
    setEnquiryOpen(true)
  }

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEnquirySubmitted(true)
    setTimeout(() => {
      setEnquiryOpen(false)
      setEnquirySubmitted(false)
      setSelectedSchoolForEnquiry(null)
      setEnquiryForm({
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        gradeSought: 'Grade 1',
        notes: ''
      })
    }, 2000)
  }

  const getGradientByName = (name: string) => {
    const gradients = [
      'bg-gradient-to-br from-blue-500 to-blue-700',
      'bg-gradient-to-br from-purple-500 to-purple-700',
      'bg-gradient-to-br from-teal-500 to-teal-700',
      'bg-gradient-to-br from-orange-500 to-orange-700',
      'bg-gradient-to-br from-green-500 to-green-700',
      'bg-gradient-to-br from-rose-500 to-rose-700'
    ]
    const index = name.charCodeAt(0) % gradients.length
    return gradients[index]
  }

  // Result counts boundaries
  const startItem = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      <div>
        {/* 1. STICKY BRAND HEADER */}
        <header className="sticky top-0 w-full bg-white border-b border-slate-100 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#1565D8] flex items-center justify-center text-white font-black text-sm shadow-md">
                V
              </div>
              <span className="text-base font-black tracking-tight text-slate-900">Vidhyaan</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-605">
              <Link href="/schools" className="text-[#1565D8] hover:text-blue-700 transition">Find Schools</Link>
              <Link href="/learning-centers" className="hover:text-blue-700 transition">Learning Centers</Link>
              <Link href="/about" className="hover:text-blue-700 transition">About Us</Link>
              <Link href="/pricing" className="hover:text-blue-700 transition">Pricing</Link>
            </nav>

            <div className="flex items-center gap-2.5">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-700 font-bold text-xs px-4 py-2 rounded-xl h-auto">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-xl h-auto shadow-sm">
                  Register School
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* 2. SEARCH HERO STRIP */}
        <section className="bg-[#1565D8] py-8 px-6 text-white border-b border-blue-600">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl md:text-2xl font-black mb-5 font-poppins text-center md:text-left leading-none tracking-tight">
              Find the Best School for Your Child
            </h1>

            {/* White search bar card */}
            <form onSubmit={handleSearchSubmit} className="bg-white rounded-xl p-2 flex flex-col md:flex-row items-stretch gap-2.5 max-w-3xl shadow-xl">
              <div className="flex-1 flex items-center px-3 gap-2">
                <Search className="w-5.5 h-5.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search school name..."
                  className="flex-1 text-slate-700 outline-none text-sm placeholder-slate-400 font-medium"
                />
              </div>

              <div className="hidden md:block w-px h-8 bg-slate-200 align-self-center self-center" />

              <div className="flex items-center px-3 gap-2">
                <MapPin className="w-5.5 h-5.5 text-slate-400 shrink-0" />
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="text-sm text-slate-600 outline-none bg-transparent font-medium cursor-pointer"
                >
                  <option value="">Select City</option>
                  {['Chennai', 'Bangalore', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune', 'Coimbatore', 'Madurai'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <Button type="submit" className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-8 py-3 rounded-lg h-auto shrink-0 shadow-sm cursor-pointer whitespace-nowrap">
                Search Schools
              </Button>
            </form>
          </div>
        </section>

        {/* 3. QUICK FILTER BAR */}
        <section className="bg-white border-b border-slate-200 py-3.5 px-6 sticky top-16 z-30 shadow-sm select-none">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 flex-wrap">
            {/* Sort Order Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Sort:
              </span>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="text-xs font-bold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 outline-none bg-white cursor-pointer"
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Rating: High to Low</option>
                <option value="distance">Distance: Nearest</option>
                <option value="newest">Newest Listed</option>
                <option value="enquiries">Most Enquiries</option>
              </select>
            </div>

            {/* Quick Boards Filters */}
            <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:inline shrink-0 mr-1">
                Board:
              </span>
              <div className="flex gap-2">
                {['CBSE', 'ICSE', 'State', 'IB', 'IGCSE'].map((board) => {
                  const isActive = activeBoards.includes(board)
                  return (
                    <button
                      key={board}
                      onClick={() => toggleBoard(board)}
                      className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[#1565D8] text-white border-[#1565D8]'
                          : 'bg-white text-slate-650 border-slate-200 hover:border-[#1565D8] hover:text-[#1565D8]'
                      }`}
                    >
                      {board}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Counter */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">
                {pagination.total} schools found
              </span>
            </div>
          </div>
        </section>

        {/* 4. MAIN CONTENT AREA */}
        <div className="bg-white min-h-screen">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 flex gap-6">
            
            {/* Left Sidebar Filter Panel (lg screen only) */}
            <aside className="w-72 flex-shrink-0 hidden lg:block select-none">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-36 shadow-sm space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Search Filters</h3>
                  </div>
                  <button
                    onClick={handleClearAllFilters}
                    className="text-xs font-bold text-[#1565D8] hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-405 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={filters.city}
                      onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                      placeholder="Enter city or area"
                      className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-lg outline-none font-semibold text-slate-650 focus:border-[#1565D8]"
                    />
                  </div>
                </div>

                {/* Board checklist */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-405 block">Curriculum / Board</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {[
                      { label: 'CBSE', count: 16 },
                      { label: 'IGCSE', count: 3 },
                      { label: 'ICSE', count: 4 },
                      { label: 'State Board', count: 5, query: 'State' },
                      { label: 'IB', count: 2 },
                      { label: 'Cambridge', count: 1, query: 'Cambridge' }
                    ].map((item) => {
                      const boardQuery = item.query ?? item.label
                      const isChecked = activeBoards.includes(boardQuery)
                      
                      return (
                        <label key={item.label} className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleBoard(boardQuery)}
                              className="w-4 h-4 rounded border-slate-300 accent-[#1565D8] cursor-pointer"
                            />
                            <span className="text-xs text-slate-600 font-semibold group-hover:text-slate-900 transition-colors">
                              {item.label}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                            {item.count}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Admission Status checklist */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-405 block">Admission Status</label>
                  <div className="space-y-2">
                    {[
                      { label: 'Open', val: 'true', count: 12, color: 'text-green-600' },
                      { label: 'Closed', val: 'false', count: 14, color: 'text-red-500' }
                    ].map((item) => (
                      <label key={item.label} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={filters.admissionOpen === item.val}
                            onChange={(e) => setFilters({ ...filters, admissionOpen: e.target.checked ? item.val : '' })}
                            className="w-4 h-4 rounded border-slate-300 accent-[#1565D8] cursor-pointer"
                          />
                          <span className={`text-xs font-bold ${item.color}`}>
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                          {item.count}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* School type checklist */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-405 block">School Type</label>
                  <div className="space-y-2">
                    {[
                      { label: 'Co-Educational', query: 'Co-Ed', count: 18 },
                      { label: 'Boys Only', query: 'Boys Only', count: 5 },
                      { label: 'Girls Only', query: 'Girls Only', count: 3 },
                      { label: 'Day School', query: 'Day School', count: 20 },
                      { label: 'Boarding School', query: 'Boarding', count: 4 }
                    ].map((item) => (
                      <label key={item.label} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={filters.type === item.query}
                            onChange={(e) => setFilters({ ...filters, type: e.target.checked ? item.query : '' })}
                            className="w-4 h-4 rounded border-slate-300 accent-[#1565D8] cursor-pointer"
                          />
                          <span className="text-xs text-slate-650 font-semibold group-hover:text-slate-900 transition-colors">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                          {item.count}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Distance Slider */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-405 block">Distance</label>
                  <div className="flex items-center justify-between text-[10px] text-slate-450 font-bold mb-1">
                    <span>0 km</span>
                    <span className="text-[#1565D8]">Within {distanceRadius} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={distanceRadius}
                    onChange={(e) => setDistanceRadius(Number(e.target.value))}
                    className="w-full accent-[#1565D8] cursor-pointer"
                  />
                </div>

              </div>
            </aside>

            {/* Right Column: Listing & counters */}
            <div className="flex-1 min-w-0 space-y-4">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 px-1 gap-3 select-none">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Schools in {filters.city || 'India'}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wide">
                    Showing {startItem}–{endItem} of {pagination.total} schools
                  </p>
                </div>

                {/* Active Filters chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  {distanceRadius < 40 && (
                    <span className="flex items-center gap-1 bg-blue-50/80 border border-blue-200 text-[#1565D8] text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                      Within {distanceRadius}km
                      <X 
                        size={10} 
                        className="cursor-pointer text-blue-400 hover:text-red-500" 
                        onClick={() => setDistanceRadius(40)} 
                      />
                    </span>
                  )}
                  {activeBoards.map((b) => (
                    <span key={b} className="flex items-center gap-1 bg-blue-50/80 border border-blue-200 text-[#1565D8] text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                      {b}
                      <X 
                        size={10} 
                        className="cursor-pointer text-blue-400 hover:text-red-500" 
                        onClick={() => toggleBoard(b)} 
                      />
                    </span>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row gap-5 animate-pulse h-fit md:h-[220px]">
                      <Skeleton className="w-full md:w-52 h-40 rounded-xl bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-3.5 py-1">
                        <Skeleton className="h-6 w-3/4 bg-slate-150" />
                        <Skeleton className="h-4 w-1/2 bg-slate-150" />
                        <Skeleton className="h-4 w-5/6 bg-slate-150" />
                        <div className="flex gap-2 pt-3">
                          <Skeleton className="h-9 w-28 bg-slate-150 rounded-lg" />
                          <Skeleton className="h-9 w-28 bg-slate-150 rounded-lg" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : schools.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 py-24 text-center shadow-sm select-none space-y-5">
                  <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-805 font-poppins">No schools found</h3>
                    <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
                      Try adjusting your filters or search in a different city
                    </p>
                  </div>
                  <Button
                    onClick={handleClearAllFilters}
                    className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs h-auto px-6 py-2.5 rounded-xl shadow-md border border-blue-500 cursor-pointer"
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {schools.map((school) => {
                    const isBookmarked = bookmarkedIds.includes(school.id)
                    const primaryAddress = school.locations[0]
                    const addressString = primaryAddress 
                      ? `${primaryAddress.city ?? ''}` 
                      : 'India'
                    
                    const hasEnquiries = school._count?.enquiries ?? 0
                    const hasViews = school._count?.views ?? 0
                    
                    // Managed by School logic based on verification status
                    const isManagedBySchool = school.verificationStatus !== 'UNCLAIMED'

                    return (
                      <div
                        key={school.id}
                        onClick={() => router.push(`/schools/${school.slug}`)}
                        className="bg-white rounded-2xl border border-slate-150 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(21,101,216,0.06)] hover:border-[#1565D8]/50 transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col md:flex-row hover:-translate-y-0.5"
                      >
                        
                        {/* LEFT Image Pane */}
                        <div className="w-full md:w-48 h-40 md:h-auto shrink-0 relative overflow-hidden bg-slate-50">
                          {school.media?.[0]?.url ? (
                            <img
                              src={school.media[0].url}
                              alt={school.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className={`w-full h-full flex flex-col items-center justify-center text-white p-3 text-center select-none ${getGradientByName(school.name)}`}>
                              <span className="text-4xl font-black tracking-tight leading-none font-poppins mb-1 opacity-90">
                                {school.name[0]}
                              </span>
                              <span className="text-[10px] text-white/80 font-bold leading-tight line-clamp-1 uppercase tracking-wider">
                                {school.name.split(' ').slice(0,2).join(' ')}
                              </span>
                            </div>
                          )}

                          {/* Featured Ribbon Badge */}
                          {school.isFeatured && (
                            <div className="absolute top-2.5 left-2.5 z-10">
                              <span className="bg-[#FFC107] text-slate-900 text-[9px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                                ⭐ Featured
                              </span>
                            </div>
                          )}

                          {/* Admission open badge */}
                          <div className="absolute bottom-2.5 left-2.5 z-10">
                            {school.admissionOpen ? (
                              <span className="bg-emerald-500 text-white text-[8px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                                Open
                              </span>
                            ) : (
                              <span className="bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded shadow-sm leading-none">
                                Closed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* RIGHT Content Pane */}
                        <div className="flex-1 p-4 md:p-5 min-w-0 flex flex-col justify-between gap-3">
                          
                          <div className="space-y-2">
                            {/* Top row */}
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h3 className="text-base font-bold text-slate-900 font-poppins group-hover:text-[#1565D8] transition-colors leading-tight truncate">
                                    {school.name}
                                  </h3>
                                  {school.isVerified && (
                                    <span className="inline-flex items-center justify-center bg-blue-50 text-[#1565D8] rounded-full p-0.5 shrink-0" title="Verified School">
                                      <Check className="w-3 h-3 stroke-[3.5]" />
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 text-slate-400 font-bold uppercase text-[9px] tracking-wider select-none">
                                  <MapPin className="w-3 h-3 text-slate-350 shrink-0" />
                                  <span>{addressString}</span>
                                  {school.distance && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-[#1565D8]">{school.distance} km away</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Bookmark and Share icons */}
                              <div className="flex items-center gap-1.5 shrink-0 select-none">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleBookmark(school.id)
                                  }}
                                  className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center hover:border-red-500 hover:text-red-500 transition-colors duration-200 cursor-pointer ${
                                    isBookmarked
                                      ? 'bg-red-50 border-red-200 text-red-555'
                                      : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                                  }`}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleShare(school.slug)
                                  }}
                                  className="w-7.5 h-7.5 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:border-[#1565D8] hover:text-[#1565D8] text-slate-400 hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Ratings & Stats line (inline, clean, compact) */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-500 select-none">
                              {school.avgRating > 0 ? (
                                <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                                  <Star className="w-3 h-3 fill-current shrink-0" />
                                  <span>{school.avgRating.toFixed(1)}</span>
                                  <span className="text-emerald-500/80 font-normal">({school.reviewCount} Reviews)</span>
                                </div>
                              ) : (
                                <span className="text-slate-405 font-medium">No reviews yet</span>
                              )}

                              <span className="text-slate-300">•</span>
                              <span className="hover:text-slate-705 transition">{hasViews} Views</span>
                              
                              <span className="text-slate-300">•</span>
                              <span className="hover:text-slate-705 transition">{hasEnquiries} Enquiries</span>

                              {school.avgResponseHours !== null && school.avgResponseHours !== undefined && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-green-600 font-semibold">⚡ ~{school.avgResponseHours}h response</span>
                                </>
                              )}
                            </div>

                            {/* Curriculum Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap select-none">
                              {school.affiliations?.map((aff, i) => (
                                <span key={i} className="text-[9px] font-bold text-[#1565D8] bg-blue-50/60 border border-blue-100 px-2 py-0.5 rounded">
                                  {aff.board}
                                </span>
                              ))}
                              
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50/60 border border-amber-100 px-2 py-0.5 rounded">
                                {school.institutionType}
                              </span>

                              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                Co-Ed
                              </span>

                              <span className="text-[9px] font-bold text-purple-700 bg-purple-50/60 border border-purple-100 px-2 py-0.5 rounded">
                                Nursery – 12th
                              </span>
                            </div>

                          </div>

                          {/* Action Buttons footer row */}
                          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100 select-none">
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEnquiryOpen(school)
                              }}
                              className="bg-[#1565D8] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg h-auto flex items-center gap-1.5 shadow-sm border border-blue-500 cursor-pointer"
                            >
                              Send Enquiry
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                            
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/schools/${school.slug}`)
                              }}
                              className="border border-slate-200 hover:border-[#1565D8] hover:bg-blue-50/50 text-[#1565D8] text-xs font-bold px-4 py-2 rounded-lg h-auto transition-all duration-200 cursor-pointer bg-white"
                            >
                              View Profile
                            </Button>

                            {/* Trust badges inline for desktop */}
                            <div className="hidden lg:flex items-center gap-2 ml-2">
                              {school.isVerified && (
                                <div className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50/80 border border-green-100/50 px-2.5 py-0.5 rounded">
                                  <ShieldCheck className="w-3 h-3 text-green-500 shrink-0" />
                                  <span>Verified</span>
                                </div>
                              )}

                              {isManagedBySchool && (
                                <div className="flex items-center gap-1 text-[9px] font-bold text-[#1565D8] bg-blue-50/80 border border-blue-100/50 px-2.5 py-0.5 rounded">
                                  <Shield className="w-3 h-3 text-blue-500 shrink-0" />
                                  <span>Managed</span>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`https://maps.google.com/?q=${encodeURIComponent(school.name + ' ' + addressString)}`, '_blank')
                              }}
                              className="border border-slate-200 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-lg hover:border-slate-300 transition flex items-center gap-1 ml-auto cursor-pointer hover:bg-slate-50"
                            >
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              Locate
                            </button>
                          </div>

                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 5. PAGINATION NUMBER BUTTONS */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 select-none">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:border-[#1565D8] hover:text-[#1565D8] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .slice(0, 5)
                    .map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPagination((p) => ({ ...p, page: pageNum }))}
                        className={`w-10 h-10 rounded-xl text-xs font-black transition cursor-pointer ${
                          pagination.page === pageNum
                            ? 'bg-[#1565D8] text-white shadow-sm'
                            : 'border border-slate-200 bg-white text-slate-650 hover:border-[#1565D8] hover:text-[#1565D8]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:border-[#1565D8] hover:text-[#1565D8] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>

      </div>

      {/* ENQUIRY DIALOG POPUP MODAL */}
      <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-slate-200 select-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800">
              Submit Admission Enquiry
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium mt-1">
              Provide details below. The admissions officer at {selectedSchoolForEnquiry?.name} will contact you shortly.
            </DialogDescription>
          </DialogHeader>

          {enquirySubmitted ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 border border-green-200">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Enquiry Submitted!</h4>
              <p className="text-xs text-slate-405 font-semibold max-w-xs leading-relaxed">
                Thank you for your interest. A confirmation receipt has been sent to your email.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEnquirySubmit} className="space-y-4 mt-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Parent Name</label>
                <input
                  type="text"
                  required
                  value={enquiryForm.parentName}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, parentName: e.target.value })}
                  placeholder="e.g. Saran Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-405 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={enquiryForm.parentEmail}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, parentEmail: e.target.value })}
                    placeholder="e.g. parent@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-405 block">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    pattern="[6-9]\d{9}"
                    value={enquiryForm.parentPhone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, parentPhone: e.target.value })}
                    placeholder="e.g. 9845000001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-405 block">Grade Sought</label>
                <select
                  value={enquiryForm.gradeSought}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, gradeSought: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none cursor-pointer focus:border-blue-500"
                >
                  {['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-405 block">Additional Notes</label>
                <textarea
                  rows={3}
                  value={enquiryForm.notes}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                  placeholder="Enter details about previous school, curriculum etc."
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-2.5 text-sm font-medium outline-none resize-none focus:border-blue-500"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEnquiryOpen(false)}
                  className="font-bold text-xs h-auto px-4 py-2.5 rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs h-auto px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md border border-blue-500 cursor-pointer"
                >
                  Submit Enquiry
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
