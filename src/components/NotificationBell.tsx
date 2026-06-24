"use client"

import React, { useState } from 'react'
import { Bell } from 'lucide-react'

export default function NotificationBell() {
  const [unreadCount] = useState(3)

  return (
    <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800 focus:outline-none cursor-pointer">
      <Bell className="w-5 h-5" strokeWidth={1.5} />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </button>
  )
}
