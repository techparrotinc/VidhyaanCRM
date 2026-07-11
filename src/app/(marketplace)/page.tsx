"use client"

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  Building,
  Building2,
  Landmark,
  GraduationCap,
  Sparkles,
  Users,
  Compass,
  ArrowRight,
  BookOpen,
  Award,
  Music,
  Palette,
  Dumbbell,
  Star,
  Check,
  Shield,
  Zap,
  Phone,
  Mail,
  Globe,
  ArrowRightLeft,
  LayoutGrid,
  Layers,
  Wallet,
  MessageSquare,
  UserPlus,
  ChevronDown,
  ShieldCheck,
  Cloud,
  School,
  GitCompare,
  CheckCircle,
  Calendar,
  X,
  Cpu,
  Gem,
  Waves,
  Cog,
  Church,
  Anchor,
  Castle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useLocation, SUPPORTED_CITIES } from '@/hooks/useLocation'
import { LocationBanner } from '@/components/shared/LocationBanner'
import MarketplaceHeader from '@/components/MarketplaceHeader'
import CompareBar from '@/components/CompareBar'
import { SearchAutocomplete } from '@/components/marketplace/SearchAutocomplete'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import LocationSelector from '@/components/LocationSelector'

// Content Data Objects
const schoolsContent = {
  hero: {
    headline: "Discover the Best Schools Near You",
    subheadline: "Search 45+ verified CBSE, ICSE and Matriculation schools across India. Compare fees, facilities and apply directly.",
    searchPlaceholder: "School name, board or area...",
    popularSearches: [
      "CBSE Schools Chennai",
      "IGCSE Bengaluru",
      "Matriculation Schools",
      "Top Rated Schools"
    ]
  },
  stats: [
    { value: "45+", label: "Verified Schools", icon: School },
    { value: "11", label: "Cities Covered", icon: MapPin },
    { value: "10,000+", label: "Happy Parents", icon: Users },
    { value: "4.8★", label: "Average Rating", icon: Star }
  ],
  categoriesHeading: "Browse by Curriculum",
  categories: [
    { name: "CBSE", fullName: "Central Board", count: "16 schools", color: "blue" },
    { name: "ICSE", fullName: "Indian Certificate", count: "4 schools", color: "purple" },
    { name: "State Board", fullName: "Tamil Nadu Board", count: "5 schools", color: "green" },
    { name: "International", fullName: "IB / Cambridge", count: "3 schools", color: "orange" }
  ],
  citiesHeading: "Schools Near You",
  howItWorks: [
    { step: 1, icon: Search, title: "Search & Discover", desc: "Browse 45+ verified schools with smart filters for board, location and fees" },
    { step: 2, icon: GitCompare, title: "Compare Schools", desc: "Side-by-side comparison of fees, facilities, curriculum and parent reviews" },
    { step: 3, icon: CheckCircle, title: "Apply & Track", desc: "Apply directly and get real-time admission status updates on your phone" }
  ],
  cta: {
    badge: "For Schools & Learning Centers",
    heading: "Grow Your Admissions with Vidhyaan CRM",
    description: "Join schools already using Vidhyaan. Manage leads, admissions, students and fees all in one powerful platform.",
    benefits: [
      "Free school listing forever",
      "Full CRM with 7-day trial",
      "No credit card required",
      "Setup in under 5 minutes"
    ],
    primaryButton: "Claim Free Profile →",
    secondaryButton: "View Pricing"
  }
}

const lcContent = {
  hero: {
    headline: "Find the Best Learning Center for Your Child's Passion",
    subheadline: "Discover 300+ verified dance classes, music academies, art studios and coaching centers near you. Book a trial class today.",
    searchPlaceholder: "Dance class, music academy, coaching center...",
    popularSearches: [
      "Dance Classes Chennai",
      "Music Academy Bengaluru",
      "Art Classes Near Me",
      "NEET Coaching Centers"
    ]
  },
  stats: [
    { value: "300+", label: "Verified Centers", icon: Building },
    { value: "20+", label: "Activity Types", icon: Sparkles },
    { value: "5,000+", label: "Enrolled Students", icon: GraduationCap },
    { value: "4.7★", label: "Average Rating", icon: Star }
  ],
  categoriesHeading: "Browse by Activity",
  categories: [
    { name: "Dance", fullName: "Bharatanatyam, Western, Ballet", count: "42 centers", color: "purple" },
    { name: "Music", fullName: "Carnatic, Guitar, Keyboard, Vocals", count: "38 centers", color: "blue" },
    { name: "Art & Craft", fullName: "Drawing, Painting, Pottery", count: "28 centers", color: "orange" },
    { name: "Fitness & Sports", fullName: "Yoga, Karate, Swimming, Football", count: "35 centers", color: "green" },
    { name: "Academic Coaching", fullName: "NEET, JEE, Board Exams, Tuition", count: "55 centers", color: "indigo" },
    { name: "Coding & Technology", fullName: "Python, Robotics, Web Dev, AI", count: "22 centers", color: "cyan" },
    { name: "Performing Arts", fullName: "Theatre, Drama, Storytelling", count: "15 centers", color: "rose" },
    { name: "Language Classes", fullName: "English, French, German, Spanish", count: "18 centers", color: "teal" }
  ],
  citiesHeading: "Learning Centers Near You",
  howItWorks: [
    { step: 1, icon: Search, title: "Find Your Interest", desc: "Browse by activity type, age group and location to find the perfect learning center" },
    { step: 2, icon: Calendar, title: "Check Batches", desc: "Compare timings, monthly fees and trial class availability across centers near you" },
    { step: 3, icon: CheckCircle, title: "Book & Enroll", desc: "Book a free trial class or enroll directly online in minutes" }
  ],
  cta: {
    badge: "For Dance Studios, Music Academies & Coaching Centers",
    heading: "Grow Your Learning Center with Vidhyaan",
    description: "Join learning centers already on Vidhyaan. Reach thousands of parents searching for the perfect activity classes for their children.",
    benefits: [
      "Free center listing forever",
      "Online enrollment management",
      "Trial class booking system",
      "Fee collection built-in"
    ],
    primaryButton: "List Your Center Free →",
    secondaryButton: "Learn More"
  }
}

