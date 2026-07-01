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
  CheckCircle2,
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
  Info,
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
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import CompareBar from '@/components/CompareBar'
import ParentRegisterModal from '@/components/parent-auth/ParentRegisterModal'
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

// Type Definitions
interface SchoolLocation {
  id: string
  addressLine: string | null
  city: string | null
  state: string | null
  pincode: string | null
  latitude: number | null
  longitude: number | null
  isPrimary: boolean
}

interface SchoolContact {
  id: string
  type: string
  value: string
  isPrimary: boolean
}

interface SchoolMedia {
  id: string
  type: string
  url: string
  caption: string | null
  sortOrder: number
}

interface SchoolFacility {
  id: string
  name: string
  category: string | null
}

interface SchoolFeeRange {
  id: string
  gradeLabel: string
  minAmount: any
  maxAmount: any
  frequency: string | null
}

interface SchoolAffiliation {
  id: string
  board: string
  affiliationNo: string | null
}

interface SchoolHours {
  id: string
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
}

interface SchoolReview {
  id: string
  rating: number
  title: string | null
  content: string
  createdAt: string
  parent: {
    name: string
  }
  ratingAcademics?: number | null
  ratingFaculty?: number | null
  ratingInfrastructure?: number | null
  ratingSafety?: number | null
  ratingActivities?: number | null
  ratingValue?: number | null
}

interface SchoolProfile {
  id: string
  name: string
  slug: string
  institutionType: string
  description: string | null
  verificationStatus: string
  isVerified: boolean
  profileCompletion: number
  avgRating: number
  reviewCount: number
  admissionOpen: boolean
  locations: SchoolLocation[]
  contacts: SchoolContact[]
  media: SchoolMedia[]
  facilities: SchoolFacility[]
  feeRanges: SchoolFeeRange[]
  affiliations: SchoolAffiliation[]
  hours: SchoolHours[]
  reviews: SchoolReview[]
  stats: {
    totalReviews: number
    avgRating: number
    ratingsBreakdown: {
      academics: number
      faculty: number
      infrastructure: number
      safety: number
      activities: number
      value: number
    }
  }
}

interface GatedWrapperProps {
  children: React.ReactNode
  isGated: boolean
  onRegister: () => void
  showOverlay?: boolean
  title?: string
  subtext?: string
}

