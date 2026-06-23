"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  GraduationCap,
  IndianRupee,
  Users,
  UserCheck,
  TrendingUp,
  ArrowRight,
  Loader2,
  Calendar,
  Layers,
  ArrowUpRight,
  Clock
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Stats {
  organizations: {
    total: number
    active: number
    trial: number
    suspended: number
    free: number
    paid: number
  }
  revenue: {
    mrr: number
    arr: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  platform: {
    totalLeads: number
    totalAdmissions: number
    totalStudents: number
    totalParents: number
    totalSchools: number
  }
}

interface RecentOrg {
  id: string
  name: string
  slug: string
  institutionType: string
  status: string
  createdAt: string
  plan: {
    name: string
    slug: string
  } | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrgs, setRecentOrgs] = useState<RecentOrg[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [statsRes, orgsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/organizations?limit=10')
      ])

      if (!statsRes.ok || !orgsRes.ok) {
        throw new Error('Failed to load super admin dashboard data')
      }

      const statsJson = await statsRes.json()
      const orgsJson = await orgsRes.json()

      setStats(statsJson.data)
      setRecentOrgs(orgsJson.data ?? [])
    } catch (err: any) {
      setError(err.message || 'An error occurred loading the dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800'
      case 'PENDING_VERIFICATION':
        return 'bg-amber-100 text-amber-800'
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#1565D8]" />
          <span className="text-sm font-semibold text-slate-500 font-sans">Loading admin dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-red-500 flex-col p-6">
        <p className="font-semibold text-base">{error}</p>
        <Button onClick={fetchData} className="mt-4 bg-[#1565D8] text-white">Retry</Button>
      </div>
    )
  }

  const kpis = [
    {
      title: 'Total Organizations',
      value: stats?.organizations.total ?? 0,
      icon: Building2,
      desc: `${stats?.organizations.active ?? 0} active, ${stats?.organizations.trial ?? 0} trial`,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: 'Active Schools',
      value: stats?.platform.totalSchools ?? 0,
      icon: GraduationCap,
      desc: `Marketplace listings`,
      color: 'text-green-600 bg-green-50'
    },
    {
      title: 'Monthly Revenue (MRR)',
      value: formatCurrency(stats?.revenue.mrr ?? 0),
      icon: IndianRupee,
      desc: `ARR: ${formatCurrency(stats?.revenue.arr ?? 0)}`,
      color: 'text-indigo-600 bg-indigo-50'
    },
    {
      title: 'Platform Leads',
      value: stats?.platform.totalLeads ?? 0,
      icon: TrendingUp,
      desc: `Total capture count`,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: 'Active Students',
      value: stats?.platform.totalStudents ?? 0,
      icon: UserCheck,
      desc: `Enrolled & promoting`,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      title: 'Parents Registered',
      value: stats?.platform.totalParents ?? 0,
      icon: Users,
      desc: `App user accounts`,
      color: 'text-pink-600 bg-pink-50'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-8 select-none font-sans antialiased text-slate-800 animate-fade-in">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 font-sans">
            Super Admin Control Center
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Global metrics, subscription billing cycles, and organization listings.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/orgs">
            <Button className="bg-[#1565D8] hover:bg-blue-700 text-white font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Manage Organizations
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <Card key={i} className="p-5 flex flex-col justify-between h-40 bg-white border-slate-200 hover:shadow-md hover:border-blue-200 transition duration-200 shadow-sm relative group cursor-pointer">
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl ${kpi.color} shrink-0`}>
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <ArrowUpRight className="text-slate-300 group-hover:text-blue-600 transition-colors w-4 h-4" />
              </div>
              <div className="mt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {kpi.title}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1 tracking-tight leading-none font-sans">
                  {kpi.value}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {kpi.desc}
                </p>
              </div>
            </Card>
          )
        })}
      </section>

      {/* Main Grid Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left 2 Columns: Recent Signups */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-full lg:col-span-2">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Recent Signups
              </h3>
              <Link href="/admin/orgs" className="text-xs font-bold text-[#1565D8] hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pl-2">Name</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Plan</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Created</th>
                    <th className="pb-3 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrgs.map((org) => (
                    <tr key={org.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 pl-2 font-medium text-slate-800">
                        <div>{org.name}</div>
                        <div className="text-xs text-slate-400 font-normal mt-0.5">{org.slug}</div>
                      </td>
                      <td className="py-3.5 text-xs text-slate-500 font-semibold uppercase">{org.institutionType}</td>
                      <td className="py-3.5">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {org.plan?.name ?? 'Free'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeStyle(org.status)}`}>
                          {org.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-slate-400 font-medium">
                        {new Date(org.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <Link href={`/admin/orgs/${org.id}`}>
                          <span className="text-xs font-bold text-[#1565D8] cursor-pointer hover:underline">
                            View details
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Summary */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-5">
              Revenue Breakdown
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-xs font-semibold text-slate-500">This Month Revenue</span>
                <span className="text-base font-bold text-slate-800">
                  {formatCurrency(stats?.revenue.thisMonth ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-xs font-semibold text-slate-500">Last Month Revenue</span>
                <span className="text-base font-bold text-slate-800">
                  {formatCurrency(stats?.revenue.lastMonth ?? 0)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-xs font-semibold text-slate-500">Month-over-Month Growth</span>
                <span className={`text-base font-bold flex items-center gap-1 ${
                  (stats?.revenue.growth ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'
                }`}>
                  {stats?.revenue.growth ?? 0}%
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 mt-6 pt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Accounts Summary</h4>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Paid Subscriptions:</span>
                <span className="font-bold text-slate-800">{stats?.organizations.paid ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Free Accounts:</span>
                <span className="font-bold text-slate-800">{stats?.organizations.free ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Suspended Accounts:</span>
                <span className="font-bold text-red-500">{stats?.organizations.suspended ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
