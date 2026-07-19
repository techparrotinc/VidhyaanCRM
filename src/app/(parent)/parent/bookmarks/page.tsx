'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Bookmark, 
  MapPin, 
  Grid, 
  List, 
  Star, 
  Heart, 
  Trash2,
  SlidersHorizontal,
  Building,
  Loader2,
  CheckCircle2,
  X,
  MessageSquare,
  ChevronRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppSelect } from '@/components/ui/app-select'

interface SchoolMedia {
  id: string
  url: string
}

interface SchoolLocation {
  id: string
  city: string
  state: string
  distance?: number
}

interface SchoolAffiliation {
  id: string
  board: string
}

interface School {
  id: string
  name: string
  slug: string
  avgRating: number
  reviewCount: number
  admissionOpen: boolean
  establishedYear: number | null
  media: SchoolMedia[]
  locations: SchoolLocation[]
  affiliations: SchoolAffiliation[]
}

interface BookmarkItem {
  id: string
  createdAt: string
  school: School
}

export default function ParentBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Sort and Filter States
  const [sortBy, setSortBy] = useState<'recent' | 'az' | 'rating' | 'distance'>('recent')
  const [filterBoard, setFilterBoard] = useState<string>('all')
  const [filterCity, setFilterCity] = useState<string>('all')
  const [filterAdmissions, setFilterAdmissions] = useState<string>('all')

  const fetchBookmarks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/parent/bookmarks')
      if (!res.ok) throw new Error('Failed to retrieve saved schools')
      const json = await res.json()
      if (json.success && json.data) {
        setBookmarks(json.data)
      } else {
        throw new Error(json.error || 'Failed to load bookmarks')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error occurred while loading bookmarks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookmarks()
  }, [])

  const triggerToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => {
      setToastMsg(prev => prev === msg ? null : prev)
    }, 3000)
  }

  const handleRemoveBookmark = async (schoolId: string, schoolName: string) => {
    try {
      const res = await fetch(`/api/v1/parent/bookmarks?schoolId=${schoolId}`, {
        method: 'DELETE'
      })
      const json = await res.json()
      if (json.success) {
        setBookmarks(prev => prev.filter(item => item.school.id !== schoolId))
        triggerToast(`Removed ${schoolName} from bookmarks`)
      } else {
        throw new Error(json.error || 'Failed to remove bookmark')
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error removing bookmark')
    }
  }

  const handleSendEnquiryMock = (schoolName: string) => {
    triggerToast(`Enquiry draft opened for ${schoolName}`)
  }

  // Get dynamic lists for filters
  const boards = Array.from(new Set(bookmarks.map(b => b.school.affiliations[0]?.board).filter(Boolean)))
  const cities = Array.from(new Set(bookmarks.map(b => b.school.locations[0]?.city).filter(Boolean)))

  // Sort and Filter logic
  const filteredAndSorted = bookmarks
    .filter((item) => {
      const school = item.school
      const board = school.affiliations[0]?.board || ''
      const city = school.locations[0]?.city || ''
      
      const matchBoard = filterBoard === 'all' || board.toLowerCase() === filterBoard.toLowerCase()
      const matchCity = filterCity === 'all' || city.toLowerCase() === filterCity.toLowerCase()
      const matchAdmissions = filterAdmissions === 'all' || 
        (filterAdmissions === 'open' && school.admissionOpen) || 
        (filterAdmissions === 'closed' && !school.admissionOpen)

      return matchBoard && matchCity && matchAdmissions
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortBy === 'az') {
        return a.school.name.localeCompare(b.school.name)
      }
      if (sortBy === 'rating') {
        return b.school.avgRating - a.school.avgRating
      }
      if (sortBy === 'distance') {
        const distA = a.school.locations[0]?.distance || 999
        const distB = b.school.locations[0]?.distance || 999
        return distA - distB
      }
      return 0
    })

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
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Saved Schools...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
          <Bookmark className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
          <Button onClick={fetchBookmarks} className="mt-6 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl h-auto">
            Retry Loading
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-current" /> Saved Schools
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-1">
            {bookmarks.length} schools bookmarked
          </p>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid' 
                ? 'bg-white text-[#1565D8] shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-white text-[#1565D8] shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Success Toast */}
      {toastMsg && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl z-50 animate-slide-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="hover:text-slate-300 ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. FILTER & SORT CONTROLS BAR */}
      {bookmarks.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filter by:
            </span>

            {/* Board Filter */}
            <AppSelect
              value={filterBoard}
              onChange={(e) => setFilterBoard(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-650 cursor-pointer focus:outline-none focus:border-[#1565D8]"
            >
              <option value="all">All Boards</option>
              {boards.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </AppSelect>

            {/* City Filter */}
            <AppSelect
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-650 cursor-pointer focus:outline-none focus:border-[#1565D8]"
            >
              <option value="all">All Cities</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </AppSelect>

            {/* Admissions Filter */}
            <AppSelect
              value={filterAdmissions}
              onChange={(e) => setFilterAdmissions(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-650 cursor-pointer focus:outline-none focus:border-[#1565D8]"
            >
              <option value="all">Admission Status</option>
              <option value="open">Admissions Open</option>
              <option value="closed">Admissions Closed</option>
            </AppSelect>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="shrink-0 font-extrabold text-slate-450 uppercase tracking-wider">Sort by:</span>
            <AppSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-[#1565D8] cursor-pointer focus:outline-none"
            >
              <option value="recent">Recently Added</option>
              <option value="az">A-Z Name</option>
              <option value="rating">Rating</option>
              <option value="distance">Distance</option>
            </AppSelect>
          </div>
        </div>
      )}

      {/* 3. CARD VIEW CONTAINER */}
      <div>
        {filteredAndSorted.length > 0 ? (
          viewMode === 'grid' ? (
            /* GRID VIEW (3 Column Portrait Layout) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSorted.map((item) => {
                const school = item.school
                const initials = school.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                const board = school.affiliations[0]?.board || 'CBSE'
                const city = school.locations[0]?.city || 'Chennai'
                const mainLogo = school.media[0]?.url || null

                return (
                  <Card key={school.id} className="bg-white border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow transition duration-300 relative group">
                    {/* Header Image Gradient */}
                    <div className={`h-28 bg-gradient-to-br ${getGradientByInitial(school.name)} flex items-center justify-center text-white relative shadow-inner`}>
                      
                      {/* Remove Bookmark Button (Heart Icon filled) */}
                      <button
                        onClick={() => handleRemoveBookmark(school.id, school.name)}
                        className="absolute top-3 right-3 bg-white/95 text-rose-500 hover:text-rose-600 rounded-full p-1.5 border border-slate-100 shadow-md transition transform hover:scale-110 cursor-pointer"
                        title="Remove Bookmark"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>

                      {mainLogo ? (
                        <img src={mainLogo} alt={school.name} className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow" />
                      ) : (
                        <span className="text-3xl font-black">{initials}</span>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight line-clamp-2">
                            {school.name}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-blue-50 text-[#1565D8] border border-blue-100 font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase">
                            {board}
                          </Badge>
                          <div className="flex items-center gap-0.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span>{city}</span>
                          </div>
                        </div>

                        {/* Rating if available */}
                        {school.avgRating > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{school.avgRating}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">({school.reviewCount} reviews)</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2.5 pt-2">
                        {school.admissionOpen && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-250 font-bold text-[9px] uppercase tracking-wide px-2.5 py-0.5 rounded-md w-fit">
                            Admissions Open
                          </Badge>
                        )}

                        <div className="flex gap-2">
                          <Link href={`/schools/${school.slug}`} className="flex-1">
                            <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[10px] uppercase py-2.5 rounded-xl h-auto shadow-sm">
                              View School
                            </Button>
                          </Link>
                          <Button 
                            onClick={() => handleSendEnquiryMock(school.name)}
                            className="flex-1 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-[10px] uppercase py-2.5 rounded-xl h-auto shadow-sm"
                          >
                            Send Enquiry
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            /* LIST VIEW (Horizontal Layout) */
            <div className="space-y-4">
              {filteredAndSorted.map((item) => {
                const school = item.school
                const initials = school.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                const board = school.affiliations[0]?.board || 'CBSE'
                const city = school.locations[0]?.city || 'Chennai'
                const mainLogo = school.media[0]?.url || null

                return (
                  <Card key={school.id} className="bg-white border-slate-200 p-4 rounded-3xl shadow-sm hover:shadow transition duration-300 relative group flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-4">
                      {/* Logo or initials */}
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradientByInitial(school.name)} text-white font-black text-base flex items-center justify-center shrink-0 shadow-inner relative`}>
                        {mainLogo ? (
                          <img src={mainLogo} alt={school.name} className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight">
                          {school.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge className="bg-blue-50 text-[#1565D8] border border-blue-100 font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase">
                            {board}
                          </Badge>
                          <span className="flex items-center gap-0.5 text-[10px] text-slate-400 font-semibold">
                            <MapPin className="w-3 h-3 text-slate-400" /> {city}
                          </span>
                          {school.admissionOpen && (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-[9px] uppercase px-1.5 py-0.2 rounded">
                              Open
                            </Badge>
                          )}
                        </div>

                        {school.avgRating > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{school.avgRating}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">({school.reviewCount} reviews)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                      <button
                        onClick={() => handleRemoveBookmark(school.id, school.name)}
                        className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-100/50 cursor-pointer"
                        title="Remove Bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <Link href={`/schools/${school.slug}`}>
                        <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[10px] uppercase py-2 px-4 rounded-xl h-auto">
                          View
                        </Button>
                      </Link>

                      <Button 
                        onClick={() => handleSendEnquiryMock(school.name)}
                        className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-[10px] uppercase py-2 px-4 rounded-xl h-auto shadow-sm"
                      >
                        Enquire
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )
        ) : (
          /* EMPTY STATE */
          <Card className="bg-white border-slate-200 p-12 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <Bookmark className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">No saved schools yet</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
              Browse schools and tap the bookmark icon on their profiles to save them here for quick access.
            </p>
            <Link href="/schools" className="mt-6">
              <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-full h-auto shadow-md">
                Browse Schools
              </Button>
            </Link>
          </Card>
        )}
      </div>

    </div>
  )
}
