'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { Building2 } from 'lucide-react'
import { AppSelect } from '@/components/ui/app-select'

// Branch scope selector for dashboards. Hides itself for single-branch orgs
// (and for BRANCH_ADMINs with one branch) so it only shows where it helps.
export function BranchFilter({
  value, onChange
}: {
  value: string
  onChange: (branchId: string) => void
}) {
  const { data } = useSWR<{ data: { value: string; label: string }[] }>(
    '/api/v1/reports/options?source=branches',
    fetcher,
    { revalidateOnFocus: false }
  )
  const options = data?.data ?? []
  if (data && options.length <= 1 && !value) return null

  return (
    <div className="inline-flex items-center gap-1.5 h-9 pl-2.5 pr-1 rounded-lg border border-slate-200 bg-white">
      <Building2 className="h-3.5 w-3.5 text-slate-400" />
      <AppSelect
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-full bg-transparent text-sm font-medium text-slate-700 pr-1 focus:outline-none"
        aria-label="Branch"
      >
        <option value="">All branches</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </AppSelect>
    </div>
  )
}
