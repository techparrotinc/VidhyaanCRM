"use client"

import React, { useState } from 'react'
import { Search, X, ChevronDown, Download, LayoutList, LayoutGrid } from 'lucide-react'
import { statusConfig, sourceConfig, statusLabels } from './leadConfig'

type DropdownKey = 'source' | 'status' | 'counsellor' | 'date'

type LeadFilterBarProps = {
  searchQuery: string
  onSearchInput: (value: string) => void
  onSearchClear: () => void
  filters: { source: string; status: string; counsellorId: string; search: string }
  onToggleSource: (source: string) => void
  onToggleStatus: (status: string) => void
  onToggleCounsellor: (counsellorId: string) => void
  counsellors: { id: string; name: string }[]
  filterDateRange: string | null
  onFilterDateRange: (value: string | null) => void
  activeView: 'list' | 'grid'
  onViewChange: (view: 'list' | 'grid') => void
  onClearAll: () => void
}

export default function LeadFilterBar({
  searchQuery,
  onSearchInput,
  onSearchClear,
  filters,
  onToggleSource,
  onToggleStatus,
  onToggleCounsellor,
  counsellors,
  filterDateRange,
  onFilterDateRange,
  activeView,
  onViewChange,
  onClearAll,
}: LeadFilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null)

  const toggle = (key: DropdownKey) =>
    setOpenDropdown(openDropdown === key ? null : key)

  const close = () => setOpenDropdown(null)

  const isAnyFilterActive = !!(
    filters.source || filters.status || filters.counsellorId || filters.search || searchQuery
  )

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 relative">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        {/* Row 1 (Mobile/Tablet Search, inline on Desktop) */}
        <div className="w-full lg:w-auto">
          <div className="relative flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-4 py-2 w-full lg:w-64">
            <Search className="size-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => onSearchInput(e.target.value)}
              className="bg-transparent border-0 outline-none text-sm text-slate-700 placeholder-slate-500 w-full font-sans"
            />
            {searchQuery && (
              <button
                onClick={onSearchClear}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2/3 Groupings */}
        <div className="w-full lg:w-auto flex flex-col md:flex-row md:items-center gap-3">
          {/* Mobile Row 2: Source & Status */}
          <div className="grid grid-cols-2 md:flex md:items-center gap-3 w-full md:w-auto">
            {/* Source Dropdown */}
            <div className="relative w-full">
              <button
                onClick={() => toggle('source')}
                className="flex items-center justify-between md:justify-start gap-1.5 w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer min-h-[38px] font-sans"
              >
                <span className="truncate">{filters.source ? `Source: ${filters.source}` : 'Source'}</span>
                <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
              </button>
              {openDropdown === 'source' && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 font-sans">
                  {Object.keys(sourceConfig).map(source => (
                    <button
                      key={source}
                      onClick={() => {
                        onToggleSource(source)
                        close()
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filters.source === source ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative w-full">
              <button
                onClick={() => toggle('status')}
                className="flex items-center justify-between md:justify-start gap-1.5 w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer min-h-[38px] font-sans"
              >
                <span className="truncate">{filters.status ? `Status: ${statusLabels[filters.status] || filters.status}` : 'Status'}</span>
                <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
              </button>
              {openDropdown === 'status' && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 font-sans">
                  {Object.keys(statusConfig).map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        onToggleStatus(status)
                        close()
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filters.status === status ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                    >
                      {statusLabels[status] || status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Row 3: Counsellor + Date + Export + Toggle */}
          <div className="grid grid-cols-2 min-[480px]:flex min-[480px]:items-center gap-3 w-full md:w-auto">
            {/* Counsellor Dropdown */}
            <div className="relative w-full min-[480px]:w-auto">
              <button
                onClick={() => toggle('counsellor')}
                className="flex items-center justify-between min-[480px]:justify-start gap-1.5 w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer min-h-[38px] font-sans"
              >
                <span className="truncate">
                  {filters.counsellorId
                    ? `Counsellor: ${counsellors.find((c) => c.id === filters.counsellorId)?.name ?? 'Counsellor'}`
                    : 'Counsellor'}
                </span>
                <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
              </button>
              {openDropdown === 'counsellor' && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 font-sans animate-fade-in">
                  {counsellors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onToggleCounsellor(c.id)
                        close()
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filters.counsellorId === c.id ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Dropdown */}
            <div className="relative w-full min-[480px]:w-auto">
              <button
                onClick={() => toggle('date')}
                className="flex items-center justify-between min-[480px]:justify-start gap-1.5 w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 cursor-pointer min-h-[38px] font-sans"
              >
                <span className="truncate">{filterDateRange ? `Date: ${filterDateRange === 'May' ? 'May' : 'Apr'}` : 'Date Range'}</span>
                <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
              </button>
              {openDropdown === 'date' && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 font-sans">
                  <button
                    onClick={() => {
                      onFilterDateRange(filterDateRange === 'May' ? null : 'May')
                      close()
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filterDateRange === 'May' ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                  >
                    May 2026
                  </button>
                  <button
                    onClick={() => {
                      onFilterDateRange(filterDateRange === 'Apr' ? null : 'Apr')
                      close()
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filterDateRange === 'Apr' ? 'text-[#1565D8] font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                  >
                    April 2026
                  </button>
                </div>
              )}
            </div>

            {/* Export Button */}
            <button className="flex items-center justify-center gap-1.5 border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition min-h-[38px] cursor-pointer w-full min-[480px]:w-auto font-sans">
              <Download className="size-3.5 text-slate-500 shrink-0" />
              <span>Export</span>
            </button>

            {/* Toggle View */}
            <div className="flex items-center justify-center bg-slate-100 rounded-lg p-1 gap-1 w-full min-[480px]:w-auto">
              <button
                onClick={() => onViewChange('list')}
                className={`rounded-md p-1.5 transition-all duration-150 flex-1 min-[480px]:flex-none flex justify-center ${
                  activeView === 'list' ? 'bg-white shadow-sm' : 'bg-transparent hover:bg-slate-200'
                }`}
                title="List view"
              >
                <LayoutList
                  className={`size-4 ${
                    activeView === 'list' ? 'text-[#1565D8]' : 'text-slate-400'
                  }`}
                />
              </button>
              <button
                onClick={() => onViewChange('grid')}
                className={`rounded-md p-1.5 transition-all duration-150 flex-1 min-[480px]:flex-none flex justify-center ${
                  activeView === 'grid' ? 'bg-white shadow-sm' : 'bg-transparent hover:bg-slate-200'
                }`}
                title="Grid view"
              >
                <LayoutGrid
                  className={`size-4 ${
                    activeView === 'grid' ? 'text-[#1565D8]' : 'text-slate-400'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Clear filters link */}
          {isAnyFilterActive && (
            <button
              onClick={onClearAll}
              className="text-sm font-semibold text-slate-400 hover:text-red-500 cursor-pointer flex items-center justify-center gap-1 transition-colors py-2 md:py-0"
            >
              <X className="size-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

      </div>
    </section>
  )
}
