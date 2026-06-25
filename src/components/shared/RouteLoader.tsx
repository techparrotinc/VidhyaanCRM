'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'

export function RouteLoader() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Shield className="text-[#1565D8] animate-pulse w-10 h-10" />
        <div className="w-12 h-0.5 bg-slate-200 rounded-full overflow-hidden relative">
          <div className="h-full bg-[#1565D8] rounded-full animate-[loader_1s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}
