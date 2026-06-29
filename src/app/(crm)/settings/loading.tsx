import { FormSkeleton } from '@/components/shared/FormSkeleton'

export default function Loading() {
  return (
    <div className="p-6 flex flex-col md:flex-row gap-6">
      {/* Left column skeleton */}
      <div className="w-full md:w-[220px] shrink-0 space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-20 mb-4" />
        <div className="h-9 bg-slate-200 rounded-lg" />
        <div className="h-9 bg-slate-200 rounded-lg" />
        <div className="h-9 bg-slate-200 rounded-lg" />
        <div className="h-9 bg-slate-200 rounded-lg" />
      </div>

      {/* Right column skeleton */}
      <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
        <FormSkeleton />
      </div>
    </div>
  )
}
