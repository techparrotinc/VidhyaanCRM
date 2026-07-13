'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'

/**
 * Lightweight parent-portal bell: unread badge + link to /parent/notifications.
 * (The CRM NotificationBell deep-links into staff routes, so it isn't reused here.)
 */
export default function ParentNotificationBell() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/v1/notifications/count')
        const data = await res.json()
        if (!cancelled && data?.success) setUnread(data.unreadCount || 0)
      } catch {
        /* non-critical */
      }
    }
    load()
    const t = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  return (
    <Link
      href="/parent/notifications"
      className="text-slate-400 hover:text-[#1565D8] p-1.5 hover:bg-slate-50 rounded-xl transition relative cursor-pointer"
      title="Notifications"
    >
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}