// City counts matching both tabs
const cities = [
  { name: "Chennai", schoolCount: 67, lcCount: 45 },
  { name: "Bengaluru", schoolCount: 89, lcCount: 62 },
  { name: "Hyderabad", schoolCount: 54, lcCount: 38 },
  { name: "Mumbai", schoolCount: 112, lcCount: 75 },
  { name: "New Delhi", schoolCount: 143, lcCount: 95 },
  { name: "Pune", schoolCount: 45, lcCount: 32 },
  { name: "Coimbatore", schoolCount: 28, lcCount: 18 },
  { name: "Madurai", schoolCount: 19, lcCount: 12 },
  { name: "Kochi", schoolCount: 31, lcCount: 22 },
  { name: "Jaipur", schoolCount: 38, lcCount: 28 }
]

// Unique Lucide icons & color classes mapping for each city
const cityMeta: Record<string, { icon: React.ComponentType<any>; colorClass: string; bgClass: string; borderHoverClass: string; shadowHoverClass: string }> = {
  "Chennai": { icon: Landmark, colorClass: "text-amber-600", bgClass: "bg-amber-50", borderHoverClass: "hover:border-amber-400", shadowHoverClass: "hover:shadow-amber-100/50" },
  "Bengaluru": { icon: Cpu, colorClass: "text-emerald-600", bgClass: "bg-emerald-50", borderHoverClass: "hover:border-emerald-400", shadowHoverClass: "hover:shadow-emerald-100/50" },
  "Hyderabad": { icon: Gem, colorClass: "text-cyan-600", bgClass: "bg-cyan-50", borderHoverClass: "hover:border-cyan-400", shadowHoverClass: "hover:shadow-cyan-100/50" },
  "Mumbai": { icon: Waves, colorClass: "text-blue-600", bgClass: "bg-blue-50", borderHoverClass: "hover:border-blue-400", shadowHoverClass: "hover:shadow-blue-100/50" },
  "New Delhi": { icon: Building, colorClass: "text-red-600", bgClass: "bg-red-50", borderHoverClass: "hover:border-red-400", shadowHoverClass: "hover:shadow-red-100/50" },
  "Pune": { icon: GraduationCap, colorClass: "text-violet-600", bgClass: "bg-violet-50", borderHoverClass: "hover:border-violet-400", shadowHoverClass: "hover:shadow-violet-100/50" },
  "Coimbatore": { icon: Cog, colorClass: "text-orange-600", bgClass: "bg-orange-50", borderHoverClass: "hover:border-orange-400", shadowHoverClass: "hover:shadow-orange-100/50" },
  "Madurai": { icon: Church, colorClass: "text-rose-600", bgClass: "bg-rose-50", borderHoverClass: "hover:border-rose-400", shadowHoverClass: "hover:shadow-rose-100/50" },
  "Kochi": { icon: Anchor, colorClass: "text-teal-600", bgClass: "bg-teal-50", borderHoverClass: "hover:border-teal-400", shadowHoverClass: "hover:shadow-teal-100/50" },
  "Jaipur": { icon: Castle, colorClass: "text-pink-600", bgClass: "bg-pink-50", borderHoverClass: "hover:border-pink-400", shadowHoverClass: "hover:shadow-pink-100/50" }
}


// Featured Centers (LC only)
const featuredCenters = [
  {
    name: "Kalakshetra Dance Academy",
    activity: "Dance",
    emoji: "💃",
    rating: 4.9,
    reviews: 120,
    location: "Mylapore, Chennai",
    distance: "3.2 km",
    fee: "₹2,000/month",
    trial: true,
    slug: "kalakshetra-dance-academy"
  },
  {
    name: "Swara Music Institute",
    activity: "Music",
    emoji: "🎵",
    rating: 4.8,
    reviews: 95,
    location: "T Nagar, Chennai",
    distance: "5.1 km",
    fee: "₹1,500/month",
    trial: true,
    slug: "swara-music-institute"
  },
  {
    name: "BrightMinds Coaching",
    activity: "Academic Coaching",
    emoji: "📚",
    rating: 4.7,
    reviews: 210,
    location: "Anna Nagar, Chennai",
    distance: "4.8 km",
    fee: "₹3,000/month",
    trial: false,
    slug: "brightminds-coaching-center"
  },
  {
    name: "CodeKids Technology Academy",
    activity: "Coding",
    emoji: "💻",
    rating: 4.8,
    reviews: 88,
    location: "Velachery, Chennai",
    distance: "6.2 km",
    fee: "₹4,000/month",
    trial: true,
    slug: "codekids-technology-academy"
  }
]

// Age Groups Config (LC only)
const ageGroups = [
  {
    title: "Little Ones",
    age: "Ages 2-5 years",
    emoji: "🧸",
    desc: "Toddler-friendly activities in dance, art, music and storytelling",
    bg: "bg-amber-50 border-amber-100 hover:border-amber-300",
    color: "text-amber-600 bg-amber-100 hover:bg-amber-200",
    query: "2-5"
  },
  {
    title: "Kids",
    age: "Ages 6-10 years",
    emoji: "🎒",
    desc: "Foundation skill building across all activities for growing children",
    bg: "bg-blue-50 border-blue-100 hover:border-blue-300",
    color: "text-blue-600 bg-blue-100 hover:bg-blue-200",
    query: "6-10"
  },
  {
    title: "Pre-teens",
    age: "Ages 11-14 years",
    emoji: "📓",
    desc: "Competitive and advanced classes in coaching, sports and technology",
    bg: "bg-purple-50 border-purple-100 hover:border-purple-300",
    color: "text-purple-600 bg-purple-100 hover:bg-purple-200",
    query: "11-14"
  },
  {
    title: "Teens & Adults",
    age: "Ages 15 and above",
    emoji: "🎓",
    desc: "Professional development and career skills for older learners",
    bg: "bg-green-50 border-green-100 hover:border-green-300",
    color: "text-green-600 bg-green-100 hover:bg-green-200",
    query: "15-plus"
  }
]

// Testimonials (Schools and LC separate)
const schoolTestimonials = [
  { name: 'Rajesh Subramanian', rating: 5, quote: 'Vidhyaan made shortlisting schools extremely easy. The comparison dashboard saved us weeks of school visits.' },
  { name: 'Priya Krishnan', rating: 5, quote: 'Highly recommend using the parent enquiry tool. The response times from schools were very fast.' },
  { name: 'Anjali Sharma', rating: 5, quote: 'Finding verified reviews from other parents in our locality helped us pick the perfect CBSE school for our daughter.' }
]

