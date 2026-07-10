"use client"

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GRADE_RANGE_OPTIONS } from '@/constants/grades'
import { INSTITUTION_CONFIG, InstitutionType } from '@/constants/institutionConfig'

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1565D8]'
const labelCls = 'text-xs font-bold uppercase tracking-wider text-slate-500'

export type BasicValues = {
  name: string
  description: string
  schoolType: string
  establishedYear: string
  mediumOfInstruction: string
  totalStudents: string
  totalTeachers: string
  gradeFrom: string
  gradeTo: string
  gender: string
}

type BasicTabProps = {
  values: BasicValues
  institutionType: string
  onChange: (field: keyof BasicValues, value: string) => void
  onSave: (e: React.FormEvent) => void
  saving: boolean
}

export default function BasicTab({ values, institutionType, onChange, onSave, saving }: BasicTabProps) {
  const config = INSTITUTION_CONFIG[institutionType as InstitutionType]
  const schoolTypeOptions = config?.schoolTypeOptions ?? []
  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="border-b border-slate-100 pb-4 mb-4">
        <h3 className="text-base font-bold text-slate-800">Basic Information</h3>
        <p className="text-xs text-slate-400">Configure core public listing info for your school.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <label className={labelCls}>School Name</label>
          <input type="text" required value={values.name}
            onChange={(e) => onChange('name', e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1.5 col-span-2">
          <div className="flex items-center justify-between">
            <label className={labelCls}>Description</label>
            <span className={`text-[10px] font-bold ${values.description.length >= 100 ? 'text-emerald-600' : 'text-amber-500'}`}>
              {values.description.length} chars (Min 100 for completeness)
            </span>
          </div>
          <textarea rows={4} required value={values.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Enter a compelling description about your institution's history, values, and academic achievements..."
            className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Institution Type</label>
          <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 font-semibold cursor-not-allowed">
            {institutionType.replace('_', ' ')}
          </div>
        </div>

        {schoolTypeOptions.length > 0 && (
          <div className="space-y-1.5">
            <label className={labelCls}>School Type</label>
            <select value={values.schoolType || ''} onChange={(e) => onChange('schoolType', e.target.value)} className={inputCls}>
              <option value="">Select type…</option>
              {schoolTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className={labelCls}>Established Year</label>
          <input type="number" value={values.establishedYear}
            onChange={(e) => onChange('establishedYear', e.target.value)} placeholder="e.g. 1995" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Medium of Instruction</label>
          <input type="text" value={values.mediumOfInstruction}
            onChange={(e) => onChange('mediumOfInstruction', e.target.value)} placeholder="e.g. English, Hindi" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Total Students</label>
          <input type="number" value={values.totalStudents}
            onChange={(e) => onChange('totalStudents', e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Total Teachers</label>
          <input type="number" value={values.totalTeachers}
            onChange={(e) => onChange('totalTeachers', e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Grade Offered From</label>
          <select value={values.gradeFrom || ''} onChange={(e) => onChange('gradeFrom', e.target.value)} className={inputCls}>
            <option value="">Select grade…</option>
            {GRADE_RANGE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Grade Offered To</label>
          <select value={values.gradeTo || ''} onChange={(e) => onChange('gradeTo', e.target.value)} className={inputCls}>
            <option value="">Select grade…</option>
            {GRADE_RANGE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Gender Type Allowed</label>
          <select value={values.gender || ''} onChange={(e) => onChange('gender', e.target.value)} className={inputCls}>
            <option value="BOYS">Boys Only</option>
            <option value="GIRLS">Girls Only</option>
            <option value="CO_ED">Co-Educational</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button type="submit" disabled={saving}
          className={`bg-[#1565D8] hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {saving ? (
            <>
              <Loader2 className="animate-spin size-4 mr-2" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Basic Info</span>
          )}
        </Button>
      </div>
    </form>
  )
}
