'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { format } from 'date-fns'
import { ArrowLeft, ShoppingCart, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { KpiTile } from '@/components/fees/KpiTile'
import PurchaseCreditsModal from '@/components/settings/addons/PurchaseCreditsModal'
import ProviderConfigForm from '@/components/settings/addons/ProviderConfigForm'
import CreditLedgerTable from '@/components/settings/addons/CreditLedgerTable'
import type { AddonsResponse } from '@/components/settings/addons/types'

export default function AddonDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const router = useRouter()

  const { data, isLoading, mutate } = useSWR<AddonsResponse>('/api/v1/settings/addons', fetcher)
  const addon = data?.data?.addons.find(a => a.slug === slug)

  const [showPurchase, setShowPurchase] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleRequestActivation = async () => {
    setRequesting(true)
    try {
      const res = await fetch('/api/v1/settings/addons/whatsapp/request', { method: 'POST' })
      if (!res.ok) throw new Error('Request failed')
      setRequested(true)
      showToast('success', 'Activation requested — our team will enable WhatsApp for you shortly.')
    } catch {
      showToast('error', 'Could not send the request. Try again.')
    } finally {
      setRequesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!addon) {
    return <p className="text-sm text-slate-400">Add-on not found.</p>
  }

  const byoActive = addon.provider.status === 'VERIFIED'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/settings/addons')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
            {addon.name}
            {addon.enabled ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">Active</span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Not enabled</span>
            )}
          </h3>
          <p className="text-sm text-slate-500">{addon.description}</p>
        </div>
        {addon.enabled && addon.channel && !byoActive && (
          <button
            onClick={() => setShowPurchase(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#1565D8] hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <ShoppingCart className="w-4 h-4" />
            Purchase credits
          </button>
        )}
      </div>

      {/* Not enabled → request activation */}
      {!addon.enabled && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 flex flex-col items-start gap-3">
          <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
            The {addon.name} add-on is not enabled for your workspace yet.
            {addon.slug === 'whatsapp_addon' &&
              ' Vidhyaan’s WhatsApp Business account and templates are approved — request activation and our team will switch it on.'}
          </p>
          <button
            onClick={handleRequestActivation}
            disabled={requesting || requested}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#1565D8] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors"
          >
            {requested ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {requested ? 'Activation requested' : requesting ? 'Requesting...' : 'Request activation'}
          </button>
        </div>
      )}

      {/* Wallet KPIs */}
      {addon.enabled && addon.wallet && (
        <>
          {byoActive && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-xs font-semibold text-green-800">
                You&apos;re sending through your own account — Vidhyaan credits are not consumed.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiTile
              label="Free Remaining"
              size="compact"
              value={addon.wallet.freeRemaining}
              subLabel={`of ${addon.wallet.freeAllowance}/month · set by Vidhyaan`}
            />
            <KpiTile
              label="Purchased Balance"
              size="compact"
              value={addon.wallet.purchasedBalance}
              valueClassName="text-[#1565D8]"
              subLabel="never expires"
            />
            <KpiTile
              label="Used This Month"
              size="compact"
              value={addon.wallet.freeUsed}
              subLabel={`since ${format(new Date(addon.wallet.periodStart), 'd MMM')}`}
            />
          </div>
        </>
      )}

      {/* BYO provider config */}
      {addon.enabled && addon.channel && (
        <ProviderConfigForm
          channel={addon.channel}
          provider={addon.provider}
          onMutate={mutate}
          onToast={showToast}
        />
      )}

      {/* Ledger */}
      {addon.enabled && addon.channel && (
        <CreditLedgerTable channel={addon.channel} />
      )}

      {/* Purchase modal */}
      {showPurchase && addon.channel && (
        <PurchaseCreditsModal
          channelName={addon.name}
          packs={addon.packs}
          onClose={() => setShowPurchase(false)}
          onPurchased={message => {
            setShowPurchase(false)
            showToast('success', message)
            mutate()
          }}
          onError={message => showToast('error', message)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-lg ${
          toast.type === 'error'
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-green-50 text-green-800 border-green-200'
        }`}>
          {toast.type === 'error'
            ? <AlertCircle className="w-4 h-4 text-red-500" />
            : <CheckCircle2 className="w-4 h-4 text-green-600" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
