'use client'

import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  Check, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  X,
  MessageSquare
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface NotificationItem {
  id: string
  title: string
  body: string | null
  readAt: string | null
  createdAt: string
}

export default function ParentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/notifications')
      if (!res.ok) throw new Error('Failed to retrieve notifications')
      const json = await res.json()
      if (json.success && json.data) {
        setNotifications(json.data)
      } else {
        throw new Error(json.error || 'Failed to load notifications')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error occurred while loading notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const triggerToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => {
      setToastMsg(prev => prev === msg ? null : prev)
    }, 3000)
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const json = await res.json()
      if (json.success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
        )
        triggerToast('Notification marked as read')
      } else {
        throw new Error(json.error || 'Failed to update notification')
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error updating notification')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })
      const json = await res.json()
      if (json.success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, readAt: new Date().toISOString() }))
        )
        triggerToast('All notifications marked as read')
      } else {
        throw new Error(json.error || 'Failed to mark all as read')
      }
    } catch (err: any) {
      triggerToast(err.message || 'Error updating notifications')
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000)
    
    let interval = Math.floor(seconds / 31536000)
    if (interval >= 1) return `${interval}y ago`
    
    interval = Math.floor(seconds / 2592000)
    if (interval >= 1) return `${interval}mo ago`
    
    interval = Math.floor(seconds / 86400)
    if (interval >= 1) return `${interval}d ago`
    
    interval = Math.floor(seconds / 3600)
    if (interval >= 1) return `${interval}h ago`
    
    interval = Math.floor(seconds / 60)
    if (interval >= 1) return `${interval}m ago`
    
    return 'Just now'
  }

  const unreadCount = notifications.filter(n => !n.readAt).length

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1565D8]" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Notifications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
          <Bell className="w-12 h-12 text-red-500 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
          <Button onClick={fetchNotifications} className="mt-6 bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl h-auto">
            Retry Loading
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-3xl mx-auto">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#1565D8]" /> Notifications
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-1">
            You have {unreadCount} unread notifications
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-4 py-2 rounded-xl h-auto flex items-center gap-1 shadow-sm"
          >
            <Check className="w-4 h-4" /> Mark all read
          </Button>
        )}
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

      {/* 2. NOTIFICATIONS LIST */}
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((n) => {
            const isUnread = !n.readAt
            return (
              <div
                key={n.id}
                onClick={() => isUnread && handleMarkAsRead(n.id)}
                className={`border rounded-2xl p-4 flex items-start gap-4 transition duration-200 text-left ${
                  isUnread 
                    ? 'bg-blue-50/20 border-blue-100 hover:bg-blue-50/40 cursor-pointer shadow-sm' 
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Blue/Gray Dot indicator */}
                <div className="pt-1.5 shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    isUnread ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'
                  }`} />
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className={`text-sm tracking-tight ${
                      isUnread ? 'font-black text-slate-800' : 'font-bold text-slate-600'
                    }`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>
                  {n.body && (
                    <p className={`text-xs leading-relaxed ${
                      isUnread ? 'text-slate-650 font-medium' : 'text-slate-500 font-medium'
                    }`}>
                      {n.body}
                    </p>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          /* EMPTY STATE */
          <Card className="bg-white border-slate-200 p-12 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">No notifications yet</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
              We will notify you here when schools respond to your enquiries or schedule school visits.
            </p>
          </Card>
        )}
      </div>

    </div>
  )
}
