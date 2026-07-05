import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Welcome / header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* KPI cards row */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-6 xl:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[160px] w-full rounded-xl" />
        ))}
      </section>

      {/* Pipeline + fee section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </section>

      {/* Lower row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </section>
    </div>
  )
}
