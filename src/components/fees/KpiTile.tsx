import type { ReactNode } from 'react'

type KpiTileProps = {
  label: string
  value: ReactNode
  subLabel?: ReactNode
  valueClassName?: string
  size?: 'default' | 'compact'
}

export function KpiTile({
  label,
  value,
  subLabel,
  valueClassName = 'text-slate-900',
  size = 'default'
}: KpiTileProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 select-none">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
        {label}
      </p>
      <p className={`${
        size === 'compact' ? 'text-2xl' : 'text-[32px]'
      } font-bold tracking-tight leading-none mt-3 ${valueClassName}`}>
        {value}
      </p>
      {subLabel && (
        <p className="text-xs font-normal text-slate-400 mt-2">
          {subLabel}
        </p>
      )}
    </div>
  )
}
