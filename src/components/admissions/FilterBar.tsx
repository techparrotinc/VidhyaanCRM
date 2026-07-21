"use client"

import React, { useState } from 'react'
import { Search, X, Check, List, LayoutGrid, Columns } from 'lucide-react'
import { getGradeLabel } from '@/constants/grades'
import { config, type } from '@/lib/admission-settings-config'

type ViewMode = 'list' | 'grid' | 'kanban'
type DropdownKey = 'applyingFor' | 'counsellor' | 'date' | 'priority'

type FilterBarProps = {
  /** 'list' = embedded row inside the list card; 'standalone' = card above grid/kanban */
  variant: 'list' | 'standalone'
  searchQuery: string
  onSearchInput: (value: string) => void
  onSearchClear: () => void
  applyingForOptions: string[]
  filterApplyingFor: string | null
  onFilterApplyingFor: (value: string | null) => void
  counsellors: { id: string; name: string }[]
  filterCounsellor: string | null
  onFilterCounsellor: (value: string | null) => void
  filterDateRange: string | null
  onFilterDateRange: (value: string | null) => void
  filterPriority: string | null
  onFilterPriority: (value: string | null) => void
  isAnyFilterActive: boolean
  onClearAll: () => void
  activeView: ViewMode
  onViewChange: (view: ViewMode) => void
}

const DATE_OPTIONS = [
  { value: 'May', label: 'May 2026' },
  { value: 'Apr', label: 'April 2026' },
]

const PRIORITY_OPTIONS = ['Normal', 'High', 'Urgent']

