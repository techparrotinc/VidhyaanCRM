'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, Mail, ChevronDown, ChevronUp, Loader2, RotateCcw, Eye, Save, CheckCircle2
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { renderEmailHtml, replaceVars } from '@/lib/mail/org-templates'
import { useConfirm } from '@/components/ui/confirm-dialog'

type TemplateRow = {
  key: string
  label: string
  description: string
  variables: { name: string; hint: string }[]
  defaultSubject: string
  defaultBody: string
  subject: string
  body: string
  isCustomized: boolean
}

const SAMPLE_VARS: Record<string, string> = {
  parentName: 'Anita Sharma',
  recipientName: 'Anita Sharma',
  studentName: 'Rahul Sharma',
  childName: 'Rahul Sharma',
  invoiceNumber: 'INV-2026-00042',
  amount: '₹12,000',
  dueDate: '15 Aug 2026',
  schoolName: 'Your School',
  paymentLink: 'https://pay.example.com/invoice',
  eventTitle: 'Annual Open House',
  eventDate: 'Sat, 15 Aug 2026 · 10:00 am',
  eventLocation: 'Main Auditorium'
}

export default function EmailTemplatesSettingsPage() {
  const confirmDialog = useConfirm()
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { subject: string; body: string }>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/settings/email-templates')
      const json = await res.json()
      if (json.success) {
        setTemplates(json.data)
        setDrafts(Object.fromEntries(json.data.map((t: TemplateRow) => [t.key, { subject: t.subject, body: t.body }])))
      } else {
        setError(json.error || 'Failed to load templates')
      }
    } catch {
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const save = async (key: string) => {
    const draft = drafts[key]
    if (!draft?.subject.trim() || !draft?.body.trim()) {
      setError('Subject and body are required')
      return
    }
    setSavingKey(key)
    setError(null)
    try {
      const res = await fetch('/api/v1/settings/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, subject: draft.subject.trim(), body: draft.body.trim() })
      })
      const json = await res.json()
      if (!res.ok || json.success === false) throw new Error(json.error || 'Failed to save')
      showToast('Template saved')
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSavingKey(null)
    }
  }

  const reset = async (key: string, label: string) => {
    const okToReset = await confirmDialog({
      title: `Reset “${label}” to default?`,
      message: 'Your customized subject and body will be replaced by the Vidhyaan default.',
      confirmLabel: 'Reset to Default',
      variant: 'danger'
    })
    if (!okToReset) return
    setSavingKey(key)
    try {
      await fetch(`/api/v1/settings/email-templates?key=${key}`, { method: 'DELETE' })
      showToast('Reset to default')
      await load()
    } finally {
      setSavingKey(null)
    }
  }

  const insertVar = (key: string, name: string) => {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], body: `${prev[key].body} {{${name}}}` }
    }))
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <Link href="/settings"
          className="text-sm font-semibold text-slate-400 hover:text-[#1565D8] flex items-center gap-1 mb-2">
          <ChevronLeft size={15} /> Settings
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email Templates</h1>
        <p className="text-sm font-normal leading-relaxed text-slate-500 mt-0.5">
          The emails Vidhyaan sends on your behalf — edit the subject and content, or keep the defaults.
          Login and billing emails are managed by Vidhyaan and cannot be changed.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => {
            const isOpen = openKey === t.key
            const draft = drafts[t.key] ?? { subject: t.subject, body: t.body }
            const dirty = draft.subject !== t.subject || draft.body !== t.body
            return (
              <div key={t.key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenKey(isOpen ? null : t.key)}
                  className="w-full flex items-center gap-3 p-5 text-left cursor-pointer hover:bg-slate-50/60"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Mail className="w-4.5 h-4.5 text-[#1565D8]" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800">{t.label}</h3>
                      {t.isCustomized && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#1565D8]">Customized</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{t.description}</p>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 p-5 space-y-4">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Subject</label>
                      <input
                        value={draft.subject}
                        onChange={(e) => setDrafts((p) => ({ ...p, [t.key]: { ...draft, subject: e.target.value } }))}
                        maxLength={200}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Body</label>
                      <textarea
                        value={draft.body}
                        onChange={(e) => setDrafts((p) => ({ ...p, [t.key]: { ...draft, body: e.target.value } }))}
                        rows={9}
                        maxLength={5000}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-blue-50 resize-y"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">Insert variable:</span>
                        {t.variables.map((v) => (
                          <button
                            key={v.name}
                            onClick={() => insertVar(t.key, v.name)}
                            title={v.hint}
                            className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-[#1565D8] cursor-pointer"
                          >
                            {'{{'}{v.name}{'}}'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {previewKey === t.key && (
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 text-xs text-slate-500 border-b border-slate-100">
                          <strong>Subject:</strong> {replaceVars(draft.subject, SAMPLE_VARS)}
                        </div>
                        <div
                          className="p-4 bg-slate-50/50"
                          dangerouslySetInnerHTML={{ __html: renderEmailHtml(replaceVars(draft.body, SAMPLE_VARS)) }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <button
                        onClick={() => setPreviewKey(previewKey === t.key ? null : t.key)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#1565D8] cursor-pointer"
                      >
                        <Eye size={14} /> {previewKey === t.key ? 'Hide preview' : 'Preview with sample data'}
                      </button>
                      <div className="flex items-center gap-3">
                        {t.isCustomized && (
                          <button
                            onClick={() => reset(t.key, t.label)}
                            disabled={savingKey === t.key}
                            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-red-600 cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw size={14} /> Reset to default
                          </button>
                        )}
                        <button
                          onClick={() => save(t.key)}
                          disabled={savingKey === t.key || !dirty}
                          className="flex items-center gap-1.5 bg-[#1565D8] hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer"
                        >
                          {savingKey === t.key ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-green-400" /> {toast}
        </div>
      )}
    </div>
  )
}
