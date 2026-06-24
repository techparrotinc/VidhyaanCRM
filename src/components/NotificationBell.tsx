"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  UserPlus,
  Clock,
  ArrowRight,
  IndianRupee,
  AlertTriangle,
  XCircle,
  CheckCircle,
  CheckCheck
} from 'lucide-react'

interface NotificationItem {
  id: string
  title: string
  body: string
  type: string
  readAt: string | null
  createdAt: string
  data: any
}

export default function NotificationBell() {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/v1/notifications/count')
      const data = await res.json()
      if (data.success) {
        return data.unreadCount
      }
    } catch (e) {
      console.error('Error fetching unread count:', e)
    }
    return 0
  }

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications?limit=5')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data)
      }
    } catch (e) {
      console.error('Error fetching notifications:', e)
    }
  }

  // Initial load
  useEffect(() => {
    fetchUnreadCount().then((count) => {
      setUnreadCount(count)
    })
    fetchNotifications()
  }, [])

  // Polling every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const newCount = await fetchUnreadCount()
      if (newCount !== unreadCount) {
        setUnreadCount(newCount)
        fetchNotifications()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [unreadCount])

  // Click outside to close panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      })
      const data = await res.json()
      if (data.success) {
        setUnreadCount(0)
        // Mark all as read locally
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
        )
      }
    } catch (e) {
      console.error('Error marking all as read:', e)
    }
  }

  const handleItemClick = async (n: NotificationItem) => {
    setIsOpen(false)
    
    // 1. Mark as read on server if unread
    if (!n.readAt) {
      try {
        await fetch('/api/v1/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [n.id] })
        })
        setUnreadCount((prev) => Math.max(0, prev - 1))
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, readAt: new Date().toISOString() } : item))
        )
      } catch (e) {
        console.error('Error marking notification as read:', e)
      }
    }

    // 2. Navigate based on data or fallback
    const path = n.data?.href
    if (path) {
      router.push(path)
    } else if (n.data?.leadId) {
      router.push(`/lead-management/${n.data.leadId}`)
    } else if (n.data?.admissionId) {
      router.push('/admission-management')
    } else if (n.data?.invoiceId) {
      router.push('/settings/billing')
    } else {
      router.push('/notifications')
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'yesterday'
    return `${days}d ago`
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

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            fetchNotifications()
            fetchUnreadCount().then((count) => setUnreadCount(count))
          }
        }}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800 focus:outline-none cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold px-1 border border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden max-h-[480px] animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-medium bg-blue-50 text-[#1565D8] px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-[#1565D8] hover:text-blue-700 hover:underline flex items-center gap-1 focus:outline-none cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[360px]">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-400 select-none">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const { Icon, bgColor, textColor } = getNotificationIconDetails(n.type)
                const isUnread = !n.readAt

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 flex gap-3 transition-colors cursor-pointer text-left hover:bg-slate-50/70 ${
                      isUnread ? 'bg-blue-50/40' : 'bg-white'
                    }`}
                  >
                    {/* Left: Type Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgColor} ${textColor}`}>
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </div>

                    {/* Center: Title & Body */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold text-slate-800 truncate mb-0.5 ${isUnread ? 'font-semibold' : ''}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    {/* Right: Unread Dot */}
                    {isUnread && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0 self-center" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-2 text-center bg-slate-50/30">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-[#1565D8] hover:text-blue-700 inline-block py-1 hover:underline"
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
