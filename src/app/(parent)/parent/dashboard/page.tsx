'use client'

import React, { useState, useEffect } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EnrolledDashboard, { type EnrolledData } from '@/components/parent/dashboard/EnrolledDashboard'
import DiscoveryDashboard, { type DiscoveryStats } from '@/components/parent/dashboard/DiscoveryDashboard'

interface SchoolData {
  id: string
  name: string
  slug: string
  media: { url: string }[]
  locations: { city: string; state: string }[]
  affiliations: { board: string }[]
}

interface EnquiryData {
  id: string
  createdAt: string
  status: string
  school: SchoolData
}

interface DashboardData extends EnrolledData {
  persona: 'ENROLLED' | 'DISCOVERY'
  parent: {
    name: string
    phone: string
    email: string | null
    city: string | null
  }
  stats: DiscoveryStats
  recentEnquiries: EnquiryData[]
  recommendedSchools: SchoolData[]
}

export default function ParentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/v1/parent/dashboard')
        if (!res.ok) {
          throw new Error('Failed to retrieve dashboard statistics')
        }
        const json = await res.json()
        if (json.success) {
          setData(json)
        } else {
          throw new Error(json.error || 'Failed to load dashboard data')
        }
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Error occurred while loading data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
          <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-slate-800">Dashboard Error</h2>
          <p className="text-sm text-slate-500 mt-2">{error || 'Could not load dashboard'}</p>
          <Button onClick={() => window.location.reload()} className="mt-6 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl h-auto">
            Reload Page
          </Button>
        </div>
      </div>
    )
  }

  const parentName = data.parent.name || 'Parent'
  const parentCity = data.parent.city || 'Chennai'

  return (
    <div className="animate-fade-in pb-12">
      {data.persona === 'ENROLLED' ? (
        <EnrolledDashboard data={data} parentName={parentName} />
      ) : (
        <DiscoveryDashboard
          parentName={parentName}
          parentCity={parentCity}
          stats={data.stats}
          recentEnquiries={data.recentEnquiries}
          recommendedSchools={data.recommendedSchools}
        />
      )}
    </div>
  )
}
