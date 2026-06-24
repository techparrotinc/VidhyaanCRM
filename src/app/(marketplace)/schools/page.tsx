"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Search,
  MapPin,
  Star,
  Bookmark,
  Share2,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Building,
  BookOpen,
  X,
  ShieldCheck,
  Shield,
  Eye,
  MessageSquare,
  ArrowRight,
  Check,
  LayoutGrid,
  Layers,
  Wallet,
  UserPlus,
  ChevronDown,
  ShieldAlert,
  Zap,
  Cloud,
  GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocation } from '@/hooks/useLocation'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import CompareBar from '@/components/CompareBar'
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
  viewCount?: number
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
  const { data: session } = useSession()

  const [loginPromptOpen, setLoginPromptOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const { city: detectedCity, lat, lng } = useLocation()

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

  // Synchronized inputs
  const [category, setCategory] = useState<'schools' | 'centers'>('schools')
  const [searchVal, setSearchVal] = useState(filters.search)
  const [cityVal, setCityVal] = useState(filters.city)
  
  // Sidebar state
  const [distanceRadius, setDistanceRadius] = useState<number>(40)
  const [minFees, setMinFees] = useState('')
  const [maxFees, setMaxFees] = useState('')

  const [activeBoards, setActiveBoards] = useState<string[]>(
    searchParams.get('board') ? (searchParams.get('board')?.split(',') ?? []) : []
  )
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])

  
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

    const [comparedSlugs, setComparedSlugs] = useState<string[]>([])

  useEffect(() => {
    const loadCompare = () => {
      try {
        const stored = localStorage.getItem('compare_schools')
        if (stored) {
          const list = JSON.parse(stored)
          if (Array.isArray(list)) {
            setComparedSlugs(list.map((s: any) => s.slug))
          }
        } else {
          setComparedSlugs([])
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadCompare()
    window.addEventListener('compare-changed', loadCompare)
    window.addEventListener('storage', loadCompare)
    return () => {
      window.removeEventListener('compare-changed', loadCompare)
      window.removeEventListener('storage', loadCompare)
    }
  }, [])

  const toggleCompare = (school: School) => {
    try {
      const stored = localStorage.getItem('compare_schools')
      let list = stored ? JSON.parse(stored) : []
      if (!Array.isArray(list)) list = []
      
      const isAlreadyAdded = list.some((s: any) => s.slug === school.slug)
      if (isAlreadyAdded) {
        list = list.filter((s: any) => s.slug !== school.slug)
        localStorage.setItem('compare_schools', JSON.stringify(list))
        window.dispatchEvent(new Event('compare-changed'))
        setToastMsg(`Removed ${school.name} from comparison`)
      } else {
        if (list.length >= 3) {
          setToastMsg("You can compare up to 3 schools side-by-side.")
          return
        }
        list.push({ slug: school.slug, name: school.name })
        localStorage.setItem('compare_schools', JSON.stringify(list))
        window.dispatchEvent(new Event('compare-changed'))
        setToastMsg(`Added ${school.name} to comparison`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Load Bookmarks on Mount or Session Change
  useEffect(() => {
    const loadBookmarks = async () => {
      if (session?.user && session.user.role === 'PARENT') {
        try {
          const res = await fetch('/api/v1/parent/bookmarks')
          const json = await res.json()
          if (json.success && json.data) {
            const ids = json.data.map((b: any) => b.schoolId)
            setBookmarkedIds(ids)
            return
          }
        } catch (e) {
          console.error('Error fetching bookmarks:', e)
        }
      }
      // Fallback or unauthenticated
      const saved = JSON.parse(localStorage.getItem('bookmarked_schools') ?? '[]')
      setBookmarkedIds(saved)
    }

    loadBookmarks()
  }, [session])

  // Sync inputs with filters updates
  useEffect(() => {
    setSearchVal(filters.search)
  }, [filters.search])

  useEffect(() => {
    setCityVal(filters.city)
  }, [filters.city])

  // Sync detected location city if no city is currently filtered
  useEffect(() => {
    if (detectedCity && !filters.city) {
      setFilters((prev) => ({
        ...prev,
        city: detectedCity
      }))
      setCityVal(detectedCity)
    }
  }, [detectedCity, filters.city])

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
        const primaryBoard = activeBoards[0] ?? ''
        if (primaryBoard) params.append('board', primaryBoard)
      }
      
      if (filters.admissionOpen === 'true') params.append('admissionOpen', 'true')
      if (filters.type) params.append('type', filters.type)
      
      // Pass coordinates if available
      if (lat !== null && lng !== null) {
        params.append('lat', String(lat))
        params.append('lng', String(lng))
        params.append('maxDistance', String(distanceRadius))
      }
      
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
      params.append('institutionType', 'SCHOOL')

      const res = await fetch(`/api/public/schools?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to search schools')
      const json = await res.json()
      
      // Map distance values to fixed decimal place or preserve
      const mapped = (json.data ?? []).map((s: any) => ({
        ...s,
        distance: s.distance !== null && s.distance !== undefined ? Number(Number(s.distance).toFixed(1)) : null
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
  }, [filters.board, filters.admissionOpen, filters.type, filters.city, filters.sortBy, pagination.page, lat, lng, distanceRadius])

  const handleSearchCardSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Wire search Category selection redirection
    if (category === 'centers') {
      const params = new URLSearchParams()
      if (searchVal) params.append('search', searchVal)
      if (cityVal) params.append('city', cityVal)
      router.push(`/learning-centers?${params.toString()}`)
      return
    }

    setFilters((prev) => ({
      ...prev,
      search: searchVal,
      city: cityVal
    }))
    setPagination((prev) => ({ ...prev, page: 1 }))
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
    setSearchVal('')
    setCityVal('')
    setActiveBoards([])
    setDistanceRadius(40)
    setMinFees('')
    setMaxFees('')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const toggleBookmark = async (id: string, slug?: string) => {
    if (!session?.user || session.user.role !== 'PARENT') {
      setLoginPromptOpen(true)
      return
    }

    try {
      const targetSlug = slug || id
      const res = await fetch(`/api/public/schools/${targetSlug}/bookmark`, {
        method: 'POST'
      })
      const json = await res.json()
      if (json.success) {
        if (json.bookmarked) {
          setBookmarkedIds(prev => [...prev, id])
          setToastMsg('School saved to bookmarks')
        } else {
          setBookmarkedIds(prev => prev.filter(bId => bId !== id))
          setToastMsg('Removed from bookmarks')
        }
        setTimeout(() => setToastMsg(null), 3000)
      }
    } catch (e) {
      console.error('Error toggling bookmark:', e)
    }
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

  const getGradientByInitial = (name: string) => {
    const initial = name[0]?.toUpperCase() || 'A'
    if ('ABCD'.includes(initial)) return 'from-blue-500 to-blue-700'
    if ('EFGH'.includes(initial)) return 'from-purple-500 to-purple-700'
    if ('IJKL'.includes(initial)) return 'from-teal-500 to-teal-700'
    if ('MNOP'.includes(initial)) return 'from-orange-500 to-orange-700'
    if ('QRST'.includes(initial)) return 'from-green-500 to-green-700'
    return 'from-rose-500 to-rose-700' // UVWXYZ
  }

  const getFirstTwoWords = (name: string) => {
    return name.split(' ').slice(0, 2).join(' ')
  }

  // Result counts boundaries
  const startItem = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      <MarketplaceHeader />

        {/* Navigation Tabs above Hero Strip */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex">
            <Link 
              href="/schools" 
              className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[#1565D8] border-b-2 border-[#1565D8]"
            >
              Schools
            </Link>
            <Link 
              href="/learning-centers" 
              className="py-3 px-6 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 border-b-2 border-transparent"
            >
              Learning Centers
            </Link>
          </div>
        </div>

        {/* 2. BLUE SEARCH HERO STRIP */}
        <section className="bg-[#1565D8] text-white py-6 px-4 md:px-8 select-none relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5 opacity-10 pointer-events-none" />
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-black font-poppins tracking-tight">
                Find the Best Schools Near You
              </h1>
              <p className="text-[11px] md:text-xs text-blue-100 font-medium">
                Search 500+ verified CBSE, ICSE and Matriculation schools across India. Compare fees, facilities and apply directly.
              </p>
            </div>

            {/* WHITE SEARCH CARD */}
            <form onSubmit={handleSearchCardSubmit} className="bg-white rounded-2xl p-2.5 shadow-lg border border-slate-200 text-slate-800 flex flex-col md:flex-row items-stretch gap-2">
              
              {/* Category Selector */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 md:w-52 shrink-0 gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'schools' | 'centers')}
                  className="bg-transparent text-slate-705 outline-none text-xs font-bold w-full cursor-pointer"
                >
                  <option value="schools">🏫 Schools</option>
                  <option value="centers">💃 Learning Centers</option>
                </select>
              </div>

              {/* Search Input */}
              <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 gap-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="School name, board or area..."
                  className="bg-transparent text-slate-700 outline-none text-xs placeholder-slate-400 font-semibold w-full"
                />
              </div>

              {/* City Selector */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 md:w-44 shrink-0 gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={cityVal}
                  onChange={(e) => setCityVal(e.target.value)}
                  className="bg-transparent text-slate-707 outline-none text-xs font-bold w-full cursor-pointer"
                >
                  <option value="">Select City</option>
                  {['Chennai', 'Bangalore', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune', 'Coimbatore', 'Madurai'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <Button type="submit" className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl h-auto shrink-0 shadow-sm cursor-pointer whitespace-nowrap border border-transparent">
                Search Schools
              </Button>
            </form>
          </div>
        </section>

        {/* 3. QUICK FILTER BAR (Sticky below hero) */}
        <section className="bg-white border-b border-slate-200 py-3 px-4 md:px-8 sticky top-16 z-30 shadow-sm select-none">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 flex-wrap">
            
            {/* Sort by Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Sort by:
              </span>
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  setFilters({ ...filters, sortBy: e.target.value })
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
                className="text-xs font-bold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 outline-none bg-white cursor-pointer hover:border-[#1565D8] transition"
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Rating High to Low</option>
                <option value="distance">Distance Nearest</option>
                <option value="enquiries">Most Enquiries</option>
                <option value="newest">Newest Listed</option>
              </select>
            </div>

            {/* Board Quick Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:inline shrink-0 mr-1">
                Board:
              </span>
              <div className="flex gap-2">
                {['CBSE', 'ICSE', 'State', 'IB', 'IGCSE', 'Cambridge'].map((board) => {
                  const isActive = activeBoards.includes(board)
                  return (
                    <button
                      key={board}
                      onClick={() => toggleBoard(board)}
                      className={`text-xs font-bold px-4 py-1.5 rounded-full border transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-[#1565D8] text-white border-[#1565D8] shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-[#1565D8] hover:text-[#1565D8]'
                      }`}
                    >
                      {board}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Total Results Counter */}
            <div className="flex items-center shrink-0">
              <span className="text-xs text-slate-505 font-bold uppercase tracking-wider">
                {pagination.total} schools found
              </span>
            </div>
          </div>
        </section>

        {/* 4. MAIN CONTENT AREA */}
        <div className="bg-[#F5F7FA] min-h-screen">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 flex gap-6">
            
            {/* 5. LEFT FILTER SIDEBAR PANEL (Sticky) */}
            <aside className="w-[280px] flex-shrink-0 hidden lg:block select-none">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-36 shadow-sm space-y-4">
                
                {/* Header Row */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">SEARCH FILTERS</h3>
                  </div>
                  <button
                    onClick={handleClearAllFilters}
                    className="text-xs font-bold text-[#1565D8] hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>

                {/* Location Section */}
                <div className="space-y-2 pb-3 border-b border-slate-100">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">LOCATION</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={cityVal}
                      onChange={(e) => {
                        setCityVal(e.target.value)
                        setFilters((prev) => ({ ...prev, city: e.target.value }))
                        setPagination((prev) => ({ ...prev, page: 1 }))
                      }}
                      placeholder="Enter city or area"
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none font-semibold text-slate-655 focus:border-[#1565D8] focus:ring-1 focus:ring-[#1565D8] transition"
                    />
                  </div>
                </div>

                {/* Curriculum / Board Section */}
                <div className="space-y-2 pb-3 border-b border-slate-100">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">CURRICULUM</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {[
                      { label: 'CBSE', count: 16 },
                      { label: 'IGCSE', count: 3 },
                      { label: 'ICSE', count: 4 },
                      { label: 'State Board', count: 5, query: 'State' },
                      { label: 'IB', count: 2 },
                      { label: 'Cambridge', count: 1 }
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
                              className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-[#1565D8] accent-[#1565D8] cursor-pointer"
                            />
                            <span className="text-xs text-slate-600 font-semibold group-hover:text-slate-900 transition-colors">
                              {item.label}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-450 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                            {item.count}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Admission Status Section */}
                <div className="space-y-2 pb-3 border-b border-slate-100">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">ADMISSION STATUS</label>
                  <div className="space-y-2">
                    {[
                      { label: 'Open', val: 'true', count: 12, bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                      { label: 'Closed', val: 'false', count: 14, bg: 'bg-red-50 text-red-500 border-red-100' }
                    ].map((item) => (
                      <label key={item.label} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={filters.admissionOpen === item.val}
                            onChange={(e) => {
                              setFilters({ ...filters, admissionOpen: e.target.checked ? item.val : '' })
                              setPagination((prev) => ({ ...prev, page: 1 }))
                            }}
                            className="w-4 h-4 rounded border-slate-305 accent-[#1565D8] cursor-pointer"
                          />
                          <span className="text-xs text-slate-655 font-semibold group-hover:text-slate-900 transition-colors">
                            {item.label}
                          </span>
                        </div>
                        <span className={`text-[9px] border px-2 py-0.5 rounded-full font-bold ${item.bg}`}>
                          {item.count}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* School Type Section */}
                <div className="space-y-2 pb-3 border-b border-slate-100">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">SCHOOL TYPE</label>
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
                            onChange={(e) => {
                              setFilters({ ...filters, type: e.target.checked ? item.query : '' })
                              setPagination((prev) => ({ ...prev, page: 1 }))
                            }}
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

                {/* Distance Section */}
                <div className="space-y-2 pb-3 border-b border-slate-100">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">DISTANCE</label>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mb-1">
                    <span>0 km</span>
                    <span className="text-[#1565D8]">Within {distanceRadius} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={distanceRadius}
                    onChange={(e) => {
                      setDistanceRadius(Number(e.target.value))
                      setPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                    className="w-full accent-[#1565D8] cursor-pointer animate-fade-in"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-black px-0.5">
                    <span>0</span>
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                    <span>40 km</span>
                  </div>
                </div>

                {/* Fees Range Section */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">ANNUAL FEES</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        value={minFees}
                        onChange={(e) => {
                          setMinFees(e.target.value)
                          setPagination((prev) => ({ ...prev, page: 1 }))
                        }}
                        placeholder="Min"
                        className="w-full pl-5 pr-1.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none font-semibold text-slate-650 focus:border-[#1565D8]"
                      />
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        value={maxFees}
                        onChange={(e) => {
                          setMaxFees(e.target.value)
                          setPagination((prev) => ({ ...prev, page: 1 }))
                        }}
                        placeholder="Max"
                        className="w-full pl-5 pr-1.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none font-semibold text-slate-650 focus:border-[#1565D8]"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </aside>

            {/* Right Column: Listing Area */}
            <div className="flex-1 min-w-0 space-y-4">
              
              {/* 6. RESULTS HEADER & ACTIVE FILTERS */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 px-1 gap-3 select-none">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 font-poppins">
                    Schools near {filters.city || 'India'}
                  </h2>
                  <p className="text-[11px] text-slate-550 font-bold uppercase mt-1 tracking-wide">
                    Showing {startItem}–{endItem} of {pagination.total} schools
                  </p>
                </div>

                {/* Active Filters chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  {distanceRadius < 40 && (
                    <span className="flex items-center gap-1 bg-blue-50 border border-blue-150 text-[#1565D8] text-[10px] font-bold px-3 py-0.5 rounded-full">
                      Within {distanceRadius}km
                      <X 
                        size={12} 
                        className="cursor-pointer text-blue-400 hover:text-red-500 shrink-0" 
                        onClick={() => setDistanceRadius(40)} 
                      />
                    </span>
                  )}
                  {activeBoards.map((b) => (
                    <span key={b} className="flex items-center gap-1 bg-blue-50 border border-blue-150 text-[#1565D8] text-[10px] font-bold px-3 py-0.5 rounded-full">
                      {b}
                      <X 
                        size={12} 
                        className="cursor-pointer text-blue-400 hover:text-red-500 shrink-0" 
                        onClick={() => toggleBoard(b)} 
                      />
                    </span>
                  ))}
                  {minFees && (
                    <span className="flex items-center gap-1 bg-blue-50 border border-blue-150 text-[#1565D8] text-[10px] font-bold px-3 py-0.5 rounded-full">
                      ₹{minFees}+
                      <X 
                        size={12} 
                        className="cursor-pointer text-blue-400 hover:text-red-500 shrink-0" 
                        onClick={() => setMinFees('')} 
                      />
                    </span>
                  )}
                  {maxFees && (
                    <span className="flex items-center gap-1 bg-blue-50 border border-blue-150 text-[#1565D8] text-[10px] font-bold px-3 py-0.5 rounded-full">
                      Under ₹{maxFees}
                      <X 
                        size={12} 
                        className="cursor-pointer text-blue-400 hover:text-red-500 shrink-0" 
                        onClick={() => setMaxFees('')} 
                      />
                    </span>
                  )}
                </div>
              </div>

              {/* 8. LOADING STATE (Skeletons) */}
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
                /* 9. EMPTY STATE */
                <div className="bg-white rounded-2xl border border-slate-200 py-24 text-center shadow-sm select-none space-y-5">
                  <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8 text-slate-350" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-805 font-poppins">No schools found</h3>
                    <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
                      Try adjusting your filters or searching in a different area
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
                /* 7. SCHOOL CARDS Horizontal list */
                <div className="space-y-4">
                  {schools.map((school) => {
                    const isBookmarked = bookmarkedIds.includes(school.id)
                    const primaryAddress = school.locations?.[0]
                    const addressString = primaryAddress 
                      ? `${primaryAddress.city ?? ''}` 
                      : 'India'
                    
                    const hasEnquiries = school._count?.enquiries ?? 0
                    const hasViews = school.viewCount || school._count?.views || 0
                    const isManagedBySchool = school.verificationStatus !== 'UNCLAIMED'

                    return (
                      <div
                        key={school.id}
                        onClick={() => router.push(`/schools/${school.slug}`)}
                        className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(21,101,216,0.06)] hover:border-[#1565D8] transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col md:flex-row hover:-translate-y-0.5"
                      >
                        
                        {/* LEFT Photo Area */}
                        <div className="w-full md:w-[200px] h-40 md:h-auto shrink-0 relative overflow-hidden bg-slate-50">
                          {school.media?.[0]?.url ? (
                            <img
                              src={school.media[0].url}
                              alt={school.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            /* Styled Initial Gradient Placeholders */
                            <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gradient-to-br from-slate-550 to-slate-700 p-4 text-center select-none" style={{ background: `linear-gradient(to top right, ${getGradientByInitial(school.name).split(' ')[1]}, ${getGradientByInitial(school.name).split(' ')[3]})` }}>
                              <span className="text-5xl font-extrabold tracking-tight font-poppins mb-1.5 opacity-95">
                                {school.name[0]?.toUpperCase() || 'S'}
                              </span>
                              <span className="text-[10px] text-white/90 font-bold leading-tight uppercase tracking-wider line-clamp-2">
                                {getFirstTwoWords(school.name)}
                              </span>
                            </div>
                          )}

                          {/* Overlay featured badge (top left) */}
                          {school.isFeatured && (
                            <div className="absolute top-3 left-3 z-10">
                              <span className="bg-[#FFC107] text-slate-905 text-[9px] font-black px-2.5 py-1 rounded shadow-md uppercase tracking-wider flex items-center gap-1">
                                ⭐ FEATURED
                              </span>
                            </div>
                          )}

                          {/* Overlay admission badge (bottom left) */}
                          <div className="absolute bottom-3 left-3 z-10">
                            {school.admissionOpen ? (
                              <span className="bg-emerald-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-md uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                                Admissions Open
                              </span>
                            ) : (
                              <span className="bg-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-md shadow-md uppercase tracking-wider">
                                Admissions Closed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* RIGHT Content Area */}
                        <div className="flex-1 p-4 md:p-5 min-w-0 flex flex-col justify-between gap-3">
                          
                          <div className="space-y-2">
                            {/* Row 1 — School name & Bookmark/share actions */}
                            <div className="flex justify-between items-start gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h3 className="text-lg font-bold text-[#0F172A] font-poppins group-hover:text-[#1565D8] transition-colors leading-tight truncate">
                                    {school.name}
                                  </h3>
                                  {school.isVerified && (
                                    <span className="inline-flex items-center justify-center bg-blue-50 text-[#1565D8] rounded-full p-0.5 shrink-0" title="Verified School">
                                      <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-slate-400 font-bold uppercase text-[9px] tracking-wider mt-1.5">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{addressString}</span>
                                  {school.distance && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-[#1565D8]">{school.distance} km away</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 select-none">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleBookmark(school.id, school.slug)
                                  }}
                                  className={`w-8 h-8 rounded-lg border flex items-center justify-center hover:border-red-500 hover:text-red-500 transition-all duration-200 cursor-pointer ${
                                    isBookmarked
                                      ? 'bg-red-50 border-red-200 text-red-500'
                                      : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                                  }`}
                                >
                                  <Star className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleShare(school.slug)
                                  }}
                                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:border-[#1565D8] hover:text-[#1565D8] text-slate-400 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Row 2 — Board and type badges */}
                            <div className="flex items-center gap-1.5 flex-wrap select-none">
                              {school.affiliations?.map((aff, i) => (
                                <span key={i} className="text-[9px] font-bold text-[#1565D8] bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full uppercase">
                                  {aff.board}
                                </span>
                              ))}
                              
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full uppercase">
                                {school.institutionType || 'Private'}
                              </span>

                              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase">
                                Co-Ed
                              </span>

                              <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full uppercase">
                                Nursery – 12th
                              </span>
                            </div>

                            {/* Row 3 — Stats row */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-505">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{hasViews} Views</span>
                              </div>
                              <span className="text-slate-300">•</span>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{hasEnquiries} Enquiries</span>
                              </div>
                              {school.avgRating > 0 && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <div className="flex items-center gap-1 text-amber-600">
                                    <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                                    <span>{school.avgRating.toFixed(1)} ({school.reviewCount} Reviews)</span>
                                  </div>
                                </>
                              )}
                              {school.avgResponseHours !== null && school.avgResponseHours !== undefined && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <div className="flex items-center gap-1 text-green-600">
                                    <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                                    <span>~{school.avgResponseHours}h response</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Row 4 — Trust badges */}
                            <div className="flex items-center gap-3 select-none">
                              {school.isVerified && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50/50 px-2.5 py-0.5 rounded-md border border-green-100">
                                  <ShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                  <span>Verified School</span>
                                </div>
                              )}
                              {isManagedBySchool && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-[#1565D8] bg-blue-50/50 px-2.5 py-0.5 rounded-md border border-blue-100">
                                  <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span>Managed by School</span>
                                </div>
                              )}
                            </div>

                          </div>

                          {/* Row 5 — Action Buttons footer row */}
                          <div className="flex flex-wrap items-center gap-3 pt-3.5 border-t border-slate-100 select-none">
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEnquiryOpen(school)
                              }}
                              className="bg-[#1565D8] hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl h-auto flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer border border-transparent"
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
                              className="border border-[#1565D8] hover:bg-blue-50/50 text-[#1565D8] text-xs font-bold px-5 py-2.5 rounded-xl h-auto transition bg-white cursor-pointer"
                            >
                              View Profile
                            </Button>
                            
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCompare(school)
                              }}
                              className={`border text-xs font-bold px-5 py-2.5 rounded-xl h-auto transition cursor-pointer ${
                                comparedSlugs.includes(school.slug)
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-600 hover:bg-emerald-100/50'
                                  : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                              }`}
                            >
                              {comparedSlugs.includes(school.slug) ? '✓ Compared' : '+ Compare'}
                            </Button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`https://maps.google.com/?q=${encodeURIComponent(school.name + ' ' + addressString)}`, '_blank')
                              }}
                              className="bg-slate-800 text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-700 transition flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
                              Locate Us
                            </button>
                          </div>

                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 10. PAGINATION ELEMENT */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 select-none">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-605 bg-white hover:border-[#1565D8] hover:text-[#1565D8] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white mt-12 py-12 px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-slate-700 pb-8">
          <div className="space-y-4">
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

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">For Parents</h4>
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-355">
              <Link href="/schools" className="hover:text-white transition">Find Schools</Link>
              <Link href="/learning-centers" className="hover:text-white transition">Learning Centers</Link>
              <Link href="/schools?sort=rating" className="hover:text-white transition">Compare Schools</Link>
              <Link href="/login" className="hover:text-white transition">Parent Login</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-405">For Schools</h4>
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-355">
              <Link href="/signup" className="hover:text-white transition">List Your School</Link>
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
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
          <span>&copy; 2026 TechParrot Innovations LLP. All rights reserved.</span>
        </div>
      </footer>

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

      {/* Login Prompt Modal */}
      {loginPromptOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-fade-in">
            <Bookmark className="w-12 h-12 text-[#1565D8] mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider mb-2">Save this School</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Please sign in with a parent account to bookmark schools and track your admission enquiries.
            </p>
            <div className="flex gap-3">
              <Link href="/login" className="flex-1">
                <Button className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl h-auto">
                  Login
                </Button>
              </Link>
              <Link href="/parent/register" className="flex-1">
                <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs py-2.5 rounded-xl h-auto">
                  Register
                </Button>
              </Link>
            </div>
            <button 
              onClick={() => setLoginPromptOpen(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 mt-4 underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl z-50 animate-slide-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="hover:text-slate-300 ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <CompareBar />
    </div>
  )
}
