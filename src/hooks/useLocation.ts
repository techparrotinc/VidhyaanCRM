"use client"

import { useState, useEffect, useCallback } from 'react'

const SUPPORTED_CITIES = [
  'Chennai',
  'Bengaluru',
  'Hyderabad',
  'Mumbai',
  'New Delhi',
  'Pune',
  'Coimbatore',
  'Madurai',
  'Kochi',
  'Jaipur'
]

const CACHE_VERSION = 2

export type PermissionStatusType = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
export type DetectionMethodType = 'gps' | 'manual' | 'cached' | null

interface SavedLocation {
  city: string | null
  lat: number | null
  lng: number | null
  detectedAt: number
  method: DetectionMethodType
  version?: number
}

export function useLocation() {
  const [city, setCity] = useState<string | null>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatusType>('idle')
  const [detectionMethod, setDetectionMethod] = useState<DetectionMethodType>(null)

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      const latRounded = Number(latitude.toFixed(3))
      const lngRounded = Number(longitude.toFixed(3))
      const res = await fetch(`/api/location/reverse-geocode?lat=${latRounded}&lng=${lngRounded}`)
      if (!res.ok) throw new Error('Could not detect city')
      const data = await res.json()
      if (data.success) {
        const getMatchedCity = (name: string | null) => {
          if (!name) return null
          const normalized = name.toLowerCase()
          if (normalized === 'chennai') return 'Chennai'
          if (normalized === 'bangalore' || normalized === 'bengaluru') return 'Bengaluru'
          if (normalized === 'hyderabad') return 'Hyderabad'
          if (normalized === 'mumbai') return 'Mumbai'
          if (normalized === 'delhi' || normalized === 'new delhi') return 'New Delhi'
          if (normalized === 'pune') return 'Pune'
          if (normalized === 'coimbatore') return 'Coimbatore'
          if (normalized === 'madurai') return 'Madurai'
          if (normalized === 'kochi') return 'Kochi'
          if (normalized === 'jaipur') return 'Jaipur'
          return null
        }

        let finalCity = getMatchedCity(data.locality)
        if (!finalCity) {
          finalCity = getMatchedCity(data.district)
        }

        setCity(finalCity)
        setLat(latitude)
        setLng(longitude)
        setDetectionMethod('gps')
        setError(null)
        
        // Save to localStorage
        const saveObj: SavedLocation = {
          city: finalCity,
          lat: latitude,
          lng: longitude,
          detectedAt: Date.now(),
          method: 'gps',
          version: CACHE_VERSION
        }
        localStorage.setItem('vidhyaan_location', JSON.stringify(saveObj))
      } else {
        throw new Error('City not found in response')
      }
    } catch (err: any) {
      console.error('Reverse geocoding error:', err)
      setError('Could not detect city')
    } finally {
      setLoading(false)
    }
  }, [])

  const requestLocation = useCallback(() => {
    setLoading(true)
    setError(null)
    setPermissionStatus('requesting')

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setPermissionStatus('unavailable')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        setPermissionStatus('granted')
        reverseGeocode(latitude, longitude)
      },
      (err) => {
        if (err.code === 1) {
          setPermissionStatus('denied')
        } else {
          setPermissionStatus('unavailable')
        }
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    )
  }, [reverseGeocode])

  const setManualCity = useCallback((cityName: string) => {
    setCity(cityName)
    setLat(null)
    setLng(null)
    setDetectionMethod('manual')
    setLoading(false)
    setError(null)

    if (typeof window !== 'undefined') {
      const saveObj: SavedLocation = {
        city: cityName || null,
        lat: null,
        lng: null,
        detectedAt: Date.now(),
        method: 'manual',
        version: CACHE_VERSION
      }
      localStorage.setItem('vidhyaan_location', JSON.stringify(saveObj))
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check localStorage
    const savedStr = localStorage.getItem('vidhyaan_location')
    if (savedStr) {
      try {
        const saved: SavedLocation = JSON.parse(savedStr)
        const isExpired = Date.now() - saved.detectedAt > 24 * 60 * 60 * 1000
        const isVersionValid = saved.version === CACHE_VERSION
        const isCityValid = saved.city === null || SUPPORTED_CITIES.includes(saved.city)

        if (!isExpired && isVersionValid && isCityValid) {
          setCity(saved.city)
          setLat(saved.lat)
          setLng(saved.lng)
          setDetectionMethod('cached')
          setPermissionStatus(saved.method === 'gps' ? 'granted' : 'idle')
          setLoading(false)
          return
        }
      } catch (e) {
        console.error('Error parsing cached location:', e)
      }
    }

    // No cached or expired/invalid, call requestLocation
    requestLocation()
  }, [requestLocation])

  return {
    city,
    lat,
    lng,
    loading,
    error,
    permissionStatus,
    detectionMethod,
    setManualCity,
    requestLocation
  }
}
