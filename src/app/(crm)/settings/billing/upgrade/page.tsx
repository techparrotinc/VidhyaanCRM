'use client'

import React, { useState, useEffect, useRef } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Check,
  ChevronLeft,
  Layers,
  ShieldCheck,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react'

const SLAB_ORDER = ['S50', 'S100', 'S200', 'S500', 'S500_PLUS']
const SLAB_LABELS: Record<string, string> = {
  S50: 'up to 50 students',
  S100: '51–100 students',
  S200: '101–200 students',
  S500: '201–500 students',
  S500_PLUS: '500+ students'
}

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    'Lead capture & pipeline (unlimited leads)',
    'Admission CRM — list, grid & kanban',
    'Counsellor & follow-up management',
    'Campaigns & event management',
    'Dashboard & core reports'
  ],
  growth: [
    'Student management & promotions',
    'Fee structures & invoice automation',
    'Online fee collection (Razorpay)',
    'Receipts, dues & payment reports',
    'Financial dashboard'
  ],
  enterprise: [
    'Everything in CRM Package + Fee Management',
    'AI assistant, reports, insights & search',
    'Parent portal with events & RSVP',
    'Advanced reports & role dashboards',
    'Priority support'
  ]
}

const NEXT_STEPS = [
  'Your subscription activates instantly after payment — all plan modules unlock right away.',
  'A GST invoice is generated automatically and available under Billing → Transaction & Invoice History.',
  'Our team is available for onboarding help — setup checklist, data import, and staff training.'
]