export default function FilterBar(props: FilterBarProps) {
  const {
    variant,
    searchQuery,
    onSearchInput,
    onSearchClear,
    isAnyFilterActive,
    onClearAll,
    activeView,
    onViewChange,
  } = props

  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null)

  const toggle = (key: DropdownKey) =>
    setOpenDropdown(openDropdown === key ? null : key)

  const isList = variant === 'list'

  const filterButtonClass = `${isList ? 'flex-shrink-0 whitespace-nowrap ' : ''}flex items-center justify-between w-full sm:w-auto bg-white border border-slate-300 rounded-lg px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer font-sans h-10 sm:h-9`
  const dropdownItemClass = (active: boolean) =>
    `px-3 py-1.5 text-xs rounded-lg cursor-pointer font-medium flex items-center justify-between ${
      active ? 'bg-blue-50 text-[#1565D8]' : 'text-slate-700 hover:bg-slate-50'
    }`
  const dropdownAllClass = 'px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer font-medium'
  const filterWrapClass = `relative w-full sm:w-auto${isList ? ' flex-shrink-0' : ''}`

  const select = (setter: (v: string | null) => void, value: string | null) => {
    setter(value)
    setOpenDropdown(null)
  }

  const searchInput = (
    <>
      <Search size={15} className="text-slate-400" strokeWidth={1.5} />
      <input
        type="text"
        placeholder={`Search by name, ID, ${config.applyingForLabel[type]}...`}
        value={searchQuery}
        onChange={(e) => onSearchInput(e.target.value)}
        className="bg-transparent border-none outline-none text-sm w-full text-slate-750 placeholder-slate-500 font-sans"
      />
      {searchQuery && (
        <button onClick={onSearchClear} className="text-slate-400 hover:text-slate-650">
          <X size={14} />
        </button>
      )}
    </>
  )

  const filterButtons = (
    <>
      {/* Applying For */}
      <div className={filterWrapClass}>
        <button onClick={() => toggle('applyingFor')} className={filterButtonClass}>
          <span>{props.filterApplyingFor ? `${config.applyingForLabel[type]}: ${getGradeLabel(props.filterApplyingFor)}` : `${config.applyingForLabel[type]} ▾`}</span>
        </button>
        {openDropdown === 'applyingFor' && (
          <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px] max-h-48 overflow-y-auto w-full sm:w-auto">
            <div
              onClick={() => select(props.onFilterApplyingFor, null)}
              className={dropdownAllClass}
            >
              All Classes
            </div>
            {props.applyingForOptions.map((option) => (
              <div
                key={option}
                onClick={() => select(props.onFilterApplyingFor, option)}
                className={dropdownItemClass(props.filterApplyingFor === option)}
              >
                <span>{getGradeLabel(option)}</span>
                {props.filterApplyingFor === option && <Check size={12} className="text-[#1565D8]" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Counsellor */}
      <div className={filterWrapClass}>
        <button onClick={() => toggle('counsellor')} className={filterButtonClass}>
          <span>{props.filterCounsellor ? `Counsellor: ${props.filterCounsellor}` : 'Counsellor ▾'}</span>
        </button>
        {openDropdown === 'counsellor' && (
          <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px] w-full sm:w-auto">
            <div
              onClick={() => select(props.onFilterCounsellor, null)}
              className={dropdownAllClass}
            >
              All Counsellors
            </div>
            {props.counsellors.map((c) => (
              <div
                key={c.id}
                onClick={() => select(props.onFilterCounsellor, c.name)}
                className={dropdownItemClass(props.filterCounsellor === c.name)}
              >
                <span>{c.name}</span>
                {props.filterCounsellor === c.name && <Check size={12} className="text-[#1565D8]" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className={filterWrapClass}>
        <button onClick={() => toggle('date')} className={filterButtonClass}>
          <span>{props.filterDateRange ? `Date: ${props.filterDateRange}` : 'Date Range ▾'}</span>
        </button>
        {openDropdown === 'date' && (
          <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[140px] w-full sm:w-auto">
            <div
              onClick={() => select(props.onFilterDateRange, null)}
              className={dropdownAllClass}
            >
              All Time
            </div>
            {DATE_OPTIONS.map(({ value, label }) => (
              <div
                key={value}
                onClick={() => select(props.onFilterDateRange, value)}
                className={dropdownItemClass(props.filterDateRange === value)}
              >
                <span>{label}</span>
                {props.filterDateRange === value && <Check size={12} className="text-[#1565D8]" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Priority */}
      <div className={filterWrapClass}>
        <button onClick={() => toggle('priority')} className={filterButtonClass}>
          <span>{props.filterPriority ? `Priority: ${props.filterPriority}` : 'Priority ▾'}</span>
        </button>
        {openDropdown === 'priority' && (
          <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[140px] w-full sm:w-auto">
            <div
              onClick={() => select(props.onFilterPriority, null)}
              className={dropdownAllClass}
            >
              All Priorities
            </div>
            {PRIORITY_OPTIONS.map((p) => (
              <div
                key={p}
                onClick={() => select(props.onFilterPriority, p)}
                className={dropdownItemClass(props.filterPriority === p)}
              >
                <span>{p}</span>
                {props.filterPriority === p && <Check size={12} className="text-[#1565D8]" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {isAnyFilterActive && (
        <button
          onClick={onClearAll}
          className={`${isList ? 'flex-shrink-0 whitespace-nowrap ' : ''}text-xs font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 px-1.5 py-1.5 font-sans cursor-pointer w-full sm:w-auto justify-center sm:justify-start`}
        >
          <X size={13} />
          Clear Filters
        </button>
      )}
    </>
  )

  const viewToggle = (
    <div className={isList
      ? 'flex items-center bg-slate-100 rounded-lg p-1 gap-1 flex-shrink-0 ml-auto'
      : 'flex items-center bg-slate-100 rounded-lg p-1 gap-1 w-full sm:w-auto justify-center sm:justify-start'}>
      {/* List */}
      <button
        onClick={() => onViewChange('list')}
        className={`rounded-md p-1.5 transition-all duration-150 cursor-pointer ${
          activeView === 'list' ? 'bg-white shadow-sm' : 'bg-transparent hover:bg-slate-200'
        }`}
      >
        <List size={16} strokeWidth={1.5} className={activeView === 'list' ? 'text-[#1565D8]' : 'text-slate-400'} />
      </button>

      {/* Grid */}
      <button
        onClick={() => onViewChange('grid')}
        className={`hidden sm:inline-flex rounded-md p-1.5 transition-all duration-150 cursor-pointer ${
          activeView === 'grid' ? 'bg-white shadow-sm' : 'bg-transparent hover:bg-slate-200'
        }`}
      >
        <LayoutGrid size={16} strokeWidth={1.5} className={activeView === 'grid' ? 'text-[#1565D8]' : 'text-slate-400'} />
      </button>

      {/* Kanban */}
      <button
        onClick={() => onViewChange('kanban')}
        className={`rounded-md p-1.5 transition-all duration-150 cursor-pointer ${
          activeView === 'kanban' ? 'bg-white shadow-sm' : 'bg-transparent hover:bg-slate-200'
        }`}
      >
        <Columns size={16} strokeWidth={1.5} className={activeView === 'kanban' ? 'text-[#1565D8]' : 'text-slate-400'} />
      </button>
    </div>
  )

  if (isList) {
    // Single row: compact search + inline filters + view toggle.
    // NOTE: no overflow-x wrapper here — a scroll container clips the
    // absolutely-positioned filter dropdowns (overflow-x:auto forces
    // overflow-y:auto), which made the filters appear non-functional.
    return (
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100 bg-white w-full">
        {/* Search — grows to fill the row, filters follow on the same line */}
        <div className="relative flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-4 w-full sm:w-auto sm:flex-1 sm:min-w-[280px] sm:max-w-[460px] h-10 sm:h-9">
          {searchInput}
        </div>

        {/* Filters — inline on the same line */}
        {filterButtons}

        {/* View toggle — pushed to the far right */}
        {viewToggle}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-3 sm:p-4 flex flex-col sm:flex-row gap-2 flex-wrap border-t-2 border-t-slate-300 items-start sm:items-center justify-between mx-4 mb-4">
      {/* Search Input */}
      <div className="relative flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-4 flex-1 min-w-0 max-w-xs sm:max-w-sm h-10 sm:h-9">
        {searchInput}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto relative">
        {filterButtons}
      </div>

      {/* Right group */}
      <div className="flex gap-2 flex-wrap w-full sm:w-auto justify-end mt-2 sm:mt-0">
        {viewToggle}
      </div>
    </div>
  )
}
