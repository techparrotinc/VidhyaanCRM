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
  SearchCode,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Map,
  BookOpen,
  Award,
  Music,
  Palette,
  Dumbbell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function MarketplaceHomepage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (city) params.append('city', city)
    router.push(`/schools?${params.toString()}`)
  }

  const cities = [
    { name: 'Chennai', count: 120, image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=500&auto=format&fit=crop&q=60' },
    { name: 'Bangalore', count: 98, image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=500&auto=format&fit=crop&q=60' },
    { name: 'Hyderabad', count: 85, image: 'https://images.unsplash.com/photo-1605007493699-af65834f8a00?w=500&auto=format&fit=crop&q=60' },
    { name: 'Mumbai', count: 110, image: 'https://images.unsplash.com/photo-1562973831-ed590c5a1283?w=500&auto=format&fit=crop&q=60' },
    { name: 'Delhi', count: 145, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=500&auto=format&fit=crop&q=60' },
    { name: 'Pune', count: 72, image: 'https://images.unsplash.com/photo-1601962885444-b054238e88e1?w=500&auto=format&fit=crop&q=60' }
  ]

  const schoolCategories = [
    { name: 'CBSE Schools', board: 'CBSE', count: '150+ Schools', color: 'from-blue-500 to-indigo-600' },
    { name: 'ICSE Schools', board: 'ICSE', count: '80+ Schools', color: 'from-purple-500 to-pink-600' },
    { name: 'Matriculation', board: 'State', count: '120+ Schools', color: 'from-orange-500 to-red-600' },
    { name: 'International', board: 'IB', count: '45+ Schools', color: 'from-emerald-500 to-teal-650' }
  ]

  const learningCategories = [
    { name: 'Dance classes', cat: 'Dance', icon: Sparkles, count: '60+ Academies', color: 'bg-pink-50 text-pink-600' },
    { name: 'Music schools', cat: 'Music', icon: Music, count: '45+ Academies', color: 'bg-indigo-50 text-indigo-600' },
    { name: 'Art & Drawing', cat: 'Art', icon: Palette, count: '30+ Studio centers', color: 'bg-amber-50 text-amber-600' },
    { name: 'Fitness & Sports', cat: 'Fitness', icon: Dumbbell, count: '75+ Clubs', color: 'bg-emerald-50 text-emerald-600' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 pb-20 select-none">
      
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-24 px-6 md:px-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Find the Best School <br className="hidden md:inline" /> for Your Child
          </h1>
          <p className="text-sm md:text-xl text-blue-100 font-medium max-w-xl mx-auto leading-relaxed">
            Discover curriculum details, comparison guides, and start parent applications instantly.
          </p>

          <form onSubmit={handleSearchSubmit} className="bg-white rounded-2xl p-2 md:p-3 shadow-2xl flex flex-col md:flex-row items-stretch gap-2.5 max-w-3xl mx-auto border border-white/20">
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="Search school name or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-0 outline-none text-slate-700 text-sm placeholder-slate-400 w-full font-medium"
              />
            </div>

            <div className="md:w-52 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0 mr-2" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-transparent border-0 outline-none text-slate-700 text-sm w-full font-medium cursor-pointer"
              >
                <option value="">All Cities</option>
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-8 py-3 rounded-xl h-auto shrink-0 shadow-md">
              Search Schools
            </Button>
          </form>
        </div>
      </section>

      {/* 2. FEATURED CITIES */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-20 space-y-6">
        <div className="text-center md:text-left">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#1565D8] block mb-2">Explore Local</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Featured Cities</h2>
          <p className="text-xs text-slate-450 font-medium mt-1">Explore verified schools and learning hubs in your metropolitan region.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cities.map((c) => (
            <Link key={c.name} href={`/schools?city=${c.name}`} className="group block relative rounded-2xl overflow-hidden aspect-square shadow-sm border border-slate-200 bg-white hover:shadow-md transition">
              <img
                src={c.image}
                alt={c.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h4 className="text-sm font-bold tracking-tight">{c.name}</h4>
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{c.count} schools</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. SCHOOL CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-20 space-y-6">
        <div className="text-center md:text-left">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#1565D8] block mb-2">Curriculum Categories</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Popular Boards</h2>
          <p className="text-xs text-slate-450 font-medium mt-1">Browse our handpicked collections categorized by board and education levels.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {schoolCategories.map((sc) => (
            <Link key={sc.name} href={`/schools?board=${sc.board}`}>
              <Card className="bg-white hover:shadow-lg transition p-6 rounded-2xl border-slate-200 relative overflow-hidden group h-32 flex flex-col justify-between shadow-sm cursor-pointer">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${sc.color} opacity-5 group-hover:opacity-10 transition rounded-bl-full`} />
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-800 group-hover:text-[#1565D8] transition-colors">{sc.name}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{sc.count}</span>
                </div>
                <div className="flex items-center text-xs font-bold text-[#1565D8] hover:underline gap-1.5 mt-4">
                  Browse list
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. LEARNING CENTER CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-20 space-y-6">
        <div className="text-center md:text-left">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#1565D8] block mb-2">Extracurricular Development</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Learning Center Categories</h2>
          <p className="text-xs text-slate-450 font-medium mt-1">Find top-rated activity studios for dance, fitness, music, and creative arts.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {learningCategories.map((lc) => {
            const IconComponent = lc.icon
            return (
              <Link key={lc.name} href={`/learning-centers?category=${lc.cat}`}>
                <Card className="bg-white hover:shadow-lg transition p-6 rounded-2xl border-slate-200 shadow-sm flex items-center gap-4 cursor-pointer group">
                  <div className={`p-3 rounded-xl ${lc.color} shrink-0`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1565D8] transition-colors">{lc.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{lc.count}</span>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="bg-white border-y border-slate-200 py-20 mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#1565D8] block">Step-By-Step</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">How Vidhyaan Works</h2>
            <p className="text-xs text-slate-450 font-medium leading-relaxed">Three simple steps to transition your child to the best school in your town.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', title: 'Search Your City', desc: 'Use filters like city, curriculum, and admissions open status to discover the best matching profiles.', icon: Search },
              { num: '2', title: 'Compare & Shortlist', desc: 'Shortlist top candidates, bookmark records, review fee structures, and compare options side-by-side.', icon: Compass },
              { num: '3', title: 'Apply Directly', desc: 'Submit inquiries and documents directly through verified pages to start enrollment seamlessly.', icon: GraduationCap }
            ].map((step) => {
              const StepIcon = step.icon
              return (
                <div key={step.num} className="text-center p-6 space-y-4 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1565D8] flex items-center justify-center font-black border border-blue-100 relative">
                    <StepIcon className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#1565D8] text-white text-[10px] font-black rounded-full flex items-center justify-center border border-white">
                      {step.num}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">{step.title}</h4>
                    <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-xs">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 6. STATS SECTION */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-20 bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-3xl p-10 md:p-12 relative overflow-hidden shadow-xl border border-blue-700">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.06),transparent)] pointer-events-none" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative z-10">
          <div className="space-y-1.5">
            <span className="text-3xl md:text-5xl font-black tracking-tight leading-none text-white block">500+</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Schools Listed</span>
          </div>
          <div className="space-y-1.5 border-y md:border-y-0 md:border-x border-white/10 py-6 md:py-0">
            <span className="text-3xl md:text-5xl font-black tracking-tight leading-none text-white block">25+</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Cities Active</span>
          </div>
          <div className="space-y-1.5">
            <span className="text-3xl md:text-5xl font-black tracking-tight leading-none text-white block">10,000+</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Parents Guided</span>
          </div>
        </div>
      </section>

      {/* 7. FOR SCHOOLS CTA */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-20">
        <Card className="bg-white border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#1565D8] block">Institutional Partners</span>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">List Your School for Free</h3>
            <p className="text-xs text-slate-450 font-medium max-w-lg">Claim your profile, configure admission stages, manage student leads, and collect applications directly.</p>
          </div>
          
          <div className="shrink-0 w-full md:w-auto">
            <Link href="/signup">
              <Button className="w-full bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-8 py-3 rounded-xl h-auto shadow-md">
                Register Your School
              </Button>
            </Link>
          </div>
        </Card>
      </section>

    </div>
  )
}
