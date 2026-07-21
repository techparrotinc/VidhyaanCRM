'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { AlertCircle, Loader2, CalendarDays, ImagePlus, X, Send, Mail, Monitor, Smartphone, FileText, FlaskConical } from 'lucide-react'
import { appAlert } from '@/components/ui/app-alert'
import { useWhatsappTemplates } from '@/hooks/useWhatsappTemplates'
import { previewTemplateBody } from '@/lib/campaign/templateParams'
import { renderCampaignEmailHtml, renderBlocksToHtml, type EmailBlock } from '@/lib/campaign/renderEmail'
import { BlockBuilder } from './BlockBuilder'
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar as UiCalendar } from "@/components/ui/calendar"
import { AppSelect } from '@/components/ui/app-select'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} width="1em" height="1em">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.896 0c3.181.001 6.171 1.242 8.423 3.496 2.253 2.253 3.491 5.245 3.491 8.428 0 6.577-5.325 11.902-11.897 11.902-2.003 0-3.974-.505-5.724-1.467L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.805 1.454 5.332 0 9.673-4.34 9.675-9.673.002-2.583-1.002-5.011-2.83-6.839C16.39 2.27 13.96 1.267 11.38 1.266c-5.337 0-9.68 4.342-9.682 9.678-.001 1.704.453 3.368 1.314 4.821L2.005 21.99l6.233-1.636z" />
    </svg>
  )
}

const SCHEDULE_TIMES = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30']

// Small section card wrapper for a clean, consistent editor rail.
function Section({ title, icon: Icon, action, children }: { title: string; icon?: any; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />} {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  )
}

interface StepThreeProps {
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP'
  campaignName: string
  templateBody: string
  whatsappTemplateId: string
  formTemplateId: string
  paramValues: Record<string, string>
  heroImageUrl: string
  scheduledAt: string | null
  sendNow: boolean
  recipientCount: number
  abTest?: { enabled: boolean; bSubject: string; bBody: string; percent: number }
  onAbChange?: (v: { enabled: boolean; bSubject: string; bBody: string; percent: number }) => void
  emailBlocks?: EmailBlock[]
  onBlocksChange?: (b: EmailBlock[]) => void
  /** Rich-text WYSIWYG HTML body (EMAIL). */
  emailHtml?: string
  onEmailHtmlChange?: (html: string) => void
  onHeroImageChange: (url: string) => void
  onBodyChange: (body: string) => void
  onTemplateChange: (templateId: string) => void
  onParamValuesChange: (values: Record<string, string>) => void
  onFormTemplateChange: (formId: string) => void
  onScheduleChange: (scheduledAt: string | null) => void
  onSendNowChange: (sendNow: boolean) => void
  onSubmit: (action: 'draft' | 'send' | 'schedule') => void
  isSubmitting: boolean
}

