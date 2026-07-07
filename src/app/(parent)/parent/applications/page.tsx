'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FileText, 
  MapPin, 
  ChevronRight, 
  Send, 
  Trash2, 
  Building, 
  Clock, 
  Calendar,
  Loader2,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getGradeLabel } from '@/constants/grades'

interface Enquiry {
  id: string
  createdAt: string
  status: string
  gradeSought: string
  lastUpdated: string
  message: string | null
  lastFollowUpAt?: string | null
}

interface School {
  id: string
  name: string
  slug: string
  logo: string | null
  city: string
  board: string
}

interface GroupedApplication {
  school: School
  enquiries: Enquiry[]
  latestStatus: string
}

export default function ParentApplicationsPage() {
  const [applications, setApplications] = useState<GroupedApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'RESPONDED' | 'SCHEDULED'>('ALL')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/parent/applications')
      if (!res.ok) throw new Error('Failed to retrieve applications')
      const json = await res.json()
      if (json.success && json.data) {
        setApplications(json.data)
      } else {
        throw new Error(json.error || 'Failed to load applications')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error occurred while loading enquiries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const triggerToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => {
      setToastMsg(prev => prev === msg ? null : prev)
    }, 3000)
  }

  const handleFollowUp = async (enquiryId: string, schoolName: string) => {
    try {
      const res = await fetch(`/api/v1/parent/applications/${enquiryId}/followup`, {
        method: 'POST'
      })
      const json = await res.json()
      if (res.ok && json.success) {
        triggerToast(`Follow-up notification sent to ${schoolName}`)
        fetchApplications()
      } else {
        triggerToast(json.error || 'Failed to send follow-up')
      }
    } catch (err) {
      console.error(err)
      triggerToast('Failed to send follow-up request')
    }
  }

  const checkFollowUpDisabled = (enquiry: Enquiry) => {
    // 1. Initial 3 days check from creation
    const diffTime = Math.abs(new Date().getTime() - new Date(enquiry.createdAt).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays <= 3) return true

    // 2. 24 hour check from last follow-up
    if (enquiry.lastFollowUpAt) {
      const msSinceLast = new Date().getTime() - new Date(enquiry.lastFollowUpAt).getTime()
      const hoursSinceLast = msSinceLast / (1000 * 60 * 60)
      if (hoursSinceLast < 24) return true
    }

    return false
  }

  const handleWithdraw = (schoolName: string) => {
    if (confirm(`Are you sure you want to withdraw your enquiry for ${schoolName}?`)) {
      // In production, we'd call a DELETE /api/v1/parent/applications/[id] endpoint.
      // Here we handle it via client state to confirm responsiveness.
      triggerToast(`Enquiry for ${schoolName} withdrawn successfully`)
      setApplications(prev => prev.filter(app => app.school.name !== schoolName))
    }
  }

  // Filtering Logic
  const filteredApps = applications.filter((app) => {
    if (activeTab === 'ALL') return true
    if (activeTab === 'PENDING') return app.latestStatus === 'PENDING'
    if (activeTab === 'RESPONDED') return app.latestStatus === 'RESPONDED'
    if (activeTab === 'SCHEDULED') return app.latestStatus === 'SCHEDULED' || app.latestStatus === 'ADMITTED'
    return true
  })

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Awaiting Response',
          color: 'bg-amber-50 text-amber-700 border-amber-200'
        }
      case 'RESPONDED':
        return {
          label: 'Responded',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }
      case 'SCHEDULED':
        return {
          label: 'Visit Scheduled',
          color: 'bg-blue-50 text-blue-700 border-blue-200'
        }
      case 'ADMITTED':
        return {
          label: 'Admitted',
          color: 'bg-green-50 text-green-700 border-green-200'
        }
      case 'NOT_SELECTED':
        return {
          label: 'Closed',
          color: 'bg-slate-50 text-slate-650 border-slate-200'
        }
      default:
        return {
          label: status,
          color: 'bg-slate-50 text-slate-600 border-slate-200'
        }
    }
  }

  const getGradientByInitial = (name: string) => {
    const initial = name[0]?.toUpperCase() || 'A'
    if ('ABCD'.includes(initial)) return 'from-blue-500 to-indigo-700'
    if ('EFGH'.includes(initial)) return 'from-purple-500 to-pink-700'
    if ('IJKL'.includes(initial)) return 'from-teal-500 to-emerald-700'
    if ('MNOP'.includes(initial)) return 'from-orange-500 to-red-600'
    if ('QRST'.includes(initial)) return 'from-green-500 to-teal-700'
    return 'from-rose-500 to-red-700'
  }

  const checkOlderThan3Days = (dateStr: string) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(dateStr).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 3
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Enquiries...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
          <Clock className="w-12 h-12 text-red-500 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
          <Button onClick={fetchApplications} className="mt-6 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl h-auto">
            Retry Loading
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1565D8]" /> My Applications
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-1">
            {applications.length} school enquiries submitted
          </p>
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

      {/* 2. FILTER TABS */}
      <div className="flex gap-2 border-b border-slate-200 pb-px text-xs font-bold text-slate-500">
        {(['ALL', 'PENDING', 'RESPONDED', 'SCHEDULED'] as const).map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-all cursor-pointer capitalize ${
                isActive 
                  ? 'border-[#1565D8] text-[#1565D8] font-black' 
                  : 'border-transparent hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.toLowerCase()}
            </button>
          )
        })}
      </div>

      {/* 3. TAB CONTENT AREA */}
      <div className="space-y-6">
        {filteredApps.length > 0 ? (
          filteredApps.map((app) => {
            const latestEnquiry = app.enquiries[0]
            const statusInfo = getStatusDisplay(app.latestStatus)
            const initials = app.school.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
            const appliedDate = new Date(latestEnquiry.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })

            // Calculate progress dots
            const isViewed = ['RESPONDED', 'SCHEDULED', 'ADMITTED', 'NOT_SELECTED'].includes(app.latestStatus)
            const isResponded = ['RESPONDED', 'SCHEDULED', 'ADMITTED'].includes(app.latestStatus)
            const isScheduled = ['SCHEDULED', 'ADMITTED'].includes(app.latestStatus)

            const dots = [
              { label: 'Enquiry Sent', active: true },
              { label: 'School Viewed', active: isViewed },
              { label: 'Response Received', active: isResponded },
              { label: 'Next Steps', active: isScheduled }
            ]

            return (
              <Card key={app.school.id} className="bg-white border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow transition duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* LEFT: School Info (4 Cols) */}
                  <div className="lg:col-span-4 flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradientByInitial(app.school.name)} text-white font-black text-base flex items-center justify-center shrink-0 shadow-inner`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-800 tracking-tight leading-snug">
                        {app.school.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className="bg-blue-50 text-[#1565D8] border border-blue-100 font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase">
                          {app.school.board}
                        </Badge>
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400 font-semibold">
                          <MapPin className="w-3 h-3 text-slate-400" /> {app.school.city}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-slate-500 font-bold">
                          Applied for: <span className="text-slate-800">{getGradeLabel(latestEnquiry.gradeSought)}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> Applied on {appliedDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CENTER: Status Timeline (5 Cols) */}
                  <div className="lg:col-span-5 flex flex-col items-center lg:items-start justify-center px-2 py-4 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-100">
                    <div className="w-full max-w-sm">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-4 text-center lg:text-left">
                        Application Progress
                      </span>
                      
                      <div className="relative flex justify-between items-center w-full">
                        {/* Connecting Line */}
                        <div className="absolute left-0 right-0 top-2 h-0.5 bg-slate-100 -z-10" />
                        
                        {dots.map((dot, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1.5 relative">
                            {/* Dot circle */}
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              dot.active 
                                ? 'bg-blue-600 border-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' 
                                : 'bg-white border-slate-200'
                            }`}>
                              {dot.active && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            {/* Label */}
                            <span className={`text-[9px] font-bold text-center absolute top-5 w-20 leading-tight ${
                              dot.active ? 'text-slate-800' : 'text-slate-400 font-semibold'
                            }`}>
                              {dot.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Actions (3 Cols) */}
                  <div className="lg:col-span-3 flex flex-col items-stretch justify-center gap-3">
                    <div className="text-center lg:text-right">
                      <Badge className={`text-xs font-black px-3.5 py-1 rounded-full border uppercase tracking-wider ${statusInfo.color}`}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      <Link href={`/schools/${app.school.slug}`} className="w-full">
                        <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs py-2 rounded-xl h-auto flex items-center justify-center gap-1 shadow-sm">
                          View School <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>

                      {app.latestStatus === 'PENDING' && (
                        <>
                          <Button
                            onClick={() => handleFollowUp(latestEnquiry.id, app.school.name)}
                            disabled={checkFollowUpDisabled(latestEnquiry)}
                            className="bg-[#1565D8] hover:bg-blue-700 disabled:bg-blue-200 text-white font-bold text-xs py-2 rounded-xl h-auto flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Send className="w-3 h-3" /> Send Follow-up
                          </Button>

                          <button
                            onClick={() => handleWithdraw(app.school.name)}
                            className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center justify-center gap-1 mt-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Withdraw Enquiry
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </Card>
            )
          })
        ) : (
          <Card className="bg-white border-slate-200 p-12 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <Building className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">No applications yet</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
              Start by searching for schools and sending enquiries to see them tracked here dynamically.
            </p>
            <Link href="/schools" className="mt-6">
              <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-full h-auto shadow-md">
                Find Schools
              </Button>
            </Link>
          </Card>
        )}
      </div>

    </div>
  )
}
