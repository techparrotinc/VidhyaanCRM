'use client'

import { useEffect, useState } from 'react'
import { Send, X, Mail, MessageSquare, Copy, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Channel = 'EMAIL' | 'SMS' | 'WHATSAPP'

interface FormOption { id: string; name: string; purpose: string }

// Reusable across Lead & Admission detail. Picks a form + channel, mints a
// link and sends it. Works for any target type through the send API.
export function SendFormButton({
  targetType,
  targetId,
  hasEmail,
  hasPhone,
  label = 'Send Application',
  className,
}: {
  targetType: 'ADMISSION' | 'LEAD'
  targetId: string
  hasEmail?: boolean
  hasPhone?: boolean
  label?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [forms, setForms] = useState<FormOption[]>([])
  const [formId, setFormId] = useState('')
  const [channel, setChannel] = useState<Channel>(hasEmail ? 'EMAIL' : 'SMS')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const [loadingForms, setLoadingForms] = useState(true)

  useEffect(() => {
    if (!open) return
    setLoadingForms(true)
    ;(async () => {
      const res = await fetch('/api/v1/forms')
      const json = await res.json()
      // Any published form can be sent — the record it lands on (Lead vs
      // Admission) is decided by where you send from, not the form's purpose.
      const eligible = (json.data ?? []).filter((f: any) => f.status === 'PUBLISHED')
      setForms(eligible.map((f: any) => ({ id: f.id, name: f.name, purpose: f.purpose })))
      setLoadingForms(false)
    })()
  }, [open])

  const send = async () => {
    setSending(true); setError(null)
    try {
      const res = await fetch('/api/v1/forms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: formId || undefined, targetType, targetId, channel }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message || json?.error || 'Send failed')
      setResult({ url: json.data.url })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  const reset = () => { setOpen(false); setResult(null); setError(null); setCopied(false) }

  return (
    <>
      <Button variant="outline" className={className ?? 'gap-2'} onClick={() => setOpen(true)}>
        <Send className="h-4 w-4" /> {label}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={reset}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Send Application Form</h2>
              <button onClick={reset} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>

            {result ? (
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-5 w-5" /> Form sent
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                  <input readOnly value={result.url} className="min-w-0 flex-1 bg-transparent text-xs text-slate-500 outline-none" />
                  <button
                    onClick={() => { navigator.clipboard.writeText(result.url); setCopied(true) }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1565D8]"
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <Button className="w-full" onClick={reset}>Done</Button>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Form</label>
                  <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={formId} onChange={(e) => setFormId(e.target.value)}>
                    {forms.length > 0 && <option value="">Auto — use default form</option>}
                    {forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  {!loadingForms && forms.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No published form yet. Create and publish one in Settings → Admission Forms, then come back here.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Channel</label>
                  <div className="grid grid-cols-2 gap-2">
                    <ChannelBtn active={channel === 'EMAIL'} disabled={!hasEmail} onClick={() => setChannel('EMAIL')} icon={<Mail className="h-4 w-4" />} text="Email" />
                    <ChannelBtn active={channel === 'SMS'} disabled={!hasPhone} onClick={() => setChannel('SMS')} icon={<MessageSquare className="h-4 w-4" />} text="SMS" />
                    <ChannelBtn active={channel === 'WHATSAPP'} disabled={!hasPhone} onClick={() => setChannel('WHATSAPP')} icon={<MessageSquare className="h-4 w-4" />} text="WhatsApp" />
                  </div>
                  {channel === 'SMS' && <p className="mt-1 text-xs text-slate-400">Uses 1 messaging credit (or your MSG91 account).</p>}
                  {channel === 'WHATSAPP' && <p className="mt-1 text-xs text-slate-400">Uses 1 WhatsApp credit · needs the &quot;upload documents&quot; template added from the catalog.</p>}
                </div>

                {error && <p className="text-sm font-medium text-red-600">{error}</p>}

                <Button className="w-full gap-2" disabled={sending || forms.length === 0 || (channel === 'EMAIL' && !hasEmail) || (channel !== 'EMAIL' && !hasPhone)} onClick={send}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? 'Sending…' : 'Send'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ChannelBtn({ active, disabled, onClick, icon, text }: { active: boolean; disabled?: boolean; onClick: () => void; icon: React.ReactNode; text: string }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${active ? 'border-[#1565D8] bg-blue-50 text-[#1565D8]' : 'border-slate-200 text-slate-600'} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {icon}{text}
    </button>
  )
}
