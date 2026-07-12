'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import {
  Loader2, Plus, Trash2, Pencil, CheckCircle2, AlertCircle,
  Lock, MessageCircle, RefreshCw, Send, Search
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import VariablesBuilder from '@/components/whatsapp/VariablesBuilder'
import { previewTemplateBody } from '@/lib/campaign/templateParams'
import { WA_TEMPLATE_CATEGORIES, waCategoryLabel } from '@/constants/whatsapp-template-categories'

type OrgTemplate = {
  id: string
  name: string
  msg91TemplateId: string
  language: string
  body: string
  variables: string[] | null
  category: string
  accountScope: 'VIDHYAAN' | 'OWN'
  status: 'DRAFT' | 'VERIFIED' | 'SYNCED'
  sharedTemplateId: string | null
}

type CatalogTemplate = {
  id: string
  name: string
  msg91TemplateId: string
  language: string
  body: string
  variables: string[] | null
  category: string
  alreadyAdded: boolean
}

const emptyForm = {
  name: '',
  msg91TemplateId: '',
  language: 'en',
  body: '',
  variables: [] as string[],
  category: 'GENERAL'
}

const matchesTemplate = (
  t: { name: string; msg91TemplateId: string; body: string; category?: string | null },
  q: string,
  category: string
): boolean => {
  if (category !== 'ALL' && (t.category ?? 'GENERAL') !== category) return false
  if (!q) return true
  return (
    t.name.toLowerCase().includes(q) ||
    t.msg91TemplateId.toLowerCase().includes(q) ||
    t.body.toLowerCase().includes(q)
  )
}

const STATUS_BADGE: Record<string, { label: string; badge: string }> = {
  DRAFT: { label: 'Verification pending', badge: 'bg-amber-50 text-amber-700' },
  VERIFIED: { label: 'Verified', badge: 'bg-green-50 text-green-700' },
  SYNCED: { label: 'Synced from MSG91', badge: 'bg-blue-50 text-blue-700' }
}

