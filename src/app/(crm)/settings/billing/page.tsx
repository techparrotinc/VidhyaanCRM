'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  History,
  ArrowUpRight,
  ShieldCheck,
  X
} from 'lucide-react'
import { useModulesStore } from '@/stores/modules.store'

const SLAB_INFO: Record<string, { label: string; cap: number }> = {
  S50: { label: 'up to 50 students', cap: 50 },
  S100: { label: 'up to 100 students', cap: 100 },
  S200: { label: 'up to 200 students', cap: 200 },
  S500: { label: 'up to 500 students', cap: 500 },
  S500_PLUS: { label: '500+ students', cap: 1000 }
}

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [pendingPlanChange, setPendingPlanChange] = useState<any>(null)
  const [wallets, setWallets] = useState<any[]>([])
  const [studentCount, setStudentCount] = useState(0)
  const [paidSlab, setPaidSlab] = useState<string | null>(null)

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch all billing metadata on load; background=true skips the page spinner
  const fetchBillingData = async (background = false) => {
    try {
      if (!background) setLoading(true)
      const res = await fetch('/api/v1/billing')
      const data = await res.json()
      if (res.ok) {
        setOrg(data.org)
        setSubscription(data.subscription)
        setTransactions(data.transactions)
        setPendingPlanChange(data.pendingPlanChange ?? null)
        setWallets(data.wallets ?? [])
        setStudentCount(data.studentCount ?? 0)
        setPaidSlab(data.paidSlab ?? null)
      } else {
        showToast('error', data.error || 'Failed to load billing configurations.')
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Network error while fetching billing details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingData()
    // Landing back from the upgrade flow after a successful payment
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('activated')) {
      showToast('success', 'Payment received — your plan is now active!')
      window.history.replaceState({}, '', '/settings/billing')
      // New plan may enable modules (e.g. Fee Management) — resync the Sidebar
      // lock state without forcing a full reload.
      useModulesStore.getState().refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Returning to the tab re-syncs billing state — the server reconciles
  // paid-but-unverified orders on every GET.
  useEffect(() => {
    const onFocus = () => fetchBillingData(true)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  const handleCancelSubscription = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/billing/cancel', {
        method: 'PUT'
      })
      const data = await res.json()

      if (res.ok && data.success) {
        showToast('success', `Subscription will end on ${new Date(data.cancelAtDate).toLocaleDateString()}`)
        setCancelModalOpen(false)
        fetchBillingData()
      } else {
        showToast('error', data.error || 'Failed to request subscription cancellation.')
      }
    } catch (err) {
      showToast('error', 'Network error during subscription cancellation.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-55 border-green-200 text-green-700 bg-green-50'
      case 'TRIAL': return 'bg-blue-55 border-blue-200 text-blue-700 bg-blue-50'
      case 'PAST_DUE': return 'bg-amber-55 border-amber-200 text-amber-700 bg-amber-50'
      case 'TRIAL_EXPIRED': return 'bg-red-55 border-red-200 text-red-700 bg-red-50'
      default: return 'bg-slate-55 border-slate-200 text-slate-700 bg-slate-50'
    }
  }

  // "Paid Active" needs an actual subscription — an org row can be ACTIVE
  // while still on trial (or free listing), so derive the display status.
  const hasPaidSub = !!subscription && ['ACTIVE', 'GRACE_PERIOD', 'PAST_DUE'].includes(subscription.status)
  const onTrial = !hasPaidSub && org?.trialEndsAt && new Date(org.trialEndsAt).getTime() > Date.now()
  const displayStatus = onTrial ? 'TRIAL' : hasPaidSub || org?.status !== 'ACTIVE' ? (org?.status || 'TRIAL') : 'FREE'

  if (loading && !org) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1565D8]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* TOAST ALERTS */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-fade-in ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP SUMMARY ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Billing & Subscriptions</h2>
          <p className="text-xs text-slate-500 font-medium">Manage plan upgrades, transaction logs, and payment credentials.</p>
        </div>
        <div className="flex items-center gap-2">
          {subscription &&
            (['GRACE_PERIOD', 'PAST_DUE', 'EXPIRED'].includes(subscription.status) ||
              (subscription.status === 'ACTIVE' &&
                subscription.currentPeriodEnd &&
                (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / 86400000 <= 15)) && (
              <Link
                href="/settings/billing/upgrade"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition w-fit"
              >
                Renew Now
              </Link>
            )}
          <Link
            href="/settings/billing/upgrade"
            className="bg-[#1565D8] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition w-fit"
          >
            <ArrowUpRight className="size-4" />
            Upgrade Plan
          </Link>
        </div>
      </div>

      {/* CURRENT STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CURRENT SUBSCRIPTION CARD */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Subscription</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                getStatusBadgeClass(displayStatus)
              }`}>
                {displayStatus === 'ACTIVE' ? 'Paid Active'
                  : displayStatus === 'TRIAL' ? 'Free Trial'
                  : displayStatus === 'FREE' ? 'Free Plan'
                  : displayStatus === 'GRACE_PERIOD' ? 'Grace Period'
                  : displayStatus === 'TRIAL_EXPIRED' ? 'Trial Expired'
                  : displayStatus}
              </span>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mt-3 uppercase tracking-tight">
              {hasPaidSub
                ? (subscription?.plan?.name || org?.plan?.name)
                : onTrial
                  ? 'Free Trial — All Features'
                  : (org?.plan?.name || 'Free Plan')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Billing Period</span>
                <span className="text-xs text-slate-700 font-bold uppercase">
                  {subscription?.billingCycle === 'ANNUAL' ? 'Yearly' : subscription?.billingCycle === 'QUARTERLY' ? '3 Months' : subscription?.billingCycle === 'MONTHLY' ? 'Monthly' : 'None (Trial)'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Cycle Cost</span>
                <span className="text-xs text-slate-700 font-bold">
                  {subscription?.amount ? `₹${Number(subscription.amount).toLocaleString()}` : '₹0 (Free)'}
                  <span className="text-[9px] text-slate-400 font-semibold"> + GST</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Started On</span>
                <span className="text-xs text-slate-700 font-bold">
                  {subscription?.startedAt ? new Date(subscription.startedAt).toLocaleDateString('en-IN') : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Renews On</span>
                <span className="text-xs text-slate-700 font-bold">
                  {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN') : '—'}
                  {subscription?.currentPeriodEnd && (
                    <span className="text-[9px] text-slate-400 font-semibold block">
                      {Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / 86400000))} days left
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Student capacity usage */}
            {paidSlab && SLAB_INFO[paidSlab] && (
              <div className="mt-5">
                <div className="flex justify-between items-baseline text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                  <span>Student Capacity</span>
                  <span className="text-slate-600 normal-case font-semibold">
                    {studentCount.toLocaleString('en-IN')} of {SLAB_INFO[paidSlab].label}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      studentCount > SLAB_INFO[paidSlab].cap
                        ? 'bg-red-500'
                        : studentCount > SLAB_INFO[paidSlab].cap * 0.9
                          ? 'bg-amber-500'
                          : 'bg-[#1565D8]'
                    }`}
                    style={{ width: `${Math.min(100, (studentCount / SLAB_INFO[paidSlab].cap) * 100)}%` }}
                  />
                </div>
                {studentCount > SLAB_INFO[paidSlab].cap && (
                  <p className="text-[10px] font-bold text-red-600 mt-1">
                    Over capacity — <Link href="/settings/billing/upgrade" className="underline">upgrade your slab</Link> to stay compliant.
                  </p>
                )}
              </div>
            )}

            {pendingPlanChange && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 font-semibold">
                Plan change scheduled: switching to <span className="uppercase font-black">{pendingPlanChange.planSlug === 'starter' ? 'CRM Package' : pendingPlanChange.planSlug === 'growth' ? 'Fee Management' : pendingPlanChange.planSlug}</span> on{' '}
                {new Date(pendingPlanChange.effectiveAt).toLocaleDateString('en-IN')}. Your current plan stays active until then.
              </div>
            )}

            {subscription?.cancelAtPeriodEnd && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 font-semibold">
                ⚠️ Cancellation requested: Your access to premium features will automatically expire on{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-4 flex items-center justify-between">
            {hasPaidSub && !subscription?.cancelAtPeriodEnd ? (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="text-xs text-red-600 hover:text-red-800 font-bold transition"
              >
                Cancel Subscription
              </button>
            ) : onTrial ? (
              <span className="text-xs text-slate-400 font-semibold">
                Trial ends on {new Date(org.trialEndsAt).toLocaleDateString('en-IN')}
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-semibold">No active billing cycles.</span>
            )}

            <span className="text-xs text-slate-500 font-medium">
              {subscription?.currentPeriodEnd
                ? `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN')}`
                : onTrial
                  ? `Trial ends on ${new Date(org.trialEndsAt).toLocaleDateString('en-IN')}`
                  : ''}
            </span>
          </div>
        </div>

        {/* METRICS / LIMITS OVERVIEW */}
        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-sm flex flex-col justify-between border border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Usage Details</span>
            <div className="mt-4">
              <span className="text-3xl font-extrabold">
                {subscription?.status === 'ACTIVE' ? '∞' : org?.leadCap || 10}
              </span>
              <span className="text-xs text-slate-400 font-bold block mt-1">Lead Limit Capacity</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed font-semibold">
              The lead limit is automatically expanded to unlimited once you activate any paid subscription tier.
            </p>
            {wallets.length > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-2">
                {wallets.map((w: any) => (
                  <Link key={w.channel} href="/settings/addons" className="bg-slate-800/70 rounded-lg p-2.5 text-center hover:bg-slate-800 transition" title="Buy credits">
                    <div className="text-[9px] font-bold text-slate-400 uppercase">{w.channel}</div>
                    <div className="text-sm font-black text-white tabular-nums mt-0.5">{w.balance.toLocaleString('en-IN')}</div>
                    <div className="text-[8px] font-semibold text-slate-500">credits</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="mt-6 border-t border-slate-800 pt-4 flex gap-2 items-center text-xs font-semibold text-slate-355">
            <ShieldCheck className="size-4 text-blue-400 shrink-0" />
            <span>Secured via Razorpay Payment Gateway</span>
          </div>
        </div>

      </div>

      {/* TRANSACTION HISTORY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <History className="size-5 text-slate-400" />
          <h3 className="text-sm font-black text-slate-800">Transaction & Invoice History</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-semibold">
            No payments or invoices registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="p-4">Date</th>
                  <th className="p-4">Reference / Receipt</th>
                  <th className="p-4">Plan / Cycle</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="p-4">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-mono text-slate-500">{tx.gatewayRef || tx.id}</td>
                    <td className="p-4">
                      {tx.subscription?.plan?.name || 'Subscription Activation'} ({tx.type})
                    </td>
                    <td className="p-4">
                      ₹{Number(tx.amount).toLocaleString()}
                      {(tx.metadata as any)?.gstAmount ? (
                        <span className="block text-[9px] text-slate-400 font-semibold">
                          incl. ₹{Number((tx.metadata as any).gstAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })} GST
                        </span>
                      ) : null}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        tx.status === 'SUCCESS' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {tx.status === 'SUCCESS' ? (
                        <span className="flex items-center gap-2">
                          <a
                            href={`/api/v1/billing/invoices/${tx.id}/pdf`}
                            className="text-[#1565D8] hover:underline font-bold"
                          >
                            Download
                          </a>
                          {tx.invoiceUrl && (
                            <a
                              href={tx.invoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-slate-600 hover:underline text-[10px] font-semibold"
                              title="Razorpay hosted copy"
                            >
                              hosted
                            </a>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CANCEL SUBSCRIPTION CONFIRMATION MODAL */}
      {cancelModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setCancelModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setCancelModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="size-6" />
              </div>

              <h3 className="text-lg font-black text-slate-900">Are you absolutely sure?</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Cancelling means you will lose access to premium pipelines, WhatsApp parent alerts, automated fee receipts, and lead capture dashboards at the end of the billing period.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                Payments already made are <strong className="text-slate-600">non-refundable</strong> — your plan stays
                fully active until the paid period ends, and no further charges will occur after that.
              </p>

              <div className="pt-4 space-y-3 flex flex-col">
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="bg-[#1565D8] hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition shadow-sm cursor-pointer"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="text-xs text-red-600 hover:text-red-800 font-bold py-2 transition cursor-pointer"
                >
                  Cancel at Period End
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
