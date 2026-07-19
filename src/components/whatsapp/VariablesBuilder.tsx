'use client'

import { X, Plus } from 'lucide-react'
import { TEMPLATE_TOKENS } from '@/lib/campaign/templateParams'
import { AppSelect } from '@/components/ui/app-select'

/**
 * Ordered variable mapping builder: position n in the list fills {{n}} in
 * the approved template body.
 */
export default function VariablesBuilder({
  variables,
  onChange
}: {
  variables: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <div className="space-y-2">
      {variables.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {variables.map((token, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400 w-10 flex-shrink-0">
                {'{{'}{i + 1}{'}}'}
              </span>
              <AppSelect
                value={token}
                onChange={e => {
                  const next = [...variables]
                  next[i] = e.target.value
                  onChange(next)
                }}
                className="flex-1 h-8 px-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TEMPLATE_TOKENS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </AppSelect>
              <button
                type="button"
                onClick={() => onChange(variables.filter((_, idx) => idx !== i))}
                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {variables.length < 10 && (
        <button
          type="button"
          onClick={() => onChange([...variables, TEMPLATE_TOKENS[0]])}
          className="flex items-center gap-1 text-xs font-bold text-[#1565D8] border border-dashed border-blue-200 rounded-lg hover:bg-blue-50/40 transition-colors px-2.5 py-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add variable {'{{'}{variables.length + 1}{'}}'}
        </button>
      )}
      <p className="text-[11px] text-slate-400">
        Order must match the placeholders in the Meta-approved template.
      </p>
    </div>
  )
}
