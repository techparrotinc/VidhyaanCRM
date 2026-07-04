"use client"

import React from 'react'
import Link from 'next/link'
import {
  Pencil,
  X,
  Check,
  Mail,
  MessageCircle,
  Phone,
  UserPlus,
  ChevronDown,
  MoreVertical,
} from 'lucide-react'
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'
import {
  institutionType,
  applyingForLabel,
  statusLabels,
  statusConfig,
  sourceConfig,
  courses,
  sources,
  leadRowBorderColor,
} from './leadConfig'

export interface EditLeadFormData {
  name?: string
  parentName?: string
  applyingFor?: string
  source?: string
  counsellor?: string | null
  status?: string
  followUpDate?: string
}

type LeadsTableProps = {
  leads: any[]
  mobileLeads: any[]
  selectedLeads: string[]
  onSelectAll: () => void
  onSelectLead: (id: string) => void
  editingLeadId: string | null
  editFormData: EditLeadFormData
  onEditFormChange: (data: EditLeadFormData) => void
  onCancelEdit: () => void
  onSaveEdit: (id: string) => void
  savedLeadId: string | null
  updatingLeadId: string | null
  counsellors: { id: string; name: string }[]
  statusDropdownId: string | null
  onSetStatusDropdownId: (id: string | null) => void
  counsellorDropdownId: string | null
  onSetCounsellorDropdownId: (id: string | null) => void
  onUpdateStatus: (id: string, status: string) => Promise<void>
  onAssignCounsellor: (id: string, counsellorId: string | null) => Promise<void>
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void
  openMenuId: string | null
  onToggleRowMenu: (id: string, position: { top: number; left: number }) => void
  onOpen: (id: string) => void
  onPrefetch: (id: string) => void
}

