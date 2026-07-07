'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { ChevronRight, MessageSquare, MessageCircle, Puzzle, CheckCircle2 } from 'lucide-react'
import type { AddonsResponse } from '@/components/settings/addons/types'

const CHANNEL_ICON: Record<string, typeof MessageSquare> = {
  SMS: MessageSquare,
  WHATSAPP: MessageCircle
}

export default function AddonsPage() {
  const { data, isLoading } = useSWR<AddonsResponse>('/api/v1/settings/addons', fetcher)
  const addons = data?.data?.addons ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-slate-950">Add-ons</h3>
        <p className="text-sm text-slate-500">
          Extend your workspace. Messaging add-ons include free monthly credits — buy more anytime or connect your own provider account.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map(i => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {addons.map(addon => {
            const Icon = (addon.channel && CHANNEL_ICON[addon.channel]) || Puzzle
            return (
              <Link
                key={addon.slug}
                href={`/settings/addons/${addon.slug}`}
                className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:border-[#1565D8]/40 hover:shadow-md transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Icon className="w-5 h-5 text-[#1565D8]" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      {addon.name}
                      {addon.enabled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          Not enabled
                        </span>
                      )}
                      {addon.provider.status === 'VERIFIED' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          Own account
                        </span>
                      )}
                    </p>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1565D8] transition-colors flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {addon.description}
                  </p>
                  {addon.wallet && addon.enabled && (
                    <p className="text-xs font-semibold text-slate-500 mt-2">
                      {addon.provider.status === 'VERIFIED'
                        ? 'Unlimited — using your own account'
                        : `${addon.wallet.freeRemaining} free left this month · ${addon.wallet.purchasedBalance} purchased`}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
