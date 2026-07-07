'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import VariablesBuilder from '@/components/whatsapp/VariablesBuilder'
import { previewTemplateBody } from '@/lib/campaign/templateParams'

type SharedTemplate = {
  id: string
  name: string
  msg91TemplateId: string
  language: string
  body: string
  variables: string[] | null
  isActive: boolean
  sortOrder: number
}

const emptyForm = {
  name: '',
  msg91TemplateId: '',
  language: 'en',
  body: '',
  variables: [] as string[],
  isActive: true
}

export default function AdminWhatsappTemplatesPage() {
  const [templates, setTemplates] = useState<SharedTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/whatsapp-templates')
      const data = await res.json()
      setTemplates(data.data ?? [])
    } catch (err) {
      console.error(err)
      setError('Failed to load catalog')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setError(null)
  }

  const openEdit = (t: SharedTemplate) => {
    setForm({
      name: t.name,
      msg91TemplateId: t.msg91TemplateId,
      language: t.language,
      body: t.body,
      variables: Array.isArray(t.variables) ? t.variables : [],
      isActive: t.isActive
    })
    setEditingId(t.id)
    setShowForm(true)
    setError(null)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.msg91TemplateId.trim() || !form.body.trim()) {
      setError('Name, MSG91 template name and body are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(
        editingId ? `/api/admin/whatsapp-templates/${editingId}` : '/api/admin/whatsapp-templates',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, variables: form.variables })
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save template')
      setShowForm(false)
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this template from the catalog? Orgs that already added it keep their copy.')) return
    await fetch(`/api/admin/whatsapp-templates/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#1565D8]" />
            Shared WhatsApp Templates
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Templates approved on Vidhyaan&apos;s WhatsApp Business account. Orgs on the shared account pick from this catalog.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs">
          <Plus className="w-4 h-4 mr-1" /> Publish Template
        </Button>
      </div>

      {error && !showForm && (
        <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
      )}

      {showForm && (
        <Card className="p-6 bg-white border-slate-200 shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-slate-800">
            {editingId ? 'Edit catalog template' : 'Publish approved template'}
          </h3>
          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-1">Display Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Fee Reminder"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-1">MSG91 Template Name *</label>
              <input
                value={form.msg91TemplateId}
                onChange={e => setForm(f => ({ ...f, msg91TemplateId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="fee_reminder_v1"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-1">Language</label>
              <select
                value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English (en)</option>
                <option value="en_US">English US (en_US)</option>
                <option value="ta">Tamil (ta)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="te">Telugu (te)</option>
                <option value="kn">Kannada (kn)</option>
                <option value="ml">Malayalam (ml)</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-slate-300 text-[#1565D8]"
                />
                Visible to orgs
              </label>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-1">
              Approved Body (use {'{{1}}'}, {'{{2}}'}… as in Meta) *
            </label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={4}
              maxLength={1000}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={'Dear {{1}}, the fee of ₹{{2}} for {{3}} is due on {{4}}.'}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-1.5">Variable Mapping</label>
            <VariablesBuilder
              variables={form.variables}
              onChange={vars => setForm(f => ({ ...f, variables: vars }))}
            />
          </div>
          {form.body && form.variables.length > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700 mb-1">Preview</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {previewTemplateBody(form.body, form.variables)}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving} className="bg-[#1565D8] hover:bg-blue-700 text-white font-bold text-xs">
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              {editingId ? 'Save changes' : 'Publish'}
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="text-xs font-bold">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading catalog...
        </div>
      ) : templates.length === 0 && !showForm ? (
        <Card className="p-10 bg-white border-slate-200 text-center text-sm text-slate-400">
          No templates published yet. Publish the approved Vidhyaan template to make it available to schools.
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map(t => (
            <Card key={t.id} className="p-5 bg-white border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  {t.name}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{t.language}</span>
                  {!t.isActive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Hidden</span>
                  )}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs font-mono text-slate-400">{t.msg91TemplateId}</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-3">
                {previewTemplateBody(t.body, t.variables)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
