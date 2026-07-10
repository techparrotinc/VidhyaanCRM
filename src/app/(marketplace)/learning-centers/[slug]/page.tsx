"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  MapPin,
  Star,
  Bookmark,
  Award,
  Calendar,
  Users,
  Clock,
  Phone,
  Mail,
  Globe,
  XCircle,
  Building,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Share2,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Shield,
  Send,
  X,
  FileText,
  Camera,
  Check,
  ChevronDown,
  LayoutGrid,
  Layers,
  Wallet,
  UserPlus,
  Zap,
  Cloud,
  GraduationCap,
  Trophy,
  FlaskConical,
  Computer,
  Bus,
  Utensils,
  HeartPulse,
  Tv,
  Waves,
  Music,
  Palette,
  Video,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import CompareBar from '@/components/CompareBar'
import LoginPromptModal from '@/components/marketplace/LoginPromptModal'
import MarketplaceToast from '@/components/marketplace/MarketplaceToast'
import GatedWrapper from '@/components/marketplace/GatedWrapper'
import ParentRegisterModal from '@/components/parent-auth/ParentRegisterModal'
import SchoolGalleryLightbox from '@/components/marketplace/school-profile/SchoolGalleryLightbox'
import ReviewModal from '@/components/marketplace/school-profile/ReviewModal'
import { getReviewCategories } from '@/lib/reviews/categories'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'

// Type Definitions matching page mock data
interface LearningCenter {
  id: string
  name: string
  slug: string
  activityType: string
  category: string
  city: string
  monthlyFee: number
  yearlyFee: number
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
  description?: string
  foundedYear?: number
  locations?: any[]
  contacts?: any[]
  media?: { id: string; url: string; caption: string | null; sortOrder: number }[]
  reviews?: any[]
  batchSchedules?: any[]
  instructors?: any[]
  institutionType?: string
  stats?: {
    totalReviews: number
    avgRating: number
    ratingsBreakdown: Record<string, number>
    ratingsBreakdownLabels?: Record<string, string>
  } | null
}

// Local mock data list for slug lookup
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
    instructorsCount: 4,
    foundedYear: 2015,
    description: 'Renowned academy for Classical Indian Dance training. Specialized in Bharatanatyam, Kathak, and traditional folk dance styles. Expert gurus providing certifications.'
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
    instructorsCount: 3,
    foundedYear: 2018,
    description: 'Nurturing vocal and instrumental musical skills. Specialized Carnatic vocal coaching, violin, flute, and keyboard classes. Weekly performance circles and concerts.'
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
    instructorsCount: 2,
    foundedYear: 2020,
    description: 'Unleash your creativity with professional art instruction. Specialized in drawing, canvas painting, clay modeling, sketching, and traditional craft works.'
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
    instructorsCount: 5,
    foundedYear: 2016,
    description: 'Promoting active habits and fitness for kids. Football, basketball, athletic fitness drills, and karate classes. Modern indoor playground setup.'
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
    instructorsCount: 6,
    foundedYear: 2012,
    description: 'Dedicated academic tuition classes for CBSE and State board students. Focus on mathematics, physics, and chemistry. Weekly mock evaluations and counseling.'
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
    instructorsCount: 3,
    foundedYear: 2021,
    description: 'Modern programming classes for youngsters. Interactive blocks, Scratch, Python game development, web design, and algorithmic problem solving.'
  }
]

