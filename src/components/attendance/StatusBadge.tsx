import { Badge } from '@/components/ui/badge'

export type AttendanceStatusValue = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY'

export const STATUS_META: Record<
  AttendanceStatusValue,
  { label: string; short: string; badge: string; cell: string }
> = {
  PRESENT: {
    label: 'Present', short: 'P',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cell: 'bg-emerald-500'
  },
  ABSENT: {
    label: 'Absent', short: 'A',
    badge: 'bg-red-50 text-red-700 border-red-200',
    cell: 'bg-red-500'
  },
  HALF_DAY: {
    label: 'Half Day', short: 'H',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    cell: 'bg-amber-500'
  },
  LEAVE: {
    label: 'Leave', short: 'L',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    cell: 'bg-sky-500'
  },
  HOLIDAY: {
    label: 'Holiday', short: '·',
    badge: 'bg-slate-100 text-slate-500 border-slate-200',
    cell: 'bg-slate-300'
  }
}

export function StatusBadge({ status }: { status: AttendanceStatusValue }) {
  const meta = STATUS_META[status]
  return (
    <Badge variant="outline" className={`text-[11px] font-semibold ${meta.badge}`}>
      {meta.label}
    </Badge>
  )
}
