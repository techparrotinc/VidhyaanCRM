"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  ChevronDown,
  Building2,
  CheckCircle,
  Clock,
  Ban,
  ShieldAlert,
  Loader2,
  MoreVertical,
  Activity,
  UserCheck,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Organization {
  id: string
  name: string
  slug: string
  institutionType: string
  email: string
  phone: string
  status: string
  createdAt: string
  trialEndsAt: string | null
  plan: {
    name: string
    slug: string
  } | null
  _count: {
    users: number
    leads: number
  }
}

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search & Filter State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const fetchOrgs = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (search.trim()) queryParams.append('search', search)
      if (statusFilter !== 'ALL') {
        const mappedStatus = statusFilter === 'PENDING' ? 'PENDING_VERIFICATION' : statusFilter
        queryParams.append('status', mappedStatus)
      }

      const res = await fetch(`/api/admin/organizations?${queryParams.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch organizations')
      const json = await res.json()
      setOrgs(json.data ?? [])
    } catch (err: any) {
      setError(err.message || 'Error fetching organizations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgs()
  }, [statusFilter])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrgs()
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  useEffect(() => {
    const closeMenu = () => setActiveMenuId(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/organizations/${id}/approve`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed to approve organization')
      alert('Organization approved successfully')
      await fetchOrgs()
    } catch (err: any) {
      alert(err.message || 'Could not approve organization')
    }
  }

  const handleExtendTrial = async (orgItem: Organization) => {
    try {
      const currentEnd = orgItem.trialEndsAt ? new Date(orgItem.trialEndsAt) : new Date()
      currentEnd.setDate(currentEnd.getDate() + 7)

      const res = await fetch(`/api/admin/organizations/${orgItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialEndsAt: currentEnd.toISOString() })
      })

      if (!res.ok) throw new Error('Failed to extend trial')
      alert('Trial extended by 7 days')
      await fetchOrgs()
    } catch (err: any) {
      alert(err.message || 'Could not extend trial')
    }
  }

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this organization?')) return

    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUSPENDED' })
      })

      if (!res.ok) throw new Error('Failed to suspend organization')
      alert('Organization suspended')
      await fetchOrgs()
    } catch (err: any) {
      alert(err.message || 'Could not suspend organization')
    }
  }

  const handleImpersonate = (name: string) => {
    alert(`Impersonating Admin session for "${name}" (development session started)`)
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800'
      case 'PENDING_VERIFICATION':
        return 'bg-amber-100 text-amber-800'
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6 select-none font-sans antialiased text-slate-800 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            Manage Organizations
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse, approve listing verification, extend trial sessions, and toggle premium access.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 w-full sm:w-80 shadow-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-400 w-full"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {['ALL', 'ACTIVE', 'TRIAL', 'PENDING', 'SUSPENDED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition cursor-pointer shrink-0 ${
                statusFilter === status
                  ? 'bg-[#1565D8] border-[#1565D8] text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List Table */}
      {loading && orgs.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#1565D8]" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">
          <p>{error}</p>
          <Button onClick={fetchOrgs} className="mt-4 bg-[#1565D8] text-white">Retry</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 pl-4">Organization Name</th>
                  <th className="py-3.5">Institution Type</th>
                  <th className="py-3.5">Billing Plan</th>
                  <th className="py-3.5 text-center">Users</th>
                  <th className="py-3.5 text-center">Leads</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5">Created Date</th>
                  <th className="py-3.5 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 pl-4 font-semibold text-slate-800">
                      <div>{org.name}</div>
                      <div className="text-xs text-slate-400 font-normal mt-0.5">{org.email}</div>
                    </td>
                    <td className="py-4 text-xs text-slate-500 font-semibold uppercase">{org.institutionType}</td>
                    <td className="py-4">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                        {org.plan?.name ?? 'Free'}
                      </span>
                    </td>
                    <td className="py-4 text-center font-semibold text-slate-700">{org._count.users}</td>
                    <td className="py-4 text-center font-semibold text-slate-700">{org._count.leads}</td>
                    <td className="py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${getStatusBadgeStyle(org.status)}`}>
                        {org.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-slate-400 font-medium">
                      {new Date(org.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 pr-4 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenuId(activeMenuId === org.id ? null : org.id)
                        }}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Options */}
                      {activeMenuId === org.id && (
                        <div className="absolute right-4 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 text-left text-xs font-semibold animate-fade-in">
                          <Link href={`/admin/orgs/${org.id}`} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">
                            View Details
                          </Link>

                          {org.status === 'PENDING_VERIFICATION' && (
                            <button
                              onClick={() => handleApprove(org.id)}
                              className="w-full text-left px-4 py-2 text-green-700 hover:bg-green-50 border-t border-slate-100"
                            >
                              Approve Listing
                            </button>
                          )}

                          <button
                            onClick={() => handleExtendTrial(org)}
                            className="w-full text-left px-4 py-2 text-blue-700 hover:bg-blue-50 border-t border-slate-100"
                          >
                            Extend Trial (+7 days)
                          </button>

                          {org.status !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleSuspend(org.id)}
                              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                            >
                              Suspend Account
                            </button>
                          )}

                          <button
                            onClick={() => handleImpersonate(org.name)}
                            className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                          >
                            Impersonate Admin
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
