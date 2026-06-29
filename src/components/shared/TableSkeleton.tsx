import React from 'react'

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export default function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  const rowArray = Array.from({ length: rows })
  const colArray = Array.from({ length: columns })

  const getCellSkeleton = (colIndex: number) => {
    switch (colIndex) {
      case 0:
        return <div className="w-3/4 h-4 bg-slate-200 rounded-md animate-pulse" />
      case 1:
        return <div className="w-16 h-6 bg-slate-200 rounded-full animate-pulse" />
      case 2:
        return <div className="w-1/2 h-4 bg-slate-200 rounded-md animate-pulse" />
      case 3:
        return <div className="w-2/3 h-4 bg-slate-200 rounded-md animate-pulse" />
      case 4:
        return <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
      default:
        return <div className="w-1/2 h-4 bg-slate-200 rounded-md animate-pulse" />
    }
  }

  const getHeaderCellWidth = (colIndex: number) => {
    const widths = ['w-24', 'w-16', 'w-20', 'w-28', 'w-12']
    return widths[colIndex % widths.length]
  }

  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header Row */}
      <div className="flex items-center h-12 bg-slate-50 border-b border-slate-200 px-4 md:px-6">
        {colArray.map((_, i) => (
          <div key={i} className="flex-1 min-w-0 pr-4">
            <div className={`h-3 bg-slate-200 rounded animate-pulse ${getHeaderCellWidth(i)}`} />
          </div>
        ))}
      </div>

      {/* Data Rows */}
      <div className="divide-y divide-slate-100">
        {rowArray.map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={`flex items-center h-14 px-4 md:px-6 ${
              rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'
            }`}
          >
            {colArray.map((_, colIndex) => (
              <div key={colIndex} className="flex-1 min-w-0 pr-4 flex items-center">
                {getCellSkeleton(colIndex)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