export default function LearningCenterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const { data: session, update } = useSession()

  // Non-parent visitors see gated (blurred) detail sections, same as school profiles
  const isGated = !session?.user || session.user.role !== 'PARENT'
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // State Management
  const [center, setCenter] = useState<LearningCenter | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Overview')
  const [bookmarked, setBookmarked] = useState(false)

  const [similarLCs, setSimilarLCs] = useState<LearningCenter[]>([])

  // Modal / Form states
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [enquirySubmitted, setEnquirySubmitted] = useState(false)
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewItems, setReviewItems] = useState<any[] | null>(null)
  const [reviewSort, setReviewSort] = useState<'recent' | 'highest' | 'lowest'>('recent')
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false)
  const [reviewEligibility, setReviewEligibility] = useState<{
    loggedIn: boolean
    eligible: boolean
    verified: boolean
    reason: string | null
    existingReviewId: string | null
    kids?: { id: string; name: string }[]
  } | null>(null)
  const [enquiryLoading, setEnquiryLoading] = useState(false)
  const [enquiryError, setEnquiryError] = useState<string | null>(null)
  const [enquiryForm, setEnquiryForm] = useState({
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    studentName: '',
    age: '',
    notes: '',
    batchScheduleId: ''
  })

  // Prefill enquiry form for logged-in parents: session first, then the
  // authoritative Parent record (its phone links enquiries to review eligibility)
  useEffect(() => {
    if (!session?.user || session.user.role !== 'PARENT') return
    const sessionPhone = (session.user as any).phone || ''
    setEnquiryForm(prev => ({
      ...prev,
      parentName: prev.parentName || session.user.name || '',
      parentPhone: prev.parentPhone || sessionPhone,
      parentEmail: prev.parentEmail || session.user.email || ''
    }))
    if (sessionPhone) return
    fetch('/api/v1/parent/profile')
      .then((r) => r.json())
      .then((json) => {
        const p = json?.data
        if (!p) return
        setEnquiryForm(prev => ({
          ...prev,
          parentName: prev.parentName || p.name || '',
          parentPhone: prev.parentPhone || p.phone || '',
          parentEmail: prev.parentEmail || p.email || ''
        }))
      })
      .catch(() => {})
  }, [session])

  const tabItems = [
    { name: 'Overview', id: 'overview' },
    { name: 'Batches & Schedule', id: 'schedule' },
    { name: 'Instructors', id: 'instructors' },
    { name: 'Gallery', id: 'gallery' },
    { name: 'Fees', id: 'fees' },
    { name: 'Reviews', id: 'reviews' },
    { name: 'Location', id: 'location' }
  ]

  // Lookup Center on Mount
  useEffect(() => {
    if (!slug) return
    const fetchCenterDetails = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/schools/${slug}`)
        if (!res.ok) throw new Error('Learning center not found')
        const json = await res.json()
        const dbSchool = json.data
        if (dbSchool) {
          const act = dbSchool.activityTypes?.[0] || 'Activities'
          let displayGender: 'Co-Ed' | 'Girls Only' | 'Boys Only' = 'Co-Ed'
          if (dbSchool.gender === 'FEMALE') displayGender = 'Girls Only'
          if (dbSchool.gender === 'MALE') displayGender = 'Boys Only'

          let timing = 'Weekday evening & Weekend batches'
          if (dbSchool.batchSchedules && dbSchool.batchSchedules.length > 0) {
            const b = dbSchool.batchSchedules[0]
            const days = b.daysOfWeek?.join(', ') || ''
            timing = `${days} ${b.startTime}-${b.endTime}`
          }

          const mapped: any = {
            id: dbSchool.id,
            name: dbSchool.name,
            slug: dbSchool.slug,
            activityType: act,
            category: act,
            city: dbSchool.locations?.[0]?.city || 'Chennai',
            monthlyFee: dbSchool.monthlyFeeMin || 1500,
            yearlyFee: dbSchool.monthlyFeeMax || 3000,
            ageGroup: dbSchool.ageGroupMin && dbSchool.ageGroupMax ? `${dbSchool.ageGroupMin}-${dbSchool.ageGroupMax} yrs` : 'Kids & Adults',
            timing,
            trialAvailable: dbSchool.trialClassAvailable || false,
            isVerified: dbSchool.isVerified || false,
            rating: dbSchool.avgRating || 4.5,
            reviewCount: dbSchool.reviewCount || 0,
            viewCount: dbSchool.viewCount || 0,
            enrolledStudents: dbSchool.enrolledStudentCount || 0,
            batchesCount: dbSchool.batchSchedules?.length || 0,
            gender: displayGender,
            enrollingStatus: dbSchool.enrollmentStatus === 'OPEN' ? 'Enrolling Now' : 'Batch Full',
            homeVisits: dbSchool.homeVisitAvailable || false,
            description: dbSchool.description,
            foundedYear: dbSchool.establishedYear,
            locations: dbSchool.locations || [],
            contacts: dbSchool.contacts || [],
            media: dbSchool.media || [],
            reviews: dbSchool.reviews || [],
            institutionType: dbSchool.institutionType || 'LEARNING_CENTER',
            stats: dbSchool.stats || null,
            batchSchedules: dbSchool.batchSchedules || [],
            instructors: dbSchool.instructors || []
          }
          setCenter(mapped)

          // Check bookmark status
          if (session?.user && session.user.role === 'PARENT') {
            try {
              const bRes = await fetch(`/api/v1/parent/bookmarks?schoolId=${mapped.id}`)
              const bJson = await bRes.json()
              if (bJson.success) {
                setBookmarked(bJson.bookmarked)
              } else {
                const bookmarks = JSON.parse(localStorage.getItem('bookmarked_centers') ?? '[]')
                setBookmarked(bookmarks.includes(mapped.id))
              }
            } catch (e) {
              const bookmarks = JSON.parse(localStorage.getItem('bookmarked_centers') ?? '[]')
              setBookmarked(bookmarks.includes(mapped.id))
            }
          } else {
            const bookmarks = JSON.parse(localStorage.getItem('bookmarked_centers') ?? '[]')
            setBookmarked(bookmarks.includes(mapped.id))
          }

          // Load similar centers
          try {
            const simRes = await fetch(`/api/public/schools?institutionType=LEARNING_CENTER&city=${encodeURIComponent(mapped.city)}`)
            if (simRes.ok) {
              const simJson = await simRes.json()
              const filtered = (simJson.data ?? [])
                .filter((c: any) => c.slug !== dbSchool.slug)
                .slice(0, 3)
                .map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  slug: s.slug,
                  activityType: s.activityTypes?.[0] || 'Activities',
                  city: s.locations?.[0]?.city || 'Chennai',
                  trialAvailable: s.trialClassAvailable || false
                }))
              setSimilarLCs(filtered)
            }
          } catch (simErr) {
            console.error('Error loading similar centers:', simErr)
          }
        }
      } catch (err) {
        console.error('Error fetching learning center details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCenterDetails()
  }, [slug])

  // Silent re-fetch of reviews + stats after a review write/delete
  const refreshReviews = async () => {
    try {
      const res = await fetch(`/api/public/schools/${slug}`)
      if (!res.ok) return
      const json = await res.json()
      if (json.success && json.data) {
        setCenter((prev: any) => prev ? {
          ...prev,
          reviews: json.data.reviews || [],
          stats: json.data.stats || null,
          rating: json.data.avgRating || prev.rating,
          reviewCount: json.data.reviewCount ?? prev.reviewCount,
        } : prev)
        setReviewItems(null)
        setReviewSort('recent')
        setReviewPage(1)
      }
    } catch { /* keep stale data */ }
  }

  const fetchReviewPage = async (sort: string, page: number, append: boolean) => {
    setReviewsLoadingMore(true)
    try {
      const res = await fetch(`/api/public/schools/${slug}/reviews?sort=${sort}&page=${page}&pageSize=10`)
      const json = await res.json()
      if (json.success) {
        setReviewItems((prev) => {
          if (!append) return json.data.reviews
          const base = prev ?? center?.reviews ?? []
          const seen = new Set(base.map((r: any) => r.id))
          return [...base, ...json.data.reviews.filter((r: any) => !seen.has(r.id))]
        })
        setReviewPage(page)
      }
    } catch { /* keep current list */ } finally {
      setReviewsLoadingMore(false)
    }
  }

  const fetchReviewEligibility = async (schoolId: string) => {
    try {
      const res = await fetch(`/api/v1/reviews/eligibility?schoolId=${schoolId}`)
      const json = await res.json()
      if (json.success) setReviewEligibility(json.data)
    } catch { /* button falls back to login prompt */ }
  }

  useEffect(() => {
    if (center?.id) fetchReviewEligibility(center.id)
  }, [center?.id, session?.user?.id])

  const handleWriteReview = async () => {
    // Re-check live: an enquiry submitted after page load changes eligibility
    let elig = reviewEligibility
    if (center?.id) {
      try {
        const res = await fetch(`/api/v1/reviews/eligibility?schoolId=${center.id}`)
        const json = await res.json()
        if (json.success) {
          elig = json.data
          setReviewEligibility(json.data)
        }
      } catch { /* fall back to cached state */ }
    }
    if (!elig?.loggedIn) {
      setLoginPromptOpen(true)
      return
    }
    if (!elig.eligible) {
      setToastMsg(elig.reason || 'Enquire with this centre before writing a review.')
      return
    }
    setReviewOpen(true)
  }

  const handleDeleteOwnReview = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok && json.success) {
        setToastMsg('Your review has been deleted.')
        setReviewEligibility((prev) => prev ? { ...prev, existingReviewId: null } : prev)
        refreshReviews()
      } else {
        setToastMsg(json.error || 'Failed to delete review.')
      }
    } catch {
      setToastMsg('Network error. Please try again.')
    }
  }

  // SEO injection
  useEffect(() => {
    if (!center) return
    document.title = `${center.name} - Fees, Reviews, Batches | Vidhyaan`
  }, [center])

  // Scroll tracking for Tab Active Underline
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 130
      const sectionIds = ['overview', 'schedule', 'instructors', 'gallery', 'fees', 'reviews', 'location']
      
      for (const sId of sectionIds) {
        const el = document.getElementById(sId)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPos >= top && scrollPos < top + height) {
            let name = 'Overview'
            if (sId === 'schedule') name = 'Batches & Schedule'
            else if (sId === 'instructors') name = 'Instructors'
            else if (sId === 'gallery') name = 'Gallery'
            else if (sId === 'fees') name = 'Fees'
            else if (sId === 'reviews') name = 'Reviews'
            else if (sId === 'location') name = 'Location'
            setActiveTab(name)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const yOffset = -120
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveTab(tabItems.find((t) => t.id === id)?.name || 'Overview')
    }
  }

  // Sync Bookmark status when session changes
  useEffect(() => {
    const checkStatus = async () => {
      if (!center) return
      if (session?.user && session.user.role === 'PARENT') {
        try {
          const res = await fetch(`/api/v1/parent/bookmarks?schoolId=${center.id}`)
          const json = await res.json()
          if (json.success) {
            setBookmarked(json.bookmarked)
            return
          }
        } catch (e) {}
      }
      const bookmarks = JSON.parse(localStorage.getItem('bookmarked_centers') ?? '[]')
      setBookmarked(bookmarks.includes(center.id))
    }
    checkStatus()
  }, [session, center])

  const toggleBookmark = async () => {
    if (!center) return
    if (!session?.user || session.user.role !== 'PARENT') {
      setLoginPromptOpen(true)
      return
    }

    try {
      const res = await fetch(`/api/public/schools/${center.slug}/bookmark`, {
        method: 'POST'
      })
      const json = await res.json()
      if (json.success) {
        setBookmarked(json.bookmarked)
        setToastMsg(json.bookmarked ? 'Learning center saved to bookmarks' : 'Removed from bookmarks')
        setTimeout(() => setToastMsg(null), 3000)
      }
    } catch (e) {
      console.error('Error toggling bookmark:', e)
    }
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      alert('Academy profile link copied to clipboard!')
    }
  }

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnquiryLoading(true)
    setEnquiryError(null)
    try {
      const res = await fetch(`/api/public/learning-centers/${slug}/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parentName: enquiryForm.parentName,
          phone: enquiryForm.parentPhone,
          email: enquiryForm.parentEmail || undefined,
          childName: enquiryForm.studentName || enquiryForm.parentName,
          childAge: Number(enquiryForm.age) || 8,
          batchScheduleId: enquiryForm.batchScheduleId || undefined,
          activityType: center?.activityType || undefined,
          message: enquiryForm.notes || undefined
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to book trial class')
      }
      setEnquirySubmitted(true)
      setTimeout(() => {
        setEnquiryOpen(false)
        setEnquirySubmitted(false)
        setEnquiryForm({
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          studentName: '',
          age: '',
          notes: '',
          batchScheduleId: ''
        })
      }, 3000)
    } catch (err: any) {
      setEnquiryError(err.message || 'Something went wrong')
    } finally {
      setEnquiryLoading(false)
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Academy Details...</p>
        </div>
      </div>
    )
  }

  if (!center) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md">
          <Sparkles className="w-12 h-12 text-slate-350 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-slate-800">Learning Center Not Found</h2>
          <p className="text-sm text-slate-500 mt-2">Could not locate academy details in directories</p>
          <Link href="/learning-centers" className="mt-6 inline-block">
            <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl h-auto">
              Back to Centers
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const gradient = getGradientAndEmoji(center.activityType)
  const initialLetters = center.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  // logo is stored as a media row with caption 'logo' — keep it out of cover/gallery
  const logoUrl = center.media?.find((m) => m.caption === 'logo')?.url
  const galleryMedia = (center.media || []).filter((m) => m.caption !== 'logo')
  const coverPhoto = galleryMedia.find((m) => m.caption === 'cover')?.url || galleryMedia[0]?.url

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      {/* 1. BRAND HEADER */}
      <MarketplaceHeader />

      {/* 2. COVER PHOTO SECTION */}
      <section className="relative h-[200px] md:h-[280px] w-full bg-slate-200 overflow-hidden">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={`${center.name} Cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient.bg} flex flex-col items-center justify-center text-white relative`}>
            <span className="text-6xl animate-pulse">{gradient.emoji}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

        {/* Cover Info Overlay */}
        <div className="absolute bottom-4 md:bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 md:px-8 z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-white">
          <div className="flex items-center gap-4">
            <div className="relative w-[60px] h-[60px] rounded-full border-2 border-white bg-white flex items-center justify-center font-black text-lg shadow shrink-0 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={`${center.name} logo`} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className={`w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br ${gradient.bg} text-white`}>
                  {initialLetters}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h1 className="text-xl md:text-3xl font-black leading-tight drop-shadow">
                {center.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 font-semibold mt-0.5">
                {center.isVerified ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Academy
                  </Badge>
                ) : (
                  <Badge className="bg-amber-400/20 text-amber-200 border border-amber-400/40 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verification pending
                  </Badge>
                )}
                <Badge className="bg-white/10 text-white border border-white/20 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                  {center.activityType}
                </Badge>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                  <span>{center.city}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
            <Button
              onClick={() => setEnquiryOpen(true)}
              className="flex-1 md:flex-none bg-white hover:bg-slate-50 text-[#1565D8] font-bold text-xs px-5 py-2.5 rounded-xl h-auto shadow"
            >
              {center.trialAvailable ? 'Book Free Trial' : 'Enquire Now'}
            </Button>
            <Button
              onClick={toggleBookmark}
              className={`flex-1 md:flex-none border font-bold text-xs px-4 py-2.5 rounded-xl h-auto flex items-center justify-center gap-1.5 transition ${
                bookmarked
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-650'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
          </div>
        </div>
      </section>

      {/* 3. BREADCRUMBS BAR */}
      <section className="bg-white border-b border-slate-200 select-none">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 truncate">
            <Link href="/" className="hover:text-slate-600">Home</Link>
            <span>&gt;</span>
            <Link href="/learning-centers" className="hover:text-slate-600">Learning Centers</Link>
            <span>&gt;</span>
            <span className="text-slate-600 font-bold truncate max-w-[200px] md:max-w-xs">{center.name}</span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-slate-200 text-slate-500 hover:text-[#1565D8] font-bold text-xs px-3 py-2 rounded-xl h-auto flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </section>

      {/* 4. TABS NAVIGATION */}
      <div className="sticky top-16 bg-white border-b border-slate-200 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div 
            className="flex gap-6 overflow-x-auto whitespace-nowrap py-3.5 text-xs font-black uppercase tracking-wider text-slate-400"
            style={{ scrollbarWidth: 'none' }}
          >
            {tabItems.map((tab) => {
              const isActive = activeTab === tab.name
              return (
                <button
                  key={tab.name}
                  onClick={() => scrollToSection(tab.id)}
                  className={`pb-1 border-b-2 transition cursor-pointer shrink-0 outline-none ${
                    isActive ? 'text-[#1565D8] border-[#1565D8]' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 5. BODY TWO COLUMN LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (65% width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION: OVERVIEW */}
          <section id="overview" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1565D8]">Overview</h3>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
              <div className="pb-3 border-b-2 border-slate-100">
                <span className="text-xl font-black text-slate-800">{center.foundedYear || 2018}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">Founded</span>
              </div>
              <div className="pb-3 border-b-2 border-slate-100">
                <span className="text-xl font-black text-slate-800">{center.enrolledStudents}+</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">Students</span>
              </div>
              <div className="pb-3 border-b-2 border-slate-100">
                <span className="text-xl font-black text-slate-800">{center.batchesCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">Batches Offered</span>
              </div>
              <div className="pb-3 border-b-2 border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="text-xl font-black text-slate-800">{center.rating}</span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">Rating</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">About Academy</h4>
              <p className="text-xs font-semibold leading-relaxed text-slate-500">
                {center.description || 'Welcome to this learning center. Our experienced tutors aim to guide children through personalized batch coaching, building core talent and confidence.'}
              </p>
            </div>

            {/* Enrollment status banner */}
            {center.enrollingStatus === 'Enrolling Now' ? (
              <div className="bg-emerald-50 border border-emerald-200/60 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">Enrolling for July 2026 Batch</h4>
                    <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Limited slots available per batch</p>
                  </div>
                </div>
                <Button 
                  onClick={() => scrollToSection('schedule')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl h-auto"
                >
                  Book Slot
                </Button>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-150 p-4 rounded-xl flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider">Batches Currently Full</h4>
                  <p className="text-[11px] text-rose-600 font-bold mt-0.5">Enquire to join the waitlist</p>
                </div>
              </div>
            )}
          </section>

          {/* SECTION: BATCHES & SCHEDULE */}
          <GatedWrapper
            isGated={isGated}
            onRegister={() => setRegisterModalOpen(true)}
            subtext="Create a free parent account to see batches, instructors, fees, and book a trial class with this centre."
          >
          <section id="schedule" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <div className="border-l-[3px] border-[#1565D8] pl-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Batches & Schedule</h3>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-250">
                  <tr>
                    <th className="px-4 py-3.5">Batch Name</th>
                    <th className="px-4 py-3.5">Days</th>
                    <th className="px-4 py-3.5">Timing</th>
                    <th className="px-4 py-3.5">Age Group</th>
                    <th className="px-4 py-3.5">Available Seats</th>
                    <th className="px-4 py-3.5">Fee / Month</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-655 font-semibold">
                  {(!center.batchSchedules || center.batchSchedules.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-bold">
                        No batch schedules listed yet. Enquire below for slot details.
                      </td>
                    </tr>
                  ) : (
                    center.batchSchedules.map((batch: any) => {
                      const seatsLeft = Math.max(0, batch.capacity - batch.enrolledCount)
                      return (
                        <tr key={batch.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-800">{batch.name}</td>
                          <td className="px-4 py-3">{batch.daysOfWeek?.join(', ') || 'N/A'}</td>
                          <td className="px-4 py-3">{batch.startTime} - {batch.endTime}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {batch.ageGroupMin && batch.ageGroupMax ? `${batch.ageGroupMin}-${batch.ageGroupMax} yrs` : center.ageGroup}
                          </td>
                          <td className="px-4 py-3">
                            {seatsLeft > 0 ? (
                              <span className="text-emerald-600 font-bold">{seatsLeft} seats left</span>
                            ) : (
                              <span className="text-red-500 font-bold">Full</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-805">₹{batch.monthlyFee?.toLocaleString() || center.monthlyFee.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              disabled={seatsLeft === 0}
                              onClick={() => {
                                setEnquiryForm(prev => ({
                                  ...prev,
                                  batchScheduleId: batch.id
                                }))
                                setEnquiryOpen(true)
                              }}
                              className="bg-[#1565D8] text-white text-[10px] font-bold px-3 py-1.5 h-auto rounded-lg disabled:opacity-50"
                            >
                              Book
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
          </GatedWrapper>

          {/* SECTION: INSTRUCTORS */}
          <GatedWrapper isGated={isGated} onRegister={() => setRegisterModalOpen(true)} showOverlay={false}>
          <section id="instructors" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1565D8]">Instructors</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(!center.instructors || center.instructors.length === 0) ? (
                <div className="col-span-2 text-center py-6 text-slate-400 text-xs font-semibold">
                  No instructors listed yet.
                </div>
              ) : (
                center.instructors.map((inst: any) => {
                  const initials = inst.name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
                  return (
                    <Card key={inst.id} className="p-4 bg-white border-slate-200 rounded-xl flex gap-4 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-150 flex items-center justify-center font-bold text-slate-655 shrink-0 text-sm">
                        {initials}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">{inst.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {inst.specialization || 'Mentor'} {inst.experienceYears ? `• ${inst.experienceYears} yrs Exp` : ''}
                        </p>
                        {inst.bio && (
                          <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed font-semibold">{inst.bio}</p>
                        )}
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </section>
          </GatedWrapper>

          {/* SECTION: GALLERY */}
          <GatedWrapper isGated={isGated} onRegister={() => setRegisterModalOpen(true)} showOverlay={false}>
          <section id="gallery" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1565D8]">Gallery</h3>
            {galleryMedia.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {galleryMedia.map((med, idx) => (
                  <div
                    key={med.id}
                    onClick={() => setLightboxIndex(idx)}
                    className={`bg-slate-100 rounded-xl overflow-hidden relative group cursor-pointer aspect-square ${
                      idx === 0 && galleryMedia.length > 1
                        ? 'col-span-2 row-span-2 aspect-auto md:h-full'
                        : 'col-span-1'
                    }`}
                  >
                    <img
                      src={med.url}
                      alt={med.caption || center.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition duration-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200/65 flex flex-col items-center justify-center">
                <Camera className="w-10 h-10 text-slate-300 mb-2" strokeWidth={1.5} />
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">No photos uploaded yet</p>
              </div>
            )}
          </section>
          </GatedWrapper>

          {/* SECTION: FEES */}
          <GatedWrapper isGated={isGated} onRegister={() => setRegisterModalOpen(true)} showOverlay={false}>
          <section id="fees" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1565D8]">Fees Breakdown</h3>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-250">
                  <tr>
                    <th className="px-4 py-3.5">Activity</th>
                    <th className="px-4 py-3.5">Duration</th>
                    <th className="px-4 py-3.5">Monthly Fee</th>
                    <th className="px-4 py-3.5">Yearly Package</th>
                    <th className="px-4 py-3.5 text-right">Reg. Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650 font-semibold">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800">{center.activityType} Standard</td>
                    <td className="px-4 py-3">3 months</td>
                    <td className="px-4 py-3">₹{center.monthlyFee.toLocaleString()}</td>
                    <td className="px-4 py-3">₹{center.yearlyFee.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">₹1,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          </GatedWrapper>

          {/* SECTION: REVIEWS */}
          <GatedWrapper isGated={isGated} onRegister={() => setRegisterModalOpen(true)} showOverlay={false}>
          <section id="reviews" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1565D8]">Parent Reviews</h3>
              <Button
                onClick={handleWriteReview}
                className="bg-[#1565D8]/10 hover:bg-[#1565D8] text-[#1565D8] hover:text-white font-bold text-xs px-4 py-2 h-auto rounded-xl border border-[#1565D8]/20 transition"
              >
                {reviewEligibility?.existingReviewId ? 'Edit Your Review' : 'Write a Review'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-150">
              <div className="text-center flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-250 pb-4 md:pb-0">
                <span className="text-4xl font-black text-slate-800">{center.rating}</span>
                <div className="flex items-center gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(center.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                  {center.reviewCount} Reviews
                </span>
              </div>

              <div className="md:col-span-2 space-y-2">
                {Object.entries((center.stats?.ratingsBreakdown as Record<string, number>) || {}).map(([slug, score]) => (
                  <div key={slug} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 w-32 truncate">
                      {center.stats?.ratingsBreakdownLabels?.[slug] ?? slug}
                    </span>
                    <Progress
                      value={score * 20}
                      indicatorClassName="bg-amber-400"
                      className="h-2 flex-1 mx-3 bg-slate-200"
                    />
                    <span className="font-bold text-slate-700 w-6 text-right">{score}</span>
                  </div>
                ))}
              </div>
            </div>

            {(center.stats?.totalReviews ?? 0) > 3 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sort by</span>
                {([['recent', 'Most Recent'], ['highest', 'Highest Rated'], ['lowest', 'Lowest Rated']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setReviewSort(key); fetchReviewPage(key, 1, false) }}
                    className={`text-[11px] font-bold px-3 py-1 rounded-full border transition cursor-pointer ${
                      reviewSort === key
                        ? 'bg-[#1565D8] text-white border-[#1565D8]'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {(!center.reviews || center.reviews.length === 0) ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  No reviews yet. Be the first to share your experience!
                </div>
              ) : (
                (reviewItems ?? center.reviews).map((rev: any) => (
                  <Card key={rev.id} className="p-5 bg-white border-slate-200 shadow-sm space-y-3 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        {rev.title && <h5 className="text-xs font-bold text-slate-800">{rev.title}</h5>}
                        <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <span>{rev.parent?.name || 'Parent'}</span>
                          {rev.isVerifiedAdmission && (
                            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-black text-[9px] uppercase tracking-wider px-1.5 py-0">
                              Verified Parent
                            </Badge>
                          )}
                          {rev.classOrCourse && (
                            <Badge className="bg-blue-50 text-[#1565D8] border border-blue-100 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0">
                              {rev.classOrCourse}
                            </Badge>
                          )}
                          <span>•</span>
                          <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {reviewEligibility?.existingReviewId === rev.id && (
                          <button
                            onClick={() => handleDeleteOwnReview(rev.id)}
                            className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                        <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded text-amber-600 text-xs font-black">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{rev.rating}</span>
                        </div>
                      </div>
                    </div>
                    {rev.subRatings && Object.keys(rev.subRatings).length > 0 && (
                      <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-500">
                        {Object.entries(rev.subRatings as Record<string, number>).map(([slug, value]) => (
                          <span key={slug} className="bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-full">
                            {center.stats?.ratingsBreakdownLabels?.[slug] ?? slug}: ⭐{value}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs leading-relaxed text-slate-500 font-medium">
                      {rev.body ?? rev.content}
                    </p>
                    {((rev.pros?.length ?? 0) > 0 || (rev.cons?.length ?? 0) > 0) && (
                      <div className="flex flex-wrap gap-1.5">
                        {rev.pros?.map((p: string) => (
                          <span key={`p-${p}`} className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                            + {p}
                          </span>
                        ))}
                        {rev.cons?.map((c: string) => (
                          <span key={`c-${c}`} className="text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                            − {c}
                          </span>
                        ))}
                      </div>
                    )}
                    {(rev.responses?.length ?? 0) > 0 && (
                      <div className="space-y-2 border-l-2 border-slate-100 pl-4">
                        {rev.responses.map((resp: any) => (
                          <div key={resp.id}>
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                              {resp.authorType === 'SCHOOL' ? `Response from ${center.name}` : resp.authorType === 'PARENT' ? (rev.parent?.name || 'Parent') : 'Vidhyaan'}
                              <span className="font-medium normal-case tracking-normal"> · {new Date(resp.createdAt).toLocaleDateString()}</span>
                            </p>
                            <p className="text-xs leading-relaxed text-slate-600 font-medium">{resp.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>

            {(reviewItems ?? center.reviews ?? []).length < (center.stats?.totalReviews ?? 0) && (
              <div className="text-center">
                <Button
                  variant="outline"
                  disabled={reviewsLoadingMore}
                  onClick={() => fetchReviewPage(reviewSort, reviewItems ? reviewPage + 1 : 2, true)}
                  className="border-slate-200 text-slate-600 hover:border-slate-300 text-xs font-bold px-6 py-2.5 h-auto rounded-xl"
                >
                  {reviewsLoadingMore
                    ? 'Loading…'
                    : `Show More Reviews (${(center.stats?.totalReviews ?? 0) - (reviewItems ?? center.reviews ?? []).length} more)`}
                </Button>
              </div>
            )}
          </section>
          </GatedWrapper>

          {/* SECTION: LOCATION */}
          <GatedWrapper isGated={isGated} onRegister={() => setRegisterModalOpen(true)} showOverlay={false}>
          <section id="location" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1565D8]">Location & Timings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 text-xs font-semibold">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Address</span>
                    <span className="text-slate-600 leading-relaxed font-semibold">
                      {center.locations && center.locations.length > 0
                        ? `${center.locations[0].addressLine || ''}, ${center.locations[0].city || ''}, ${center.locations[0].state || ''} - ${center.locations[0].pincode || ''}`
                        : `No. 24, Gandhi Nagar Road, Adyar, ${center.city}`
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Phone Call</span>
                    <span className="text-slate-655 font-bold select-all">
                      {center.contacts && center.contacts.length > 0
                        ? center.contacts.find((c: any) => c.isPrimary)?.value || center.contacts[0].value
                        : '+91 98450 12345'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-[#EFF6FF] border border-blue-150 rounded-xl p-5 flex flex-col justify-between items-center text-center space-y-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.name + ' ' + center.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full bg-[#1565D8] text-white hover:bg-blue-700 font-bold text-xs py-2 rounded-lg h-auto shadow-sm">
                    View on Google Maps
                  </Button>
                </a>
              </div>
            </div>
          </section>
          </GatedWrapper>

        </div>

        {/* Right Column Sticky Sidebar (35% width) */}
        <div className="space-y-6">
          <aside className="space-y-6 lg:sticky lg:top-28">

            {/* CARD 1 — QUICK ENROLLMENT */}
            <GatedWrapper
              isGated={isGated}
              onRegister={() => setRegisterModalOpen(true)}
              title="Unlock Trial Booking"
              subtext="Create a free parent account to book trial classes and send enquiries to this centre."
            >
            <Card className="bg-white rounded-2xl border-t-[3px] border-t-[#1565D8] border-x-slate-200 border-b-slate-200 p-6 shadow-md space-y-5">
              <div>
                <h4 className="text-sm font-black text-slate-800">Book a Trial Class</h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Free. Get a slot callback today.</p>
              </div>

              {enquirySubmitted ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-200 mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-800">Booking Requested!</h5>
                  <p className="text-[10px] text-slate-405 font-medium leading-relaxed max-w-xs">
                    Timings has been locked. The {center.name} coordinator will call you to confirm.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-3.5">
                  {enquiryError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-655 rounded-xl text-xs font-semibold">
                      {enquiryError}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Parent Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Saran Kumar"
                      value={enquiryForm.parentName}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, parentName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Parent Phone *</label>
                    <input
                      type="tel"
                      required
                      pattern="[6-9]\d{9}"
                      placeholder="e.g. 9845000001"
                      value={enquiryForm.parentPhone}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, parentPhone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Student Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Kumar"
                      value={enquiryForm.studentName}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, studentName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Student Age *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 8"
                      value={enquiryForm.age}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, age: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Preferred Batch</label>
                    <select
                      value={enquiryForm.batchScheduleId}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, batchScheduleId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none cursor-pointer focus:border-blue-500"
                    >
                      <option value="">Select a batch (Optional)</option>
                      {(center.batchSchedules || []).map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.daysOfWeek?.join(', ') || ''} {b.startTime}-{b.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={enquiryLoading}
                    className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md border border-blue-500 h-auto disabled:opacity-50"
                  >
                    {enquiryLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Booking...
                      </>
                    ) : (
                      <>
                        Book Free Trial
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </Card>
            </GatedWrapper>

            {/* CARD 2 — QUICK INFO */}
            <Card className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2.5">Quick Info</h4>
              
              <div className="space-y-3.5 text-xs font-semibold">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Activity Type</span>
                  <span className="text-[#1565D8] font-bold text-right">{center.activityType}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Age Groups served</span>
                  <span className="text-slate-700 font-bold text-right">{center.ageGroup}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Batch timins</span>
                  <span className="text-slate-700 font-bold text-right">{center.timing}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Trial Class</span>
                  <span className="text-slate-700 font-bold text-right">
                    {center.trialAvailable ? 'Free Trial Available' : 'No trial'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Timing frequency</span>
                  <span className="text-slate-700 font-bold text-right">2-3 sessions / week</span>
                </div>
              </div>
            </Card>

            {/* CARD 3 — SIMILAR CENTERS */}
            <Card className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2.5">Nearby Centers</h4>
              
              <div className="space-y-4">
                {similarLCs.map((s) => {
                  const initials = s.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                  const colors = getGradientAndEmoji(s.activityType)
                  
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 text-xs font-semibold">
                      <div className="flex items-center gap-3 truncate">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${colors.bg} text-white font-bold text-[10px]`}>
                          {initials}
                        </div>
                        <div className="truncate">
                          <span className="text-slate-850 font-bold block truncate hover:text-[#1565D8] transition">
                            <Link href={`/learning-centers/${s.slug}`}>{s.name}</Link>
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">
                            {s.activityType} • {s.city}
                          </span>
                        </div>
                      </div>

                      <Link href={`/learning-centers/${s.slug}`}>
                        <Button variant="ghost" className="text-[#1565D8] hover:bg-blue-50 font-bold text-xs p-2 h-auto shrink-0 cursor-pointer rounded-lg">
                          View
                        </Button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </Card>

          </aside>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-12 px-6 md:px-8">
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

      {/* Enquiry Dialog */}
      <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-slate-200 select-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800">
              {center.trialAvailable ? 'Book a Free Trial Class' : 'Submit Enrollment Enquiry'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium mt-1">
              Provide details below. The administrator at {center.name} will contact you to schedule a slot.
            </DialogDescription>
          </DialogHeader>

          {enquirySubmitted ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 border border-green-200">
                <Check className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Booking Submitted!</h4>
              <p className="text-xs text-slate-405 font-semibold max-w-xs leading-relaxed">
                Thank you! Your trial slot / enquiry has been logged. You will receive a call within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEnquirySubmit} className="space-y-4 mt-3">
              {enquiryError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-655 rounded-xl text-xs font-semibold">
                  {enquiryError}
                </div>
              )}
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
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Student Name *</label>
                  <input
                    type="text"
                    required
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. parent@gmail.com"
                    value={enquiryForm.parentEmail}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, parentEmail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Student Age *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={25}
                    placeholder="e.g. 8"
                    value={enquiryForm.age}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, age: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Select Batch (Optional)</label>
                <select
                  value={enquiryForm.batchScheduleId}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, batchScheduleId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none cursor-pointer focus:border-blue-500"
                >
                  <option value="">Select a batch</option>
                  {(center.batchSchedules || []).map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.daysOfWeek?.join(', ') || ''} {b.startTime}-{b.endTime})
                    </option>
                  ))}
                </select>
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
                  disabled={enquiryLoading}
                  className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs h-auto px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md border border-blue-500 disabled:opacity-50"
                >
                  {enquiryLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Request
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <LoginPromptModal
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        title="Save this Center"
        description="Please sign in with a parent account to bookmark learning centers and track your queries."
      />

      {center?.id && (
        <ReviewModal
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          schoolId={center.id}
          categories={getReviewCategories(center.institutionType as any)}
          existing={(center.reviews || []).find((r: any) => r.id === reviewEligibility?.existingReviewId) ?? null}
          kids={reviewEligibility?.kids ?? []}
          onSubmitted={() => {
            refreshReviews()
            fetchReviewEligibility(center.id)
          }}
        />
      )}

      <MarketplaceToast message={toastMsg} onClose={() => setToastMsg(null)} />

      <ParentRegisterModal
        open={registerModalOpen}
        onOpenChange={setRegisterModalOpen}
        onSuccess={() => {
          setRegisterModalOpen(false)
          update()
        }}
      />

      <SchoolGalleryLightbox
        media={galleryMedia}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />

      <CompareBar />
    </div>
  )
}
