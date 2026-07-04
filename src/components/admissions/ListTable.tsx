"use client"

import React from 'react'
import { format } from 'date-fns'
import {
  Mail,
  MessageCircle,
  Phone,
  Pencil,
  MoreVertical,
  Check,
  X,
  ChevronDown,
  UserPlus,
} from 'lucide-react'
import { getGradeLabel } from '@/constants/grades'

type Stage = {
  id: string
  name: string
  color?: string
  isWon?: boolean
  isLost?: boolean
}

type StageColor = { bg: string; text: string }

type ListTableProps = {
  applicants: any[]
  placeholderCount: number
  stages: Stage[]
  counsellors: { id: string; name: string }[]
  selectedItems: string[]
  onSelectAll: () => void
  onSelectOne: (id: string) => void
  counsellorDropdownId: string | null
  onOpenCounsellorPicker: (admissionId: string) => void
  onCloseCounsellorPicker: () => void
  onAssignCounsellor: (admissionId: string, counsellorId: string | null) => Promise<void>
  onStageSelect: (admissionId: string, stageId: string) => void
  openMenuId: string | null
  onToggleRowMenu: (admissionId: string, position: { top: number; left: number }) => void
  getStageBorderColor: (stageName?: string) => string
  getAvatarColor: (name: string) => string
  getStageColor: (stageName?: string) => StageColor
  onOpen: (id: string) => void
  onPrefetch: (id: string) => void
}

