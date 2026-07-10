'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Search, Loader2, ArrowRight, MapPin, Building, Award } from 'lucide-react'

interface SchoolResult {
  id: string
  name: string
  slug: string
  institutionType: string
  schoolType?: string
  verificationStatus: 'UNCLAIMED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  isClaimed: boolean
  locations: Array<{
    address: string
    city: string
  }>
  affiliations: Array<{
    board: string
  }>
}

export default function ClaimProfilePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState<SchoolResult[]>([])
  const [error, setError] = useState<string | null>(null)

  // Debounced instant search logic
  useEffect(() => {
    const trimmedQuery = query.trim()
    if (trimmedQuery.length < 2) {
      setResults([])
      setSearched(false)
      return
    }

    const delayDebounce = setTimeout(async () => {
      setError(null)
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('search', trimmedQuery)
        if (city) params.append('city', city)
        params.append('limit', '10')
        // Allow querying unclaimed institutions
        params.append('claim', 'true')

        const res = await fetch(`/api/public/schools?${params.toString()}`)
        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch institutions')
        }

        setResults(data.data || [])
        setSearched(true)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(delayDebounce)
  }, [query, city])

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmedQuery = query.trim()
    if (trimmedQuery.length < 2) {
      setError('Please enter at least 2 characters to search')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.append('search', trimmedQuery)
      if (city) params.append('city', city)
      params.append('limit', '10')
      params.append('claim', 'true')

      const res = await fetch(`/api/public/schools?${params.toString()}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch institutions')
      }

      setResults(data.data || [])
      setSearched(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNCLAIMED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            Available to Claim
          </span>
        )
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Already Claimed
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            Pending Verification
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        )
    }
  }

  const steps = [
    { number: 1, label: 'Find Institution' },
    { number: 2, label: 'Verify' },
    { number: 3, label: 'Create Account' },
    { number: 4, label: 'Verify Phone' }
  ]

  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] font-sans antialiased py-12 px-4">
      <div className="max-w-[720px] mx-auto">
        
        {/* Navigation & Progress bar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-full flex items-center justify-between mb-8">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-500 hover:text-[#1565D8] transition-colors flex items-center gap-1.5"
            >
              <span>←</span> Back to Home
            </Link>
            
            <div className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shadow-sm">
                <Shield className="text-[#1565D8] w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-800 tracking-tight">Vidhyaan</span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="w-full bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between max-w-[500px] mx-auto">
              {steps.map((s, idx) => (
                <div key={s.number} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      s.number === 1
                        ? 'bg-[#1565D8] text-white shadow-md shadow-[#1565D8]/20 ring-4 ring-blue-50'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {s.number}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      s.number === 1 ? 'text-[#1565D8]' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="h-0.5 bg-slate-100 flex-1 mx-2 -mt-5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Find Your Institution
            </h1>
            <p className="text-slate-500 mt-2 text-base max-w-[500px]">
              Search for your school or learning center on Vidhyaan to claim your profile.
            </p>
          </div>
        </div>

        {/* Search Panel */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your school or center name (min. 2 characters)..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-base"
                required
              />
            </div>

            <div className="w-full md:w-[180px]">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-all text-base appearance-none cursor-pointer"
              >
                <option value="">All Cities</option>
                <option value="Chennai">Chennai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="New Delhi">New Delhi</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
                <option value="Kolkata">Kolkata</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || query.trim().length < 2}
              className="px-6 py-3.5 bg-[#1565D8] hover:bg-[#1150ad] disabled:bg-[#1565D8]/50 text-white font-bold rounded-2xl shadow-md shadow-[#1565D8]/10 hover:shadow-lg hover:shadow-[#1565D8]/25 transition-all cursor-pointer disabled:cursor-not-allowed select-none text-base flex items-center justify-center gap-2 md:w-[130px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600 animate-fadeIn">
              {error}
            </div>
          )}

          {/* Search Results */}
          {searched && (
            <div className="mt-8 space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Search Results ({results.length})
              </h3>
              
              {results.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium">No institutions found matching your search</p>
                  <p className="text-slate-400 text-xs mt-1">Try expanding your search query or adjusting spellings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((school) => {
                    const location = school.locations[0]
                    const board = school.affiliations[0]?.board
                    const isUnclaimed = school.verificationStatus === 'UNCLAIMED'

                    return (
                      <div
                        key={school.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isUnclaimed
                            ? 'border-slate-100 bg-white hover:border-[#1565D8] hover:shadow-md'
                            : 'border-slate-100 bg-slate-50/50'
                        }`}
                      >
                        <div className="space-y-2 max-w-[75%]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-800 text-base md:text-lg">
                              {school.name}
                            </span>
                            {getStatusBadge(school.verificationStatus)}
                          </div>

                          <div className="flex flex-col gap-1 text-slate-500 text-sm">
                            {location && (
                              <div className="flex items-start gap-1">
                                <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                                <span>{[location.address, location.city].filter(Boolean).join(', ')}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="capitalize">{school.institutionType.toLowerCase().replace('_', ' ')}</span>
                              </div>
                              {board && (
                                <div className="flex items-center gap-1">
                                  <Award className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                  <span>{board}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {isUnclaimed ? (
                          <button
                            onClick={() => router.push(`/claim-profile/verify/${school.id}`)}
                            className="self-start md:self-auto px-4 py-2.5 bg-blue-50 text-[#1565D8] hover:bg-[#1565D8] hover:text-white font-bold rounded-xl text-sm transition-all flex items-center gap-1.5 cursor-pointer group"
                          >
                            <span>Claim This Institution</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <p className="self-start md:self-auto max-w-[220px] text-xs text-slate-400 leading-relaxed">
                            {school.verificationStatus === 'PENDING'
                              ? 'A claim for this profile is under review. If this is your institution, contact support@vidhyaan.com.'
                              : 'Already claimed by its owner. If this is your institution, contact support@vidhyaan.com.'}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Divider & Register Option */}
          {(searched || results.length > 0) && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-100 flex-1" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">OR</span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>

              <div className="bg-blue-50/40 rounded-2xl border border-blue-50/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-base">
                    Can't find your institution?
                  </h4>
                  <p className="text-slate-500 text-sm">
                    Register your institution on Vidhyaan for free to start managing your dashboard
                  </p>
                </div>
                <button
                  onClick={() => router.push('/register')}
                  className="px-5 py-2.5 bg-[#1565D8] hover:bg-[#1150ad] text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Register New Institution</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
