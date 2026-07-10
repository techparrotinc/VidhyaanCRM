'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { AlertCircle, Loader2, CalendarDays } from 'lucide-react'
import { useWhatsappTemplates } from '@/hooks/useWhatsappTemplates'
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar as UiCalendar } from "@/components/ui/calendar"

// Dynamic Mail Icon (from lucide)
function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width="1em"
      height="1em"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

// SMS Icon (from lucide)
function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width="1em"
      height="1em"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

// WhatsApp Icon Helper
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      width="1em"
      height="1em"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.896 0c3.181.001 6.171 1.242 8.423 3.496 2.253 2.253 3.491 5.245 3.491 8.428 0 6.577-5.325 11.902-11.897 11.902-2.003 0-3.974-.505-5.724-1.467L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.805 1.454 5.332 0 9.673-4.34 9.675-9.673.002-2.583-1.002-5.011-2.83-6.839C16.39 2.27 13.96 1.267 11.38 1.266c-5.337 0-9.68 4.342-9.682 9.678-.001 1.704.453 3.368 1.314 4.821L2.005 21.99l6.233-1.636z" />
    </svg>
  )
}

function ChannelBadge({ channel }: { channel: string }) {
  let channelText = channel
  let bgClass = 'bg-slate-100 text-slate-600'
  let Icon: any = MailIcon

  if (channel === 'EMAIL') {
    channelText = 'Email'
    bgClass = 'bg-blue-50 text-blue-700'
    Icon = MailIcon
  } else if (channel === 'SMS') {
    channelText = 'SMS'
    bgClass = 'bg-amber-50 text-amber-700'
    Icon = MessageSquareIcon
  } else if (channel === 'WHATSAPP') {
    channelText = 'WhatsApp'
    bgClass = 'bg-green-50 text-green-700'
    Icon = WhatsAppIcon
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${bgClass}`}>
      <Icon className="w-3 h-3" />
      {channelText}
    </span>
  )
}

interface StepThreeProps {
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP'
  campaignName: string
  templateBody: string
  whatsappTemplateId: string
  formTemplateId: string
  scheduledAt: string | null
  sendNow: boolean
  recipientCount: number
  onBodyChange: (body: string) => void
  onTemplateChange: (templateId: string) => void
  onFormTemplateChange: (formId: string) => void
  onScheduleChange: (scheduledAt: string | null) => void
  onSendNowChange: (sendNow: boolean) => void
  onSubmit: (action: 'draft' | 'send' | 'schedule') => void
  isSubmitting: boolean
}

export function StepThree({
  channel,
  campaignName,
  templateBody,
  whatsappTemplateId,
  formTemplateId,
  scheduledAt,
  sendNow,
  recipientCount,
  onBodyChange,
  onTemplateChange,
  onFormTemplateChange,
  onScheduleChange,
  onSendNowChange,
  onSubmit,
  isSubmitting
}: StepThreeProps) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // WhatsApp templates fetching — lifted selection so the FK persists on
  // the campaign (the send path resolves the approved template from it)
  const { templates, isLoading: isTemplatesLoading } = useWhatsappTemplates(channel === 'WHATSAPP')
  const selectedTemplateId = whatsappTemplateId

  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(() => 
    scheduledAt ? new Date(scheduledAt) : undefined
  )
  const [scheduleTime, setScheduleTime] = useState<string>(() => 
    scheduledAt ? format(new Date(scheduledAt), 'HH:mm') : '09:00'
  )

  const updateSchedule = (date: Date | undefined, time: string) => {
    if (!date) {
      onScheduleChange(null)
      return
    }
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const timeStr = time || '09:00'
    const combinedStr = `${yyyy}-${mm}-${dd}T${timeStr}:00`
    onScheduleChange(new Date(combinedStr).toISOString())
  }

  const handleDateChange = (date: Date | undefined) => {
    setScheduleDate(date)
    updateSchedule(date, scheduleTime)
  }

  const handleTimeChange = (time: string) => {
    setScheduleTime(time)
    updateSchedule(scheduleDate, time)
  }

  // Local state inside StepThree for subject and body separately
  const [subject, setSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [smsBody, setSmsBody] = useState(templateBody ?? '')

  // Initialise from templateBody prop on mount only
  useEffect(() => {
    if (channel === 'EMAIL' && templateBody) {
      const lines = templateBody.split('\n')
      const firstLine = lines[0] ?? ''
      if (firstLine.startsWith('Subject:')) {
        setSubject(firstLine.replace('Subject:', '').trim())
        setEmailBody(lines.slice(2).join('\n').trim())
      } else {
        setEmailBody(templateBody)
      }
    } else if (channel === 'SMS') {
      setSmsBody(templateBody ?? '')
    }
  }, [])

  function insertAtCursor(variable: string) {
    if (channel === 'EMAIL') {
      const textarea = textareaRef.current
      if (!textarea) {
        setEmailBody((prev) => prev + variable)
        return
      }
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newBody = emailBody.slice(0, start) + variable + emailBody.slice(end)
      setEmailBody(newBody)
      requestAnimationFrame(() => {
        textarea.selectionStart = start + variable.length
        textarea.selectionEnd = start + variable.length
        textarea.focus()
      })
      onBodyChange(`Subject: ${subject}\n\n${newBody}`)
    } else if (channel === 'SMS') {
      const textarea = textareaRef.current
      if (!textarea) {
        setSmsBody((prev) => prev + variable)
        return
      }
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newBody = smsBody.slice(0, start) + variable + smsBody.slice(end)
      setSmsBody(newBody)
      requestAnimationFrame(() => {
        textarea.selectionStart = start + variable.length
        textarea.selectionEnd = start + variable.length
        textarea.focus()
      })
      onBodyChange(newBody)
    }
  }

  const selectedTemplate = templates.find((t: any) => t.id === selectedTemplateId)

  // Published digital forms available to attach (EMAIL/SMS only).
  const [forms, setForms] = useState<Array<{ id: string; name: string; purpose: string }>>([])
  useEffect(() => {
    if (channel === 'WHATSAPP') return
    ;(async () => {
      try {
        const res = await fetch('/api/v1/forms')
        const json = await res.json()
        setForms((json.data ?? []).filter((f: any) => f.status === 'PUBLISHED'))
      } catch {}
    })()
  }, [channel])

  return (
    <div className="space-y-6">
      {/* ATTACH DIGITAL FORM (EMAIL/SMS) */}
      {channel !== 'WHATSAPP' && forms.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Attach a digital form (optional)</p>
          <p className="text-xs text-slate-500">Each recipient gets a unique link. Insert <code className="rounded bg-slate-100 px-1">{'{{link}}'}</code> where it should appear in your message.</p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={formTemplateId}
              onChange={(e) => onFormTemplateChange(e.target.value)}
            >
              <option value="">No form</option>
              {forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            {formTemplateId && (
              <button
                type="button"
                onClick={() => insertAtCursor('{{link}}')}
                className="rounded-lg border border-[#1565D8] px-3 py-2 text-xs font-semibold text-[#1565D8] hover:bg-blue-50"
              >
                Insert {'{{link}}'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* CONTENT INPUT */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-700">
          Campaign Content
        </p>

        {/* EMAIL CHANNEL VIEW */}
        {channel === 'EMAIL' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Subject Line
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onBlur={() => onBodyChange(`Subject: ${subject}\n\n${emailBody}`)}
                placeholder="Email subject line..."
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Email Body
              </label>
              <textarea
                ref={textareaRef}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                onBlur={() => onBodyChange(`Subject: ${subject}\n\n${emailBody}`)}
                rows={8}
                placeholder="Dear {{parentName}},&#10;&#10;Your message here..."
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8]"
              />
            </div>
          </div>
        )}

        {/* SMS CHANNEL VIEW */}
        {channel === 'SMS' && (
          <div>
            <textarea
              ref={textareaRef}
              value={smsBody}
              onChange={(e) => setSmsBody(e.target.value)}
              onBlur={() => onBodyChange(smsBody)}
              rows={4}
              maxLength={320}
              placeholder="Your SMS message here..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8]"
            />
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-xs ${
                  smsBody.length > 160 ? 'text-amber-600 font-medium' : 'text-slate-400'
                }`}
              >
                {smsBody.length} / 160 characters
              </span>
              {smsBody.length > 160 && (
                <span className="text-xs text-amber-600 font-medium">
                  ⚠️ Will be sent as {Math.ceil(smsBody.length / 160)} SMS per recipient
                </span>
              )}
            </div>
          </div>
        )}

        {/* WHATSAPP CHANNEL VIEW */}
        {channel === 'WHATSAPP' && (
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">
              Select Template *
            </label>

            {isTemplatesLoading ? (
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ) : templates.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  No WhatsApp templates found.{' '}
                  <span
                    className="font-medium underline cursor-pointer"
                    onClick={() => router.push('/settings/whatsapp-templates')}
                  >
                    Add a template in Settings
                  </span>{' '}
                  before sending a WhatsApp campaign.
                </p>
              </div>
            ) : (
              <>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const t = templates.find((t: any) => t.id === e.target.value)
                    if (t) onBodyChange(t.body)
                    onTemplateChange(e.target.value)
                  }}
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8]"
                >
                  <option value="">Choose a template...</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                {selectedTemplate && (
                  <div className="mt-3 p-4 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700 mb-2">
                      Template Preview
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {templateBody}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      MSG91 ID: {selectedTemplate.msg91TemplateId}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* VARIABLES TOOLBAR (EMAIL & SMS only) */}
        {channel !== 'WHATSAPP' && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              Insert variable
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                '{{parentName}}',
                '{{kidName}}',
                '{{schoolName}}',
                '{{date}}',
                '{{amount}}'
              ].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertAtCursor(v)}
                  className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-600 font-mono hover:bg-slate-100 transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Click to insert at cursor position
            </p>
          </div>
        )}
      </div>

      {/* SCHEDULE SECTION */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 overflow-visible">
        <p className="text-sm font-semibold text-slate-700 mb-3">
          When to send?
        </p>

        <div className="space-y-2">
          {/* Send immediately */}
          <label
            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              sendNow ? 'border-[#1565D8] bg-[#1565D8]/5' : 'border-slate-200 bg-white'
            }`}
          >
            <input
              type="radio"
              name="schedule"
              checked={sendNow}
              onChange={() => {
                onSendNowChange(true)
                onScheduleChange(null)
              }}
              className="accent-[#1565D8]"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Send immediately
              </p>
              <p className="text-xs text-slate-400">
                Campaign will be sent as soon as you confirm
              </p>
            </div>
          </label>

          {/* Schedule for later */}
          <div
            onClick={() => {
              if (sendNow) {
                onSendNowChange(false)
                updateSchedule(scheduleDate, scheduleTime)
              }
            }}
            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              !sendNow ? 'border-[#1565D8] bg-[#1565D8]/5' : 'border-slate-200 bg-white'
            }`}
          >
            <input
              type="radio"
              name="schedule"
              checked={!sendNow}
              onChange={() => {}}
              className="accent-[#1565D8] mt-0.5 pointer-events-none"
            />
            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-semibold text-slate-800">
                Schedule for later
              </p>
              <p className="text-xs text-slate-400">
                Choose a date and time to send
              </p>
              {!sendNow && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {/* Date Picker */}
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                      Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 flex items-center gap-2 text-slate-700 text-left focus:outline-none focus:border-[#1565D8] transition"
                        >
                          <CalendarDays size={13} className="text-slate-400 flex-shrink-0" />
                          <span className="flex-1 truncate">
                            {scheduleDate
                              ? format(scheduleDate, 'd MMM yyyy')
                              : 'Select date'}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        avoidCollisions={true}
                        collisionPadding={16}
                        sideOffset={4}
                        className="z-[9999] w-auto p-0 shadow-xl rounded-xl border border-slate-200"
                      >
                        <UiCalendar
                          mode="single"
                          selected={scheduleDate}
                          onSelect={handleDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Picker */}
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 block mb-1">
                      Time
                    </label>
                    <select
                      value={scheduleTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-[#1565D8] transition"
                    >
                      <option value="09:00">9:00 AM</option>
                      <option value="09:30">9:30 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="10:30">10:30 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="11:30">11:30 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="12:30">12:30 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="13:30">1:30 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="14:30">2:30 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="15:30">3:30 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="16:30">4:30 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="17:30">5:30 PM</option>
                      <option value="18:00">6:00 PM</option>
                      <option value="18:30">6:30 PM</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY BAR */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <ChannelBadge channel={channel} />
          <span className="text-sm text-slate-600">
            <span className="font-semibold">{recipientCount}</span> recipient
            {recipientCount !== 1 ? 's' : ''}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-slate-600">
            {sendNow
              ? 'Sends immediately'
              : scheduledAt
              ? `Scheduled for ${format(new Date(scheduledAt), 'd MMM yyyy, h:mm a')}`
              : 'Schedule date not set'}
          </span>
        </div>
      </div>

      {/* FOOTER BUTTONS */}
      <div className="flex items-center gap-3 mt-4 justify-end">
        <button
          type="button"
          onClick={() => onSubmit('draft')}
          disabled={isSubmitting}
          className="px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
        >
          Save as Draft
        </button>

        <button
          type="button"
          onClick={() => onSubmit(sendNow ? 'send' : 'schedule')}
          disabled={
            isSubmitting ||
            !templateBody.trim() ||
            (channel === 'WHATSAPP' && !whatsappTemplateId) ||
            (!sendNow && !scheduledAt) ||
            recipientCount === 0
          }
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1565D8] text-white text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {sendNow ? 'Send Campaign' : 'Schedule Campaign'}
        </button>
      </div>
    </div>
  )
}
