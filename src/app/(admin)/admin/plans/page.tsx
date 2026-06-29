"use client"

import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  Building,
  Activity,
  CheckCircle,
  Edit2,
  Loader2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Plan {
  id: string
  slug: string
  name: string
  description: string | null
  monthlyPrice: number
  quarterlyPrice: number | null
  annualPrice: number | null
  leadCap: number | null
  isPublic: boolean
  isActive: boolean
  modules: string[]
  subscriberCount: number
  revenue: number
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit Modal State
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [monthlyPrice, setMonthlyPrice] = useState('')
  const [quarterlyPrice, setQuarterlyPrice] = useState('')
  const [annualPrice, setAnnualPrice] = useState('')
  const [leadCap, setLeadCap] = useState('')

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/plans')
      if (!res.ok) throw new Error('Failed to fetch plan catalog')
      const data = await res.json()
      setPlans(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error fetching plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleOpenEdit = (plan: Plan) => {
    setEditPlan(plan)
    setMonthlyPrice(plan.monthlyPrice.toString())
    setQuarterlyPrice(plan.quarterlyPrice ? plan.quarterlyPrice.toString() : '')
    setAnnualPrice(plan.annualPrice ? plan.annualPrice.toString() : '')
    setLeadCap(plan.leadCap ? plan.leadCap.toString() : '')
  }

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPlan) return

    try {
      const payload = {
        monthlyPrice: parseFloat(monthlyPrice),
        quarterlyPrice: quarterlyPrice ? parseFloat(quarterlyPrice) : null,
        annualPrice: annualPrice ? parseFloat(annualPrice) : null,
        leadCap: leadCap ? parseInt(leadCap) : null
      }

      const res = await fetch(`/api/admin/plans/${editPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to update plan prices')
      setEditPlan(null)
      alert('Plan updated successfully')
      await fetchPlans()
    } catch (err: any) {
      alert(err.message || 'Plan update failed')
    }
  }

  const handleToggleActive = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive })
      })

      if (!res.ok) throw new Error('Failed to toggle plan active status')
      await fetchPlans()
    } catch (err: any) {
      alert(err.message || 'Failed to update plan status')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

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
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Plan Catalog</h3>
        <p className="text-sm mt-2 text-slate-500">{error}</p>
        <Button onClick={fetchPlans} className="mt-4 bg-blue-600 text-white font-bold text-xs py-2 px-4 shadow-sm">
          Retry Loading
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6 select-none bg-slate-50 min-h-screen">
      {/* Edit Modal */}
      {editPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="p-6 max-w-md w-full bg-white space-y-4 shadow-2xl border-slate-200 animate-scale-in">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Edit Prices: {editPlan.name}</h3>
            
            <form onSubmit={handleSavePlan} className="space-y-4">
              {/* Monthly Price */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monthly Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Quarterly Price */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quarterly Price (₹ - Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={quarterlyPrice}
                  onChange={(e) => setQuarterlyPrice(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Annual Price */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Annual Price (₹ - Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={annualPrice}
                  onChange={(e) => setAnnualPrice(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Lead Cap */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lead Limit (Cap)</label>
                <input
                  type="number"
                  value={leadCap}
                  onChange={(e) => setLeadCap(e.target.value)}
                  placeholder="e.g. 1000 (Empty = Unlimited)"
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" onClick={() => setEditPlan(null)} className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold px-4 py-2 text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-4 py-2 text-xs">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans font-black">Subscription Plans</h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage pricing slabs, limits, and unlock profiles across plans catalog</p>
      </div>

      {/* Grid of 4 Plan Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-5 bg-white border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition min-h-[420px] relative">
            <div>
              {/* Header inside card */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight font-sans">{plan.name}</h3>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block mt-0.5">{plan.slug}</span>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => handleToggleActive(plan)}
                  className="p-1 text-slate-400 hover:text-slate-700 transition"
                  title={plan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                >
                  {plan.isActive ? (
                    <ToggleRight className="w-8 h-8 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-350" />
                  )}
                </button>
              </div>

              {/* Price Details */}
              <div className="mt-5 space-y-2 border-t border-b border-slate-100 py-4 font-semibold text-xs text-slate-650">
                <div className="flex justify-between">
                  <span>Monthly Price:</span>
                  <span className="text-slate-950 font-black">{formatCurrency(plan.monthlyPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quarterly Price:</span>
                  <span className="text-slate-950 font-black">{plan.quarterlyPrice ? formatCurrency(plan.quarterlyPrice) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Price:</span>
                  <span className="text-slate-950 font-black">{plan.annualPrice ? formatCurrency(plan.annualPrice) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lead Limit (Cap):</span>
                  <span className="text-slate-950 font-bold">{plan.leadCap || 'Unlimited'}</span>
                </div>
              </div>

              {/* Subscribers metrics */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[9px] font-bold text-slate-450 uppercase">Subscribers</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{plan.subscriberCount}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[9px] font-bold text-slate-450 uppercase">MRR Contribution</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">{formatCurrency(plan.revenue)}</div>
                </div>
              </div>

              {/* Modules list */}
              <div className="mt-5 space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Unlocked Modules ({plan.modules.length})</span>
                <div className="max-h-24 overflow-y-auto pr-1 space-y-1">
                  {plan.modules.map((mod, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-600 font-semibold leading-none">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="capitalize">{mod.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Edit button */}
            <div className="pt-5 border-t border-slate-100 mt-5">
              <Button
                onClick={() => handleOpenEdit(plan)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Prices
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  )
}
