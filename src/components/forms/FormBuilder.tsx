'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  GripVertical, Plus, Trash2, Eye, Save, ChevronDown, X, ArrowLeft, IndianRupee, Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { FIELD_TYPE_LABELS, type FieldType, type FormField, type FormSchema, type FormSection } from '@/lib/forms/types'
import { FormPreview } from './FormPreview'

let uidSeq = 0
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${(uidSeq++).toString(36)}`

const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as FieldType[]

export interface FormMeta {
  institutionType: string | null
  purposes: { value: string; label: string }[]
  fieldLibrary: { group: string; fields: FormField[] }[]
  defaultSchema: FormSchema
  relatedSources: Record<string, { id: string; label: string }[]>
}

export interface FormValue {
  id?: string
  name: string
  description: string
  purpose: string
  schema: FormSchema
  feeRequired: boolean
  applicationFeeAmount: string
}

export function FormBuilder({ meta, initial }: { meta: FormMeta; initial: FormValue }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [value, setValue] = useState<FormValue>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [dragField, setDragField] = useState<{ sec: number; idx: number } | null>(null)

  const schema = value.schema
  const setSchema = (s: FormSchema) => setValue((v) => ({ ...v, schema: s }))

  const mutateSection = (secIdx: number, fn: (s: FormSection) => FormSection) => {
    setSchema({ sections: schema.sections.map((s, i) => (i === secIdx ? fn(s) : s)) })
  }

  const addSection = () =>
    setSchema({ sections: [...schema.sections, { id: uid('sec'), title: 'New Section', fields: [] }] })

  const addField = (secIdx: number, tmpl?: FormField) => {
    const field: FormField = tmpl
      ? { ...tmpl, key: uid('f') }
      : { key: uid('f'), label: 'Untitled Field', type: 'text' }
    mutateSection(secIdx, (s) => ({ ...s, fields: [...s.fields, field] }))
  }

  const updateField = (secIdx: number, fldIdx: number, patch: Partial<FormField>) =>
    mutateSection(secIdx, (s) => ({
      ...s,
      fields: s.fields.map((f, i) => (i === fldIdx ? { ...f, ...patch } : f)),
    }))

  const removeField = (secIdx: number, fldIdx: number) =>
    mutateSection(secIdx, (s) => ({ ...s, fields: s.fields.filter((_, i) => i !== fldIdx) }))

  const removeSection = async (secIdx: number) => {
    const okToRemove = await confirm({
      title: 'Remove section?',
      message: 'All fields in this section will be removed from the form.',
      confirmLabel: 'Remove',
      variant: 'danger',
    })
    if (!okToRemove) return
    setSchema({ sections: schema.sections.filter((_, i) => i !== secIdx) })
  }

  // Native drag reorder within a section.
  const onDrop = (sec: number, idx: number) => {
    if (!dragField || dragField.sec !== sec) return
    mutateSection(sec, (s) => {
      const next = [...s.fields]
      const [moved] = next.splice(dragField.idx, 1)
      next.splice(idx, 0, moved)
      return { ...s, fields: next }
    })
    setDragField(null)
  }

  const feeValid = !value.feeRequired || Number(value.applicationFeeAmount) > 0
  const hasPhoneField = schema.sections.some((s) => s.fields.some((f) => f.mapsTo === 'contact.phone'))
  const canSave = value.name.trim() && value.purpose && schema.sections.some((s) => s.fields.length)
  const canPublish = canSave && feeValid && hasPhoneField

  const save = async (publish = false) => {
    setSaving(true)
    setError(null)
    try {
      const payload: any = {
        name: value.name.trim(),
        description: value.description || undefined,
        purpose: value.purpose,
        schema,
        feeRequired: value.feeRequired,
        applicationFeeAmount: value.feeRequired ? Number(value.applicationFeeAmount || 0) : null,
        ...(publish ? { status: 'PUBLISHED' } : {}),
      }
      // Create (POST) can't set status; publish via a follow-up PATCH.
      const res = await fetch(value.id ? `/api/v1/forms/${value.id}` : '/api/v1/forms', {
        method: value.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        const firstDetail = j?.details && typeof j.details === 'object' ? (Object.values(j.details)[0] as any)?.[0] : null
        throw new Error(firstDetail || j?.error || 'Save failed')
      }
      router.push('/settings/admission-forms')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {value.id ? 'Edit Form' : 'New Form'}
        </h1>
      </div>

      {/* Meta */}
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Type">
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={value.purpose}
            onChange={(e) => setValue((v) => ({ ...v, purpose: e.target.value }))}
          >
            {meta.purposes.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Form Name">
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={value.name}
            placeholder="e.g. Grade 1 Admission"
            onChange={(e) => setValue((v) => ({ ...v, name: e.target.value }))}
          />
        </Field>
        <Field label="Description">
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={value.description}
            onChange={(e) => setValue((v) => ({ ...v, description: e.target.value }))}
          />
        </Field>
      </div>

      {/* Fee */}
      <div className="rounded-xl border border-slate-200 p-6 flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={value.feeRequired}
            onChange={(e) => setValue((v) => ({ ...v, feeRequired: e.target.checked }))}
          />
          Collect an application fee
        </label>
        {value.feeRequired && (
          <div className="inline-flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-slate-400" />
            <input
              type="number"
              min={0}
              className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Amount"
              value={value.applicationFeeAmount}
              onChange={(e) => setValue((v) => ({ ...v, applicationFeeAmount: e.target.value }))}
            />
            {feeValid ? (
              <span className="text-xs text-slate-400">Paid online before submission completes</span>
            ) : (
              <span className="text-xs text-red-500">Enter an amount greater than 0 to publish</span>
            )}
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {schema.sections.map((section, secIdx) => (
          <div key={section.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1 text-base sm:text-lg font-semibold text-slate-900 hover:border-slate-200 focus:border-slate-300 outline-none"
                value={section.title}
                onChange={(e) => mutateSection(secIdx, (s) => ({ ...s, title: e.target.value }))}
              />
              <FieldAdder library={meta.fieldLibrary} onAdd={(f) => addField(secIdx, f)} />
              <button
                onClick={() => removeSection(secIdx)}
                className="shrink-0 text-slate-300 hover:text-red-600"
                title="Remove section"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {section.fields.map((field, fldIdx) => (
                <div
                  key={field.key}
                  draggable
                  onDragStart={() => setDragField({ sec: secIdx, idx: fldIdx })}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(secIdx, fldIdx)}
                  className="group rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-2 h-4 w-4 shrink-0 cursor-grab text-slate-300" />
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                      <input
                        className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={field.label}
                        placeholder="Field label"
                        onChange={(e) => updateField(secIdx, fldIdx, { label: e.target.value })}
                      />
                      <select
                        className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={field.type}
                        onChange={(e) => updateField(secIdx, fldIdx, { type: e.target.value as FieldType })}
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => removeField(secIdx, fldIdx)}
                      className="mt-2 text-slate-300 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Per-type extras */}
                  <div className="ml-6 mt-2 flex flex-wrap items-center gap-3">
                    {field.type !== 'section' && field.type !== 'consent' && (
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <input
                          type="checkbox"
                          checked={!!field.required}
                          onChange={(e) => updateField(secIdx, fldIdx, { required: e.target.checked })}
                        />
                        Required
                      </label>
                    )}
                    {field.mapsTo && (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                        maps to {field.mapsTo}
                      </span>
                    )}
                    {field.type === 'related' && (
                      <select
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                        value={field.relatedTo ?? 'course'}
                        onChange={(e) => updateField(secIdx, fldIdx, { relatedTo: e.target.value as any })}
                      >
                        <option value="course">Course</option>
                        <option value="counsellor">Counsellor</option>
                        <option value="academicYear">Academic Year</option>
                      </select>
                    )}
                    {field.type === 'picklist' && (
                      <input
                        className="min-w-[240px] flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                        placeholder="Options, comma separated"
                        value={(field.options ?? []).join(', ')}
                        onChange={(e) =>
                          updateField(secIdx, fldIdx, {
                            options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean),
                          })
                        }
                      />
                    )}
                  </div>
                </div>
              ))}

              {section.fields.length === 0 && (
                <button
                  onClick={() => addField(secIdx)}
                  className="w-full rounded-lg border border-dashed border-slate-200 py-4 text-sm text-slate-400 hover:border-slate-300 hover:text-slate-600"
                >
                  <Plus className="mr-1 inline h-4 w-4" /> Add field
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {canSave && !hasPhoneField && (
        <p className="text-sm font-medium text-amber-600">Add a field mapped to Phone (from the field library) to publish — it identifies each submission.</p>
      )}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      {/* Sticky action bar — horizontally scrollable so all actions stay
          reachable on narrow screens */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto sm:justify-center">
          <Button variant="outline" className="shrink-0 gap-2" onClick={addSection}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Section</span><span className="sm:hidden">Section</span>
          </Button>
          <Button variant="outline" className="shrink-0 gap-2" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button variant="outline" className="shrink-0 gap-2" disabled={!canSave || saving} onClick={() => save(false)}>
            <Save className="h-4 w-4" /> <span className="hidden sm:inline">Save Draft</span><span className="sm:hidden">Draft</span>
          </Button>
          <Button className="shrink-0 gap-2" disabled={!canPublish || saving} onClick={() => save(true)}>
            <Send className="h-4 w-4" /> {saving ? 'Saving…' : (<><span className="hidden sm:inline">Save &amp; Publish</span><span className="sm:hidden">Publish</span></>)}
          </Button>
        </div>
      </div>

      {showPreview && (
        <FormPreview
          name={value.name}
          description={value.description}
          schema={schema}
          feeRequired={value.feeRequired}
          feeAmount={value.applicationFeeAmount}
          relatedSources={meta.relatedSources}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</label>
      {children}
    </div>
  )
}

// Dropdown offering library fields + a blank field.
function FieldAdder({
  library,
  onAdd,
}: {
  library: { group: string; fields: FormField[] }[]
  onAdd: (f?: FormField) => void
}) {
  const [open, setOpen] = useState(false)
  const groups = useMemo(() => library, [library])
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#1565D8]"
      >
        Add New Field <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 max-h-80 w-64 overflow-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
            <button
              onClick={() => { onAdd(); setOpen(false) }}
              className="w-full rounded px-2 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              + Blank field
            </button>
            {groups.map((g) => (
              <div key={g.group} className="mt-1">
                <p className="px-2 pt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">{g.group}</p>
                {g.fields.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { onAdd(f); setOpen(false) }}
                    className="w-full rounded px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
