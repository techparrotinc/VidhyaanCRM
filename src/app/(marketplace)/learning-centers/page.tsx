"use client"

import { appAlert } from '@/components/ui/app-alert'

import React, { useState, useEffect, useCallback } from 'react'
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
  Sparkles,
  Clock,
  Video,
  Award,
  Users,
  GraduationCap,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocation } from '@/hooks/useLocation'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import CompareBar from '@/components/CompareBar'
import { SearchAutocomplete } from '@/components/marketplace/SearchAutocomplete'
import LocationSelector from '@/components/LocationSelector'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

// Interface for Mock Data
interface LearningCenter {
  id: string
  name: string
  slug: string
  activityType: string
  category: string
  city: string
  monthlyFee: number
  yearlyFee?: number
  ageGroup: string
  timing: string
  trialAvailable: boolean
  isVerified: boolean
  rating: number
  reviewCount: number
  viewCount: number
  enrolledStudents: number
  batchesCount: number
  gender: 'Co-Ed' | 'Girls Only' | 'Boys Only'
  enrollingStatus: 'Enrolling Now' | 'Batch Full'
  homeVisits: boolean
  instructorsCount: number
  coverPhoto?: string | null
  distance?: number | null
}

const mockCenters: LearningCenter[] = [
  {
    id: 'lc-1',
    name: 'Kalakshetra Dance Academy',
    slug: 'kalakshetra-dance-academy',
    activityType: 'Dance',
    category: 'Dance & Performing Arts',
    city: 'Chennai',
    monthlyFee: 2000,
    yearlyFee: 20000,
    ageGroup: 'Kids 5-10 years',
    timing: 'Sat & Sun 9-11 AM',
    trialAvailable: true,
    isVerified: true,
    rating: 4.8,
    reviewCount: 34,
    viewCount: 210,
    enrolledStudents: 65,
    batchesCount: 3,
    gender: 'Co-Ed',
    enrollingStatus: 'Enrolling Now',
    homeVisits: false,
    instructorsCount: 4
  },
  {
    id: 'lc-2',
    name: 'Swara Music Institute',
    slug: 'swara-music-institute',
    activityType: 'Music',
    category: 'Music & Instruments',
    city: 'Chennai',
    monthlyFee: 1500,
    yearlyFee: 15000,
    ageGroup: 'Kids 5-10 years',
    timing: 'Mon Wed Fri 5-7 PM',
    trialAvailable: true,
    isVerified: true,
    rating: 4.7,
    reviewCount: 22,
    viewCount: 145,
    enrolledStudents: 48,
    batchesCount: 2,
    gender: 'Co-Ed',
    enrollingStatus: 'Enrolling Now',
    homeVisits: true,
    instructorsCount: 3
  },
  {
    id: 'lc-3',
    name: 'Creative Strokes Art Studio',
    slug: 'creative-strokes-art-studio',
    activityType: 'Art',
    category: 'Art & Craft',
    city: 'Chennai',
    monthlyFee: 1200,
    yearlyFee: 12000,
    ageGroup: 'Kids 5-10 years',
    timing: 'Tue Thu Sat 4-6 PM',
    trialAvailable: false,
    isVerified: false,
    rating: 4.5,
    reviewCount: 15,
    viewCount: 98,
    enrolledStudents: 30,
    batchesCount: 2,
    gender: 'Co-Ed',
    enrollingStatus: 'Enrolling Now',
    homeVisits: false,
    instructorsCount: 2
  },
  {
    id: 'lc-4',
    name: 'FitKids Sports Academy',
    slug: 'fitkids-sports-academy',
    activityType: 'Fitness',
    category: 'Fitness & Sports',
    city: 'Chennai',
    monthlyFee: 2500,
    yearlyFee: 25000,
    ageGroup: 'Kids 5-10 years',
    timing: 'Mon to Fri 6-8 PM',
    trialAvailable: true,
    isVerified: true,
    rating: 4.9,
    reviewCount: 41,
    viewCount: 320,
    enrolledStudents: 92,
    batchesCount: 4,
    gender: 'Co-Ed',
    enrollingStatus: 'Enrolling Now',
    homeVisits: false,
    instructorsCount: 5
  },
  {
    id: 'lc-5',
    name: 'BrightMinds Coaching Center',
    slug: 'brightminds-coaching-center',
    activityType: 'Coaching',
    category: 'Academic Coaching',
    city: 'Chennai',
    monthlyFee: 3000,
    yearlyFee: 30000,
    ageGroup: 'Pre-teens 11-14 years',
    timing: 'Mon to Sat 4-7 PM',
    trialAvailable: false,
    isVerified: true,
    rating: 4.6,
    reviewCount: 28,
    viewCount: 175,
    enrolledStudents: 110,
    batchesCount: 5,
    gender: 'Co-Ed',
    enrollingStatus: 'Batch Full',
    homeVisits: false,
    instructorsCount: 6
  },
  {
    id: 'lc-6',
    name: 'CodeKids Technology Academy',
    slug: 'codekids-technology-academy',
    activityType: 'Coding',
    category: 'Academic Coaching',
    city: 'Chennai',
    monthlyFee: 4000,
    yearlyFee: 40000,
    ageGroup: 'Kids 5-10 years',
    timing: 'Weekends 10 AM-12 PM',
    trialAvailable: true,
    isVerified: true,
    rating: 4.8,
    reviewCount: 19,
    viewCount: 130,
    enrolledStudents: 38,
    batchesCount: 2,
    gender: 'Co-Ed',
    enrollingStatus: 'Enrolling Now',
    homeVisits: false,
    instructorsCount: 3
  }
]

