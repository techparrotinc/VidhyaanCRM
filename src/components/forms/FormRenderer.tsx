'use client'

import { useEffect, useRef, useState } from 'react'
import { IndianRupee, CheckCircle2, Loader2, Upload, AlertCircle } from 'lucide-react'
import type { FormField, FormSchema } from '@/lib/forms/types'

interface LoadedForm {
  status: 'OPEN' | 'SUBMITTED' | 'EXPIRED'
  orgName: string
  form: {
    name: string
    description: string | null
    schema: FormSchema
    settings: any
    feeRequired: boolean
    applicationFeeAmount: string | null
    feeCurrency: string
  }
  prefill: Record<string, unknown>
  relatedOptions: Record<string, { id: string; label: string }[]>
}

type FileVal = { url: string; name: string; size?: number }

// Lazy-load Razorpay Checkout once.
function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) return resolve()
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load payment library'))
    document.body.appendChild(s)
  })
}

export function FormRenderer({ token }: { token: string }) {
  const [data, setData] = useState<LoadedForm | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [fileVals, setFileVals] = useState<Record<string, FileVal>>({})
  const [issues, setIssues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ message: string | null } | null>(null)
  const draftKey = `form_draft_${token}`

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/public/forms/${token}`)
        if (!res.ok) throw new Error((await res.json()).error || 'Form not found')
        const json: LoadedForm = await res.json()
        setData(json)
        const draft = typeof window !== 'undefined' ? localStorage.getItem(draftKey) : null
        setValues(draft ? JSON.parse(draft) : json.prefill)
      } catch (e: any) {
        setLoadErr(e.message)
      }
    })()
  }, [token, draftKey])

  // Autosave draft.
  useEffect(() => {
    if (data?.status === 'OPEN') {
      try { localStorage.setItem(draftKey, JSON.stringify(values)) } catch {}
    }
  }, [values, data, draftKey])

  const setVal = (key: string, v: unknown) => {
    setValues((prev) => ({ ...prev, [key]: v }))
    setIssues((prev) => { const n = { ...prev }; delete n[key]; return n })
  }

  const submit = async () => {
    setSubmitting(true)
    setIssues({})
    try {
      const files = Object.entries(fileVals).map(([fieldKey, f]) => ({ fieldKey, ...f }))
      const res = await fetch(`/api/public/forms/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: values, files }),
      })
      const json = await res.json()
      if (res.status === 422 && json.issues) {
        setIssues(Object.fromEntries(json.issues.map((i: any) => [i.key, i.message])))
        return
      }
      if (!res.ok) throw new Error(json.error || 'Submission failed')

      if (json.paymentRequired) {
        await startPayment()
        return
      }
      localStorage.removeItem(draftKey)
      setDone({ message: json.successMessage })
    } catch (e: any) {
      setIssues({ _form: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  const startPayment = async () => {
    const res = await fetch(`/api/public/forms/${token}/pay`, { method: 'POST' })
    const order = await res.json()
    if (!res.ok) throw new Error(order.error || 'Could not start payment')

    await loadRazorpay()
    const Rzp = (window as any).Razorpay
    if (!Rzp) throw new Error('Payment library failed to load')

    const rzp = new Rzp({
      key: order.keyId,
      amount: order.amountMinor,
      currency: order.currency,
      order_id: order.providerOrderId,
      name: order.name,
      description: order.description,
      handler: async (resp: any) => {
        const cRes = await fetch(`/api/public/forms/${token}/pay/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          }),
        })
        const cJson = await cRes.json()
        if (!cRes.ok) { setIssues({ _form: cJson.error || 'Payment verification failed' }); return }
        localStorage.removeItem(draftKey)
        setDone({ message: cJson.successMessage })
      },
      modal: { ondismiss: () => setSubmitting(false) },
    })
    rzp.open()
  }

  if (loadErr) return <Screen icon={<AlertCircle className="h-10 w-10 text-red-400" />} title="Link not found" body={loadErr} />
  if (!data) return <div className="grid min-h-screen place-items-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (data.status === 'EXPIRED') return <Screen icon={<AlertCircle className="h-10 w-10 text-amber-400" />} title="Link expired" body="This application link is no longer active. Please contact the institution." />
  if (data.status === 'SUBMITTED' || done) {
    return <Screen icon={<CheckCircle2 className="h-10 w-10 text-green-500" />} title="Application received" body={done?.message || 'Thank you — your application has been submitted successfully.'} />
  }

  const { form } = data

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-2xl bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-6 sm:px-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{data.orgName}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{form.name}</h1>
            {form.description && <p className="mt-1 text-sm text-slate-500">{form.description}</p>}
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-10">
            {form.schema.sections.map((section) => (
              <div key={section.id}>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{section.title}</h3>
                <div className="mt-4 space-y-5">
                  {section.fields.map((f) => (
                    <RenderField
                      key={f.key}
                      field={f}
                      value={values[f.key]}
                      fileVal={fileVals[f.key]}
                      issue={issues[f.key]}
                      relatedOptions={data.relatedOptions}
                      token={token}
                      onChange={(v) => setVal(f.key, v)}
                      onFile={(fv) => { setFileVals((p) => ({ ...p, [f.key]: fv })); setIssues((p) => { const n = { ...p }; delete n[f.key]; return n }) }}
                    />
                  ))}
                </div>
              </div>
            ))}

            {form.feeRequired && (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-600">Application fee</span>
                <span className="inline-flex items-center text-sm font-semibold text-slate-900">
                  <IndianRupee className="h-3.5 w-3.5" />{form.applicationFeeAmount || '0'}
                </span>
              </div>
            )}

            {issues._form && <p className="text-sm font-medium text-red-600">{issues._form}</p>}

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full rounded-lg bg-[#1565D8] py-3 text-sm font-semibold text-white transition hover:bg-[#1257bd] disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : form.feeRequired ? 'Continue to Payment' : (form.settings?.submitLabel || 'Submit Application')}
            </button>
            <p className="text-center text-xs text-slate-400">Your progress is saved automatically on this device.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Screen({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex justify-center">{icon}</div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{body}</p>
      </div>
    </div>
  )
}

function RenderField({
  field, value, fileVal, issue, relatedOptions, token, onChange, onFile,
}: {
  field: FormField
  value: unknown
  fileVal?: FileVal
  issue?: string
  relatedOptions: Record<string, { id: string; label: string }[]>
  token: string
  onChange: (v: unknown) => void
  onFile: (f: FileVal) => void
}) {
  const [uploading, setUploading] = useState(false)

  if (field.type === 'section') return <h4 className="pt-2 text-sm font-semibold text-slate-700">{field.label}</h4>

  if (field.type === 'consent') {
    return (
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" className="mt-1" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span>{field.label}{field.required && <span className="text-red-500"> *</span>}</span>
        {issue && <span className="block text-xs text-red-600">{issue}</span>}
      </label>
    )
  }

  const base = `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1565D8] ${issue ? 'border-red-300' : 'border-slate-200'}`
  const label = (
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
      {field.label}{field.required && <span className="text-red-500"> *</span>}
    </label>
  )

  let control: React.ReactNode
  switch (field.type) {
    case 'textarea':
      control = <textarea rows={3} className={base} placeholder={field.placeholder} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      break
    case 'picklist':
      control = (
        <select className={base} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">{field.placeholder || 'Select…'}</option>
          {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )
      break
    case 'related': {
      const opts = relatedOptions[field.relatedTo ?? 'course'] ?? []
      control = (
        <select className={base} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {opts.map((o) => <option key={o.id} value={o.label}>{o.label}</option>)}
        </select>
      )
      break
    }
    case 'date':
      control = <input type="date" className={base} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      break
    case 'numeric':
      control = <input type="number" inputMode="numeric" className={base} placeholder={field.placeholder} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      break
    case 'email':
      control = <input type="email" className={base} placeholder={field.placeholder} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      break
    case 'phone':
      control = <input type="tel" inputMode="tel" className={base} placeholder={field.placeholder} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      break
    case 'file':
      control = (
        <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm ${issue ? 'border-red-300' : 'border-slate-200'} ${uploading ? 'opacity-60' : ''}`}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : <Upload className="h-4 w-4 text-slate-400" />}
          <span className="text-slate-500">{fileVal ? fileVal.name : 'Choose a file (PDF/JPG/PNG, max 10MB)'}</span>
          <input
            type="file" className="hidden" accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return
              setUploading(true)
              try {
                const fd = new FormData(); fd.append('file', f); fd.append('fieldKey', field.key)
                const res = await fetch(`/api/public/forms/${token}/upload`, { method: 'POST', body: fd })
                const json = await res.json()
                if (!res.ok) throw new Error(json.error)
                onFile({ url: json.url, name: json.name, size: json.size })
              } catch (err: any) {
                alert(err.message || 'Upload failed')
              } finally { setUploading(false) }
            }}
          />
        </label>
      )
      break
    default:
      control = <input className={base} placeholder={field.placeholder} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
  }

  return <div>{label}{control}{issue && <p className="mt-1 text-xs text-red-600">{issue}</p>}</div>
}
