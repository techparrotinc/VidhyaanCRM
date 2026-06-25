"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  Loader2,
  MoreVertical,
  Copy,
  Download,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface LeadRecord {
  id: string
  leadCode: string
  parentName?: string
  studentName?: string
  status?: string
  priority?: string
}

interface LeadPageHeaderProps {
  mode: 'view' | 'edit' | 'add'
  lead?: LeadRecord
  isSubmitting?: boolean
  onSave?: () => void
  onCancel?: () => void
  onDeleteSuccess?: () => void
  showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void
}

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Low Priority',
  MEDIUM: 'Medium Priority',
  HIGH: 'High Priority',
  URGENT: 'Urgent Priority'
}

const statusLabels: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  FOLLOW_UP_PENDING: 'Follow-up',
  CONVERTED: 'Converted',
  NOT_INTERESTED: 'Rejected'
}

const statusBgColor: Record<string, string> = {
  NEW: 'bg-slate-100 text-slate-700 border-slate-200',
  CONTACTED: 'bg-blue-50 text-blue-700 border-blue-200',
  INTERESTED: 'bg-purple-50 text-purple-700 border-purple-200',
  FOLLOW_UP_PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONVERTED: 'bg-green-50 text-green-700 border-green-200 cursor-default',
  NOT_INTERESTED: 'bg-red-50 text-red-700 border-red-200',
}

export default function LeadPageHeader({
  mode,
  lead,
  isSubmitting,
  onSave,
  onCancel,
  onDeleteSuccess,
  showToast
}: LeadPageHeaderProps) {
  const router = useRouter()

  const handleCopyCode = () => {
    if (lead?.leadCode) {
      navigator.clipboard.writeText(lead.leadCode)
      if (showToast) {
        showToast("Lead ID copied", "success")
      }
    }
  }

  const handleExport = () => {
    if (showToast) {
      showToast("Lead exported", "success")
    }
  }

  const handleDelete = async () => {
    if (!lead?.id) return
    if (!confirm('Are you sure you want to delete this lead?')) return
    try {
      const res = await fetch(`/api/v1/leads/${lead.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete lead')
      if (showToast) {
        showToast("Lead deleted", "info")
      }
      if (onDeleteSuccess) {
        onDeleteSuccess()
      } else {
        router.push('/lead-management')
      }
    } catch (err: any) {
      console.error(err)
      if (showToast) {
        showToast(err.message || "Failed to delete lead", "error")
      }
    }
  }

  if (mode === 'add') {
    return (
      <div className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] h-[56px] px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onCancel) onCancel()
              else router.push('/lead-management')
            }}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition shrink-0"
          >
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          <span className="text-sm font-semibold text-slate-800">New Lead</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (onCancel) onCancel()
              else router.push('/lead-management')
            }}
            className="border border-slate-200 bg-white text-slate-600 text-xs font-semibold h-8 px-4 rounded-lg hover:bg-slate-50 transition flex items-center justify-center cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className="bg-[#1565D8] text-white text-xs font-semibold h-8 px-4 rounded-lg flex items-center gap-1.5 hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin size-3 mr-1" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Save Lead</span>
            )}
          </button>
        </div>
      </div>
    )
  }

  const displayName = lead?.parentName || lead?.studentName || ''

  if (mode === 'edit') {
    return (
      <div className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] h-[56px] px-5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (onCancel) onCancel()
              else router.back()
            }}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition shrink-0"
          >
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          <div className="w-px h-5 bg-slate-200 shrink-0" />
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-md flex-shrink-0">
            {lead?.leadCode}
          </span>
          <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
          <span className="text-sm font-semibold text-slate-800 truncate max-w-[180px] block" title={displayName}>
            {displayName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (onCancel) onCancel()
              else router.back()
            }}
            className="border border-slate-200 bg-white text-slate-600 text-xs font-semibold h-8 px-4 rounded-lg hover:bg-slate-50 transition flex items-center justify-center cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className="bg-[#1565D8] text-white text-xs font-semibold h-8 px-4 rounded-lg flex items-center gap-1.5 hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin size-3 mr-1" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={13} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // View Mode
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] h-[56px] px-5 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition shrink-0"
        >
          <ChevronLeft size={16} className="text-slate-600" />
        </button>
        <div className="w-px h-5 bg-slate-200 shrink-0" />
        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-md flex-shrink-0">
          {lead?.leadCode}
        </span>
        <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
        <span className="text-sm font-semibold text-slate-800 truncate max-w-[180px] block" title={displayName}>
          {displayName}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {lead?.status && (
          <span className={`h-7 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 border border-transparent select-none hidden md:flex ${
            statusBgColor[lead.status] || 'bg-slate-100 text-slate-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              lead.status === 'NEW'
                ? 'bg-slate-500'
                : lead.status === 'CONTACTED'
                ? 'bg-blue-500'
                : lead.status === 'INTERESTED'
                ? 'bg-purple-500'
                : lead.status === 'FOLLOW_UP_PENDING'
                ? 'bg-amber-500'
                : lead.status === 'CONVERTED'
                ? 'bg-green-500'
                : 'bg-red-500'
            }`} />
            {statusLabels[lead.status] || lead.status}
          </span>
        )}

        {lead?.priority && (
          <span
            className={`h-7 px-3 rounded-full text-xs font-semibold flex items-center justify-center border border-transparent whitespace-nowrap flex-shrink-0 hidden md:flex ${
              priorityColors[lead.priority] || 'bg-slate-100 text-slate-600'
            }`}
          >
            {priorityLabels[lead.priority] || lead.priority}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => router.push(`/lead-management/${lead?.id}/edit`)}
          className="h-8 px-4 text-sm font-semibold bg-[#1565D8] text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Pencil size={13} />
          <span>Edit Lead</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition text-slate-500 cursor-pointer">
              <MoreVertical size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[9999] w-52 rounded-xl border border-slate-200 shadow-lg p-1.5 bg-white">
            <DropdownMenuItem
              onClick={handleCopyCode}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer text-left w-full justify-start"
            >
              <Copy size={14} className="text-slate-400" />
              Copy Lead Code
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleExport}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer text-left w-full justify-start"
            >
              <Download size={14} className="text-slate-400" />
              Export Lead
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 cursor-pointer text-left w-full justify-start"
            >
              <Trash2 size={14} className="text-red-400" />
              Delete Lead
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
