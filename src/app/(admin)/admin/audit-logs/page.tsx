"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  History,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Info,
  Calendar,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppSelect } from '@/components/ui/app-select'
import { DatePicker } from '@/components/ui/datetime-picker'

interface AuditLog {
  id: string
  orgId: string | null
  orgName: string | null
  userId: string | null
  userName: string | null
  action: string
  entityType: string
  entityId: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  metadata: {
    before: any
    after: any
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Pagination
  const [actionFilter, setActionFilter] = useState('ALL')
  const [searchOrg, setSearchOrg] = useState('')
  const [searchUser, setSearchUser] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  // Modal details
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())

      if (actionFilter !== 'ALL') {
        queryParams.append('action', actionFilter)
      }
      if (dateFrom) {
        queryParams.append('dateFrom', new Date(dateFrom).toISOString())
      }
      if (dateTo) {
        queryParams.append('dateTo', new Date(dateTo).toISOString())
      }

      // Note: orgId and userId filters can be fetched dynamically or searched in memory.
      // Since the API takes exact orgId/userId, we can fetch all matching results or filter them.
      // We will perform local filtering on userName/orgName if search query is entered, or fetch them directly.
      const res = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      const json = await res.json()
      
      let fetchedLogs: AuditLog[] = json.data ?? []
      
      // Perform local search for user or org name
      if (searchOrg.trim()) {
        fetchedLogs = fetchedLogs.filter(l => 
          l.orgName?.toLowerCase().includes(searchOrg.toLowerCase())
        )
      }
      if (searchUser.trim()) {
        fetchedLogs = fetchedLogs.filter(l => 
          l.userName?.toLowerCase().includes(searchUser.toLowerCase())
        )
      }

      setLogs(fetchedLogs)
      setTotal(json.pagination?.total ?? 0)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error fetching audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [actionFilter, dateFrom, dateTo, page])

  // Debounce search inputs
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1)
      fetchLogs()
    }, 450)

    return () => clearTimeout(delayDebounceFn)
  }, [searchOrg, searchUser])

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'UPDATE':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'DELETE':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'MODULE_TOGGLE':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'IMPERSONATION_START':
        return 'bg-amber-50 text-amber-700 border-amber-250 font-black'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 select-none bg-slate-50 min-h-screen">
      {/* Detail JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <Card className="p-6 max-w-2xl w-full bg-white space-y-4 shadow-2xl border-slate-200 animate-scale-in">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Info className="w-4.5 h-4.5 text-blue-600" /> Audit Log Metadata
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-450 hover:text-slate-700 p-1 bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto text-xs font-mono bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 leading-relaxed scrollbar-thin">
              <div>
                <span className="text-slate-500 font-bold block mb-1">{"// ACTION GENERAL DETAILS"}</span>
                <p>Log ID: {selectedLog.id}</p>
                <p>Action: {selectedLog.action}</p>
                <p>Timestamp: {new Date(selectedLog.createdAt).toLocaleString()}</p>
                <p>IP Address: {selectedLog.ipAddress || 'Unknown'}</p>
                <p>User Agent: {selectedLog.userAgent || 'Unknown'}</p>
              </div>

              {selectedLog.metadata && (
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-slate-500 font-bold block mb-2">{"// PAYLOAD METADATA DIFF"}</span>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedLog(null)} className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-4 py-2 text-xs shadow-xs">
                Dismiss
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Audit Logs</h2>
        <p className="text-xs text-slate-400 mt-0.5">Append-only security audit trail of all platform level administrative actions</p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Org Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Organization..."
              value={searchOrg}
              onChange={(e) => setSearchOrg(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-4 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
            />
          </div>

          {/* User Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search User..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-1.5 pl-9 pr-4 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <AppSelect
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="w-full appearance-none bg-white rounded-lg border border-slate-200 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="MODULE_TOGGLE">Module Toggle</option>
              <option value="IMPERSONATION_START">Impersonation Start</option>
              <option value="PIN_SET">PIN Set</option>
              <option value="PIN_RESET">PIN Reset</option>
            </AppSelect>
            <ChevronDown className="absolute right-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Date From */}
          <div className="relative">
            <DatePicker value={dateFrom} onChange={(ymd) => { setDateFrom(ymd); setPage(1); }} placeholder="From" />
          </div>

          {/* Date To */}
          <div className="relative">
            <DatePicker value={dateTo} onChange={(ymd) => { setDateTo(ymd); setPage(1); }} placeholder="To" />
          </div>
        </div>

        {/* Clear Filters */}
        {(searchOrg || searchUser || actionFilter !== 'ALL' || dateFrom || dateTo) && (
          <div className="flex justify-end pt-1">
            <Button
              onClick={() => { setSearchOrg(''); setSearchUser(''); setActionFilter('ALL'); setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Logs Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center p-6 text-center bg-white border border-slate-200 rounded-xl shadow-sm text-red-500">
          <XCircle className="w-8 h-8 mb-2" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col h-64 items-center justify-center text-center p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <History className="w-10 h-10 text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700">No Audit Logs Found</h4>
          <p className="text-xs text-slate-400 mt-1">No actions match your filters.</p>
        </div>
      ) : (
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition">
                    {/* Timestamp */}
                    <td className="py-3.5 px-6 text-xs text-slate-450 font-bold">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    {/* Org Name */}
                    <td className="py-3.5 px-4">
                      {log.orgId ? (
                        <Link href={`/admin/orgs/${log.orgId}`} className="font-bold text-slate-900 hover:text-blue-600 hover:underline">
                          {log.orgName || 'View Org'}
                        </Link>
                      ) : (
                        <span className="text-slate-400 font-semibold text-xs">Platform Global</span>
                      )}
                    </td>

                    {/* User Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-800 text-xs">
                      {log.userName || 'System'}
                    </td>

                    {/* Action Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${getActionBadgeColor(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Details Link */}
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        [View]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-400">Showing {logs.length} entries</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={logs.length < limit}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
