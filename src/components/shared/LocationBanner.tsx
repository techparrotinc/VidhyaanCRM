"use client"

import React, { useState, useEffect } from 'react'
import { MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LocationBannerProps {
  permissionStatus: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  city: string | null
  requestLocation: () => void
}

export function LocationBanner({ permissionStatus, city, requestLocation }: LocationBannerProps) {
  const [dismissed, setDismissed] = useState<boolean>(true) // hide by default during SSR
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDismissed = localStorage.getItem('vidhyaan_location_banner_dismissed') === 'true'
    setDismissed(isDismissed)
  }, [])

  if (!mounted) return null
  if (dismissed) return null
  if (city) return null
  if (permissionStatus === 'denied') return null

  // Show banner only when: permissionStatus === 'idle' AND no cached location exists.
  if (permissionStatus !== 'idle') return null

  const handleClose = () => {
    localStorage.setItem('vidhyaan_location_banner_dismissed', 'true')
    setDismissed(true)
  }

  const handleEnable = () => {
    requestLocation()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 mb-4">
      <div className="bg-blue-50 border border-blue-150/70 rounded-full py-2 px-4 flex items-center justify-between shadow-sm animate-fade-in">
        <div className="flex items-center gap-2 text-blue-700">
          <MapPin className="w-4 h-4 shrink-0 text-[#1565D8]" />
          <span className="text-xs font-bold">
            Allow location access to see schools near you
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleEnable}
            variant="outline"
            className="text-[10px] uppercase tracking-wider border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-full px-3.5 h-7 py-0 font-black bg-white cursor-pointer"
          >
            Enable Location
          </Button>
          <button
            onClick={handleClose}
            className="text-blue-400 hover:text-blue-600 transition cursor-pointer p-0.5 flex items-center justify-center rounded-full hover:bg-blue-100/50 w-6 h-6 shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
export default LocationBanner
