"use client"

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  Building,
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
  X
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
    subheadline: "Search 500+ verified CBSE, ICSE and Matriculation schools across India. Compare fees, facilities and apply directly.",
    searchPlaceholder: "School name, board or area...",
    popularSearches: [
      "CBSE Schools Chennai",
      "IGCSE Bengaluru",
      "Matriculation Schools",
      "Top Rated Schools"
    ]
  },
  stats: [
    { value: "500+", label: "Verified Schools", icon: School },
    { value: "25+", label: "Cities Covered", icon: MapPin },
    { value: "10,000+", label: "Happy Parents", icon: Users },
    { value: "4.8★", label: "Average Rating", icon: Star }
  ],
  categoriesHeading: "Browse by Curriculum",
  categories: [
    { name: "CBSE", fullName: "Central Board", emoji: "📚", count: "16 schools", color: "blue" },
    { name: "ICSE", fullName: "Indian Certificate", emoji: "🎓", count: "4 schools", color: "purple" },
    { name: "State Board", fullName: "Tamil Nadu Board", emoji: "🏫", count: "5 schools", color: "green" },
    { name: "International", fullName: "IB / Cambridge", emoji: "🌍", count: "3 schools", color: "orange" }
  ],
  citiesHeading: "Schools Near You",
  howItWorks: [
    { step: 1, icon: Search, title: "Search & Discover", desc: "Browse 500+ verified schools with smart filters for board, location and fees" },
    { step: 2, icon: GitCompare, title: "Compare Schools", desc: "Side-by-side comparison of fees, facilities, curriculum and parent reviews" },
    { step: 3, icon: CheckCircle, title: "Apply & Track", desc: "Apply directly and get real-time admission status updates on your phone" }
  ],
  cta: {
    badge: "For Schools & Learning Centers",
    heading: "Grow Your Admissions with Vidhyaan CRM",
    description: "Join 500+ schools already using Vidhyaan. Manage leads, admissions, students and fees all in one powerful platform.",
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
    { name: "Dance", fullName: "Bharatanatyam, Western, Ballet", emoji: "💃", count: "42 centers", color: "purple" },
    { name: "Music", fullName: "Carnatic, Guitar, Keyboard, Vocals", emoji: "🎵", count: "38 centers", color: "blue" },
    { name: "Art & Craft", fullName: "Drawing, Painting, Pottery", emoji: "🎨", count: "28 centers", color: "orange" },
    { name: "Fitness & Sports", fullName: "Yoga, Karate, Swimming, Football", emoji: "🏋", count: "35 centers", color: "green" },
    { name: "Academic Coaching", fullName: "NEET, JEE, Board Exams, Tuition", emoji: "📚", count: "55 centers", color: "indigo" },
    { name: "Coding & Technology", fullName: "Python, Robotics, Web Dev, AI", emoji: "💻", count: "22 centers", color: "cyan" },
    { name: "Performing Arts", fullName: "Theatre, Drama, Storytelling", emoji: "🎭", count: "15 centers", color: "rose" },
    { name: "Language Classes", fullName: "English, French, German, Spanish", emoji: "🌍", count: "18 centers", color: "teal" }
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
    description: "Join 300+ learning centers already on Vidhyaan. Reach thousands of parents searching for the perfect activity classes for their children.",
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
  { name: "Chennai", emoji: "🌊", schoolCount: 67, lcCount: 45 },
  { name: "Bengaluru", emoji: "🌿", schoolCount: 89, lcCount: 62 },
  { name: "Hyderabad", emoji: "💎", schoolCount: 54, lcCount: 38 },
  { name: "Mumbai", emoji: "🏙", schoolCount: 112, lcCount: 75 },
  { name: "New Delhi", emoji: "🕌", schoolCount: 143, lcCount: 95 },
  { name: "Pune", emoji: "🎓", schoolCount: 45, lcCount: 32 },
  { name: "Coimbatore", emoji: "🏭", schoolCount: 28, lcCount: 18 },
  { name: "Madurai", emoji: "🏯", schoolCount: 19, lcCount: 12 },
  { name: "Kochi", emoji: "🌴", schoolCount: 31, lcCount: 22 },
  { name: "Jaipur", emoji: "🏰", schoolCount: 38, lcCount: 28 }
]

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

  // Dynamic Metadata
  useEffect(() => {
    document.title = "Vidhyaan - Find Best Schools & Learning Centers Near You | School Discovery Platform India";
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Discover and compare 500+ verified schools and learning centers across India. Search by board, location, fees. Apply directly and track admissions. Free for parents.');
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

        <LocationBanner
          permissionStatus={permissionStatus}
          city={detectedCity}
          requestLocation={requestLocation}
        />

        {/* 2. HERO SECTION */}
        <section className="bg-white pt-8 pb-10 px-4 overflow-hidden relative border-b border-slate-150/60 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] max-h-[85vh]">
          
          {/* Background Blobs Decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-blue-50/60 opacity-60 filter blur-3xl" />
            <div className="absolute bottom-0 -left-10 w-64 h-64 rounded-full bg-indigo-50/40 opacity-40 filter blur-2xl" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center z-10 space-y-4">
            
            {/* Badge above heading */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#1565D8] text-xs font-bold px-4 py-1.5 rounded-full shadow-sm animate-fade-in">
              🏆 India's Trusted Discovery Platform
            </div>

            {/* Main Dynamic Heading */}
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight font-poppins">
              Discover the Best{' '}
              <span className="text-[#1565D8]">
                {activeTab === 'schools' ? 'Schools' : 'Learning Centers'}
              </span>
              <br className="hidden md:inline" />
              Near You
            </h1>

            {/* Dynamic Subheading */}
            <p className="text-xs md:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
              {activeTab === 'schools' 
                ? "Search 500+ verified CBSE, ICSE and Matriculation schools across India. Compare fees, facilities and apply directly."
                : "Discover 300+ verified dance classes, music academies, art studios and coaching centers near you. Book a trial class today."
              }
            </p>

            {/* SEARCH WIDGET CARD */}
            <Card className="bg-white rounded-3xl p-4 md:p-5 shadow-2xl max-w-3xl mx-auto border border-slate-200 text-slate-800 text-left mt-5">
              {/* Tabs Row (takes full width equally on mobile) */}
              <div className="flex gap-2 border-b border-slate-100 pb-3 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('schools')}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer flex-1 justify-center md:flex-none md:justify-start ${
                    activeTab === 'schools'
                      ? 'bg-blue-50 text-[#1565D8]'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  🏫 Schools
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('learning-centers')}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer flex-1 justify-center md:flex-none md:justify-start ${
                    activeTab === 'learning-centers'
                      ? 'bg-blue-50 text-[#1565D8]'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  💃 Learning Centers
                </button>
              </div>

              {/* Search fields Row */}
              <form onSubmit={(e) => handleSearchSubmit(e)} className="flex flex-col md:flex-row items-stretch gap-2.5">
                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                  <SearchAutocomplete
                    value={search}
                    onChange={setSearch}
                    onSubmit={(val) => {
                      setSearch(val)
                      handleSearchSubmit(undefined, val)
                    }}
                    institutionType={activeTab === 'schools' ? 'SCHOOL' : 'LEARNING_CENTER'}
                    placeholder={activeTab === 'schools' ? 'School name, board or area...' : 'Dance class, music academy, coaching center...'}
                    className="bg-transparent border-0 outline-none text-slate-700 text-xs placeholder-slate-400 w-full font-medium"
                  />
                </div>

                <LocationSelector className="md:w-48" />

                <Button type="submit" className="bg-[#1565D8] hover:bg-blue-700 text-white font-black text-xs px-8 py-3.5 rounded-xl h-auto shrink-0 shadow-md flex items-center gap-1 cursor-pointer">
                  {activeTab === 'schools' ? 'Search Schools' : 'Find Centers'} &rarr;
                </Button>
              </form>
            </Card>

            {/* Compact inline trust-stats row */}
            <div className="flex justify-center items-center gap-6 md:gap-10 mt-6 select-none max-w-md mx-auto">
              <div className="text-center flex-1">
                <div className="text-base md:text-lg font-black text-slate-900 leading-tight">500+</div>
                <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Schools</div>
              </div>
              <div className="h-5 w-px bg-slate-200 shrink-0" />
              <div className="text-center flex-1">
                <div className="text-base md:text-lg font-black text-slate-900 leading-tight">10,000+</div>
                <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Parents</div>
              </div>
              <div className="h-5 w-px bg-slate-200 shrink-0" />
              <div className="text-center flex-1">
                <div className="text-base md:text-lg font-black text-slate-900 leading-tight">4.8★</div>
                <div className="text-[10px] md:text-xs font-bold text-slate-450 uppercase tracking-wider mt-0.5">Rating</div>
              </div>
            </div>



            {/* Popular Searches */}
            <div className="mt-5 flex items-center justify-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-bold">Popular:</span>
              {(activeTab === 'schools' 
                ? schoolsContent.hero.popularSearches 
                : lcContent.hero.popularSearches
              ).map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams()
                    params.append('search', term)
                    if (city) params.append('city', city)
                    
                    if (activeTab === 'schools') {
                      router.push(`/schools?${params.toString()}`)
                    } else {
                      router.push(`/learning-centers?${params.toString()}`)
                    }
                  }}
                  className="text-[#1565D8] hover:underline bg-blue-50/70 border border-blue-100/50 px-3 py-1 rounded-full font-semibold transition cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>

          </div>
        </section>

        {/* DYNAMIC SECTIONS CONTAINER WITH TRANSITION OPACITY */}
        <div className={`transition-opacity ease-in-out ${transitioning ? 'duration-150 opacity-0' : 'duration-300 opacity-100'}`}>
          
          {/* 3. STATS BAR */}
          <section className="max-w-4xl mx-auto px-4 -mt-6 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {content.stats.map((stat) => {
                const StatIcon = stat.icon
                return (
                  <div key={stat.label} className="bg-white rounded-2xl border border-slate-150 shadow-lg p-4 text-center flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1565D8] mb-2 border border-blue-100/30">
                      <StatIcon className="w-4 h-4" />
                    </div>
                    <div className="text-xl md:text-2xl font-black text-[#1565D8] font-poppins">
                      {stat.value}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* SEO Supporting Text */}
            <div className="mt-6 max-w-2xl mx-auto text-center px-4">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Find CBSE schools, ICSE schools, Matriculation schools, International schools, IB schools near Chennai, Bengaluru, Hyderabad, Mumbai and across India. Compare school fees, facilities, admission process and parent reviews. Discover the best learning centers for dance, music, art, fitness and academic coaching near you.
              </p>
            </div>
          </section>

          {/* 4. FEATURED CITIES */}
          <section className="bg-slate-50 py-20 mt-12 border-y border-slate-150/40">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                  {content.citiesHeading}
                </h2>
                <p className="text-xs text-slate-450 font-bold mt-1 uppercase tracking-wider">
                  Browse top cities across India
                </p>
              </div>

              {/* Grid list with horizontal scroll on mobile */}
              <div className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-4 pb-4 lg:pb-0 scrollbar-none snap-x snap-mandatory">
                {displayCities.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      if (displayTab === 'schools') {
                        router.push(`/schools?city=${c.name}`)
                      } else {
                        router.push(`/learning-centers?city=${c.name}`)
                      }
                    }}
                    className="w-[calc((100vw-48px)/3)] sm:w-auto min-w-[95px] sm:min-w-0 snap-align-start bg-white rounded-2xl border border-slate-200 p-4 text-center hover:border-[#1565D8] hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center shrink-0"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:bg-[#1565D8] transition-colors duration-300 border border-blue-100/50">
                      <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform duration-300">{c.emoji}</span>
                    </div>
                    <h4 className="text-[10px] sm:text-sm font-black text-slate-805 leading-none">{c.name}</h4>
                    <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-wider">
                      {isLC ? `${c.lcCount} centers` : `${c.schoolCount} schools`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 5. CATEGORIES SECTION */}
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-10">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight font-poppins">
                {content.categoriesHeading}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {content.categories.map((cat, idx) => {
                  if (!isLC) {
                    // Schools Category Cards (Curriculum Layout)
                    return (
                      <Link 
                        key={cat.name} 
                        href={`/schools?board=${cat.name}`}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${idx * 75}ms` }}
                      >
                        <Card className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 rounded-2xl p-5 text-center border border-blue-100 hover:shadow-md hover:border-[#1565D8] transition-all cursor-pointer h-32 flex flex-col justify-between group">
                          <span className="text-3xl filter drop-shadow block mt-1">{cat.emoji}</span>
                          <div>
                            <h4 className="text-sm font-black text-slate-850">{cat.name}</h4>
                            <span className="text-[10px] text-slate-450 font-bold block mt-1 uppercase tracking-wider group-hover:text-[#1565D8] transition-colors">
                              {cat.count} &rarr;
                            </span>
                          </div>
                        </Card>
                      </Link>
                    )
                  } else {
                    // Learning Centers Category Cards (Compact Layout, Colored Gradients)
                    const gradientColors = {
                      purple: "from-purple-100 to-purple-50 border-purple-200 hover:border-purple-400",
                      blue: "from-blue-100 to-blue-50 border-blue-200 hover:border-blue-400",
                      orange: "from-orange-100 to-orange-50 border-orange-200 hover:border-orange-400",
                      green: "from-green-100 to-green-50 border-green-200 hover:border-green-400",
                      indigo: "from-indigo-100 to-indigo-50 border-indigo-200 hover:border-indigo-400",
                      cyan: "from-cyan-100 to-cyan-50 border-cyan-200 hover:border-cyan-400",
                      rose: "from-rose-100 to-rose-50 border-rose-200 hover:border-rose-400",
                      teal: "from-teal-100 to-teal-50 border-teal-200 hover:border-teal-400",
                    }[cat.color] || "from-slate-100 to-slate-50 border-slate-200"

                    return (
                      <Link 
                        key={cat.name} 
                        href={`/learning-centers?activity=${cat.name}`}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${idx * 75}ms` }}
                      >
                        <Card className={`bg-gradient-to-br ${gradientColors} rounded-2xl p-4 text-center border hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer h-36 flex flex-col justify-between group`}>
                          <span className="text-3xl filter drop-shadow block">{cat.emoji}</span>
                          <div className="flex-1 flex flex-col justify-center my-1.5">
                            <h4 className="text-xs sm:text-sm font-black text-slate-850 leading-tight">{cat.name}</h4>
                            <p className="text-[9px] text-slate-500 font-semibold mt-0.5 line-clamp-1">{cat.fullName}</p>
                          </div>
                          <span className="text-[10px] text-slate-650 font-bold block uppercase tracking-wider">
                            {cat.count}
                          </span>
                        </Card>
                      </Link>
                    )
                  }
                })}
              </div>
            </div>
          </section>

          {/* 6. FEATURED CENTERS (LC Tab Only) */}
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
                      {/* Top Area (Gradient) */}
                      <div className={`h-[140px] bg-gradient-to-br ${getLCGradient(center.activity)} flex items-center justify-center relative`}>
                        <span className="text-5xl group-hover:scale-110 transition-transform duration-300 filter drop-shadow">{center.emoji}</span>
                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#D97706] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                          ⭐ Featured
                        </span>
                      </div>

                      {/* Bottom Content Area */}
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
                            <MapPin className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                            <span>{center.location} · {center.distance}</span>
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

          {/* 7. AGE GROUP SECTION (LC Tab Only) */}
          {isLC && (
            <section className="py-20 bg-white border-b border-slate-150/40 animate-slide-in-bottom">
              <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                    Find by Age Group
                  </h2>
                  <p className="text-xs text-slate-450 font-bold mt-1 uppercase tracking-wider">
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
                      <div className="space-y-3">
                        <span className="text-4xl filter drop-shadow block group-hover:scale-110 transition-transform duration-300">{group.emoji}</span>
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

          {/* 8. HOW IT WORKS */}
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-12">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight font-poppins">
                How It Works
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Connector line for large screens */}
                <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10" />

                {content.howItWorks.map((step) => {
                  const StepIcon = step.icon
                  return (
                    <div key={step.step} className="text-center p-4 space-y-3 flex flex-col items-center relative animate-fade-in-up">
                      <div className="w-12 h-12 rounded-full bg-[#1565D8] text-white flex items-center justify-center font-black shadow-md border border-white">
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800">{step.title}</h4>
                        <p className="text-xs text-slate-450 font-semibold leading-relaxed max-w-xs">{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* 9. TESTIMONIALS */}
          {!isLC ? (
            // Schools Testimonials Section
            <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-20 space-y-8">
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                  What Parents Say
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {schoolTestimonials.map((t, idx) => (
                  <Card key={idx} className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl flex flex-col justify-between space-y-4">
                    <p className="text-xs leading-relaxed text-slate-500 italic font-medium">
                      "{t.quote}"
                    </p>
                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">{t.name}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ) : (
            // Learning Centers Testimonials Section
            <section className="py-20 bg-[#F5F7FA] border-y border-slate-150/40">
              <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                    What Parents Say
                  </h2>
                  <p className="text-xs text-slate-450 font-bold mt-1 uppercase tracking-wider">
                    Real stories from parents whose children attend our partner learning centers
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {lcTestimonials.map((t, idx) => (
                    <Card key={idx} className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="text-xs leading-relaxed text-slate-650 italic font-semibold">
                          "{t.quote}"
                        </p>
                      </div>
                      
                      <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${t.bg}`}>
                          {t.initials}
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-800 block leading-tight">{t.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{t.info}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 10. FOR INSTITUTIONS CTA BANNER */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-10">
            <Card className="bg-gradient-to-r from-[#1565D8] to-blue-700 border-0 rounded-3xl p-8 md:p-12 shadow-xl text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

              <span className="inline-block bg-white/10 text-white border border-white/20 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-4">
                {content.cta.badge}
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
                {content.cta.heading}
              </h2>

              <p className="text-blue-100 text-xs md:text-sm max-w-xl mx-auto mt-4 leading-relaxed font-semibold">
                {content.cta.description}
              </p>
              
              <div className="flex gap-4 justify-center flex-wrap mt-8">
                <Link href={displayTab === 'schools' ? '/signup?type=school' : '/signup?type=learning-center'}>
                  <Button className="bg-white hover:bg-slate-50 text-[#1565D8] font-bold text-xs px-8 py-3.5 rounded-xl h-auto shadow-md">
                    {content.cta.primaryButton}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" className="border-white hover:bg-white/10 text-white font-bold text-xs px-8 py-3.5 rounded-xl h-auto">
                    {content.cta.secondaryButton}
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
            </Card>
          </section>

        </div>

      {/* 11. FOOTER */}
      <footer className="bg-slate-900 text-white mt-12 py-12 px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-slate-700 pb-8">
          
          {/* Brand column */}
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
      <CompareBar />
    </div>
  )
}
