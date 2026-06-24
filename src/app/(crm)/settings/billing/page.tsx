'use client'

import React, { useState, useEffect } from 'react'
import Script from 'next/script'
import {
  CreditCard,
  Check,
  AlertTriangle,
  History,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  XCircle,
  X
} from 'lucide-react'

export default function BillingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY')
  const [processingPlanSlug, setProcessingPlanSlug] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch all billing metadata on load
  const fetchBillingData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/billing')
      const data = await res.json()
      if (res.ok) {
        setOrg(data.org)
        setSubscription(data.subscription)
        setTransactions(data.transactions)
        setPlans(data.plans)
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
  }, [])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  // Handle plan upgrade trigger
  const handleUpgradeSelect = async (planSlug: string) => {
    try {
      setProcessingPlanSlug(planSlug)
      const subRes = await fetch('/api/v1/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug, billingCycle })
      })
      const subData = await subRes.json()

      if (!subRes.ok) {
        throw new Error(subData.error || 'Failed to initialize subscription checkout')
      }

      const { orderId, amount, currency, keyId } = subData

      if (keyId === 'mock_public_key' || keyId.startsWith('mock')) {
        console.log('[Dev Mock] Bypassing Razorpay Checkout overlay, auto-verifying order:', orderId)
        try {
          setLoading(true)
          const verifyRes = await fetch('/api/v1/billing/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              paymentId: 'pay_mock_' + Math.random().toString(36).substring(2, 10),
              signature: 'sig_mock_' + Math.random().toString(36).substring(2, 10),
              planSlug,
              billingCycle
            })
          })
          const verifyData = await verifyRes.json()

          if (verifyRes.ok && verifyData.success) {
            showToast('success', 'Plan upgraded and activated successfully (Mock Verification)!')
            setUpgradeModalOpen(false)
            fetchBillingData()
          } else {
            showToast('error', verifyData.error || 'Signature verification failed.')
          }
        } catch (err: any) {
          showToast('error', err.message || 'Verification request failed.')
        } finally {
          setLoading(false)
          setProcessingPlanSlug(null)
        }
        return
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Vidhyaan CRM',
        description: `${planSlug.toUpperCase()} Plan Subscription`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            setLoading(true)
            const verifyRes = await fetch('/api/v1/billing/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planSlug,
                billingCycle
              })
            })
            const verifyData = await verifyRes.json()

            if (verifyRes.ok && verifyData.success) {
              showToast('success', 'Plan upgraded and activated successfully!')
              setUpgradeModalOpen(false)
              fetchBillingData()
            } else {
              showToast('error', verifyData.error || 'Signature verification failed.')
            }
          } catch (err: any) {
            showToast('error', err.message || 'Verification request failed.')
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPlanSlug(null)
          }
        },
        prefill: {
          name: org?.name || '',
          email: org?.email || '',
          contact: org?.phone || ''
        },
        theme: {
          color: '#1565D8'
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()

    } catch (err: any) {
      showToast('error', err.message || 'Checkout failed to initialize.')
      setProcessingPlanSlug(null)
    }
  }

  // Handle plan cancellation
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

  const getPrice = (plan: any) => {
    if (billingCycle === 'MONTHLY') return Number(plan.monthlyPrice)
    if (billingCycle === 'QUARTERLY') return plan.quarterlyPrice ? Number(plan.quarterlyPrice) : Number(plan.monthlyPrice) * 3 * 0.9
    return plan.annualPrice ? Number(plan.annualPrice) : Number(plan.monthlyPrice) * 12 * 0.75
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

  if (loading && !org) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1565D8]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

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
        <button
          onClick={() => setUpgradeModalOpen(true)}
          className="bg-[#1565D8] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition"
        >
          <ArrowUpRight className="size-4" />
          Upgrade Plan
        </button>
      </div>

      {/* CURRENT STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CURRENT SUBSCRIPTION CARD */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Subscription</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                getStatusBadgeClass(org?.status || 'TRIAL')
              }`}>
                {org?.status === 'ACTIVE' ? 'Paid Active' : org?.status}
              </span>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mt-3 uppercase tracking-tight">
              {subscription?.plan?.name || org?.plan?.name || 'Free Trial Plan'}
            </h3>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Billing Period</span>
                <span className="text-xs text-slate-700 font-bold uppercase">{subscription?.billingCycle || 'None (Trial)'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Cycle Cost</span>
                <span className="text-xs text-slate-700 font-bold">
                  {subscription?.amount ? `₹${Number(subscription.amount).toLocaleString()}` : '₹0 (Free)'}
                </span>
              </div>
            </div>

            {subscription?.cancelAtPeriodEnd && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 font-semibold">
                ⚠️ Cancellation requested: Your access to premium features will automatically expire on{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-4 flex items-center justify-between">
            {org?.status === 'ACTIVE' && !subscription?.cancelAtPeriodEnd ? (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="text-xs text-red-600 hover:text-red-800 font-bold transition"
              >
                Cancel Subscription
              </button>
            ) : org?.status === 'TRIAL' ? (
              <span className="text-xs text-slate-400 font-semibold">
                Trial ends on {new Date(org.trialEndsAt).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-semibold">No active billing cycles.</span>
            )}
            
            <span className="text-xs text-slate-500 font-medium">
              {subscription?.currentPeriodEnd
                ? `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                : `Trial ends on ${new Date(org?.trialEndsAt || Date.now()).toLocaleDateString()}`}
            </span>
          </div>
        </div>

        {/* METRICS / LIMITS OVERVIEW */}
        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-sm flex flex-col justify-between border border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Usage Details</span>
            <div className="mt-4">
              <span className="text-3xl font-extrabold">{org?.leadCap || 10}</span>
              <span className="text-xs text-slate-400 font-bold block mt-1">Lead Limit Capacity</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed font-semibold">
              The lead limit is automatically expanded to unlimited once you activate any paid subscription tier.
            </p>
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
                    <td className="p-4">₹{Number(tx.amount).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        tx.status === 'SUCCESS' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {tx.invoiceUrl ? (
                        <a href={tx.invoiceUrl} target="_blank" rel="noreferrer" className="text-[#1565D8] hover:underline font-bold">
                          Download
                        </a>
                      ) : (
                        <span className="text-slate-400">Available soon</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPGRADE PLAN MODAL */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            
            <button
              onClick={() => setUpgradeModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 text-center">
                Select Your Subscription Plan
              </h3>
              <p className="text-xs text-slate-500 font-medium text-center mt-1">
                Unlock admissions campaigns, fee collection pipelines, and unlimited leads.
              </p>

              {/* Cycle Toggle inside Modal */}
              <div className="mt-6 flex justify-center">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 shadow-sm">
                  {['MONTHLY', 'QUARTERLY', 'ANNUAL'].map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                        billingCycle === cycle
                          ? 'bg-[#1565D8] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      {cycle.toLowerCase()}
                      {cycle === 'QUARTERLY' && (
                        <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-green-50 text-green-700 border border-green-200 text-[8px] font-black px-1 rounded-full whitespace-nowrap">
                          -10%
                        </span>
                      )}
                      {cycle === 'ANNUAL' && (
                        <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-blue-50 text-blue-700 border border-blue-200 text-[8px] font-black px-1 rounded-full whitespace-nowrap">
                          -25%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan Cards inside Modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {plans.map((plan) => {
                  const isCurrent = org?.planId === plan.id
                  const price = getPrice(plan)
                  const totalFormatted = billingCycle === 'QUARTERLY' ? `(₹${(price * 3).toLocaleString()} billed quarterly)` : billingCycle === 'ANNUAL' ? `(₹${(price * 12).toLocaleString()} billed annually)` : ''

                  return (
                    <div
                      key={plan.id}
                      className={`bg-white rounded-xl border p-6 flex flex-col justify-between relative transition-shadow ${
                        plan.slug === 'growth' ? 'border-[#1565D8] ring-2 ring-blue-50' : 'border-slate-200'
                      }`}
                    >
                      <div>
                        {plan.slug === 'growth' && (
                          <div className="absolute top-4 right-4 bg-[#1565D8] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Recommended
                          </div>
                        )}
                        <h4 className="text-lg font-black text-slate-900">{plan.name}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">{plan.description}</p>

                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-3xl font-black text-slate-900">₹{price.toLocaleString()}</span>
                          <span className="text-xs text-slate-400 font-bold">/mo</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold block">{totalFormatted}</span>

                        <ul className="mt-6 space-y-3 text-xs text-slate-600">
                          <li className="flex gap-2">
                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span>Unlimited leads capture</span>
                          </li>
                          <li className="flex gap-2">
                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span>Admission manager</span>
                          </li>
                          {plan.slug === 'growth' && (
                            <>
                              <li className="flex gap-2">
                                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                <span>Fee invoice automation</span>
                              </li>
                              <li className="flex gap-2">
                                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                <span>WhatsApp alerts</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>

                      <div className="mt-8">
                        <button
                          disabled={isCurrent || processingPlanSlug === plan.slug}
                          onClick={() => handleUpgradeSelect(plan.slug)}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            isCurrent
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              : 'bg-[#1565D8] hover:bg-blue-700 text-white shadow-sm'
                          }`}
                        >
                          {processingPlanSlug === plan.slug ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : isCurrent ? (
                            'Current Active Plan'
                          ) : (
                            'Select Plan & Subscribe'
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL SUBSCRIPTION CONFIRMATION MODAL */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative">
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
