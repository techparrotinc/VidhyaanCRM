'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Building, 
  MapPin, 
  Star, 
  Trash2, 
  Check, 
  X, 
  ArrowRight, 
  Loader2, 
  MessageSquare,
  Sparkles,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLocation } from '@/hooks/useLocation'
import MarketplaceHeader from '@/components/MarketplaceHeader'

interface SchoolProfile {
  id: string
  name: string
  slug: string
  institutionType: string
  avgRating: number
  reviewCount: number
  admissionOpen: boolean
  establishedYear: number | null
  totalStudents: number | null
  mediumOfInstruction: string | null
  gender: string | null
  gradesOffered: string | null
  locations: Array<{
    city: string
    state: string
    latitude: number | null
    longitude: number | null
  }>
  media: Array<{
    url: string
  }>
  affiliations: Array<{
    board: string
  }>
  facilities: Array<{
    name: string
  }>
  feeRanges: Array<{
    minAmount: number
    maxAmount: number
  }>
}

function CompareSchoolsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lat, lng } = useLocation()
  const { data: session } = useSession()

  const [schools, setSchools] = useState<SchoolProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get slugs from query params
  const slugsParam = searchParams.get('schools')
  const slugs = slugsParam ? slugsParam.split(',').filter(Boolean).slice(0, 3) : []

  useEffect(() => {
    if (slugs.length === 0) {
      setSchools([])
      setLoading(false)
      return
    }

    const fetchSchools = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetched: SchoolProfile[] = []

        for (const slug of slugs) {
          const res = await fetch(`/api/public/schools/${slug}`)
          if (res.ok) {
            const json = await res.json()
            if (json.success && json.data) {
              fetched.push(json.data)
            }
          }
        }

        setSchools(fetched)
      } catch (err) {
        console.error('Error fetching schools to compare:', err)
        setError('Failed to load schools comparison')
      } finally {
        setLoading(false)
      }
    }

    fetchSchools()
  }, [slugsParam])

  const calculateDistance = (schoolLat: number | null, schoolLng: number | null) => {
    if (lat === null || lng === null || schoolLat === null || schoolLng === null) return null
    const R = 6371 // Earth radius in km
    const dLat = (schoolLat - lat) * Math.PI / 180
    const dLon = (schoolLng - lng) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat * Math.PI / 180) * Math.cos(schoolLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return Number((R * c).toFixed(1))
  }

  const handleRemove = (slugToRemove: string) => {
    const updatedSlugs = slugs.filter(s => s !== slugToRemove)
    
    // Sync localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('compare_schools', JSON.stringify(updatedSlugs))
      window.dispatchEvent(new Event('compare-changed'))
    }

    if (updatedSlugs.length === 0) {
      router.push('/schools')
    } else {
      router.push(`/schools/compare?schools=${updatedSlugs.join(',')}`)
    }
  }

  const handleClearAll = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('compare_schools', '[]')
      window.dispatchEvent(new Event('compare-changed'))
    }
    router.push('/schools')
  }

  // Value highlight helpers
  const getMinFee = (school: SchoolProfile) => {
    if (!school.feeRanges || school.feeRanges.length === 0) return null
    return Math.min(...school.feeRanges.map(f => Number(f.minAmount)))
  }

  const getMaxFee = (school: SchoolProfile) => {
    if (!school.feeRanges || school.feeRanges.length === 0) return null
    return Math.max(...school.feeRanges.map(f => Number(f.maxAmount)))
  }

  const bestRating = schools.length > 1 ? Math.max(...schools.map(s => s.avgRating || 0)) : null
  const lowestFee = schools.length > 1 ? Math.min(...schools.map(s => getMinFee(s) || Infinity).filter(f => f !== Infinity)) : null
  const shortestDistance = schools.length > 1 ? Math.min(...schools.map(s => {
    const dist = calculateDistance(s.locations?.[0]?.latitude, s.locations?.[0]?.longitude)
    return dist !== null ? dist : Infinity
  }).filter(d => d !== Infinity)) : null

  // Enquiry logic
  const handleEnquiry = (schoolId: string) => {
    const targetSchool = schools.find(s => s.id === schoolId)
    if (targetSchool) {
      router.push(`/schools/${targetSchool.slug}?enquiry=true`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Comparing Schools...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between select-none">
      <MarketplaceHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
        
        {/* Header section */}
        <div className="flex justify-between items-end border-b border-slate-200 pb-5 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Compare Schools</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">
              Side-by-side comparison of your selected institutions
            </p>
          </div>
          {schools.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleClearAll}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-4 py-2 rounded-xl h-auto"
            >
              Clear All
            </Button>
          )}
        </div>

        {schools.length === 0 ? (
          <Card className="bg-white border-slate-200/80 p-12 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <Building className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">No schools to compare</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
              Please go back to our search page and click "Compare" on schools to view them here side by side.
            </p>
            <Link href="/schools" className="mt-6">
              <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-full h-auto shadow-md">
                Browse Schools
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {/* First Column: Labels */}
                  <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider w-1/4">Features</th>
                  
                  {/* Schools Headers */}
                  {schools.map((school) => {
                    const initials = school.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                    return (
                      <th key={school.id} className="p-4 border-l border-slate-100 relative group w-1/4">
                        <button 
                          onClick={() => handleRemove(school.slug)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                          title="Remove school"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
                        <div className="flex flex-col items-center text-center pt-4 pb-2 px-2">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md mb-3">
                            {initials}
                          </div>
                          <h3 className="text-sm font-black text-slate-800 line-clamp-2 max-w-[150px] leading-tight">
                            {school.name}
                          </h3>
                          <Badge className="bg-blue-50 text-[#1565D8] border border-blue-100 font-extrabold text-[8px] px-1.5 py-0.5 rounded mt-2 uppercase">
                            {school.affiliations?.[0]?.board || 'CBSE'}
                          </Badge>
                        </div>
                      </th>
                    )
                  })}

                  {/* Empty headers for padding if less than 3 schools compared */}
                  {Array.from({ length: Math.max(0, 3 - schools.length) }).map((_, idx) => (
                    <th key={idx} className="p-4 border-l border-slate-100 w-1/4">
                      <div className="flex flex-col items-center justify-center text-slate-350 min-h-[150px] border border-dashed border-slate-200 rounded-2xl bg-slate-50/30 m-2">
                        <span className="text-xs font-bold uppercase tracking-wider">Empty Slot</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {/* Board / Curriculum */}
                <tr>
                  <td className="p-4 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">Board / Curriculum</td>
                  {schools.map(s => (
                    <td key={s.id} className="p-4 border-l border-slate-100 text-slate-700">
                      {s.affiliations?.map(a => a.board).join(', ') || 'N/A'}
                    </td>
                  ))}
                  {Array.from({ length: 3 - schools.length }).map((_, i) => <td key={i} className="p-4 border-l border-slate-100" />)}
                </tr>

                {/* Grades Offered */}
                <tr>
                  <td className="p-4 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">Grades Offered</td>
                  {schools.map(s => (
                    <td key={s.id} className="p-4 border-l border-slate-100 text-slate-700">
                      {s.gradesOffered || 'N/A'}
                    </td>
                  ))}
                  {Array.from({ length: 3 - schools.length }).map((_, i) => <td key={i} className="p-4 border-l border-slate-100" />)}
                </tr>

                {/* Type */}
                <tr>
                  <td className="p-4 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">Type</td>
                  {schools.map(s => (
                    <td key={s.id} className="p-4 border-l border-slate-100 text-slate-700">
                      {s.gender || 'Co-Ed'}
                    </td>
                  ))}
                  {Array.from({ length: 3 - schools.length }).map((_, i) => <td key={i} className="p-4 border-l border-slate-100" />)}
                </tr>

                {/* Medium of Instruction */}
                <tr>
                  <td className="p-4 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">Medium of Instruction</td>
                  {schools.map(s => (
                    <td key={s.id} className="p-4 border-l border-slate-100 text-slate-700">
                      {s.mediumOfInstruction || 'English'}
                    </td>
                  ))}
                  {Array.from({ length: 3 - schools.length }).map((_, i) => <td key={i} className="p-4 border-l border-slate-100" />)}
                </tr>

                {/* Established Year */}
                <tr>
                  <td className="p-4 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">Established Year</td>
                  {schools.map(s => (
                    <td key={s.id} className="p-4 border-l border-slate-100 text-slate-700">
                      {s.establishedYear || 'N/A'}
                    </td>
                  ))}
                  {Array.from({ length: 3 - schools.length }).map((_, i) => <td key={i} className="p-4 border-l border-slate-100" />)}
                </tr>

                {/* Total Students */}
                <tr>
                  <td className="p-4 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">Total Students</td>
                  {schools.map(s => (
                    <td key={s.id} className="p-4 border-l border-slate-100 text-slate-700">
                      {s.totalStudents || 'N/A'}
                    </td>
                  ))}
                  {Array.from({ length: 3 - schools.length }).map((_, i) => <td key={i} className="p-4 border-l border-slate-100" />)}
                </tr>

                {/* Fee Range */}
                <tr>
                  <td className="p-4 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">Annual Fee Range</td>
                  {schools.map((s) => {
                    const min = getMinFee(s)
                    const max = getMaxFee(s)
                    const isLowest = min !== null && min === lowestFee
                    return (
                      <td key={s.id} className={`p-4 border-l border-slate-100 text-slate-700 ${isLowest ? 'bg-emerald-50/40 text-emerald-800' : ''}`}>
                        {min !== null && max !== null ? `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}` : 'N/A'}
                        {isLowest && <span className="block text-[8px] font-black uppercase text-emerald-600 tracking-wider mt-0.5">💰 Best Value</span>}
                      </td>
                    )
                  })}
                  {Array.from({ length: 3 - schools.length }).map((_, i) => <td key={i} className="p-4 border-l border-slate-100" />)}
                </tr>

                {/* Admission Status */}
                <tr>
                  <td className="p-4 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">Admission Status</td>
                  {schools.map(s => (
                    <td key={s.id} className={`p-4 border-l border-slate-100 ${s.admissionOpen ? 'bg-emerald-50/40 text-emerald-800' : 'text-slate-500'}`}>
                      <div className="flex items-center gap-1">
                        {s.admissionOpen ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>Admissions Open</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 text-red-500" />
                            <span>Admissions Closed</span>
                          </>
                        )}
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: 3 - schools.length }).map((_, i) => <td key={i} className="p-4 border-l border-slate-100" />)}
                </tr>

                {/* Rating */}
                <tr>
                  <td className="p-4 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">Rating</td>
                  {schools.map((s) => {
                    const isHighest = s.avgRating > 0 && s.avgRating === bestRating
                    return (
                      <td key={s.id} className={`p-4 border-l border-slate-100 text-slate-700 ${isHighest ? 'bg-emerald-50/40 text-emerald-800' : ''}`}>
                        {s.avgRating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-current text-amber-500 shrink-0" />
                            <span>{s.avgRating.toFixed(1)} ({s.reviewCount} reviews)</span>
                          </div>
                        ) : (
                          'No reviews yet'
                        )}
                        {isHighest && <span className="block text-[8px] font-black uppercase text-emerald-600 tracking-wider mt-0.5">⭐ Top Rated</span>}
                      </td>
                    )
                  })}
                  {Array.from({ length: 3 - schools.length }).map((_, i) => <td key={i} className="p-4 border-l border-slate-100" />)}
                </tr>

                {/* Facilities */}
                <tr>
                  <td className="p-4 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">Key Facilities</td>
                  {schools.map(s => (
                    <td key={s.id} className="p-4 border-l border-slate-100 text-slate-700">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {s.facilities && s.facilities.length > 0 ? (
                          s.facilities.slice(0, 8).map((fac, idx) => (
                            <Badge key={idx} variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 text-[8px] font-bold px-1.5 py-0.5 rounded capitalize">
                              {fac.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: 3 - schools.length }).map((_, i) => <td key={i} className="p-4 border-l border-slate-100" />)}
                </tr>

                {/* Distance */}
                <tr>
                  <td className="p-4 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">Distance from you</td>
                  {schools.map((s) => {
                    const dist = calculateDistance(s.locations?.[0]?.latitude, s.locations?.[0]?.longitude)
                    const isShortest = dist !== null && dist === shortestDistance
                    return (
                      <td key={s.id} className={`p-4 border-l border-slate-100 text-slate-700 ${isShortest ? 'bg-emerald-50/40 text-emerald-800' : ''}`}>
                        {dist !== null ? `${dist} km away` : 'N/A'}
                        {isShortest && <span className="block text-[8px] font-black uppercase text-emerald-600 tracking-wider mt-0.5">📍 Closest</span>}
                      </td>
                    )
                  })}
                  {Array.from({ length: 3 - schools.length }).map((_, i) => <td key={i} className="p-4 border-l border-slate-100" />)}
                </tr>

                {/* Bottom Actions Row */}
                <tr className="bg-slate-50/20">
                  <td className="p-4 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">Actions</td>
                  {schools.map((school) => (
                    <td key={school.id} className="p-4 border-l border-slate-100">
                      <div className="flex flex-col gap-2 max-w-[180px]">
                        <Button
                          type="button"
                          onClick={() => handleEnquiry(school.id)}
                          className="bg-[#1565D8] hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider py-2 rounded-xl h-auto flex items-center justify-center gap-1 shadow-sm border border-transparent cursor-pointer"
                        >
                          Send Enquiry <ArrowRight className="w-3 h-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.push(`/schools/${school.slug}`)}
                          className="border-slate-200 text-slate-755 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider py-2 rounded-xl h-auto cursor-pointer"
                        >
                          View Profile
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleRemove(school.slug)}
                          className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-wider mt-1 text-center cursor-pointer"
                        >
                          Remove School
                        </button>
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: 3 - schools.length }).map((_, i) => <td key={i} className="p-4 border-l border-slate-100" />)}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

export default function CompareSchoolsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Comparing Schools...</p>
        </div>
      </div>
    }>
      <CompareSchoolsContent />
    </Suspense>
  )
}