export default function LeadsTable(props: LeadsTableProps) {
  const {
    leads,
    mobileLeads,
    selectedLeads,
    onSelectAll,
    onSelectLead,
    editingLeadId,
    editFormData,
    onEditFormChange,
    onCancelEdit,
    onSaveEdit,
    savedLeadId,
    updatingLeadId,
    counsellors,
    statusDropdownId,
    onSetStatusDropdownId,
    counsellorDropdownId,
    onSetCounsellorDropdownId,
    onUpdateStatus,
    onAssignCounsellor,
    showToast,
    openMenuId,
    onToggleRowMenu,
    onOpen,
    onPrefetch,
  } = props

  return (
    <>
      {/* Desktop/Tablet Table View */}
      <div className="hidden sm:block w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full table-fixed min-w-[1100px] border-collapse text-left">
          {/* TABLE HEADER */}
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 select-none">
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-10 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selectedLeads.length === leads.length && leads.length > 0}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-slate-300 accent-[#1565D8] cursor-pointer"
                />
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[280px] min-w-[200px]">
                LEAD NAME
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[140px] min-w-[120px]">
                APPLYING FOR
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[100px] min-w-[90px] hidden sm:table-cell">
                SOURCE
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[100px] min-w-[90px] hidden sm:table-cell">
                CONNECT
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[160px] min-w-[140px] hidden md:table-cell">
                COUNSELLOR
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[80px] min-w-[70px] hidden lg:table-cell">
                DATE
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[140px] min-w-[120px]">
                STATUS
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[80px] min-w-[80px]">
                ACTION
              </th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead: any) => {
              const isChecked = selectedLeads.includes(lead.id)
              const isEditing = editingLeadId === lead.id
              const isSaved = savedLeadId === lead.id

              if (isEditing) {
                const todayStr = new Date().toISOString().split('T')[0]
                return (
                  <tr
                    key={lead.id}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-blue-50/40"
                  >
                    <td colSpan={9} className="px-4 py-4 border-b border-slate-200 border-l-4 border-l-[#1565D8] transition-all duration-200 shadow-sm">
                      {/* TOP ROW / EDIT HEADER */}
                      <div className="flex items-center gap-4 flex-wrap w-full">
                        <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Pencil size={10} strokeWidth={1.5} />
                          <span>Editing</span>
                        </div>

                        {/* Save / Cancel buttons */}
                        <div className="flex ml-auto items-center gap-2">
                          <button
                            onClick={onCancelEdit}
                            className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-650 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                          >
                            <X size={13} strokeWidth={1.5} />
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={() => onSaveEdit(lead.id)}
                            className="flex items-center gap-1.5 bg-[#1565D8] text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                          >
                            <Check size={13} strokeWidth={1.5} />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>

                      {/* FIELDS GRID */}
                      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 mt-3 w-full font-sans">
                        {/* 1. Lead Name */}
                        <div className="lg:col-span-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 md:hidden">Lead Name</span>
                          <input
                            type="text"
                            placeholder="Lead name"
                            value={editFormData.name || ''}
                            onChange={(e) => onEditFormChange({ ...editFormData, name: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 min-w-0"
                          />
                        </div>

                        {/* 2. Parent Name (school only) */}
                        {institutionType === 'school' && (
                          <div className="lg:col-span-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 md:hidden">Parent Name</span>
                            <input
                              type="text"
                              placeholder="Parent name"
                              value={editFormData.parentName || ''}
                              onChange={(e) => onEditFormChange({ ...editFormData, parentName: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 min-w-0"
                            />
                          </div>
                        )}

                        {/* 3. Applying For */}
                        <div className="lg:col-span-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 md:hidden">{applyingForLabel[institutionType as keyof typeof applyingForLabel]}</span>
                          <select
                            value={editFormData.applyingFor || ''}
                            onChange={(e) => onEditFormChange({ ...editFormData, applyingFor: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none cursor-pointer min-w-0"
                          >
                            <option value="">Select option</option>
                            {institutionType === 'school' ? (
                              GRADE_OPTIONS.map(g => (
                                <option key={g.value} value={g.value}>
                                  {g.label}
                                </option>
                              ))
                            ) : (
                              courses.map(opt => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* 4. Source */}
                        <div className="lg:col-span-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 md:hidden">Source</span>
                          <select
                            value={editFormData.source || ''}
                            onChange={(e) => onEditFormChange({ ...editFormData, source: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none cursor-pointer min-w-0"
                          >
                            <option value="">Select source</option>
                            {sources.map(src => (
                              <option key={src.id} value={src.id}>
                                • {src.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 5. Counsellor */}
                        <div className="lg:col-span-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 md:hidden">Counsellor</span>
                          <select
                            value={editFormData.counsellor || ''}
                            onChange={(e) => onEditFormChange({ ...editFormData, counsellor: e.target.value || '' })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none cursor-pointer min-w-0"
                          >
                            <option value="">Unassigned</option>
                            {counsellors.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 6. Status */}
                        <div className="lg:col-span-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 md:hidden">Status</span>
                          <select
                            value={editFormData.status || ''}
                            onChange={(e) => onEditFormChange({ ...editFormData, status: e.target.value })}
                            className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 appearance-none cursor-pointer min-w-0 border-l-4 ${
                              editFormData.status === 'NEW' ? 'border-l-blue-500' :
                              editFormData.status === 'CONTACTED' ? 'border-l-amber-500' :
                              editFormData.status === 'FOLLOW_UP_PENDING' ? 'border-l-orange-500' :
                              editFormData.status === 'CONVERTED' ? 'border-l-green-500' :
                              editFormData.status === 'NOT_INTERESTED' ? 'border-l-red-500' : 'border-l-slate-200'
                            }`}
                          >
                            {['NEW', 'CONTACTED', 'FOLLOW_UP_PENDING', 'CONVERTED', 'NOT_INTERESTED'].map(st => (
                              <option key={st} value={st}>
                                {statusLabels[st] || st}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 7. Follow-up Date */}
                        <div className="lg:col-span-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 md:hidden">Follow-up Date</span>
                          <input
                            type="date"
                            min={todayStr}
                            value={editFormData.followUpDate || ''}
                            onChange={(e) => onEditFormChange({ ...editFormData, followUpDate: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#1565D8] focus:ring-2 focus:ring-[#1565D8]/10 min-w-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              }

              return (
                <tr
                  key={lead.id}
                  className={`border-b border-slate-100 border-l-2 ${leadRowBorderColor(lead.status)} hover:bg-slate-50/80 transition-colors cursor-pointer bg-white ${isSaved ? 'bg-green-50/40' : ''}`}
                  onMouseEnter={() => onPrefetch(lead.id)}
                  onClick={() => {
                    if (editingLeadId) return
                    onOpen(lead.id)
                  }}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-2.5 text-left w-10 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        e.stopPropagation()
                        onSelectLead(lead.id)
                      }}
                      className="w-4 h-4 rounded border-slate-300 accent-[#1565D8] cursor-pointer"
                    />
                  </td>

                  {/* Lead Name */}
                  <td className="px-3 py-2.5 text-left w-[280px] min-w-[200px]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 font-sans">
                        {lead.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/lead-management/${lead.id}`}
                          className="text-sm font-semibold text-slate-800 hover:text-[#1565D8] hover:underline cursor-pointer truncate font-sans block"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onOpen(lead.id)
                          }}
                        >
                          {lead.name}
                        </Link>
                        <p className="text-xs font-normal text-slate-400 mt-0.5 truncate block font-sans">
                          <span className="font-mono font-semibold bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded mr-1.5">{lead.leadCode}</span>
                          <span>Parent: {lead.parentName}</span>
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Applying For */}
                  <td className="px-3 py-2.5 text-left w-[140px] min-w-[120px] text-xs text-slate-650 font-medium leading-tight">
                    {institutionType === 'school' ? (lead.applyingFor ? getGradeLabel(lead.applyingFor) : '—') : (lead.applyingFor || '—')}
                  </td>

                  {/* Source */}
                  <td className="px-3 py-2.5 text-left w-[100px] min-w-[90px] hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                    <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit font-sans ${sourceConfig[lead.source as keyof typeof sourceConfig]?.bg || 'bg-slate-100'} ${sourceConfig[lead.source as keyof typeof sourceConfig]?.text || 'text-slate-600'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${sourceConfig[lead.source as keyof typeof sourceConfig]?.dot || 'bg-slate-400'}`} />
                      <span>{lead.source}</span>
                    </div>
                  </td>

                  {/* Connect */}
                  <td className="px-3 py-2.5 text-left w-[100px] min-w-[90px] hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          showToast(`Email initiated for ${lead.name}`)
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Mail size={13} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          showToast(`WhatsApp opened for ${lead.name}`)
                          window.open(
                            `https://wa.me/91${lead.phone}`,
                            '_blank'
                          )
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 transition-colors hover:bg-green-50 hover:text-green-600"
                      >
                        <MessageCircle size={13} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          showToast(`Call initiated for ${lead.name}`)
                          window.open(`tel:${lead.phone}`)
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 transition-colors hover:bg-green-50 hover:text-green-600"
                      >
                        <Phone size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>

                  {/* Counsellor */}
                  <td className="px-3 py-2.5 text-left w-[160px] min-w-[140px] hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                    <div className="relative flex items-center min-w-0">
                      {lead.counsellor ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSetStatusDropdownId(null)
                            onSetCounsellorDropdownId(
                              counsellorDropdownId === lead.id ? null : lead.id
                            )
                          }}
                          className="flex items-center gap-2 hover:opacity-80 cursor-pointer group min-w-0"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {lead.counsellorAvatar || lead.counsellor.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <span
                            title={lead.counsellor}
                            className="text-[13px] font-medium text-slate-700 max-w-[100px] truncate block"
                          >
                            {lead.counsellor}
                          </span>
                          <Pencil size={11} className="text-slate-300 group-hover:text-slate-400 flex-shrink-0 ml-0.5" strokeWidth={1.5} />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSetStatusDropdownId(null)
                            onSetCounsellorDropdownId(
                              counsellorDropdownId === lead.id ? null : lead.id
                            )
                          }}
                          className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-100 cursor-pointer"
                        >
                          <UserPlus size={12} className="text-amber-600" strokeWidth={1.5} />
                          <span>Select</span>
                        </button>
                      )}

                      {counsellorDropdownId === lead.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSetCounsellorDropdownId(null)
                            }}
                          />
                          <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[180px]">
                            <div className="px-3 py-1.5 border-b border-slate-50 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Assign Counsellor
                              </span>
                            </div>
                            {counsellors.map((c) => (
                              <button
                                key={c.id}
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  await onAssignCounsellor(lead.id, c.id)
                                  onSetCounsellorDropdownId(null)
                                  showToast(`Assigned to ${c.name}`)
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                                  lead.counsellorId === c.id
                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                  {c.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                                </div>
                                <span className="flex-1 text-left">{c.name}</span>
                                {lead.counsellorId === c.id && (
                                  <Check size={13} className="text-blue-500" strokeWidth={2} />
                                )}
                              </button>
                            ))}
                            {lead.counsellorId && (
                              <div className="border-t border-slate-50 mt-1 pt-1">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    await onAssignCounsellor(lead.id, null)
                                    onSetCounsellorDropdownId(null)
                                    showToast('Counsellor removed')
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 cursor-pointer"
                                >
                                  <X size={13} className="text-red-400" strokeWidth={1.5} />
                                  Remove Assignment
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-3 py-2.5 text-left w-[80px] min-w-[70px] hidden lg:table-cell text-xs text-slate-500 font-medium font-sans truncate">
                    {lead.createdDate}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5 text-left w-[140px] min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                    <button
                      disabled={updatingLeadId === lead.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSetCounsellorDropdownId(null)
                        onSetStatusDropdownId(
                          statusDropdownId === lead.id ? null : lead.id
                        )
                      }}
                      className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-150 hover:opacity-80 hover:shadow-sm font-sans ${
                        statusConfig[lead.status as keyof typeof statusConfig]?.bg
                      } ${
                        statusConfig[lead.status as keyof typeof statusConfig]?.text
                      } ${
                        statusConfig[lead.status as keyof typeof statusConfig]?.border || 'border-transparent'
                      }`}
                    >
                      {updatingLeadId === lead.id ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConfig[lead.status as keyof typeof statusConfig]?.dot}`} />
                          {statusLabels[lead.status] || lead.status}
                          <ChevronDown size={10} className="ml-0.5 opacity-60" strokeWidth={2} />
                        </>
                      )}
                    </button>

                    {/* Status dropdown */}
                    {statusDropdownId === lead.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSetStatusDropdownId(null)
                          }}
                        />
                        <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[160px]">
                          {(['NEW', 'CONTACTED', 'FOLLOW_UP_PENDING', 'CONVERTED', 'NOT_INTERESTED'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={async (e) => {
                                e.stopPropagation()
                                await onUpdateStatus(lead.id, status)
                                onSetStatusDropdownId(null)
                                showToast(`Status updated to ${statusLabels[status]}`)
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                                lead.status === status
                                  ? `${statusConfig[status].bg} ${statusConfig[status].text} font-semibold`
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig[status].dot}`} />
                              {statusLabels[status]}
                              {lead.status === status && (
                                <Check size={13} className="ml-auto" strokeWidth={2} />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-3 py-2.5 text-left w-[80px] min-w-[80px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-start">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          onToggleRowMenu(lead.id, {
                            top: rect.bottom + 4,
                            left: rect.right - 160,
                          })
                        }}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {/* Empty Row Placeholders to keep minimum 8 rows */}
            {Math.max(0, 8 - leads.length) > 0 &&
              Array.from({ length: Math.max(0, 8 - leads.length) }).map((_, i) => (
                <tr
                  key={`placeholder-${i}`}
                  className="border-b border-slate-50 bg-white"
                >
                  <td className="px-3 py-2.5 text-left w-10 flex-shrink-0" />
                  <td className="px-3 py-2.5 text-left w-[280px] min-w-[200px]">
                    <div className="h-4" />
                  </td>
                  <td className="px-3 py-2.5 text-left w-[140px] min-w-[120px]" />
                  <td className="px-3 py-2.5 text-left w-[100px] min-w-[90px] hidden sm:table-cell" />
                  <td className="px-3 py-2.5 text-left w-[100px] min-w-[90px] hidden sm:table-cell" />
                  <td className="px-3 py-2.5 text-left w-[160px] min-w-[140px] hidden md:table-cell" />
                  <td className="px-3 py-2.5 text-left w-[80px] min-w-[70px] hidden lg:table-cell" />
                  <td className="px-3 py-2.5 text-left w-[140px] min-w-[120px]" />
                  <td className="px-3 py-2.5 text-left w-[80px] min-w-[80px]" />
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (visible on < 640px) */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {mobileLeads.map((lead: any) => (
          <div
            key={lead.id}
            onClick={() => onOpen(lead.id)}
            className={`p-4 cursor-pointer hover:bg-slate-50 border-l-4 ${leadRowBorderColor(lead.status)}`}
          >
            {/* ROW 1: Avatar + Name + Status badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 font-sans">
                  {lead.avatar}
                </div>
                <span className="text-sm font-semibold text-slate-800 truncate">
                  {lead.name}
                </span>
              </div>
              <div>
                <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConfig[lead.status as keyof typeof statusConfig]?.bg} ${statusConfig[lead.status as keyof typeof statusConfig]?.text}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[lead.status as keyof typeof statusConfig]?.dot}`} />
                  <span>{statusLabels[lead.status] || lead.status}</span>
                </div>
              </div>
            </div>

            {/* ROW 2: Code + Grade + Source */}
            <div className="flex gap-2 mt-1.5 flex-wrap items-center">
              <span className="text-xs font-normal text-slate-400 font-mono">
                {lead.leadCode}
              </span>
              <span className="text-xs font-normal text-slate-500">
                {institutionType === 'school' ? getGradeLabel(lead.applyingFor) : lead.applyingFor}
              </span>
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sourceConfig[lead.source as keyof typeof sourceConfig]?.bg || 'bg-slate-100'} ${sourceConfig[lead.source as keyof typeof sourceConfig]?.text || 'text-slate-600'}`}>
                <span>{lead.source}</span>
              </span>
            </div>

            {/* ROW 3: Counsellor + Date */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[13px] font-medium text-slate-700">
                {lead.counsellor ? `Counsellor: ${lead.counsellor}` : 'Unassigned'}
              </span>
              <span className="text-xs text-slate-500">
                {lead.createdDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
