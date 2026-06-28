'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Mail, MessageSquare, Send } from 'lucide-react'

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

const channelIcons = {
  EMAIL: Mail,
  SMS: MessageSquare,
  WHATSAPP: WhatsAppIcon
}

const channelColors = {
  EMAIL: { bg: 'bg-blue-50', text: 'text-blue-600' },
  SMS: { bg: 'bg-amber-50', text: 'text-amber-600' },
  WHATSAPP: { bg: 'bg-green-50', text: 'text-green-600' }
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
  const ChannelIcon = channelIcons[campaign.channel] || MessageSquare
  const colors = channelColors[campaign.channel] || { bg: 'bg-slate-50', text: 'text-slate-600' }

  const formattedDate = () => {
    if (campaign.status === 'SCHEDULED' && campaign.scheduledAt) {
      return `Sends ${format(new Date(campaign.scheduledAt), 'd MMM yyyy')}`
    }
    if (campaign.sentAt) {
      return format(new Date(campaign.sentAt), 'd MMM yyyy')
    }
    return format(new Date(campaign.createdAt), 'd MMM yyyy')
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
      {/* TOP ROW */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
            <ChannelIcon className={`w-4 h-4 ${colors.text}`} />
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">
            {campaign.name}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={campaign.status} />
          <span className="text-xs text-slate-400">
            {formattedDate()}
          </span>
        </div>
      </div>

      {/* MIDDLE ROW (stats - only if COMPLETED or FAILED) */}
      {(campaign.status === 'COMPLETED' || campaign.status === 'FAILED') ? (
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-slate-500">
            {campaign._count.recipients} recipients
          </span>
          {campaign.stats?.delivered !== undefined && (
            <span className="text-xs text-slate-500">
              {campaign.stats.delivered} delivered
            </span>
          )}
          {campaign.stats?.deliveryRate !== undefined && (
            <span className="text-xs text-green-600 font-medium">
              {campaign.stats.deliveryRate}% delivery
            </span>
          )}
        </div>
      ) : (
        /* DRAFT or SCHEDULED */
        <div className="mt-2">
          <span className="text-xs text-slate-400">
            {campaign._count.recipients > 0
              ? `${campaign._count.recipients} recipients selected`
              : 'No audience selected yet'}
          </span>
        </div>
      )}

      {/* BOTTOM ROW (actions) */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
        {campaign.status === 'DRAFT' && (
          <>
            <button
              onClick={() => router.push(`/campaign-management/${campaign.id}/edit`)}
              className="text-[#1565D8] font-medium hover:underline cursor-pointer"
            >
              Edit
            </button>
            <span className="text-slate-300">·</span>
            <span
              onClick={() => onDuplicate(campaign.id)}
              className="text-sm text-slate-500 font-medium hover:underline cursor-pointer"
            >
              Duplicate
            </span>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => onDelete(campaign.id)}
              className="text-red-500 font-medium hover:underline cursor-pointer"
            >
              Delete
            </button>
          </>
        )}

        {campaign.status === 'SCHEDULED' && (
          <>
            <button
              onClick={() => router.push(`/campaign-management/${campaign.id}/edit`)}
              className="text-[#1565D8] font-medium hover:underline cursor-pointer"
            >
              Edit
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => onCancel(campaign.id)}
              className="text-red-500 font-medium hover:underline cursor-pointer"
            >
              Cancel
            </button>
            <span className="text-slate-300">·</span>
            <span
              onClick={() => onDuplicate(campaign.id)}
              className="text-sm text-slate-500 font-medium hover:underline cursor-pointer"
            >
              Duplicate
            </span>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => router.push(`/campaign-management/${campaign.id}/analytics`)}
              className="text-[#1565D8] font-medium hover:underline cursor-pointer"
            >
              View Analytics
            </button>
          </>
        )}

        {campaign.status === 'SENDING' && (
          <button
            onClick={() => router.push(`/campaign-management/${campaign.id}/analytics`)}
            className="text-[#1565D8] font-medium hover:underline cursor-pointer"
          >
            View Analytics
          </button>
        )}

        {(campaign.status === 'COMPLETED' || campaign.status === 'FAILED') && (
          <>
            <button
              onClick={() => router.push(`/campaign-management/${campaign.id}/analytics`)}
              className="text-[#1565D8] font-medium hover:underline cursor-pointer"
            >
              View Analytics
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => onDuplicate(campaign.id)}
              className="text-slate-500 font-medium hover:underline cursor-pointer"
            >
              Duplicate
            </button>
          </>
        )}
      </div>
    </div>
  )
}
