"use client"

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  IndianRupee,
  TrendingUp,
  Building2,
  Sparkles,
  Loader2,
  AlertTriangle,
  BadgePercent,
  Calculator,
  RotateCcw,
  Ticket,
  Plus
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  PLAN_CATALOG,
  SLABS,
  SCENARIOS,
  ANNUAL_MONTHS,
  OVERAGE_PER_STUDENT,
  CUSTOM_QUOTE_ABOVE_STUDENTS,
  grossMarginPct,
  projectStage,
  breakEvenCustomers,
  type Scenario
} from '@/lib/pricing/catalog'

interface LiveStats {
  organizations: { total: number; paid: number; trial: number; freePlan: number }
  revenue: { mrr: number; arr: number; thisMonth: number; growthPct: number }
}

const ASSUMPTIONS_STORAGE_KEY = 'vidhyaan-admin-pricing-assumptions-v1'

interface CouponRow {
  id: string
  code: string
  percentOff: number
  maxRedemptions: number | null
  expiresAt: string | null
  isActive: boolean
  redemptions: number
}

interface Assumptions {
  scenarioKey: string
  arpu: number
  addonCogs: number
}

function formatINR(amount: number, compact = false) {
  if (compact) {
    const abs = Math.abs(amount)
    const sign = amount < 0 ? '−' : ''
    if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`
    if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}k`
    return `${sign}₹${abs.toFixed(0)}`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export default function AdminPricingPage() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly')

  // Coupons
  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [newCode, setNewCode] = useState('')
  const [newPct, setNewPct] = useState('10')
  const [newMax, setNewMax] = useState('')
  const [newExpiry, setNewExpiry] = useState('')
  const [couponSaving, setCouponSaving] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  const fetchCoupons = async () => {
    const res = await fetch('/api/admin/coupons')
    if (res.ok) setCoupons(await res.json())
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setCouponSaving(true)
    setCouponError(null)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          percentOff: parseInt(newPct),
          maxRedemptions: newMax ? parseInt(newMax) : null,
          expiresAt: newExpiry ? new Date(newExpiry).toISOString() : null
        })
      })
      const data = await res.json()
      if (!res.ok) {
        const detail = data.details ? Object.values(data.details).flat().join(', ') : data.error
        throw new Error(detail || 'Failed to create coupon')
      }
      setNewCode('')
      setNewMax('')
      setNewExpiry('')
      await fetchCoupons()
    } catch (err: any) {
      setCouponError(err.message)
    } finally {
      setCouponSaving(false)
    }
  }

  const toggleCoupon = async (coupon: CouponRow) => {
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !coupon.isActive })
    })
    if (res.ok) fetchCoupons()
  }

  const defaultScenario = SCENARIOS[0]
  const [assumptions, setAssumptions] = useState<Assumptions>({
    scenarioKey: defaultScenario.key,
    arpu: defaultScenario.arpu,
    addonCogs: defaultScenario.addonCogsPerCustomer
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ASSUMPTIONS_STORAGE_KEY)
      if (saved) setAssumptions(JSON.parse(saved))
    } catch {
      // corrupt storage — keep defaults
    }
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/stats')
        if (!res.ok) throw new Error('Failed to fetch platform stats')
        const data = await res.json()
        setStats({
          organizations: {
            total: data.organizations.total,
            paid: data.organizations.paid,
            trial: data.organizations.trial,
            freePlan: data.organizations.freePlan
          },
          revenue: data.revenue
        })
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Error fetching stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    fetchCoupons().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scenario: Scenario =
    SCENARIOS.find((s) => s.key === assumptions.scenarioKey) || defaultScenario

  const updateAssumptions = (patch: Partial<Assumptions>) => {
    setAssumptions((prev) => {
      let next = { ...prev, ...patch }
      // Switching scenario resets ARPU/COGS to that scenario's defaults
      if (patch.scenarioKey && patch.scenarioKey !== prev.scenarioKey) {
        const s = SCENARIOS.find((x) => x.key === patch.scenarioKey)
        if (s) next = { scenarioKey: s.key, arpu: s.arpu, addonCogs: s.addonCogsPerCustomer }
      }
      try {
        localStorage.setItem(ASSUMPTIONS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // storage unavailable — assumptions stay in memory only
      }
      return next
    })
  }

  const resetAssumptions = () => {
    updateAssumptions({
      scenarioKey: scenario.key,
      arpu: scenario.arpu,
      addonCogs: scenario.addonCogsPerCustomer
    })
  }

  const projections = useMemo(
    () => scenario.stages.map((stage) => projectStage(stage, assumptions.arpu, assumptions.addonCogs)),
    [scenario, assumptions.arpu, assumptions.addonCogs]
  )

  const breakEven = useMemo(
    () => breakEvenCustomers(scenario, assumptions.arpu, assumptions.addonCogs),
    [scenario, assumptions.arpu, assumptions.addonCogs]
  )

  // Live position: where does the current paid customer count sit in the model?
  const liveNet = useMemo(() => {
    if (!stats) return null
    const customers = stats.organizations.paid
    // Interpolate ops/infra between model stages for the live customer count
    const stages = scenario.stages
    let ops = stages[0].opsPerMonth
    let infra = stages[0].infraPerMonth
    for (let i = 0; i < stages.length - 1; i++) {
      const a = stages[i]
      const b = stages[i + 1]
      if (customers >= a.customers && customers <= b.customers) {
        const t = (customers - a.customers) / (b.customers - a.customers)
        ops = a.opsPerMonth + t * (b.opsPerMonth - a.opsPerMonth)
        infra = a.infraPerMonth + t * (b.infraPerMonth - a.infraPerMonth)
        break
      }
      if (customers > b.customers) {
        ops = b.opsPerMonth
        infra = b.infraPerMonth
      }
    }
    const mrr = stats.revenue.mrr
    const cogs = infra + customers * assumptions.addonCogs
    const net = mrr - cogs - ops
    return { customers, mrr, net, marginPct: mrr > 0 ? (net / mrr) * 100 : 0 }
  }, [stats, scenario, assumptions.addonCogs])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 text-center max-w-md mx-auto mt-20 select-none text-red-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Pricing Console</h3>
        <p className="text-sm mt-2 text-slate-500">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 text-white font-bold text-xs py-2 px-4 shadow-sm">
          Retry Loading
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 select-none bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans font-black">Pricing & Financial Model</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Slab pricing catalog, unit economics, and profitability projections. Base plan prices edit in{' '}
          <Link href="/admin/plans" className="text-blue-600 font-semibold hover:underline">Plans</Link>.
        </p>
      </div>

      {/* Live Business Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'Paying Customers',
            value: String(stats?.organizations.paid ?? 0),
            sub: `${stats?.organizations.trial ?? 0} in trial · ${stats?.organizations.freePlan ?? 0} free`,
            icon: Building2
          },
          {
            label: 'MRR',
            value: formatINR(stats?.revenue.mrr ?? 0, true),
            sub: `${(stats?.revenue.growthPct ?? 0) >= 0 ? '+' : ''}${stats?.revenue.growthPct ?? 0}% MoM revenue`,
            icon: TrendingUp
          },
          {
            label: 'ARR',
            value: formatINR(stats?.revenue.arr ?? 0, true),
            sub: 'Annualized run-rate',
            icon: IndianRupee
          },
          {
            label: 'Est. Net / Month',
            value: liveNet ? formatINR(liveNet.net, true) : '—',
            sub: `${scenario.name} cost model`,
            icon: Calculator,
            tone: liveNet && liveNet.net >= 0 ? 'positive' : 'negative'
          },
          {
            label: 'Break-even At',
            value: breakEven ? `${breakEven} customers` : 'Beyond model',
            sub: `≈ ${formatINR(breakEven ? breakEven * assumptions.arpu : 0, true)} MRR`,
            icon: BadgePercent
          }
        ].map((kpi) => {
          const Icon = kpi.icon
          const tone = (kpi as any).tone
          return (
            <Card key={kpi.label} className="p-4 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <Icon className="w-3.5 h-3.5 text-blue-500" />
                {kpi.label}
              </div>
              <div
                className={`text-xl font-black tracking-tight mt-2 leading-none ${
                  tone === 'negative' ? 'text-red-600' : tone === 'positive' ? 'text-emerald-600' : 'text-slate-900'
                }`}
              >
                {kpi.value}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 mt-1.5">{kpi.sub}</div>
            </Card>
          )
        })}
      </section>

      {/* Pricing Catalog */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Slab Pricing Catalog</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Prices excl. GST 18%. Annual = pay for {ANNUAL_MONTHS} months. 500+ slabs are &ldquo;starting at&rdquo; —
              overage billed per student beyond 500; above {CUSTOM_QUOTE_ABOVE_STUDENTS.toLocaleString('en-IN')} students → custom quote.
            </p>
          </div>
          <div className="flex rounded-full border border-slate-200 bg-white p-0.5 text-xs font-bold">
            {(['monthly', 'annual'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`px-4 py-1.5 rounded-full transition ${
                  cycle === c ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {c === 'monthly' ? 'Monthly' : 'Annual (2 mo free)'}
              </button>
            ))}
          </div>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Student Slab</th>
                  {PLAN_CATALOG.map((plan) => (
                    <th key={plan.slug} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <span className="flex items-center gap-1.5">
                        {plan.name}
                        {plan.flagship && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLABS.map((slab) => (
                  <tr key={slab.key} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4">
                      <div className="text-sm font-bold text-slate-900">{slab.label}</div>
                      <div className="text-[10px] font-semibold text-slate-400 mt-0.5">students</div>
                    </td>
                    {PLAN_CATALOG.map((plan) => {
                      const price = plan.slabs[slab.key]
                      const invoiced = price.launchMonthly ?? price.monthly
                      const shown = cycle === 'annual' ? invoiced * ANNUAL_MONTHS : invoiced
                      const gm = grossMarginPct(invoiced, slab.key, price.bundledAiCredits ?? 0)
                      return (
                        <td key={plan.slug} className="px-5 py-4 align-top">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-black text-slate-900 tabular-nums">
                              {formatINR(shown)}
                              <span className="text-[10px] font-semibold text-slate-400">/{cycle === 'annual' ? 'yr' : 'mo'}</span>
                            </span>
                            {price.launchMonthly && (
                              <span className="text-[10px] font-semibold text-slate-400 line-through tabular-nums">
                                {formatINR(cycle === 'annual' ? price.monthly * ANNUAL_MONTHS : price.monthly)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {price.launchMonthly && (
                              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Launch offer
                              </span>
                            )}
                            {price.bundledAiCredits ? (
                              <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                {price.bundledAiCredits} AI cr/mo
                              </span>
                            ) : null}
                            <span className="text-[9px] font-bold text-slate-400">{gm.toFixed(0)}% GM</span>
                          </div>
                          {slab.key === 'S500_PLUS' && (
                            <div className="text-[9px] font-semibold text-slate-400 mt-1">
                              + ₹{OVERAGE_PER_STUDENT[plan.slug]}/student beyond 500
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 text-[10px] font-semibold text-slate-400">
            Catalog defined in <span className="font-mono text-slate-500">src/lib/pricing/catalog.ts</span> · GM = gross margin
            (infra + AI allowance + 2% gateway) · Custom per-org offers: open the org in{' '}
            <Link href="/admin/orgs" className="text-blue-600 hover:underline">Organizations</Link> and adjust its subscription discount.
          </div>
        </Card>
      </section>

      {/* Financial Model */}
      <section className="space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Profitability Projection</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-2xl">{scenario.description}</p>
            {stats && stats.organizations.paid > 0 && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                Live blended ARPU: {formatINR(stats.revenue.mrr / stats.organizations.paid)} /mo
                ({stats.organizations.paid} paying) — model assumes {formatINR(assumptions.arpu)}
              </span>
            )}
          </div>
          <button
            onClick={resetAssumptions}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition"
          >
            <RotateCcw className="w-3 h-3" /> Reset to scenario defaults
          </button>
        </div>

        {/* Assumption controls */}
        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Scenario</label>
              <select
                value={assumptions.scenarioKey}
                onChange={(e) => updateAssumptions({ scenarioKey: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500 bg-white"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.key} value={s.key}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Blended ARPU (₹/customer/mo)
              </label>
              <input
                type="number"
                min={0}
                value={assumptions.arpu}
                onChange={(e) => updateAssumptions({ arpu: Number(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Variable COGS (₹/customer/mo)
              </label>
              <input
                type="number"
                min={0}
                value={assumptions.addonCogs}
                onChange={(e) => updateAssumptions({ addonCogs: Number(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Projection table */}
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[880px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Customers', 'MRR', 'ARR', 'COGS / mo', 'Ops / mo', 'Gross Profit', 'Net Profit', 'Net Margin'].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projections.map((row) => {
                  const isBreakEvenZone =
                    breakEven !== null &&
                    row.netProfit >= 0 &&
                    projections.find((r) => r.customers < row.customers && r.netProfit < 0) !== undefined &&
                    projections.filter((r) => r.netProfit >= 0)[0]?.customers === row.customers
                  return (
                    <tr
                      key={row.customers}
                      className={`border-b border-slate-50 transition ${isBreakEvenZone ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-black text-slate-900 tabular-nums">{row.customers.toLocaleString('en-IN')}</span>
                        {isBreakEvenZone && (
                          <span className="ml-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            break-even ≈ {breakEven}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-900 tabular-nums">{formatINR(row.mrr, true)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-600 tabular-nums">{formatINR(row.arr, true)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-600 tabular-nums">{formatINR(row.cogs, true)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-slate-600 tabular-nums">{formatINR(row.ops, true)}</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-900 tabular-nums">{formatINR(row.grossProfit, true)}</td>
                      <td className={`px-5 py-3.5 text-sm font-black tabular-nums ${row.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatINR(row.netProfit, true)}
                      </td>
                      <td className={`px-5 py-3.5 text-sm font-bold tabular-nums ${row.netMarginPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {row.netMarginPct.toFixed(0)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 text-[10px] font-semibold text-slate-400">
            COGS = platform infra + variable cost × customers · Ops = salaries, sales, marketing, overhead per growth stage ·
            Full model: docs/pricing-strategy-2026.md
          </div>
        </Card>
      </section>

      {/* Coupons */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-blue-500" /> Coupons
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Percent-off codes for subscription checkout. One redemption per institution; discount caps at 50% (floor-price guard); renewals bill full price.
          </p>
        </div>

        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <form onSubmit={handleCreateCoupon} className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Code</label>
              <input type="text" required value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="LAUNCH20"
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold tracking-wider text-slate-700 outline-hidden focus:border-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">% Off (1–50)</label>
              <input type="number" required min={1} max={50} value={newPct} onChange={(e) => setNewPct(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Max Uses</label>
              <input type="number" min={1} value={newMax} onChange={(e) => setNewMax(e.target.value)}
                placeholder="Unlimited"
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Expires</label>
              <input type="date" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500" />
            </div>
            <Button type="submit" disabled={couponSaving} className="bg-blue-600 text-white hover:bg-blue-700 font-bold py-2 text-xs flex items-center justify-center gap-1">
              {couponSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (<><Plus className="w-3.5 h-3.5" /> Create</>)}
            </Button>
          </form>
          {couponError && <p className="text-[11px] font-semibold text-red-600 mt-2">{couponError}</p>}
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden p-0">
          {coupons.length === 0 ? (
            <div className="p-6 text-center text-xs font-semibold text-slate-400">No coupons yet — create the first one above.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {['Code', '% Off', 'Redeemed', 'Max', 'Expires', 'Status', ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3 text-sm font-black tracking-wider text-slate-900">{c.code}</td>
                      <td className="px-5 py-3 text-sm font-bold tabular-nums">{c.percentOff}%</td>
                      <td className="px-5 py-3 text-sm font-semibold tabular-nums">{c.redemptions}</td>
                      <td className="px-5 py-3 text-sm font-semibold tabular-nums">{c.maxRedemptions ?? '∞'}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-500">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          c.isActive ? 'bg-green-50 text-green-700 border-green-150' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {c.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => toggleCoupon(c)}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          {c.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}
