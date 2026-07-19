"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { usePopoverClose } from "@/components/ui/popover"
import { AppSelect } from "@/components/ui/app-select"

interface CalendarProps {
  mode?: "single"
  selected?: string | Date
  onSelect?: (date: Date) => void
  initialFocus?: boolean
  /** Drop the own border/shadow chrome when a parent popup already draws one
      (DateTimePicker) — prevents the double-box look. */
  bare?: boolean
}

export function Calendar({
  selected,
  onSelect,
  bare = false,
}: CalendarProps) {
  const selectedDate = selected ? new Date(selected) : null
  const [viewDate, setViewDate] = React.useState(() => selectedDate || new Date())
  // Inside a Popover (DOB pickers etc.) a day pick closes it; elsewhere no-op.
  const closePopover = usePopoverClose()

  React.useEffect(() => {
    if (selected) {
      setViewDate(new Date(selected))
    }
  }, [selected])

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

  // Jumpable range: old enough for dates of birth, far enough ahead for
  // event scheduling.
  const currentYear = new Date().getFullYear()
  const yearOptions: number[] = []
  for (let y = currentYear + 5; y >= 1950; y--) yearOptions.push(y)
  if (!yearOptions.includes(year)) {
    yearOptions.push(year)
    yearOptions.sort((a, b) => b - a)
  }

  const headerSelect =
    'w-full bg-transparent text-xs font-bold text-slate-800 rounded-md px-1.5 py-0.5 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-[#1565D8]/30 cursor-pointer'

  return (
    <div className={bare ? 'w-[260px]' : 'p-3 bg-white border border-slate-200 rounded-xl shadow-lg w-[260px]'}>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={handlePrev}
          className="p-1 rounded-md hover:bg-slate-100 transition text-slate-500"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
          <div className="w-[96px]">
            <AppSelect
              aria-label="Month"
              value={month}
              onChange={e => setViewDate(new Date(year, Number(e.target.value), 1))}
              className={headerSelect}
            >
              {monthNames.map((name, i) => (
                <option key={name} value={i}>{name}</option>
              ))}
            </AppSelect>
          </div>
          <div className="w-[72px]">
            <AppSelect
              aria-label="Year"
              value={year}
              onChange={e => setViewDate(new Date(Number(e.target.value), month, 1))}
              className={headerSelect}
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </AppSelect>
          </div>
        </div>
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
                closePopover?.()
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
