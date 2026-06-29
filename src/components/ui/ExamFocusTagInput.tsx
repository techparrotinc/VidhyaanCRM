'use client'

import React, { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface ExamFocusTagInputProps {
  value: string[]
  onChange: (values: string[]) => void
  options: Option[]
  placeholder?: string
}

export function ExamFocusTagInput({
  value,
  onChange,
  options,
  placeholder,
}: ExamFocusTagInputProps) {
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
        className="border border-slate-200 rounded-lg min-h-[42px] px-3 py-2 flex flex-wrap gap-1.5 items-center cursor-text focus-within:ring-2 focus-within:ring-amber-500 bg-white"
        onClick={() => {
          // Focus the input if the container is clicked
          const inputEl = containerRef.current?.querySelector('input')
          if (inputEl) inputEl.focus()
        }}
      >
        {selectedOptions.map((opt) => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full"
          >
            {opt.label}
            <button
              type="button"
              className="ml-0.5 text-amber-400 hover:text-amber-700 cursor-pointer font-bold text-sm"
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
          className="flex-1 min-w-[120px] outline-none text-sm text-slate-700 bg-transparent placeholder:text-slate-400"
          placeholder={
            value.length === 0
              ? (placeholder ?? 'Search exam or course focus...')
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
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className="px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 cursor-pointer"
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-slate-400 text-center">
              No exams found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
