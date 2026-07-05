'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Mail,
  MessageSquare,
  Pencil,
  BarChart3,
  Copy,
  Trash2,
  XCircle,
  MoreHorizontal,
  Users,
  CheckCircle2,
  Send,
  AlertTriangle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// Custom WhatsApp icon
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

const channelConfig = {
  EMAIL: {
    icon: Mail,
    label: 'Email',
    accent: '#3B82F6',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    badgeBg: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  SMS: {
    icon: MessageSquare,
    label: 'SMS',
    accent: '#F59E0B',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    badgeBg: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  WHATSAPP: {
    icon: WhatsAppIcon,
    label: 'WhatsApp',
    accent: '#22C55E',
    bg: 'bg-green-50',
    text: 'text-green-600',
    badgeBg: 'bg-green-50 text-green-700 ring-green-600/20',
  },
}

const statusConfig: Record<string, { dot: string; bg: string; label: string }> = {
  DRAFT: { dot: 'bg-slate-400', bg: 'bg-slate-50 text-slate-700 ring-slate-400/30', label: 'Draft' },
  SCHEDULED: { dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700 ring-blue-500/30', label: 'Scheduled' },
  SENDING: { dot: 'bg-amber-500 animate-pulse', bg: 'bg-amber-50 text-amber-700 ring-amber-500/30', label: 'Sending' },
  COMPLETED: { dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 ring-emerald-500/30', label: 'Completed' },
  FAILED: { dot: 'bg-red-500', bg: 'bg-red-50 text-red-700 ring-red-500/30', label: 'Failed' },
}

interface CampaignCardProps {
  campaign: {
    id: string
    name: string
    channel: 'EMAIL' | 'SMS' | 'WHATSAPP'
    status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED'
    scheduledAt: string | null
    sentAt: string | null
    createdAt: string
    _count: { recipients: number }
    stats?: {
      totalRecipients?: number
      sent?: number
      delivered?: number
      failed?: number
      deliveryRate?: number
    } | any
  }
  onDelete: (id: string) => void
  onCancel: (id: string) => void
  onDuplicate: (id: string) => void
}

export function CampaignCard({ campaign, onDelete, onCancel, onDuplicate }: CampaignCardProps) {
  const router = useRouter()
  const channel = channelConfig[campaign.channel] || channelConfig.EMAIL
  const status = statusConfig[campaign.status] || statusConfig.DRAFT
  const ChannelIcon = channel.icon

  const dateInfo = (() => {
    if (campaign.status === 'SCHEDULED' && campaign.scheduledAt) {
      const d = new Date(campaign.scheduledAt)
      return {
        relative: `Sends ${formatDistanceToNow(d, { addSuffix: true })}`,
        absolute: format(d, 'd MMM yyyy, h:mm a'),
      }
    }
    if (campaign.sentAt) {
      const d = new Date(campaign.sentAt)
      return {
        relative: formatDistanceToNow(d, { addSuffix: true }),
        absolute: format(d, 'd MMM yyyy, h:mm a'),
      }
    }
    const d = new Date(campaign.createdAt)
    return {
      relative: formatDistanceToNow(d, { addSuffix: true }),
      absolute: format(d, 'd MMM yyyy, h:mm a'),
    }
  })()

  const hasStats = (campaign.status === 'COMPLETED' || campaign.status === 'FAILED') && campaign.stats
  const totalRecipients = campaign.stats?.totalRecipients || campaign._count.recipients
  const delivered = campaign.stats?.delivered ?? 0
  const failed = campaign.stats?.failed ?? 0
  const deliveryRate = campaign.stats?.deliveryRate

  const canEdit = campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED'
  const canCancel = campaign.status === 'SCHEDULED'
  const canDelete = campaign.status === 'DRAFT'
  const canViewAnalytics = campaign.status !== 'DRAFT'

  return (
    <div
      className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] cursor-pointer"
      onClick={() => {
        if (canViewAnalytics) {
          router.push(`/campaign-management/${campaign.id}/analytics`)
        } else {
          router.push(`/campaign-management/${campaign.id}/edit`)
        }
      }}
    >
      {/* Channel accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: channel.accent }}
      />

      <div className="pl-4 pr-4 py-4">
        {/* Top row: name + channel badge + status + date */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Channel icon */}
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${channel.bg} ring-1 ring-inset ring-black/5`}>
              <ChannelIcon className={`w-4 h-4 ${channel.text}`} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                {campaign.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${channel.badgeBg}`}>
                  {channel.label}
                </span>
                <span className="text-[11px] text-slate-400" title={dateInfo.absolute}>
                  {dateInfo.relative}
                </span>
              </div>
            </div>
          </div>

          {/* Right side: status + actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status badge with dot */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${status.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>

            {/* Action buttons */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              {canEdit && (
                <button
                  onClick={() => router.push(`/campaign-management/${campaign.id}/edit`)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-[#1565D8] hover:bg-blue-50 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {canViewAnalytics && (
                <button
                  onClick={() => router.push(`/campaign-management/${campaign.id}/analytics`)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-[#1565D8] hover:bg-blue-50 transition-colors"
                  title="Analytics"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Overflow menu */}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <button className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onDuplicate(campaign.id)}>
                    <Copy className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    Duplicate
                  </DropdownMenuItem>
                  {canCancel && (
                    <DropdownMenuItem onClick={() => onCancel(campaign.id)}>
                      <XCircle className="w-3.5 h-3.5 mr-2 text-amber-500" />
                      Cancel Schedule
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(campaign.id)} className="text-red-600 hover:!bg-red-50">
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Bottom row: audience / stats */}
        {hasStats ? (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Users className="w-3 h-3" />
                {totalRecipients} recipients
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                {delivered} delivered
              </span>
              {failed > 0 && (
                <span className="inline-flex items-center gap-1 text-red-500">
                  <AlertTriangle className="w-3 h-3" />
                  {failed} failed
                </span>
              )}
              {deliveryRate !== undefined && (
                <span className="ml-auto text-xs font-semibold text-emerald-600">
                  {deliveryRate}%
                </span>
              )}
            </div>
            {/* Mini delivery bar */}
            {totalRecipients > 0 && (
              <div className="mt-2 flex h-1.5 w-full rounded-full overflow-hidden bg-slate-100">
                {delivered > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${(delivered / totalRecipients) * 100}%` }}
                  />
                )}
                {failed > 0 && (
                  <div
                    className="h-full bg-red-400 transition-all"
                    style={{ width: `${(failed / totalRecipients) * 100}%` }}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2.5 flex items-center gap-1 text-xs text-slate-400">
            <Users className="w-3 h-3" />
            {campaign._count.recipients > 0
              ? `${campaign._count.recipients} recipients selected`
              : 'No audience selected yet'}
          </div>
        )}
      </div>
    </div>
  )
}