export default function WhatsappTemplatesPage() {
  const orgType = useSWR<{ success: boolean; data: { isWhatsappActive: boolean } }>(
    '/api/v1/settings/org-type', fetcher
  )
  const isWhatsappActive = orgType.data?.data?.isWhatsappActive ?? false

  const mine = useSWR<{ success: boolean; data: OrgTemplate[] }>(
    isWhatsappActive ? '/api/v1/settings/whatsapp-templates' : null, fetcher
  )
  const catalog = useSWR<{ success: boolean; data: { templates: CatalogTemplate[] } }>(
    isWhatsappActive ? '/api/v1/settings/whatsapp-templates/catalog' : null, fetcher
  )
  const addons = useSWR<{ success: boolean; data: { addons: any[] } }>(
    isWhatsappActive ? '/api/v1/settings/addons' : null, fetcher
  )

  const waAddon = addons.data?.data?.addons?.find((a: any) => a.channel === 'WHATSAPP')
  const byoVerified = waAddon?.provider?.status === 'VERIFIED'

  const myTemplates = mine.data?.data ?? []
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const q = search.trim().toLowerCase()

  const vidhyaanTemplates = myTemplates.filter(
    t => t.accountScope === 'VIDHYAAN' && matchesTemplate(t, q, categoryFilter)
  )
  const ownTemplates = myTemplates.filter(
    t => t.accountScope === 'OWN' && matchesTemplate(t, q, categoryFilter)
  )
  const allCatalogTemplates = catalog.data?.data?.templates ?? []
  const catalogTemplates = allCatalogTemplates.filter(t => matchesTemplate(t, q, categoryFilter))
  const filtering = q !== '' || categoryFilter !== 'ALL'

  const [busyId, setBusyId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [testPhones, setTestPhones] = useState<Record<string, string>>({})
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4500)
  }

  const refresh = () => {
    mine.mutate()
    catalog.mutate()
  }

  // ── Locked state ──
  if (!orgType.isLoading && !isWhatsappActive) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-800">WhatsApp add-on not enabled</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Request activation and our team will switch WhatsApp on for your workspace.
        </p>
        <Link
          href="/settings/addons/whatsapp_addon"
          className="px-4 py-2 text-sm font-semibold bg-[#1565D8] hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Go to Add-ons
        </Link>
      </div>
    )
  }

  const addFromCatalog = async (sharedTemplateId: string) => {
    setBusyId(sharedTemplateId)
    try {
      const res = await fetch('/api/v1/settings/whatsapp-templates/from-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedTemplateId })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add template')
      }
      showToast('success', 'Template added — ready to use in campaigns.')
      refresh()
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setBusyId(null)
    }
  }

  const removeTemplate = async (id: string) => {
    if (!window.confirm('Remove this template? Draft campaigns using it will need a new template.')) return
    setBusyId(id)
    try {
      await fetch(`/api/v1/settings/whatsapp-templates/${id}`, { method: 'DELETE' })
      refresh()
    } finally {
      setBusyId(null)
    }
  }

  const saveOwnTemplate = async () => {
    if (!form.name.trim() || !form.msg91TemplateId.trim() || !form.body.trim()) {
      showToast('error', 'Name, MSG91 template name and body are required')
      return
    }
    setBusyId('form')
    try {
      const res = await fetch(
        editingId
          ? `/api/v1/settings/whatsapp-templates/${editingId}`
          : '/api/v1/settings/whatsapp-templates',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save template')
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      showToast('success', 'Template saved. Send a test message to verify it.')
      refresh()
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setBusyId(null)
    }
  }

  const verifyTemplate = async (id: string) => {
    const testPhone = testPhones[id] ?? ''
    if (testPhone.length !== 10) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/v1/settings/whatsapp-templates/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPhone })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')
      if (data.data?.verified) {
        showToast('success', 'Template verified — usable in campaigns now.')
        refresh()
      } else {
        showToast('error', data.data?.error || 'Test send failed.')
      }
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setBusyId(null)
    }
  }

  const syncFromMsg91 = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/v1/settings/whatsapp-templates/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync unavailable — add templates manually.')
      showToast('success', `Synced ${data.data?.imported ?? 0} templates from your MSG91 account.`)
      refresh()
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setSyncing(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#1565D8]" />
          WhatsApp Templates
        </h3>
        <p className="text-sm text-slate-500">
          Approved templates you can send campaigns with — from the Vidhyaan account or your own.
        </p>
      </div>

      {/* Search + category filter (applies to both tabs) */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-64 pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[{ value: 'ALL', label: 'All' }, ...WA_TEMPLATE_CATEGORIES].map(c => (
            <button
              key={c.value}
              onClick={() => setCategoryFilter(c.value)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-colors ${
                categoryFilter === c.value
                  ? 'bg-[#1565D8] border-[#1565D8] text-white'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="vidhyaan">
        <TabsList className="mb-5">
          <TabsTrigger value="vidhyaan">Vidhyaan Templates</TabsTrigger>
          <TabsTrigger value="own">Your Account</TabsTrigger>
        </TabsList>

        {/* ── VIDHYAAN CATALOG TAB ── */}
        <TabsContent value="vidhyaan" className="space-y-4">
          <p className="text-xs text-slate-400">
            Approved on Vidhyaan&apos;s WhatsApp Business account — add and use immediately. Sends consume credits.
          </p>
          {catalog.isLoading ? (
            <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ) : catalogTemplates.length === 0 ? (
            <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-6 text-center">
              {filtering && allCatalogTemplates.length > 0
                ? 'No templates match the current search / category filter.'
                : 'No templates published yet — Vidhyaan is preparing the catalog.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {catalogTemplates.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                      {t.name}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{waCategoryLabel(t.category)}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{t.language}</span>
                    </p>
                    {t.alreadyAdded ? (
                      <span className="text-[11px] font-bold text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Added
                      </span>
                    ) : (
                      <button
                        onClick={() => addFromCatalog(t.id)}
                        disabled={busyId === t.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-[#1565D8] hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-lg transition-colors"
                      >
                        {busyId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Add
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-3">
                    {previewTemplateBody(t.body, t.variables)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {vidhyaanTemplates.length > 0 && (
            <div className="pt-2">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Added to your workspace
              </h4>
              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200">
                {vidhyaanTemplates.map(t => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        {t.name}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{waCategoryLabel(t.category)}</span>
                      </p>
                      <p className="text-xs font-mono text-slate-400">{t.msg91TemplateId} · {t.language}</p>
                    </div>
                    <button
                      onClick={() => removeTemplate(t.id)}
                      disabled={busyId === t.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── OWN ACCOUNT TAB ── */}
        <TabsContent value="own" className="space-y-4">
          {!byoVerified ? (
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 text-center space-y-2">
              <p className="text-sm text-slate-600">
                Connect and verify your own WhatsApp Business account first — then manage its templates here.
              </p>
              <Link
                href="/settings/addons/whatsapp_addon"
                className="inline-block px-4 py-2 text-sm font-semibold bg-[#1565D8] hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Connect account in Add-ons
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs text-slate-400">
                  Templates approved on your own WABA. Sends via your account never consume Vidhyaan credits.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={syncFromMsg91}
                    disabled={syncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Sync from MSG91
                  </button>
                  <button
                    onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#1565D8] hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add template
                  </button>
                </div>
              </div>

              {showForm && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800">
                    {editingId ? 'Edit template' : 'Add template from your account'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Display name"
                      className={inputClass}
                    />
                    <input
                      value={form.msg91TemplateId}
                      onChange={e => setForm(f => ({ ...f, msg91TemplateId: e.target.value }))}
                      placeholder="MSG91 template name (exact)"
                      className={`${inputClass} font-mono`}
                    />
                    <select
                      value={form.language}
                      onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                      className={`${inputClass} bg-white`}
                    >
                      {['en', 'en_US', 'ta', 'hi', 'te', 'kn', 'ml'].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className={`${inputClass} bg-white`}
                    >
                      {WA_TEMPLATE_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    rows={3}
                    maxLength={1000}
                    placeholder={'Approved body with {{1}}, {{2}}… placeholders'}
                    className={`${inputClass} resize-none`}
                  />
                  <VariablesBuilder
                    variables={form.variables}
                    onChange={vars => setForm(f => ({ ...f, variables: vars }))}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveOwnTemplate}
                      disabled={busyId === 'form'}
                      className="px-4 py-2 text-xs font-bold bg-[#1565D8] hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-lg transition-colors"
                    >
                      {busyId === 'form' ? 'Saving...' : 'Save template'}
                    </button>
                    <button
                      onClick={() => { setShowForm(false); setEditingId(null) }}
                      className="px-4 py-2 text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {ownTemplates.length === 0 && !showForm ? (
                <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-6 text-center">
                  {filtering
                    ? 'No templates match the current search / category filter.'
                    : 'No templates yet — sync from MSG91 or add one manually.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {ownTemplates.map(t => {
                    const badge = STATUS_BADGE[t.status] ?? STATUS_BADGE.DRAFT
                    return (
                      <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                            {t.name}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{waCategoryLabel(t.category)}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{t.language}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.badge}`}>{badge.label}</span>
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setForm({
                                  name: t.name,
                                  msg91TemplateId: t.msg91TemplateId,
                                  language: t.language,
                                  body: t.body,
                                  variables: Array.isArray(t.variables) ? t.variables : [],
                                  category: t.category ?? 'GENERAL'
                                })
                                setEditingId(t.id)
                                setShowForm(true)
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeTemplate(t.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs font-mono text-slate-400">{t.msg91TemplateId}</p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-2">
                          {previewTemplateBody(t.body, t.variables)}
                        </p>
                        {t.status === 'DRAFT' && (
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <input
                              value={testPhones[t.id] ?? ''}
                              onChange={e =>
                                setTestPhones(prev => ({
                                  ...prev,
                                  [t.id]: e.target.value.replace(/\D/g, '').slice(0, 10)
                                }))
                              }
                              placeholder="Test phone (10-digit)"
                              className="w-44 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => verifyTemplate(t.id)}
                              disabled={(testPhones[t.id] ?? '').length !== 10 || busyId === t.id}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-[#1565D8] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors"
                            >
                              {busyId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              Send test & verify
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-lg ${
          toast.type === 'error'
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-green-50 text-green-800 border-green-200'
        }`}>
          {toast.type === 'error'
            ? <AlertCircle className="w-4 h-4 text-red-500" />
            : <CheckCircle2 className="w-4 h-4 text-green-600" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
