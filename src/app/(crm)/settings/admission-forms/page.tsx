'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, ClipboardList, Send, Inbox, IndianRupee, Link2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { appAlert } from '@/components/ui/app-alert'

const PURPOSE_LABEL: Record<string, string> = {
  ADMISSION: 'Admission',
  LEAD: 'Enquiry',
  ENQUIRY: 'Enquiry',
  STANDALONE: 'Public',
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PUBLISHED: 'bg-green-50 text-green-700',
  ARCHIVED: 'bg-amber-50 text-amber-700',
}

interface FormRow {
  id: string
  name: string
  description: string | null
  purpose: string
  status: string
  isDefault: boolean
  feeRequired: boolean
  applicationFeeAmount: string | null
  updatedAt: string
  _count: { instances: number; submissions: number }
}

export default function AdmissionFormsPage() {
  const confirm = useConfirm()
  const [forms, setForms] = useState<FormRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Reusable share link — /apply/f/[formId] mints a fresh instance per visitor,
  // so the same URL can be posted on a website or WhatsApp group.
  const copyShareLink = async (f: FormRow) => {
    const url = `${window.location.origin}/apply/f/${f.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(f.id)
      setTimeout(() => setCopiedId((id) => (id === f.id ? null : id)), 2000)
    } catch {
      appAlert(url, { title: 'Copy this link', variant: 'info' })
    }
  }

  const fetchForms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/forms')
      const json = await res.json()
      setForms(json.data ?? [])
    } catch {
      setError('Could not load forms')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchForms()
  }, [fetchForms])

  const togglePublish = async (f: FormRow) => {
    const next = f.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED'
    await fetch(`/api/v1/forms/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    fetchForms()
  }

  const setDefault = async (f: FormRow) => {
    await fetch(`/api/v1/forms/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    })
    fetchForms()
  }

  const handleDelete = async (f: FormRow) => {
    const okToDelete = await confirm({
      title: 'Delete form?',
      message: `"${f.name}" will be removed. Sent links stay valid but the form can't be reused.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!okToDelete) return
    await fetch(`/api/v1/forms/${f.id}`, { method: 'DELETE' })
    fetchForms()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Digital Forms</h1>
          <p className="text-sm font-normal leading-relaxed text-slate-500 mt-1">
            Build forms once, send them to parents by email or WhatsApp, or attach them to campaigns.
          </p>
        </div>
        <Link href="/settings/admission-forms/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Form
          </Button>
        </Link>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No forms yet</p>
          <p className="text-sm text-slate-400">Create your first digital form to start collecting applications.</p>
          <Link href="/settings/admission-forms/new" className="mt-4 inline-block">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> New Form
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((f) => (
            <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{f.name}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                    {PURPOSE_LABEL[f.purpose] ?? f.purpose}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[f.status]}`}>
                    {f.status}
                  </span>
                  {f.isDefault && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#1565D8]">Default</span>
                  )}
                </div>
              </div>

              {f.description && <p className="text-sm text-slate-500 line-clamp-2">{f.description}</p>}

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-auto pt-2">
                <span className="inline-flex items-center gap-1"><Send className="h-3.5 w-3.5" />{f._count.instances} sent</span>
                <Link href={`/settings/admission-forms/${f.id}/submissions`} className="inline-flex items-center gap-1 hover:text-[#1565D8]">
                  <Inbox className="h-3.5 w-3.5" />{f._count.submissions} received
                </Link>
                {f.feeRequired && (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <IndianRupee className="h-3.5 w-3.5" />{f.applicationFeeAmount ?? '—'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <Button
                  variant={f.status === 'PUBLISHED' ? 'outline' : 'default'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => togglePublish(f)}
                >
                  {f.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </Button>
                {f.status === 'PUBLISHED' && !f.isDefault && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-slate-600" onClick={() => setDefault(f)} title="Set as default for auto-send">
                    Set default
                  </Button>
                )}
                {f.status === 'PUBLISHED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => copyShareLink(f)}
                    title="Copy public form link"
                  >
                    {copiedId === f.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Link2 className="h-3.5 w-3.5" /> Copy link
                      </>
                    )}
                  </Button>
                )}
                <Link href={`/settings/admission-forms/${f.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleDelete(f)}
                  title="Delete form"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
