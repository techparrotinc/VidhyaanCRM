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

// Hydrate the live city list (cities with published schools) once per page load
let citiesFetched = false
async function hydrateSupportedCities() {
  if (citiesFetched) return
  citiesFetched = true
  try {
    const res = await fetch('/api/public/locations')
    const json = await res.json()
    if (json.success && Array.isArray(json.data?.cities)) {
      useLocationStore.getState().setSupportedCities(json.data.cities)
    }
  } catch (e) {
    console.error('Failed to hydrate supported cities:', e)
  }
}

export function useLocation() {
  const store = useLocationStore()
  const initialized = useLocationStore((state) => state.initialized)

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
        if (!finalCity) {
          finalCity = data.city || null
        }

        useLocationStore.getState().setDetectedCity(finalCity, data.area || null, latitude, longitude, 'gps')
      } else {
        throw new Error('City not found in response')
      }
    } catch (err: any) {
      console.error('Reverse geocoding error:', err)
      useLocationStore.getState().setError('Could not detect city')
    }
  }, [])

  const requestLocation = useCallback(() => {
    const { setLoading, setError, setPermissionStatus } = useLocationStore.getState()
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    hydrateSupportedCities()
    if (initialized) return

    // Check localStorage
    const savedStr = localStorage.getItem('vidhyaan_location')
    if (savedStr) {
      try {
        const saved = JSON.parse(savedStr)
        const isExpired = Date.now() - saved.detectedAt > 24 * 60 * 60 * 1000
        const isVersionValid = saved.version === CACHE_VERSION
        // manual picks are always valid (chosen from the picker); detected
        // cities re-validate against the dynamic list once it hydrates
        const isCityValid = saved.city === null || saved.method === 'manual' ||
          useLocationStore.getState().supportedCities.some(
            (c) => c.toLowerCase() === String(saved.city).toLowerCase()
          )

        if (!isExpired && isVersionValid && isCityValid) {
          useLocationStore.getState().restoreCachedLocation(saved)
          return
        }
      } catch (e) {
        console.error('Error parsing cached location:', e)
      }
    }

    // No cached or expired/invalid, call requestLocation
    requestLocation()
  }, [requestLocation, initialized])

  return {
    city: store.activeCity,
    manualArea: store.manualArea,
    gpsCity: store.detectedCity,
    detectedArea: store.detectedArea,
    isSupportedCity: store.isSupportedCity,
    supportedCities: store.supportedCities,
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
