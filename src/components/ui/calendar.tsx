"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarProps {
  mode?: "single"
  selected?: string | Date
  onSelect?: (date: Date) => void
  initialFocus?: boolean
}

export function Calendar({
  selected,
  onSelect,
}: CalendarProps) {
  const selectedDate = selected ? new Date(selected) : null
  const [viewDate, setViewDate] = React.useState(() => selectedDate || new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = []

  // Prev month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, isCurrentMonth: false, dateStr })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, isCurrentMonth: true, dateStr })
  }

  // Next month padding
  const totalCells = 42
  const nextPadding = totalCells - cells.length
  for (let d = 1; d <= nextPadding; d++) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, isCurrentMonth: false, dateStr })
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setViewDate(new Date(year, month + 1, 1))
  }

  return (
    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-lg w-[260px]">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={handlePrev}
          className="p-1 rounded-md hover:bg-slate-100 transition text-slate-500"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-bold text-slate-800">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={handleNext}
          className="p-1 rounded-md hover:bg-slate-100 transition text-slate-500"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <span key={d}>{d}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          const isSelected = selectedDate &&
            selectedDate.getFullYear() === new Date(cell.dateStr).getFullYear() &&
            selectedDate.getMonth() === new Date(cell.dateStr).getMonth() &&
            selectedDate.getDate() === new Date(cell.dateStr).getDate()

          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (onSelect) {
                  onSelect(new Date(cell.dateStr))
                }
              }}
              className={`h-7 w-7 text-xs rounded-md flex items-center justify-center transition cursor-pointer ${
                isSelected
                  ? "bg-[#1565D8] text-white font-bold"
                  : cell.isCurrentMonth
                  ? "text-slate-700 hover:bg-slate-100"
                  : "text-slate-350 hover:bg-slate-100"
              }`}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
