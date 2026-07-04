'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, ChevronDown, Search, X, Building, Loader2 } from 'lucide-react'
import { useLocation, SUPPORTED_CITIES } from '@/hooks/useLocation'
import { CITY_AREAS } from '@/constants/locationAreas'

interface LocationSelectorProps {
  className?: string
}

export default function LocationSelector({ className }: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAllCities, setShowAllCities] = useState(false)
  const [locSearch, setLocSearch] = useState('')
  const [locSuggestions, setLocSuggestions] = useState<any[]>([])

  const {
    city,
    gpsCity,
    detectedArea,
    loading: locationLoading,
    requestLocation,
    setManualCity,
    setManualArea
  } = useLocation()

  const activeCityName = city || gpsCity

  useEffect(() => {
    if (locSearch.trim().length < 2) {
      setLocSuggestions([])
      return
    }

    const normalizedQuery = locSearch.toLowerCase().trim()
    const results: any[] = []
    
    // Match cities first
    for (const cityName of Object.keys(CITY_AREAS)) {
      if (cityName.toLowerCase().includes(normalizedQuery)) {
        results.push({
          type: 'city',
          name: cityName,
          displayName: cityName,
          cityName: cityName
        })
      }
    }

    // Match areas second
    for (const [cityName, areas] of Object.entries(CITY_AREAS)) {
      for (const area of areas) {
        if (area.toLowerCase().includes(normalizedQuery)) {
          results.push({
            type: 'area',
            name: area,
            displayName: `${area} · ${cityName}`,
            cityName: cityName
          })
        }
      }
    }

    setLocSuggestions(results.slice(0, 10))
  }, [locSearch])

  const handleSelectLocSuggestion = (suggestion: any) => {
    setManualCity(suggestion.cityName)
    if (suggestion.type === 'area') {
      setManualArea(suggestion.name)
    } else {
      setManualArea(null)
    }
    setIsOpen(false)
    setLocSearch('')
  }

  const handleSelectCity = (cityName: string) => {
    setManualCity(cityName)
    setManualArea(null)
    setIsOpen(false)
  }


  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 cursor-pointer text-slate-700 text-xs font-bold hover:bg-slate-100 hover:border-slate-350 transition-all select-none h-full outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">
            {city ? (
              city === gpsCity && detectedArea
                ? `${detectedArea}, ${city}`
                : city
            ) : "Select City"}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />

          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-tight">Choose your location</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Search by area, locality or city</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="relative">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Search className="w-4 h-4 text-slate-450 shrink-0 mr-2" />
                  <input
                    type="text"
                    value={locSearch}
                    onChange={(e) => setLocSearch(e.target.value)}
                    placeholder="Search area, locality or city (e.g. Velachery)..."
                    className="bg-transparent border-0 outline-none text-slate-700 text-xs placeholder-slate-400 w-full font-medium"
                  />
                </div>

                {locSearch.trim().length >= 2 && locSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto py-1.5 flex flex-col gap-0.5">
                    {locSuggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.type}-${suggestion.name}-${index}`}
                        type="button"
                        onClick={() => handleSelectLocSuggestion(suggestion)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition flex items-center gap-2.5 cursor-pointer focus:outline-none"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-700">{suggestion.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}

                {locSearch.trim().length >= 2 && locSuggestions.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 px-3 py-2.5 text-xs text-slate-400 font-semibold">
                    No areas found, try a different search
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-[#1565D8]/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#1565D8]" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Detected near you</div>
                    <div className="text-xs font-black text-slate-800 truncate mt-1">
                      {detectedArea && gpsCity ? `${detectedArea}, ${gpsCity}` : (gpsCity || "No location detected")}
                    </div>
                  </div>
                </div>
                {gpsCity ? (
                  <button
                    type="button"
                    onClick={() => handleSelectCity(gpsCity)}
                    className="bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shrink-0 transition cursor-pointer"
                  >
                    Use this
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => requestLocation()}
                    className="bg-[#1565D8] hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shrink-0 transition cursor-pointer"
                  >
                    Enable
                  </button>
                )}
              </div>

              {activeCityName && CITY_AREAS[activeCityName] && CITY_AREAS[activeCityName].length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Areas in {activeCityName}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {CITY_AREAS[activeCityName].map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setLocSearch(area)}
                        className="px-2.5 py-1 rounded-full border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-650 hover:text-slate-900 transition cursor-pointer focus:outline-none"
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Popular Cities</span>
                  <button
                    type="button"
                    onClick={() => setShowAllCities(!showAllCities)}
                    className="text-[10px] text-[#1565D8] font-black uppercase hover:underline cursor-pointer focus:outline-none"
                  >
                    {showAllCities ? "Show Less" : `Show all ${SUPPORTED_CITIES.length} cities`}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {(showAllCities ? SUPPORTED_CITIES : SUPPORTED_CITIES.slice(0, 4)).map((cityName) => {
                    const isSelected = city === cityName
                    return (
                      <button
                        key={cityName}
                        type="button"
                        onClick={() => handleSelectCity(cityName)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition cursor-pointer focus:outline-none ${
                          isSelected 
                            ? "bg-[#1565D8]/5 border-[#1565D8] text-[#1565D8]" 
                            : "bg-white border-slate-200 hover:border-slate-350 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <Building className="w-4 h-4 shrink-0 text-slate-400" />
                          <span className="text-xs font-black truncate">{cityName}</span>
                        </div>
                        {isSelected && <span className="text-[10px] font-extrabold uppercase tracking-wide">Selected</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
