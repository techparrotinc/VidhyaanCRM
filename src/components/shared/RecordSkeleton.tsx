import React from 'react'

export default function RecordSkeleton() {
  const fields = Array.from({ length: 4 })

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top section skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 animate-pulse">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="w-48 h-6 bg-slate-200 rounded" />
          <div className="w-32 h-4 bg-slate-200 rounded" />
          <div className="flex gap-2 pt-1">
            <div className="w-20 h-6 bg-slate-200 rounded-full" />
            <div className="w-20 h-6 bg-slate-200 rounded-full" />
            <div className="w-20 h-6 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr_280px] gap-6">
        {/* Left Column Skeleton */}
        <div className="space-y-4 col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-4">
            {fields.map((_, i) => (
              <div key={i} className="space-y-1.5 animate-pulse">
                <div className="w-24 h-3 bg-slate-200 rounded" />
                <div className="w-full h-10 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Center Column Skeleton */}
        <div className="space-y-4 col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-4">
            {fields.map((_, i) => (
              <div key={i} className="space-y-1.5 animate-pulse">
                <div className="w-24 h-3 bg-slate-200 rounded" />
                <div className="w-full h-10 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="space-y-4 col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-4 animate-pulse">
            <div className="w-24 h-3 bg-slate-200 rounded" />
            <div className="w-full h-10 bg-slate-200 rounded-lg" />
            <div className="w-full h-10 bg-slate-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
