"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
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
  ArrowUp,
  ArrowDown,
  Plus,
  Filter,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight
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
    monthlyPrice: number
  } | null
  subscription: {
    status: string
    amount: number
  } | null
  school: {
    id: string
    name: string
    slug: string
  } | null
  _count: {
    users: number
    leads: number
    admissions: number
  }
}

export default function AdminOrgsPage() {
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  const [orgs, setOrgs] = useState<Organization[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination & Filter State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Modals/Actions State
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)
  const [impersonationToken, setImpersonationToken] = useState<string | null>(null)

  // Create Organization modal
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    schoolName: '',
    institutionType: 'SCHOOL',
    adminName: '',
    email: '',
    phone: '',
    role: 'Administrator',
  })

  // Seed filters from URL (?status=TRIAL, ?search=...) — used by dashboard cards + global search
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const s = sp.get('status')
    const q = sp.get('search')
    if (s) setStatusFilter(s)
    if (q) setSearch(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.schoolName.trim() || !createForm.adminName.trim() || !createForm.email.trim() || !createForm.phone.trim()) {
      alert('Institution name, admin name, email and phone are required')
      return
    }
    try {
      setCreating(true)
      // Reuse the tested self-signup flow: creates org + branch + academic year +
      // default admission stages + marketplace listing + admin user (sends welcome/OTP).
      const res = await fetch('/api/auth/school/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.adminName,
          phone: createForm.phone,
          email: createForm.email,
          role: createForm.role,
          schoolName: createForm.schoolName,
          institutionType: createForm.institutionType,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.success === false) {
        throw new Error(json.error || 'Failed to create organization')
      }
      setShowCreate(false)
      setCreateForm({ schoolName: '', institutionType: 'SCHOOL', adminName: '', email: '', phone: '', role: 'Administrator' })
      alert('Organization created. The admin has been sent a verification/welcome message to complete login.')
      setPage(1)
      await fetchOrgs()
    } catch (err: any) {
      alert(err.message || 'Failed to create organization')
    } finally {
      setCreating(false)
    }
  }

  const fetchOrgs = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())
      queryParams.append('sortBy', sortBy)
      queryParams.append('sortOrder', sortOrder)

      if (search.trim()) queryParams.append('search', search)
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter)
      if (planFilter !== 'ALL') queryParams.append('planId', planFilter)
      if (typeFilter !== 'ALL') queryParams.append('institutionType', typeFilter)

      const res = await fetch(`/api/admin/organizations?${queryParams.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch organizations')
      const json = await res.json()
      setOrgs(json.data ?? [])
      setTotal(json.pagination?.total ?? 0)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error fetching organizations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgs()
  }, [statusFilter, planFilter, typeFilter, page, limit, sortBy, sortOrder])

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1)
      fetchOrgs()
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  useEffect(() => {
    const closeMenu = () => setActiveMenuId(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const handleStatusChange = async (orgId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to update organization status')
      }
      await fetchOrgs()
    } catch (err: any) {
      alert(err.message || 'Could not update organization status')
    }
  }

  const handleImpersonate = async (orgId: string) => {
    try {
      // 1. Fetch organization details to get a target user ID
      const orgRes = await fetch(`/api/admin/organizations/${orgId}`)
      if (!orgRes.ok) throw new Error('Failed to fetch organization users')
      const orgData = await orgRes.json()
      const firstUser = orgData.organization?.users?.[0]

      if (!firstUser) {
        throw new Error('No user accounts exist in this organization')
      }

      // 2. Post impersonation request
      const impersonateRes = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, userId: firstUser.id })
      })

      if (!impersonateRes.ok) {
        const errJson = await impersonateRes.json()
        throw new Error(errJson.error || 'Impersonation failed')
      }

      const impData = await impersonateRes.json()
      setImpersonatingId(orgId)
      setImpersonationToken(impData.token)
    } catch (err: any) {
      alert(err.message || 'Failed to initiate impersonation')
    }
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Type', 'Email', 'Phone', 'Status', 'Plan', 'Leads', 'Joined']
    const rows = orgs.map(o => [
      o.id,
      o.name,
      o.institutionType,
      o.email,
      o.phone,
      o.status,
      o.plan?.name || 'Free',
      o._count.leads,
      new Date(o.createdAt).toLocaleDateString()
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `organizations_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'TRIAL':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'SUSPENDED':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getPlanStyle = (slug: string) => {
    switch (slug) {
      case 'free':
        return 'bg-slate-100 text-slate-650'
      case 'starter':
        return 'bg-blue-50 text-blue-700'
      case 'growth':
        return 'bg-emerald-50 text-emerald-700'
      case 'enterprise':
        return 'bg-purple-50 text-purple-700'
      default:
        return 'bg-slate-100 text-slate-750'
    }
  }

  const formatDaysLeft = (endsAtStr: string | null) => {
    if (!endsAtStr) return ''
    const ends = new Date(endsAtStr)
    const now = new Date()
    const diff = ends.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? ` (${days}d left)` : ' (Expired)'
  }

  return (
    <div className="p-6 md:p-8 space-y-6 select-none bg-slate-50 min-h-screen">
      {/* Create Organization Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="p-6 max-w-lg w-full bg-white space-y-4 shadow-2xl border-slate-200 animate-scale-in">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black tracking-tight text-slate-900">Add Organization</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed -mt-1">
              Creates a new institution with a 7-day trial, default pipeline and marketplace listing. The admin
              receives a verification/welcome message to complete login.
            </p>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Institution Name</label>
                <input
                  type="text"
                  value={createForm.schoolName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, schoolName: e.target.value }))}
                  placeholder="Greenfield Public School"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Institution Type</label>
                  <select
                    value={createForm.institutionType}
                    onChange={(e) => setCreateForm((f) => ({ ...f, institutionType: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
                  >
                    <option value="SCHOOL">School</option>
                    <option value="LEARNING_CENTER">Learning Center</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Admin Role</label>
                  <input
                    type="text"
                    value={createForm.role}
                    onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                    placeholder="Administrator"
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Admin Full Name</label>
                <input
                  type="text"
                  value={createForm.adminName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, adminName: e.target.value }))}
                  placeholder="Priya Sharma"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Admin Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="admin@institution.com"
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Admin Phone</label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <Button type="button" onClick={() => setShowCreate(false)} className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold px-4 py-2 text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50">
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Organization
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Impersonation Modal */}
      {impersonationToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="p-6 max-w-md w-full bg-white space-y-4 shadow-2xl border-slate-200 animate-scale-in">
            <div className="flex items-center gap-3 text-amber-600">
              <ShieldAlert className="w-8 h-8" />
              <h3 className="text-lg font-black tracking-tight">Impersonation Session Active</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Super Admin impersonation session generated. Use the special session token below to act as an administrator for the target organization.
            </p>
            <div className="p-3 bg-slate-100 rounded-lg text-xs font-mono break-all text-slate-700 border border-slate-200 select-all">
              {impersonationToken}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setImpersonationToken(null)} className="bg-slate-900 text-white hover:bg-slate-800 font-semibold px-4 py-2 text-xs">
                Acknowledge
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Organizations</h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-150">
            {total} Total
          </span>
        </div>
        <div className="flex items-center gap-3 self-start">
          <Button onClick={handleExportCSV} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold py-2 px-3.5 flex items-center gap-2 shadow-xs">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-md shadow-blue-500/10">
            <Plus className="w-4 h-4" /> Add Organization
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-white rounded-lg border border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500 transition duration-150"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Institution Type Dropdown */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-white rounded-lg border border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500 transition duration-150"
            >
              <option value="ALL">All Types</option>
              <option value="SCHOOL">School</option>
              <option value="LEARNING_CENTER">Learning Center</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Clear Filters */}
        {(search || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
          <Button
            onClick={() => { setSearch(''); setStatusFilter('ALL'); setTypeFilter('ALL'); setPage(1); }}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5"
          >
            Clear Filters
          </Button>
        )}
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-64 items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center p-6 text-center bg-white border border-slate-200 rounded-xl shadow-sm text-red-500">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col h-64 items-center justify-center text-center p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Building2 className="w-10 h-10 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No Organizations Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">No organizations matched your current filters. Try refining your parameters.</p>
        </div>
      ) : (
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                  <th className="py-3 px-4 pl-6 cursor-pointer" onClick={() => handleSort('name')}>
                    <span className="flex items-center gap-1">
                      Organization
                      {sortBy === 'name' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />) : null}
                    </span>
                  </th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('leads')}>
                    <span className="flex items-center gap-1">
                      Leads
                      {sortBy === 'leads' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />) : null}
                    </span>
                  </th>
                  <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('createdAt')}>
                    <span className="flex items-center gap-1">
                      Joined
                      {sortBy === 'createdAt' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />) : null}
                    </span>
                  </th>
                  <th className="py-3 px-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orgs.map((org, index) => {
                  const isMenuOpen = activeMenuId === org.id
                  const isTrial = org.status === 'TRIAL'
                  const displayPlan = org.plan?.name || 'Free'

                  return (
                    <tr key={org.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-slate-50/60 transition`}>
                      {/* Name */}
                      <td className="py-3.5 px-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                            {org.name[0].toUpperCase()}
                          </div>
                          <div>
                            <Link href={`/admin/orgs/${org.id}`} className="font-bold text-slate-900 hover:text-blue-600 hover:underline leading-none">
                              {org.name}
                            </Link>
                            <span className="text-[10px] text-slate-400 block mt-1">{org.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Institution Type */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-650">
                        <span className="capitalize">{org.institutionType.toLowerCase().replace('_', ' ')}</span>
                      </td>

                      {/* Plan Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getPlanStyle(org.plan?.slug || 'free')}`}>
                          {displayPlan}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusStyle(org.status)}`}>
                          {org.status}
                          {isTrial && formatDaysLeft(org.trialEndsAt)}
                        </span>
                      </td>

                      {/* Leads Count */}
                      <td className="py-3.5 px-4 font-bold text-slate-800 text-xs">
                        {org._count.leads}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-slate-400 font-semibold text-xs">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3.5 px-4 text-right pr-6 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenuId(isMenuOpen ? null : org.id)
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div
                            className="absolute right-6 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5 divide-y divide-slate-100 animate-slide-in-up"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              <Link
                                href={`/admin/orgs/${org.id}`}
                                className="flex items-center px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                              >
                                View Details
                              </Link>
                              <Link
                                href={`/admin/orgs/${org.id}`}
                                className="flex items-center px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                              >
                                Toggle Modules
                              </Link>
                            </div>

                            <div className="py-1">
                              {org.status === 'SUSPENDED' ? (
                                <button
                                  onClick={() => handleStatusChange(org.id, 'ACTIVE')}
                                  className="w-full text-left flex items-center px-4 py-2 text-xs font-bold text-green-600 hover:bg-green-50 transition"
                                >
                                  Unsuspend Account
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusChange(org.id, 'SUSPENDED')}
                                  className="w-full text-left flex items-center px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition"
                                >
                                  Suspend Account
                                </button>
                              )}

                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleImpersonate(org.id)}
                                  className="w-full text-left flex items-center px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 transition"
                                >
                                  Impersonate User
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            {/* Limit Selector */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-400">Rows per page:</span>
              <div className="relative">
                <select
                  value={limit}
                  onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                  className="appearance-none bg-white rounded-lg border border-slate-200 py-1.5 pl-2.5 pr-7 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500">
                {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
                  disabled={page >= Math.ceil(total / limit)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
