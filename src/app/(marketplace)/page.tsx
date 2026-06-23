"use client"

import React, { useState } from 'react'
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
  ArrowRightLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function MarketplaceHomepage() {
  const router = useRouter()
  
  // Search state
  const [activeTab, setActiveTab] = useState<'schools' | 'centers'>('schools')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (city) params.append('city', city)
    
    if (activeTab === 'schools') {
      router.push(`/schools?${params.toString()}`)
    } else {
      router.push(`/learning-centers?${params.toString()}`)
    }
  }

  const cities = [
    { name: 'Chennai', count: 120, emoji: '🌊' },
    { name: 'Bangalore', count: 98, emoji: '🌿' },
    { name: 'Hyderabad', count: 85, emoji: '💎' },
    { name: 'Mumbai', count: 110, emoji: '🏙' },
    { name: 'Delhi', count: 145, emoji: '🕌' },
    { name: 'Pune', count: 72, emoji: '🎓' },
    { name: 'Coimbatore', count: 54, emoji: '🏭' },
    { name: 'Madurai', count: 42, emoji: '🏯' },
    { name: 'Kochi', count: 38, emoji: '🌴' },
    { name: 'Jaipur', count: 35, emoji: '🏰' }
  ]

  const boards = [
    { name: 'CBSE', count: '150+ Schools', emoji: '📚', query: 'CBSE' },
    { name: 'ICSE', count: '80+ Schools', emoji: '🎓', query: 'ICSE' },
    { name: 'State Board', count: '120+ Schools', emoji: '🏫', query: 'State' },
    { name: 'International', count: '45+ Schools', emoji: '🌍', query: 'IB' }
  ]

  const schoolTypes = [
    { name: 'Pre-Primary', query: 'Pre-Primary', count: '60+ Schools', icon: Sparkles },
    { name: 'Day Schools', query: 'Day School', count: '240+ Schools', icon: Building },
    { name: 'Boarding Schools', query: 'Boarding', count: '30+ Schools', icon: Compass },
    { name: 'Co-Ed Schools', query: 'Co-Ed', count: '180+ Schools', icon: Users }
  ]

  const learningCategories = [
    { name: 'Dance Classes', cat: 'Dance', icon: Sparkles, count: '60+ centers', color: 'text-pink-650 bg-pink-50 border-pink-100' },
    { name: 'Music Academy', cat: 'Music', icon: Music, count: '45+ centers', color: 'text-indigo-650 bg-indigo-50 border-indigo-100' },
    { name: 'Art Studio', cat: 'Art', icon: Palette, count: '30+ centers', color: 'text-amber-650 bg-amber-50 border-amber-100' },
    { name: 'Fitness Center', cat: 'Fitness', icon: Dumbbell, count: '75+ centers', color: 'text-emerald-650 bg-emerald-50 border-emerald-100' },
    { name: 'Coaching Center', cat: 'Coaching', icon: BookOpen, count: '110+ centers', color: 'text-blue-650 bg-blue-50 border-blue-100' },
    { name: 'Martial Arts', cat: 'Martial Arts', icon: Shield, count: '25+ centers', color: 'text-rose-655 bg-rose-50 border-rose-100' }
  ]

  const testimonials = [
    { name: 'Rajesh Subramanian', rating: 5, quote: 'Vidhyaan made shortlisting schools extremely easy. The comparison dashboard saved us weeks of school visits.' },
    { name: 'Priya Krishnan', rating: 5, quote: 'Highly recommend using the parent enquiry tool. The response times from schools were very fast.' },
    { name: 'Anjali Sharma', rating: 5, quote: 'Finding verified reviews from other parents in our locality helped us pick the perfect CBSE school for our daughter.' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      <div>
        {/* 1. STICKY NAV HEADER */}
        <header className="sticky top-0 w-full bg-white border-b border-slate-100 z-50 shadow-sm transition-all">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#1565D8] flex items-center justify-center text-white font-black text-sm shadow-md">
                V
              </div>
              <span className="text-base font-black tracking-tight text-slate-900">Vidhyaan</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <Link href="/schools" className="text-[#1565D8] hover:text-blue-700 transition">Find Schools</Link>
              <Link href="/learning-centers" className="hover:text-blue-700 transition">Learning Centers</Link>
              <Link href="/about" className="hover:text-blue-700 transition">About Us</Link>
              <Link href="/pricing" className="hover:text-blue-700 transition">Pricing</Link>
            </nav>

            <div className="flex items-center gap-2.5">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-705 font-bold text-xs px-4 py-2 rounded-xl h-auto">
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

        {/* 2. HERO SECTION */}
        <section className="bg-white pt-16 pb-20 px-4 overflow-hidden relative border-b border-slate-150/60 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
          
          {/* Background Blobs Decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large circle top right */}
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-blue-50/60 opacity-60 filter blur-3xl" />
            {/* Small circle bottom left */}
            <div className="absolute bottom-0 -left-10 w-64 h-64 rounded-full bg-indigo-50/40 opacity-40 filter blur-2xl" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center z-10 space-y-6">
            
            {/* Badge above heading */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#1565D8] text-xs md:text-sm font-bold px-4 py-2 rounded-full mb-2 shadow-sm animate-fade-in">
              🏆 India's Trusted School Discovery Platform
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight font-poppins">
              Find the Perfect
              <span className="text-[#1565D8]"> School</span> <br className="hidden md:inline" />
              for Your Child
            </h1>

            {/* Subheading */}
            <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Discover and compare 500+ verified schools across India. Apply directly and track your complete admission journey — all in one place.
            </p>

            {/* SEARCH WIDGET CARD */}
            <Card className="bg-white rounded-3xl p-4 md:p-5 shadow-2xl max-w-3xl mx-auto border border-slate-200 text-slate-800 text-left mt-10">
              {/* Tabs Row */}
              <div className="flex gap-2 border-b border-slate-100 pb-3 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('schools')}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'schools'
                      ? 'bg-[#1565D8] text-white'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  🏫 Schools
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('centers')}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'centers'
                      ? 'bg-[#1565D8] text-white'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  💃 Learning Centers
                </button>
              </div>

              {/* Search fields Row */}
              <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch gap-2.5">
                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                  <Search className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    placeholder="School name, board or area..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-0 outline-none text-slate-700 text-xs placeholder-slate-400 w-full font-medium"
                  />
                </div>

                <div className="md:w-48 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                  <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-2" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-transparent border-0 outline-none text-slate-700 text-xs font-bold w-full cursor-pointer"
                  >
                    <option value="">Select City</option>
                    {cities.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <Button type="submit" className="bg-[#1565D8] hover:bg-blue-700 text-white font-black text-xs px-8 py-3.5 rounded-xl h-auto shrink-0 shadow-md flex items-center gap-1 cursor-pointer">
                  Search &rarr;
                </Button>
              </form>
            </Card>

            {/* Popular Searches */}
            <div className="mt-5 flex items-center justify-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-bold">Popular:</span>
              {[
                { label: 'CBSE Schools in Chennai', query: 'CBSE', city: 'Chennai' },
                { label: 'IGCSE Schools', query: 'IB' },
                { label: 'Boarding Schools', query: 'Boarding' },
                { label: 'Top Rated Schools', query: 'Top' }
              ].map((term) => (
                <button
                  key={term.label}
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (term.query) params.append('search', term.query)
                    if (term.city) params.append('city', term.city)
                    router.push(`/schools?${params.toString()}`)
                  }}
                  className="text-[#1565D8] hover:underline bg-blue-50/70 border border-blue-100/50 px-3 py-1 rounded-full font-semibold transition cursor-pointer"
                >
                  {term.label}
                </button>
              ))}
            </div>

          </div>
        </section>

        {/* 3. STATS BAR */}
        <section className="max-w-4xl mx-auto px-4 -mt-8 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { val: '500+', desc: 'Verified Schools' },
              { val: '25+', desc: 'Cities Covered' },
              { val: '10,000+', desc: 'Happy Parents' },
              { val: '4.8★', desc: 'Average Rating' }
            ].map((stat) => (
              <div key={stat.desc} className="bg-white rounded-2xl border border-slate-150 shadow-lg p-5 text-center">
                <div className="text-2xl md:text-3xl font-black text-[#1565D8] font-poppins">
                  {stat.val}
                </div>
                <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  {stat.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. FEATURED CITIES */}
        <section className="bg-slate-50 py-20 mt-12 border-y border-slate-150/40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-8">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                Explore Schools Near You
              </h2>
              <p className="text-xs text-slate-450 font-bold mt-1 uppercase tracking-wider">
                Browse top cities across India
              </p>
            </div>

            {/* Grid list with specific Emojis */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cities.map((c) => (
                <Link 
                  key={c.name} 
                  href={`/schools?city=${c.name}`} 
                  className="w-full bg-white rounded-2xl border border-slate-200 p-5 text-center hover:border-[#1565D8] hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#1565D8] transition-colors duration-300 border border-blue-100/50">
                    <span className="text-xl group-hover:scale-110 transition-transform duration-300">{c.emoji}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 leading-none">{c.name}</h4>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1.5 uppercase tracking-wider">
                    {c.count} schools
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 5. SCHOOL BOARD CATEGORIES */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-10">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight font-poppins">
              Browse by Curriculum
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {boards.map((b) => (
                <Link key={b.name} href={`/schools?board=${b.query}`}>
                  <Card className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 rounded-2xl p-5 text-center border border-blue-100 hover:shadow-md hover:border-[#1565D8] transition-all cursor-pointer h-32 flex flex-col justify-between group">
                    <span className="text-3xl filter drop-shadow block mt-1">{b.emoji}</span>
                    <div>
                      <h4 className="text-sm font-black text-slate-850">{b.name}</h4>
                      <span className="text-[10px] text-slate-450 font-bold block mt-1 uppercase tracking-wider group-hover:text-[#1565D8] transition-colors">
                        {b.count} &rarr;
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* School Types list */}
        <section className="pb-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-6">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight font-poppins">
              Browse by Type
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {schoolTypes.map((sc) => {
                const IconComponent = sc.icon
                return (
                  <Link key={sc.name} href={`/schools?search=${encodeURIComponent(sc.query)}`}>
                    <Card className="bg-white hover:shadow-lg transition p-5 rounded-2xl border-slate-200 shadow-sm flex items-center justify-between group cursor-pointer h-20">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 group-hover:bg-blue-50 group-hover:text-[#1565D8] group-hover:border-blue-100 transition">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-850 group-hover:text-[#1565D8] transition-colors">{sc.name}</h4>
                          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{sc.count}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* 6. LEARNING CENTER CATEGORIES */}
        <section className="py-20 bg-slate-50 border-y border-slate-150/40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-10">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
                Learning Centers
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {learningCategories.map((lc) => {
                const IconComponent = lc.icon
                return (
                  <Link key={lc.name} href={`/learning-centers?category=${lc.cat}`}>
                    <Card className="bg-white hover:shadow-lg transition p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer group space-y-3 h-28">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${lc.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-850 group-hover:text-[#1565D8] transition-colors leading-none">{lc.name}</h4>
                        <span className="text-[9px] text-slate-400 font-bold block mt-1.5">{lc.count}</span>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* 7. HOW IT WORKS */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-12">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-center tracking-tight font-poppins">
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line for large screens */}
              <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10" />

              {[
                { num: '1', title: 'Search & Discover', desc: 'Browse 500+ verified schools in your city.', icon: Search },
                { num: '2', title: 'Compare & Shortlist', desc: 'Compare fees, facilities and parent reviews.', icon: ArrowRightLeft },
                { num: '3', title: 'Apply & Track', desc: 'Apply directly and track your admission in real-time.', icon: GraduationCap }
              ].map((step, idx) => {
                const StepIcon = step.icon
                return (
                  <div key={step.num} className="text-center p-4 space-y-3 flex flex-col items-center relative">
                    <div className="w-12 h-12 rounded-full bg-[#1565D8] text-white flex items-center justify-center font-black shadow-md border border-white">
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">{step.title}</h4>
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 8. TESTIMONIALS */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-20 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-poppins">
              What Parents Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
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

        {/* 9. FOR SCHOOLS CTA */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-[#1565D8] to-blue-700 border-0 rounded-3xl p-8 md:p-12 shadow-xl text-white text-center">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              Are you a School or Learning Center?
            </h2>

            <p className="text-blue-105 text-sm md:text-base max-w-xl mx-auto mt-4 leading-relaxed font-semibold">
              Join 500+ institutions on Vidhyaan. List for free and connect with thousands of parents actively searching for the best education.
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap mt-8">
              <Link href="/signup">
                <Button className="bg-white hover:bg-slate-50 text-[#1565D8] font-bold text-xs px-8 py-3.5 rounded-xl h-auto shadow-md">
                  Claim Your Free Profile &rarr;
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="border-white hover:bg-white/10 text-white font-bold text-xs px-8 py-3.5 rounded-xl h-auto">
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs text-blue-150 font-bold mt-6">
              <span>✓ Free forever</span>
              <span>·</span>
              <span>✓ Setup in 5 minutes</span>
              <span>·</span>
              <span>✓ No credit card needed</span>
            </div>
          </Card>
        </section>

      </div>

      {/* 10. FOOTER */}
      <footer className="bg-slate-900 text-white mt-28 py-12 px-6 md:px-8">
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

    </div>
  )
}
