"use client"

import { useCallback, useEffect } from 'react'
import {
  useLocationStore,
  PermissionStatusType,
  DetectionMethodType,
  CACHE_VERSION,
  SUPPORTED_CITIES
} from '@/stores/location.store'

export { SUPPORTED_CITIES } from '@/stores/location.store'

export function useLocation() {
  const store = useLocationStore()

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

        store.setDetectedCity(finalCity, data.area || null, latitude, longitude, 'gps')
      } else {
        throw new Error('City not found in response')
      }
    } catch (err: any) {
      console.error('Reverse geocoding error:', err)
      store.setError('Could not detect city')
    }
  }, [store])

  const requestLocation = useCallback(() => {
    store.setLoading(true)
    store.setError(null)
    store.setPermissionStatus('requesting')

    if (typeof window === 'undefined' || !navigator.geolocation) {
      store.setPermissionStatus('unavailable')
      store.setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        store.setPermissionStatus('granted')
        reverseGeocode(latitude, longitude)
      },
      (err) => {
        if (err.code === 1) {
          store.setPermissionStatus('denied')
        } else {
          store.setPermissionStatus('unavailable')
        }
        store.setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    )
  }, [reverseGeocode, store])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (store.initialized) return

    // Check localStorage
    const savedStr = localStorage.getItem('vidhyaan_location')
    if (savedStr) {
      try {
        const saved = JSON.parse(savedStr)
        const isExpired = Date.now() - saved.detectedAt > 24 * 60 * 60 * 1000
        const isVersionValid = saved.version === CACHE_VERSION
        const isCityValid = saved.city === null || SUPPORTED_CITIES.includes(saved.city)

        if (!isExpired && isVersionValid && isCityValid) {
          store.restoreCachedLocation(saved)
          return
        }
      } catch (e) {
        console.error('Error parsing cached location:', e)
      }
    }

    // No cached or expired/invalid, call requestLocation
    requestLocation()
  }, [requestLocation, store])

  return {
    city: store.activeCity,
    manualArea: store.manualArea,
    gpsCity: store.detectedCity,
    detectedArea: store.detectedArea,
    lat: store.lat,
    lng: store.lng,
    loading: store.loading,
    error: store.error,
    permissionStatus: store.permissionStatus,
    detectionMethod: store.detectionMethod,
    setManualCity: store.setManualCity,
    setManualArea: store.setManualArea,
    requestLocation
  }
}

