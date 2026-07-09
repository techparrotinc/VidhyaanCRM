"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Check,
  X,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Building,
  School,
  Phone,
  User,
  Compass,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SchoolData {
  id: string
  name: string
  slug: string
  institutionType: string
  verificationStatus: 'UNCLAIMED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  isVerified: boolean
  isPublished: boolean
  verifiedAt: string | null
  rejectionReason: string | null
  createdAt: string
  organization: {
    id: string
    name: string
    email: string
    phone: string
  } | null
  contacts: Array<{
    id: string
    type: string
    value: string
    isPrimary: boolean
  }>
  locations: Array<{
    id: string
    city: string
    state: string
    isPrimary: boolean
  }>
  documents?: Array<{
    documentUrl: string
    createdAt: string
  }>
}

export default function SchoolVerificationsPage() {
  const [schools, setSchools] = useState<SchoolData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL'>('PENDING')
  
  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  // Modal states
  const [actionSchool, setActionSchool] = useState<SchoolData | null>(null)
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const fetchSchools = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())
      
      if (activeTab !== 'ALL') {
        queryParams.append('status', activeTab)
      }
      if (search.trim()) {
        queryParams.append('search', search)
      }

      // Fetch pending from pending endpoint to include claim documents if on pending tab
      const endpoint = activeTab === 'PENDING' 
        ? `/api/admin/schools/pending?${queryParams.toString()}`
        : `/api/admin/schools?${queryParams.toString()}`

      const res = await fetch(endpoint)
      if (!res.ok) throw new Error('Failed to fetch school listings')
      const json = await res.json()
      setSchools(json.data ?? [])
      setTotal(json.pagination?.total ?? 0)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error loading schools')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchSchools()
  }, [activeTab])

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1)
      fetchSchools()
    }, 450)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const handleApprove = async () => {
    if (!actionSchool) return
    try {
      const res = await fetch(`/api/admin/schools/${actionSchool.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!res.ok) throw new Error('Failed to approve school')
      
      setApproveConfirmOpen(false)
      setActionSchool(null)
      alert(`School listing "${actionSchool.name}" approved successfully and is now live!`)
      await fetchSchools()
    } catch (err: any) {
      alert(err.message || 'Approval failed')
    }
  }

  const handleReject = async () => {
    if (!actionSchool || !rejectionReason.trim()) return
    try {
      const res = await fetch(`/api/admin/schools/${actionSchool.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      })

      if (!res.ok) throw new Error('Failed to reject school')

      setRejectModalOpen(false)
      setActionSchool(null)
      setRejectionReason('')
      alert(`School listing "${actionSchool.name}" verification rejected.`)
      await fetchSchools()
    } catch (err: any) {
      alert(err.message || 'Rejection failed')
    }
  }

  const getPrimaryCityState = (school: SchoolData) => {
    const primary = school.locations?.find(l => l.isPrimary) || school.locations?.[0]
    if (!primary) return 'Unknown Location'
    return `${primary.city}, ${primary.state || ''}`
  }

  const getTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  return (
    <div className="p-6 md:p-8 space-y-6 select-none bg-slate-50 min-h-screen">
      {/* Approve Confirmation Modal */}
      {approveConfirmOpen && actionSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="p-6 max-w-md w-full bg-white space-y-4 shadow-2xl border-slate-200 animate-scale-in">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Approve {actionSchool.name}?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This will:
            </p>
            <ul className="text-xs text-slate-650 space-y-1.5 pl-4 list-disc font-medium">
              <li>Set verification status to <span className="font-bold text-slate-900">VERIFIED</span></li>
              <li>Publish the marketplace profile immediately</li>
              <li>Activate school administrator CRM access</li>
              <li>Send automated confirmation email notification</li>
            </ul>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button onClick={() => { setApproveConfirmOpen(false); setActionSchool(null); }} className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold px-4 py-2 text-xs">
                Cancel
              </Button>
              <Button onClick={handleApprove} className="bg-green-600 text-white hover:bg-green-700 font-bold px-4 py-2 text-xs">
                Confirm Approve
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && actionSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="p-6 max-w-md w-full bg-white space-y-4 shadow-2xl border-slate-200 animate-scale-in">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Reject {actionSchool.name}</h3>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reason for Rejection (Required)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify verification issue..."
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 outline-hidden focus:border-blue-500 h-24 resize-none leading-relaxed"
              />

              {/* Quick Select Common Reasons */}
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Quick Select Reasons</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Insufficient Documents', 'Duplicate Listing', 'Invalid Information'].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectionReason(reason)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded-md text-slate-700 transition"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button onClick={() => { setRejectModalOpen(false); setActionSchool(null); setRejectionReason(''); }} className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold px-4 py-2 text-xs">
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="bg-red-600 text-white hover:bg-red-700 font-bold px-4 py-2 text-xs disabled:opacity-40"
              >
                Confirm Rejection
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Institution Listings</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage claims and verify school &amp; learning-centre listings for marketplace placement</p>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs self-start">
          <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        {(['PENDING', 'VERIFIED', 'REJECTED', 'ALL'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`pb-3 text-xs font-bold transition border-b-2 -mb-[2px] ${
              activeTab === tab 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Main Content list/table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center p-6 text-center bg-white border border-slate-200 rounded-xl shadow-sm text-red-500">
          <XCircle className="w-8 h-8 mb-2" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      ) : schools.length === 0 ? (
        <div className="flex flex-col h-64 items-center justify-center text-center p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <School className="w-10 h-10 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No Listings Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">No institution listings match your current selection.</p>
        </div>
      ) : activeTab === 'PENDING' ? (
        // Pending Verification Cards List
        <div className="grid grid-cols-1 gap-5">
          {schools.map((school) => (
            <Card key={school.id} className="p-5 bg-white border-slate-200 shadow-sm hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0 text-base border border-blue-100">
                  {school.name[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{school.name}</h4>
                  <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                    {getPrimaryCityState(school)} • {school.institutionType.replace('_', ' ')}
                  </div>
                  
                  {/* Submitter Admin details */}
                  {school.organization && (
                    <div className="mt-3.5 space-y-1 text-xs font-semibold text-slate-550 border-t border-slate-100 pt-2 flex flex-col sm:flex-row sm:gap-4 sm:space-y-0">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> Admin: {school.organization.name}</span>
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {school.organization.phone || 'No phone'}</span>
                    </div>
                  )}

                  {/* Documents urls */}
                  {school.documents && school.documents.length > 0 && (
                    <div className="mt-2 text-xs font-bold text-blue-650 flex items-center gap-2">
                      <span>Verification Document:</span>
                      {school.documents.map((doc, idx) => (
                        <Link key={idx} href={doc.documentUrl} target="_blank" className="hover:underline flex items-center gap-0.5 border border-blue-150 px-2 py-0.5 rounded-md bg-blue-50/50">
                          Doc {idx + 1} <ExternalLink className="w-3 h-3" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <Button
                  onClick={() => { setActionSchool(school); setApproveConfirmOpen(true); }}
                  className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 px-4 shadow-sm"
                >
                  ✓ Approve
                </Button>
                <Button
                  onClick={() => { setActionSchool(school); setRejectModalOpen(true); }}
                  className="flex-1 md:flex-none bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold text-xs py-2 px-4 shadow-sm"
                >
                  ✗ Reject
                </Button>
                <Link href={`/admin/orgs/${school.organization?.id || ''}`} className="text-xs font-bold text-blue-600 hover:underline pl-2.5">
                  View Details
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // List table for Verified, Rejected, All
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                <th className="py-3 px-6">Listing Name</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Status</th>
                {activeTab === 'REJECTED' ? <th className="py-3 px-4">Rejection Reason</th> : <th className="py-3 px-4">Verified Date</th>}
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map((school) => (
                <tr key={school.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-6 font-bold text-slate-900">{school.name}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-650">{getPrimaryCityState(school).split(',')[0]}</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      school.verificationStatus === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {school.verificationStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-500">
                    {activeTab === 'REJECTED' 
                      ? school.rejectionReason || 'No details specified'
                      : (school.verifiedAt ? new Date(school.verifiedAt).toLocaleDateString() : 'N/A')}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <Link href={`/admin/orgs/${school.organization?.id || ''}`} className="text-xs font-bold text-blue-600 hover:underline">
                      View Org
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
