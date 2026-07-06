import { create } from 'zustand'

export type PermissionStatusType = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
export type DetectionMethodType = 'gps' | 'manual' | 'cached' | null

export const CACHE_VERSION = 2
// Popular fallback list — the live list is hydrated from /api/public/locations
// (cities with published schools) and merged into store.supportedCities.
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

const cityInList = (list: string[], cityName: string) =>
  list.some((c) => c.toLowerCase() === cityName.toLowerCase())

interface LocationState {
  manualCity: string | null
  manualArea: string | null
  detectedCity: string | null
  detectedArea: string | null
  activeCity: string | null
  lat: number | null
  lng: number | null
  loading: boolean
  error: string | null
  permissionStatus: PermissionStatusType
  detectionMethod: DetectionMethodType
  initialized: boolean
  isSupportedCity: boolean
  supportedCities: string[]

  setSupportedCities: (cities: string[]) => void
  setManualCity: (cityName: string) => void
  setManualArea: (areaName: string | null) => void
  setDetectedCity: (cityName: string | null, areaName: string | null, lat: number | null, lng: number | null, method: DetectionMethodType) => void
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
  manualArea: null,
  detectedCity: null,
  detectedArea: null,
  activeCity: null,
  lat: null,
  lng: null,
  loading: true,
  error: null,
  permissionStatus: 'idle',
  detectionMethod: null,
  initialized: false,
  isSupportedCity: true,
  supportedCities: SUPPORTED_CITIES,

  setSupportedCities: (cities: string[]) => {
    set((state) => {
      // merge, dedupe case-insensitively, keep popular ordering first
      const merged = [...state.supportedCities]
      for (const c of cities) {
        if (!cityInList(merged, c)) merged.push(c)
      }
      // re-evaluate support of the currently detected city against new list
      const detected = state.detectedCity
      const isSupported = detected ? cityInList(merged, detected) : state.isSupportedCity
      return {
        supportedCities: merged,
        isSupportedCity: isSupported,
        activeCity: state.activeCity || (detected && isSupported ? detected : state.activeCity)
      }
    })
  },

  setManualCity: (cityName: string) => {
    set({
      manualCity: cityName,
      manualArea: null, // Clear manualArea on city change
      activeCity: cityName,
      lat: null,
      lng: null,
      detectionMethod: 'manual',
      loading: false,
      error: null,
      isSupportedCity: true
    })
    if (typeof window !== 'undefined') {
      const saveObj = {
        city: cityName || null,
        area: null,
        lat: null,
        lng: null,
        detectedAt: Date.now(),
        method: 'manual',
        version: CACHE_VERSION
      }
      localStorage.setItem('vidhyaan_location', JSON.stringify(saveObj))
    }
  },

  setManualArea: (areaName: string | null) => {
    set((state) => ({
      manualArea: areaName,
      loading: false,
      error: null
    }))
    if (typeof window !== 'undefined') {
      const savedStr = localStorage.getItem('vidhyaan_location')
      let saved: any = {}
      if (savedStr) {
        try {
          saved = JSON.parse(savedStr)
        } catch (e) {}
      }
      const saveObj = {
        ...saved,
        area: areaName || null,
        detectedAt: Date.now()
      }
      localStorage.setItem('vidhyaan_location', JSON.stringify(saveObj))
    }
  },

  setDetectedCity: (cityName: string | null, areaName: string | null, lat: number | null, lng: number | null, method: DetectionMethodType) => {
    set((state) => {
      const isSupported = cityName ? cityInList(state.supportedCities, cityName) : false
      const active = state.manualCity || (isSupported ? cityName : null)
      return {
        detectedCity: cityName,
        detectedArea: areaName,
        activeCity: active,
        lat: state.manualCity ? null : lat,
        lng: state.manualCity ? null : lng,
        detectionMethod: method,
        loading: false,
        error: null,
        initialized: true,
        isSupportedCity: isSupported
      }
    })
    if (typeof window !== 'undefined') {
      const saveObj = {
        city: cityName || null,
        detectedArea: areaName || null,
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
    set((state) => {
      const isSupported = saved.city ? cityInList(state.supportedCities, saved.city) : false
      return {
      manualCity: saved.method === 'manual' ? saved.city : null,
      manualArea: saved.method === 'manual' ? (saved.area || null) : null,
      detectedCity: saved.method === 'gps' || saved.method === 'cached' ? saved.city : null,
      detectedArea: saved.method === 'gps' || saved.method === 'cached' ? (saved.detectedArea || null) : null,
      activeCity: saved.city ? (isSupported || saved.method === 'manual' ? saved.city : null) : null,
      lat: saved.lat,
      lng: saved.lng,
      detectionMethod: 'cached',
      permissionStatus: saved.method === 'gps' ? 'granted' : 'idle',
      loading: false,
      initialized: true,
      isSupportedCity: isSupported
      }
    })
  },

  resetLocation: () => set({
    manualCity: null,
    manualArea: null,
    detectedCity: null,
    detectedArea: null,
    activeCity: null,
    lat: null,
    lng: null,
    loading: true,
    error: null,
    permissionStatus: 'idle',
    detectionMethod: null,
    initialized: false,
    isSupportedCity: true
  })
}))
export type { LocationState }