function StageSelect({
  admission,
  stages,
  getStageColor,
  onStageSelect,
}: {
  admission: any
  stages: Stage[]
  getStageColor: (stageName?: string) => StageColor
  onStageSelect: (admissionId: string, stageId: string) => void
}) {
  const color = getStageColor(admission.stage?.name || admission.stage)
  return (
    <div className="relative">
      <select
        value={admission.stage?.id ?? ''}
        onChange={(e) => {
          e.stopPropagation()
          if (!e.target.value) return
          onStageSelect(admission.id, e.target.value)
        }}
        className="text-[11px] font-semibold pl-2 pr-6 py-1 rounded-full border-0 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-[#1565D8]/20"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {!admission.stage && (
          <option value="" disabled>
            — Select Stage —
          </option>
        )}
        {stages.map(stage => (
          <option key={stage.id} value={stage.id}>
            {stage.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
        size={10}
        style={{ color: color.text }}
      />
    </div>
  )
}

export default function ListTable({
  applicants,
  placeholderCount,
  stages,
  counsellors,
  selectedItems,
  onSelectAll,
  onSelectOne,
  counsellorDropdownId,
  onOpenCounsellorPicker,
  onCloseCounsellorPicker,
  onAssignCounsellor,
  onStageSelect,
  openMenuId,
  onToggleRowMenu,
  getStageBorderColor,
  getAvatarColor,
  getStageColor,
  onOpen,
  onPrefetch,
}: ListTableProps) {
  return (
    <>
      {/* Desktop/Tablet Table View */}
      <div className="hidden sm:block w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full min-w-[800px] border-collapse text-left">
          {/* TABLE HEADER */}
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 select-none">
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-10 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selectedItems.length === applicants.length && applicants.length > 0}
                  onChange={onSelectAll}
                  className="accent-[#1565D8] rounded focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 flex-1 min-w-[200px]">
                APPLICANT
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[120px] hidden sm:table-cell">
                GRADE
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[100px] hidden sm:table-cell">
                CONNECT
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[160px]">
                STAGE
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[160px] hidden md:table-cell">
                COUNSELLOR
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[80px] hidden lg:table-cell">
                DATE
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 w-[50px]">
                ACTION
              </th>
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody className="divide-y divide-slate-100">
            {applicants.map((admission: any) => {
              admission.applicantName = admission.fullName;
              admission.gradeSought = admission.applyingFor;
              admission.assignedTo = admission.counsellor ? { name: admission.counsellor } : null;

              return (
                <tr
                  key={admission.id}
                  className={`border-b border-slate-100 border-l-2 cursor-pointer hover:bg-slate-50/80 transition-colors duration-100 ${
                    getStageBorderColor(admission.stage?.name)
                  }`}
                  onMouseEnter={() => onPrefetch(admission.id)}
                  onClick={() => onOpen(admission.id)}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-2.5 w-10 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(admission.id)}
                      onChange={() => onSelectOne(admission.id)}
                      className="accent-[#1565D8] rounded focus:ring-0 cursor-pointer w-4 h-4 border-slate-300"
                    />
                  </td>

                  {/* APPLICANT */}
                  <td className="px-3 py-2.5 flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{
                          backgroundColor: getAvatarColor(admission.applicantName)
                        }}>
                        {admission.applicantName.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        {/* Name */}
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {admission.applicantName}
                        </p>
                        {/* Sub-info */}
                        <p className="text-xs text-slate-400 truncate">
                          {admission.admissionCode}
                          {admission.parentName && ` · ${admission.parentName}`}
                          {admission.phone && ` · ${admission.phone}`}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* GRADE */}
                  <td className="px-3 py-2.5 w-[120px] hidden sm:table-cell">
                    {admission.gradeSought ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                        {getGradeLabel(admission.gradeSought) || admission.gradeSought}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>

                  {/* CONNECT */}
                  <td className="px-3 py-2.5 w-[100px] hidden sm:table-cell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1">
                      <a href={`mailto:${admission.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          admission.email
                            ? 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                            : 'text-slate-200 pointer-events-none'
                        }`}>
                        <Mail size={13}/>
                      </a>

                      <a href={`https://wa.me/91${admission.phone}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          admission.phone
                            ? 'text-slate-400 hover:bg-green-50 hover:text-green-600'
                            : 'text-slate-200 pointer-events-none'
                        }`}>
                        <MessageCircle size={13}/>
                      </a>

                      <a href={`tel:${admission.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          admission.phone
                            ? 'text-slate-400 hover:bg-green-50 hover:text-green-600'
                            : 'text-slate-200 pointer-events-none'
                        }`}>
                        <Phone size={13}/>
                      </a>
                    </div>
                  </td>

                  {/* STAGE */}
                  <td className="px-3 py-2.5 w-[160px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StageSelect
                      admission={admission}
                      stages={stages}
                      getStageColor={getStageColor}
                      onStageSelect={onStageSelect}
                    />
                  </td>

                  {/* COUNSELLOR */}
                  <td className="px-3 py-2.5 w-[160px] hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      {admission.assignedTo?.name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                            {admission.assignedTo.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-medium text-slate-700 truncate max-w-[100px]">
                            {admission.assignedTo.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenCounsellorPicker(admission.id)
                            }}
                            className="text-slate-300 hover:text-slate-500 ml-auto"
                          >
                            <Pencil size={11}/>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenCounsellorPicker(admission.id)
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <UserPlus size={11}/>
                          Select
                        </button>
                      )}

                      {counsellorDropdownId === admission.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={(e) => {
                              e.stopPropagation()
                              onCloseCounsellorPicker()
                            }}
                          />
                          <div className="absolute top-full left-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 min-w-[180px]">
                            <div className="px-3 py-1.5 border-b border-slate-50 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Assign Counsellor
                              </span>
                            </div>
                            {counsellors.map((c: any) => (
                              <button
                                key={c.id}
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  await onAssignCounsellor(admission.id, c.id)
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 ${
                                  admission.counsellorId === c.id
                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                  {c.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                                </div>
                                <span className="flex-1 text-left">{c.name}</span>
                                {admission.counsellorId === c.id && (
                                  <Check size={13} className="text-blue-500" strokeWidth={2} />
                                )}
                              </button>
                            ))}
                            {admission.counsellorId && (
                              <div className="border-t border-slate-50 mt-1 pt-1">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    await onAssignCounsellor(admission.id, null)
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

                  {/* DATE */}
                  <td className="px-3 py-2.5 w-[80px] hidden lg:table-cell">
                    <span className="text-xs text-slate-500">
                      {admission.createdAt ? format(new Date(admission.createdAt), 'd MMM') : '—'}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="px-3 py-2.5 w-[50px]" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-start">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          onToggleRowMenu(admission.id, {
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
              );
            })}

            {/* Empty Row Placeholders to keep minimum 8 rows */}
            {placeholderCount > 0 &&
              Array.from({ length: placeholderCount }).map((_, i) => (
                <tr key={`empty-${i}`}
                  className="border-b border-slate-50 last:border-0 border-l-2 border-l-transparent">
                  <td className="px-3 py-3 w-10"/>
                  <td className="px-3 py-3 flex-1 min-w-[200px]"/>
                  <td className="px-3 py-3 w-[120px] hidden sm:table-cell"/>
                  <td className="px-3 py-3 w-[100px] hidden sm:table-cell"/>
                  <td className="px-3 py-3 w-[160px]"/>
                  <td className="px-3 py-3 w-[160px] hidden md:table-cell"/>
                  <td className="px-3 py-3 w-[80px] hidden lg:table-cell"/>
                  <td className="px-3 py-3 w-[50px]"/>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (visible on < 640px) */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {applicants.map((admission: any) => {
          admission.applicantName = admission.fullName;
          admission.gradeSought = admission.applyingFor;
          admission.assignedTo = admission.counsellor ? { name: admission.counsellor } : null;

          return (
            <div
              key={admission.id}
              onClick={() => onOpen(admission.id)}
              className={`p-4 cursor-pointer hover:bg-slate-50 border-l-4 ${
                getStageBorderColor(admission.stage?.name)
              }`}
            >
              {/* ROW 1: Avatar + Name + Stage inline dropdown */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      backgroundColor: getAvatarColor(admission.applicantName)
                    }}>
                    {admission.applicantName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-slate-800 truncate">
                    {admission.applicantName}
                  </span>
                </div>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <StageSelect
                    admission={admission}
                    stages={stages}
                    getStageColor={getStageColor}
                    onStageSelect={onStageSelect}
                  />
                </div>
              </div>

              {/* ROW 2: Code + Grade badge */}
              <div className="flex gap-2 mt-1.5 flex-wrap items-center">
                <span className="text-xs font-normal text-slate-400 font-mono">
                  {admission.admissionCode}
                </span>
                {admission.gradeSought ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                    {getGradeLabel(admission.gradeSought) || admission.gradeSought}
                  </span>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </div>

              {/* ROW 3: Counsellor + Date */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[13px] font-medium text-slate-700">
                  {admission.assignedTo?.name ? `Counsellor: ${admission.assignedTo.name}` : 'Unassigned'}
                </span>
                <span className="text-xs text-slate-500 font-sans">
                  {admission.createdAt ? format(new Date(admission.createdAt), 'd MMM') : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  )
}
