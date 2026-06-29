import TableSkeleton from '@/components/shared/TableSkeleton'

export default function Loading() {
  return (
    <div className="p-6">
      <TableSkeleton rows={8} />
    </div>
  )
}
