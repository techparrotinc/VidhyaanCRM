'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'

type Wallet = {
  channel: 'SMS' | 'WHATSAPP'
  freeAllowance: number
  freeUsed: number
  freeRemaining: number
  purchasedBalance: number
}

const CHANNEL_LABEL: Record<string, string> = {
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp'
}

export default function MessagingAllowanceCard({ orgId }: { orgId: string }) {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingChannel, setSavingChannel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/messaging-allowance`)
      const data = await res.json()
      const list: Wallet[] = data.data?.wallets ?? []
      setWallets(list)
      setDrafts(Object.fromEntries(list.map(w => [w.channel, String(w.freeAllowance)])))
    } catch (err) {
      console.error(err)
      setError('Failed to load messaging allowances')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    load()
  }, [load])

  const save = async (channel: 'SMS' | 'WHATSAPP') => {
    const value = parseInt(drafts[channel] ?? '', 10)
    if (isNaN(value) || value < 0) return
    setSavingChannel(channel)
    setError(null)
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/messaging-allowance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, freeAllowance: value })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save allowance')
      }
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingChannel(null)
    }
  }

  return (
    <Card className="p-5 bg-white border-slate-200 shadow-sm space-y-4">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          Messaging Allowances
        </span>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
      </h3>

      {error && (
        <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {wallets.map(w => {
          const dirty = drafts[w.channel] !== String(w.freeAllowance)
          return (
            <div key={w.channel} className="p-2.5 rounded-lg border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-850">{CHANNEL_LABEL[w.channel]}</span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {w.freeRemaining} free left · {w.purchasedBalance} purchased
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={drafts[w.channel] ?? ''}
                  onChange={e => setDrafts(prev => ({ ...prev, [w.channel]: e.target.value }))}
                  className="w-24 px-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 font-semibold flex-1">
                  free messages / month
                </span>
                <button
                  onClick={() => save(w.channel)}
                  disabled={!dirty || savingChannel === w.channel}
                  className="px-3 py-1.5 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors"
                >
                  {savingChannel === w.channel ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
