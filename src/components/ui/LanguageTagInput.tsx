'use client'

import React, { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface LanguageTagInputProps {
  value: string[]
  onChange: (values: string[]) => void
  options: Option[]
  placeholder?: string
}

export function LanguageTagInput({
  value,
  onChange,
  options,
  placeholder,
}: LanguageTagInputProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const selectedOptions = options.filter((opt) => value.includes(opt.value))
  // Filter out options already selected
  const unselectedOptions = options.filter((opt) => !value.includes(opt.value))
  // Filter remaining by search
  const filteredOptions = unselectedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const handleRemove = (valToRemove: string) => {
    onChange(value.filter((v) => v !== valToRemove))
  }

  const handleSelect = (valToAdd: string) => {
    onChange([...value, valToAdd])
    setSearch('')
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="border border-slate-200 rounded-lg min-h-[36px] px-2.5 py-1 flex flex-wrap gap-1 items-center cursor-text focus-within:border-[#1565D8] focus-within:ring-1 focus-within:ring-blue-100 bg-white"
        onClick={() => {
          // Focus the input if the container is clicked
          const inputEl = containerRef.current?.querySelector('input')
          if (inputEl) inputEl.focus()
        }}
      >
        {selectedOptions.map((opt) => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 bg-slate-100 text-slate-900 border border-slate-250 text-[10px] font-extrabold px-1.5 py-0.5 rounded"
          >
            {opt.label}
            <button
              type="button"
              className="ml-0.5 text-slate-400 hover:text-red-650 cursor-pointer font-bold text-xs"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove(opt.value)
              }}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          className="flex-1 min-w-[120px] outline-none text-xs text-slate-900 font-semibold bg-transparent placeholder:text-slate-400 placeholder:font-normal"
          placeholder={
            value.length === 0
              ? (placeholder ?? 'Search languages...')
              : ''
          }
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className="px-3 py-1.5 text-xs text-slate-900 font-extrabold hover:bg-slate-50 cursor-pointer"
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-slate-400 text-center font-medium">
              No languages found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
