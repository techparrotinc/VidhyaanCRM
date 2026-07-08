"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Building2,
  Users,
  CreditCard,
  History,
  Clock,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Edit3,
  ShieldAlert,
  UserX,
  ExternalLink,
  Save,
  Check,
  Plus,
  Compass,
  Bell
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import MessagingAllowanceCard from '@/components/admin/MessagingAllowanceCard'
import OrgRevenueMetrics from '@/components/admin/OrgRevenueMetrics'

interface Module {
  id: string
  slug: string
  name: string
  description: string | null
  enabled: boolean
}

export default function OrgDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  // Data State
  const [org, setOrg] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  
  // Loading & Error States
  const [loading, setLoading] = useState(true)
  const [modulesLoading, setModulesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI Edit States
  const [showEditModal, setShowEditModal] = useState(false)
  const [editStatus, setEditStatus] = useState('')
  const [editPlanId, setEditPlanId] = useState('')
  const [editLeadCap, setEditLeadCap] = useState('')
  const [editTrialEndsAt, setEditTrialEndsAt] = useState('')
  const [editBillingDiscountPct, setEditBillingDiscountPct] = useState('')
  
  // Notes State
  const [notes, setNotes] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [impersonationToken, setImpersonationToken] = useState<string | null>(null)

  // Notification Modal State
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifType, setNotifType] = useState('INFO')
  const [notifChannel, setNotifChannel] = useState('IN_APP')
  const [sendingNotif, setSendingNotif] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      // Fetch org details + plans + audit logs
      const [orgRes, plansRes, logsRes] = await Promise.all([
        fetch(`/api/admin/organizations/${id}`),
        fetch('/api/admin/plans'),
        fetch(`/api/admin/audit-logs?orgId=${id}&limit=10`)
      ])

      if (!orgRes.ok) throw new Error('Failed to fetch organization details')
      
      const orgJson = await orgRes.json()
      setOrg(orgJson.organization)
      setHealth(orgJson.health)
      setNotes((orgJson.organization?.settings as any)?.internalNotes || '')
      
      if (plansRes.ok) {
        const plansJson = await plansRes.json()
        setPlans(plansJson)
      }
      
      if (logsRes.ok) {
        const logsJson = await logsRes.json()
        setAuditLogs(logsJson.data || [])
      }

      // Initialize edit fields
      setEditStatus(orgJson.organization.status)
      setEditPlanId(orgJson.organization.planId || '')
      setEditLeadCap(orgJson.organization.leadCap?.toString() || '')
      setEditTrialEndsAt(orgJson.organization.trialEndsAt ? orgJson.organization.trialEndsAt.split('T')[0] : '')
      setEditBillingDiscountPct(
        (orgJson.organization?.settings as any)?.billingDiscountPct != null
          ? String((orgJson.organization.settings as any).billingDiscountPct)
          : ''
      )

      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error loading organization details')
    } finally {
      setLoading(false)
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle.trim() || !notifMessage.trim()) {
      alert('Title and Message are required')
      return
    }

    try {
      setSendingNotif(true)
      const res = await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: id,
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          channel: notifChannel
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to send notification')
      }

      alert('Notification sent successfully!')
      setShowNotificationModal(false)
      setNotifTitle('')
      setNotifMessage('')
      setNotifType('INFO')
      setNotifChannel('IN_APP')
    } catch (err: any) {
      alert(err.message || 'Failed to send notification')
    } finally {
      setSendingNotif(false)
    }
  }

  const loadModules = async () => {
    try {
      setModulesLoading(true)
      const res = await fetch(`/api/admin/organizations/${id}/modules`)
      if (res.ok) {
        const data = await res.json()
        setModules(data.data || [])
      }
    } catch (err) {
      console.error('Failed to load modules:', err)
    } finally {
      setModulesLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadData()
      loadModules()
    }
  }, [id])

  const handleToggleModule = async (moduleSlug: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/organizations/${id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleSlug, isEnabled: !currentEnabled })
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to toggle module')
      }

      // Refresh modules list
      await loadModules()
      // Refresh audit logs
      const logsRes = await fetch(`/api/admin/audit-logs?orgId=${id}&limit=10`)
      if (logsRes.ok) {
        const logsJson = await logsRes.json()
        setAuditLogs(logsJson.data || [])
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle module status')
    }
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
      alert(`Organization status updated to ${newStatus}`)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update organization status')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleSaveNotes = async () => {
    try {
      setNotesSaving(true)
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      if (!res.ok) throw new Error('Failed to save internal notes')
      alert('Internal notes saved successfully')
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to save notes')
    } finally {
      setNotesSaving(false)
    }
  }

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = {
        status: editStatus,
        planId: editPlanId || null,
        leadCap: editLeadCap ? parseInt(editLeadCap) : null,
        trialEndsAt: editTrialEndsAt ? new Date(editTrialEndsAt).toISOString() : null,
        billingDiscountPct: editBillingDiscountPct !== '' ? parseInt(editBillingDiscountPct) : null
      }

      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Failed to update organization')
      }

      setShowEditModal(false)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update organization details')
    }
  }

  const handleExtendTrial = async (days: number) => {
    try {
      const currentEnds = org.trialEndsAt ? new Date(org.trialEndsAt) : new Date()
      currentEnds.setDate(currentEnds.getDate() + days)

      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialEndsAt: currentEnds.toISOString() })
      })

      if (!res.ok) throw new Error('Failed to extend trial')
      alert(`Trial extended by ${days} days`)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to extend trial')
    }
  }

  const handleImpersonateUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: id, userId })
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'Impersonation failed')
      }

      const impData = await res.json()
      setImpersonationToken(impData.token)
    } catch (err: any) {
      alert(err.message || 'Impersonation request failed')
    }
  }

  const handleSchoolVerification = async (schoolId: string, approve: boolean) => {
    const action = approve ? 'approve' : 'reject'
    const endpoint = `/api/admin/schools/${schoolId}/${action}`
    const body: any = approve ? {} : { reason: 'Failed verification checks' }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!res.ok) throw new Error(`Failed to ${action} school listing`)
      alert(`School listing ${approve ? 'approved' : 'rejected'} successfully.`)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Verification update failed')
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !org) {
    return (
      <div className="p-6 md:p-8 space-y-4 max-w-md mx-auto text-center mt-20 select-none">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Details</h3>
        <p className="text-sm text-slate-500">{error || 'Organization details not found.'}</p>
        <Button onClick={() => router.push('/admin/orgs')} className="bg-slate-900 text-white font-semibold flex items-center gap-2 mx-auto mt-4">
          <ArrowLeft className="w-4 h-4" /> Back to Organizations
        </Button>
      </div>
    )
  }

  const primarySchool = org.schools?.[0]
  const activeSub = org.subscriptions?.find((s: any) => s.status === 'ACTIVE')

  return (
    <div className="p-6 md:p-8 space-y-6 select-none bg-slate-50 min-h-screen">
      {/* Impersonation Modal */}
      {impersonationToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="p-6 max-w-md w-full bg-white space-y-4 shadow-2xl border-slate-200 animate-scale-in">
            <div className="flex items-center gap-3 text-amber-600">
              <ShieldAlert className="w-8 h-8" />
              <h3 className="text-lg font-black tracking-tight">Impersonation Token Generated</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Single-use token valid for <strong>15 minutes</strong>. Launching replaces your admin session with a
              30-minute session as this organization&apos;s admin — you&apos;ll need to log in again to return here.
              To keep this admin session, open the link below in an incognito window instead.
            </p>
            <div className="p-3 bg-slate-100 rounded-lg text-xs font-mono break-all text-slate-700 border border-slate-200 select-all">
              {`${typeof window !== 'undefined' ? window.location.origin : ''}/impersonate?token=${impersonationToken}`}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setImpersonationToken(null)} className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold px-4 py-2 text-xs">
                Close
              </Button>
              <Button
                onClick={() => { window.location.href = `/impersonate?token=${impersonationToken}` }}
                className="bg-amber-600 text-white hover:bg-amber-700 font-bold px-4 py-2 text-xs"
              >
                Launch Impersonation Session
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Send Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="p-6 max-w-md w-full bg-white space-y-4 shadow-2xl border-slate-200 animate-scale-in">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Send Platform Notification</h3>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Notification title..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Message</label>
                <textarea
                  required
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Enter message body..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500 h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Type</label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500"
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="ALERT">Alert</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block mb-1">Channel</label>
                  <select
                    value={notifChannel}
                    onChange={(e) => setNotifChannel(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500"
                  >
                    <option value="IN_APP">In App</option>
                    <option value="EMAIL">Email</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold px-4 py-2 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sendingNotif}
                  className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  {sendingNotif && <Loader2 className="w-3 h-3 animate-spin" />}
                  Send Notification
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Org Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="p-6 max-w-md w-full bg-white space-y-4 shadow-2xl border-slate-200 animate-scale-in">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Edit Organization</h3>
            <form onSubmit={handleUpdateOrg} className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500"
                >
                  <option value="PENDING_VERIFICATION">Pending Verification</option>
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Plan */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Plan</label>
                <select
                  value={editPlanId}
                  onChange={(e) => setEditPlanId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden hover:border-slate-350 focus:border-blue-500"
                >
                  <option value="">No Plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
                  ))}
                </select>
              </div>

              {/* Lead Cap */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lead Cap</label>
                <input
                  type="number"
                  value={editLeadCap}
                  onChange={(e) => setEditLeadCap(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden"
                />
              </div>

              {/* Trial Ends Date */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Trial Ends At</label>
                <input
                  type="date"
                  value={editTrialEndsAt}
                  onChange={(e) => setEditTrialEndsAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden"
                />
              </div>

              {/* Negotiated Billing Discount */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billing Discount % (0–50)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={editBillingDiscountPct}
                  onChange={(e) => setEditBillingDiscountPct(e.target.value)}
                  placeholder="0 = catalog price"
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden"
                />
                <p className="text-[9px] text-slate-400 mt-1">Applied to all slab prices for this org at checkout. Capped at 50% (floor-price guard). Audit-logged.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" onClick={() => setShowEditModal(false)} className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold px-4 py-2 text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-4 py-2 text-xs">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
        <Link href="/admin" className="hover:text-slate-700">Admin</Link>
        <span>&gt;</span>
        <Link href="/admin/orgs" className="hover:text-slate-700">Organizations</Link>
        <span>&gt;</span>
        <span className="text-slate-600">{org.name}</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">{org.name}</h2>
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
              {org.status}
            </span>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              {org.plan?.name || 'Free'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setShowNotificationModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm">
            <Bell className="w-4 h-4" /> Send Notification
          </Button>
          <Button onClick={() => setShowEditModal(true)} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-xs">
            <Edit3 className="w-4 h-4" /> Edit Details
          </Button>
          {org.status !== 'SUSPENDED' ? (
            <Button onClick={() => handleStatusChange(org.id, 'SUSPENDED')} className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold py-2 px-3.5 shadow-xs">
              Suspend Org
            </Button>
          ) : (
            <Button onClick={() => handleStatusChange(org.id, 'ACTIVE')} className="bg-green-50 hover:bg-green-100 text-green-750 border border-green-200 text-xs font-bold py-2 px-3.5 shadow-xs">
              Unsuspend Org
            </Button>
          )}
        </div>
      </div>

      {/* Main 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1 (Left 30%) - Col-Span-4 */}
        <div className="lg:col-span-4 space-y-6">
          {/* Org Info Card */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Organization Info</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg">
                {org.name[0].toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 leading-tight">{org.name}</h4>
                <span className="text-xs text-slate-400 capitalize">{org.institutionType.toLowerCase().replace('_', ' ')}</span>
              </div>
            </div>
            <div className="space-y-2.5 pt-2 text-xs font-medium text-slate-600">
              <div className="flex justify-between"><span className="text-slate-400">Primary Email:</span> <span className="font-bold text-slate-800">{org.email}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Primary Phone:</span> <span className="font-bold text-slate-800">{org.phone || 'None'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Joined:</span> <span className="text-slate-800 font-bold">{new Date(org.createdAt).toLocaleDateString()}</span></div>
              {org.trialEndsAt && (
                <div className="flex justify-between"><span className="text-slate-400">Trial Ends:</span> <span className="text-amber-700 font-bold">{new Date(org.trialEndsAt).toLocaleDateString()}</span></div>
              )}
            </div>
          </Card>

          {/* Health Metrics Card */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Health Metrics</h3>
            <div className="space-y-4">
              {/* Profile Completion */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Profile Completion</span>
                  <span>{health?.profileCompletePct ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${health?.profileCompletePct ?? 0}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Response Rate</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{health?.leadResponseRate ?? 0}%</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Conversion Rate</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{health?.conversionRate ?? 0}%</div>
                </div>
              </div>

              <div className="divide-y divide-slate-100 pt-2 text-xs font-medium text-slate-600">
                <div className="flex justify-between py-2"><span>Total Leads:</span> <span className="font-bold text-slate-800">{org._count.leads}</span></div>
                <div className="flex justify-between py-2"><span>Active Users:</span> <span className="font-bold text-slate-800">{org.users?.length || 0}</span></div>
              </div>
            </div>
          </Card>

          {/* Quick Actions Card */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Quick Actions</h3>
            <Button onClick={() => handleExtendTrial(7)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold py-2 text-xs border border-slate-200 shadow-xs">
              Extend Trial 7 Days
            </Button>
            <Button onClick={() => setShowEditModal(true)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold py-2 text-xs border border-slate-200 shadow-xs">
              Change Plan
            </Button>
            {primarySchool && (
              <Link href={`/schools/${primarySchool.slug}`} target="_blank" className="block w-full">
                <Button className="w-full bg-white hover:bg-slate-50 text-blue-600 hover:text-blue-800 font-bold py-2 text-xs border border-slate-200 shadow-xs flex items-center justify-center gap-1.5">
                  View in Marketplace <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </Card>
        </div>

        {/* Column 2 (Center 40%) - Col-Span-5 */}
        <div className="lg:col-span-5 space-y-6">
          {/* Module Toggles Card */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              Enabled Modules
              {modulesLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {modules.map((mod) => (
                <div key={mod.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition text-sm">
                  <div className="max-w-[75%]">
                    <span className="font-bold text-slate-850 block">{mod.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{mod.description || 'Module description'}</span>
                  </div>
                  <button
                    onClick={() => handleToggleModule(mod.slug, mod.enabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-hidden ${
                      mod.enabled ? 'bg-blue-600' : 'bg-slate-250'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        mod.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Revenue Metrics Card */}
          <OrgRevenueMetrics orgId={id} />

          {/* Messaging Allowances Card */}
          <MessagingAllowanceCard orgId={id} />

          {/* Subscription Card */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Subscription details</h3>
            {activeSub ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Billing Cycle</div>
                    <div className="text-xs font-bold text-slate-900 capitalize mt-0.5">{activeSub.billingCycle.toLowerCase()}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Amount</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{formatCurrency(Number(activeSub.amount))}</div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-600 space-y-1.5 pt-2">
                  <div className="flex justify-between"><span>Status:</span> <span className="text-green-700 font-bold">{activeSub.status}</span></div>
                  {activeSub.currentPeriodEnd && (
                    <div className="flex justify-between"><span>Next Billing Date:</span> <span className="text-slate-800 font-bold">{new Date(activeSub.currentPeriodEnd).toLocaleDateString()}</span></div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs font-medium">No active subscription found.</div>
            )}
          </Card>

          {/* Recent Audit Logs */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Activity</h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="text-xs flex flex-col gap-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[9px]">{log.action.replace('_', ' ')}</span>
                      <span className="text-[9px] text-slate-450 font-bold">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-550 mt-0.5 font-medium leading-relaxed">
                      Updated by <span className="font-bold">{log.userName || 'System'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">No recent activity logs.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Column 3 (Right 30%) - Col-Span-3 */}
        <div className="lg:col-span-3 space-y-6">
          {/* Team Members Card */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Team Members</h3>
            <div className="divide-y divide-slate-100">
              {org.users && org.users.length > 0 ? (
                org.users.map((member: any) => (
                  <div key={member.id} className="py-3 flex items-start justify-between text-xs gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate leading-tight">{member.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{member.email}</div>
                      <div className="text-[9px] font-bold text-blue-500 uppercase tracking-wider mt-1">{member.role}</div>
                    </div>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleImpersonateUser(member.id)}
                        className="text-[9px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-250 shrink-0"
                        title="Impersonate User"
                      >
                        Impersonate
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">No team members registered.</div>
              )}
            </div>
          </Card>

          {/* School Listing Card */}
          {primarySchool ? (
            <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Marketplace Listing</h3>
              <div className="space-y-3.5">
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">{primarySchool.name}</h4>
                  <Link href={`/schools/${primarySchool.slug}`} target="_blank" className="text-[10px] text-blue-650 hover:underline flex items-center gap-1 mt-1 font-bold">
                    slug: {primarySchool.slug} <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2 text-xs font-medium text-slate-600">
                  <div className="flex justify-between"><span>Status:</span> <span className="font-bold text-slate-800">{primarySchool.verificationStatus}</span></div>
                  <div className="flex justify-between"><span>Verified:</span> <span className="font-bold text-slate-800">{primarySchool.isVerified ? 'Yes ✓' : 'No ✗'}</span></div>
                  <div className="flex justify-between"><span>Published:</span> <span className="font-bold text-slate-800">{primarySchool.isPublished ? 'Yes ✓' : 'No ✗'}</span></div>
                </div>

                {primarySchool.verificationStatus === 'PENDING' && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button onClick={() => handleSchoolVerification(primarySchool.id, true)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 text-[10px] rounded-lg">
                      Approve
                    </Button>
                    <Button onClick={() => handleSchoolVerification(primarySchool.id, false)} className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold py-1.5 text-[10px] rounded-lg">
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-5 bg-white border-slate-200 shadow-sm text-center py-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Marketplace Listing</h3>
              <p className="text-xs text-slate-400">This organization does not have an active school marketplace listing.</p>
            </Card>
          )}

          {/* Internal Notes Card */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Internal Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal ops/support note for this organization..."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 outline-hidden focus:border-blue-500 h-28 resize-none font-semibold leading-relaxed"
            />
            <Button
              onClick={handleSaveNotes}
              disabled={notesSaving}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              {notesSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Note
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
