'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Megaphone,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useCampaignQuota } from '@/hooks/useCampaignQuota'
import { CampaignCard } from './components/CampaignCard'

const tabs = [
  { label: 'All', value: '', icon: null },
  { label: 'Draft', value: 'DRAFT', icon: FileText },
  { label: 'Scheduled', value: 'SCHEDULED', icon: Clock },
  { label: 'Sending', value: 'SENDING', icon: Send },
  { label: 'Completed', value: 'COMPLETED', icon: CheckCircle2 },
  { label: 'Failed', value: 'FAILED', icon: AlertTriangle }
]

const statCards = [
  { key: 'total', label: 'Total', icon: Megaphone, gradient: 'from-blue-500 to-indigo-600' },
  { key: 'SENDING', label: 'Active', icon: Send, gradient: 'from-amber-500 to-orange-500' },
  { key: 'SCHEDULED', label: 'Scheduled', icon: Clock, gradient: 'from-violet-500 to-purple-600' },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2, gradient: 'from-emerald-500 to-green-600' },
]

export default function CampaignListPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  const { campaigns, pagination, isLoading, mutate } = useCampaigns({
    channel: channelFilter,
    q: debouncedSearch,
    page
  })

  const { quota, isLoading: isQuotaLoading } = useCampaignQuota()

  // Compute stat counts from loaded campaigns
  const statCounts: Record<string, number> = {
    total: campaigns.length,
    DRAFT: campaigns.filter((c: any) => c.status === 'DRAFT').length,
    SCHEDULED: campaigns.filter((c: any) => c.status === 'SCHEDULED').length,
    SENDING: campaigns.filter((c: any) => c.status === 'SENDING').length,
    COMPLETED: campaigns.filter((c: any) => c.status === 'COMPLETED').length,
    FAILED: campaigns.filter((c: any) => c.status === 'FAILED').length,
  }

  const getTabCount = (val: string) => {
    if (!val) return campaigns.length
    return statCounts[val] || 0
  }

  const displayedCampaigns = statusFilter
    ? campaigns.filter((c: any) => c.status === statusFilter)
    : campaigns

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this campaign? This cannot be undone.')) {
      return
    }
    try {
      const res = await fetch(`/api/v1/campaigns/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        alert('Campaign deleted')
        mutate()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete campaign')
      }
    } catch (e) {
      alert('An error occurred while deleting campaign')
    }
  }

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this scheduled campaign? It will be moved back to draft.')) {
      return
    }
    try {
      const res = await fetch(`/api/v1/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'DRAFT',
          scheduledAt: null
        })
      })
      if (res.ok) {
        alert('Campaign cancelled')
        mutate()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to cancel campaign')
      }
    } catch (e) {
      alert('An error occurred while cancelling campaign')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const detailRes = await fetch(`/api/v1/campaigns/${id}`)
      if (!detailRes.ok) {
        alert('Failed to fetch campaign details for duplication')
        return
      }
      const { data: campaign } = await detailRes.json()

      const dupRes = await fetch('/api/v1/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${campaign.name} (Copy)`,
          channel: campaign.channel,
          audienceFilter: campaign.audienceFilter,
          templateBody: campaign.templateBody
        })
      })

      if (dupRes.ok) {
        const { data: newCampaign } = await dupRes.json()
        alert('Campaign duplicated')
        mutate()
        router.push(`/campaign-management/${newCampaign.id}/edit`)
      } else {
        const data = await dupRes.json()
        alert(data.error || 'Failed to duplicate campaign')
      }
    } catch (e) {
      alert('An error occurred while duplicating campaign')
    }
  }

  // Quota bar color
  const quotaPercent = quota && quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0
  const quotaColor =
    quotaPercent >= 90 ? 'bg-red-500' :
    quotaPercent >= 70 ? 'bg-amber-500' :
    'bg-[#1565D8]'

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1565D8] to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Campaigns
            </h1>
            <p className="text-sm text-slate-500">
              Send targeted messages to leads and students
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/campaign-management/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1565D8] to-indigo-600 text-white text-sm font-semibold rounded-xl whitespace-nowrap shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* ─── STATS STRIP ─── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse h-[76px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((card) => {
            const Icon = card.icon
            const count = statCounts[card.key] ?? 0
            return (
              <button
                key={card.key}
                onClick={() => setStatusFilter(card.key === 'total' ? '' : card.key)}
                className={`relative bg-white border rounded-xl p-4 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group overflow-hidden ${
                  (card.key === 'total' && statusFilter === '') ||
                  statusFilter === card.key
                    ? 'border-[#1565D8]/30 shadow-sm'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{card.label}</p>
                    <p className="text-2xl font-bold text-slate-800 mt-0.5">{count}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ─── QUOTA BAR ─── */}
      {isQuotaLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse h-[72px]" />
      ) : quota ? (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-slate-600">
              Monthly Recipients
            </p>
            <p className="text-xs text-slate-500 tabular-nums">
              <span className="font-semibold text-slate-700">{quota.used.toLocaleString()}</span>
              {' / '}
              {quota.limit.toLocaleString()}
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${quotaColor}`}
              style={{ width: `${Math.min(quotaPercent, 100)}%` }}
            />
          </div>
          {quota.limit > 0 && quota.remaining === 0 && (
            <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Monthly limit reached. Upgrade to send more campaigns.
            </p>
          )}
          {quota.limit === 0 && (
            <p className="text-xs text-amber-600 mt-2 font-medium">
              Campaign sending requires a paid plan.
            </p>
          )}
        </div>
      ) : null}

      {/* ─── TOOLBAR: Search + Channel filter + Status tabs ─── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
        {/* Search + channel */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] transition-shadow"
            />
          </div>

          <div className="relative flex-shrink-0">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 pl-8 pr-8 text-sm border border-slate-200 rounded-lg flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] bg-white appearance-none cursor-pointer"
            >
              <option value="">All Channels</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map((tab) => {
            const isActive = statusFilter === tab.value
            const count = getTabCount(tab.value)
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`relative px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1565D8] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── CAMPAIGN LIST / SKELETONS / EMPTY ─── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
            >
              <div className="flex">
                <div className="w-1 bg-slate-200" />
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-48" />
                      <div className="h-3 bg-slate-100 rounded w-24" />
                    </div>
                    <div className="h-6 w-20 bg-slate-100 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayedCampaigns.length > 0 ? (
        <div className="space-y-3">
          {displayedCampaigns.map((campaign: any) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onDelete={handleDelete}
              onCancel={handleCancel}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[360px] text-center p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border border-dashed border-slate-200 rounded-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1565D8]/10 to-indigo-100 flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-[#1565D8]/60" />
          </div>
          <p className="text-base font-semibold text-slate-700 mb-1">
            No campaigns yet
          </p>
          <p className="text-sm text-slate-400 mb-5 max-w-xs">
            Create your first campaign to reach leads and students with targeted messages
          </p>
          <button
            onClick={() => router.push('/campaign-management/new')}
            className="px-5 py-2.5 bg-gradient-to-r from-[#1565D8] to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Create Campaign
          </button>
        </div>
      )}

      {/* ─── PAGINATION ─── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Page <span className="font-semibold text-slate-700">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.totalPages}</span>
            {pagination.total && (
              <span className="ml-1">
                ({pagination.total.toLocaleString()} total)
              </span>
            )}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
