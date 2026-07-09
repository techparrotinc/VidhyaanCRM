'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FileText, CheckCircle2, XCircle, Clock, Download, X, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FormSchema, FormField } from '@/lib/forms/types'

interface Submission {
  id: string
  targetType: string
  targetId: string | null
  targetLabel: string | null
  data: Record<string, unknown>
  files: { fieldKey: string; url: string; name: string }[] | null
  fieldStates: { applied?: string[]; pending?: string[] } | null
  reviewStatus: string
  paymentStatus: string
  submittedAt: string
}

const REVIEW_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
}

export default function SubmissionsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [schema, setSchema] = useState<FormSchema | null>(null)
  const [formName, setFormName] = useState('')
  const [subs, setSubs] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Submission | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/v1/forms/${params.id}/submissions`)
    const json = await res.json()
    setSchema(json.data?.form?.schema ?? null)
    setFormName(json.data?.form?.name ?? '')
    setSubs(json.data?.submissions ?? [])
    setLoading(false)
  }, [params.id])

  useEffect(() => { load() }, [load])

  const review = async (sub: Submission, action: 'accept' | 'reject') => {
    await fetch(`/api/v1/forms/${params.id}/submissions/${sub.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setActive(null)
    load()
  }

  const fields: FormField[] = schema ? schema.sections.flatMap((s) => s.fields).filter((f) => f.type !== 'section' && f.type !== 'consent') : []
  const labelFor = (key: string) => fields.find((f) => f.key === key)?.label ?? key

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/settings/admission-forms')} className="text-slate-400 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Responses</h1>
          <p className="text-sm text-slate-500">{formName}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : subs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No responses yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subs.map((s) => {
                const pendingCount = s.fieldStates?.pending?.length ?? 0
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{s.targetLabel || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(s.submittedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${REVIEW_STYLE[s.reviewStatus]}`}>{s.reviewStatus}</span>
                      {pendingCount > 0 && <span className="ml-1 text-[11px] text-amber-600">{pendingCount} to review</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.paymentStatus === 'PAID' ? 'Paid' : s.paymentStatus === 'PENDING' ? 'Awaiting' : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => setActive(s)}>View</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => setActive(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <h2 className="text-base font-bold text-slate-900">{active.targetLabel || 'Submission'}</h2>
              <button onClick={() => setActive(null)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-6 px-6 py-6">
              {(active.fieldStates?.pending?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                    <Clock className="h-4 w-4" /> Awaiting your review
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    These identity fields were submitted for an existing record and won't change it until you accept:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-900">
                    {active.fieldStates!.pending!.map((k) => <li key={k}>• {k}</li>)}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="gap-1.5" onClick={() => review(active, 'accept')}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Accept & apply
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 text-red-600" onClick={() => review(active, 'reject')}>
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">All answers</p>
                <dl className="space-y-3">
                  {fields.map((f) => {
                    const v = active.data?.[f.key]
                    if (v == null || v === '') return null
                    return (
                      <div key={f.key}>
                        <dt className="text-xs text-slate-400">{f.label}</dt>
                        <dd className="text-sm text-slate-800">{String(v)}</dd>
                      </div>
                    )
                  })}
                </dl>
              </div>

              {active.files && active.files.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Files</p>
                  <div className="space-y-2">
                    {active.files.map((file, i) => (
                      <a key={i} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#1565D8] hover:bg-slate-50">
                        <FileText className="h-4 w-4" /> <span className="flex-1 truncate">{file.name}</span> <Download className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
