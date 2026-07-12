'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { format } from 'date-fns'
import { Inbox, Send, MessageCircle, Search, Lock, ExternalLink } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

type InboundMessage = {
  id: string
  phone: string
  body: string
  createdAt: string
  contactName: string | null
  leadId: string | null
  admissionId: string | null
}

type OutboundMessage = {
  id: string
  phone: string
  templateName: string
  ref: string | null
  status: string
  error: string | null
  createdAt: string
}

const STATUS_BADGE: Record<string, string> = {
  ACCEPTED: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-50 text-blue-700',
  DELIVERED: 'bg-green-50 text-green-700',
  READ: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-red-50 text-red-700'
}

export default function WhatsappMessagesPage() {
  const orgType = useSWR<{ success: boolean; data: { isWhatsappActive: boolean } }>(
    '/api/v1/settings/org-type', fetcher
  )
  const isActive = orgType.data?.data?.isWhatsappActive ?? false

  const inbox = useSWR<{ success: boolean; data: InboundMessage[] }>(
    isActive ? '/api/v1/whatsapp/inbox' : null, fetcher, { refreshInterval: 30000 }
  )
  const sent = useSWR<{ success: boolean; data: OutboundMessage[] }>(
    isActive ? '/api/v1/whatsapp/messages' : null, fetcher
  )

  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()

  if (!orgType.isLoading && !isActive) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-800">WhatsApp add-on not enabled</h3>
        <Link href="/settings/addons/whatsapp_addon" className="px-4 py-2 text-sm font-semibold bg-[#1565D8] hover:bg-blue-700 text-white rounded-lg">
          Go to Add-ons
        </Link>
      </div>
    )
  }

  const inboundRows = (inbox.data?.data ?? []).filter(
    m => !q || m.phone.includes(q) || (m.contactName ?? '').toLowerCase().includes(q) || m.body.toLowerCase().includes(q)
  )
  const sentRows = (sent.data?.data ?? []).filter(
    m => !q || m.phone.includes(q) || m.templateName.toLowerCase().includes(q)
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#1565D8]" />
          WhatsApp Messages
        </h3>
        <p className="text-sm text-slate-500">
          Replies from parents and the delivery log of every message sent from your workspace.
        </p>
      </div>

      <div className="relative w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search phone, name, template…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <Tabs defaultValue="inbox">
        <TabsList className="mb-5">
          <TabsTrigger value="inbox">
            <Inbox className="w-3.5 h-3.5 mr-1.5" /> Inbox
            {inboundRows.length > 0 && (
              <span className="ml-1.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full px-1.5">{inboundRows.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Send className="w-3.5 h-3.5 mr-1.5" /> Sent Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          {inbox.isLoading ? (
            <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ) : inboundRows.length === 0 ? (
            <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-6 text-center">
              No replies yet. When a parent responds to any WhatsApp message, it appears here.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200">
              {inboundRows.map(m => (
                <div key={m.id} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
                      {m.contactName ?? 'Unknown contact'}
                      <span className="text-xs font-mono font-normal text-slate-400">+91 {m.phone}</span>
                    </p>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap mt-0.5">{m.body}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {m.leadId && (
                        <Link href={`/lead-management/${m.leadId}`} className="text-xs font-semibold text-[#1565D8] flex items-center gap-1">
                          View lead <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                      {m.admissionId && (
                        <Link href={`/admission-management/${m.admissionId}`} className="text-xs font-semibold text-[#1565D8] flex items-center gap-1">
                          View admission <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {format(new Date(m.createdAt), 'd MMM, h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {sent.isLoading ? (
            <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ) : sentRows.length === 0 ? (
            <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-6 text-center">
              No messages sent yet.
            </p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">To</th>
                    <th className="px-4 py-3">Template</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sentRows.map(m => (
                    <tr key={m.id}>
                      <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">
                        {format(new Date(m.createdAt), 'd MMM, h:mm a')}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{m.phone}</td>
                      <td className="px-4 py-2.5 text-slate-700">{m.templateName}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[m.status] ?? STATUS_BADGE.ACCEPTED}`}>
                          {m.status}
                        </span>
                        {m.error && (
                          <span className="block text-[11px] text-red-500 mt-0.5 max-w-xs truncate" title={m.error}>{m.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
