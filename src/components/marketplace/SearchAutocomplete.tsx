'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'

interface Suggestion {
  id: string
  name: string
  locations?: { city: string }[]
}

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  institutionType: 'SCHOOL' | 'LEARNING_CENTER'
  placeholder: string
  className?: string
}

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  institutionType,
  placeholder,
  className
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Debounced search logic
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (value.trim().length < 2) {
      setSuggestions([])
      setIsOpen(false)
      setHighlightedIndex(-1)
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [value, institutionType])

  const fetchSuggestions = async (searchQuery: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    setIsLoading(true)

    try {
      const res = await fetch(
        `/api/public/schools?search=${encodeURIComponent(searchQuery)}&institutionType=${institutionType}&limit=6`,
        { signal: controller.signal }
      )
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setSuggestions(json.data || [])
          setIsOpen(true)
          setHighlightedIndex(-1)
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Autocomplete fetch error:', err)
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSubmit(value)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1 >= suggestions.length ? 0 : prev + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 < 0 ? suggestions.length - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        const selected = suggestions[highlightedIndex]
        onChange(selected.name)
        onSubmit(selected.name)
        setIsOpen(false)
      } else {
        onSubmit(value)
      }
    }
  }

  const handleSuggestionClick = (name: string) => {
    onChange(name)
    onSubmit(name)
    setIsOpen(false)
  }

  return (
    <div className="relative w-full flex items-center" ref={containerRef}>
      <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (value.trim().length >= 2 && suggestions.length > 0) {
            setIsOpen(true)
          }
        }}
        placeholder={placeholder}
        className={className}
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-[999] overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-slate-400 text-xs font-semibold select-none">
              No matches found
            </div>
          ) : (
            suggestions.map((item, idx) => {
              const city = item.locations?.[0]?.city || ''
              const isHighlighted = idx === highlightedIndex
              return (
                <div
                  key={item.id}
                  onClick={() => handleSuggestionClick(item.name)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-4 py-2.5 text-xs font-semibold cursor-pointer transition select-none flex items-center justify-between ${
                    isHighlighted ? 'bg-slate-50 text-[#1565D8]' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  {city && (
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                      — {city}
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
