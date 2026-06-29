"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react'
import { useWhatsappTemplates } from '@/hooks/useWhatsappTemplates'

export default function WhatsappTemplatesSettingsPage() {
  const router = useRouter()
  const { templates, isLoading, mutate } = useWhatsappTemplates()

  // App module activation state
  const [isWhatsappActive, setIsWhatsappActive] = useState(false)
  const [loadingActiveStatus, setLoadingActiveStatus] = useState(true)

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  })

  // Form / Slide-over state
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [msg91TemplateId, setMsg91TemplateId] = useState('')
  const [body, setBody] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Delete modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch WhatsApp active status on mount
  useEffect(() => {
    fetch('/api/v1/settings/org-type')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.isWhatsappActive !== undefined) {
          setIsWhatsappActive(data.data.isWhatsappActive)
        }
      })
      .catch((err) => console.error('Failed to fetch org status:', err))
      .finally(() => setLoadingActiveStatus(false))
  }, [])

  const triggerToast = (message: string) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 4000)
  }

  const handleOpenAdd = () => {
    setFormMode('add')
    setSelectedTemplateId(null)
    setName('')
    setMsg91TemplateId('')
    setBody('')
    setShowForm(true)
  }

  const handleOpenEdit = (template: any) => {
    setFormMode('edit')
    setSelectedTemplateId(template.id)
    setName(template.name)
    setMsg91TemplateId(template.msg91TemplateId)
    setBody(template.body)
    setShowForm(true)
  }

  const handleInsertVariable = (variable: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)

    const newValue = before + variable + after
    setBody(newValue)

    // Focus and place cursor after inserted variable
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + variable.length
    }, 0)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !msg91TemplateId.trim() || !body.trim()) {
      triggerToast('Please fill out all required fields')
      return
    }

    setIsSaving(true)
    try {
      const url = formMode === 'add'
        ? '/api/v1/settings/whatsapp-templates'
        : `/api/v1/settings/whatsapp-templates/${selectedTemplateId}`
      const method = formMode === 'add' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, msg91TemplateId, body })
      })

      const data = await res.json()
      if (data.success) {
        triggerToast('Template saved')
        setShowForm(false)
        mutate()
      } else {
        triggerToast(data.error || 'Failed to save template')
      }
    } catch (err) {
      console.error(err)
      triggerToast('Error saving template')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return
    try {
      const res = await fetch(`/api/v1/settings/whatsapp-templates/${confirmDeleteId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        triggerToast('Template deleted')
        setConfirmDeleteId(null)
        mutate()
      } else {
        triggerToast(data.error || 'Failed to delete template')
      }
    } catch (err) {
      console.error(err)
      triggerToast('Error deleting template')
    }
  }

  if (loadingActiveStatus || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1565D8]" />
      </div>
    )
  }

  // locked state if addon is inactive
  if (!isWhatsappActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">
          WhatsApp Templates
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          Send WhatsApp campaigns to parents and leads using DLT-approved templates via MSG91. Upgrade your plan to unlock this feature.
        </p>
        <button
          onClick={() => router.push('/settings/billing')}
          className="px-4 py-2 bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Upgrade Plan
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative select-none animate-fade-in">
      {/* Toast alert */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm font-semibold py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            WhatsApp Templates
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your DLT-approved WhatsApp message templates
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Template
        </button>
      </div>

      {/* Templates Content */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 border border-dashed border-slate-200 rounded-xl">
          <MessageCircle className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-600 mb-1">
            No templates yet
          </p>
          <p className="text-xs text-slate-400 mb-4">
            Add your DLT-approved WhatsApp templates to use them in campaigns
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Add First Template
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template: any) => (
            <div
              key={template.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {template.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    MSG91 ID: {template.msg91TemplateId}
                  </p>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2 whitespace-pre-wrap">
                    {template.body}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(template)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(template.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over Form Panel */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          showForm ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setShowForm(false)}
        />
        
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
          <div
            className={`w-screen max-w-md transform transition-transform duration-300 ease-in-out bg-white shadow-2xl flex flex-col ${
              showForm ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Slide Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                {formMode === 'add' ? 'Add Template' : 'Edit Template'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slide Content */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fee Reminder"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  A label to identify this template internally
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  MSG91 Template ID *
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={msg91TemplateId}
                  onChange={(e) => setMsg91TemplateId(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  The DLT template ID from your MSG91 account
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Body *
                </label>
                <textarea
                  ref={textareaRef}
                  required
                  rows={6}
                  maxLength={1000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Hello {{parentName}}, fees for {{kidName}} are due on {{date}}..."
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-slate-400">
                    Maximum 1000 characters
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {body.length}/1000
                  </p>
                </div>
              </div>

              {/* Supported variables */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">
                  Supported variables
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['{{parentName}}', '{{kidName}}', '{{schoolName}}', '{{date}}', '{{amount}}'].map((v) => (
                    <span
                      key={v}
                      onClick={() => handleInsertVariable(v)}
                      className="text-xs bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 font-mono cursor-pointer hover:bg-slate-100 select-none"
                    >
                      {v}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Click a variable to insert it at cursor position
                </p>
              </div>
            </form>

            {/* Slide Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-[#1565D8] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setConfirmDeleteId(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Delete this template?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              It cannot be used in future campaigns.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
