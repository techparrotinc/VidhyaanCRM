"use client"

import React, { useState, useEffect, useRef } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

interface DateSelectorProps {
  value: string // YYYY-MM-DD format
  onChange: (date: string) => void
  placeholder?: string
  className?: string
}

export default function DateSelector({
  value,
  onChange,
  placeholder = "Select date",
  className = ""
}: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Current calendar view month and year
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) return d
    }
    return new Date()
  })

  // Sync view date if value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setViewDate(d)
      }
    }
  }, [value])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth() // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  // Get total days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Get starting day index of the month (0 = Sunday, 1 = Monday...)
  const firstDayIndex = new Date(year, month, 1).getDay()

  // Prev month info
  const prevMonthDays = new Date(year, month, 0).getDate()

  // Generate calendar days
  const calendarCells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = []

  // Padding days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarCells.push({ day: d, isCurrentMonth: false, dateStr })
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarCells.push({ day: d, isCurrentMonth: true, dateStr })
  }

  // Padding days for next month to complete 6 rows (42 cells)
  const totalCells = 42
  const nextMonthPadding = totalCells - calendarCells.length
  for (let d = 1; d <= nextMonthPadding; d++) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarCells.push({ day: d, isCurrentMonth: false, dateStr })
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleSelectDay = (dateStr: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(dateStr)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setIsOpen(false)
  }

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation()
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    onChange(todayStr)
    setViewDate(today)
    setIsOpen(false)
  }

  // Formatting selected date display text: "24 Jun 2026"
  const getDisplayText = () => {
    if (!value) return placeholder
    const d = new Date(value)
    if (isNaN(d.getTime())) return placeholder
    const day = d.getDate()
    const mStr = d.toLocaleString('en-US', { month: 'short' })
    const y = d.getFullYear()
    return `${day} ${mStr} ${y}`
  }

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white hover:border-slate-300 focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 transition duration-150 text-left outline-none cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays size={14} className="text-slate-400 flex-shrink-0" />
          <span className={`truncate text-sm ${value ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
            {getDisplayText()}
          </span>
        </div>
        <ChevronDown size={14} className="text-slate-400 flex-shrink-0 ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 z-[9999] bg-white rounded-xl border border-slate-200 shadow-xl p-4 w-[280px] select-none animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-3.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-slate-800">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekDays.map(d => (
              <span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {d}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const isSelected = value === cell.dateStr
              const isToday = todayStr === cell.dateStr

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => handleSelectDay(cell.dateStr, e)}
                  className={`w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-lg transition duration-100 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1565D8] text-white hover:bg-[#1150ad]'
                      : isToday
                      ? 'bg-blue-50 text-[#1565D8] border border-[#1565D8]/20 hover:bg-blue-100'
                      : cell.isCurrentMonth
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-slate-100 mt-3 pt-3">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-xs font-bold text-[#1565D8] hover:underline transition"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
