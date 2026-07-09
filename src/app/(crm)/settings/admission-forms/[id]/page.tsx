'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { FormBuilder, type FormMeta, type FormValue } from '@/components/forms/FormBuilder'

export default function EditFormPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const isNew = id === 'new'

  const [meta, setMeta] = useState<FormMeta | null>(null)
  const [initial, setInitial] = useState<FormValue | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const metaRes = await fetch('/api/v1/forms/meta')
        const metaJson = await metaRes.json()
        const m: FormMeta = metaJson.data
        if (!active) return
        setMeta(m)

        if (isNew) {
          setInitial({
            name: '',
            description: '',
            purpose: m.purposes[0]?.value ?? 'LEAD',
            schema: m.defaultSchema,
            feeRequired: false,
            applicationFeeAmount: '',
          })
        } else {
          const res = await fetch(`/api/v1/forms/${id}`)
          if (!res.ok) throw new Error('Form not found')
          const f = (await res.json()).data
          if (!active) return
          setInitial({
            id: f.id,
            name: f.name ?? '',
            description: f.description ?? '',
            purpose: f.purpose,
            schema: f.schema,
            feeRequired: !!f.feeRequired,
            applicationFeeAmount: f.applicationFeeAmount != null ? String(f.applicationFeeAmount) : '',
          })
        }
      } catch (e: any) {
        if (active) setError(e.message || 'Could not load form')
      }
    })()
    return () => { active = false }
  }, [id, isNew])

  if (error) return <p className="text-sm font-medium text-red-600">{error}</p>
  if (!meta || !initial) return <p className="text-sm text-slate-400">Loading…</p>

  return <FormBuilder meta={meta} initial={initial} />
}
