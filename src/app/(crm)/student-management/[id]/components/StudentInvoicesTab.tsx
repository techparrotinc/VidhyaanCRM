'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { useAcademicYearStore } from '@/stores/academic-year.store'
import { KpiTile } from '@/components/fees/KpiTile'
import { InvoiceTable, type InvoiceRow } from '@/components/fees/InvoiceTable'
import { computeCollectionRate } from '@/lib/fees'

type SummaryResponse = {
  success: boolean
  data: {
    totalInvoices: number
    collected: number
    outstanding: number
    totalBilled: number
    overdueAmount: number
    scheduledAmount: number
    statusCounts: Record<string, number>
  }
}

type InvoicesResponse = {
  success: boolean
  data: InvoiceRow[]
  total: number
  totalPages: number
}

export default function StudentInvoicesTab({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const selectedYearId = useAcademicYearStore((s) => s.selectedYearId)
  const ayParam = selectedYearId ? `&academicYearId=${selectedYearId}` : ''

  const { data: summaryRes } = useSWR<SummaryResponse>(
    `/api/v1/fees/summary?studentId=${studentId}${ayParam}`,
    fetcher
  )
  const { data: invoicesRes, isLoading } = useSWR<InvoicesResponse>(
    `/api/v1/fees/invoices?studentId=${studentId}&page=${page}&limit=25${ayParam}`,
    fetcher
  )

  const summary = summaryRes?.data
  const invoices = invoicesRes?.data ?? []
  const total = invoicesRes?.total ?? 0
  const totalPages = invoicesRes?.totalPages ?? 1

  return (
    <div className="flex flex-col gap-6">

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile
            label="Total Billed"
            size="compact"
            value={`₹${(summary.totalBilled ?? 0).toLocaleString('en-IN')}`}
            subLabel={`${summary.totalInvoices} invoices`}
          />
          <KpiTile
            label="Collected"
            size="compact"
            value={`₹${summary.collected.toLocaleString('en-IN')}`}
            valueClassName="text-green-600"
            subLabel={`${computeCollectionRate(summary.collected, summary.totalBilled)}% collection rate`}
          />
          <KpiTile
            label="Outstanding"
            size="compact"
            value={`₹${summary.outstanding.toLocaleString('en-IN')}`}
            valueClassName="text-red-600"
          />
          <KpiTile
            label="Overdue"
            size="compact"
            value={`₹${(summary.overdueAmount ?? 0).toLocaleString('en-IN')}`}
            valueClassName="text-amber-600"
            subLabel={`${summary.statusCounts?.OVERDUE ?? 0} overdue invoices`}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <InvoiceTable
          invoices={invoices}
          isLoading={isLoading}
          hideStudentColumn
          onRowClick={inv => router.push(`/fee-management/${inv.id}`)}
        />

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500 flex-shrink-0">
            Showing {invoices.length === 0
              ? '0'
              : `${(page - 1) * 25 + 1}–${Math.min(page * 25, total)}`
            } of {total} invoices
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
              Previous
            </button>
            <span className="w-8 h-8 flex items-center justify-center bg-[#1565D8] text-white text-sm font-semibold rounded-lg">
              {page}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
