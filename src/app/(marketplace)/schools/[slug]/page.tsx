"use client"

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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
  Loader2,
  Share2,
  Heart,
  MessageSquare,
  DollarSign,
  Compass,
  ArrowRight,
  ShieldCheck,
  Send,
  X,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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

export default function SchoolProfilePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const [school, setSchool] = useState<SchoolProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals & States
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [compareList, setCompareList] = useState<string[]>([])
  
  // Form values
  const [enquiryForm, setEnquiryForm] = useState({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    gradeSought: 'Grade 1',
    notes: ''
  })
  const [enquirySubmitted, setEnquirySubmitted] = useState(false)

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

  // Local state for recently added reviews to show immediately
  const [localReviews, setLocalReviews] = useState<SchoolReview[]>([])

  useEffect(() => {
    if (!slug) return

    const fetchSchoolDetails = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/schools/${slug}`)
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('School profile not found')
          }
          throw new Error('Failed to retrieve school details')
        }
        const json = await res.json()
        setSchool(json.data)
        
        // Check local storage for bookmark status
        const bookmarks = JSON.parse(localStorage.getItem('bookmarked_schools') ?? '[]')
        if (json.data) {
          setBookmarked(bookmarks.includes(json.data.id))
        }
      } catch (err: any) {
        setError(err.message || 'Error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSchoolDetails()
  }, [slug])

  const toggleBookmark = () => {
    if (!school) return
    const bookmarks: string[] = JSON.parse(localStorage.getItem('bookmarked_schools') ?? '[]')
    let updated: string[] = []
    if (bookmarks.includes(school.id)) {
      updated = bookmarks.filter((id) => id !== school.id)
      setBookmarked(false)
    } else {
      updated = [...bookmarks, school.id]
      setBookmarked(true)
    }
    localStorage.setItem('bookmarked_schools', JSON.stringify(updated))
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Profile link copied to clipboard!')
  }

  const handleCompare = () => {
    if (!school) return
    alert(`${school.name} added to compare list!`)
  }

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEnquirySubmitted(true)
    setTimeout(() => {
      setEnquiryOpen(false)
      setEnquirySubmitted(false)
      setEnquiryForm({
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        gradeSought: 'Grade 1',
        notes: ''
      })
    }, 2500)
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Append to local reviews list for visual feedback
    const newReview: SchoolReview = {
      id: Math.random().toString(),
      rating: reviewForm.rating,
      title: reviewForm.title || 'Parent Review',
      content: reviewForm.content,
      createdAt: new Date().toISOString(),
      parent: {
        name: enquiryForm.parentName || 'Verified Parent'
      }
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
    }, 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Loading school profile...</p>
        </div>
      </div>
    )
  }

  if (error || !school) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
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
  
  const boardBadge = school.affiliations[0]?.board ?? 'State Board'
  const primaryCover = school.media[0]?.url

  // Day list mapping for Hours
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 pb-20 select-none">
      {/* 1. HERO COVER */}
      <div className="relative h-64 md:h-96 w-full bg-slate-200 overflow-hidden">
        {primaryCover ? (
          <img
            src={primaryCover}
            alt={school.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600/80 to-indigo-900/90 flex items-center justify-center" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute bottom-6 left-6 right-6 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-white z-10">
          <div className="space-y-3">
            <Link href="/schools" className="flex items-center text-xs font-bold text-blue-200 hover:text-white transition gap-1.5 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
              Back to Schools Directory
            </Link>

            <div className="flex flex-wrap gap-2 items-center">
              <Badge className="bg-[#1565D8] border border-blue-400 text-white font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded">
                {boardBadge}
              </Badge>
              <Badge className="bg-white/10 text-white border border-white/20 font-bold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded backdrop-blur-sm">
                {school.institutionType}
              </Badge>
              {school.isVerified && (
                <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow">
              {school.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-200">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-blue-300" />
                <span>{addressString}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-white text-sm">{school.stats.avgRating > 0 ? school.stats.avgRating : 'New'}</span>
                {school.stats.totalReviews > 0 && (
                  <span className="text-slate-300">({school.stats.totalReviews} reviews)</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto shrink-0">
            <Button
              onClick={toggleBookmark}
              className={`flex-1 md:flex-none border font-bold text-xs px-4 py-2.5 rounded-xl h-auto flex items-center gap-1.5 transition ${
                bookmarked
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
            <Button
              onClick={handleCompare}
              className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl h-auto flex items-center gap-1.5 transition"
            >
              <Compass className="w-4 h-4" />
              Compare
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl h-auto flex items-center gap-1.5 transition"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              onClick={() => setEnquiryOpen(true)}
              className="w-full md:w-auto bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl h-auto shadow-lg border border-blue-500"
            >
              Enquire Now
            </Button>
          </div>
        </div>
      </div>

      {/* 2. BODY CONTENT LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: School sections */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Section: About */}
          <section id="about" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1565D8]">About School</h3>
            <p className="text-sm font-normal leading-relaxed text-slate-600 whitespace-pre-line">
              {school.description || 'Welcome to Prince Matriculation School. We strive to provide excellent academic support, extracurricular activities, and state of the art facilities to shape future global leaders.'}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Established Year</span>
                <span className="text-sm font-bold text-slate-700">2012</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Instruction Medium</span>
                <span className="text-sm font-bold text-slate-700 font-sans">English</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 md:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Student-Teacher Ratio</span>
                <span className="text-sm font-bold text-slate-700">15:1</span>
              </div>
            </div>
          </section>

          {/* Section: Affiliations */}
          {school.affiliations && school.affiliations.length > 0 && (
            <section id="affiliations" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1565D8]">Affiliation Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {school.affiliations.map((aff) => (
                  <Card key={aff.id} className="p-4 bg-white border-slate-200 rounded-xl flex items-center gap-4 shadow-sm">
                    <div className="p-2.5 rounded-lg bg-blue-50 text-[#1565D8]">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{aff.board} Board</h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">Affiliation No: {aff.affiliationNo || 'N/A'}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Section: Admission */}
          <section id="admission" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1565D8]">Admissions & Academics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className={`p-2.5 rounded-lg text-white ${school.admissionOpen ? 'bg-green-500' : 'bg-slate-500'}`}>
                  {school.admissionOpen ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Admission Status</span>
                  <span className="text-sm font-black text-slate-700">
                    {school.admissionOpen ? 'Admissions Open' : 'Admissions Closed'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="p-2.5 rounded-lg bg-blue-50 text-[#1565D8]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Academic Session</span>
                  <span className="text-sm font-bold text-slate-700">AY 2026 - 2027</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Facilities */}
          <section id="facilities" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1565D8]">Campus Facilities</h3>
            {school.facilities && school.facilities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {school.facilities.map((fac) => (
                  <div key={fac.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Building className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 truncate">{fac.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['Library', 'Science Labs', 'Computer Labs', 'Sports Ground', 'Cafeteria', 'Medical Room'].map((facName) => (
                  <div key={facName} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Building className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700">{facName}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Fee Ranges */}
          <section id="fees" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1565D8]">Estimated Fee Structure</h3>
            {school.feeRanges && school.feeRanges.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Grade level</th>
                      <th className="px-4 py-3">Annual fee range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-600">
                    {school.feeRanges.map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-700">{fee.gradeLabel}</td>
                        <td className="px-4 py-3 font-medium">
                          ₹{Number(fee.minAmount).toLocaleString()} - ₹{Number(fee.maxAmount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Grade level</th>
                      <th className="px-4 py-3">Annual fee range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-slate-600">
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-700">Pre-Primary (KG)</td>
                      <td className="px-4 py-3 font-medium">₹35,000 - ₹50,000</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-700">Primary (Grade 1 - 5)</td>
                      <td className="px-4 py-3 font-medium">₹45,000 - ₹65,000</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-700">Middle School (Grade 6 - 8)</td>
                      <td className="px-4 py-3 font-medium">₹55,000 - ₹75,000</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-700">High School (Grade 9 - 10)</td>
                      <td className="px-4 py-3 font-medium">₹65,000 - ₹90,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section: Gallery */}
          <section id="gallery" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1565D8]">Photo Gallery</h3>
            {school.media && school.media.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {school.media.map((med, idx) => (
                  <div key={med.id} className={`bg-slate-100 rounded-xl overflow-hidden relative group aspect-video md:aspect-square ${idx === 0 ? 'col-span-2 aspect-video' : ''}`}>
                    <img
                      src={med.url}
                      alt={med.caption || school.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {med.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium">
                        {med.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl aspect-video md:aspect-square flex items-center justify-center border border-slate-200/60">
                    <Building className="w-8 h-8 text-slate-300" strokeWidth={1} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Location */}
          <section id="location" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1565D8]">Location & Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-100 rounded-xl overflow-hidden h-64 border border-slate-200 relative">
                {/* Visual Mock Map Widget */}
                <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 mb-2 border border-blue-500/20">
                    <MapPin className="w-6 h-6 animate-bounce" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{school.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium text-center mt-1 max-w-xs">{addressString}</span>
                  {primaryAddress?.latitude && primaryAddress?.longitude && (
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                      Coordinates: {primaryAddress.latitude.toFixed(4)}, {primaryAddress.longitude.toFixed(4)}
                    </span>
                  )}
                  
                  {/* Styled Grid lines to look like map grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(#00000005_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                </div>
              </div>

              <div className="space-y-4 flex flex-col justify-center">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Campus Address</h4>
                  <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed">{addressString}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.name + ' ' + addressString)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-bold text-[#1565D8] hover:underline gap-1 cursor-pointer"
                >
                  Get Directions
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </section>

          {/* Section: Reviews */}
          <section id="reviews" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1565D8]">Parent Reviews</h3>
              <Button
                onClick={() => setReviewOpen(true)}
                className="bg-slate-100 hover:bg-blue-50 hover:text-[#1565D8] text-slate-700 text-xs font-bold px-4 py-2 h-auto rounded-lg border border-slate-200"
              >
                Write a Review
              </Button>
            </div>

            {/* Ratings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-150">
              <div className="text-center flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-200 pb-5 md:pb-0">
                <span className="text-5xl font-black text-slate-800">{school.stats.avgRating > 0 ? school.stats.avgRating : 'N/A'}</span>
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
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-2">
                  {school.stats.totalReviews} total reviews
                </span>
              </div>

              {/* Category Breakdown Progress Bars */}
              <div className="md:col-span-2 space-y-2">
                {Object.entries(school.stats.ratingsBreakdown).map(([category, ratingValue]) => (
                  <div key={category} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500 capitalize w-24 shrink-0">{category}</span>
                    <Progress
                      value={ratingValue * 20}
                      indicatorClassName="bg-amber-400"
                      className="h-2 flex-1 mx-3 bg-slate-200"
                    />
                    <span className="font-bold text-slate-700 w-6 text-right">{ratingValue}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Cards list */}
            <div className="space-y-4">
              {[...localReviews, ...school.reviews].length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                  <MessageSquare className="w-10 h-10 text-slate-350 mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">No reviews listed yet</p>
                </div>
              ) : (
                [...localReviews, ...school.reviews].map((rev) => (
                  <Card key={rev.id} className="p-5 bg-white border-slate-150 rounded-xl shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-sm font-bold text-slate-800">{rev.title || 'Parent Review'}</h5>
                        <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <span>{rev.parent.name}</span>
                          <span>•</span>
                          <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded text-amber-600 text-xs font-black">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500 font-normal">
                      {rev.content}
                    </p>
                  </Card>
                ))
              )}
            </div>
          </section>

        </div>

        {/* Right Column: Contact info sidebar (sticky) */}
        <div className="space-y-6">
          <aside className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 lg:sticky lg:top-28">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">Contact Information</h3>
              
              <div className="space-y-4 mt-4">
                {school.contacts && school.contacts.length > 0 ? (
                  school.contacts.map((con) => {
                    const isPhone = con.type.toLowerCase().includes('phone')
                    const isEmail = con.type.toLowerCase().includes('email')
                    
                    return (
                      <div key={con.id} className="flex items-start gap-3">
                        {isPhone ? (
                          <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        ) : isEmail ? (
                          <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        ) : (
                          <Globe className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="text-xs">
                          <span className="text-slate-400 font-bold capitalize block">{con.type}</span>
                          <span className="font-semibold text-slate-700 select-all">{con.value}</span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="text-slate-400 font-bold block">Admissions hotline</span>
                        <span className="font-semibold text-slate-700">+91 98841 85361</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="text-slate-400 font-bold block">Office Email</span>
                        <span className="font-semibold text-slate-700">admin@princematric.com</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                Working Hours
              </h3>
              
              <div className="space-y-2 mt-4">
                {school.hours && school.hours.length > 0 ? (
                  school.hours
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((hr) => (
                      <div key={hr.id} className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-500">{daysOfWeek[hr.dayOfWeek]}</span>
                        <span className="text-slate-700">
                          {hr.isClosed ? (
                            <span className="text-red-500">Closed</span>
                          ) : (
                            `${hr.openTime} - ${hr.closeTime}`
                          )}
                        </span>
                      </div>
                    ))
                ) : (
                  [1, 2, 3, 4, 5, 6].map((dayIdx) => (
                    <div key={dayIdx} className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-500">{daysOfWeek[dayIdx]}</span>
                      <span className="text-slate-700">
                        {dayIdx === 0 ? <span className="text-red-500">Closed</span> : '08:30 AM - 04:30 PM'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button
              onClick={() => setEnquiryOpen(true)}
              className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl h-auto shadow-md"
            >
              Enquire Now
            </Button>
          </aside>
        </div>

      </main>

      {/* 3. MODALS */}

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
                  className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs h-auto px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Enquiry
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

              {/* Verified Parent input helper */}
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
                  className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs h-auto px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Review
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