export function StepThree(props: StepThreeProps) {
  const {
    channel, campaignName, templateBody, whatsappTemplateId, formTemplateId,
    paramValues, heroImageUrl, scheduledAt, sendNow, recipientCount,
    abTest, onAbChange, emailBlocks, onBlocksChange, emailHtml, onEmailHtmlChange,
    onHeroImageChange, onBodyChange, onTemplateChange, onParamValuesChange,
    onFormTemplateChange, onScheduleChange, onSendNowChange, onSubmit, isSubmitting,
  } = props

  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const rteRef = useRef<RichTextEditorHandle>(null)

  const { templates, isLoading: isTemplatesLoading } = useWhatsappTemplates(channel === 'WHATSAPP')
  const selectedTemplateId = whatsappTemplateId
  const selectedTemplate = templates.find((t: any) => t.id === selectedTemplateId)

  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(() => scheduledAt ? new Date(scheduledAt) : undefined)
  const [scheduleTime, setScheduleTime] = useState<string>(() => scheduledAt ? format(new Date(scheduledAt), 'HH:mm') : '09:00')

  const updateSchedule = (date: Date | undefined, time: string) => {
    if (!date) { onScheduleChange(null); return }
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    onScheduleChange(new Date(`${yyyy}-${mm}-${dd}T${time || '09:00'}:00`).toISOString())
  }
  const handleDateChange = (date: Date | undefined) => { setScheduleDate(date); updateSchedule(date, scheduleTime) }
  const handleTimeChange = (time: string) => { setScheduleTime(time); updateSchedule(scheduleDate, time) }

  const [subject, setSubject] = useState('')
  const [smsBody, setSmsBody] = useState(templateBody ?? '')
  const initialHtmlRef = useRef(emailHtml ?? '')

  // Email body editor mode: 'text' = rich-text WYSIWYG, 'blocks' = block builder.
  const blocksAvailable = !!emailBlocks && !!onBlocksChange
  const richAvailable = !!onEmailHtmlChange
  const [builderMode, setBuilderMode] = useState<'text' | 'blocks'>((emailBlocks?.length ?? 0) > 0 ? 'blocks' : 'text')
  const usingBlocks = blocksAvailable && builderMode === 'blocks'
  const usingRich = richAvailable && channel === 'EMAIL' && !usingBlocks

  const commitSubject = (subj: string) => onBodyChange(`Subject: ${subj}\n\n`)

  const [isUploading, setIsUploading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  async function handleHeroUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) { appAlert('Image too large (max 5MB)'); return }
    setIsUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('category', 'campaigns')
      const res = await fetch('/api/v1/files/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success && json.url) onHeroImageChange(json.url)
      else appAlert(json.error || 'Failed to upload image')
    } catch { appAlert('Failed to upload image') } finally { setIsUploading(false) }
  }

  async function handleTestSend() {
    if (!testEmail.trim()) { appAlert('Enter an email address to send the test to'); return }
    setIsTesting(true)
    try {
      const res = await fetch('/api/v1/campaigns/test-send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'EMAIL', to: testEmail.trim(),
          templateBody: `Subject: ${subject}\n\n`,
          heroImageUrl: heroImageUrl || null,
          emailBlocks: usingBlocks ? emailBlocks : null,
          emailHtml: usingRich ? (emailHtml || '') : null,
        }),
      })
      const json = await res.json()
      appAlert(res.ok ? `Test email sent to ${testEmail.trim()}` : (json.error || 'Failed to send test email'))
    } catch { appAlert('Failed to send test email') } finally { setIsTesting(false) }
  }

  function fillSampleVars(text: string): string {
    return text
      .replace(/\{\{parentName\}\}/g, 'Priya Sharma')
      .replace(/\{\{kidName\}\}/g, 'Aarav')
      .replace(/\{\{schoolName\}\}/g, 'Your institution')
      .replace(/\{\{grade\}\}/g, 'Grade 5')
      .replace(/\{\{date\}\}/g, format(new Date(), 'd MMM yyyy'))
      .replace(/\{\{amount\}\}/g, '₹5,000')
      .replace(/\{\{link\}\}/g, 'https://vidhyaan.com/f/preview')
  }

  useEffect(() => {
    if (channel === 'EMAIL' && templateBody) {
      const lines = templateBody.split('\n')
      if ((lines[0] ?? '').startsWith('Subject:')) setSubject(lines[0].replace('Subject:', '').trim())
    } else if (channel === 'SMS') setSmsBody(templateBody ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function insertAtCursor(variable: string) {
    // EMAIL rich-text → insert into the WYSIWYG editor at the caret.
    if (channel === 'EMAIL') { rteRef.current?.insertText(variable); return }
    // SMS → plain textarea.
    const textarea = textareaRef.current
    if (!textarea) { setSmsBody((p) => { const n = p + variable; onBodyChange(n); return n }); return }
    const start = textarea.selectionStart, end = textarea.selectionEnd
    const next = smsBody.slice(0, start) + variable + smsBody.slice(end)
    setSmsBody(next); onBodyChange(next)
    requestAnimationFrame(() => { textarea.selectionStart = textarea.selectionEnd = start + variable.length; textarea.focus() })
  }

  const [forms, setForms] = useState<Array<{ id: string; name: string; purpose: string }>>([])
  useEffect(() => {
    if (channel === 'WHATSAPP') return
    ;(async () => {
      try {
        const res = await fetch('/api/v1/forms'); const json = await res.json()
        setForms((json.data ?? []).filter((f: any) => f.status === 'PUBLISHED'))
      } catch {}
    })()
  }, [channel])

  // Rich HTML with no real text (just empty tags) shouldn't count as content.
  const richHasText = !!(emailHtml && emailHtml.replace(/<[^>]*>/g, '').trim().length > 0)
  const emailHasBody = usingBlocks ? !!(emailBlocks && emailBlocks.length > 0) : richHasText
  const canSend =
    !isSubmitting &&
    (channel === 'EMAIL' ? emailHasBody : !!templateBody.trim()) &&
    !(channel === 'WHATSAPP' && !whatsappTemplateId) &&
    (sendNow || !!scheduledAt) &&
    recipientCount > 0

  const inputCls = 'w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8]'

  // ── Live preview content ──────────────────────────────────────────────
  const emailPreviewHtml = usingBlocks
    ? renderCampaignEmailHtml({ html: fillSampleVars(renderBlocksToHtml(emailBlocks ?? [])), imageUrl: heroImageUrl || null })
    : renderCampaignEmailHtml({ html: fillSampleVars(emailHtml || '<span style="color:#94a3b8">Your message will appear here…</span>'), imageUrl: heroImageUrl || null })
  const smsPreview = fillSampleVars(smsBody || 'Your SMS message will appear here…')
  const waPreview = selectedTemplate
    ? previewTemplateBody(selectedTemplate.body, selectedTemplate.variables, {
        schoolName: 'Your institution', date: format(new Date(), 'd MMM yyyy'),
        ...Object.fromEntries(Object.entries(paramValues).filter(([, v]) => v?.trim())),
      })
    : 'Select a template to preview your WhatsApp message.'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,400px)] gap-6 items-start">
        {/* ══════════ EDITOR (left) ══════════ */}
        <div className="space-y-4 min-w-0">
          {/* CONTENT */}
          <Section
            title="Message"
            icon={channel === 'EMAIL' ? Mail : channel === 'WHATSAPP' ? WhatsAppIcon : Send}
            action={channel === 'EMAIL' && blocksAvailable ? (
              <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[11px] font-semibold">
                <button type="button" onClick={() => { setBuilderMode('text'); onBlocksChange!([]) }} className={`px-2.5 py-1 ${!usingBlocks ? 'bg-[#1565D8] text-white' : 'bg-white text-slate-500'}`}>Text</button>
                <button type="button" onClick={() => setBuilderMode('blocks')} className={`px-2.5 py-1 ${usingBlocks ? 'bg-[#1565D8] text-white' : 'bg-white text-slate-500'}`}>Blocks</button>
              </div>
            ) : undefined}
          >
            {/* EMAIL */}
            {channel === 'EMAIL' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Subject line</label>
                  <input value={subject} onChange={(e) => { setSubject(e.target.value); commitSubject(e.target.value) }} placeholder="e.g. Parent–Teacher Meeting this Saturday" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Body</label>
                  {usingBlocks ? (
                    <BlockBuilder blocks={emailBlocks!} onChange={onBlocksChange!} />
                  ) : (
                    <RichTextEditor ref={rteRef} initialHtml={initialHtmlRef.current} onChange={(html) => onEmailHtmlChange?.(html)} placeholder="Dear {{parentName}}, write your message here…" />
                  )}
                </div>
              </div>
            )}

            {/* SMS */}
            {channel === 'SMS' && (
              <div>
                <textarea ref={textareaRef} value={smsBody} onChange={(e) => setSmsBody(e.target.value)} onBlur={() => onBodyChange(smsBody)} rows={5} maxLength={320} placeholder="Your SMS message here…" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8]" />
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${smsBody.length > 160 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>{smsBody.length} / 160 characters</span>
                  {smsBody.length > 160 && <span className="text-xs text-amber-600 font-medium">≈ {Math.ceil(smsBody.length / 160)} SMS / recipient</span>}
                </div>
              </div>
            )}

            {/* WHATSAPP */}
            {channel === 'WHATSAPP' && (
              isTemplatesLoading ? (
                <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ) : templates.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-700">No WhatsApp templates found. <span className="font-medium underline cursor-pointer" onClick={() => router.push('/settings/whatsapp-templates')}>Add one in Settings</span> first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Approved template *</label>
                    <AppSelect value={selectedTemplateId} onChange={(e) => { const t = templates.find((t: any) => t.id === e.target.value); if (t) onBodyChange(t.body); onTemplateChange(e.target.value) }} className={inputCls}>
                      <option value="">Choose a template…</option>
                      {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </AppSelect>
                  </div>
                  {selectedTemplate && selectedTemplate.metaCategory === 'MARKETING' && (
                    <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">Marketing template · 2 credits per recipient</p>
                  )}
                  {selectedTemplate && (() => {
                    const AUTO = new Set(['parentName', 'schoolName', 'date', 'link'])
                    const customTokens = Array.from(new Set((Array.isArray(selectedTemplate.variables) ? (selectedTemplate.variables as string[]) : []).filter(t => !AUTO.has(t))))
                    if (customTokens.length === 0) return null
                    return (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fill in the details</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {customTokens.map(token => (
                            <div key={token}>
                              <label className="text-xs font-semibold text-slate-600 block mb-1 capitalize">{token.replace(/([A-Z])/g, ' $1')}</label>
                              <input value={paramValues[token] ?? ''} onChange={e => onParamValuesChange({ ...paramValues, [token]: e.target.value })} placeholder={token === 'reason' ? 'Diwali festival' : token === 'resumeDate' ? '17 Nov 2026' : '…'} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#1565D8]" />
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400">Name, institution, date and form links fill in automatically. Blank fields send as &quot;-&quot;.</p>
                      </div>
                    )
                  })()}
                </div>
              )
            )}

            {/* VARIABLES (email + sms, plain body) */}
            {channel !== 'WHATSAPP' && !usingBlocks && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Insert:</span>
                {['{{parentName}}', '{{kidName}}', '{{schoolName}}', '{{date}}', '{{amount}}'].map((v) => (
                  <button key={v} type="button" onClick={() => insertAtCursor(v)} className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 font-mono hover:bg-slate-100">{v}</button>
                ))}
              </div>
            )}
          </Section>

          {/* HEADER IMAGE (email) */}
          {channel === 'EMAIL' && (
            <Section title="Header image" icon={ImagePlus} action={<span className="text-[11px] text-slate-400">optional</span>}>
              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeroUpload(f); e.target.value = '' }} />
              {heroImageUrl ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroImageUrl} alt="Header" className="max-h-36 rounded-lg border border-slate-200" />
                  <button type="button" onClick={() => onHeroImageChange('')} className="absolute -top-2 -right-2 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-red-50 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-lg hover:border-[#1565D8] hover:text-[#1565D8] disabled:opacity-50">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}{isUploading ? 'Uploading…' : 'Add header image'}
                </button>
              )}
            </Section>
          )}

          {/* ATTACH FORM */}
          {forms.length > 0 && channel !== 'WHATSAPP' && (
            <Section title="Attach a digital form" icon={FileText} action={<span className="text-[11px] text-slate-400">optional</span>}>
              <p className="text-xs text-slate-500">Each recipient gets a unique link. Insert <code className="rounded bg-slate-100 px-1">{'{{link}}'}</code> where it should appear.</p>
              <div className="flex flex-wrap items-center gap-2">
                <AppSelect className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={formTemplateId} onChange={(e) => onFormTemplateChange(e.target.value)}>
                  <option value="">No form</option>
                  {forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </AppSelect>
                {formTemplateId && <button type="button" onClick={() => insertAtCursor('{{link}}')} className="rounded-lg border border-[#1565D8] px-3 py-2 text-xs font-semibold text-[#1565D8] hover:bg-blue-50">Insert {'{{link}}'}</button>}
              </div>
            </Section>
          )}

          {/* A/B TEST (email, plain) */}
          {channel === 'EMAIL' && abTest && onAbChange && !usingBlocks && (
            <Section title="A/B test" icon={FlaskConical} action={
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] font-semibold text-slate-400">{abTest.enabled ? 'On' : 'Off'}</span>
                <input type="checkbox" checked={abTest.enabled} onChange={(e) => onAbChange({ ...abTest, enabled: e.target.checked })} className="accent-[#1565D8]" />
              </label>
            }>
              {abTest.enabled ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Variant A is the message above. A sample gets each variant; pick the winner from the report to send to everyone else.</p>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Variant B — subject</label>
                    <input value={abTest.bSubject} onChange={(e) => onAbChange({ ...abTest, bSubject: e.target.value })} placeholder="Alternate subject line…" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Variant B — body</label>
                    <textarea value={abTest.bBody} onChange={(e) => onAbChange({ ...abTest, bBody: e.target.value })} rows={5} placeholder="Alternate email body…" className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:border-[#1565D8]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Test sample: {abTest.percent}% of audience (split A/B)</label>
                    <input type="range" min={10} max={100} step={10} value={abTest.percent} onChange={(e) => onAbChange({ ...abTest, percent: Number(e.target.value) })} className="w-full accent-[#1565D8]" />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Try two subject lines / bodies and let opens pick the winner.</p>
              )}
            </Section>
          )}

          {/* SCHEDULE */}
          <Section title="When to send" icon={CalendarDays}>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { onSendNowChange(true); onScheduleChange(null) }} className={`p-3 rounded-xl border-2 text-left transition-all ${sendNow ? 'border-[#1565D8] bg-[#1565D8]/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <p className="text-sm font-semibold text-slate-800">Send now</p>
                <p className="text-xs text-slate-400">As soon as you confirm</p>
              </button>
              <button type="button" onClick={() => { onSendNowChange(false); updateSchedule(scheduleDate, scheduleTime) }} className={`p-3 rounded-xl border-2 text-left transition-all ${!sendNow ? 'border-[#1565D8] bg-[#1565D8]/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <p className="text-sm font-semibold text-slate-800">Schedule</p>
                <p className="text-xs text-slate-400">Pick date &amp; time</p>
              </button>
            </div>
            {!sendNow && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 flex items-center gap-2 text-slate-700 text-left focus:outline-none focus:border-[#1565D8]">
                        <CalendarDays size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="flex-1 truncate">{scheduleDate ? format(scheduleDate, 'd MMM yyyy') : 'Select date'}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" avoidCollisions collisionPadding={16} sideOffset={4} className="z-[9999] w-auto p-0 shadow-xl rounded-xl border border-slate-200">
                      <UiCalendar mode="single" selected={scheduleDate} onSelect={handleDateChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">Time</label>
                  <AppSelect value={scheduleTime} onChange={(e) => handleTimeChange(e.target.value)} className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8]">
                    {SCHEDULE_TIMES.map(t => { const [h, m] = t.split(':'); const hr = Number(h); const ap = hr >= 12 ? 'PM' : 'AM'; const h12 = hr % 12 || 12; return <option key={t} value={t}>{h12}:{m} {ap}</option> })}
                  </AppSelect>
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* ══════════ LIVE PREVIEW (right, sticky) ══════════ */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Live preview</p>
              {channel === 'EMAIL' && (
                <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <button type="button" onClick={() => setDevice('desktop')} className={`p-1.5 ${device === 'desktop' ? 'bg-[#1565D8] text-white' : 'text-slate-400'}`}><Monitor className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => setDevice('mobile')} className={`p-1.5 ${device === 'mobile' ? 'bg-[#1565D8] text-white' : 'text-slate-400'}`}><Smartphone className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-100 max-h-[70vh] overflow-y-auto">
              {/* EMAIL preview */}
              {channel === 'EMAIL' && (
                <div className={`mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all ${device === 'mobile' ? 'max-w-[320px]' : 'w-full'}`}>
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-[13px] font-bold text-slate-800 leading-snug">{subject || <span className="text-slate-300 font-normal">No subject yet</span>}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{campaignName || 'Your institution'} · campaigns@send.vidhyaan.com</p>
                  </div>
                  <div className="p-4 text-[13px]" dangerouslySetInnerHTML={{ __html: emailPreviewHtml }} />
                </div>
              )}

              {/* SMS / WhatsApp preview (phone) */}
              {channel !== 'EMAIL' && (
                <div className="mx-auto max-w-[300px] bg-white rounded-[2rem] border-4 border-slate-800 p-3 shadow-sm">
                  <div className={`rounded-2xl p-3 min-h-[160px] ${channel === 'WHATSAPP' ? 'bg-[#e5ddd5]' : 'bg-slate-100'}`}>
                    <div className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-[13px] whitespace-pre-wrap shadow-sm ${channel === 'WHATSAPP' ? 'bg-[#dcf8c6] text-slate-800' : 'bg-white text-slate-800 border border-slate-200'}`}>
                      {channel === 'WHATSAPP' ? waPreview : smsPreview}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TEST SEND (email) */}
            {channel === 'EMAIL' && (
              <div className="px-4 py-3 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-semibold text-slate-500">Send yourself a test</p>
                <div className="flex gap-2">
                  <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com" className="flex-1 min-w-0 h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1565D8]" />
                  <button type="button" onClick={handleTestSend} disabled={isTesting || !emailHasBody} className="flex items-center gap-1.5 px-3 h-9 text-xs font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-40">
                    {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}Test
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 px-1">Preview uses sample values for personalisation tokens.</p>
        </div>
      </div>

      {/* ══════════ FOOTER ══════════ */}
      <div className="sticky bottom-0 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-white/95 backdrop-blur border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
          <span className="font-semibold text-slate-800">{recipientCount}</span> recipient{recipientCount !== 1 ? 's' : ''}
          <span className="text-slate-300">·</span>
          <span>{sendNow ? 'Sends immediately' : scheduledAt ? `Scheduled ${format(new Date(scheduledAt), 'd MMM, h:mm a')}` : 'Pick a schedule'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onSubmit('draft')} disabled={isSubmitting} className="px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Save draft</button>
          <button type="button" onClick={() => onSubmit(sendNow ? 'send' : 'schedule')} disabled={!canSend} className="flex items-center gap-2 px-5 py-2.5 bg-[#1565D8] text-white text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}{sendNow ? 'Send campaign' : 'Schedule campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}
