"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  Loader2,
  UserCheck,
  CheckCircle,
  Ban,
  Clock,
  ShieldAlert,
  Save,
  Users,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Module {
  id: string
  slug: string
  name: string
  description: string
  enabled: boolean
}

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  status: string
}

interface Lead {
  id: string
  leadCode: string
  parentName: string
  phone: string
  status: string
  createdAt: string
}

interface Organization {
  id: string
  name: string
  slug: string
  institutionType: string
  email: string
  phone: string
  status: string
  trialEndsAt: string | null
  leadCap: number
  planId: string | null
  createdAt: string
  plan: {
    name: string
    slug: string
  } | null
  users?: TeamMember[]
  leads?: Lead[]
}

export default function AdminOrgDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [org, setOrg] = useState<Organization | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  // Edit lead cap state
  const [isEditingLeadCap, setIsEditingLeadCap] = useState(false)
  const [leadCapInput, setLeadCapInput] = useState(10)

  const fetchData = async () => {
    try {
      const [orgRes, modulesRes] = await Promise.all([
        fetch(`/api/admin/organizations/${id}`),
        fetch(`/api/admin/organizations/${id}/modules`)
      ])

      if (!orgRes.ok || !modulesRes.ok) {
        throw new Error('Failed to fetch organization details')
      }

      const orgJson = await orgRes.json()
      const modulesJson = await modulesRes.json()

      setOrg(orgJson.data)
      setModules(modulesJson.data ?? [])
      if (orgJson.data) {
        setLeadCapInput(orgJson.data.leadCap)
      }
    } catch (err: any) {
      setError(err.message || 'Error loading organization details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const handleApprove = async () => {
    try {
      setUpdating(true)
      const res = await fetch(`/api/admin/organizations/${id}/approve`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Failed to approve organization')
      alert('Organization approved successfully')
      await fetchData()
    } catch (err: any) {
      alert(err.message || 'Could not approve organization')
    } finally {
      setUpdating(false)
    }
  }

  const handleExtendTrial = async () => {
    try {
      setUpdating(true)
      const currentEnd = org?.trialEndsAt ? new Date(org.trialEndsAt) : new Date()
      currentEnd.setDate(currentEnd.getDate() + 7)

      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialEndsAt: currentEnd.toISOString() })
      })

      if (!res.ok) throw new Error('Failed to extend trial')
      alert('Trial extended by 7 days')
      await fetchData()
    } catch (err: any) {
      alert(err.message || 'Could not extend trial')
    } finally {
      setUpdating(false)
    }
  }

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this organization?')) return

    try {
      setUpdating(true)
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUSPENDED' })
      })

      if (!res.ok) throw new Error('Failed to suspend organization')
      alert('Organization suspended')
      await fetchData()
    } catch (err: any) {
      alert(err.message || 'Could not suspend organization')
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveLeadCap = async () => {
    try {
      setUpdating(true)
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadCap: Number(leadCapInput) })
      })

      if (!res.ok) throw new Error('Failed to update lead cap')
      alert('Lead limit updated')
      setIsEditingLeadCap(false)
      await fetchData()
    } catch (err: any) {
      alert(err.message || 'Could not update lead cap')
    } finally {
      setUpdating(false)
    }
  }

  const handleToggleModule = async (moduleSlug: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/organizations/${id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleSlug,
          isEnabled: !currentEnabled
        })
      })

      if (!res.ok) throw new Error('Failed to toggle module status')
      
      // Update local state directly
      setModules((prev) =>
        prev.map((m) => {
          if (m.slug === moduleSlug) {
            return { ...m, enabled: !currentEnabled }
          }
          return m
        })
      )
    } catch (err: any) {
      alert(err.message || 'Could not update module')
    }
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1565D8]" />
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-red-500 flex-col">
        <p className="font-semibold text-base">{error || 'Organization not found'}</p>
        <Button onClick={() => router.push('/admin/orgs')} className="mt-4 bg-[#1565D8] text-white">Back to list</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6 select-none font-sans antialiased text-slate-800 animate-fade-in">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold text-[#1565D8] hover:underline cursor-pointer" onClick={() => router.push('/admin/orgs')}>
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Organizations</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Organization Profile details */}
        <Card className="bg-white p-6 border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-[#1565D8] rounded-xl shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">{org.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 uppercase font-semibold tracking-wider">{org.slug}</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-3.5 text-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Institution Type</span>
              <span className="font-semibold text-slate-700 uppercase">{org.institutionType}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Email Address</span>
              <span className="font-medium text-slate-700">{org.email}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Phone Number</span>
              <span className="font-medium text-slate-700">{org.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Billing Plan</span>
                <span className="font-semibold text-slate-700">{org.plan?.name ?? 'Free Plan'}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeStyle(org.status)}`}>
                {org.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Trial Period End</span>
              <span className="font-medium text-slate-700">
                {org.trialEndsAt ? new Date(org.trialEndsAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : 'No Active Trial'}
              </span>
            </div>

            {/* Configurable Lead Limit */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Free Lead Cap</span>
              {isEditingLeadCap ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={leadCapInput}
                    onChange={(e) => setLeadCapInput(Number(e.target.value))}
                    className="w-20 text-xs border border-slate-300 rounded px-2 py-1 outline-none"
                    min={0}
                  />
                  <button
                    onClick={handleSaveLeadCap}
                    disabled={updating}
                    className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingLeadCap(false)
                      setLeadCapInput(org.leadCap)
                    }}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-semibold text-slate-700">{org.leadCap} leads limit</span>
                  <span
                    onClick={() => setIsEditingLeadCap(true)}
                    className="text-xs font-bold text-[#1565D8] hover:underline cursor-pointer"
                  >
                    Modify
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Middle Column: Platform module toggles */}
        <Card className="bg-white p-6 border-slate-200 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              Organization Modules
            </h3>

            <div className="space-y-4">
              {modules.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="min-w-0 pr-4">
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">{m.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">
                      {m.description || `Feature slug: ${m.slug}`}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={m.enabled}
                    onChange={() => handleToggleModule(m.slug, m.enabled)}
                    className="w-4 h-4 rounded border-slate-300 text-[#1565D8] focus:ring-[#1565D8] cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Right Column: Platform admin Quick Actions */}
        <Card className="bg-white p-6 border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Super Admin Quick Actions</h3>

          <div className="flex flex-col gap-3">
            {org.status === 'PENDING_VERIFICATION' && (
              <Button
                onClick={handleApprove}
                disabled={updating}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-center gap-2 text-xs py-2.5 h-auto rounded-lg shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Approve School Listing
              </Button>
            )}

            <Button
              onClick={handleExtendTrial}
              disabled={updating}
              className="w-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#1565D8] font-semibold flex items-center justify-center gap-2 text-xs py-2.5 h-auto rounded-lg shadow-none"
            >
              <Clock className="w-4 h-4" />
              Extend Trial Session (+7 days)
            </Button>

            {org.status !== 'SUSPENDED' && (
              <Button
                onClick={handleSuspend}
                disabled={updating}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-semibold flex items-center justify-center gap-2 text-xs py-2.5 h-auto rounded-lg shadow-none"
              >
                <Ban className="w-4 h-4" />
                Suspend Organization Access
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Team Members and Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Team Members list */}
        <Card className="bg-white p-6 border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            Registered Team Members ({org.users?.length ?? 0})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Name / Contact</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {(org.users ?? []).map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="py-3">
                      <div className="font-bold text-slate-800">{user.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{user.email}</div>
                    </td>
                    <td className="py-3 uppercase text-[10px] font-bold tracking-wide text-slate-500">{user.role}</td>
                    <td className="py-3 pr-2 text-right">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!org.users || org.users.length === 0) && (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-400 font-normal">
                      No team members registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right Column: Recent leads */}
        <Card className="bg-white p-6 border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            Recent Capture Leads ({org.leads?.length ?? 0})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Code / Parent</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 pr-2 text-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {(org.leads ?? []).map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-100">
                    <td className="py-3">
                      <div className="font-bold text-slate-800">{lead.leadCode}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{lead.parentName}</div>
                    </td>
                    <td className="py-3 font-medium text-slate-700">{lead.phone}</td>
                    <td className="py-3">
                      <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right text-slate-400 font-normal">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </td>
                  </tr>
                ))}
                {(!org.leads || org.leads.length === 0) && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-400 font-normal">
                      No leads captured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
