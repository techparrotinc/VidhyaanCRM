'use client'

import { X, IndianRupee } from 'lucide-react'
import type { FormField, FormSchema } from '@/lib/forms/types'
import { AppSelect } from '@/components/ui/app-select'

// Read-only render of a form as a parent sees it. Mobile-first single column.
// P2's public /apply/[token] page will reuse this layout with live inputs.
export function FormPreview({
  name,
  description,
  schema,
  feeRequired,
  feeAmount,
  relatedSources,
  onClose,
}: {
  name: string
  description: string
  schema: FormSchema
  feeRequired: boolean
  feeAmount: string
  relatedSources: Record<string, { id: string; label: string }[]>
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-auto bg-slate-900/40 p-4 sm:p-8">
      <div className="h-fit w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Preview</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-8 sm:px-10">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{name || 'Untitled Form'}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}

          <div className="mt-8 space-y-8">
            {schema.sections.map((section) => (
              <div key={section.id}>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{section.title}</h3>
                <div className="mt-4 space-y-5">
                  {section.fields.map((f) => (
                    <PreviewField key={f.key} field={f} relatedSources={relatedSources} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {feeRequired && (
            <div className="mt-8 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-600">Application fee</span>
              <span className="inline-flex items-center text-sm font-semibold text-slate-900">
                <IndianRupee className="h-3.5 w-3.5" />{feeAmount || '0'}
              </span>
            </div>
          )}

          <button
            disabled
            className="mt-8 w-full rounded-lg bg-[#1565D8] py-3 text-sm font-semibold text-white opacity-70"
          >
            {feeRequired ? 'Pay & Submit' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewField({
  field,
  relatedSources,
}: {
  field: FormField
  relatedSources: Record<string, { id: string; label: string }[]>
}) {
  if (field.type === 'section') {
    return <h4 className="pt-2 text-sm font-semibold text-slate-700">{field.label}</h4>
  }
  if (field.type === 'consent') {
    return (
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" disabled className="mt-1" />
        <span>{field.label}</span>
      </label>
    )
  }

  const label = (
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {field.label}
      {field.required && <span className="text-red-500"> *</span>}
    </label>
  )

  const base = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400'

  let control: React.ReactNode
  switch (field.type) {
    case 'textarea':
      control = <textarea disabled rows={3} className={base} placeholder={field.placeholder} />
      break
    case 'picklist':
      control = (
        <AppSelect disabled className={base}>
          <option>{field.placeholder || 'Select…'}</option>
          {(field.options ?? []).map((o) => <option key={o}>{o}</option>)}
        </AppSelect>
      )
      break
    case 'related': {
      const opts = relatedSources[field.relatedTo ?? 'course'] ?? []
      control = (
        <AppSelect disabled className={base}>
          <option>Select…</option>
          {opts.map((o) => <option key={o.id}>{o.label}</option>)}
        </AppSelect>
      )
      break
    }
    case 'file':
      control = (
        <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
          Upload file
        </div>
      )
      break
    case 'date':
      control = <input disabled type="text" className={base} placeholder="DD / MM / YYYY" />
      break
    default:
      control = <input disabled className={base} placeholder={field.placeholder} />
  }

  return <div>{label}{control}</div>
}
