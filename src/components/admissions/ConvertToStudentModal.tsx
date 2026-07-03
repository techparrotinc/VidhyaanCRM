"use client"

import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GRADE_OPTIONS, getGradeLabel } from '@/constants/grades'
import type { Applicant } from './shared'

type ConvertToStudentModalProps = {
  applicant: Applicant | null
  onClose: () => void
  onSuccess: (student: { id: string; studentCode?: string }) => void
}

export default function ConvertToStudentModal({
  applicant,
  onClose,
  onSuccess,
}: ConvertToStudentModalProps) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [grade, setGrade] = useState('')
  const [section, setSection] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (applicant) {
      setName(applicant.fullName || '')
      setDob('')
      setGrade(applicant.applyingFor || '')
      setSection('')
      setRollNumber('')
      setGuardianName(applicant.parentName || '')
      setError('')
    }
  }, [applicant])

  const handleConfirm = async () => {
    if (!applicant) return
    try {
      setIsSubmitting(true)
      setError('')
      const res = await fetch(
        '/api/v1/admissions/' + applicant.id + '/convert',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            dateOfBirth: dob || undefined,
            gradeLabel: grade,
            rollNumber: rollNumber || undefined,
            guardianName: guardianName || undefined
          })
        }
      )
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to convert to student record')
      }
      onSuccess(json.data)
    } catch (err: any) {
      console.error('Convert failed', err)
      setError(err.message || 'Failed to convert to student')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={applicant !== null}
      onOpenChange={(open) => { if (!open) onClose() }}
    >
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white text-left max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold font-sans text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Create Student Record
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500 mb-4 font-sans">
          This applicant has been admitted. Create their student profile.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {applicant && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block font-sans">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block font-sans">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block font-sans">Class / Grade</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Class/Grade</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
                {grade && !GRADE_OPTIONS.some(opt => opt.value === grade) && (
                  <option value={grade}>{getGradeLabel(grade)}</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block font-sans">Section (Optional)</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. A"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block font-sans">Roll Number (Optional)</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. 101"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block font-sans">Parent/Guardian Name</label>
              <input
                type="text"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Parent/Guardian Name"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6 select-none">
              <button
                disabled={isSubmitting}
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold cursor-pointer font-sans text-center transition"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirm}
                className={`flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold cursor-pointer font-sans text-center transition flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin size-4 mr-2" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Student Record →</span>
                )}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