export default function UpgradePlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [studentCount, setStudentCount] = useState(0)
  const [slab, setSlab] = useState('S50')
  const [selectedSlab, setSelectedSlab] = useState('S50')
  const [enabledCycles, setEnabledCycles] = useState<string[]>(['MONTHLY', 'ANNUAL'])
  const [pricesIncludeGst, setPricesIncludeGst] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('ANNUAL')
  const [proration, setProration] = useState<any>(null)
  const [billingProfile, setBillingProfile] = useState<any>(null)

  const [summaryPlan, setSummaryPlan] = useState<any>(null)
  const [gstinInput, setGstinInput] = useState('')
  const [addrLine, setAddrLine] = useState('')
  const [addrCity, setAddrCity] = useState('')
  const [addrState, setAddrState] = useState('')
  const [addrPincode, setAddrPincode] = useState('')

  const [processing, setProcessing] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<{ code: string; percentOff: number } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponChecking, setCouponChecking] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const subSignatureRef = useRef<string | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 6000)
  }

  const fetchBillingData = async (background = false) => {
    try {
      if (!background) setLoading(true)
      const res = await fetch('/api/v1/billing')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load billing data')

      setOrg(data.org)
      setSubscription(data.subscription)
      setPlans(data.plans)
      setStudentCount(data.studentCount ?? 0)
      setSlab(data.slab ?? 'S50')
      setSelectedSlab((prev) => (prev === 'S50' ? data.slab ?? 'S50' : prev))
      setProration(data.proration ?? null)
      setBillingProfile(data.billingProfile ?? null)
      setGstinInput((prev) => prev || data.billingProfile?.gstin || '')
      const parts = data.billingProfile?.addressParts
      if (parts) {
        setAddrLine((prev) => prev || parts.addressLine || '')
        setAddrCity((prev) => prev || parts.city || '')
        setAddrState((prev) => prev || parts.state || '')
        setAddrPincode((prev) => prev || parts.pincode || '')
      }
      setPricesIncludeGst(!!data.pricesIncludeGst)
      const cycles = data.enabledCycles?.length ? data.enabledCycles : ['MONTHLY', 'ANNUAL']
      setEnabledCycles(cycles)
      setBillingCycle((prev) =>
        cycles.includes(prev) ? prev : cycles.includes('ANNUAL') ? 'ANNUAL' : cycles[0]
      )

      // Payment landed (handler, redirect, or reconcile) → back to billing
      const sig = `${data.org?.planId ?? ''}|${data.subscription?.currentPeriodEnd ?? ''}`
      if (subSignatureRef.current && sig !== subSignatureRef.current) {
        router.push('/settings/billing?activated=1')
        return
      }
      subSignatureRef.current = sig
    } catch (err: any) {
      showToast('error', err.message || 'Network error while loading plans.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBillingData()
    const onFocus = () => fetchBillingData(true)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll while a payment is in flight — covers redirect/UPI flows
  useEffect(() => {
    if (!processing) return
    const interval = setInterval(() => fetchBillingData(true), 4000)
    const stop = setTimeout(() => clearInterval(interval), 5 * 60 * 1000)
    return () => {
      clearInterval(interval)
      clearTimeout(stop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processing])

  const selectableSlabs = SLAB_ORDER.slice(SLAB_ORDER.indexOf(slab))
  const getSlabPrice = (plan: any) => plan.slabPrices?.find((sp: any) => sp.slab === selectedSlab) ?? null
  const getMonthly = (plan: any) => {
    const sp = getSlabPrice(plan)
    return sp ? Number(sp.effectiveMonthly) : Number(plan.monthlyPrice)
  }
  const getCycleTotal = (plan: any) => {
    const monthly = getMonthly(plan)
    if (billingCycle === 'QUARTERLY') return monthly * 3
    if (billingCycle === 'ANNUAL') {
      const sp = getSlabPrice(plan)
      return sp ? Number(sp.annual) : monthly * 10
    }
    return monthly
  }

  const applyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponChecking(true)
    setCouponError(null)
    try {
      const res = await fetch('/api/v1/billing/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput })
      })
      const data = await res.json()
      if (data.valid) {
        setCoupon({ code: data.code, percentOff: data.percentOff })
      } else {
        setCoupon(null)
        setCouponError(data.reason || 'Invalid coupon')
      }
    } catch {
      setCouponError('Could not validate coupon — try again')
    } finally {
      setCouponChecking(false)
    }
  }

  const hasStoredAddress = !!billingProfile?.address
  const addressFormComplete = !!(addrLine.trim() && addrCity.trim() && addrState.trim() && /^\d{6}$/.test(addrPincode))

  // Current plan becomes renewable inside the renewal window (T−15 days),
  // during grace, or once expired — proration credits any remaining days.
  const isRenewable = (() => {
    if (!subscription) return false
    if (['GRACE_PERIOD', 'PAST_DUE', 'EXPIRED'].includes(subscription.status)) return true
    if (subscription.status !== 'ACTIVE' || !subscription.currentPeriodEnd) return false
    const daysLeft = (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / 86400000
    return daysLeft <= 15
  })()

  const handlePay = async (planSlug: string) => {
    try {
      setProcessing(true)

      const listCycle = summaryPlan ? getCycleTotal(summaryPlan) : 0
      const couponOff = coupon ? Math.round(listCycle * (coupon.percentOff / 100) * 100) / 100 : 0
      const fullBase = listCycle - couponOff
      const credit = proration ? Math.min(Number(proration.credit), fullBase) : 0
      const willCharge = fullBase - credit > 0

      if (!hasStoredAddress && willCharge) {
        if (!addressFormComplete) {
          throw new Error('Please fill the billing address (with a 6-digit pincode) before payment.')
        }
        const profileRes = await fetch('/api/v1/billing/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gstin: gstinInput || '',
            addressLine: addrLine.trim(),
            city: addrCity.trim(),
            state: addrState.trim(),
            pincode: addrPincode
          })
        })
        if (!profileRes.ok) {
          const body = await profileRes.json().catch(() => null)
          const detail = body?.details ? Object.values(body.details).flat().join(', ') : body?.error
          throw new Error(detail || 'Failed to save billing address')
        }
      }

      const subRes = await fetch('/api/v1/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug,
          billingCycle,
          slab: selectedSlab,
          gstin: gstinInput || undefined,
          couponCode: coupon?.code || undefined
        })
      })
      const subData = await subRes.json()
      if (!subRes.ok) throw new Error(subData.error || 'Failed to initialize checkout')

      if (subData.downgradeScheduled) {
        showToast('success', subData.message || 'Plan change scheduled at the end of your current period.')
        setProcessing(false)
        setTimeout(() => router.push('/settings/billing'), 1200)
        return
      }

      const { orderId, amount, currency, keyId } = subData

      if (keyId === 'mock_public_key' || keyId.startsWith('mock')) {
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
          router.push('/settings/billing?activated=1')
        } else {
          showToast('error', verifyData.error || 'Verification failed.')
          setProcessing(false)
        }
        return
      }

      if (!(window as any).Razorpay) {
        throw new Error('Payment gateway is still loading — please try again in a few seconds.')
      }

      const rzp = new (window as any).Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'Vidhyaan',
        description: `${summaryPlan?.name ?? planSlug} subscription`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
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
              router.push('/settings/billing?activated=1')
            } else {
              showToast('error', verifyData.error || 'Verification failed.')
              setProcessing(false)
            }
          } catch (err: any) {
            showToast('error', err.message || 'Verification request failed.')
            setProcessing(false)
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false)
            fetchBillingData(true)
          }
        },
        prefill: {
          name: org?.name || '',
          email: org?.email || '',
          contact: org?.phone || ''
        },
        theme: { color: '#1565D8' }
      })
      rzp.open()
    } catch (err: any) {
      showToast('error', err.message || 'Checkout failed to initialize.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1565D8]"></div>
      </div>
    )
  }

  /* ------------------------------ STEP 2: ORDER PAGE ------------------------------ */
  if (summaryPlan) {
    const sp = getSlabPrice(summaryPlan)
    const listCycle = getCycleTotal(summaryPlan)
    const couponOff = coupon ? Math.round(listCycle * (coupon.percentOff / 100) * 100) / 100 : 0
    const fullBase = Math.round((listCycle - couponOff) * 100) / 100
    const credit = proration ? Math.min(Number(proration.credit), fullBase) : 0
    const base = Math.round((fullBase - credit) * 100) / 100
    // Inclusive mode: the listed price is final, GST carved out for the invoice.
    const gst = pricesIncludeGst
      ? Math.round((base - base / 1.18) * 100) / 100
      : Math.round(base * 0.18 * 100) / 100
    const total = pricesIncludeGst ? base : base + gst
    const isScheduledChange = base <= 0
    const cycleLabel = billingCycle === 'ANNUAL' ? '12 months (2 free)' : billingCycle === 'QUARTERLY' ? '3 months' : '1 month'

    return (
      <div className="animate-fade-in">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
        {toast && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm font-semibold animate-fade-in ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {toast.message}
          </div>
        )}

        <button
          onClick={() => setSummaryPlan(null)}
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 mb-5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Change plan
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-6xl">
          {/* LEFT: What you're buying + trust */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#1565D8] flex items-center justify-center font-bold text-white text-lg shadow-sm">V</div>
              <div>
                <div className="text-sm font-black text-slate-900">Vidhyaan</div>
                <div className="text-[11px] font-semibold text-slate-400">School CRM & Fee Management</div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">{summaryPlan.name} Subscription</h2>
              <div className="h-1 w-10 bg-[#1565D8] rounded-full mt-2" />
              <p className="text-sm text-slate-600 font-medium mt-4 leading-relaxed">
                {summaryPlan.description}
              </p>
            </div>

            <ol className="space-y-3">
              {NEXT_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#1565D8] text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>

            <div className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-3">
              Capacity: {SLAB_LABELS[selectedSlab]} — detected from your {studentCount.toLocaleString()} active student{studentCount === 1 ? '' : 's'}; re-checked at renewal.
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="text-xs font-black text-slate-800">Contact Us:</div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> support@vidhyaan.com
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> +91 98841 85362
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs font-black text-slate-800 mb-1.5">Terms &amp; Conditions:</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {pricesIncludeGst
                  ? 'Prices are inclusive of 18% GST (SAC 998314), itemised on your invoice.'
                  : 'Prices are exclusive of GST; 18% GST (SAC 998314) applies.'}{' '}
                Subscription activates on successful payment and renews per the selected cycle.
                <strong> All payments are final and non-refundable</strong> — on cancellation, your plan
                stays fully active until the end of the paid period. Payments are processed securely by Razorpay.
              </p>
            </div>
          </div>

          {/* RIGHT: Payment Details card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:sticky lg:top-24">
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-lg font-black text-slate-900">Payment Details</h3>
                <div className="h-1 w-8 bg-[#1565D8] rounded-full mt-1.5" />
              </div>

              {/* Line items */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3 font-semibold text-slate-700">
                  <span>{summaryPlan.name} — {cycleLabel} · {SLAB_LABELS[selectedSlab]}</span>
                  <span className="tabular-nums shrink-0">₹{listCycle.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                {couponOff > 0 && coupon && (
                  <div className="flex justify-between gap-3 font-semibold text-emerald-600">
                    <span>Coupon {coupon.code} — {coupon.percentOff}% off</span>
                    <span className="tabular-nums shrink-0">− ₹{couponOff.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {sp?.launchMonthly != null && (
                  <div className="text-[10px] font-black uppercase tracking-wide text-green-700">Launch offer applied</div>
                )}
                {sp?.bundledAiCredits > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                    <Sparkles className="w-3 h-3" /> Includes {sp.bundledAiCredits} AI credits/month
                  </div>
                )}
                {credit > 0 && (
                  <div className="flex justify-between gap-3 font-semibold text-emerald-600">
                    <span>Credit — {proration.remainingDays} unused day{proration.remainingDays === 1 ? '' : 's'} on {proration.currentPlanName}</span>
                    <span className="tabular-nums shrink-0">− ₹{credit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>GST 18% (SAC 998314){pricesIncludeGst ? ' — included' : ''}</span>
                  <span className="tabular-nums">₹{gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 text-base font-black text-slate-900">
                  <span>Total payable</span>
                  <span className="tabular-nums">₹{Math.max(0, total).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Coupon */}
              {!isScheduledChange && (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
                      placeholder="Coupon code"
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold tracking-wider text-slate-800 outline-none focus:border-[#1565D8]"
                    />
                    {coupon ? (
                      <button
                        onClick={() => { setCoupon(null); setCouponInput('') }}
                        className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 cursor-pointer"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={applyCoupon}
                        disabled={couponChecking || !couponInput.trim()}
                        className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold px-4 rounded-lg cursor-pointer transition"
                      >
                        {couponChecking ? '…' : 'Apply'}
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-[11px] font-semibold text-red-600 mt-1">{couponError}</p>}
                  {coupon && (
                    <p className="text-[11px] font-semibold text-emerald-600 mt-1">
                      Coupon {coupon.code} applied — {coupon.percentOff}% off this payment.
                    </p>
                  )}
                </div>
              )}

              {/* Bill To */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Bill To</div>
                <div className="text-xs font-bold text-slate-800">{billingProfile?.name || org?.name}</div>
                <div className="text-[11px] text-slate-500 font-semibold">
                  {billingProfile?.email}{billingProfile?.phone ? ` · ${billingProfile.phone}` : ''}
                </div>
                {hasStoredAddress ? (
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">{billingProfile.address}</div>
                ) : !isScheduledChange ? (
                  <div className="mt-2.5 space-y-2">
                    <div className="text-[11px] text-amber-600 font-semibold">Billing address required for the GST invoice.</div>
                    <input type="text" value={addrLine} onChange={(e) => setAddrLine(e.target.value)}
                      placeholder="Door No, Street Name, Locality"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#1565D8]" />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} placeholder="City"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#1565D8]" />
                      <input type="text" value={addrState} onChange={(e) => setAddrState(e.target.value)} placeholder="State"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#1565D8]" />
                      <input type="text" value={addrPincode} onChange={(e) => setAddrPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Pincode"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#1565D8]" />
                    </div>
                  </div>
                ) : null}
                {!isScheduledChange && (
                  <div className="mt-2.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">GSTIN (optional)</label>
                    <input
                      type="text"
                      value={gstinInput}
                      onChange={(e) => setGstinInput(e.target.value.toUpperCase())}
                      placeholder="e.g. 33ABCDE1234F1Z5"
                      maxLength={15}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 tracking-wider outline-none focus:border-[#1565D8]"
                    />
                  </div>
                )}
              </div>

              {isScheduledChange && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-800">
                  Your remaining credit covers this plan fully. No payment now — the change takes effect on{' '}
                  {proration?.currentPeriodEnd ? new Date(proration.currentPeriodEnd).toLocaleDateString('en-IN') : 'your renewal date'}.
                </div>
              )}
            </div>

            {/* Pay bar */}
            <div className="flex items-stretch border-t border-slate-100">
              <div className="flex-1 flex items-center px-5 py-4 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-[#1565D8]" /> UPI · Cards · Netbanking — via Razorpay
              </div>
              <button
                disabled={processing || (!hasStoredAddress && !addressFormComplete && !isScheduledChange)}
                onClick={() => handlePay(summaryPlan.slug)}
                className="bg-[#1565D8] hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold px-8 flex items-center justify-center transition cursor-pointer min-w-[180px]"
              >
                {processing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : isScheduledChange ? (
                  'Schedule Change'
                ) : (
                  <>Pay ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</>
                )}
              </button>
            </div>
            {!isScheduledChange && (
              <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-100 text-[10px] font-semibold text-slate-500 text-center">
                By paying you agree this payment is <strong>non-refundable</strong> — on cancellation, your plan
                stays fully active until the end of the paid period.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ------------------------------ STEP 1: PLAN GRID ------------------------------ */
  return (
    <div className="animate-fade-in max-w-6xl">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm font-semibold animate-fade-in ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.message}
        </div>
      )}

      <Link
        href="/settings/billing"
        className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 mb-5 w-fit"
      >
        <ChevronLeft className="w-4 h-4" /> Billing &amp; Subscriptions
      </Link>

      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Select Your Subscription Plan</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Unlock admissions campaigns, fee collection pipelines, and unlimited leads.
        </p>
      </div>

      {/* Slab picker */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-xs">
          <Layers className="size-3.5 text-[#1565D8]" />
          {studentCount.toLocaleString()} active student{studentCount === 1 ? '' : 's'}
        </span>
        <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600">
          <span>Plan capacity:</span>
          <select
            value={selectedSlab}
            onChange={(e) => setSelectedSlab(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 outline-none focus:border-[#1565D8] cursor-pointer shadow-xs"
          >
            {selectableSlabs.map((s) => (
              <option key={s} value={s}>
                {SLAB_LABELS[s]}{s === slab ? ' (your size)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selectedSlab !== slab && (
        <p className="text-[10px] text-slate-400 font-semibold text-center mt-1.5">
          Buying headroom above your current size — you won&apos;t hit the limit as admissions grow.
        </p>
      )}

      {/* Cycle toggle — platform-configured */}
      {enabledCycles.length > 1 && (
        <div className="mt-5 flex justify-center">
          <div className="bg-white p-1 rounded-xl flex items-center gap-1 border border-slate-200 shadow-sm">
            {['MONTHLY', 'QUARTERLY', 'ANNUAL'].filter((c) => enabledCycles.includes(c)).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all relative cursor-pointer ${
                  billingCycle === cycle ? 'bg-[#1565D8] text-white shadow-sm' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {cycle === 'MONTHLY' ? 'monthly' : cycle === 'QUARTERLY' ? '3 months' : 'yearly'}
                {cycle === 'ANNUAL' && (
                  <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-green-50 text-green-700 border border-green-200 text-[8px] font-black px-1 rounded-full whitespace-nowrap">
                    2 months free
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-8">
        {plans.filter((p) => p.slug !== 'free').map((plan) => {
          const isCurrent = org?.planId === plan.id
          const isFlagship = plan.slug === 'enterprise'
          const sp = getSlabPrice(plan)
          const monthly = getMonthly(plan)
          const listMonthly = sp ? Number(sp.listMonthly) : null
          const hasOffer = sp?.launchMonthly != null
          const cycleTotal = getCycleTotal(plan)
          const shownMonthly =
            billingCycle === 'ANNUAL' ? cycleTotal / 12 : billingCycle === 'QUARTERLY' ? cycleTotal / 3 : monthly
          const features = PLAN_FEATURES[plan.slug] || []

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between relative transition-shadow hover:shadow-md ${
                isFlagship ? 'border-[#1565D8] ring-2 ring-blue-50' : 'border-slate-200'
              }`}
            >
              <div>
                {isFlagship && (
                  <div className="absolute top-4 right-4 bg-[#1565D8] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Recommended
                  </div>
                )}
                <h4 className="text-lg font-black text-slate-900">{plan.name}</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">{plan.description}</p>

                <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-black text-slate-900">₹{Math.round(shownMonthly).toLocaleString()}</span>
                  <span className="text-xs text-slate-400 font-bold">/mo</span>
                  {hasOffer && listMonthly != null && (
                    <span className="text-sm text-slate-400 font-bold line-through">₹{listMonthly.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5 min-h-5">
                  {hasOffer && (
                    <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                      Launch offer
                    </span>
                  )}
                  {sp?.bundledAiCredits > 0 && (
                    <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {sp.bundledAiCredits} AI credits/mo
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                  {billingCycle === 'ANNUAL'
                    ? `₹${Math.round(cycleTotal).toLocaleString()} billed annually — pay for 10 months`
                    : billingCycle === 'QUARTERLY'
                      ? `₹${Math.round(cycleTotal).toLocaleString()} billed every 3 months`
                      : 'Billed monthly'}
                </span>
                {selectedSlab === 'S500_PLUS' && sp?.overagePerStudent != null && (
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                    Starting price · +₹{sp.overagePerStudent}/student beyond 500 · 1,000+ students: contact us
                  </span>
                )}

                <ul className="mt-5 space-y-2.5 text-xs text-slate-600">
                  {features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  disabled={isCurrent && !isRenewable}
                  onClick={() => { setSummaryPlan(plan); window.scrollTo({ top: 0 }) }}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isCurrent && !isRenewable
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : isCurrent
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : isFlagship
                          ? 'bg-[#1565D8] hover:bg-blue-700 text-white shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                  }`}
                >
                  {isCurrent ? (isRenewable ? 'Renew Plan' : 'Current Active Plan') : 'Select Plan & Subscribe'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-slate-400 font-semibold text-center mt-6">
        {pricesIncludeGst
          ? 'Prices inclusive of 18% GST (SAC 998314) — itemised on your downloadable GST invoice.'
          : 'Prices exclusive of GST — 18% GST (SAC 998314) is added at checkout with a downloadable GST invoice.'}{' '}
        Your slab is detected automatically from active students and re-checked at renewal.
      </p>
    </div>
  )
}
