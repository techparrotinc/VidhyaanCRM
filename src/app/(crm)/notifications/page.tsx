"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Trash2,
  CheckCircle2,
  UserPlus,
  Clock,
  ArrowRight,
  IndianRupee,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Eye,
  RefreshCw,
  FolderOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotificationItem {
  id: string
  title: string
  body: string
  type: string
  readAt: string | null
  createdAt: string
  data: any
  lead?: any
  admission?: any
  invoice?: any
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all')
  const [activeCategory, setActiveCategory] = useState<'all' | 'leads' | 'admissions' | 'fees' | 'system'>('all')

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/notifications?limit=100')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data)
      }
    } catch (e) {
      console.error('Error fetching notifications:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      })
      const data = await res.json()
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
        )
      }
    } catch (e) {
      console.error('Error marking all as read:', e)
    }
  }

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      })
      const data = await res.json()
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        )
      }
    } catch (e) {
      console.error('Error marking read:', e)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/v1/notifications/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    } catch (e) {
      console.error('Error deleting notification:', e)
    }
  }

  const handleItemClick = async (n: NotificationItem) => {
    // Mark read
    if (!n.readAt) {
      try {
        await fetch('/api/v1/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [n.id] })
        })
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, readAt: new Date().toISOString() } : item))
        )
      } catch (e) {
        console.error('Error marking read:', e)
      }
    }

    // Navigate
    const path = n.data?.href
    if (path) {
      router.push(path)
    } else if (n.data?.leadId) {
      router.push(`/lead-management/${n.data.leadId}`)
    } else if (n.data?.admissionId) {
      router.push('/admission-management')
    } else if (n.data?.invoiceId) {
      router.push('/settings/billing')
    }
  }

  const getCategoryFromType = (type: string): string => {
    if (type === 'LEAD_RECEIVED' || type === 'LEAD_FOLLOWUP_DUE') return 'leads'
    if (type === 'ADMISSION_STAGE_CHANGED') return 'admissions'
    if (type === 'FEE_PAYMENT_RECEIVED' || type === 'FEE_OVERDUE' || type === 'PAYMENT_FAILED') return 'fees'
    return 'system'
  }

  const getNotificationIconDetails = (type: string) => {
    switch (type) {
      case 'LEAD_RECEIVED':
        return { Icon: UserPlus, bgColor: 'bg-blue-50', textColor: 'text-blue-600' }
      case 'LEAD_FOLLOWUP_DUE':
        return { Icon: Clock, bgColor: 'bg-amber-50', textColor: 'text-amber-600' }
      case 'ADMISSION_STAGE_CHANGED':
        return { Icon: ArrowRight, bgColor: 'bg-green-50', textColor: 'text-green-600' }
      case 'FEE_PAYMENT_RECEIVED':
        return { Icon: IndianRupee, bgColor: 'bg-green-50', textColor: 'text-green-600' }
      case 'FEE_OVERDUE':
        return { Icon: AlertTriangle, bgColor: 'bg-red-50', textColor: 'text-red-600' }
      case 'TRIAL_ENDING':
        return { Icon: Clock, bgColor: 'bg-amber-50', textColor: 'text-amber-600' }
      case 'PAYMENT_FAILED':
        return { Icon: XCircle, bgColor: 'bg-red-50', textColor: 'text-red-600' }
      case 'PROFILE_APPROVED':
        return { Icon: CheckCircle, bgColor: 'bg-green-50', textColor: 'text-green-600' }
      default:
        return { Icon: Bell, bgColor: 'bg-slate-50', textColor: 'text-slate-600' }
    }
  }

  // Local filtering logic
  const filteredNotifications = notifications.filter((n) => {
    // 1. Tab filter
    if (activeTab === 'unread' && n.readAt) return false
    if (activeTab === 'read' && !n.readAt) return false

    // 2. Category filter
    if (activeCategory !== 'all') {
      const cat = getCategoryFromType(n.type)
      if (cat !== activeCategory) return false
    }

    return true
  })

  // Date grouping helper
  const groupNotificationsByDate = (items: NotificationItem[]) => {
    const today: NotificationItem[] = []
    const yesterday: NotificationItem[] = []
    const thisWeek: NotificationItem[] = []
    const older: NotificationItem[] = []

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000

    items.forEach((item) => {
      const time = new Date(item.createdAt).getTime()
      if (time >= todayStart) {
        today.push(item)
      } else if (time >= yesterdayStart) {
        yesterday.push(item)
      } else if (time >= weekStart) {
        thisWeek.push(item)
      } else {
        older.push(item)
      }
    })

    return { today, yesterday, thisWeek, older }
  }

  const grouped = groupNotificationsByDate(filteredNotifications)

  const renderGroupSection = (title: string, list: NotificationItem[]) => {
    if (list.length === 0) return null

    return (
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-4 select-none px-1">
          {title}
        </h3>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-sm">
          {list.map((n) => {
            const { Icon, bgColor, textColor } = getNotificationIconDetails(n.type)
            const isUnread = !n.readAt

            return (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-4 sm:p-5 flex gap-4 items-start cursor-pointer transition-all hover:bg-slate-50/50 relative ${
                  isUnread ? 'bg-blue-50/20' : 'bg-white'
                }`}
              >
                {/* Colored Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgColor} ${textColor}`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold text-slate-800 ${isUnread ? 'text-slate-900 font-semibold' : ''}`}>
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isUnread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    {n.body}
                  </p>

                  {/* Linked Entity Card details */}
                  {n.lead && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex flex-wrap gap-4 text-slate-600 shadow-inner">
                      <div><span className="font-semibold text-slate-500 uppercase tracking-wider">Parent:</span> {n.lead.parentName}</div>
                      <div><span className="font-semibold text-slate-500 uppercase tracking-wider">Student:</span> {n.lead.kidName}</div>
                      <div><span className="font-semibold text-slate-500 uppercase tracking-wider">Grade:</span> {n.lead.gradeSought}</div>
                      <div><span className="font-semibold text-slate-500 uppercase tracking-wider">Status:</span> <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{n.lead.status}</span></div>
                    </div>
                  )}

                  {n.admission && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex flex-wrap gap-4 text-slate-600 shadow-inner">
                      <div><span className="font-semibold text-slate-500 uppercase tracking-wider">Applicant:</span> {n.admission.applicantName}</div>
                      <div><span className="font-semibold text-slate-500 uppercase tracking-wider">Grade:</span> {n.admission.gradeSought}</div>
                      <div><span className="font-semibold text-slate-500 uppercase tracking-wider">Stage:</span> <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">{n.admission.stage?.name || 'In Progress'}</span></div>
                      <div><span className="font-semibold text-slate-500 uppercase tracking-wider">Status:</span> <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{n.admission.status}</span></div>
                    </div>
                  )}

                  {n.invoice && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex flex-wrap gap-4 text-slate-600 shadow-inner">
                      <div><span className="font-semibold text-slate-500 uppercase tracking-wider">Invoice No:</span> #{n.invoice.invoiceNumber}</div>
                      <div><span className="font-semibold text-slate-500 uppercase tracking-wider">Amount:</span> <span className="font-bold text-slate-800">₹{n.invoice.totalAmount}</span></div>
                      <div><span className="font-semibold text-slate-500 uppercase tracking-wider">Due Date:</span> {new Date(n.invoice.dueDate).toLocaleDateString()}</div>
                      <div><span className="font-semibold text-slate-500 uppercase tracking-wider">Status:</span> <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{n.invoice.status}</span></div>
                    </div>
                  )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-center">
                  {isUnread && (
                    <button
                      onClick={(e) => handleMarkRead(n.id, e)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Mark as Read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(n.id, e)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const hasAnyFiltered = filteredNotifications.length > 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Notifications</h1>
          <p className="text-sm text-slate-500">Stay up to date with leads, applications, and collections.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchNotifications}
            className="flex items-center gap-1.5 hover:bg-slate-55 border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button
            onClick={handleMarkAllRead}
            disabled={notifications.filter((n) => !n.readAt).length === 0}
            className="bg-[#1565D8] hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 focus:ring-0 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-6 text-sm font-semibold select-none">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 border-b-2 px-1 transition-colors cursor-pointer ${
            activeTab === 'all' ? 'border-[#1565D8] text-[#1565D8]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`pb-3 border-b-2 px-1 transition-colors cursor-pointer ${
            activeTab === 'unread' ? 'border-[#1565D8] text-[#1565D8]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setActiveTab('read')}
          className={`pb-3 border-b-2 px-1 transition-colors cursor-pointer ${
            activeTab === 'read' ? 'border-[#1565D8] text-[#1565D8]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Read
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-slate-400 mr-2 uppercase tracking-wider select-none">Filter By:</span>
        {[
          { key: 'all', label: 'All Updates' },
          { key: 'leads', label: 'Leads' },
          { key: 'admissions', label: 'Admissions' },
          { key: 'fees', label: 'Fees & Billing' },
          { key: 'system', label: 'System' }
        ].map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
              activeCategory === c.key
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* List Container */}
      {loading ? (
        <div className="py-24 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#1565D8]" />
          <p className="text-sm">Loading notifications...</p>
        </div>
      ) : !hasAnyFiltered ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Bell className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No notifications yet</h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            We will notify you about new leads, admission updates and fee collections here.
          </p>
        </div>
      ) : (
        /* Grouped List */
        <div className="space-y-6">
          {renderGroupSection('Today', grouped.today)}
          {renderGroupSection('Yesterday', grouped.yesterday)}
          {renderGroupSection('This Week', grouped.thisWeek)}
          {renderGroupSection('Older Notifications', grouped.older)}
        </div>
      )}
    </div>
  )
}
