'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Download, Megaphone, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useCampaignQuota } from '@/hooks/useCampaignQuota'
import { CampaignCard } from './components/CampaignCard'

const tabs = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Sending', value: 'SENDING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Failed', value: 'FAILED' }
]

export default function CampaignListPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input to avoid excessive API requests
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

  // Derive counts from the current loaded page list
  const getTabCount = (val: string) => {
    if (!val) return campaigns.length
    return campaigns.filter((c: any) => c.status === val).length
  }

  // Filter campaigns client side by status if a status tab is selected
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

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            Campaign Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Send targeted messages to leads and students
          </p>
        </div>
        <button
          onClick={() => router.push('/campaign-management/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1565D8] text-white text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* QUOTA BAR */}
      {isQuotaLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse h-[80px]" />
      ) : quota ? (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-600">
              Monthly Recipients Used
            </p>
            <p className="text-xs text-slate-500">
              {quota.used} / {quota.limit} recipients
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0,
                  100
                )}%`,
                backgroundColor:
                  quota.limit > 0 && quota.used / quota.limit >= 0.9
                    ? '#EF4444'
                    : quota.limit > 0 && quota.used / quota.limit >= 0.7
                    ? '#F59E0B'
                    : '#1565D8'
              }}
            />
          </div>
          {quota.limit > 0 && quota.remaining === 0 && (
            <p className="text-xs text-red-500 mt-2 font-medium">
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

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[160px] h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8]"
          />

          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 px-3 text-sm border border-slate-200 rounded-lg flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20 focus:border-[#1565D8] bg-white"
          >
            <option value="">All Channels</option>
            <option value="EMAIL">Email</option>
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>

          <button className="h-9 w-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 flex-shrink-0">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap flex-shrink-0 transition-colors ${
              statusFilter === tab.value
                ? 'bg-[#1565D8] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                statusFilter === tab.value
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {getTabCount(tab.value)}
            </span>
          </button>
        ))}
      </div>

      {/* CAMPAIGN CARDS / SKELETONS / EMPTY STATE */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-slate-100 border border-slate-200 rounded-xl p-4 animate-pulse h-[116px]"
            />
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
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-white border border-dashed border-slate-200 rounded-xl">
          <Megaphone className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-600 mb-1">
            No campaigns yet
          </p>
          <p className="text-xs text-slate-400 mb-4">
            Create your first campaign to reach leads and students
          </p>
          <button
            onClick={() => router.push('/campaign-management/new')}
            className="px-4 py-2 bg-[#1565D8] text-white text-sm font-semibold rounded-lg"
          >
            Create Campaign
          </button>
        </div>
      )}
    </div>
  )
}
