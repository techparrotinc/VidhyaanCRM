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
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function MarketplaceHomepage() {
  const router = useRouter()
  
  // Search state
  const [activeTab, setActiveTab] = useState<'schools' | 'centers'>('schools')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [radius, setRadius] = useState('40')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (city) params.append('city', city)
    if (radius) params.append('radius', radius)
    
    if (activeTab === 'schools') {
      router.push(`/schools?${params.toString()}`)
    } else {
      router.push(`/learning-centers?${params.toString()}`)
    }
  }

  const cities = [
    { name: 'Chennai', count: 120, image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=500&auto=format&fit=crop&q=60' },
    { name: 'Bangalore', count: 98, image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=500&auto=format&fit=crop&q=60' },
    { name: 'Hyderabad', count: 85, image: 'https://images.unsplash.com/photo-1605007493699-af65834f8a00?w=500&auto=format&fit=crop&q=60' },
    { name: 'Mumbai', count: 110, image: 'https://images.unsplash.com/photo-1562973831-ed590c5a1283?w=500&auto=format&fit=crop&q=60' },
    { name: 'Delhi', count: 145, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=500&auto=format&fit=crop&q=60' },
    { name: 'Pune', count: 72, image: 'https://images.unsplash.com/photo-1601962885444-b054238e88e1?w=500&auto=format&fit=crop&q=60' }
  ]

  const boards = [
    { name: 'CBSE Schools', board: 'CBSE', count: '150+ Schools', color: 'from-blue-500 to-indigo-600' },
    { name: 'ICSE Schools', board: 'ICSE', count: '80+ Schools', color: 'from-purple-500 to-pink-650' },
    { name: 'Matriculation', board: 'State', count: '120+ Schools', color: 'from-orange-500 to-red-600' },
    { name: 'International', board: 'IB', count: '45+ Schools', color: 'from-emerald-500 to-teal-650' }
  ]

  const schoolTypes = [
    { name: 'Pre-Primary', query: 'Pre-Primary', count: '60+ Schools', icon: Sparkles },
    { name: 'Day Schools', query: 'Day School', count: '240+ Schools', icon: Building },
    { name: 'Boarding Schools', query: 'Boarding', count: '30+ Schools', icon: Compass },
    { name: 'Co-Ed Schools', query: 'Co-Ed', count: '180+ Schools', icon: Users }
  ]

  const learningCategories = [
    { name: 'Dance', cat: 'Dance', icon: Sparkles, count: '60+ centers', color: 'text-pink-600 bg-pink-50 border-pink-100' },
    { name: 'Music', cat: 'Music', icon: Music, count: '45+ centers', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { name: 'Art', cat: 'Art', icon: Palette, count: '30+ centers', color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { name: 'Fitness', cat: 'Fitness', icon: Dumbbell, count: '75+ centers', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { name: 'Coaching', cat: 'Coaching', icon: BookOpen, count: '110+ centers', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { name: 'Martial Arts', cat: 'Martial Arts', icon: Shield, count: '25+ centers', color: 'text-rose-600 bg-rose-50 border-rose-100' }
  ]

  const testimonials = [
    { name: 'Rajesh Subramanian', rating: 5, quote: 'Vidhyaan made shortlisting schools extremely easy. The comparison dashboard saved us weeks of school visits.' },
    { name: 'Priya Krishnan', rating: 5, quote: 'Highly recommend using the parent enquiry tool. The response times from schools were very fast.' },
    { name: 'Anjali Sharma', rating: 5, quote: 'Finding verified reviews from other parents in our locality helped us pick the perfect CBSE school for our daughter.' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      
      <div>
        {/* 1. HERO SECTION */}
        <section className="bg-gradient-to-r from-blue-700 to-indigo-850 text-white pt-20 pb-28 px-6 md:px-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.06),transparent)] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto space-y-6 relative z-10">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Find the Perfect School <br /> for Your Child
            </h1>
            <p className="text-xs md:text-base text-blue-100 font-semibold max-w-lg mx-auto leading-relaxed">
              Discover and compare 500+ schools across India. Apply directly and track your admission journey.
            </p>

            {/* SEARCH WIDGET CARD */}
            <Card className="bg-white rounded-3xl p-4 md:p-6 shadow-2xl max-w-3xl mx-auto border border-slate-100 space-y-4 text-slate-800">
              
              {/* Row 1: Category tabs */}
              <div className="flex gap-2 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('schools')}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
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
                  onClick={() => setActiveTab('centers')}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'centers'
                      ? 'bg-blue-50 text-[#1565D8]'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  💃 Learning Centers
                </button>
              </div>

              {/* Row 2: Fields */}
              <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch gap-2.5">
                <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                  <Search className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-2" />
                  <input
                    type="text"
                    placeholder="Search school name or city..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-0 outline-none text-slate-700 text-xs placeholder-slate-400 w-full font-medium"
                  />
                </div>

                <div className="md:w-44 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                  <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-2" />
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="bg-transparent border-0 outline-none text-slate-700 text-xs w-full font-bold cursor-pointer"
                  >
                    <option value="10">Within 10 km</option>
                    <option value="20">Within 20 km</option>
                    <option value="40">Within 40 km</option>
                    <option value="100">Within 100 km</option>
                  </select>
                </div>

                <Button type="submit" className="bg-[#1565D8] hover:bg-blue-700 text-white font-black text-xs px-8 py-3.5 rounded-xl h-auto shrink-0 shadow-md flex items-center gap-1.5 cursor-pointer">
                  Search
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </form>
            </Card>

            {/* Stats Bar */}
            <div className="pt-4 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs md:text-sm font-semibold text-blue-200/90 select-none">
              <span>500+ Schools</span>
              <span className="text-white/20">•</span>
              <span>25+ Cities</span>
              <span className="text-white/20">•</span>
              <span>10,000+ Parents</span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1 text-white">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                4.8★ Rating
              </span>
            </div>

          </div>
        </section>

        {/* 2. FEATURED CITIES */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-16 space-y-6">
          <div className="text-center md:text-left">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#1565D8] block mb-1.5">Explore Local</span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Popular Cities</h2>
          </div>

          {/* Scrolling Container */}
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0">
            {cities.map((c) => (
              <Link 
                key={c.name} 
                href={`/schools?city=${c.name}`} 
                className="snap-start shrink-0 w-36 sm:w-44 lg:w-48 group block relative rounded-2xl overflow-hidden aspect-square shadow-sm border border-slate-200 bg-white hover:shadow-md transition"
              >
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="text-xs sm:text-sm font-bold tracking-tight">{c.name}</h4>
                  <span className="text-[9px] text-slate-350 font-bold uppercase tracking-wider block mt-0.5">{c.count} schools</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. SCHOOL CATEGORIES */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-20 space-y-12">
          
          {/* Board list */}
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#1565D8] block mb-1.5">Curriculum Collections</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Browse by Board</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {boards.map((sc) => (
                <Link key={sc.name} href={`/schools?board=${sc.board}`}>
                  <Card className="bg-white hover:shadow-lg transition p-5 rounded-2xl border-slate-200 relative overflow-hidden group h-28 flex flex-col justify-between shadow-sm cursor-pointer">
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${sc.color} opacity-5 group-hover:opacity-10 transition rounded-bl-full`} />
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-black text-slate-800 group-hover:text-[#1565D8] transition-colors">{sc.name}</h4>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{sc.count}</span>
                    </div>
                    <div className="flex items-center text-xs font-bold text-[#1565D8] hover:underline gap-1.5 mt-2">
                      Browse board
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Type list */}
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#1565D8] block mb-1.5">Facility Structures</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Browse by Type</h2>
            </div>

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

        {/* 4. LEARNING CENTER CATEGORIES */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-20 space-y-6">
          <div className="text-center md:text-left">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#1565D8] block mb-1.5">Extracurricular Development</span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Learning Centers</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {learningCategories.map((lc) => {
              const IconComponent = lc.icon
              return (
                <Link key={lc.name} href={`/learning-centers?category=${lc.cat}`}>
                  <Card className="bg-white hover:shadow-lg transition p-4 rounded-2xl border-slate-250 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer group space-y-3 h-28">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${lc.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#1565D8] transition-colors leading-none">{lc.name}</h4>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-1">{lc.count}</span>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        {/* 5. HOW IT WORKS */}
        <section className="bg-white border-y border-slate-200 py-16 mt-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#1565D8] block">Step-By-Step</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">How It Works</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { num: '1', title: 'Search', desc: 'Browse verified schools near your location.', icon: Search },
                { num: '2', title: 'Compare', desc: 'Compare fees, facilities and reviews.', icon: Compass },
                { num: '3', title: 'Apply', desc: 'Apply directly and track your application.', icon: GraduationCap }
              ].map((step) => {
                const StepIcon = step.icon
                return (
                  <div key={step.num} className="text-center p-4 space-y-3 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1565D8] flex items-center justify-center font-black border border-blue-100 relative">
                      <StepIcon className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#1565D8] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                        {step.num}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">{step.title}</h4>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 6. TESTIMONIALS */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-20 space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#1565D8] block mb-1">Feedback</span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">What Parents Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <Card key={idx} className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl flex flex-col justify-between space-y-4">
                <p className="text-xs leading-relaxed text-slate-550 italic font-medium">
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

        {/* 7. FOR SCHOOLS CTA */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-20">
          <Card className="bg-gradient-to-br from-indigo-900 to-blue-900 border-0 rounded-3xl p-8 md:p-12 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8 text-white">
            <div className="space-y-3 text-center md:text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 block">Institution Panel</span>
              <h3 className="text-xl md:text-3xl font-black tracking-tight leading-tight">Are you a School or Learning Center?</h3>
              <p className="text-xs md:text-sm text-blue-100 font-medium max-w-lg leading-relaxed">
                List for free and reach thousands of parents looking for the best education for their children.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <Link href="/signup" className="flex-1 sm:flex-none">
                <Button className="w-full bg-white hover:bg-slate-100 text-blue-900 font-black text-xs px-6 py-3 rounded-xl h-auto shadow-md">
                  Claim Your Free Profile →
                </Button>
              </Link>
              <Link href="/signup" className="flex-1 sm:flex-none">
                <Button variant="ghost" className="w-full text-white hover:bg-white/10 font-bold text-xs px-6 py-3 rounded-xl h-auto border border-white/20">
                  Learn More
                </Button>
              </Link>
            </div>
          </Card>
        </section>

      </div>

      {/* 8. FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-28 py-12 px-6 md:px-8 text-slate-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-slate-150 pb-8">
          
          {/* Logo column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1565D8] flex items-center justify-center text-white font-black text-xs shadow-md">
                V
              </div>
              <span className="text-sm font-black tracking-tight text-slate-800">Vidhyaan</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 font-medium max-w-xs">
              Discovery and CRM platform for modern educational institutions and parent engagement.
            </p>
          </div>

          {/* Links columns */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Company</h4>
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-655">
              <Link href="/about" className="hover:text-[#1565D8] transition">About Us</Link>
              <Link href="/pricing" className="hover:text-[#1565D8] transition">Pricing Plans</Link>
              <Link href="/careers" className="hover:text-[#1565D8] transition">Careers</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Products</h4>
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-655">
              <Link href="/schools" className="hover:text-[#1565D8] transition">Schools Search</Link>
              <Link href="/learning-centers" className="hover:text-[#1565D8] transition">Activity Centers</Link>
              <Link href="/dashboard" className="hover:text-[#1565D8] transition">CRM Admin Portal</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Support & Legal</h4>
            <div className="flex flex-col space-y-2 text-xs font-semibold text-slate-655">
              <Link href="/contact" className="hover:text-[#1565D8] transition">Contact Us</Link>
              <Link href="/privacy" className="hover:text-[#1565D8] transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-[#1565D8] transition">Terms of Service</Link>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
          <span>&copy; 2026 TechParrot Innovations LLP. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-[#1565D8] transition">Twitter</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-[#1565D8] transition">LinkedIn</a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-[#1565D8] transition">Facebook</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