export default function LearningCentersSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [loginPromptOpen, setLoginPromptOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const { city: detectedCity, lat, lng } = useLocation()

  // Synced states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '')
  const [searchVal, setSearchVal] = useState(searchParams.get('search') ?? '')
  const [categoryVal, setCategoryVal] = useState('All Categories')
  const [sortBy, setSortBy] = useState('relevance')
  const [cityVal, setCityVal] = useState(detectedCity || '')

  // Sidebar Filter States
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([])
  const [selectedTimings, setSelectedTimings] = useState<string[]>([])
  const [freeTrialOnly, setFreeTrialOnly] = useState(false)
  const [minFees, setMinFees] = useState('')
  const [maxFees, setMaxFees] = useState('')
  const [selectedGender, setSelectedGender] = useState<string[]>([])

  // Layout UI states

  const [loading, setLoading] = useState(true)
  const [centers, setCenters] = useState<LearningCenter[]>([])
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  // Enquiry Modal States
  const [selectedCenter, setSelectedCenter] = useState<LearningCenter | null>(null)
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [enquirySubmitted, setEnquirySubmitted] = useState(false)
  const [enquiryForm, setEnquiryForm] = useState({
    parentName: '',
    parentPhone: '',
    studentName: '',
    age: '',
    notes: ''
  })

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
      // Fallback
      const saved = JSON.parse(localStorage.getItem('bookmarked_centers') ?? '[]')
      setBookmarkedIds(saved)
    }

    loadBookmarks()
  }, [session])

  // Sync page active city with the global location hook's active city
  useEffect(() => {
    if (detectedCity && cityVal !== detectedCity) {
      setCityVal(detectedCity)
    }
  }, [detectedCity])

  const handleSearchSubmit = (e?: React.FormEvent, customSearch?: string) => {
    if (e) e.preventDefault()
    const val = customSearch !== undefined ? customSearch : searchVal
    setSearchQuery(val)
    setCurrentPage(1)
  }

  // SEO tags
  useEffect(() => {
    document.title = "Find Best Learning Centers Near You | Dance, Music, Art Classes | Vidhyaan"
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute(
      'content',
      "Discover 300+ verified learning centers near you. Find the best dance classes, music academies, art studios, fitness centers and academic coaching in Chennai, Bangalore, Hyderabad and across India. Book trial classes directly."
    )
  }, [])

  const fetchCenters = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('institutionType', 'LEARNING_CENTER')
      if (cityVal) params.append('city', cityVal)
      if (searchQuery) params.append('search', searchQuery)
      if (lat !== null && lng !== null) {
        params.append('lat', String(lat))
        params.append('lng', String(lng))
      }

      const res = await fetch(`/api/public/schools?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch learning centers')
      const json = await res.json()

      const dbCenters = json.data ?? []

      const mapped = dbCenters.map((s: any) => {
        const act = s.activityTypes?.[0] || 'Activities'
        let displayGender: 'Co-Ed' | 'Girls Only' | 'Boys Only' = 'Co-Ed'
        if (s.gender === 'FEMALE') displayGender = 'Girls Only'
        if (s.gender === 'MALE') displayGender = 'Boys Only'

        let timing = 'Weekday evening & Weekend batches'
        if (s.batchSchedules && s.batchSchedules.length > 0) {
          const b = s.batchSchedules[0]
          const days = b.daysOfWeek?.join(', ') || ''
          timing = `${days} ${b.startTime}-${b.endTime}`
        }

        return {
          id: s.id,
          name: s.name,
          slug: s.slug,
          activityType: act,
          category: act,
          city: s.locations?.[0]?.city || 'Chennai',
          monthlyFee: s.monthlyFeeMin || 1500,
          yearlyFee: s.monthlyFeeMax || 3000,
          ageGroup: s.ageGroupMin && s.ageGroupMax ? `${s.ageGroupMin}-${s.ageGroupMax} yrs` : 'Kids & Adults',
          timing,
          trialAvailable: s.trialClassAvailable || false,
          isVerified: s.isVerified || false,
          rating: s.avgRating || 4.5,
          reviewCount: s.reviewCount || 0,
          viewCount: s.viewCount || 0,
          enrolledStudents: s.enrolledStudentCount || 0,
          batchesCount: s.batchCount || s.batchSchedules?.length || 0,
          gender: displayGender,
          enrollingStatus: s.enrollmentStatus === 'OPEN' ? 'Enrolling Now' : 'Batch Full',
          homeVisits: s.homeVisitAvailable || false,
          description: s.description,
          foundedYear: s.establishedYear,
          coverPhoto: s.media?.[0]?.url || null,
          distance: s.distance !== null && s.distance !== undefined ? Number(Number(s.distance).toFixed(1)) : null
        }
      })

      let filtered = [...mapped]

      if (selectedActivities.length > 0) {
        filtered = filtered.filter((c: any) =>
          selectedActivities.some((act) => act.toLowerCase() === c.activityType.toLowerCase())
        )
      }

      if (selectedAgeGroups.length > 0) {
        filtered = filtered.filter((c: any) =>
          selectedAgeGroups.some((age) => c.ageGroup.includes(age.replace(' yrs', '')))
        )
      }

      if (freeTrialOnly) {
        filtered = filtered.filter((c: any) => c.trialAvailable)
      }

      if (selectedTimings.length > 0) {
        if (selectedTimings.includes('Weekends Only')) {
          filtered = filtered.filter(
            (c: any) => c.timing.toLowerCase().includes('sat') || c.timing.toLowerCase().includes('sun')
          )
        }
      }

      if (minFees) {
        filtered = filtered.filter((c: any) => c.monthlyFee >= Number(minFees))
      }
      if (maxFees) {
        filtered = filtered.filter((c: any) => c.monthlyFee <= Number(maxFees))
      }

      if (selectedGender.length > 0) {
        filtered = filtered.filter((c: any) => selectedGender.includes(c.gender))
      }

      if (sortBy === 'rating') {
        filtered.sort((a: any, b: any) => b.rating - a.rating)
      } else if (sortBy === 'newest') {
        filtered.sort((a: any, b: any) => b.viewCount - a.viewCount)
      } else if (sortBy === 'fees-low') {
        filtered.sort((a: any, b: any) => a.monthlyFee - b.monthlyFee)
      } else if (sortBy === 'distance' && lat !== null && lng !== null) {
        filtered.sort((a: any, b: any) => (a.distance ?? 999) - (b.distance ?? 999))
      }

      setCenters(filtered)
    } catch (err) {
      console.error('Error fetching learning centers:', err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, cityVal, categoryVal, selectedActivities, selectedAgeGroups, selectedTimings, freeTrialOnly, minFees, maxFees, selectedGender, sortBy, lat, lng])

  useEffect(() => {
    fetchCenters()
  }, [fetchCenters])

  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    )
    setCurrentPage(1)
  }

  const toggleAgeGroup = (age: string) => {
    setSelectedAgeGroups((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]
    )
    setCurrentPage(1)
  }

  const toggleGender = (gender: string) => {
    setSelectedGender((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]
    )
    setCurrentPage(1)
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
          setToastMsg('Learning center saved to bookmarks')
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

  const handleClearFilters = () => {
    setSearchQuery('')
    setSearchVal('')
    setSelectedActivities([])
    setSelectedAgeGroups([])
    setSelectedTimings([])
    setFreeTrialOnly(false)
    setMinFees('')
    setMaxFees('')
    setSelectedGender([])
    setSortBy('relevance')
    setCurrentPage(1)
  }

  const handleEnquiryOpen = (center: LearningCenter) => {
    setSelectedCenter(center)
    setEnquiryOpen(true)
  }

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEnquirySubmitted(true)
    setTimeout(() => {
      setEnquiryOpen(false)
      setEnquirySubmitted(false)
      setSelectedCenter(null)
      setEnquiryForm({
        parentName: '',
        parentPhone: '',
        studentName: '',
        age: '',
        notes: ''
      })
    }, 2000)
  }

  const getGradientAndEmoji = (activity: string) => {
    const act = activity.toLowerCase()
    if (act.includes('dance')) return { bg: 'from-purple-500 to-pink-500', emoji: '💃' }
    if (act.includes('music')) return { bg: 'from-blue-500 to-indigo-650', emoji: '🎵' }
    if (act.includes('art')) return { bg: 'from-orange-500 to-amber-500', emoji: '🎨' }
    if (act.includes('fitness') || act.includes('sports')) return { bg: 'from-green-500 to-teal-600', emoji: '🏋' }
    if (act.includes('coach') || act.includes('academic')) return { bg: 'from-blue-600 to-sky-850', emoji: '📚' }
    if (act.includes('code') || act.includes('tech')) return { bg: 'from-cyan-500 to-blue-700', emoji: '💻' }
    return { bg: 'from-slate-500 to-slate-700', emoji: '🌍' }
  }

  const getActivityColors = (activity: string) => {
    const act = activity.toLowerCase()
    if (act.includes('dance')) return 'bg-purple-50 text-purple-650 border border-purple-100'
    if (act.includes('music')) return 'bg-blue-50 text-blue-650 border border-blue-100'
    if (act.includes('art')) return 'bg-orange-50 text-orange-655 border border-orange-100'
    return 'bg-green-50 text-green-650 border border-green-100'
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      {/* 1. BRAND HEADER */}
      <MarketplaceHeader />

      {/* SECTION 1 — TAB BAR */}
      <div className="bg-white border-b border-slate-200 select-none">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex">
          <Link 
            href="/schools" 
            className="py-3 px-6 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 border-b-2 border-transparent"
          >
            Schools
          </Link>
          <Link 
            href="/learning-centers" 
            className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[#1565D8] border-b-2 border-[#1565D8]"
          >
            Learning Centers
          </Link>
        </div>
      </div>

      {/* SECTION 2 — BLUE SEARCH HERO */}
      <section className="bg-[#1565D8] text-white py-6 px-4 md:px-8 select-none relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5 opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black font-poppins tracking-tight">
              Find the Best Learning Center for Your Child's Passion
            </h1>
            <p className="text-[11px] md:text-xs text-blue-100 font-medium leading-relaxed">
              Discover 300+ verified dance classes, music academies, art studios and coaching centers near you. Book a trial class today.
            </p>
          </div>

          <form 
            onSubmit={(e) => handleSearchSubmit(e)} 
            className="bg-white rounded-2xl p-2.5 shadow-lg border border-slate-200 text-slate-800 flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap items-stretch gap-2.5"
          >
            {/* Category dropdown */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-[48%] md:w-56 md:flex-none shrink-0 gap-2">
              <LayoutGrid className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={categoryVal}
                onChange={(e) => setCategoryVal(e.target.value)}
                className="bg-transparent text-slate-700 outline-none text-xs font-bold w-full cursor-pointer"
              >
                <option value="All Categories">All Categories</option>
                <option value="Dance & Performing Arts">Dance & Performing Arts</option>
                <option value="Music & Instruments">Music & Instruments</option>
                <option value="Art & Craft">Art & Craft</option>
                <option value="Fitness & Sports">Fitness & Sports</option>
                <option value="Academic Coaching">Academic Coaching</option>
                <option value="Skill Development">Skill Development</option>
                <option value="Language Classes">Language Classes</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-[48%] md:flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 gap-2">
              <SearchAutocomplete
                value={searchVal}
                onChange={setSearchVal}
                onSubmit={(val) => {
                  setSearchVal(val)
                  handleSearchSubmit(undefined, val)
                }}
                institutionType="LEARNING_CENTER"
                placeholder="Dance class, music academy, coaching center..."
                className="bg-transparent border-0 outline-none text-slate-700 text-xs placeholder-slate-400 font-semibold w-full"
              />
            </div>

            <div className="flex flex-row items-stretch gap-2.5 w-full md:w-auto md:contents">
              <LocationSelector className="flex-1 md:flex-none md:w-72 md:min-w-[260px] md:shrink-0" />

              {/* Search Button */}
              <Button 
                type="submit" 
                className="w-[140px] md:w-[160px] bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-auto shrink-0 shadow-sm cursor-pointer whitespace-nowrap border border-transparent flex items-center justify-center"
              >
                Find Centers
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* SECTION 3 — QUICK FILTER BAR */}
      <section className="bg-white border-b border-slate-200 py-3 px-4 md:px-8 sticky top-16 z-30 shadow-sm select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 flex-wrap">
          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-slate-100 transition"
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Rating High to Low</option>
              <option value="newest">Newest Listed</option>
              <option value="fees-low">Fees: Low to High</option>
              {lat !== null && lng !== null && (
                <option value="distance">Distance Nearest</option>
              )}
            </select>
          </div>

          {/* Activity Pills row */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['Dance', 'Music', 'Art', 'Fitness', 'Coaching', 'Coding', 'Language'].map((act) => {
              const isActive = selectedActivities.includes(act)
              return (
                <button
                  key={act}
                  onClick={() => toggleActivity(act)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                    isActive
                      ? 'bg-[#1565D8] border-[#1565D8] text-white shadow-sm'
                      : 'bg-white border-slate-250 text-slate-650 hover:bg-slate-50'
                  }`}
                >
                  {act}
                </button>
              )
            })}
          </div>

          {/* Result Counts */}
          <div className="text-xs font-semibold text-slate-400">
            {centers.length} learning centers found
          </div>
        </div>
      </section>

      {/* SECTION 4 — MAIN CONTENT */}
      <main className="flex-1 bg-[#F5F7FA] py-8 px-4 md:px-8 select-none">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Sidebar Filter Panel (280px) */}
          <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-28">
            <Card className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-500 tracking-wider">
                  <Filter className="w-3.5 h-3.5" />
                  <span>SEARCH FILTERS</span>
                </div>
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-[#1565D8] hover:underline"
                >
                  Clear all
                </button>
              </div>



              <Separator className="bg-slate-100" />

              {/* Activity Type checklist */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">ACTIVITY TYPE</span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {[
                    { name: 'Dance', count: 12 },
                    { name: 'Music', count: 8 },
                    { name: 'Art', count: 6 },
                    { name: 'Fitness', count: 9 },
                    { name: 'Coaching', count: 15 },
                    { name: 'Coding', count: 5 },
                    { name: 'Language', count: 4 }
                  ].map((act) => {
                    const isChecked = selectedActivities.includes(act.name)
                    return (
                      <label key={act.name} className="flex items-center justify-between text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleActivity(act.name)}
                            className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-blue-500 accent-[#1565D8] cursor-pointer"
                          />
                          <span>{act.name}</span>
                        </div>
                        <span className="bg-slate-100 text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-black">
                          {act.count}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* Age Group Checklist */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">AGE GROUP</span>
                <div className="space-y-2">
                  {[
                    { label: 'Toddlers 2-4 years', count: 8 },
                    { label: 'Kids 5-10 years', count: 22 },
                    { label: 'Pre-teens 11-14 years', count: 18 },
                    { label: 'Teens 15-18 years', count: 12 },
                    { label: 'Adults 18+ years', count: 15 }
                  ].map((age) => {
                    const isChecked = selectedAgeGroups.includes(age.label)
                    return (
                      <label key={age.label} className="flex items-center justify-between text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAgeGroup(age.label)}
                            className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-blue-500 accent-[#1565D8] cursor-pointer"
                          />
                          <span>{age.label}</span>
                        </div>
                        <span className="bg-slate-100 text-slate-450 text-[10px] px-1.5 py-0.5 rounded">
                          {age.count}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* Batch Timings */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">BATCH TIMING</span>
                <div className="space-y-2">
                  {[
                    { name: 'Morning (before 12 PM)', count: 15 },
                    { name: 'Afternoon (12 PM - 4 PM)', count: 10 },
                    { name: 'Evening (4 PM - 8 PM)', count: 28 },
                    { name: 'Weekends Only', count: 18 }
                  ].map((t) => {
                    const isChecked = selectedTimings.includes(t.name)
                    return (
                      <label key={t.name} className="flex items-center justify-between text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedTimings(prev =>
                                prev.includes(t.name) ? prev.filter(x => x !== t.name) : [...prev, t.name]
                              )
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-blue-500 accent-[#1565D8] cursor-pointer"
                          />
                          <span>{t.name}</span>
                        </div>
                        <span className="bg-slate-100 text-slate-400 text-[10px] px-1.5 py-0.5 rounded">
                          {t.count}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* Trial Class Checkbox */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">TRIAL CLASS</span>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-800">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={freeTrialOnly}
                      onChange={() => setFreeTrialOnly(!freeTrialOnly)}
                      className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-blue-500 accent-[#1565D8] cursor-pointer"
                    />
                    <span>Free trial available</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded font-black">
                    20
                  </span>
                </label>
              </div>

              <Separator className="bg-slate-100" />

              {/* Monthly Fees Inputs & presets */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">MONTHLY FEES</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-450">₹</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minFees}
                      onChange={(e) => setMinFees(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-450">₹</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxFees}
                      onChange={(e) => setMaxFees(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Preset Fee Pills */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {[
                    { label: 'Under ₹500', min: '0', max: '500' },
                    { label: '₹500-1000', min: '500', max: '1000' },
                    { label: '₹1000-2000', min: '1000', max: '2000' },
                    { label: 'Above ₹2000', min: '2000', max: '99999' }
                  ].map((preset) => {
                    const isSelected = minFees === preset.min && maxFees === preset.max
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setMinFees(preset.min)
                          setMaxFees(preset.max)
                        }}
                        className={`text-[9px] font-bold px-2 py-1 rounded-md border transition ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* Gender Checklist */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">GENDER</span>
                <div className="space-y-2">
                  {['Co-Ed', 'Girls Only', 'Boys Only'].map((gen) => {
                    const isChecked = selectedGender.includes(gen)
                    return (
                      <label key={gen} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 cursor-pointer hover:text-slate-800">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleGender(gen)}
                          className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-blue-500 accent-[#1565D8] cursor-pointer"
                        />
                        <span>{gen}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </Card>
          </aside>

          {/* Right Column: Listing & Cards Grid */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Results Header block */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-850">
                  Learning Centers near {cityVal || 'Chennai'}
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  Showing 1-{centers.length} of {centers.length} centers
                </p>
              </div>

              {/* Active Filter Chips */}
              <div className="hidden md:flex flex-wrap gap-1.5 max-w-md justify-end">
                {selectedActivities.map((act) => (
                  <span key={act} className="inline-flex items-center bg-blue-50 text-[#1565D8] text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                    {act}
                    <button onClick={() => toggleActivity(act)} className="ml-1 text-[#1565D8]/70 hover:text-[#1565D8] shrink-0 font-black">&times;</button>
                  </span>
                ))}
                {freeTrialOnly && (
                  <span className="inline-flex items-center bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                    Free Trial
                    <button onClick={() => setFreeTrialOnly(false)} className="ml-1 text-emerald-600/70 hover:text-emerald-600 shrink-0 font-black">&times;</button>
                  </span>
                )}
              </div>
            </div>

            {/* Main Cards Stack */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((num) => (
                  <Card key={num} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row h-auto md:h-52">
                    <Skeleton className="w-full md:w-52 h-44 md:h-full bg-slate-200" />
                    <div className="flex-1 p-5 space-y-4">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-3/4 bg-slate-200" />
                        <Skeleton className="h-4 w-1/2 bg-slate-200" />
                      </div>
                      <Skeleton className="h-5 w-1/3 bg-slate-200" />
                      <div className="flex gap-4 pt-2">
                        <Skeleton className="h-9 w-28 bg-slate-200" />
                        <Skeleton className="h-9 w-28 bg-slate-200" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : centers.length === 0 ? (
              // Empty State view
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-xl shadow-sm">
                  💃🎨🎵
                </div>
                <h3 className="text-base font-black text-slate-800">No learning centers found</h3>
                <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
                  Try different activity type or search in a nearby city to find available slots.
                </p>
                <Button 
                  onClick={handleClearFilters}
                  className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl h-auto"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {centers.map((c) => {
                  const gradient = getGradientAndEmoji(c.activityType)
                  const isBookmarked = bookmarkedIds.includes(c.id)
                  
                  return (
                    <Card 
                      key={c.id} 
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row shadow-sm hover:shadow-lg hover:border-[#1565D8] transition duration-300 relative group h-auto"
                    >
                      {/* Left Photo Area */}
                      <div className="w-full md:w-52 h-44 md:h-auto shrink-0 relative overflow-hidden bg-slate-100">
                        {c.coverPhoto ? (
                          <img
                            src={c.coverPhoto}
                            alt={c.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${gradient.bg} flex flex-col items-center justify-center text-white relative`}>
                            <span className="text-4xl animate-bounce duration-1000">{gradient.emoji}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-white/80 mt-2">
                              {c.activityType}
                            </span>
                          </div>
                        )}

                        {/* Top-Left Trial badge */}
                        {c.trialAvailable && (
                          <span className="absolute top-2.5 left-2.5 bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm z-10">
                            ✓ Free Trial
                          </span>
                        )}

                        {/* Bottom-Left Enrollment Status badge */}
                        <span className={`absolute bottom-2.5 left-2.5 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm z-10 text-white ${
                          c.enrollingStatus === 'Enrolling Now' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                          {c.enrollingStatus}
                        </span>
                      </div>

                      {/* Right Details Content Area */}
                      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                        <div>
                          {/* Row 1: Name and location */}
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-base font-black text-slate-850 group-hover:text-[#1565D8] transition">
                                  <Link href={`/learning-centers/${c.slug}`}>{c.name}</Link>
                                </h3>
                                {c.isVerified && (
                                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{c.city}</span>
                                {c.distance !== null && c.distance !== undefined && (
                                  <>
                                    <span className="text-slate-350">•</span>
                                    <span className="text-[#1565D8]">{c.distance} km away</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Bookmark and Share icons */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => toggleBookmark(c.id, c.slug)}
                                className={`p-1.5 border rounded-lg transition hover:bg-slate-50 cursor-pointer ${
                                  isBookmarked
                                    ? 'bg-red-50 border-red-200 text-red-500'
                                    : 'border-slate-200 text-slate-400'
                                }`}
                              >
                                <Bookmark className="w-3.5 h-3.5 fill-current" />
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/learning-centers/${c.slug}`)
                                  appAlert('Link copied to clipboard!')
                                }}
                                className="p-1.5 border border-slate-200 text-slate-400 rounded-lg transition hover:bg-slate-50 cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Badges row */}
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            <Badge className={`font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded ${getActivityColors(c.activityType)}`}>
                              {c.activityType}
                            </Badge>
                            <Badge className="bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                              {c.ageGroup}
                            </Badge>
                            <Badge className="bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                              {c.gender}
                            </Badge>
                            {c.homeVisits && (
                              <Badge className="bg-blue-50 text-[#1565D8] border border-blue-100 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                                Home Visits
                              </Badge>
                            )}
                          </div>

                          {/* Row 3: Schedule timings */}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold mt-3">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{c.timing}</span>
                            <span className="text-slate-300">•</span>
                            {c.batchesCount > 1 ? (
                              <span className="text-[#1565D8] hover:underline cursor-pointer">
                                {c.batchesCount} batches available
                              </span>
                            ) : (
                              <span>1 batch</span>
                            )}
                          </div>
                        </div>

                        {/* Lower section divided by line */}
                        <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          {/* Row 4: Stats */}
                          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{c.viewCount} Views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>{c.enrolledStudents} Enrolled</span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-black border border-amber-100/50">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{c.rating} ({c.reviewCount})</span>
                            </div>
                          </div>

                          {/* Row 5: Monthly Fee Display */}
                          <div className="text-right">
                            <div className="text-xs font-black text-slate-800">
                              ₹{c.monthlyFee.toLocaleString()}/month
                            </div>
                            {c.yearlyFee && (
                              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                or ₹{c.yearlyFee.toLocaleString()}/year
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Row 7: Action Buttons footer */}
                        <div className="border-t border-slate-100 pt-3 flex flex-wrap justify-between items-center gap-2">
                          <div className="flex gap-2">
                            {c.trialAvailable ? (
                              <Button
                                onClick={() => handleEnquiryOpen(c)}
                                className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl h-auto shadow-sm"
                              >
                                Book Trial Class
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleEnquiryOpen(c)}
                                className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl h-auto shadow-sm"
                              >
                                Enquire Now
                              </Button>
                            )}
                            <Link href={`/learning-centers/${c.slug}`}>
                              <Button variant="outline" className="border-slate-200 text-slate-650 hover:bg-slate-50 font-bold text-xs px-4 py-2 rounded-xl h-auto">
                                View Profile
                              </Button>
                            </Link>
                          </div>

                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name + ' ' + c.city)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" className="border-slate-200 text-slate-400 hover:text-slate-600 font-bold text-xs px-3 py-2 rounded-xl h-auto flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Get Directions</span>
                            </Button>
                          </a>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {centers.length > 0 && (
              <div className="flex justify-center items-center gap-2 pt-6 select-none font-semibold text-slate-500">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="border-slate-200 font-bold text-xs h-auto px-3.5 py-2.5 rounded-xl cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                
                <span className="bg-[#1565D8] text-white text-xs font-bold w-9 h-9 rounded-xl flex items-center justify-center border border-blue-500 shadow-sm">
                  1
                </span>

                <Button
                  variant="outline"
                  disabled={true}
                  className="border-slate-200 font-bold text-xs h-auto px-3.5 py-2.5 rounded-xl opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white mt-12 py-12 px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-slate-700 pb-8">
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
              <Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-white transition">Terms of Service</Link>
              <Link href="/terms-of-service" className="hover:text-white transition">Refund Policy</Link>
              <Link href="/data-deletion" className="hover:text-white transition">Data Deletion</Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
          <span>&copy; 2026 TechParrot Innovations LLP. All rights reserved.</span>
        </div>
      </footer>

      {/* Trial Booking / Enquiry Modal */}
      <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-slate-200 select-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800">
              {selectedCenter?.trialAvailable ? 'Book a Free Trial Class' : 'Submit Enrollment Enquiry'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium mt-1">
              Provide details below. The administrator at {selectedCenter?.name} will contact you to schedule a slot.
            </DialogDescription>
          </DialogHeader>

          {enquirySubmitted ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 border border-green-200">
                <Check className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Enquiry Submitted!</h4>
              <p className="text-xs text-slate-405 font-semibold max-w-xs leading-relaxed">
                Thank you! Your trial slot / enquiry has been logged. You will receive a call within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEnquirySubmit} className="space-y-4 mt-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Parent Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saran Kumar"
                  value={enquiryForm.parentName}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, parentName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Student Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Kumar"
                    value={enquiryForm.studentName}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, studentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Parent Mobile *</label>
                  <input
                    type="tel"
                    required
                    pattern="[6-9]\d{9}"
                    placeholder="e.g. 9845000001"
                    value={enquiryForm.parentPhone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, parentPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Student Age</label>
                <input
                  type="number"
                  placeholder="e.g. 8"
                  value={enquiryForm.age}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, age: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Message (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Specify preferences or queries..."
                  value={enquiryForm.notes}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none resize-none focus:border-blue-500"
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
                  className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs h-auto px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md border border-blue-500"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Request
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
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider mb-2">Save this Center</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Please sign in with a parent account to bookmark learning centers and track your queries.
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
