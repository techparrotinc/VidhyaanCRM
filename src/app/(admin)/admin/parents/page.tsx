"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Users,
  Search,
  Loader2,
  AlertTriangle,
  Mail,
  Phone,
  Compass,
  MapPin,
  Calendar,
  XCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  UserX,
  Trash2,
  Bookmark,
  MessageSquare
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Parent {
  id: string
  name: string | null
  email: string | null
  phone: string
  city: string | null
  createdAt: string
  _count: {
    enquiries: number
    bookmarks: number
  }
}

export default function AdminParentsPage() {
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  const [parents, setParents] = useState<Parent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  // GDPR Erasure Modal States
  const [erasureParent, setErasureParent] = useState<Parent | null>(null)
  const [erasureReason, setErasureReason] = useState('')
  const [erasureConfirmText, setErasureConfirmText] = useState('')
  const [erasureModalOpen, setErasureModalOpen] = useState(false)

  const fetchParents = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())
      if (search.trim()) queryParams.append('search', search)
      if (cityFilter.trim()) queryParams.append('city', cityFilter)
      if (startDate) queryParams.append('startDate', startDate)
      if (endDate) queryParams.append('endDate', endDate)

      const res = await fetch(`/api/admin/parents?${queryParams.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch parent profiles')
      const json = await res.json()
      setParents(json.data ?? [])
      setTotal(json.pagination?.total ?? 0)
      setTotalPages(json.pagination?.totalPages ?? 1)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error fetching parents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [startDate, endDate])

  useEffect(() => {
    fetchParents()
  }, [page, cityFilter, startDate, endDate])

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1)
      fetchParents()
    }, 450)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const handleDeactivate = async (id: string, currentlyActive: boolean) => {
    try {
      const action = currentlyActive ? 'deactivate' : 'reactivate'
      const res = await fetch(`/api/admin/parents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!res.ok) throw new Error(`Failed to ${action} parent account`)
      alert(`Parent account ${action}d successfully.`)
      await fetchParents()
    } catch (err: any) {
      alert(err.message || 'Action failed')
    }
  }

  const handleProcessErasure = async () => {
    if (!erasureParent || !erasureReason.trim()) return
    try {
      const res = await fetch(`/api/admin/parents/${erasureParent.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: erasureReason })
      })

      if (!res.ok) throw new Error('Erasure request failed')

      setErasureModalOpen(false)
      setErasureParent(null)
      setErasureReason('')
      setErasureConfirmText('')
      alert('GDPR/DPDP erasure processed. Identifying data completely anonymized.')
      await fetchParents()
    } catch (err: any) {
      alert(err.message || 'Erasure request failed')
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 select-none bg-slate-50 min-h-screen font-sans">
      {/* GDPR / DPDP Deletion Erasure Modal */}
      {erasureModalOpen && erasureParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="p-6 max-w-md w-full bg-white space-y-4 shadow-2xl border-slate-200 animate-scale-in">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-8 h-8" />
              <h3 className="text-base font-black tracking-tight">Process Erasure Request (DPDP/GDPR)</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              This is a compliance erasure request. All personal identifiers (name, email, phone, city) for <span className="font-bold text-slate-900">{erasureParent.name || erasureParent.phone}</span> will be permanently deleted or anonymized. This action is irreversible.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase block mb-1">Reason for Erasure</label>
                <textarea
                  value={erasureReason}
                  onChange={(e) => setErasureReason(e.target.value)}
                  placeholder="Specify GDPR/DPDP request details..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-700 outline-hidden focus:border-blue-500 h-16 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 uppercase block mb-1">
                  Type <span className="font-mono text-red-650 bg-red-50 px-1 rounded-sm">ERASE</span> to confirm
                </label>
                <input
                  type="text"
                  value={erasureConfirmText}
                  onChange={(e) => setErasureConfirmText(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold outline-hidden focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button onClick={() => { setErasureModalOpen(false); setErasureParent(null); setErasureConfirmText(''); }} className="bg-slate-100 text-slate-750 hover:bg-slate-200 font-semibold px-4 py-2 text-xs">
                Cancel
              </Button>
              <Button
                onClick={handleProcessErasure}
                disabled={erasureConfirmText !== 'ERASE' || !erasureReason.trim()}
                className="bg-red-600 text-white hover:bg-red-700 font-bold px-4 py-2 text-xs disabled:opacity-40 shadow-md shadow-red-500/10"
              >
                Anonymize Data
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Parent Registry</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-150">
            {total} Accounts
          </span>
        </div>

        {/* Filter inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full sm:w-56 rounded-lg border border-slate-200 py-1.5 pl-9 pr-4 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <MapPin className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Filter by city..."
              className="w-full sm:w-40 rounded-lg border border-slate-200 py-1.5 pl-9 pr-4 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg px-2.5 py-1 text-slate-650 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Joined:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs font-semibold text-slate-700 outline-hidden focus:text-blue-600 bg-transparent border-0 p-0"
              title="Joined date from"
            />
            <span className="text-[10px] font-bold text-slate-400 uppercase">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs font-semibold text-slate-700 outline-hidden focus:text-blue-600 bg-transparent border-0 p-0"
              title="Joined date to"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-[10px] font-bold text-slate-400 hover:text-red-500"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center p-6 text-center bg-white border border-slate-200 rounded-xl shadow-sm text-red-500">
          <AlertTriangle className="w-8 h-8 mb-2" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      ) : parents.length === 0 ? (
        <div className="flex flex-col h-64 items-center justify-center text-center p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Users className="w-10 h-10 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No Parent Accounts Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">No parent registrations match your query.</p>
        </div>
      ) : (
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Enquiries</th>
                  <th className="py-3 px-4">Bookmarks</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {parents.map((parent) => (
                  <tr key={parent.id} className="hover:bg-slate-50/30 transition">
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {parent.name || 'Anonymous Parent'}
                    </td>
                    <td className="py-3.5 px-4 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {parent.phone}</div>
                      {parent.email && (
                        <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {parent.email}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-650">
                      <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {parent.city || 'Not Specified'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 text-xs">
                      <div className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-slate-400" /> {parent._count.enquiries}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 text-xs">
                      <div className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5 text-slate-400" /> {parent._count.bookmarks}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-450 font-bold">
                      {new Date(parent.createdAt).toLocaleDateString()}
                    </td>
                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => handleDeactivate(parent.id, true)}
                        className="text-[10px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded-lg transition"
                      >
                        Deactivate
                      </button>
                      
                      {isSuperAdmin && (
                        <button
                          onClick={() => { setErasureParent(parent); setErasureModalOpen(true); }}
                          className="text-[10px] font-bold bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-2 py-1 rounded-lg transition"
                        >
                          Process Erasure
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-450">Showing {parents.length} entries</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