const lcTestimonials = [
  {
    quote: "My daughter has been attending Kalakshetra Dance Academy for 6 months. Her confidence has grown tremendously. Excellent teachers and great environment.",
    name: "Priya Raman",
    info: "Mother of 9-year-old · Chennai",
    initials: "PR",
    bg: "bg-pink-100 text-pink-700"
  },
  {
    quote: "BrightMinds Coaching helped my son improve his grades from average to distinction. The personalized attention made all the difference.",
    name: "Suresh Kumar",
    info: "Father of 15-year-old · Bengaluru",
    initials: "SK",
    bg: "bg-blue-100 text-blue-700"
  },
  {
    quote: "The music classes at Swara Institute are excellent. My child looks forward to every session. Highly recommend to all parents.",
    name: "Meena Krishnan",
    info: "Mother of 12-year-old · Chennai",
    initials: "MK",
    bg: "bg-indigo-100 text-indigo-700"
  }
]

export default function MarketplaceHomepage() {
  const router = useRouter()
  
  const {
    city: detectedCity,
    gpsCity,
    lat,
    lng,
    loading: locationLoading,
    permissionStatus,
    setManualCity,
    requestLocation,
    detectionMethod
  } = useLocation()

  // Tab State
  const [activeTab, setActiveTab] = useState<'schools' | 'learning-centers'>('schools')
  const [transitioning, setTransitioning] = useState(false)
  const [displayTab, setDisplayTab] = useState<'schools' | 'learning-centers'>('schools')

  // Form State
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [citySelectOpen, setCitySelectOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const [apiCities, setApiCities] = useState<any[]>([])



  useEffect(() => {
    fetch('/api/public/cities')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setApiCities(data.data)
        }
      })
      .catch(err => console.error("Error fetching cities count:", err))
  }, [])

  // Sync local city selection with hook's city
  useEffect(() => {
    if (detectedCity) {
      setCity(detectedCity)
    }
  }, [detectedCity])



  const displayCities = cities.map(c => {
    const apiMatch = apiCities.find(ac => ac.city.toLowerCase() === c.name.toLowerCase())
    return {
      ...c,
      schoolCount: apiMatch ? apiMatch.schoolCount : 0,
      lcCount: apiMatch ? apiMatch.lcCount : 0
    }
  })

  // Opacity & Stagger Transition Trigger
  useEffect(() => {
    setTransitioning(true)
    const timer = setTimeout(() => {
      setDisplayTab(activeTab)
      setTransitioning(false)
    }, 150)
    return () => clearTimeout(timer)
  }, [activeTab])

  // Select Active Content Config
  const content = displayTab === 'schools' ? schoolsContent : lcContent
  const isLC = displayTab === 'learning-centers'

  const [curriculumCounts, setCurriculumCounts] = useState<Record<string, number>>({})
  const [liveStats, setLiveStats] = useState<{ verifiedSchoolsCount: number; citiesCoveredCount: number } | null>(null)

  useEffect(() => {
    // Fetch curriculum counts
    fetch('/api/public/curriculum-counts')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setCurriculumCounts(data.data)
        }
      })
      .catch(err => console.error("Error fetching curriculum counts:", err))

    // Fetch live hero stats
    fetch('/api/public/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setLiveStats(data.data)
        }
      })
      .catch(err => console.error("Error fetching public stats:", err))
  }, [])

  const displayCategories = content.categories.map(cat => {
    if (!isLC) {
      const liveCount = curriculumCounts[cat.name] ?? 0
      return {
        ...cat,
        count: `${liveCount} schools`
      }
    }
    return cat
  })

  const displayStats = content.stats.map(stat => {
    if (!isLC) {
      if (stat.label === "Verified Schools") {
        return {
          ...stat,
          value: liveStats ? String(liveStats.verifiedSchoolsCount) : stat.value
        }
      }
      if (stat.label === "Cities Covered") {
        return {
          ...stat,
          value: liveStats ? String(liveStats.citiesCoveredCount) : stat.value
        }
      }
      // Note: "Happy Parents" and "Average Rating" are hardcoded pending a future review/ratings system.
      if (stat.label === "Happy Parents" || stat.label === "Average Rating") {
        return stat
      }
    }
    return stat
  })

  // Dynamic Metadata
  useEffect(() => {
    document.title = "Vidhyaan - Find Best Schools & Learning Centers Near You | School Discovery Platform India";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Discover and compare 45+ verified schools and learning centers across India. Search by board, location, fees. Apply directly and track admissions. Free for parents.');
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent, customSearch?: string, customCity?: string) => {
    if (e) e.preventDefault()
    const finalSearch = customSearch !== undefined ? customSearch : search
    const finalCity = customCity !== undefined ? customCity : city
    const params = new URLSearchParams()
    if (finalSearch) params.append('search', finalSearch)
    if (finalCity) params.append('city', finalCity)
    
    if (displayTab === 'schools') {
      router.push(`/schools?${params.toString()}`)
    } else {
      router.push(`/learning-centers?${params.toString()}`)
    }
  }

  const getLCGradient = (activity: string) => {
    const act = activity.toLowerCase()
    if (act.includes('dance')) return 'from-purple-500 to-pink-500'
    if (act.includes('music')) return 'from-blue-500 to-indigo-600'
    if (act.includes('art')) return 'from-orange-500 to-amber-500'
    if (act.includes('fitness') || act.includes('sports')) return 'from-green-500 to-teal-600'
    if (act.includes('coach') || act.includes('academic')) return 'from-blue-600 to-sky-850'
    if (act.includes('code') || act.includes('tech')) return 'from-cyan-500 to-blue-700'
    return 'from-slate-500 to-slate-700'
  }

  const getLCBadgeColor = (activity: string) => {
    const act = activity.toLowerCase()
    if (act.includes('dance')) return 'bg-purple-50 text-purple-700 border-purple-100'
    if (act.includes('music')) return 'bg-blue-50 text-blue-700 border-blue-100'
    if (act.includes('art')) return 'bg-orange-50 text-orange-700 border-orange-100'
    if (act.includes('fitness') || act.includes('sports')) return 'bg-green-50 text-green-700 border-green-100'
    if (act.includes('coach') || act.includes('academic')) return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    if (act.includes('code') || act.includes('tech')) return 'bg-cyan-50 text-cyan-700 border-cyan-100'
    return 'bg-slate-50 text-slate-700 border-slate-100'
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      {/* Styles for Staggered & Entrance Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInBottom {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-bottom {
          animation: slideInBottom 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      <MarketplaceHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Vidhyaan School Discovery Platform",
            "image": "https://vidhyaan.com/brand/vidhyaan-icon-512.png",
            "description": "Find and compare the best schools and learning centers near you.",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "10000"
            }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How do I find the best schools near me?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Use Vidhyaan's search to filter verified schools by city, area, board (CBSE, ICSE, State Board, International), fees, and facilities. Compare shortlisted schools side by side and read parent reviews before applying."
                }
              },
              {
                "@type": "Question",
                "name": "Is Vidhyaan free for parents?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Searching schools, comparing options, reading reviews, and sending admission enquiries on Vidhyaan is completely free for parents."
                }
              },
              {
                "@type": "Question",
                "name": "What does 'Verified School' mean on Vidhyaan?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Verified schools have had their profile details reviewed and confirmed by the Vidhyaan team, so parents can trust the information about boards, facilities, and contact details."
                }
              },
              {
                "@type": "Question",
                "name": "Can I compare school fees on Vidhyaan?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. School profiles include fee range information where provided, and you can compare fees, facilities, and curriculum across multiple schools side by side."
                }
              },
              {
                "@type": "Question",
                "name": "How do I apply for admission through Vidhyaan?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Send an enquiry directly from any school's profile page. The school's admission team receives it instantly and contacts you — you can track your application status from your parent account."
                }
              },
              {
                "@type": "Question",
                "name": "Which cities does Vidhyaan cover?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Vidhyaan currently covers 11 cities including Chennai, Bengaluru, Hyderabad, Mumbai, New Delhi, Pune, Coimbatore, Madurai, Kochi, and Jaipur — with more cities being added."
                }
              }
            ]
          })
        }}
      />

        <LocationBanner
          permissionStatus={permissionStatus}
          city={detectedCity}
          requestLocation={requestLocation}
        />

        {/* 2. HERO SECTION */}
        <section className="bg-gradient-to-b from-[#1565D8]/5 via-[#1565D8]/2 to-transparent border-b border-slate-100 relative overflow-hidden pt-12 pb-16 px-4">
          
          {/* Background Blobs and Dot Grid Decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            {/* Subtle blue/yellow blurred glow blobs */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-blue-400/10 blur-[100px] mix-blend-multiply" />
            <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-amber-200/10 blur-[80px] mix-blend-multiply" />
            <div className="absolute inset-0 bg-[radial-gradient(#1565d8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04]" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center z-10 space-y-5">
            
            {/* Badge above heading */}
            <div className="inline-flex items-center gap-1.5 bg-white border border-blue-100/80 text-[#1565D8] text-[10px] uppercase tracking-wider font-bold px-3.5 py-1.5 rounded-full shadow-sm select-none">
              <Award className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
              <span>India's Trusted Discovery Platform</span>
            </div>

            {/* Main Dynamic Heading */}
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight font-poppins max-w-3xl mx-auto">
              Discover the Best{' '}
              <span className="text-[#1565D8] relative whitespace-nowrap">
                {activeTab === 'schools' ? 'Schools' : 'Learning Centers'}
                <span className="absolute bottom-1.5 left-0 w-full h-[4px] bg-[#FFC107] -z-10 rounded-full" />
              </span>
              <br className="hidden md:inline" />
              Near You
            </h1>

            {/* Dynamic Subheading */}
            <p className="text-xs md:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed font-medium">
              {activeTab === 'schools' 
                ? "Search 45+ verified CBSE, ICSE and Matriculation schools across India. Compare fees, facilities and apply directly."
                : "Discover 300+ verified dance classes, music academies, art studios and coaching centers near you. Book a trial class today."
              }
            </p>

            {/* SEARCH WIDGET CARD */}
            <div className="bg-white rounded-3xl p-4 md:p-6 shadow-[0_20px_50px_rgba(21,101,216,0.12)] max-w-4xl mx-auto border border-slate-100 text-slate-800 text-left mt-8 relative z-10 backdrop-blur-md">
              {/* Tabs Row - Segmented Pill Toggle INSIDE the card top */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl mb-5 select-none w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('schools')}
                  className={`text-xs font-bold px-5 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 cursor-pointer flex-1 justify-center md:flex-none ${
                    activeTab === 'schools'
                      ? 'bg-[#1565D8] text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-850 hover:bg-slate-200/50'
                  }`}
                >
                  <Building className="w-3.5 h-3.5 shrink-0" />
                  <span>Schools</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('learning-centers')}
                  className={`text-xs font-bold px-5 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 cursor-pointer flex-1 justify-center md:flex-none ${
                    activeTab === 'learning-centers'
                      ? 'bg-[#1565D8] text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-850 hover:bg-slate-200/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Learning Centers</span>
                </button>
              </div>

              {/* Main row - Airbnb style unified bar */}
              <form onSubmit={(e) => handleSearchSubmit(e)} className="flex flex-col md:flex-row items-stretch gap-3 md:gap-0 bg-white md:bg-slate-50 border border-slate-200 md:rounded-2xl p-0 md:p-1.5 shadow-sm">
                
                {/* Zone 1: Search Input */}
                <div className="w-full md:flex-1 flex items-center bg-slate-50 md:bg-transparent border border-slate-200 md:border-0 rounded-xl md:rounded-none px-4 py-3 min-h-[50px] relative">
                  <SearchAutocomplete
                    value={search}
                    onChange={setSearch}
                    onSubmit={(val) => {
                      setSearch(val)
                      handleSearchSubmit(undefined, val)
                    }}
                    institutionType={activeTab === 'schools' ? 'SCHOOL' : 'LEARNING_CENTER'}
                    placeholder={activeTab === 'schools' ? 'School name, board or area...' : 'Dance class, music academy, coaching center...'}
                    className="bg-transparent border-0 outline-none text-slate-700 text-sm placeholder-slate-450 w-full font-medium focus:ring-0 focus:outline-none"
                  />
                </div>

                {/* Vertical Hairline Separator 1 (Desktop only) */}
                <div className="hidden md:block w-[1px] bg-slate-200 self-stretch my-3 shrink-0" />

                {/* Mobile: Row 2 container containing Location (flex-grow) + Button (fixed width) */}
                {/* Desktop: Ignored wrapper container because of md:contents */}
                <div className="flex flex-row items-stretch gap-3 md:gap-0 w-full md:w-auto md:contents">
                  
                  {/* Zone 2: Location Selector */}
                  <LocationSelector className="flex-1 md:flex-none md:w-72 md:min-w-[280px] md:shrink-0 md:border-0 border border-slate-200 rounded-xl md:rounded-none bg-slate-50 md:bg-transparent px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-[#1565D8]/20 focus-within:border-[#1565D8] transition-all" />

                  {/* Vertical Hairline Separator 2 (Desktop only) */}
                  <div className="hidden md:block w-[1px] bg-slate-200 self-stretch my-3 shrink-0 mr-2" />

                  <Button
                    type="submit"
                    className="w-[145px] md:w-[175px] bg-[#1565D8] hover:bg-blue-700 text-white font-black text-xs md:text-sm px-6 py-4 rounded-xl md:rounded-xl h-auto shrink-0 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5 cursor-pointer justify-center select-none"
                  >
                    <span>{activeTab === 'schools' ? 'Search Schools' : 'Find Centers'}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </Button>
                </div>
              </form>
            </div>

            {/* Trust Strip */}
            <div className="pt-6 border-t border-slate-200/50 mt-8 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs text-slate-600 font-bold select-none">
              {activeTab === 'schools' ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <School className="w-4 h-4 text-[#1565D8]/80 shrink-0" />
                    <span>{liveStats ? `${liveStats.verifiedSchoolsCount} Verified Schools` : "45 Verified Schools"}</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#1565D8]/80 shrink-0" />
                    <span>{liveStats ? `${liveStats.citiesCoveredCount} Cities` : "11 Cities"}</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#1565D8]/80 shrink-0" />
                    <span>10,000+ Happy Parents</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
                    <span>4.8★ Average Rating</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-[#1565D8]/80 shrink-0" />
                    <span>300+ Verified Centers</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#1565D8]/80 shrink-0" />
                    <span>20+ Activity Types</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#1565D8]/80 shrink-0" />
                    <span>5,000+ Enrolled Students</span>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
                    <span>4.7★ Average Rating</span>
                  </span>
                </>
              )}
            </div>

          </div>
        </section>

        {/* DYNAMIC SECTIONS CONTAINER WITH TRANSITION OPACITY */}
        <div className={`transition-opacity ease-in-out ${transitioning ? 'duration-150 opacity-0' : 'duration-300 opacity-100'}`}>
          
          {/* SECTION 3 — EXPLORE BY CITY */}
          <section className="bg-slate-50 py-16 border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                  {isLC 
                    ? "Find Learning Centers in Chennai, Bengaluru, Hyderabad & More" 
                    : "Find Schools in Chennai, Bengaluru, Hyderabad & More"
                  }
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  {isLC
                    ? "Explore top-rated dance classes, music academies, art studios, and activity coaching centers across India's major cities."
                    : "Discover CBSE, ICSE, Matriculation, and International schools across India's leading education hubs."
                  }
                </p>
              </div>

              {/* Grid list - 5/3/2 cols by breakpoint */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {displayCities.map((c) => {
                  const count = isLC ? c.lcCount : c.schoolCount
                  const hasMany = count > 5
                  const meta = cityMeta[c.name] || {
                    icon: Building2,
                    colorClass: "text-[#1565D8]",
                    bgClass: "bg-blue-50",
                    borderHoverClass: "hover:border-[#1565D8]",
                    shadowHoverClass: "hover:shadow-blue-100/50"
                  }
                  const CityIcon = meta.icon
                  return (
                    <Link
                      key={c.name}
                      href={isLC ? `/learning-centers?city=${c.name}` : `/schools?city=${c.name}`}
                      className={`bg-white rounded-2xl border border-slate-200 p-5 text-center transition-all duration-300 group flex flex-col items-center justify-center animate-fade-in hover:-translate-y-1 hover:shadow-lg ${meta.borderHoverClass} ${meta.shadowHoverClass}`}
                    >
                      <div className={`w-12 h-12 rounded-full ${meta.bgClass} flex items-center justify-center mx-auto mb-3 border border-slate-100/50 transition-colors duration-300`}>
                        <CityIcon className={`w-5 h-5 ${meta.colorClass} transition-transform duration-300 group-hover:scale-110`} />
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-800 leading-none">{c.name}</h4>
                      {hasMany ? (
                        <span className="text-[10px] bg-blue-50 text-[#1565D8] font-bold px-2 py-0.5 rounded-full mt-2 group-hover:bg-blue-100 transition-colors">
                          {count} {isLC ? 'centers' : 'schools'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold block mt-2 group-hover:text-[#1565D8] transition-colors">
                          Explore →
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>

          {/* SECTION 4 — BROWSE BY BOARD */}
          <section className="py-16 bg-[#1565D8]/3 border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-10">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                  {isLC 
                    ? "Browse Activities by Category" 
                    : "CBSE, ICSE, State Board & International Schools"
                  }
                </h2>
                <p className="text-xs md:text-sm text-slate-550 font-medium">
                  {isLC
                    ? "Find the perfect extracurricular activities and coaching programs to help your child excel."
                    : "Explore top schools affiliated with central, international, and state boards across India."
                  }
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {displayCategories.map((cat) => {
                  if (!isLC) {
                    const boardIcons = {
                      "CBSE": BookOpen,
                      "ICSE": GraduationCap,
                      "State Board": School,
                      "International": Globe
                    };
                    const BoardIcon = boardIcons[cat.name as keyof typeof boardIcons] || School;

                    return (
                      <Link 
                        key={cat.name} 
                        href={`/schools?board=${cat.name}`}
                        className="bg-white rounded-2xl p-5 text-center border border-slate-200 hover:shadow-lg hover:border-[#1565D8] transition-all cursor-pointer flex flex-col justify-between items-center group h-40"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-[#1565D8] group-hover:text-white transition-colors duration-300">
                          <BoardIcon className="w-5 h-5 text-[#1565D8] group-hover:text-white transition-colors duration-300" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-black text-slate-800">{cat.name}</h4>
                          <span className="inline-block text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full mt-2 group-hover:bg-blue-50 group-hover:text-[#1565D8] transition-colors">
                            {cat.count}
                          </span>
                        </div>
                      </Link>
                    )
                  } else {
                    const activityIcons = {
                      "Dance": Music,
                      "Music": Music,
                      "Art & Craft": Palette,
                      "Fitness & Sports": Dumbbell,
                      "Academic Coaching": BookOpen,
                      "Coding & Technology": Globe,
                      "Performing Arts": Sparkles,
                      "Language Classes": Globe
                    };
                    const ActivityIcon = activityIcons[cat.name as keyof typeof activityIcons] || Sparkles;

                    return (
                      <Link 
                        key={cat.name} 
                        href={`/learning-centers?activity=${cat.name}`}
                        className="bg-white rounded-2xl p-5 text-center border border-slate-200 hover:shadow-lg hover:border-[#1565D8] transition-all cursor-pointer flex flex-col justify-between items-center group h-40"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-[#1565D8] group-hover:text-white transition-colors duration-300">
                          <ActivityIcon className="w-5 h-5 text-[#1565D8] group-hover:text-white transition-colors duration-300" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center my-1">
                          <h4 className="text-xs sm:text-sm font-black text-slate-800 leading-tight">{cat.name}</h4>
                          <p className="text-[9px] text-slate-500 font-semibold mt-0.5 line-clamp-1">{cat.fullName}</p>
                        </div>
                        <span className="inline-block text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full mt-1 group-hover:bg-blue-50 group-hover:text-[#1565D8] transition-colors">
                          {cat.count}
                        </span>
                      </Link>
                    )
                  }
                })}
              </div>
            </div>
          </section>

          {/* SECTION 6 — LEARNING CENTERS TEASER */}
          <section className="py-12 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left max-w-md">
                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight font-poppins leading-tight">
                  Explore Dance, Music, Coaching & Activity Classes
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Discover top activity academies and tutors near your area.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:max-w-2xl justify-start md:justify-end">
                {[
                  { name: "Dance", icon: Music },
                  { name: "Music", icon: Music },
                  { name: "Art", icon: Palette },
                  { name: "Abacus", icon: School },
                  { name: "Sports", icon: Dumbbell },
                  { name: "Coaching", icon: BookOpen },
                  { name: "STEM", icon: Globe }
                ].map((item) => {
                  const ItemIcon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={`/learning-centers?activity=${item.name}`}
                      className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-150 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#1565D8] transition-all"
                    >
                      <ItemIcon className="w-3.5 h-3.5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}

                <Link
                  href="/learning-centers"
                  className="text-xs text-[#1565D8] hover:underline font-bold px-3 py-2 shrink-0 inline-flex items-center gap-1"
                >
                  <span>View All Learning Centers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>

          {/* SECTION 5 — HOW IT WORKS */}
          <section className="py-20 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-12">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight font-poppins">
                {isLC 
                  ? "How Vidhyaan Helps Parents Find the Right Learning Center" 
                  : "How Vidhyaan Helps Parents Find the Right School"
                }
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
                
                {/* Connector line for large screens (desktop) */}
                <div className="hidden md:block absolute top-7 left-[15%] right-[15%] h-0.5 bg-[#1565D8]/10 -z-10" />

                {/* Step 1 */}
                <div className="flex flex-col items-center text-center relative space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#1565D8] text-white flex items-center justify-center text-lg font-black shadow-md border-4 border-white relative z-10">
                    1
                  </div>
                  <div className="md:hidden absolute top-14 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-[#1565D8]/10 -z-10" />
                  <div className="space-y-2 pt-2">
                    <h4 className="text-base font-bold text-slate-805">
                      {isLC ? "Search & Discover Classes" : "Search & Compare Schools"}
                    </h4>
                    <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
                      {isLC 
                        ? "Filters for activity types, age groups, timings, fees, and location to find the perfect match." 
                        : "Filters for board (CBSE, ICSE, etc.), fees, location, and facilities."
                      }
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center relative space-y-4 pt-12 md:pt-0">
                  <div className="w-14 h-14 rounded-full bg-[#1565D8] text-white flex items-center justify-center text-lg font-black shadow-md border-4 border-white relative z-10">
                    2
                  </div>
                  <div className="md:hidden absolute top-14 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-[#1565D8]/10 -z-10" />
                  <div className="space-y-2 pt-2">
                    <h4 className="text-base font-bold text-slate-805">Read Verified Reviews</h4>
                    <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
                      Real parent reviews and ratings help you make an informed decision for your child.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center relative space-y-4 pt-12 md:pt-0">
                  <div className="w-14 h-14 rounded-full bg-[#1565D8] text-white flex items-center justify-center text-lg font-black shadow-md border-4 border-white relative z-10">
                    3
                  </div>
                  <div className="space-y-2 pt-2">
                    <h4 className="text-base font-bold text-slate-805">Apply & Track Admission</h4>
                    <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
                      Apply or send enquiries directly, and track application status updates in real-time.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* FEATURED CENTERS (LC Tab Only, Emojis removed) */}
          {isLC && (
            <section className="py-20 bg-white border-b border-slate-150/40 animate-slide-in-right">
              <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                    Top Rated Centers This Week
                  </h2>
                  <p className="text-xs text-slate-450 font-bold mt-1 uppercase tracking-wider">
                    Handpicked by our team based on ratings and reviews
                  </p>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-2">
                  {featuredCenters.map((center) => (
                    <Link 
                      key={center.name} 
                      href={`/learning-centers/${center.slug}`}
                      className="w-[260px] shrink-0 snap-align-start bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-400 transition-all duration-300 flex flex-col group cursor-pointer"
                    >
                      <div className={`h-[140px] bg-gradient-to-br ${getLCGradient(center.activity)} flex items-center justify-center relative`}>
                        {(() => {
                          const activityIcons = {
                            "Dance": Music,
                            "Music": Music,
                            "Art & Craft": Palette,
                            "Fitness & Sports": Dumbbell,
                            "Academic Coaching": BookOpen,
                            "Coding": Globe,
                            "Performing Arts": Sparkles,
                            "Language Classes": Globe
                          };
                          const CenterIcon = activityIcons[center.activity as keyof typeof activityIcons] || Sparkles;
                          return <CenterIcon className="w-12 h-12 text-white/95 group-hover:scale-110 transition-transform duration-300 filter drop-shadow" />
                        })()}
                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-amber-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 select-none">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                          <span>Featured</span>
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-[#1565D8] transition-colors leading-tight line-clamp-1">
                            {center.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border rounded-md ${getLCBadgeColor(center.activity)}`}>
                              {center.activity}
                            </span>
                            <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{center.rating}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 font-bold mt-2.5 uppercase tracking-wide flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-355 shrink-0" />
                            <span>{center.location}</span>
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-[#1565D8]">{center.fee}</span>
                          {center.trial ? (
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5 py-1.5 h-auto rounded-lg shadow-sm">
                              Book Trial
                            </Button>
                          ) : (
                            <Button variant="outline" className="border-blue-200 text-[#1565D8] hover:bg-blue-50 font-bold text-[10px] px-3.5 py-1.5 h-auto rounded-lg">
                              Enquire
                            </Button>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* AGE GROUP SECTION (LC Tab Only, Emojis removed) */}
          {isLC && (
            <section className="py-20 bg-white border-b border-slate-150/40 animate-slide-in-bottom">
              <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                    Find by Age Group
                  </h2>
                  <p className="text-xs text-slate-455 font-bold mt-1 uppercase tracking-wider">
                    Classes designed for every stage of your child's growth
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {ageGroups.map((group) => (
                    <button
                      key={group.title}
                      onClick={() => router.push(`/learning-centers?age=${group.query}`)}
                      className={`p-6 rounded-3xl border ${group.bg} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between items-start text-left h-[260px] cursor-pointer group`}
                    >
                      <div className="space-y-3 w-full">
                        <span className="text-4xl filter drop-shadow block group-hover:scale-110 transition-transform duration-300">
                          {(() => {
                            const ageIcons = {
                              "Little Ones": Sparkles,
                              "Kids": BookOpen,
                              "Pre-teens": GraduationCap,
                              "Teens & Adults": School
                            };
                            const AgeIcon = ageIcons[group.title as keyof typeof ageIcons] || Sparkles;
                            return <AgeIcon className="w-10 h-10 text-[#1565D8]" />
                          })()}
                        </span>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">{group.age}</span>
                          <h4 className="text-base font-black text-slate-800 mt-0.5">{group.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold leading-snug line-clamp-3">
                          {group.desc}
                        </p>
                      </div>
                      <div className={`mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all ${group.color}`}>
                        Explore &rarr;
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SECTION 7 — TESTIMONIALS */}
          <section className="bg-gradient-to-b from-blue-50/40 via-blue-50/10 to-white py-20 border-y border-slate-100">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                  What Parents Say About Vidhyaan
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  Hear from families who found the perfect educational environment for their children.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: 'Rajesh Subramanian',
                    city: 'Chennai',
                    initials: 'RS',
                    bg: 'bg-blue-50 text-[#1565D8]',
                    quote: 'Vidhyaan made shortlisting schools extremely easy. The comparison dashboard saved us weeks of school visits.'
                  },
                  {
                    name: 'Priya Krishnan',
                    city: 'Bengaluru',
                    initials: 'PK',
                    bg: 'bg-amber-50 text-amber-600',
                    quote: 'Highly recommend using the parent enquiry tool. The response times from schools were very fast.'
                  },
                  {
                    name: 'Anjali Sharma',
                    city: 'Chennai',
                    initials: 'AS',
                    bg: 'bg-indigo-50 text-[#1565D8]',
                    quote: 'Finding verified reviews from other parents in our locality helped us pick the perfect CBSE school for our daughter.'
                  }
                ].map((t, idx) => (
                  <div key={idx} className="p-6 bg-white border border-slate-200 border-t-[3px] border-t-[#FFC107] shadow-sm rounded-2xl flex flex-col justify-between space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                    <div className="space-y-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-3.5 h-3.5 fill-[#FFC107] text-[#FFC107]" />
                        ))}
                      </div>
                      <p className="text-xs leading-relaxed text-slate-650 italic font-medium font-poppins">
                        "{t.quote}"
                      </p>
                    </div>
                    <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${t.bg}`}>
                        {t.initials}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block leading-none">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{t.city}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 8 — FAQ */}
          <section className="py-20 bg-slate-50/50 border-b border-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1565d8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
            <div className="relative max-w-4xl mx-auto px-4 md:px-6 space-y-8">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight font-poppins">
                Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                {[
                  {
                    q: "How do I find the best schools near me?",
                    a: "Use Vidhyaan's search to filter verified schools by city, area, board (CBSE, ICSE, State Board, International), fees, and facilities. Compare shortlisted schools side by side and read parent reviews before applying."
                  },
                  {
                    q: "Is Vidhyaan free for parents?",
                    a: "Yes. Searching schools, comparing options, reading reviews, and sending admission enquiries on Vidhyaan is completely free for parents."
                  },
                  {
                    q: "What does 'Verified School' mean on Vidhyaan?",
                    a: "Verified schools have had their profile details reviewed and confirmed by the Vidhyaan team, so parents can trust the information about boards, facilities, and contact details."
                  },
                  {
                    q: "Can I compare school fees on Vidhyaan?",
                    a: "Yes. School profiles include fee range information where provided, and you can compare fees, facilities, and curriculum across multiple schools side by side."
                  },
                  {
                    q: "How do I apply for admission through Vidhyaan?",
                    a: "Send an enquiry directly from any school's profile page. The school's admission team receives it instantly and contacts you — you can track your application status from your parent account."
                  },
                  {
                    q: "Which cities does Vidhyaan cover?",
                    a: "Vidhyaan currently covers 11 cities including Chennai, Bengaluru, Hyderabad, Mumbai, New Delhi, Pune, Coimbatore, Madurai, Kochi, and Jaipur — with more cities being added."
                  }
                ].map((faq, idx) => {
                  const isOpen = activeFaq === idx
                  return (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-300 hover:bg-blue-50/20">
                      <button
                        type="button"
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between p-5 text-left font-bold text-sm md:text-base text-slate-850 hover:text-[#1565D8] transition-colors focus:outline-none"
                        aria-expanded={isOpen}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-5 h-5 text-[#1565D8] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[200px] border-t border-slate-100 bg-slate-50/50' : 'max-h-0'}`}>
                        <p className="p-5 text-xs md:text-sm text-slate-650 leading-relaxed font-medium">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* SECTION 9 — FOR INSTITUTIONS CTA BANNER */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16">
            <div className="bg-gradient-to-r from-[#1565D8] to-blue-700 border-0 rounded-3xl p-8 md:p-12 shadow-xl text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

              <span className="inline-block bg-white/10 text-white border border-white/20 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-4">
                {isLC ? "For Learning Centers & Academies" : "For Schools & Institutions"}
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight max-w-2xl mx-auto font-poppins">
                {isLC 
                  ? "Grow Your Academy with Vidhyaan Management Software" 
                  : "Grow Your Admissions with Vidhyaan School Management Software & CRM"
                }
              </h2>

              <p className="text-blue-100 text-xs md:text-sm max-w-xl mx-auto mt-4 leading-relaxed font-semibold font-poppins">
                {isLC 
                  ? "Join leading academies already using Vidhyaan to manage enquiries, online registrations, and fee collections in one unified platform."
                  : "Join institutions using Vidhyaan admission CRM to streamline lead tracking, parent communications, and student admissions."
                }
              </p>
              
              <div className="flex gap-4 justify-center flex-wrap mt-8">
                <Link href="/claim-profile">
                  <Button className="bg-white hover:bg-slate-50 text-[#1565D8] font-bold text-xs px-8 py-3.5 rounded-xl h-auto shadow-md">
                    {content.cta.primaryButton}
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" className="border-white hover:bg-white/10 text-white font-bold text-xs px-8 py-3.5 rounded-xl h-auto bg-transparent border">
                    Explore CRM Features
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-[10px] text-blue-200 font-bold mt-6 uppercase tracking-wider">
                {content.cta.benefits.map((benefit, idx) => (
                  <React.Fragment key={benefit}>
                    {idx > 0 && <span>·</span>}
                    <span>✓ {benefit}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 10 — SEO FOOTER BLOCK */}
          <section className="bg-blue-50/40 border-t border-slate-200/60 py-16">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8 text-xs text-slate-500 leading-relaxed font-medium">
              
              {/* Columns as Styled Mini-Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 space-y-4 shadow-sm hover:border-[#1565D8]/30 transition-all duration-300">
                  <h3 className="font-black text-slate-900 tracking-tight uppercase text-xs md:text-sm font-poppins flex items-center gap-2 select-none">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1565D8] shrink-0 border border-blue-100/50">
                      <School className="w-4 h-4" />
                    </div>
                    <span>Vidhyaan School Admissions and Discovery</span>
                  </h3>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Vidhyaan is India's premier marketplace for school discoverability, helping parents find the most suitable educational institutions for their children. We index detailed profiles, fee structures, curriculum details, and verified parent reviews for institutions across the country. Whether you are looking for top-rated <Link href="/schools?board=CBSE" className="text-[#1565D8] hover:underline font-semibold">CBSE schools</Link>, academic <Link href="/schools?board=ICSE" className="text-[#1565D8] hover:underline font-semibold">ICSE board schools</Link>, state syllabus institutions, or premier international baccalaureate (IB) and Cambridge affiliated schools, our comprehensive directory makes comparison effortless.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 space-y-4 shadow-sm hover:border-[#1565D8]/30 transition-all duration-300">
                  <h3 className="font-black text-slate-900 tracking-tight uppercase text-xs md:text-sm font-poppins flex items-center gap-2 select-none">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1565D8] shrink-0 border border-blue-100/50">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span>Verified Learning Centers and Extra-Curriculars</span>
                  </h3>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Beyond formal schooling, Vidhyaan connects children with exceptional extracurricular academies. Browse verified dance schools, vocal and instrumental music classes, art and craft studios, sports training programs, abacus classes, and academic coaching centers. Tutors and center administrators use <Link href="/dashboard" className="text-[#1565D8] hover:underline font-semibold">Vidhyaan CRM</Link> and student management software to manage schedules, admissions, and automate parent billing securely.
                  </p>
                </div>
              </div>

              {/* Restyled city/curriculum links as Wrapped Pill Chips */}
              <div className="border-t border-slate-200/80 pt-8 space-y-6">
                <div>
                  <span className="font-black text-slate-700 uppercase text-[10px] tracking-wider block mb-3 font-poppins select-none">Explore Schools by City:</span>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((c) => (
                      <Link
                        key={c.name}
                        href={`/schools?city=${c.name}`}
                        className="text-[11px] font-bold text-slate-600 bg-white hover:bg-blue-50 hover:text-[#1565D8] border border-slate-200/80 hover:border-blue-200 px-3.5 py-1.5 rounded-full transition-all duration-200 shadow-sm"
                      >
                        {c.name} Schools
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-black text-slate-700 uppercase text-[10px] tracking-wider block mb-3 font-poppins select-none">Search by Curriculum:</span>
                  <div className="flex flex-wrap gap-2">
                    {["CBSE", "ICSE", "State Board", "International"].map((board) => (
                      <Link
                        key={board}
                        href={`/schools?board=${board}`}
                        className="text-[11px] font-bold text-slate-600 bg-white hover:bg-blue-50 hover:text-[#1565D8] border border-slate-200/80 hover:border-blue-200 px-3.5 py-1.5 rounded-full transition-all duration-200 shadow-sm"
                      >
                        {board} Schools
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </section>

        </div>

      {/* 11. FOOTER */}
      <footer className="bg-slate-900 text-white mt-12 py-12 px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-slate-700 pb-8">
          
          {/* Brand column */}
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

          {/* Links columns */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">For Parents</h4>
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-350">
              <Link href="/schools" className="hover:text-white transition">Find Schools</Link>
              <Link href="/learning-centers" className="hover:text-white transition">Learning Centers</Link>
              <Link href="/schools?sort=rating" className="hover:text-white transition">Compare Schools</Link>
              <Link href="/login" className="hover:text-white transition">Parent Login</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">For Schools</h4>
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
              <Link href="/products/role-based-access" className="hover:text-white transition">Role-Based Access</Link>
              <Link href="/products/institution-types" className="hover:text-white transition">Institution Types</Link>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
          <span>&copy; 2026 TechParrot Innovations LLP. All rights reserved.</span>
        </div>
      </footer>
      <CompareBar />
    </div>
  )
}