function GatedWrapper({
  children,
  isGated,
  onRegister,
  showOverlay = true,
  title = 'Register to view full details',
  subtext = 'Create a free parent account to see admissions, fees, facilities, and contact this school directly.'
}: GatedWrapperProps) {
  if (!isGated) return <>{children}</>

  return (
    <div className="relative overflow-hidden">
      <div className="filter blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>
      {showOverlay && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/10 p-6 text-center">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-slate-200/50 max-w-sm w-full space-y-4 animate-fade-in sticky top-[150px]">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#1565D8] mx-auto shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">{title}</h4>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">{subtext}</p>
            </div>
            <Button
              onClick={onRegister}
              className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl h-auto shadow-md"
            >
              Register Now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SchoolProfilePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const { data: session, update } = useSession()
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const isGated = !session?.user || session.user.role !== 'PARENT'

  // Main Page States
  const [school, setSchool] = useState<SchoolProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Navigation & Interactive States
  // Visit Scheduler Modal States
  const [visitModalOpen, setVisitModalOpen] = useState(false)
  const [visitSubmitted, setVisitSubmitted] = useState(false)
  const [visitLoading, setVisitLoading] = useState(false)
  const [visitError, setVisitError] = useState<string | null>(null)
  const [visitForm, setVisitForm] = useState({
    parentName: '',
    phone: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    numberOfVisitors: '1',
    notes: ''
  })

  // Prefill visit form with session data when loaded
  useEffect(() => {
    if (session?.user) {
      setVisitForm(prev => ({
        ...prev,
        parentName: session.user.name || '',
        phone: (session.user as any).phone || '',
        email: session.user.email || ''
      }))
    }
  }, [session])

  // Prefill enquiry form with session data when loaded
  useEffect(() => {
    if (session?.user) {
      setEnquiryForm(prev => ({
        ...prev,
        parentName: session.user.name || prev.parentName,
        parentPhone: (session.user as any).phone || prev.parentPhone,
        parentEmail: session.user.email || prev.parentEmail
      }))
    }
  }, [session])

  // Comparison State
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

  const toggleCompare = (sc: any) => {
    try {
      const stored = localStorage.getItem('compare_schools')
      let list = stored ? JSON.parse(stored) : []
      if (!Array.isArray(list)) list = []
      
      const isAlreadyAdded = list.some((s: any) => s.slug === sc.slug)
      if (isAlreadyAdded) {
        list = list.filter((s: any) => s.slug !== sc.slug)
        localStorage.setItem('compare_schools', JSON.stringify(list))
        window.dispatchEvent(new Event('compare-changed'))
        setToastMsg(`Removed ${sc.name} from comparison`)
      } else {
        if (list.length >= 3) {
          setToastMsg("You can compare up to 3 schools side-by-side.")
          return
        }
        list.push({ slug: sc.slug, name: sc.name })
        localStorage.setItem('compare_schools', JSON.stringify(list))
        window.dispatchEvent(new Event('compare-changed'))
        setToastMsg(`Added ${sc.name} to comparison`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!school) return
    setVisitLoading(true)
    setVisitError(null)
    try {
      const res = await fetch(`/api/public/schools/${school.slug}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName: visitForm.parentName,
          phone: visitForm.phone,
          email: visitForm.email || undefined,
          preferredDate: visitForm.preferredDate,
          preferredTime: visitForm.preferredTime || undefined,
          numberOfVisitors: visitForm.numberOfVisitors ? parseInt(visitForm.numberOfVisitors) : undefined,
          notes: visitForm.notes || undefined
        })
      })
      const json = await res.json()
      if (json.success) {
        setVisitSubmitted(true)
        setVisitForm(prev => ({
          ...prev,
          preferredDate: '',
          preferredTime: '',
          numberOfVisitors: '1',
          notes: ''
        }))
      } else {
        setVisitError(json.error || 'Failed to schedule visit')
      }
    } catch (err: any) {
      setVisitError(err.message || 'An error occurred')
    } finally {
      setVisitLoading(false)
    }
  }

  const [activeTab, setActiveTab] = useState('Overview')
  const [readMore, setReadMore] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [similarSchools, setSimilarSchools] = useState<any[]>([])

  // Modal States
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Form States
  const [enquiryForm, setEnquiryForm] = useState({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    childName: '',
    gradeSought: 'Grade 1',
    notes: ''
  })
  const [enquirySubmitted, setEnquirySubmitted] = useState(false)
  const [enquiryLoading, setEnquiryLoading] = useState(false)
  const [enquiryError, setEnquiryError] = useState<string | null>(null)

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: '',
    ratingAcademics: 5,
    ratingFaculty: 5,
    ratingInfrastructure: 5,
    ratingSafety: 5,
    ratingActivities: 5,
    ratingValue: 5
  })
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [localReviews, setLocalReviews] = useState<SchoolReview[]>([])

  // Tab List definition
  const tabItems = [
    { name: 'Overview', id: 'overview' },
    { name: 'Academics', id: 'academics' },
    { name: 'Facilities', id: 'facilities' },
    { name: 'Gallery', id: 'gallery' },
    { name: 'Fee Structure', id: 'fees' },
    { name: 'Admissions', id: 'admission' },
    { name: 'Reviews', id: 'reviews' },
    { name: 'Location', id: 'location' }
  ]

  // Facility definition mapping
  const facilityList = [
    { name: 'Library', icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
    { name: 'Sports Ground', icon: Trophy, color: 'text-amber-600 bg-amber-50' },
    { name: 'Science Lab', icon: FlaskConical, color: 'text-purple-600 bg-purple-50' },
    { name: 'Computer Lab', icon: Computer, color: 'text-indigo-600 bg-indigo-50' },
    { name: 'Transport', icon: Bus, color: 'text-emerald-600 bg-emerald-50' },
    { name: 'Cafeteria', icon: Utensils, color: 'text-rose-600 bg-rose-50' },
    { name: 'Medical Room', icon: HeartPulse, color: 'text-red-600 bg-red-50' },
    { name: 'Auditorium', icon: Tv, color: 'text-orange-600 bg-orange-50' },
    { name: 'Swimming Pool', icon: Waves, color: 'text-cyan-600 bg-cyan-50' },
    { name: 'Music Room', icon: Music, color: 'text-teal-600 bg-teal-50' },
    { name: 'Art Room', icon: Palette, color: 'text-pink-600 bg-pink-50' },
    { name: 'CCTV Security', icon: Video, color: 'text-slate-600 bg-slate-100' }
  ]

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // 1. Fetch main school profile details
  useEffect(() => {
    if (!slug) return

    const fetchSchoolDetails = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/schools/${slug}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error('School profile not found')
          throw new Error('Failed to retrieve school details')
        }
        const json = await res.json()
        setSchool(json.data)

        // Check bookmark status
        if (json.data) {
          if (session?.user && session.user.role === 'PARENT') {
            try {
              const bRes = await fetch(`/api/v1/parent/bookmarks?schoolId=${json.data.id}`)
              const bJson = await bRes.json()
              if (bJson.success) {
                setBookmarked(bJson.bookmarked)
              } else {
                const bookmarks = JSON.parse(localStorage.getItem('bookmarked_schools') ?? '[]')
                setBookmarked(bookmarks.includes(json.data.id))
              }
            } catch (e) {
              const bookmarks = JSON.parse(localStorage.getItem('bookmarked_schools') ?? '[]')
              setBookmarked(bookmarks.includes(json.data.id))
            }
          } else {
            const bookmarks = JSON.parse(localStorage.getItem('bookmarked_schools') ?? '[]')
            setBookmarked(bookmarks.includes(json.data.id))
          }
        }
      } catch (err: any) {
        setError(err.message || 'Error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSchoolDetails()
  }, [slug])

  // 2. Fetch similar schools matching city & board once school data is loaded
  useEffect(() => {
    if (!school) return

    const fetchSimilarSchools = async () => {
      try {
        const city = school.locations[0]?.city ?? ''
        const board = school.affiliations[0]?.board ?? ''
        
        const params = new URLSearchParams()
        if (city) params.append('city', city)
        if (board) params.append('board', board)

        const res = await fetch(`/api/public/schools?${params.toString()}`)
        if (res.ok) {
          const json = await res.json()
          // Filter out current school and limit to 3 items
          const filtered = (json.data ?? [])
            .filter((s: any) => s.id !== school.id)
            .slice(0, 3)
          setSimilarSchools(filtered)
        }
      } catch (err) {
        console.error('Error loading similar schools:', err)
      }
    }

    fetchSimilarSchools()
  }, [school])

  // 3. Dynamic client-side SEO Tag Injections
  useEffect(() => {
    if (!school) return

    // Document Title
    document.title = `${school.name} - Admissions, Fees, Reviews | Vidhyaan`

    // Meta Description
    const city = school.locations[0]?.city || 'India'
    const descText = `Get complete information about ${school.name} in ${city}. Check admission process, fee structure, facilities and parent reviews. Apply directly on Vidhyaan.`
    
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', descText)

    // Open Graph Title
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (!ogTitle) {
      ogTitle = document.createElement('meta')
      ogTitle.setAttribute('property', 'og:title')
      document.head.appendChild(ogTitle)
    }
    ogTitle.setAttribute('content', `${school.name} - Admissions, Fees | Vidhyaan`)

    // Open Graph Description
    let ogDesc = document.querySelector('meta[property="og:description"]')
    if (!ogDesc) {
      ogDesc = document.createElement('meta')
      ogDesc.setAttribute('property', 'og:description')
      document.head.appendChild(ogDesc)
    }
    ogDesc.setAttribute('content', descText)

    // Open Graph Image
    let ogImg = document.querySelector('meta[property="og:image"]')
    if (!ogImg) {
      ogImg = document.createElement('meta')
      ogImg.setAttribute('property', 'og:image')
      document.head.appendChild(ogImg)
    }
    const imgUrl = school.media?.[0]?.url || ''
    ogImg.setAttribute('content', imgUrl)
  }, [school])

  // 4. Scroll Tracking for Sticky Tab Underline Highlight
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 130 // height of header + sticky tabs offset
      
      const sections = ['overview', 'academics', 'facilities', 'gallery', 'fees', 'admission', 'reviews', 'location']
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            let activeName = 'Overview'
            if (sectionId === 'academics') activeName = 'Academics'
            else if (sectionId === 'facilities') activeName = 'Facilities'
            else if (sectionId === 'gallery') activeName = 'Gallery'
            else if (sectionId === 'fees') activeName = 'Fee Structure'
            else if (sectionId === 'admission') activeName = 'Admissions'
            else if (sectionId === 'reviews') activeName = 'Reviews'
            else if (sectionId === 'location') activeName = 'Location'
            
            setActiveTab(activeName)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -120
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveTab(tabItems.find((t) => t.id === id)?.name || 'Overview')
    }
  }

  // Sync Bookmark status when session changes
  useEffect(() => {
    const checkStatus = async () => {
      if (!school) return
      if (session?.user && session.user.role === 'PARENT') {
        try {
          const res = await fetch(`/api/v1/parent/bookmarks?schoolId=${school.id}`)
          const json = await res.json()
          if (json.success) {
            setBookmarked(json.bookmarked)
            return
          }
        } catch (e) {}
      }
      const bookmarks = JSON.parse(localStorage.getItem('bookmarked_schools') ?? '[]')
      setBookmarked(bookmarks.includes(school.id))
    }
    checkStatus()
  }, [session, school])

  const toggleBookmark = async () => {
    if (!school) return
    if (!session?.user || session.user.role !== 'PARENT') {
      setLoginPromptOpen(true)
      return
    }

    try {
      const res = await fetch(`/api/public/schools/${school.slug}/bookmark`, {
        method: 'POST'
      })
      const json = await res.json()
      if (json.success) {
        setBookmarked(json.bookmarked)
        setToastMsg(json.bookmarked ? 'School saved to bookmarks' : 'Removed from bookmarks')
        setTimeout(() => setToastMsg(null), 3000)
      }
    } catch (e) {
      console.error('Error toggling bookmark:', e)
    }
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      alert('Profile link copied to clipboard!')
    }
  }

  const handleCompare = () => {
    if (!school) return
    alert(`${school.name} added to compare list!`)
  }

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnquiryLoading(true)
    setEnquiryError(null)
    try {
      const res = await fetch(`/api/public/schools/${slug}/enquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parentName: enquiryForm.parentName,
          phone: enquiryForm.parentPhone,
          email: enquiryForm.parentEmail || undefined,
          childName: enquiryForm.childName || undefined,
          gradeSought: enquiryForm.gradeSought || undefined,
          message: enquiryForm.notes || undefined,
          source: 'VIDHYAAN'
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to submit enquiry')
      }
      setEnquirySubmitted(true)
      setTimeout(() => {
        setEnquiryOpen(false)
        setEnquirySubmitted(false)
        setEnquiryForm({
          parentName: '',
          parentEmail: '',
          parentPhone: '',
          childName: '',
          gradeSought: 'Grade 1',
          notes: ''
        })
      }, 3000)
    } catch (err: any) {
      setEnquiryError(err.message || 'Something went wrong')
    } finally {
      setEnquiryLoading(false)
    }
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newReview: SchoolReview = {
      id: Math.random().toString(),
      rating: reviewForm.rating,
      title: reviewForm.title || 'Parent Review',
      content: reviewForm.content,
      createdAt: new Date().toISOString(),
      parent: {
        name: enquiryForm.parentName || 'Verified Parent'
      },
      ratingAcademics: reviewForm.ratingAcademics,
      ratingFaculty: reviewForm.ratingFaculty,
      ratingInfrastructure: reviewForm.ratingInfrastructure,
      ratingSafety: reviewForm.ratingSafety,
      ratingActivities: reviewForm.ratingActivities,
      ratingValue: reviewForm.ratingValue
    }
    setLocalReviews((prev) => [newReview, ...prev])
    setReviewSubmitted(true)
    setTimeout(() => {
      setReviewOpen(false)
      setReviewSubmitted(false)
      setReviewForm({
        rating: 5,
        title: '',
        content: '',
        ratingAcademics: 5,
        ratingFaculty: 5,
        ratingInfrastructure: 5,
        ratingSafety: 5,
        ratingActivities: 5,
        ratingValue: 5
      })
    }, 2000)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading School Profile...</p>
        </div>
      </div>
    )
  }

  if (error || !school) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md">
          <Building className="w-12 h-12 text-red-500 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-slate-800">School Profile Error</h2>
          <p className="text-sm text-slate-500 mt-2">{error || 'Could not load profile'}</p>
          <Link href="/schools" className="mt-6 inline-block">
            <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl h-auto">
              Back to Directory
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const primaryAddress = school.locations[0]
  const addressString = primaryAddress
    ? `${primaryAddress.addressLine ?? ''}, ${primaryAddress.city ?? ''}, ${primaryAddress.state ?? ''} - ${primaryAddress.pincode ?? ''}`
    : 'City Not Specified'

  const boardBadge = school.affiliations[0]?.board ?? 'CBSE'
  const coverPhoto = school.media?.[0]?.url
  const initialLetters = school.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      {/* 1. STICKY BRAND HEADER */}
      <MarketplaceHeader />

      {/* 2. SCHOOL COVER SECTION */}
      <section className="relative h-[200px] md:h-[280px] w-full bg-slate-200 overflow-hidden">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={`${school.name} Cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getGradientByInitial(school.name)}`} />
        )}
        
        {/* Transparent to black/dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

        {/* Cover Info Overlay */}
        <div className="absolute bottom-4 md:bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 md:px-8 z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 text-white">
          <div className="flex items-center gap-4">
            {/* White bordered logo/avatar circle */}
            <div className="relative w-[60px] h-[60px] rounded-full border-2 border-white bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 flex items-center justify-center font-black text-lg shadow shrink-0">
              <span className={`w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br ${getGradientByInitial(school.name)} text-white`}>
                {initialLetters}
              </span>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-xl md:text-3xl font-black leading-tight drop-shadow">
                {school.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 font-semibold mt-0.5">
                {school.isVerified && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
                <Badge className="bg-white/10 text-white border border-white/20 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                  {boardBadge} Board
                </Badge>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                  <span>{school.locations[0]?.city || 'Chennai'}, {school.locations[0]?.state || 'Tamil Nadu'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
            <Button
              onClick={() => setEnquiryOpen(true)}
              className="flex-1 md:flex-none bg-white hover:bg-slate-50 text-[#1565D8] font-bold text-xs px-5 py-2.5 rounded-xl h-auto shadow"
            >
              Send Enquiry
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
            <Button
              onClick={() => toggleCompare(school)}
              className={`flex-1 md:flex-none border font-bold text-xs px-4 py-2.5 rounded-xl h-auto flex items-center justify-center gap-1.5 transition ${
                comparedSlugs.includes(school.slug)
                  ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            >
              {comparedSlugs.includes(school.slug) ? '✓ Compared' : '+ Compare'}
            </Button>
          </div>
        </div>
      </section>

      {/* 3. BREADCRUMB + ACTION BAR */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 truncate">
            <Link href="/" className="hover:text-slate-600">Home</Link>
            <span>&gt;</span>
            <Link href="/schools" className="hover:text-slate-600">Schools</Link>
            <span>&gt;</span>
            <span className="text-slate-600 font-bold truncate max-w-[200px] md:max-w-xs">{school.name}</span>
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
            <Button
              onClick={handleCompare}
              variant="outline"
              className="border-slate-200 text-slate-500 hover:text-[#1565D8] font-bold text-xs px-3 py-2 rounded-xl h-auto flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compare</span>
            </Button>
          </div>
        </div>
      </section>

      {/* 4. STICKY TAB NAVIGATION */}
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

      {/* 5. TWO COLUMN BODY LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (65% width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION: OVERVIEW */}
          <section id="overview" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1565D8]">Overview</h3>
            
            {/* Quick stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
              <div className="pb-3 border-b-2 border-slate-100">
                <span className="text-xl font-black text-slate-800">2012</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">Established</span>
              </div>
              <div className="pb-3 border-b-2 border-slate-100">
                <span className="text-xl font-black text-slate-800">550+</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">Students</span>
              </div>
              <div className="pb-3 border-b-2 border-slate-100">
                <span className="text-xl font-black text-slate-800">38</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">Teachers</span>
              </div>
              <div className="pb-3 border-b-2 border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="text-xl font-black text-slate-800">
                    {school.stats.avgRating > 0 ? school.stats.avgRating : 'New'}
                  </span>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">Rating</span>
              </div>
            </div>

            {/* About text description */}
            <div className="space-y-3">
              <h4 className="text-sm font-black text-slate-800">About School</h4>
              <p className="text-xs font-semibold leading-relaxed text-slate-500 whitespace-pre-line">
                {readMore || !school.description || school.description.length <= 300
                  ? school.description || 'Welcome to this institution. We strive to provide excellent academic support, extracurricular activities, and state-of-the-art facilities to shape future global leaders.'
                  : `${school.description.substring(0, 300)}...`
                }
              </p>
              {school.description && school.description.length > 300 && (
                <button
                  onClick={() => setReadMore(!readMore)}
                  className="text-xs font-black text-[#1565D8] hover:underline outline-none cursor-pointer"
                >
                  {readMore ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>

            {/* Admission status banner */}
            {school.admissionOpen ? (
              <div className="bg-emerald-50 border border-emerald-200/60 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">Admissions Open for AY 2026-27</h4>
                    <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Apply before seats fill up</p>
                  </div>
                </div>
                <Button
                  onClick={() => scrollToSection('admission')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl h-auto shrink-0 shadow-sm"
                >
                  Apply Now
                </Button>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-150 p-4 rounded-xl flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-rose-800 uppercase tracking-wider">Admissions Closed for AY 2026-27</h4>
                  <p className="text-[11px] text-rose-600 font-bold mt-0.5">Contact the school board for vacancies</p>
                </div>
              </div>
            )}
          </section>

          {/* SECTION: ACADEMICS */}
          <GatedWrapper isGated={isGated} onRegister={() => setRegisterModalOpen(true)}>
            <section id="academics" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <div className="border-l-[3px] border-[#1565D8] pl-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Academics</h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs font-semibold">
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Board / Curriculum</span>
                <span className="text-slate-800 font-bold">{boardBadge}</span>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Affiliation Number</span>
                <span className="text-slate-800 font-bold">{school.affiliations?.[0]?.affiliationNo || 'N/A'}</span>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Medium of Instruction</span>
                <span className="text-slate-800 font-bold">English</span>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <span className="text-slate-400">Classes Offered</span>
                <span className="text-slate-800 font-bold">Kindergarten to 12th Grade</span>
              </div>
            </div>
          </section>
          </GatedWrapper>

          {/* SECTION: FACILITIES */}
          <GatedWrapper isGated={isGated} onRegister={() => setRegisterModalOpen(true)} showOverlay={false}>
            <section id="facilities" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1565D8]">Facilities</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {facilityList.map((fac) => {
                const isAvail = school.facilities.some(
                  (f) => f.name.toLowerCase().includes(fac.name.toLowerCase())
                )
                const IconComponent = fac.icon
                return (
                  <div
                    key={fac.name}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isAvail ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isAvail ? fac.color : 'bg-slate-100 text-slate-400'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className={`text-[11px] font-bold truncate ${isAvail ? 'text-slate-700' : 'text-slate-450'}`}>
                        {fac.name}
                      </span>
                    </div>
                    {isAvail && (
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3.5px] shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </section>
          </GatedWrapper>

          {/* SECTION: GALLERY */}
          <GatedWrapper isGated={isGated} onRegister={() => setRegisterModalOpen(true)} showOverlay={false}>
            <section id="gallery" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1565D8]">Gallery</h3>
            
            {school.media && school.media.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {school.media.map((med, idx) => (
                  <div
                    key={med.id}
                    onClick={() => setLightboxIndex(idx)}
                    className={`bg-slate-100 rounded-xl overflow-hidden relative group cursor-pointer aspect-square ${
                      idx === 0 && school.media.length > 1
                        ? 'col-span-2 row-span-2 aspect-auto md:h-full'
                        : 'col-span-1'
                    }`}
                  >
                    <img
                      src={med.url}
                      alt={med.caption || school.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition duration-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col items-center justify-center">
                <Camera className="w-10 h-10 text-slate-300 mb-2" strokeWidth={1.5} />
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">No photos available yet</p>
              </div>
            )}
          </section>
          </GatedWrapper>

          {/* SECTION: FEE STRUCTURE */}
          <GatedWrapper isGated={isGated} onRegister={() => setRegisterModalOpen(true)} showOverlay={false}>
            <section id="fees" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1565D8]">Fee Structure</h3>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-250">
                  <tr>
                    <th className="px-4 py-3.5">Grade level</th>
                    <th className="px-4 py-3.5">Annual Fee</th>
                    <th className="px-4 py-3.5">One-time Admission Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {school.feeRanges && school.feeRanges.length > 0 ? (
                    school.feeRanges.map((fee, idx) => (
                      <tr key={fee.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-4 py-3 font-bold text-slate-700">{fee.gradeLabel}</td>
                        <td className="px-4 py-3 font-medium">₹{Number(fee.minAmount).toLocaleString()} - ₹{Number(fee.maxAmount).toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium text-slate-400">₹5,000</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-white">
                      <td colSpan={3} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Phone className="w-6 h-6 text-slate-350" />
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Contact school for fee details</p>
                          <p className="text-sm font-black text-slate-700">{school.contacts?.[0]?.value || '+91 98841 85361'}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          </GatedWrapper>

          {/* SECTION: ADMISSIONS */}
          <GatedWrapper isGated={isGated} onRegister={() => setRegisterModalOpen(true)} showOverlay={false}>
            <section id="admission" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1565D8]">Admissions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Admission Info */}
              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Academic Year</span>
                  <span className="text-slate-800 font-bold text-sm block mt-0.5">AY 2026 - 2027</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Open Grades</span>
                  <span className="text-slate-800 font-bold text-sm block mt-0.5">Nursery to 12th Grade</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Admissions Process</span>
                  <ol className="list-decimal pl-4 text-slate-500 space-y-1.5">
                    <li>Submit online enquiry form with parent phone number.</li>
                    <li>Receive admissions guidelines details via email & SMS.</li>
                    <li>Attend the interaction round & verification session.</li>
                  </ol>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">Documents Checklist</span>
                  <div className="space-y-2">
                    {[
                      'Child birth certificate photocopy',
                      'Transfer Certificate (TC) & last report card',
                      'Residence Address Proof (Voter ID/Passport)',
                      'Passport photos of child & parents'
                    ].map((doc) => (
                      <div key={doc} className="flex items-center gap-2 text-slate-500">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Apply now card */}
              <div className="border-2 border-[#1565D8] p-5 rounded-xl bg-white shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-sm font-black text-slate-800">Start Your Application</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Free. No spam ever.</p>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Child's Full Name"
                    value={enquiryForm.childName}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, childName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                  />
                  <select
                    value={enquiryForm.gradeSought}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, gradeSought: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none cursor-pointer focus:border-blue-500"
                  >
                    {['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="Parent Phone Number"
                    required
                    pattern="[6-9]\d{9}"
                    value={enquiryForm.parentPhone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, parentPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                  />
                </div>

                <Button
                  onClick={(e) => {
                    if (!enquiryForm.parentPhone) {
                      alert('Please specify a parent mobile phone number.')
                      return
                    }
                    handleEnquirySubmit(e)
                  }}
                  className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md border border-blue-500 h-auto"
                >
                  Send Enquiry
                </Button>
              </div>
            </div>
          </section>
          </GatedWrapper>

          {/* SECTION: REVIEWS */}
          <GatedWrapper isGated={isGated} onRegister={() => setRegisterModalOpen(true)} showOverlay={false}>
            <section id="reviews" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Parent Reviews</h3>
              <Button
                onClick={() => setReviewOpen(true)}
                className="bg-[#1565D8]/10 hover:bg-[#1565D8] text-[#1565D8] hover:text-white font-bold text-xs px-4 py-2 h-auto rounded-xl border border-[#1565D8]/20 transition"
              >
                Write a Review
              </Button>
            </div>

            {/* Aggregate breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-150">
              <div className="text-center flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-250 pb-4 md:pb-0">
                <span className="text-4xl font-black text-slate-800">
                  {school.stats.avgRating > 0 ? school.stats.avgRating : 'N/A'}
                </span>
                <div className="flex items-center gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(school.stats.avgRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                  {school.stats.totalReviews} Parent Reviews
                </span>
              </div>

              <div className="md:col-span-2 space-y-2">
                {Object.entries(school.stats.ratingsBreakdown).map(([category, value]) => (
                  <div key={category} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 capitalize w-20 truncate">{category}</span>
                    <Progress
                      value={value * 20}
                      indicatorClassName="bg-amber-400"
                      className="h-2 flex-1 mx-3 bg-slate-200"
                    />
                    <span className="font-bold text-slate-700 w-6 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Review Cards */}
            <div className="space-y-4">
              {[...localReviews, ...school.reviews].length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
                  <MessageSquare className="w-10 h-10 text-slate-300 mb-2" strokeWidth={1.5} />
                  <p className="text-xs text-slate-405 font-bold uppercase tracking-wider">No reviews yet. Be the first!</p>
                  <Button onClick={() => setReviewOpen(true)} className="mt-4 bg-[#1565D8] text-white font-bold text-xs py-2 px-4 rounded-xl h-auto">
                    Write a Review
                  </Button>
                </div>
              ) : (
                [...localReviews, ...school.reviews].map((rev) => (
                  <Card key={rev.id} className="p-5 bg-white border-slate-200 shadow-sm space-y-3.5 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        {/* avatar initials circle */}
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
                          {rev.parent.name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{rev.parent.name}</span>
                            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-black text-[9px] uppercase tracking-wider px-1.5 py-0">
                              Verified Parent
                            </Badge>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded text-amber-600 text-xs font-black">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>

                    {/* rating breakdown pills */}
                    <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-500">
                      {rev.ratingAcademics && (
                        <span className="bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-full">
                          Academics: ⭐{rev.ratingAcademics}
                        </span>
                      )}
                      {rev.ratingInfrastructure && (
                        <span className="bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-full">
                          Infrastructure: ⭐{rev.ratingInfrastructure}
                        </span>
                      )}
                      {rev.ratingFaculty && (
                        <span className="bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-full">
                          Teachers: ⭐{rev.ratingFaculty}
                        </span>
                      )}
                    </div>

                    <h5 className="text-xs font-bold text-slate-800">{rev.title}</h5>
                    <p className="text-xs leading-relaxed text-slate-500 font-medium">{rev.content}</p>
                    <Button variant="outline" className="border-slate-200 hover:border-slate-350 text-slate-400 hover:text-slate-600 text-[10px] font-bold px-3 py-1 h-auto rounded-lg">
                      Helpful (3)
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </section>
          </GatedWrapper>

          {/* SECTION: LOCATION */}
          <GatedWrapper isGated={isGated} onRegister={() => setRegisterModalOpen(true)} showOverlay={false}>
            <section id="location" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm scroll-mt-28 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1565D8]">Location & Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 text-xs font-semibold">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Address</span>
                    <span className="text-slate-600 leading-relaxed">{addressString}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Admissions Helpline</span>
                    <span className="text-slate-600 font-bold select-all">
                      {school.contacts?.find((c) => c.type.toLowerCase().includes('phone'))?.value || '+91 98841 85361'}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">Email</span>
                    <span className="text-slate-600 font-bold select-all">
                      {school.contacts?.find((c) => c.type.toLowerCase().includes('email'))?.value || 'admissions@princematric.com'}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Opening Hours</span>
                    <div className="space-y-1 text-slate-500 font-semibold">
                      <div className="flex justify-between w-40 gap-4">
                        <span>Mon - Fri:</span>
                        <span>8 AM - 4 PM</span>
                      </div>
                      <div className="flex justify-between w-40 gap-4">
                        <span>Saturday:</span>
                        <span>8 AM - 12 PM</span>
                      </div>
                      <div className="flex justify-between w-40 gap-4">
                        <span>Sunday:</span>
                        <span className="text-red-500 font-bold">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-[#EFF6FF] border border-blue-150 rounded-xl p-5 flex flex-col justify-between items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/20">
                  <MapPin className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-700">View Route on Maps</h5>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Get precise direction to the campus</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.name + ' ' + addressString)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block"
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

        {/* Right Column (35% width - sticky sidebar) */}
        <div className="space-y-6">
          <aside className="space-y-6 lg:sticky lg:top-28">
            <GatedWrapper
              isGated={isGated}
              onRegister={() => setRegisterModalOpen(true)}
              title="Unlock Admissions Form"
              subtext="Create a free parent account to send enquiries and schedule campus visits."
            >
            
            {/* CARD 1 — QUICK ENQUIRY */}
            <Card className="bg-white rounded-2xl border-t-[3px] border-t-[#1565D8] border-x-slate-200 border-b-slate-200 p-6 shadow-md space-y-5">
              <div>
                <h4 className="text-sm font-black text-slate-800">Send an Enquiry</h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Free. Get a call back today.</p>
              </div>

              {enquirySubmitted ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 border border-green-200 mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-800">Enquiry Logged!</h5>
                  <p className="text-[10px] text-slate-405 font-medium leading-relaxed max-w-xs">
                    The admissions team at {school.name} has been notified and will reach out to you.
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
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. parent@gmail.com"
                      value={enquiryForm.parentEmail}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, parentEmail: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Child's Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Kumar"
                      value={enquiryForm.childName}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, childName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Grade applying for</label>
                    <select
                      value={enquiryForm.gradeSought}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, gradeSought: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none cursor-pointer focus:border-blue-500"
                    >
                      {['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Message (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Write additional queries..."
                      value={enquiryForm.notes}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none resize-none focus:border-blue-500"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={enquiryLoading}
                    className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md border border-blue-500 h-auto disabled:opacity-50"
                  >
                    {enquiryLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Enquiry
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                  
                  <span className="text-[9px] font-bold text-slate-400 block text-center">
                    🔒 Your info is safe with us
                  </span>
                </form>
              )}
            </Card>

            {/* CARD 1.5 — SCHEDULE VISIT */}
            <Card className="bg-white rounded-2xl border-t-[3px] border-t-emerald-500 border-x-slate-200 border-b-slate-200 p-6 shadow-md space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-800">Schedule a Campus Visit</h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Book a physical visit to see the campus.</p>
              </div>
              <Button
                type="button"
                onClick={() => setVisitModalOpen(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md border border-emerald-500 h-auto cursor-pointer"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                Schedule Visit
              </Button>
            </Card>

            {/* CARD 2 — SCHOOL QUICK INFO */}
            <Card className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2.5">Quick Info</h4>
              
              <div className="space-y-3.5 text-xs font-semibold">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Board / Curriculum</span>
                  <span className="text-slate-700 font-bold text-right">{boardBadge}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Gender Status</span>
                  <span className="text-slate-700 font-bold text-right">Co-Educational</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Classes Offered</span>
                  <span className="text-slate-700 font-bold text-right">Nursery - 12th</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Instruction Medium</span>
                  <span className="text-slate-700 font-bold text-right">English</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Established</span>
                  <span className="text-slate-700 font-bold text-right">2012</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Status</span>
                  <span className="text-emerald-600 font-bold text-right">Active</span>
                </div>
              </div>
            </Card>

            {/* CARD 3 — SIMILAR SCHOOLS */}
            <Card className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2.5">Similar Schools Nearby</h4>
              
              <div className="space-y-4">
                {similarSchools.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider text-center py-4">
                    No similar schools nearby
                  </p>
                ) : (
                  similarSchools.map((s) => {
                    const initials = s.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                    const avatarBg = getGradientByInitial(s.name)
                    const board = s.affiliations?.[0]?.board || 'CBSE'
                    const city = s.locations?.[0]?.city || 'Chennai'
                    
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-3 text-xs font-semibold">
                        <div className="flex items-center gap-3 truncate">
                          {s.media?.[0]?.url ? (
                            <img
                              src={s.media[0].url}
                              alt={s.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${avatarBg} text-white font-bold text-[10px]`}>
                              {initials}
                            </div>
                          )}
                          <div className="truncate">
                            <span className="text-slate-850 font-bold block truncate hover:text-[#1565D8] transition">
                              <Link href={`/schools/${s.slug}`}>{s.name}</Link>
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">
                              {board} • {city}
                            </span>
                          </div>
                        </div>

                        <Link href={`/schools/${s.slug}`}>
                          <Button variant="ghost" className="text-[#1565D8] hover:bg-blue-50 font-bold text-xs p-2 h-auto shrink-0 cursor-pointer rounded-lg">
                            View
                          </Button>
                        </Link>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>

          </GatedWrapper>
          </aside>
        </div>

      </main>

      {/* 6. BOTTOM CTA BANNER */}
      <section className="bg-[#1565D8] text-white py-12 px-6 md:px-8 shadow mt-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <h4 className="text-lg font-black tracking-tight leading-tight">Is this your school?</h4>
            <p className="text-xs font-bold text-blue-100">Claim your free profile and start managing admissions with Vidhyaan CRM</p>
          </div>
          <Link href="/signup">
            <Button className="bg-white hover:bg-slate-50 text-[#1565D8] font-bold text-xs px-6 py-3 rounded-full h-auto shadow border border-blue-100 shrink-0">
              Claim Free Profile &rarr;
            </Button>
          </Link>
        </div>
      </section>

      {/* 7. FOOTER */}
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

      {/* Lightbox dialog modal */}
      {lightboxIndex !== null && school.media && school.media[lightboxIndex] && (
        <Dialog open={lightboxIndex !== null} onOpenChange={(open) => { if (!open) setLightboxIndex(null) }}>
          <DialogContent className="max-w-4xl bg-black/95 border-none p-0 select-none text-white overflow-hidden flex flex-col items-center justify-center h-[80vh] relative">
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 z-50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full h-full flex items-center justify-center p-8 relative">
              {school.media.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIndex((prev) => (prev! === 0 ? school.media.length - 1 : prev! - 1))}
                    className="absolute left-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 z-45 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setLightboxIndex((prev) => (prev! === school.media.length - 1 ? 0 : prev! + 1))}
                    className="absolute right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 z-45 transition cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              <img
                src={school.media[lightboxIndex].url}
                alt={school.media[lightboxIndex].caption || `Photo ${lightboxIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>

            {school.media[lightboxIndex].caption && (
              <div className="absolute bottom-4 left-0 right-0 text-center bg-black/40 py-2 px-4 text-xs font-semibold text-slate-350">
                {school.media[lightboxIndex].caption}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Enquiry Modal */}
      <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-slate-200 select-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800">Submit Admission Enquiry</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium mt-1">
              Provide details below. The admissions officer at {school.name} will contact you shortly.
            </DialogDescription>
          </DialogHeader>

          {enquirySubmitted ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 border border-green-200">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Enquiry Submitted!</h4>
              <p className="text-xs text-slate-400 font-semibold max-w-xs leading-relaxed">
                Thank you for your interest. A confirmation receipt has been sent to your email.
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
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Email Address</label>
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
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Mobile Phone</label>
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
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Grade Sought</label>
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
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Additional Notes</label>
                <textarea
                  rows={3}
                  value={enquiryForm.notes}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                  placeholder="Enter details about previous school, curriculum etc."
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Enquiry
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-slate-200 select-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800">Write a Review</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium mt-1">
              Share your child's experience. Your review helps other parents make informed choices.
            </DialogDescription>
          </DialogHeader>

          {reviewSubmitted ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 border border-green-200">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Review Submitted!</h4>
              <p className="text-xs text-slate-400 font-semibold max-w-xs leading-relaxed">
                Thank you! Your review has been submitted successfully and is visible below.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4 mt-3">
              <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 justify-between">
                <span className="text-xs font-bold text-slate-500">Overall Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="p-0.5 hover:scale-110 transition shrink-0 cursor-pointer outline-none"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-350'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {[
                  { key: 'ratingAcademics', label: 'Academics' },
                  { key: 'ratingFaculty', label: 'Faculty' },
                  { key: 'ratingInfrastructure', label: 'Infra' },
                  { key: 'ratingSafety', label: 'Safety' },
                  { key: 'ratingActivities', label: 'Activities' },
                  { key: 'ratingValue', label: 'Value' }
                ].map((item) => (
                  <div key={item.key} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">{item.label}</span>
                    <select
                      value={(reviewForm as any)[item.key]}
                      onChange={(e) => setReviewForm({ ...reviewForm, [item.key]: Number(e.target.value) })}
                      className="bg-transparent border-0 font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{n}★</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Review Headline</label>
                <input
                  type="text"
                  required
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="e.g. Excellent academics and safe environment"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Detailed Review</label>
                <textarea
                  rows={4}
                  required
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                  placeholder="Tell us about the faculty, campus, board quality etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none resize-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Your Name (for display)</label>
                <input
                  type="text"
                  value={enquiryForm.parentName}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, parentName: e.target.value })}
                  placeholder="Verified Parent"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewOpen(false)}
                  className="font-bold text-xs h-auto px-4 py-2.5 rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs h-auto px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md border border-blue-500"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Review
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Visit Modal */}
      <Dialog open={visitModalOpen} onOpenChange={(open) => {
        setVisitModalOpen(open)
        if (!open) setVisitSubmitted(false)
      }}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-slate-200 select-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-805">
              Schedule Campus Visit
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium mt-1">
              Request a physical campus tour at {school?.name}.
            </DialogDescription>
          </DialogHeader>

          {visitSubmitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-250 mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800">Visit Scheduled!</h4>
                <p className="text-xs text-slate-550 font-medium leading-relaxed max-w-xs mx-auto">
                  The admissions representative from {school?.name} has been notified and will reach out to confirm your slot.
                </p>
              </div>
              <Button
                onClick={() => {
                  setVisitModalOpen(false)
                  setVisitSubmitted(false)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl h-auto mx-auto shadow-md"
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleVisitSubmit} className="space-y-4">
              {visitError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-655 rounded-xl text-xs font-semibold">
                  {visitError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Parent Name *</label>
                  <input
                    type="text"
                    required
                    value={visitForm.parentName}
                    onChange={(e) => setVisitForm({ ...visitForm, parentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                    placeholder="Saran Kumar"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    pattern="[6-9]\d{9}"
                    value={visitForm.phone}
                    onChange={(e) => setVisitForm({ ...visitForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                    placeholder="9845000001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    value={visitForm.preferredDate}
                    onChange={(e) => setVisitForm({ ...visitForm, preferredDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Preferred Time</label>
                  <input
                    type="time"
                    value={visitForm.preferredTime}
                    onChange={(e) => setVisitForm({ ...visitForm, preferredTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Email Address</label>
                  <input
                    type="email"
                    value={visitForm.email}
                    onChange={(e) => setVisitForm({ ...visitForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                    placeholder="parent@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Number of Visitors</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={visitForm.numberOfVisitors}
                    onChange={(e) => setVisitForm({ ...visitForm, numberOfVisitors: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Message / Notes</label>
                <textarea
                  rows={2}
                  value={visitForm.notes}
                  onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                  placeholder="Any specific questions, classes to visit, etc."
                  className="w-full bg-slate-50 border border-slate-202 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none resize-none focus:border-blue-500"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVisitModalOpen(false)}
                  className="font-bold text-xs h-auto px-4 py-2.5 rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={visitLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-auto px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md border border-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  {visitLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    'Confirm Visit'
                  )}
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
      <ParentRegisterModal
        open={registerModalOpen}
        onOpenChange={setRegisterModalOpen}
        onSuccess={() => {
          setRegisterModalOpen(false)
          update()
        }}
      />
      <CompareBar />
    </div>
  )
}
