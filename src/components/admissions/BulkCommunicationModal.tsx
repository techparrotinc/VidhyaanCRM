"use client"

import React, { useMemo, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { X, Mail, MessageSquare, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react'

type Channel = 'email' | 'sms' | 'whatsapp'

export type BulkCommPayload = {
  channel: Channel
  subject?: string
  message?: string
  templateId?: string
  parameters?: string[]
}

type WaTemplate = {
  id: string
  name: string
  body: string
  status: string
  language: string
  metaCategory: string | null
  variables: string[] | null
}

type BulkCommunicationModalProps = {
  open: boolean
  count: number
  onClose: () => void
  onSend: (payload: BulkCommPayload) => Promise<void>
}

const WhatsAppIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.42 1.32-1.95 1.36-.5.05-1.13.07-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99 0-1.42.75-2.12 1.01-2.41.24-.27.53-.34.71-.34.18 0 .35 0 .51.01.16.01.38-.06.6.46.24.55.79 1.9.86 2.04.07.14.12.3.02.49-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.29.29-.12.57.16.28.73 1.2 1.56 1.94 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.27.36-.23.6-.14.24.09 1.53.72 1.79.85.26.14.43.2.5.32.07.11.07.66-.17 1.34Z"/>
  </svg>
)

export default function BulkCommunicationModal({
  open,
  count,
  onClose,
  onSend,
}: BulkCommunicationModalProps) {
  const [channel, setChannel] = useState<Channel>('email')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [params, setParams] = useState<string[]>([])
  const [step, setStep] = useState<'compose' | 'review'>('compose')
  const [sending, setSending] = useState(false)

  // WhatsApp approved templates for this org
  const { data: waData } = useSWR<any>(
    open ? '/api/v1/settings/whatsapp-templates' : null,
    fetcher
  )
  const waTemplates: WaTemplate[] = useMemo(() => {
    const list: WaTemplate[] = (waData?.data ?? waData ?? []) as WaTemplate[]
    return list.filter((t) => t.status === 'VERIFIED' || t.status === 'SYNCED')
  }, [waData])

  const selectedTemplate = waTemplates.find((t) => t.id === templateId) || null

  const selectTemplate = (id: string) => {
    setTemplateId(id)
    const t = waTemplates.find((x) => x.id === id)
    const varCount = Array.isArray(t?.variables) ? t!.variables!.length : 0
    setParams(Array(varCount).fill(''))
  }

  const reset = () => {
    setChannel('email'); setSubject(''); setMessage('')
    setTemplateId(''); setParams([]); setStep('compose'); setSending(false)
  }

  const close = () => { reset(); onClose() }

  if (!open) return null

  const composeValid =
    channel === 'whatsapp'
      ? !!templateId && params.every((p) => p.trim().length > 0)
      : message.trim().length > 0 && (channel === 'sms' || subject.trim().length > 0)

  const perMsgCredits = channel === 'sms' ? 1 : channel === 'whatsapp'
    ? (selectedTemplate?.metaCategory === 'MARKETING' ? 2 : 1) : 0
  const creditEstimate = perMsgCredits * count

  // Rendered preview against a sample name
  const sampleName = 'Rahul Sharma'
  const previewText = channel === 'whatsapp'
    ? (selectedTemplate?.body || '').replace(/\{\{(\d+)\}\}/g, (_m, n) => {
        const v = params[Number(n) - 1]
        return v ? v.replace(/\{name\}/gi, sampleName) : `{{${n}}}`
      })
    : message.replace(/\{name\}/gi, sampleName)

  const channelLabel = channel === 'email' ? 'Email' : channel === 'sms' ? 'SMS' : 'WhatsApp'

  const handleSend = async () => {
    if (sending) return
    setSending(true)
    try {
      await onSend(
        channel === 'whatsapp'
          ? { channel, templateId, parameters: params }
          : { channel, subject: channel === 'email' ? subject.trim() : undefined, message: message.trim() }
      )
      reset()
    } finally {
      setSending(false)
    }
  }

  const channelBtn = (c: Channel, icon: React.ReactNode, label: string, disabled?: boolean) => (
    <button
      onClick={() => !disabled && setChannel(c)}
      disabled={disabled}
      title={disabled ? 'No approved WhatsApp templates' : undefined}
      className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-sm font-semibold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        channel === c ? 'border-[#1565D8] bg-blue-50 text-[#1565D8]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {icon} {label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {step === 'review' && (
              <button onClick={() => setStep('compose')} className="p-1 -ml-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer">
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900">{step === 'compose' ? 'Send Communication' : 'Review & Confirm'}</h2>
              <p className="text-xs text-slate-500 mt-0.5">To {count} selected applicant{count === 1 ? '' : 's'}</p>
            </div>
          </div>
          <button onClick={close} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {step === 'compose' ? (
            <>
              {/* Channel picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {channelBtn('email', <Mail size={15} />, 'Email')}
                  {channelBtn('sms', <MessageSquare size={15} />, 'SMS')}
                  {channelBtn('whatsapp', <WhatsAppIcon />, 'WhatsApp', waTemplates.length === 0)}
                </div>
                {channel === 'sms' && (
                  <p className="text-[11px] text-slate-400 mt-1.5">SMS uses your messaging credits (1 credit / message unless BYO provider configured).</p>
                )}
                {channel === 'whatsapp' && (
                  <p className="text-[11px] text-slate-400 mt-1.5">WhatsApp requires an approved template. Marketing templates cost 2 credits / message, others 1.</p>
                )}
              </div>

              {channel === 'whatsapp' ? (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Template</label>
                    <select
                      value={templateId}
                      onChange={(e) => selectTemplate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565D8] bg-white cursor-pointer"
                    >
                      <option value="">Select an approved template…</option>
                      {waTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedTemplate && (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedTemplate.body}
                    </div>
                  )}
                  {selectedTemplate && Array.isArray(selectedTemplate.variables) && selectedTemplate.variables.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Template Variables</label>
                      {selectedTemplate.variables.map((v, i) => (
                        <div key={i}>
                          <span className="text-[11px] text-slate-500">{`{{${i + 1}}} · ${v}`}</span>
                          <input
                            type="text"
                            value={params[i] ?? ''}
                            onChange={(e) => setParams((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))}
                            placeholder={`Value for ${v} — {name} allowed`}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565D8] mt-0.5"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {channel === 'email' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Subject</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject line"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565D8]"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      placeholder="Type your message… use {name} to insert the contact name."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565D8] resize-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">{`{name}`} is replaced with the parent/applicant name per recipient.</p>
                  </div>
                </>
              )}
            </>
          ) : (
            /* Review step */
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-500 font-medium mb-1">Channel</div>
                  <div className="text-sm font-bold text-slate-900">{channelLabel}</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-500 font-medium mb-1">Recipients</div>
                  <div className="text-sm font-bold text-slate-900">Up to {count}</div>
                </div>
              </div>

              {perMsgCredits > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-800">
                    Spends up to <span className="font-bold">{creditEstimate}</span> messaging credit{creditEstimate === 1 ? '' : 's'} ({perMsgCredits}/message).
                    Recipients missing a {channel === 'email' ? 'valid email' : 'phone number'} are skipped and not charged.
                  </div>
                </div>
              )}

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Preview</div>
                {channel === 'email' && (
                  <div className="text-xs text-slate-500 mb-1">Subject: <span className="font-semibold text-slate-700">{subject}</span></div>
                )}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                  {previewText || '—'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Sample shown with name “{sampleName}”.</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={close} className="px-4 py-2 text-sm font-semibold text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer">
            Cancel
          </button>
          {step === 'compose' ? (
            <button
              onClick={() => setStep('review')}
              disabled={!composeValid}
              className="px-4 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Review
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {sending && <Loader2 size={14} className="animate-spin" />}
              {sending ? 'Sending…' : `Confirm & Send`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
