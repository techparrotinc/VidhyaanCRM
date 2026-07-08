'use client'

import Link from 'next/link'
import { AlertTriangle, AlertCircle, Info, ChevronRight } from 'lucide-react'

export type AttentionItem = {
  severity: 'critical' | 'warning' | 'info'
  message: string
  href: string
}

const STYLES = {
  critical: { icon: AlertCircle, chip: 'bg-red-50 border-red-200 text-red-700' },
  warning: { icon: AlertTriangle, chip: 'bg-amber-50 border-amber-200 text-amber-700' },
  info: { icon: Info, chip: 'bg-blue-50 border-blue-200 text-blue-700' }
} as const

export function AttentionStrip({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => {
        const { icon: Icon, chip } = STYLES[item.severity]
        return (
          <Link
            key={i}
            href={item.href}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${chip} hover:opacity-80 transition-opacity`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.message}
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </Link>
        )
      })}
    </div>
  )
}
