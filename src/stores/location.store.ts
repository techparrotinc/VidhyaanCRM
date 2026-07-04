import { create } from 'zustand'

export type PermissionStatusType = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
export type DetectionMethodType = 'gps' | 'manual' | 'cached' | null

export const CACHE_VERSION = 2
export const SUPPORTED_CITIES = [
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

interface LocationState {
  manualCity: string | null
  detectedCity: string | null
  activeCity: string | null
  lat: number | null
  lng: number | null
  loading: boolean
  error: string | null
  permissionStatus: PermissionStatusType
  detectionMethod: DetectionMethodType
  initialized: boolean

  setManualCity: (cityName: string) => void
  setDetectedCity: (cityName: string | null, lat: number | null, lng: number | null, method: DetectionMethodType) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPermissionStatus: (status: PermissionStatusType) => void
  setDetectionMethod: (method: DetectionMethodType) => void
  setInitialized: (initialized: boolean) => void
  restoreCachedLocation: (saved: any) => void
  resetLocation: () => void
}

export const useLocationStore = create<LocationState>((set) => ({
  manualCity: null,
  detectedCity: null,
  activeCity: null,
  lat: null,
  lng: null,
  loading: true,
  error: null,
  permissionStatus: 'idle',
  detectionMethod: null,
  initialized: false,

  setManualCity: (cityName: string) => {
    set({
      manualCity: cityName,
      activeCity: cityName,
      lat: null,
      lng: null,
      detectionMethod: 'manual',
      loading: false,
      error: null
    })
    if (typeof window !== 'undefined') {
      const saveObj = {
        city: cityName || null,
        lat: null,
        lng: null,
        detectedAt: Date.now(),
        method: 'manual',
        version: CACHE_VERSION
      }
      localStorage.setItem('vidhyaan_location', JSON.stringify(saveObj))
    }
  },

  setDetectedCity: (cityName: string | null, lat: number | null, lng: number | null, method: DetectionMethodType) => {
    set((state) => {
      const active = state.manualCity || cityName
      return {
        detectedCity: cityName,
        activeCity: active,
        lat: state.manualCity ? null : lat,
        lng: state.manualCity ? null : lng,
        detectionMethod: method,
        loading: false,
        error: null,
        initialized: true
      }
    })
    if (typeof window !== 'undefined') {
      const saveObj = {
        city: cityName || null,
        lat: lat,
        lng: lng,
        detectedAt: Date.now(),
        method: method,
        version: CACHE_VERSION
      }
      localStorage.setItem('vidhyaan_location', JSON.stringify(saveObj))
    }
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error, loading: false }),
  setPermissionStatus: (permissionStatus: PermissionStatusType) => set({ permissionStatus }),
  setDetectionMethod: (detectionMethod: DetectionMethodType) => set({ detectionMethod }),
  setInitialized: (initialized: boolean) => set({ initialized }),
  
  restoreCachedLocation: (saved: any) => {
    set({
      manualCity: saved.method === 'manual' ? saved.city : null,
      detectedCity: saved.method === 'gps' || saved.method === 'cached' ? saved.city : null,
      activeCity: saved.city,
      lat: saved.lat,
      lng: saved.lng,
      detectionMethod: 'cached',
      permissionStatus: saved.method === 'gps' ? 'granted' : 'idle',
      loading: false,
      initialized: true
    })
  },

  resetLocation: () => set({
    manualCity: null,
    detectedCity: null,
    activeCity: null,
    lat: null,
    lng: null,
    loading: true,
    error: null,
    permissionStatus: 'idle',
    detectionMethod: null,
    initialized: false
  })
}))
export type { LocationState }
