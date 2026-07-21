'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import { ArrowLeft, Users, Send, CheckCircle, TrendingUp, Mail, MousePointer, AlertCircle, AlertTriangle, Trophy, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fetcher } from '@/lib/fetcher'
import { appAlert } from '@/components/ui/app-alert'

// Custom WhatsApp / Icon helper component
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

const statusBadgeColors = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SCHEDULED: 'bg-blue-50 text-blue-700',
  SENDING: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-green-50 text-green-700',
  FAILED: 'bg-red-50 text-red-700'
}

function StatusBadge({ status }: { status: string }) {
  const badgeClass = statusBadgeColors[status as keyof typeof statusBadgeColors] || 'bg-slate-100 text-slate-600'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${badgeClass}`}>
      {status}
    </span>
  )
}

function ChannelBadge({ channel }: { channel: string }) {
  let channelText = channel
  let bgClass = 'bg-slate-100 text-slate-600'
  let Icon: any = Mail

  if (channel === 'EMAIL') {
    channelText = 'Email'
    bgClass = 'bg-blue-50 text-blue-700'
    Icon = Mail
  } else if (channel === 'SMS') {
    channelText = 'SMS'
    bgClass = 'bg-amber-50 text-amber-700'
    Icon = Send
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

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor
}: {
  label: string
  value: string | number
  icon: any
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="text-xl font-bold text-slate-800 leading-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsDashboard({ id }: { id: string }) {
  const router = useRouter()
  const [recipientSearch, setRecipientSearch] = useState('')
  const [sendingWinner, setSendingWinner] = useState<string | null>(null)

  const { data, error, isLoading } = useSWR(
    `/api/v1/campaigns/${id}/analytics`,
    fetcher
  )

  async function sendWinner(winnerKey?: string) {
    setSendingWinner(winnerKey ?? 'auto')
    try {
      const res = await fetch(`/api/v1/campaigns/${id}/ab-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(winnerKey ? { winnerKey } : {}),
      })
      const json = await res.json()
      if (res.ok) {
        appAlert(`Winner “${json.data.winnerKey}” sent to ${json.data.sentToRemainder} more recipients.`)
        mutate(`/api/v1/campaigns/${id}/analytics`)
      } else appAlert(json.error || 'Failed to send winner')
    } finally {
      setSendingWinner(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-lg w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>
        <div className="h-60 bg-slate-100 rounded-xl" />
      </div>
    )
  }

  if (error || !data?.success || !data?.data) {
    return (
      <div className="p-4 lg:p-6 text-center space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Campaign not found</h2>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 mx-auto bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    )
  }

  const { campaign, stats, recipients, variantStats } = data.data
  const hasAb = Array.isArray(variantStats) && variantStats.length > 0
  const heldPending = recipients.filter((r: any) => r.status === 'PENDING' && !r.variantKey).length
  const winnerPending = hasAb && !campaign.abWinnerKey && heldPending > 0

  const filteredRecipients = recipients.filter((r: any) =>
    (r.name || '').toLowerCase().includes(recipientSearch.toLowerCase())
  )

  const getRecipientTypeBadge = (type: string) => {
    if (type === 'LEAD') return 'bg-purple-50 text-purple-700'
    if (type === 'STUDENT_GUARDIAN') return 'bg-blue-50 text-blue-700'
    if (type === 'PARENT') return 'bg-teal-50 text-teal-700'
    return 'bg-slate-50 text-slate-700'
  }

  const getRecipientStatusBadge = (status: string) => {
    if (status === 'PENDING') return 'bg-slate-100 text-slate-600'
    if (status === 'SENT') return 'bg-blue-50 text-blue-700'
    if (status === 'DELIVERED') return 'bg-green-50 text-green-700'
    if (status === 'READ') return 'bg-emerald-100 text-emerald-800'
    if (status === 'FAILED') return 'bg-red-50 text-red-700'
    if (status === 'BOUNCED') return 'bg-orange-50 text-orange-700'
    if (status === 'COMPLAINED') return 'bg-rose-100 text-rose-800'
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-slate-800 truncate">
            {campaign.name}
          </h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <ChannelBadge channel={campaign.channel} />
            <StatusBadge status={campaign.status} />
            {campaign.sentAt && (
              <span className="text-xs text-slate-400">
                Sent {format(new Date(campaign.sentAt), 'd MMM yyyy, h:mm a')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Recipients"
          value={stats.totalRecipients}
          icon={Users}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
        <StatCard
          label="Sent"
          value={stats.sent}
          icon={Send}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Delivered"
          value={stats.delivered}
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          label="Delivery Rate"
          value={`${stats.deliveryRate}%`}
          icon={TrendingUp}
          iconBg="bg-[#1565D8]/10"
          iconColor="text-[#1565D8]"
        />
      </div>

      {/* WHATSAPP READ STATS */}
      {campaign.channel === 'WHATSAPP' && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Read"
            value={stats.read ?? 0}
            icon={CheckCircle}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            label="Read Rate"
            value={`${stats.readRate ?? 0}%`}
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>
      )}

      {/* EMAIL SPECIFIC STATS */}
      {campaign.channel === 'EMAIL' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Open Rate"
            value={stats.openRate !== null ? `${stats.openRate}%` : '—'}
            icon={Mail}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatCard
            label="Click Rate"
            value={stats.clickRate !== null ? `${stats.clickRate}%` : '—'}
            icon={MousePointer}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            label="Bounce Rate"
            value={`${stats.bounceRate ?? 0}%`}
            icon={AlertTriangle}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
          />
          <StatCard
            label="Complaints"
            value={`${stats.complained ?? 0} (${stats.complaintRate ?? 0}%)`}
            icon={AlertCircle}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
          />
        </div>
      )}

      {/* A/B VARIANT COMPARISON */}
      {hasAb && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" /> A/B Test
              {campaign.abWinnerKey && (
                <span className="text-xs font-normal text-slate-500">· winner <span className="font-semibold text-emerald-600">{campaign.abWinnerKey}</span> sent</span>
              )}
            </p>
            {winnerPending && (
              <button
                onClick={() => sendWinner()}
                disabled={!!sendingWinner}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1565D8] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                {sendingWinner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
                Auto-send winner to remaining {heldPending}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-3 font-semibold">Variant</th>
                  <th className="py-2 pr-3 font-semibold">Subject</th>
                  <th className="py-2 pr-3 font-semibold">Sent</th>
                  <th className="py-2 pr-3 font-semibold">Opens</th>
                  <th className="py-2 pr-3 font-semibold">Open %</th>
                  <th className="py-2 pr-3 font-semibold">Click %</th>
                  {winnerPending && <th className="py-2 font-semibold"></th>}
                </tr>
              </thead>
              <tbody>
                {variantStats.map((v: any) => (
                  <tr key={v.key} className="border-b border-slate-50">
                    <td className="py-2 pr-3 font-bold text-slate-700">{v.key}{campaign.abWinnerKey === v.key && <span className="ml-1 text-emerald-600">✓</span>}</td>
                    <td className="py-2 pr-3 text-slate-600 max-w-[200px] truncate">{v.subject || '—'}</td>
                    <td className="py-2 pr-3 text-slate-600">{v.sent}</td>
                    <td className="py-2 pr-3 text-slate-600">{v.opened}</td>
                    <td className="py-2 pr-3 font-semibold text-slate-700">{v.openRate}%</td>
                    <td className="py-2 pr-3 text-slate-600">{v.clickRate}%</td>
                    {winnerPending && (
                      <td className="py-2">
                        <button
                          onClick={() => sendWinner(v.key)}
                          disabled={!!sendingWinner}
                          className="text-[#1565D8] font-semibold hover:underline disabled:opacity-50"
                        >
                          Pick {v.key}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {winnerPending && (
            <p className="text-[11px] text-slate-400">
              {heldPending} recipients held back. Auto-send picks the highest open rate, or pick a variant manually.
            </p>
          )}
        </div>
      )}

      {/* FAILED RECIPIENTS ALERT */}
      {stats.failed > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {stats.failed} message{stats.failed > 1 ? 's' : ''} failed to send. Check recipient details below.
          </span>
        </div>
      )}

      {/* RECIPIENTS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-semibold text-slate-700">
            Recipients
          </p>
          <input
            placeholder="Search by name..."
            value={recipientSearch}
            onChange={(e) => setRecipientSearch(e.target.value)}
            className="h-8 px-3 text-xs border border-slate-200 rounded-lg w-48 focus:outline-none focus:border-[#1565D8]"
          />
        </div>

        {/* Table wrapper */}
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Sent At
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecipients.length > 0 ? (
                filteredRecipients.map((r: any) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 text-sm font-semibold text-slate-800">
                      {r.name}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getRecipientTypeBadge(r.recipientType)}`}>
                        {r.recipientType === 'STUDENT_GUARDIAN' ? 'GUARDIAN' : r.recipientType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500">
                          {campaign.channel === 'EMAIL' ? r.email : r.phone}
                        </span>
                        {r.status === 'FAILED' && r.failureReason && (
                          <span className="text-[10px] text-red-400 mt-0.5">
                            {r.failureReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${getRecipientStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-400">
                      {r.sentAt ? format(new Date(r.sentAt), 'd MMM yyyy, h:mm a') : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                    No recipients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
